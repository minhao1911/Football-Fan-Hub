import { Router } from "express";
import { db } from "@workspace/db";
import { pokesTable, matchesTable, usersTable } from "@workspace/db";
import { eq, count, desc } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/matches/:matchId/pokes", async (req, res) => {
  const matchId = parseInt(req.params.matchId);

  const [{ totalPokes }] = await db
    .select({ totalPokes: count() })
    .from(pokesTable)
    .where(eq(pokesTable.matchId, matchId));

  const recentRows = await db
    .select({
      id: pokesTable.id,
      matchId: pokesTable.matchId,
      fromUserId: pokesTable.fromUserId,
      toUserId: pokesTable.toUserId,
      createdAt: pokesTable.createdAt,
      fromUsername: usersTable.username,
    })
    .from(pokesTable)
    .innerJoin(usersTable, eq(pokesTable.fromUserId, usersTable.id))
    .where(eq(pokesTable.matchId, matchId))
    .orderBy(desc(pokesTable.createdAt))
    .limit(10);

  const recentPokes = await Promise.all(
    recentRows.map(async (p) => {
      const [toUser] = await db.select().from(usersTable).where(eq(usersTable.id, p.toUserId));
      return {
        id: p.id,
        matchId: p.matchId,
        fromUserId: p.fromUserId,
        fromUsername: p.fromUsername,
        toUserId: p.toUserId,
        toUsername: toUser?.username ?? "unknown",
        createdAt: p.createdAt.toISOString(),
      };
    }),
  );

  res.json({
    matchId,
    totalPokes: Number(totalPokes),
    recentPokes,
  });
});

router.post("/matches/:matchId/pokes", async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const { toUserId } = req.body as { toUserId: number };

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const [poke] = await db
    .insert(pokesTable)
    .values({ matchId, fromUserId: req.userId, toUserId })
    .returning();

  const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));
  const [toUser] = await db.select().from(usersTable).where(eq(usersTable.id, toUserId));

  res.status(201).json({
    id: poke.id,
    matchId: poke.matchId,
    fromUserId: poke.fromUserId,
    fromUsername: fromUser?.username ?? "unknown",
    toUserId: poke.toUserId,
    toUsername: toUser?.username ?? "unknown",
    createdAt: poke.createdAt.toISOString(),
  });
});

export default router;
