import { generateText, SYSTEM_BASE } from "./aiProvider.js";

interface MatchData {
  homeTeam: string;
  awayTeam: string;
  title: string;
  description: string;
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
}

export type DiscussionPhase = "pre" | "halftime" | "post";

export interface DiscussionPost {
  title: string;
  body: string;
  phase: DiscussionPhase;
}

export async function generateDiscussionPost(
  match: MatchData,
  phase: DiscussionPhase,
): Promise<DiscussionPost> {
  const context = {
    pre: `Before the match: ${match.homeTeam} vs ${match.awayTeam}. ${match.description}`,
    halftime: `At halftime of ${match.homeTeam} vs ${match.awayTeam}.`,
    post: `After the match: ${match.homeTeam} ${match.homeScore ?? "?"} - ${match.awayScore ?? "?"} ${match.awayTeam}.`,
  }[phase];

  const phaseLabel = {
    pre: "pre-match prediction/build-up",
    halftime: "halftime live reaction",
    post: "post-match reaction and tactical debate",
  }[phase];

  const prompt = `Generate a ${phaseLabel} discussion post for a football fan community.
Context: ${context}

Return valid JSON:
{
  "title": "engaging post title (max 10 words)",
  "body": "2-3 sentence discussion starter that sparks fan debate"
}`;

  const raw = await generateText(SYSTEM_BASE, prompt, 200);
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const parsed = JSON.parse(jsonMatch[0]) as { title: string; body: string };
    return { ...parsed, phase };
  } catch {
    const fallbacks: Record<DiscussionPhase, DiscussionPost> = {
      pre: {
        title: `Who wins tonight? ${match.homeTeam} vs ${match.awayTeam}`,
        body: `Both teams are ready for battle. Drop your prediction and tell us who you think takes the 3 points tonight!`,
        phase: "pre",
      },
      halftime: {
        title: `Halftime thoughts — ${match.homeTeam} vs ${match.awayTeam}`,
        body: `We're at halftime. What's your take on the first half? Any tactical changes you'd like to see?`,
        phase: "halftime",
      },
      post: {
        title: `Full-time: ${match.homeTeam} ${match.homeScore ?? "?"} - ${match.awayScore ?? "?"} ${match.awayTeam}`,
        body: `The final whistle has blown! Share your thoughts on the result and who impressed you most tonight.`,
        phase: "post",
      },
    };
    return fallbacks[phase];
  }
}

export async function generateDiscussionPrompt(
  match: MatchData,
  phase: DiscussionPhase,
): Promise<string> {
  const context = {
    pre: `Before the match: ${match.homeTeam} vs ${match.awayTeam}`,
    halftime: `At halftime of: ${match.homeTeam} vs ${match.awayTeam}`,
    post: `After the match: ${match.homeTeam} ${match.homeScore ?? "?"} - ${match.awayScore ?? "?"} ${match.awayTeam}`,
  }[phase];

  const prompt = `Generate a single, engaging community discussion prompt for: ${context}.
Make it a direct question (1-2 sentences) that will spark fan debate.`;

  return generateText(SYSTEM_BASE, prompt, 100);
}
