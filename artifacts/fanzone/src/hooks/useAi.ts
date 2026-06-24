import { useQuery, useMutation } from "@tanstack/react-query";

const BASE = "/api";

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export function useMatchPreview(matchId: number) {
  return useQuery({
    queryKey: ["ai-preview", matchId],
    queryFn: () => apiFetch<{
      headline: string;
      overview: string;
      keyStorylines: string[];
      playersToWatch: string[];
      discussionQuestions: string[];
    }>(`/ai/match/${matchId}/preview`),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useDiscussionPrompt(matchId: number, phase: "pre" | "halftime" | "post") {
  return useQuery({
    queryKey: ["ai-discussion", matchId, phase],
    queryFn: () => apiFetch<{ prompt: string }>(`/ai/match/${matchId}/discussion-prompt?phase=${phase}`),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function usePredictionAnalysis(matchId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["ai-prediction-analysis", matchId],
    queryFn: () => apiFetch<{ analysis: string; stats?: { total: number; homeWinPct: number; awayWinPct: number; drawPct: number } }>(
      `/ai/match/${matchId}/prediction-analysis`
    ),
    enabled,
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

export function useMatchRecap(matchId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["ai-recap", matchId],
    queryFn: () => apiFetch<{ recap: string }>(`/ai/match/${matchId}/recap`),
    enabled,
    staleTime: 10 * 60_000,
    retry: 1,
  });
}

export function useMatchSentiment(matchId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["ai-sentiment", matchId],
    queryFn: () => apiFetch<{ positive: number; neutral: number; negative: number; summary: string }>(
      `/ai/match/${matchId}/sentiment`
    ),
    enabled,
    staleTime: 3 * 60_000,
    retry: 1,
  });
}

export function useCommunityInsights() {
  return useQuery({
    queryKey: ["ai-community-insights"],
    queryFn: () => apiFetch<{ summary: string; highlights: string[] }>(`/ai/community/insights`),
    staleTime: 10 * 60_000,
    retry: 1,
  });
}

export function useAiAssistant() {
  return useMutation({
    mutationFn: ({ question, matchContext }: { question: string; matchContext?: string }) =>
      apiFetch<{ answer: string }>("/ai/assistant", {
        method: "POST",
        body: JSON.stringify({ question, matchContext }),
      }),
  });
}
