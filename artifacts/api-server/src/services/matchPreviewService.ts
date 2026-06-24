import { generateText, SYSTEM_BASE } from "./aiProvider.js";

interface MatchData {
  homeTeam: string;
  awayTeam: string;
  title: string;
  description: string;
  status: string;
  scheduledAt?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
}

interface PredictionStats {
  total: number;
  homeWinPct: number;
  awayWinPct: number;
  drawPct: number;
  mostPredictedHome: number;
  mostPredictedAway: number;
  mostPredictedCount: number;
}

export interface MatchPreview {
  headline: string;
  overview: string;
  keyStorylines: string[];
  playersToWatch: string[];
  discussionQuestions: string[];
}

export async function generateMatchPreview(match: MatchData): Promise<MatchPreview> {
  const prompt = `Generate a match preview for this upcoming fixture:
Match: ${match.title}
Teams: ${match.homeTeam} vs ${match.awayTeam}
Description: ${match.description}
${match.scheduledAt ? `Scheduled: ${new Date(match.scheduledAt).toUTCString()}` : ""}

Return valid JSON with this exact structure:
{
  "headline": "one exciting sentence",
  "overview": "2-3 sentence match overview",
  "keyStorylines": ["storyline 1", "storyline 2", "storyline 3"],
  "playersToWatch": ["player description 1", "player description 2"],
  "discussionQuestions": ["question 1", "question 2", "question 3"]
}`;

  const raw = await generateText(SYSTEM_BASE, prompt, 600);
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    return JSON.parse(jsonMatch[0]) as MatchPreview;
  } catch {
    return {
      headline: `${match.homeTeam} vs ${match.awayTeam} — A Clash to Watch`,
      overview: match.description,
      keyStorylines: ["Both teams are looking to make their mark.", "Tactics will be key.", "Community predictions are rolling in."],
      playersToWatch: ["Key attackers from both sides will be central.", "Goalkeepers could be decisive."],
      discussionQuestions: ["Who takes the win?", "What score do you predict?", "Who will be the standout player?"],
    };
  }
}

export async function generateDiscussionPrompt(match: MatchData, phase: "pre" | "halftime" | "post"): Promise<string> {
  const phaseMap = {
    pre: `Before the match: ${match.homeTeam} vs ${match.awayTeam}`,
    halftime: `At halftime of: ${match.homeTeam} vs ${match.awayTeam}`,
    post: `After the match: ${match.homeTeam} ${match.homeScore ?? "?"} - ${match.awayScore ?? "?"} ${match.awayTeam}`,
  };

  const prompt = `Generate a single, engaging community discussion prompt for: ${phaseMap[phase]}.
Make it a direct question (1-2 sentences) that will spark fan debate.`;

  return generateText(SYSTEM_BASE, prompt, 100);
}

export async function generatePredictionAnalysis(match: MatchData, stats: PredictionStats): Promise<string> {
  if (stats.total === 0) return "No predictions submitted yet — be the first to predict!";

  const prompt = `Analyze these community predictions for ${match.homeTeam} vs ${match.awayTeam}:
- Total predictions: ${stats.total}
- ${match.homeTeam} win: ${stats.homeWinPct.toFixed(0)}%
- ${match.awayTeam} win: ${stats.awayWinPct.toFixed(0)}%
- Draw: ${stats.drawPct.toFixed(0)}%
- Most predicted score: ${stats.mostPredictedHome}-${stats.mostPredictedAway} (${stats.mostPredictedCount} votes)

Write a 2-3 sentence engaging summary of community confidence. Be specific with the numbers.`;

  return generateText(SYSTEM_BASE, prompt, 150);
}

export async function generatePostMatchRecap(match: MatchData): Promise<string> {
  const prompt = `Generate a post-match recap for:
${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}

Write a 3-4 sentence exciting recap covering: result summary, key moments, tactical observations, and a man-of-the-match discussion point.`;

  return generateText(SYSTEM_BASE, prompt, 250);
}
