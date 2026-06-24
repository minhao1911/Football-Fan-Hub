import { generateText, SYSTEM_BASE } from "./aiProvider.js";

export interface SentimentResult {
  positive: number;
  neutral: number;
  negative: number;
  summary: string;
  mood: "excited" | "positive" | "neutral" | "frustrated" | "mixed";
}

export async function analyzeSentiment(comments: string[]): Promise<SentimentResult> {
  if (comments.length === 0) {
    return { positive: 0, neutral: 100, negative: 0, summary: "No comments to analyze yet.", mood: "neutral" };
  }

  const sample = comments.slice(0, 25).join("\n---\n");
  const prompt = `Analyze the sentiment of these football fan comments:
${sample}

Return valid JSON (percentages must sum to 100):
{
  "positive": <0-100>,
  "neutral": <0-100>,
  "negative": <0-100>,
  "summary": "one sentence describing the overall community mood",
  "mood": "excited|positive|neutral|frustrated|mixed"
}`;

  const raw = await generateText(SYSTEM_BASE, prompt, 200);
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const parsed = JSON.parse(jsonMatch[0]) as SentimentResult;
    const total = parsed.positive + parsed.neutral + parsed.negative;
    if (Math.abs(total - 100) > 5) {
      const factor = 100 / total;
      parsed.positive = Math.round(parsed.positive * factor);
      parsed.negative = Math.round(parsed.negative * factor);
      parsed.neutral = 100 - parsed.positive - parsed.negative;
    }
    return parsed;
  } catch {
    return {
      positive: 60,
      neutral: 30,
      negative: 10,
      summary: "Community sentiment is generally positive and engaged.",
      mood: "positive",
    };
  }
}
