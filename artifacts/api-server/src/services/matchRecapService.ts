import { generateText, SYSTEM_BASE } from "./aiProvider.js";

interface MatchData {
  homeTeam: string;
  awayTeam: string;
  title: string;
  description: string;
  homeScore?: number | null;
  awayScore?: number | null;
}

export interface MatchRecap {
  summary: string;
  tacticalAnalysis: string;
  keyMoments: string[];
  manOfTheMatchDiscussion: string;
  communityQuestion: string;
}

export async function generateMatchRecap(match: MatchData): Promise<MatchRecap> {
  if (match.homeScore == null || match.awayScore == null) {
    throw new Error("Match recap requires a final score.");
  }

  const cacheKey = `recap:${match.homeTeam}:${match.awayTeam}:${match.homeScore}:${match.awayScore}`;

  const prompt = `Generate a post-match recap for:
${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}
Context: ${match.description}

Return valid JSON:
{
  "summary": "2-3 sentence result summary",
  "tacticalAnalysis": "2 sentence tactical observation",
  "keyMoments": ["moment 1", "moment 2", "moment 3"],
  "manOfTheMatchDiscussion": "1 sentence man-of-the-match talking point",
  "communityQuestion": "one engaging question for fans"
}`;

  const raw = await generateText(SYSTEM_BASE, prompt, 500, cacheKey, 60 * 60 * 1000);
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    return JSON.parse(jsonMatch[0]) as MatchRecap;
  } catch {
    const winner =
      match.homeScore > match.awayScore
        ? match.homeTeam
        : match.awayScore > match.homeScore
          ? match.awayTeam
          : "Both teams";

    return {
      summary: `${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}. ${winner === "Both teams" ? "An evenly-contested draw." : `${winner} take all three points.`}`,
      tacticalAnalysis: "Both sides showed tactical discipline throughout. The winning margin reflected the difference on the day.",
      keyMoments: ["A tight opening period from both sides.", "Momentum shifted in the second half.", "The final scoreline was hard fought."],
      manOfTheMatchDiscussion: "Several players put in impressive shifts — who gets your man-of-the-match vote?",
      communityQuestion: "Did the best team win tonight? Share your thoughts below!",
    };
  }
}

export async function generatePostMatchRecap(match: MatchData): Promise<string> {
  const recap = await generateMatchRecap(match);
  return `${recap.summary} ${recap.tacticalAnalysis} ${recap.manOfTheMatchDiscussion}`;
}
