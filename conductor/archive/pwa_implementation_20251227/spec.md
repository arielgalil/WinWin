# Specification: PWA Implementation (Installability, Offline Support, Background Sync)

## Overview
This track aims to transform the "WinWin" web application into a Progressive Web App (PWA). This will improve user retention through installability, ensure the app remains functional in low-connectivity environments (offline support), and guarantee data integrity by deferring database mutations and uploads until a stable connection is available (background sync).

## Functional Requirements

### 1. Installability (A2HS)
- **Web App Manifest:** Create a `manifest.webmanifest` (via `vite-plugin-pwa`) including:
  - Name: "WinWin - תחרות מצמיחה"
  - Short Name: "WinWin"
  - Icons: Multiple sizes (192x192, 512x512) and a maskable icon.
  - Theme Color: Aligned with current branding.
  - Start URL: `/`
  - Display: `standalone`
- **Installation Prompt:** Ensure the browser's "Add to Home Screen" prompt is triggered correctly.

### 2. Offline Support
- **Asset Caching:** Pre-cache core application assets (HTML, JS, CSS, Icons) for instant loading and offline access.
- **API Caching (Read-only):** Cache critical Supabase read requests (e.g., current competition data, leaderboard) using a "Stale-While-Revalidate" strategy.

### 3. Background Sync (Write Operations)
- **Deferred Mutations:** Queue Supabase database mutations (score entries, class/campaign updates) when offline.
- **Asset Uploads:** Queue institution logo or file uploads for deferred processing.
- **Generic Retry Logic:** Implement a robust retry mechanism using Workbox Background Sync to replay failed requests when connectivity is restored.

### 4. Update Lifecycle
- **Update Prompt:** Implement a notification (Toast/Dialog) informing the user when a new version of the app is available, providing a "Refresh" button to update.

## Non-Functional Requirements
- **Performance:** Offline loads should be near-instant (sub-500ms for cached assets).
- **Data Integrity:** Background sync must ensure no data is lost during intermittent connectivity.
- **Security:** Ensure Service Worker only operates over HTTPS (handled by Firebase Hosting).

## Technical Implementation
- **Plugin:** `vite-plugin-pwa` with `injectRegister: 'auto'` or `prompt`.
- **Workbox Strategy:** 
  - `GenerateSW` for standard needs.
  - Custom `src/sw.ts` if complex background sync logic requires fine-tuning.
- **Persistence:** Use `IndexedDB` (via Workbox or `idb-keyval`) for queuing background sync tasks.

## Acceptance Criteria
- [ ] App passes Lighthouse PWA audit (Installable, Service Worker registered).
- [ ] App loads and displays basic UI when "Offline" in DevTools.
- [ ] A score entry made while offline is successfully synced to Supabase when the connection returns.
- [ ] A "New version available" prompt appears when a new build is deployed.

## Out of Scope
- Push Notifications (deferred to a future track).
- Full offline editing of historical data (focus is on new mutations).
