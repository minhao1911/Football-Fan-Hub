import { Router } from "express";
import { db } from "@workspace/db";
import { feedPostsTable, feedLikesTable, feedCommentsTable, usersTable } from "@workspace/db";
import { eq, desc, asc, count, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/feed", async (req, res) => {
  const posts = await db
    .select({
      id: feedPostsTable.id,
      userId: feedPostsTable.userId,
      content: feedPostsTable.content,
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

  const result = await Promise.all(
    posts.map(async (post) => {
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
        .where(and(eq(feedLikesTable.postId, post.id), eq(feedLikesTable.userId, req.userId)))
        .limit(1);

      return {
        id: post.id,
        userId: post.userId,
        content: post.content,
        createdAt: post.createdAt.toISOString(),
        username: post.username,
        avatarUrl: post.avatarUrl,
        favoriteTeam: post.favoriteTeam,
        xp: post.xp,
        likeCount: Number(likeCount),
        commentCount: Number(commentCount),
        likedByMe: userLike.length > 0,
      };
    }),
  );

  res.json(result);
});

router.post("/feed", async (req, res) => {
  const { content } = req.body as { content: string };

  if (!content || content.trim().length === 0) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  if (content.length > 500) {
    res.status(400).json({ error: "Content must be 500 characters or less" });
    return;
  }

  const [post] = await db
    .insert(feedPostsTable)
    .values({ userId: req.userId, content: content.trim() })
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));

  res.status(201).json({
    id: post.id,
    userId: post.userId,
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    username: user.username,
    avatarUrl: user.avatarUrl,
    favoriteTeam: user.favoriteTeam,
    xp: user.xp,
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
  });
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

  if (!comment) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }

  if (comment.userId !== req.userId) {
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

  if (post.userId !== req.userId) {
    res.status(403).json({ error: "Not your post" });
    return;
  }

  await db.delete(feedCommentsTable).where(eq(feedCommentsTable.postId, postId));
  await db.delete(feedLikesTable).where(eq(feedLikesTable.postId, postId));
  await db.delete(feedPostsTable).where(eq(feedPostsTable.id, postId));
  res.json({ success: true });
});

export default router;
