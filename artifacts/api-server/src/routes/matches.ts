import { Router } from "express";
import { db } from "@workspace/db";
import { matchesTable, pokesTable, chatMessagesTable, predictionsTable, usersTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { authMiddleware, requireAdmin } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

async function formatMatch(match: typeof matchesTable.$inferSelect) {
  const [{ pokeCount }] = await db
    .select({ pokeCount: count() })
    .from(pokesTable)
    .where(eq(pokesTable.matchId, match.id));

  const [{ chatCount }] = await db
    .select({ chatCount: count() })
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.matchId, match.id));

  const [{ predictionCount }] = await db
    .select({ predictionCount: count() })
    .from(predictionsTable)
    .where(eq(predictionsTable.matchId, match.id));

  return {
    id: match.id,
    title: match.title,
    description: match.description,
    liveUrl: match.liveUrl,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    scheduledAt: match.scheduledAt?.toISOString() ?? null,
    status: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    pokeCount: Number(pokeCount),
    chatCount: Number(chatCount),
    predictionCount: Number(predictionCount),
    createdAt: match.createdAt.toISOString(),
  };
}

router.get("/matches", async (req, res) => {
  const status = req.query.status as string | undefined;

  let matches: (typeof matchesTable.$inferSelect)[];
  if (status) {
    matches = await db.select().from(matchesTable).where(eq(matchesTable.status, status as "upcoming" | "live" | "settled"));
  } else {
    matches = await db.select().from(matchesTable);
  }

  const result = await Promise.all(matches.map(formatMatch));
  res.json(result);
});

router.post("/matches", requireAdmin, async (req, res) => {
  const { title, description, liveUrl, homeTeam, awayTeam, scheduledAt, status } = req.body as {
    title: string;
    description: string;
    liveUrl: string;
    homeTeam: string;
    awayTeam: string;
    scheduledAt?: string;
    status?: "upcoming" | "live" | "settled";
  };

  const [match] = await db.insert(matchesTable).values({
    title,
    description,
    liveUrl,
    homeTeam,
    awayTeam,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    status: status ?? "upcoming",
  }).returning();

  res.status(201).json(await formatMatch(match));
});

router.get("/matches/:matchId", async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  res.json(await formatMatch(match));
});

router.patch("/matches/:matchId", requireAdmin, async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const { title, description, liveUrl, status } = req.body as {
    title?: string;
    description?: string;
    liveUrl?: string;
    status?: "upcoming" | "live" | "settled";
  };

  const updates: Partial<typeof matchesTable.$inferInsert> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (liveUrl !== undefined) updates.liveUrl = liveUrl;
  if (status !== undefined) updates.status = status;

  const [match] = await db.update(matchesTable).set(updates).where(eq(matchesTable.id, matchId)).returning();
  res.json(await formatMatch(match));
});

router.post("/matches/:matchId/settle", requireAdmin, async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const { homeScore, awayScore } = req.body as { homeScore: number; awayScore: number };

  const [match] = await db
    .update(matchesTable)
    .set({ status: "settled", homeScore, awayScore })
    .where(eq(matchesTable.id, matchId))
    .returning();

  const predictions = await db.select().from(predictionsTable).where(eq(predictionsTable.matchId, matchId));

  let winnersCount = 0;
  let totalXpAwarded = 0;
  const XP_PER_WIN = 100;

  for (const prediction of predictions) {
    const correct = prediction.homeScore === homeScore && prediction.awayScore === awayScore;
    const xpAwarded = correct ? XP_PER_WIN : 0;
    if (correct) {
      winnersCount++;
      totalXpAwarded += xpAwarded;
      await db.update(usersTable)
        .set({ xp: sql`${usersTable.xp} + ${xpAwarded}` })
        .where(eq(usersTable.id, prediction.userId));
    }
    await db.update(predictionsTable).set({ isCorrect: correct, xpAwarded }).where(eq(predictionsTable.id, prediction.id));
  }

  res.json({
    match: await formatMatch(match),
    winnersCount,
    xpAwarded: XP_PER_WIN,
  });
});

export default router;
