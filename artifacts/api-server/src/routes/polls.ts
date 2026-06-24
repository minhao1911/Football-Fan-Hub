import { Router } from "express";
import { db } from "@workspace/db";
import { matchesTable, matchPollVotesTable } from "@workspace/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { z } from "zod/v4";

const router = Router();

const voteInputSchema = z.object({
  outcome: z.enum(["home_win", "draw", "away_win"]),
});

async function getPollData(matchId: number, userId?: number) {
  const rows = await db
    .select({ outcome: matchPollVotesTable.outcome, count: sql<number>`count(*)::int` })
    .from(matchPollVotesTable)
    .where(eq(matchPollVotesTable.matchId, matchId))
    .groupBy(matchPollVotesTable.outcome);

  const counts: Record<string, number> = { home_win: 0, draw: 0, away_win: 0 };
  let total = 0;
  for (const row of rows) {
    counts[row.outcome] = row.count;
    total += row.count;
  }

  let myVote: string | null = null;
  if (userId) {
    const mine = await db
      .select({ outcome: matchPollVotesTable.outcome })
      .from(matchPollVotesTable)
      .where(and(eq(matchPollVotesTable.matchId, matchId), eq(matchPollVotesTable.userId, userId)))
      .limit(1);
    myVote = mine[0]?.outcome ?? null;
  }

  return {
    matchId,
    homeWin: counts.home_win,
    draw: counts.draw,
    awayWin: counts.away_win,
    totalVotes: total,
    myVote,
  };
}

router.get("/matches/:matchId/poll", authMiddleware, async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  if (isNaN(matchId)) return res.status(400).json({ error: "Invalid matchId" });
  const poll = await getPollData(matchId, req.userId);
  res.json(poll);
});

router.post("/matches/:matchId/poll", authMiddleware, async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  if (isNaN(matchId)) return res.status(400).json({ error: "Invalid matchId" });

  const parsed = voteInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const existing = await db
    .select({ id: matchPollVotesTable.id })
    .from(matchPollVotesTable)
    .where(and(eq(matchPollVotesTable.matchId, matchId), eq(matchPollVotesTable.userId, req.userId!)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(matchPollVotesTable)
      .set({ outcome: parsed.data.outcome })
      .where(and(eq(matchPollVotesTable.matchId, matchId), eq(matchPollVotesTable.userId, req.userId!)));
  } else {
    await db.insert(matchPollVotesTable).values({
      matchId,
      userId: req.userId!,
      outcome: parsed.data.outcome,
    });
  }

  const poll = await getPollData(matchId, req.userId);
  res.json(poll);
});

router.get("/polls", authMiddleware, async (req, res) => {
  const matches = await db
    .select()
    .from(matchesTable)
    .orderBy(matchesTable.status, matchesTable.scheduledAt);

  const results = await Promise.all(
    matches.map(async (m) => {
      const poll = await getPollData(m.id, req.userId);
      return {
        matchId: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        title: m.title,
        status: m.status,
        scheduledAt: m.scheduledAt?.toISOString() ?? null,
        poll,
      };
    }),
  );

  res.json(results);
});

export default router;
