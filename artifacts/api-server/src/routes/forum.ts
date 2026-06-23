import { Router } from "express";
import { db } from "@workspace/db";
import { forumPostsTable, forumRepliesTable, matchesTable, usersTable } from "@workspace/db";
import { eq, count, asc, desc } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/matches/:matchId/forum", async (req, res) => {
  const matchId = parseInt(req.params.matchId);

  const posts = await db
    .select({
      id: forumPostsTable.id,
      matchId: forumPostsTable.matchId,
      userId: forumPostsTable.userId,
      title: forumPostsTable.title,
      content: forumPostsTable.content,
      createdAt: forumPostsTable.createdAt,
      username: usersTable.username,
      avatarUrl: usersTable.avatarUrl,
    })
    .from(forumPostsTable)
    .innerJoin(usersTable, eq(forumPostsTable.userId, usersTable.id))
    .where(eq(forumPostsTable.matchId, matchId))
    .orderBy(desc(forumPostsTable.createdAt));

  const result = await Promise.all(
    posts.map(async (post) => {
      const [{ replyCount }] = await db
        .select({ replyCount: count() })
        .from(forumRepliesTable)
        .where(eq(forumRepliesTable.postId, post.id));
      return {
        id: post.id,
        matchId: post.matchId,
        userId: post.userId,
        username: post.username,
        avatarUrl: post.avatarUrl,
        title: post.title,
        content: post.content,
        replyCount: Number(replyCount),
        createdAt: post.createdAt.toISOString(),
      };
    }),
  );

  res.json(result);
});

router.post("/matches/:matchId/forum", async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const { title, content } = req.body as { title: string; content: string };

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const [post] = await db.insert(forumPostsTable).values({ matchId, userId: req.userId, title, content }).returning();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));

  res.status(201).json({
    id: post.id,
    matchId: post.matchId,
    userId: post.userId,
    username: user.username,
    avatarUrl: user.avatarUrl,
    title: post.title,
    content: post.content,
    replyCount: 0,
    createdAt: post.createdAt.toISOString(),
  });
});

router.get("/matches/:matchId/forum/:postId/replies", async (req, res) => {
  const postId = parseInt(req.params.postId);

  const replies = await db
    .select({
      id: forumRepliesTable.id,
      postId: forumRepliesTable.postId,
      userId: forumRepliesTable.userId,
      content: forumRepliesTable.content,
      createdAt: forumRepliesTable.createdAt,
      username: usersTable.username,
      avatarUrl: usersTable.avatarUrl,
    })
    .from(forumRepliesTable)
    .innerJoin(usersTable, eq(forumRepliesTable.userId, usersTable.id))
    .where(eq(forumRepliesTable.postId, postId))
    .orderBy(asc(forumRepliesTable.createdAt));

  res.json(
    replies.map((r) => ({
      id: r.id,
      postId: r.postId,
      userId: r.userId,
      username: r.username,
      avatarUrl: r.avatarUrl,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.post("/matches/:matchId/forum/:postId/replies", async (req, res) => {
  const postId = parseInt(req.params.postId);
  const { content } = req.body as { content: string };

  const [reply] = await db.insert(forumRepliesTable).values({ postId, userId: req.userId, content }).returning();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));

  res.status(201).json({
    id: reply.id,
    postId: reply.postId,
    userId: reply.userId,
    username: user.username,
    avatarUrl: user.avatarUrl,
    content: reply.content,
    createdAt: reply.createdAt.toISOString(),
  });
});

export default router;
