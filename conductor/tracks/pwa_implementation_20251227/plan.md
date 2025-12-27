# Implementation Plan: PWA Implementation

This plan outlines the steps to transform the WinWin application into a full-featured PWA with offline support and background sync capabilities, utilizing `vite-plugin-pwa`.

## Phase 1: Infrastructure & Basic PWA Setup
- [x] Task: Install and Configure `vite-plugin-pwa` (8d8c45a)
    - [x] Add `vite-plugin-pwa` dependency.
    - [x] Update `vite.config.ts` with basic PWA configuration (manifest, icons, theme color).
    - [x] Create/Source high-resolution icons (192x192, 512x512, maskable).
- [x] Task: Service Worker Registration (8d8c45a)
    - [x] Implement automatic service worker registration in `index.tsx` or `App.tsx`.
    - [x] Verify service worker is registered in development using `vite-plugin-pwa` dev options.
- [ ] Task: Conductor - User Manual Verification 'Infrastructure & Basic PWA Setup' (Protocol in workflow.md)

## Phase 2: Offline Asset Caching (App Shell)
- [ ] Task: Configure Pre-caching Strategy
    - [ ] Define workbox glob patterns in `vite.config.ts` to include all essential assets (JS, CSS, HTML, Fonts).
    - [ ] Ensure `index.html` is cached as the entry point for offline navigation.
- [ ] Task: Offline UI Fallback
    - [ ] Create a simple `OfflineIndicator` component to notify users when they are disconnected.
    - [ ] Integrate the indicator into the main layout.
- [ ] Task: Conductor - User Manual Verification 'Offline Asset Caching (App Shell)' (Protocol in workflow.md)

## Phase 3: Supabase Data Caching (Read Operations)
- [ ] Task: Implement Stale-While-Revalidate for Supabase Calls
    - [ ] Identify critical API endpoints (Competitions, Leaderboards).
    - [ ] Configure `runtimeCaching` in `vite.config.ts` for these patterns.
    - [ ] Test that the dashboard loads data from cache when offline.
- [ ] Task: Conductor - User Manual Verification 'Supabase Data Caching (Read Operations)' (Protocol in workflow.md)

## Phase 4: Background Sync (Write Operations)
- [ ] Task: Setup Workbox Background Sync
    - [ ] Configure `workbox-background-sync` in the service worker.
    - [ ] Define a "sync-queue" for Supabase RPC and REST mutations.
- [ ] Task: Implement Deferred Score Entries
    - [ ] Wrap score entry mutations to ensure they are captured by the sync queue when offline.
    - [ ] Verify that an offline score entry is automatically submitted when the connection is restored.
- [ ] Task: Implement Deferred Asset Uploads
    - [ ] Extend background sync to handle file uploads (e.g., institution logos).
- [ ] Task: Conductor - User Manual Verification 'Background Sync (Write Operations)' (Protocol in workflow.md)

## Phase 5: Update Lifecycle & Final Polish
- [ ] Task: "Update Available" UI
    - [ ] Implement a custom hook/component to listen for `onNeedRefresh` from `vite-plugin-pwa`.
    - [ ] Show a Toast notification with a "Refresh" button when a new version is detected.
- [ ] Task: PWA Audit & Optimization
    - [ ] Run Lighthouse PWA audit and fix any remaining issues.
    - [ ] Verify maskable icons and theme colors across different platforms (Android/iOS).
- [ ] Task: Conductor - User Manual Verification 'Update Lifecycle & Final Polish' (Protocol in workflow.md)
