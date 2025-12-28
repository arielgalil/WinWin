# Specification: Remote Kiosk Update Mechanism

## Overview
Implement a "headless" update mechanism for the application, specifically targeted at Public Scoreboard/Dashboard screens running in kiosk mode (no mouse/keyboard). The system will leverage PWA Service Workers to detect new versions and automatically refresh the page during idle periods to synchronize with the latest deployment.

## Functional Requirements

### 1. Version Detection (Service Worker)
- Integrate with the existing `vite-plugin-pwa` infrastructure.
- Listen for the `onNeedRefresh` or `updatefound` events from the Service Worker.
- When a new version is detected and installed (status: `installed` or `waiting`), trigger the update flow.

### 2. Intelligent Auto-Refresh
- **Idle Timer:** Upon detecting an update, the app must not refresh immediately. It should wait for a configurable idle period (default: 60 seconds).
- **Interaction Reset:** Any user interaction (touch/mouse move) must reset the idle timer.
- **Forced Update:** If the screen is never touched (typical for kiosks), the reload should execute automatically once the idle timer expires after the update is ready.

### 3. Visibility & Monitoring
- **Console Logging:** Provide clear, high-level logs in the browser console identifying the update progress (e.g., "[Kiosk-Update] New version detected. Waiting for idle period...").
- **Optional (Future):** A small, non-obtrusive version indicator or "Update pending" icon could be displayed in the corner during the idle wait, though for kiosks, "hidden" is preferred.

## Non-Functional Requirements
- **Reliability:** Ensure the refresh logic uses `window.location.reload(true)` or equivalent to bypass local cache if possible.
- **UX Safety:** The idle timer ensures that if a user *is* currently interacting with the screen (e.g., a teacher setting it up), it doesn't refresh mid-touch.

## Acceptance Criteria
- [ ] Application running in the browser detects a new build deployment via the Service Worker.
- [ ] The application remains functional for at least 60 seconds after detection if no interactions occur.
- [ ] The application automatically reloads the page after the 60-second idle period.
- [ ] Any touch interaction during the 60-second window resets the timer.
- [ ] After reload, the application runs the newly deployed code version.

## Out of Scope
- Manual "Update Now" buttons for users.
- Server-side push notifications for updates (relying on PWA standards).
- Hard-coded version checking against a custom API (using manifest/SW).
