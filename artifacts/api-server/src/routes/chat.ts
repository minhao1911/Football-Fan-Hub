import { Router } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable, matchesTable, usersTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/matches/:matchId/chat", async (req, res) => {
  const matchId = parseInt(req.params.matchId);

  const messages = await db
    .select({
      id: chatMessagesTable.id,
      matchId: chatMessagesTable.matchId,
      userId: chatMessagesTable.userId,
      content: chatMessagesTable.content,
      createdAt: chatMessagesTable.createdAt,
      username: usersTable.username,
      avatarUrl: usersTable.avatarUrl,
    })
    .from(chatMessagesTable)
    .innerJoin(usersTable, eq(chatMessagesTable.userId, usersTable.id))
    .where(eq(chatMessagesTable.matchId, matchId))
    .orderBy(asc(chatMessagesTable.createdAt));

  res.json(
    messages.map((m) => ({
      id: m.id,
      matchId: m.matchId,
      userId: m.userId,
      username: m.username,
      avatarUrl: m.avatarUrl,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  );
});

router.post("/matches/:matchId/chat", async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const { content } = req.body as { content: string };

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const [message] = await db
    .insert(chatMessagesTable)
    .values({ matchId, userId: req.userId, content })
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));

  res.status(201).json({
    id: message.id,
    matchId: message.matchId,
    userId: message.userId,
    username: user.username,
    avatarUrl: user.avatarUrl,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  });
});

export default router;
