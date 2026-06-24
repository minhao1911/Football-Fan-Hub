import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

let _client: GoogleGenerativeAI | null = null;
let _model: GenerativeModel | null = null;

const AI_MODEL = "gemini-2.0-flash";

function getModel(): GenerativeModel {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY must be set in environment secrets.");
  }
  if (!_model) {
    _client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    _model = _client.getGenerativeModel({
      model: AI_MODEL,
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
      },
    });
  }
  return _model;
}

const cache = new Map<string, { value: string; expiresAt: number }>();

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 800,
  cacheKey?: string,
  cacheTtlMs = 5 * 60 * 1000,
): Promise<string> {
  if (cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const model = getModel();
      const result = await model.generateContent({
        systemInstruction: systemPrompt,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      });
      const text = result.response.text();

      if (cacheKey) {
        cache.set(cacheKey, { value: text, expiresAt: Date.now() + cacheTtlMs });
      }

      return text;
    } catch (err: unknown) {
      lastError = err;
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }

  throw lastError;
}

export const SYSTEM_BASE = `You are FanHub AI — a professional football analyst, community manager, and prediction expert.
Tone: exciting, engaging, sports-focused, community-driven.
NEVER invent live scores, fixtures, standings, or statistics.
Only use data explicitly provided to you.`;

export function clearCache(prefix?: string) {
  if (prefix) {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
}
