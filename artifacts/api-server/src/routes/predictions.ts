import { Router } from "express";
import { db } from "@workspace/db";
import { predictionsTable, matchesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/matches/:matchId/predictions", async (req, res) => {
  const matchId = parseInt(req.params.matchId);

  const rows = await db
    .select({
      id: predictionsTable.id,
      matchId: predictionsTable.matchId,
      userId: predictionsTable.userId,
      homeScore: predictionsTable.homeScore,
      awayScore: predictionsTable.awayScore,
      isCorrect: predictionsTable.isCorrect,
      xpAwarded: predictionsTable.xpAwarded,
      createdAt: predictionsTable.createdAt,
      username: usersTable.username,
    })
    .from(predictionsTable)
    .innerJoin(usersTable, eq(predictionsTable.userId, usersTable.id))
    .where(
      req.isAdmin
        ? eq(predictionsTable.matchId, matchId)
        : and(eq(predictionsTable.matchId, matchId), eq(predictionsTable.userId, req.userId)),
    );

  res.json(
    rows.map((p) => ({
      id: p.id,
      matchId: p.matchId,
      userId: p.userId,
      username: p.username,
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      isCorrect: p.isCorrect,
      xpAwarded: p.xpAwarded,
      createdAt: p.createdAt.toISOString(),
    })),
  );
});

router.post("/matches/:matchId/predictions", async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const { homeScore, awayScore } = req.body as { homeScore: number; awayScore: number };

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  if (match.status === "settled") {
    res.status(400).json({ error: "Match already settled" });
    return;
  }

  const [existing] = await db
    .select()
    .from(predictionsTable)
    .where(and(eq(predictionsTable.matchId, matchId), eq(predictionsTable.userId, req.userId)));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));

  let prediction;
  if (existing) {
    [prediction] = await db
      .update(predictionsTable)
      .set({ homeScore, awayScore })
      .where(eq(predictionsTable.id, existing.id))
      .returning();
  } else {
    [prediction] = await db
      .insert(predictionsTable)
      .values({ matchId, userId: req.userId, homeScore, awayScore })
      .returning();
  }

  res.status(201).json({
    id: prediction.id,
    matchId: prediction.matchId,
    userId: prediction.userId,
    username: user.username,
    homeScore: prediction.homeScore,
    awayScore: prediction.awayScore,
    isCorrect: prediction.isCorrect,
    xpAwarded: prediction.xpAwarded,
    createdAt: prediction.createdAt.toISOString(),
  });
});

router.get("/matches/:matchId/predictions/me", async (req, res) => {
  const matchId = parseInt(req.params.matchId);

  const [row] = await db
    .select({
      id: predictionsTable.id,
      matchId: predictionsTable.matchId,
      userId: predictionsTable.userId,
      homeScore: predictionsTable.homeScore,
      awayScore: predictionsTable.awayScore,
      isCorrect: predictionsTable.isCorrect,
      xpAwarded: predictionsTable.xpAwarded,
      createdAt: predictionsTable.createdAt,
      username: usersTable.username,
    })
    .from(predictionsTable)
    .innerJoin(usersTable, eq(predictionsTable.userId, usersTable.id))
    .where(and(eq(predictionsTable.matchId, matchId), eq(predictionsTable.userId, req.userId)));

  if (!row) {
    res.status(404).json({ error: "No prediction yet" });
    return;
  }

  res.json({
    id: row.id,
    matchId: row.matchId,
    userId: row.userId,
    username: row.username,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    isCorrect: row.isCorrect,
    xpAwarded: row.xpAwarded,
    createdAt: row.createdAt.toISOString(),
  });
});

export default router;
