import { Router } from "express";
import { db } from "@workspace/db";
import {
  feedPostsTable,
  feedLikesTable,
  feedCommentsTable,
  feedReactionsTable,
  usersTable,
  notificationsTable,
} from "@workspace/db";
import { eq, desc, asc, count, and, ne } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

async function enrichPost(post: {
  id: number;
  userId: number;
  content: string;
  isStream: boolean;
  streamUrl: string | null;
  streamTitle: string | null;
  createdAt: Date;
  username: string;
  avatarUrl: string | null;
  favoriteTeam: string | null;
  xp: number;
}, currentUserId: number) {
  const [{ likeCount }] = await db
    .select({ likeCount: count() })
    .from(feedLikesTable)
    .where(eq(feedLikesTable.postId, post.id));

  const [{ commentCount }] = await db
    .select({ commentCount: count() })
    .from(feedCommentsTable)
    .where(eq(feedCommentsTable.postId, post.id));

  const userLike = await db
    .select()
    .from(feedLikesTable)
    .where(and(eq(feedLikesTable.postId, post.id), eq(feedLikesTable.userId, currentUserId)))
    .limit(1);

  const allReactions = await db
    .select({ emoji: feedReactionsTable.emoji, userId: feedReactionsTable.userId })
    .from(feedReactionsTable)
    .where(eq(feedReactionsTable.postId, post.id));

  const reactionMap: Record<string, { count: number; reactedByMe: boolean }> = {};
  for (const r of allReactions) {
    if (!reactionMap[r.emoji]) reactionMap[r.emoji] = { count: 0, reactedByMe: false };
    reactionMap[r.emoji].count++;
    if (r.userId === currentUserId) reactionMap[r.emoji].reactedByMe = true;
  }

  return {
    id: post.id,
    userId: post.userId,
    content: post.content,
    isStream: post.isStream,
    streamUrl: post.streamUrl,
    streamTitle: post.streamTitle,
    createdAt: post.createdAt.toISOString(),
    username: post.username,
    avatarUrl: post.avatarUrl,
    favoriteTeam: post.favoriteTeam,
    xp: post.xp,
    likeCount: Number(likeCount),
    commentCount: Number(commentCount),
    likedByMe: userLike.length > 0,
    reactions: reactionMap,
  };
}

router.get("/feed", async (req, res) => {
  const posts = await db
    .select({
      id: feedPostsTable.id,
      userId: feedPostsTable.userId,
      content: feedPostsTable.content,
      isStream: feedPostsTable.isStream,
      streamUrl: feedPostsTable.streamUrl,
      streamTitle: feedPostsTable.streamTitle,
      createdAt: feedPostsTable.createdAt,
      username: usersTable.username,
      avatarUrl: usersTable.avatarUrl,
      favoriteTeam: usersTable.favoriteTeam,
      xp: usersTable.xp,
    })
    .from(feedPostsTable)
    .innerJoin(usersTable, eq(feedPostsTable.userId, usersTable.id))
    .orderBy(desc(feedPostsTable.createdAt))
    .limit(100);

  const result = await Promise.all(posts.map((p) => enrichPost(p, req.userId)));
  res.json(result);
});

router.post("/feed", async (req, res) => {
  const { content, isStream, streamUrl, streamTitle } = req.body as {
    content: string;
    isStream?: boolean;
    streamUrl?: string;
    streamTitle?: string;
  };

  if (!content || content.trim().length === 0) {
    res.status(400).json({ error: "Content is required" });
    return;
  }
  if (content.length > 500) {
    res.status(400).json({ error: "Content must be 500 characters or less" });
    return;
  }

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));
  if (isStream && !me?.isAdmin) {
    res.status(403).json({ error: "Only admins can post live streams" });
    return;
  }

  const [post] = await db
    .insert(feedPostsTable)
    .values({
      userId: req.userId,
      content: content.trim(),
      isStream: isStream ?? false,
      streamUrl: isStream ? (streamUrl ?? null) : null,
      streamTitle: isStream ? (streamTitle ?? null) : null,
    })
    .returning();

  if (isStream) {
    const allUsers = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(ne(usersTable.id, req.userId));

    if (allUsers.length > 0) {
      await db.insert(notificationsTable).values(
        allUsers.map((u) => ({
          userId: u.id,
          type: "stream_live" as const,
          title: "🔴 Live Stream Started!",
          body: `${me?.username ?? "Admin"} is streaming: ${streamTitle ?? content.trim().slice(0, 60)}`,
          matchId: null,
        })),
      );
    }
  }

  const enriched = await enrichPost(
    {
      ...post,
      username: me?.username ?? "unknown",
      avatarUrl: me?.avatarUrl ?? null,
      favoriteTeam: me?.favoriteTeam ?? null,
      xp: me?.xp ?? 0,
    },
    req.userId,
  );

  res.status(201).json(enriched);
});

router.post("/feed/:postId/like", async (req, res) => {
  const postId = parseInt(req.params.postId);
  const existing = await db
    .select()
    .from(feedLikesTable)
    .where(and(eq(feedLikesTable.postId, postId), eq(feedLikesTable.userId, req.userId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(feedLikesTable)
      .where(and(eq(feedLikesTable.postId, postId), eq(feedLikesTable.userId, req.userId)));
    res.json({ liked: false });
  } else {
    await db.insert(feedLikesTable).values({ postId, userId: req.userId });
    res.json({ liked: true });
  }
});

router.post("/feed/:postId/react", async (req, res) => {
  const postId = parseInt(req.params.postId);
  const { emoji } = req.body as { emoji: string };

  if (!emoji) {
    res.status(400).json({ error: "emoji required" });
    return;
  }

  const existing = await db
    .select()
    .from(feedReactionsTable)
    .where(
      and(
        eq(feedReactionsTable.postId, postId),
        eq(feedReactionsTable.userId, req.userId),
        eq(feedReactionsTable.emoji, emoji),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(feedReactionsTable)
      .where(
        and(
          eq(feedReactionsTable.postId, postId),
          eq(feedReactionsTable.userId, req.userId),
          eq(feedReactionsTable.emoji, emoji),
        ),
      );
    res.json({ reacted: false, emoji });
  } else {
    await db.insert(feedReactionsTable).values({ postId, userId: req.userId, emoji });
    res.json({ reacted: true, emoji });
  }
});

router.get("/feed/:postId/comments", async (req, res) => {
  const postId = parseInt(req.params.postId);
  const comments = await db
    .select({
      id: feedCommentsTable.id,
      postId: feedCommentsTable.postId,
      userId: feedCommentsTable.userId,
      content: feedCommentsTable.content,
      createdAt: feedCommentsTable.createdAt,
      username: usersTable.username,
      avatarUrl: usersTable.avatarUrl,
      xp: usersTable.xp,
    })
    .from(feedCommentsTable)
    .innerJoin(usersTable, eq(feedCommentsTable.userId, usersTable.id))
    .where(eq(feedCommentsTable.postId, postId))
    .orderBy(asc(feedCommentsTable.createdAt));

  res.json(
    comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      userId: c.userId,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      username: c.username,
      avatarUrl: c.avatarUrl,
      xp: c.xp,
    })),
  );
});

router.post("/feed/:postId/comments", async (req, res) => {
  const postId = parseInt(req.params.postId);
  const { content } = req.body as { content: string };

  if (!content || content.trim().length === 0) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  const [comment] = await db
    .insert(feedCommentsTable)
    .values({ postId, userId: req.userId, content: content.trim() })
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));

  res.status(201).json({
    id: comment.id,
    postId: comment.postId,
    userId: comment.userId,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    username: user.username,
    avatarUrl: user.avatarUrl,
    xp: user.xp,
  });
});

router.delete("/feed/:postId/comments/:commentId", async (req, res) => {
  const commentId = parseInt(req.params.commentId);
  const [comment] = await db
    .select()
    .from(feedCommentsTable)
    .where(eq(feedCommentsTable.id, commentId))
    .limit(1);

  if (!comment || comment.userId !== req.userId) {
    res.status(403).json({ error: "Not your comment" });
    return;
  }

  await db.delete(feedCommentsTable).where(eq(feedCommentsTable.id, commentId));
  res.json({ success: true });
});

router.delete("/feed/:postId", async (req, res) => {
  const postId = parseInt(req.params.postId);
  const [post] = await db
    .select()
    .from(feedPostsTable)
    .where(eq(feedPostsTable.id, postId))
    .limit(1);

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));
  if (post.userId !== req.userId && !me?.isAdmin) {
    res.status(403).json({ error: "Not your post" });
    return;
  }

  await db.delete(feedReactionsTable).where(eq(feedReactionsTable.postId, postId));
  await db.delete(feedCommentsTable).where(eq(feedCommentsTable.postId, postId));
  await db.delete(feedLikesTable).where(eq(feedLikesTable.postId, postId));
  await db.delete(feedPostsTable).where(eq(feedPostsTable.id, postId));
  res.json({ success: true });
});

export default router;
