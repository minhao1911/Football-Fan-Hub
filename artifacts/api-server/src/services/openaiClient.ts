import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY must be set in environment secrets.");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const AI_MODEL = "gpt-4o";

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 800,
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  return response.choices[0]?.message?.content ?? "";
}

const SYSTEM_BASE = `You are FanHub AI — a professional football analyst, community manager, and prediction expert.
Tone: exciting, engaging, sports-focused, community-driven.
NEVER invent live scores, fixtures, standings, or statistics.
Only use data explicitly provided to you.`;

export { SYSTEM_BASE };
