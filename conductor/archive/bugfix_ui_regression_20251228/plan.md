# Bug Fix: UI Regressions (Crash, Icons, Animations)

## Phase 1: Critical Crash Fix
- [x] Task: Fix `ReferenceError: language is not defined` in `MissionMeter.tsx`. [61e9382]
    - [x] Add `language` to destructuring from `useLanguage()`.
    - [x] Verify other components for similar `useLanguage` misuse.

## Phase 2: Iconography Fixes
- [x] Task: Fix invalid Material Symbol names. [9128374]
    - [x] `Sparkles` -> `auto_awesome` (User reported "parkles").
    - [x] `Trophy` -> `emoji_events`.
    - [x] `Crown` -> `chess_king` or `workspace_premium`.
    - [x] `Target` -> `track_changes` or `ads_click`.
    - [x] `Database` -> `dns`.
    - [x] `Footprints` -> `footprint` (verify exact name).
- [x] Task: Fix Spinner Animation. [9128374]
    - [x] Identify the loading spinner component.
    - [x] Ensure it uses a valid icon (e.g., `progress_activity` or `sync`) and handles rotation correctly (Material Symbols often prefer `progress_activity` with a specialized animation class).
- [x] Task: Restore missing Footer icons. [9128374]
    - [x] Audit `AdminSidebar` or Footer component to see which icons are missing.

## Phase 3: UI Consistency
- [x] Task: Fix Save Notification discrepancy. [a728391]
    - [x] Analyze "Save Notification" (likely `SaveNotificationBadge` or similar).
    - [x] Ensure consistent styling across tabs.