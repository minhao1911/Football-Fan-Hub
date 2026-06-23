import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/notifications", async (req, res) => {
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  res.json(
    notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      body: n.body,
      matchId: n.matchId,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
  );
});

router.get("/notifications/unread-count", async (req, res) => {
  const unread = await db
    .select()
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, req.userId), eq(notificationsTable.isRead, false)));

  res.json({ count: unread.length });
});

router.patch("/notifications/:id/read", async (req, res) => {
  const id = parseInt(req.params.id);

  const [notification] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.userId)))
    .returning();

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json({ success: true });
});

router.patch("/notifications/read-all", async (req, res) => {
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.userId, req.userId), eq(notificationsTable.isRead, false)));

  res.json({ success: true });
});

export default router;
