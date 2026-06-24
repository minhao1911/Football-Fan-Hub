import { Router } from "express";
import { db } from "@workspace/db";
import {
  matchesTable,
  predictionsTable,
  chatMessagesTable,
  forumPostsTable,
  forumRepliesTable,
  feedCommentsTable,
  usersTable,
  fanGroupsTable,
} from "@workspace/db";
import { eq, count, sql, desc } from "drizzle-orm";
import { authMiddleware } from "../../middlewares/auth.js";
import {
  generateMatchPreview,
  generateDiscussionPrompt,
  generatePredictionAnalysis,
  generatePostMatchRecap,
} from "../../services/matchPreviewService.js";
import {
  generateXpCommentary,
  generateLeaderboardCommentary,
  generateCommunityInsights,
  generateSentimentAnalysis,
  generateBadgeAnnouncement,
} from "../../services/communityInsightsService.js";
import { generateText, SYSTEM_BASE } from "../../services/aiProvider.js";

const router = Router();
router.use(authMiddleware);

router.get("/ai/match/:matchId/preview", async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  const preview = await generateMatchPreview(match);
  res.json(preview);
});

router.get("/ai/match/:matchId/discussion-prompt", async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const phase = (req.query.phase as "pre" | "halftime" | "post") ?? "pre";
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  const prompt = await generateDiscussionPrompt(match, phase);
  res.json({ prompt });
});

router.get("/ai/match/:matchId/prediction-analysis", async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }

  const predictions = await db.select().from(predictionsTable).where(eq(predictionsTable.matchId, matchId));
  const total = predictions.length;

  if (total === 0) {
    res.json({ analysis: "No predictions submitted yet — be the first to predict!" });
    return;
  }

  const homeWins = predictions.filter((p) => p.homeScore > p.awayScore).length;
  const awayWins = predictions.filter((p) => p.awayScore > p.homeScore).length;
  const draws = predictions.filter((p) => p.homeScore === p.awayScore).length;

  const scoreMap: Record<string, number> = {};
  predictions.forEach((p) => {
    const key = `${p.homeScore}-${p.awayScore}`;
    scoreMap[key] = (scoreMap[key] ?? 0) + 1;
  });
  const topScore = Object.entries(scoreMap).sort((a, b) => b[1] - a[1])[0];
  const [topH, topA] = topScore[0].split("-").map(Number);

  const analysis = await generatePredictionAnalysis(match, {
    total,
    homeWinPct: (homeWins / total) * 100,
    awayWinPct: (awayWins / total) * 100,
    drawPct: (draws / total) * 100,
    mostPredictedHome: topH,
    mostPredictedAway: topA,
    mostPredictedCount: topScore[1],
  });
  res.json({ analysis, stats: { total, homeWinPct: (homeWins/total)*100, awayWinPct: (awayWins/total)*100, drawPct: (draws/total)*100 } });
});

router.get("/ai/match/:matchId/recap", async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  if (match.status !== "settled") { res.status(400).json({ error: "Match not settled yet" }); return; }
  const recap = await generatePostMatchRecap(match);
  res.json({ recap });
});

router.get("/ai/match/:matchId/sentiment", async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const chatRows = await db
    .select({ content: chatMessagesTable.content })
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.matchId, matchId))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(30);

  const forumRows = await db
    .select({ content: forumPostsTable.content })
    .from(forumPostsTable)
    .where(eq(forumPostsTable.matchId, matchId))
    .limit(10);

  const comments = [...chatRows.map((r) => r.content), ...forumRows.map((r) => r.content)];
  const result = await generateSentimentAnalysis(comments);
  res.json(result);
});

router.get("/ai/community/insights", async (req, res) => {
  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [matchCount] = await db.select({ count: count() }).from(matchesTable);
  const [predCount] = await db.select({ count: count() }).from(predictionsTable);
  const [chatCount] = await db.select({ count: count() }).from(chatMessagesTable);

  const groups = await db.select().from(fanGroupsTable);
  const topGroups = await Promise.all(
    groups.slice(0, 5).map(async (g) => {
      const [{ memberCount }] = await db
        .select({ memberCount: sql<number>`count(*)` })
        .from(usersTable)
        .where(eq(usersTable.groupId, g.id));
      const [{ totalXp }] = await db
        .select({ totalXp: sql<number>`coalesce(sum(${usersTable.xp}), 0)` })
        .from(usersTable)
        .where(eq(usersTable.groupId, g.id));
      return { name: g.name, memberCount: Number(memberCount), totalXp: Number(totalXp) };
    })
  );

  const result = await generateCommunityInsights({
    totalUsers: Number(userCount.count),
    totalMatches: Number(matchCount.count),
    totalPredictions: Number(predCount.count),
    totalChatMessages: Number(chatCount.count),
    topGroups,
  });
  res.json(result);
});

router.post("/ai/leaderboard-commentary", async (req, res) => {
  const { username, groupName, rank, xp, previousRank } = req.body as {
    username?: string;
    groupName?: string;
    rank: number;
    xp: number;
    previousRank?: number;
  };
  const type = groupName ? "group" : "user";
  const commentary = await generateLeaderboardCommentary({ rank, xp, username, groupName, previousRank }, type);
  res.json({ commentary });
});

router.post("/ai/xp-commentary", async (req, res) => {
  const { username, xpEarned, reason } = req.body as { username: string; xpEarned: number; reason: string };
  const commentary = await generateXpCommentary(username, xpEarned, reason);
  res.json({ commentary });
});

router.post("/ai/badge-announcement", async (req, res) => {
  const { username, badgeName } = req.body as { username: string; badgeName: string };
  const announcement = await generateBadgeAnnouncement(username, badgeName);
  res.json({ announcement });
});

router.post("/ai/assistant", async (req, res) => {
  const { question, matchContext } = req.body as { question: string; matchContext?: string };

  const systemPrompt = `${SYSTEM_BASE}
You are the FanHub AI Football Assistant. Answer football-related questions clearly and engagingly.
If asked about specific live scores, fixtures, or stats not provided, say you don't have that specific data.
${matchContext ? `Current match context: ${matchContext}` : ""}`;

  const answer = await generateText(systemPrompt, question, 400);
  res.json({ answer });
});

export default router;
