import { generateText, SYSTEM_BASE } from "./openaiClient.js";

interface LeaderboardEntry {
  rank: number;
  username?: string;
  groupName?: string;
  xp: number;
  previousRank?: number;
}

interface CommunityStats {
  totalUsers: number;
  totalMatches: number;
  totalPredictions: number;
  totalChatMessages: number;
  topGroups: { name: string; memberCount: number; totalXp: number }[];
}

export async function generateXpCommentary(username: string, xpEarned: number, reason: string): Promise<string> {
  const prompt = `Generate a short, exciting XP achievement message for a football fan app.
User: ${username}
XP Earned: ${xpEarned}
Reason: ${reason}

Write 1-2 punchy sentences. Be enthusiastic.`;

  return generateText(SYSTEM_BASE, prompt, 80);
}

export async function generateLeaderboardCommentary(entry: LeaderboardEntry, type: "user" | "group"): Promise<string> {
  const name = entry.username ?? entry.groupName ?? "Unknown";
  const rankChange = entry.previousRank
    ? entry.previousRank > entry.rank
      ? `climbing ${entry.previousRank - entry.rank} place${entry.previousRank - entry.rank > 1 ? "s" : ""}`
      : `holding strong at`
    : "entering at";

  const prompt = `Generate a dynamic leaderboard commentary for a football fan community.
${type === "user" ? "Fan" : "Community"}: ${name}
Rank: #${entry.rank}
XP: ${entry.xp}
Movement: ${rankChange} #${entry.rank}

Write 1 exciting sentence.`;

  return generateText(SYSTEM_BASE, prompt, 80);
}

export async function generateCommunityInsights(stats: CommunityStats): Promise<{
  summary: string;
  highlights: string[];
}> {
  const prompt = `Analyze this FanHub community activity and generate insights:
- Total fans: ${stats.totalUsers}
- Matches tracked: ${stats.totalMatches}
- Predictions made: ${stats.totalPredictions}
- Chat messages: ${stats.totalChatMessages}
- Top communities: ${stats.topGroups.map((g) => `${g.name} (${g.memberCount} members, ${g.totalXp} XP)`).join(", ")}

Return JSON:
{
  "summary": "2 sentence community overview",
  "highlights": ["highlight 1", "highlight 2", "highlight 3"]
}`;

  const raw = await generateText(SYSTEM_BASE, prompt, 300);
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      summary: `FanHub has ${stats.totalUsers} passionate fans making ${stats.totalPredictions} predictions across ${stats.totalMatches} matches.`,
      highlights: [
        `${stats.totalChatMessages} live chat messages sent`,
        `${stats.totalPredictions} score predictions submitted`,
        `${stats.topGroups[0]?.name ?? "Top community"} leads the group leaderboard`,
      ],
    };
  }
}

export async function generateSentimentAnalysis(comments: string[]): Promise<{
  positive: number;
  neutral: number;
  negative: number;
  summary: string;
}> {
  if (comments.length === 0) {
    return { positive: 0, neutral: 100, negative: 0, summary: "No comments to analyze yet." };
  }

  const sample = comments.slice(0, 20).join("\n---\n");
  const prompt = `Analyze the sentiment of these football fan comments:
${sample}

Return JSON:
{
  "positive": <percentage 0-100>,
  "neutral": <percentage 0-100>,
  "negative": <percentage 0-100>,
  "summary": "one sentence describing overall community mood"
}
Percentages must sum to 100.`;

  const raw = await generateText(SYSTEM_BASE, prompt, 200);
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { positive: 60, neutral: 30, negative: 10, summary: "Community sentiment is generally positive and engaged." };
  }
}

export async function generateBadgeAnnouncement(username: string, badgeName: string): Promise<string> {
  const prompt = `Generate a short achievement announcement for a football fan app.
Player: ${username}
Achievement unlocked: "${badgeName}"

Write 1-2 exciting sentences celebrating this milestone.`;

  return generateText(SYSTEM_BASE, prompt, 80);
}
