# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server on port 3000
npm run build        # Production build (runs sync-version.js + copies dist/index.html to functions/public/)
npm run preview      # Preview production build locally
npm test             # Run Vitest tests
npm run analyze      # Bundle size analysis (generates stats.html)
npx tsc --noEmit     # Type check without building
```

Single test file: `npx vitest run src/services/__tests__/geminiService.test.ts`

## Environment

Requires `.env.local` with:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`

## Architecture

**Win2Grow** is a multi-tenant educational competition platform (Hebrew/English) with real-time scoring, AI commentary, and kiosk display modes.

### Backend Services
- **Supabase** — PostgreSQL DB, Auth, Realtime subscriptions, Edge Functions
- **Firebase** — Cloud Functions (`functions/index.js`) for OG meta tags (crawler detection for social previews); static hosting
- **Google Gemini** — AI commentary via Supabase Edge Function (`supabase/functions/ask-gemini/`) to avoid exposing API keys client-side

### Frontend Layers

```
App.tsx (lazy routes + LanguageSync)
├── AuthProvider → session cache, role-based access
├── /comp/:slug       → Dashboard (public kiosk/competition view)
├── /admin/:slug      → AdminPanel (teacher/admin)
├── /superadmin       → SuperAdminPanel (superuser only)
├── /campaign-selector → post-login landing
└── /lite/*           → simplified teacher UI
```

### Data Flow
1. Auth → `AuthContext` fetches `profiles` row (cached in localStorage for instant boot, silently refreshed)
2. URL slug → `useCampaign` hook fetches campaign + `app_settings` (also localStorage-cached per slug)
3. Realtime → Supabase channel subscriptions on classes, students, logs
4. Score events → `useCompetitionEvents` orchestrates burst notifications + triggers Gemini commentary

### Key Hooks & State
- `useAuth` — AuthContext consumer
- `useCampaign` — campaign + settings query with localStorage cache
- `useCompetitionEvents` — burst notifications, goal-reached events, AI commentary trigger
- `useRealtimeSubscriptions` — Supabase channel listeners
- `useLuckyWheelControl`, `useKioskRotation`, `useIdleMode` — feature-specific hooks
- Zustand store (`src/services/store.ts`) — theme, session persistence, iris pattern
- React Query — all async data fetching; stale-while-revalidate pattern

### Roles & Permissions
Three roles: `teacher`, `admin`, `superuser`. Helpers in `src/config.ts`:
- `isSuperUser(profile)` — checks for `superuser` role
- `isAdmin(profile, campaign)` — checks for `admin` or `competition_admin`

### i18n
Dual-language (Hebrew default). Usage: `t('key', language, { param: value })` — translation files at `src/utils/translations/{he,en}.ts`.

### Resilience Patterns
- All Supabase queries wrapped in `withTimeout` (6–15s)
- Profile fetch: 3 retries with exponential backoff, fallback emergency profile
- Fail-silent on Gemini errors (8s timeout)
- PWA/Workbox background sync for offline POST/PATCH

### Path Alias
`@/` maps to `./src/` — use this instead of relative paths.
