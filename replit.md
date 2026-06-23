# FanZone

A football fan engagement platform where fans can join groups, predict match scores, chat live during matches, discuss in forums, and poke each other.

## Run & Operate

- `pnpm --filter @workspace/fanzone run dev` — run the frontend (port 25764)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + wouter + React Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/index.ts` — database schema (Drizzle)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — demo auth (Bearer userId header)
- `artifacts/fanzone/src/pages/` — React page components
- `artifacts/fanzone/src/contexts/UserContext.tsx` — current user state + auth token

## Architecture decisions

- Auth uses `Authorization: Bearer <userId>` for demo mode. The frontend stores userId in localStorage and injects it via `setAuthTokenGetter`. In production, replace with Clerk JWT.
- User 1 is seeded as admin (can create/settle matches). Switch users via the Profile page demo switcher.
- Match chat auto-refreshes every 3 seconds via polling. Replace with WebSockets for production.
- Predictions are upserted (update if exists) so users can change their pick before settlement.
- XP is awarded at match settlement (100 XP for exact score prediction).

## Product

- **Matches** — browse live/upcoming/settled matches with chat count, poke count, prediction count
- **Match Detail** — live chat, forum discussion, score prediction, and poke system per match
- **Fan Groups** — create or join groups with custom emoji + color badges, see member XP totals
- **Leaderboard** — ranked users and groups by XP earned
- **Profile** — edit username/bio/favorite team, switch demo users

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/db run push` after changing `lib/db/src/schema/index.ts`
- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`
- The API server always rebuilds from TypeScript on `dev` start (esbuild, ~800ms)
- `http-proxy-middleware` is referenced in `clerkProxyMiddleware.ts` but the middleware is not mounted in `app.ts` — only needed for production Clerk proxying

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
