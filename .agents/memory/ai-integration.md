---
name: AI integration pattern
description: How OpenAI is wired into FanZone — direct key, server services, route structure, frontend hooks.
---

# FanZone AI Integration

## Key decision: direct OPENAI_API_KEY
Replit AI Integrations proxy (setupReplitAIIntegrations) requires account upgrade — use `OPENAI_API_KEY` secret directly via the standard `openai` npm package. Client in `artifacts/api-server/src/services/openaiClient.ts`.

**Why:** Replit AI proxy returned `awaiting_account_upgrade`; user provided their own key.

**How to apply:** Any future AI work on this project should import from `openaiClient.ts`, not from `@workspace/integrations-openai-ai-server`.

## Model
Using `gpt-4o` (not gpt-5.x — those are Replit proxy-only models).

## Server structure
- `artifacts/api-server/src/services/openaiClient.ts` — OpenAI client + `generateText()` helper + `SYSTEM_BASE` prompt
- `artifacts/api-server/src/services/matchPreviewService.ts` — match preview, discussion prompts, prediction analysis, post-match recap
- `artifacts/api-server/src/services/communityInsightsService.ts` — XP commentary, leaderboard commentary, community insights, sentiment analysis, badge announcements
- `artifacts/api-server/src/routes/ai/index.ts` — all AI routes mounted under `/api/ai/*`

## API routes (all require Clerk auth)
- GET  /api/ai/match/:id/preview
- GET  /api/ai/match/:id/discussion-prompt?phase=pre|halftime|post
- GET  /api/ai/match/:id/prediction-analysis
- GET  /api/ai/match/:id/recap  (settled matches only)
- GET  /api/ai/match/:id/sentiment
- GET  /api/ai/community/insights
- POST /api/ai/leaderboard-commentary
- POST /api/ai/xp-commentary
- POST /api/ai/badge-announcement
- POST /api/ai/assistant

## Frontend
- `artifacts/fanzone/src/hooks/useAi.ts` — React Query hooks for all AI endpoints
- `artifacts/fanzone/src/components/AiPanel.tsx` — collapsible AI card primitive
- `artifacts/fanzone/src/components/MatchAiInsights.tsx` — full AI panel shown above match detail tabs
- `artifacts/fanzone/src/components/LeaderboardAi.tsx` — community insights on leaderboard page

## Auth note
All AI endpoints use the same `authMiddleware` (Clerk). Raw curl with `Authorization: Bearer` returns 401 by design — Clerk uses browser session cookies for web clients.
