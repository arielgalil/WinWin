# Track Plan: Fix Admin Settings Route Duplication

This plan outlines the steps to consolidate duplicate admin routes and ensure full Hebrew localization.

## Phase 1: Route Cleanup & Redirection
- [x] **Task: Locate and Remove Old Route.** (3185468)
    -   Search `App.tsx` or router configuration for `/school`.
    -   Remove the route definition.
    -   If the component used by `/school` is different and unused, mark it for deletion.
- [x] **Task: Update Admin Sidebar.**
    -   Locate `AdminSidebar.tsx` (or similar navigation component).
    -   Update the "Settings" link to point to `/settings` instead of `/school`.
- [x] **Task: Global Link Search & Replace.**
    -   Search the entire codebase for string literals or router pushes to `/school`.
    -   Update confirmed instances (Super Admin, Leaderboard, Dashboard) to use `/settings`.
- [x] **Task: Verify Route Access.**
    -   Manual verification: Navigate to Settings from all major entry points.
- [x] **Task: Conductor - User Manual Verification 'Route Cleanup & Redirection' (Protocol in workflow.md)**

## Phase 2: Localization Audit [checkpoint: 0b5f4e1]
- [x] **Task: Audit Settings Page Strings and Update Translation Files.**
    -   Scan components within the `/settings` route (e.g., `SchoolSettings.tsx`, `AiSettings.tsx`, `GoalsManager.tsx`) for hardcoded strings.
    -   Replace any found strings with keys from `utils/translations/he.ts` and `utils/translations/en.ts` (or relevant locale files).
    -   Add any missing Hebrew and English translations to their respective dictionary files (`he.ts`, `en.ts`).
- [x] **Task: Modify `AiSettings.tsx` to use `t()` for newly added localization keys.**
- [x] **Task: Modify `GoalsManager.tsx` and `components/admin/settings/GoalsManager.tsx` to use `t()` for newly added localization keys.**
- [x] **Task: Conductor - User Manual Verification 'Localization Audit' (Protocol in workflow.md)**

## Phase 3: Final Cleanup & Quality Check
- [x] **Task: Remove Dead Code.**
    -   Delete any files or components that were exclusively used by the old `/school` route (if applicable).
- [x] **Task: Final Regression Test.**
    -   Ensure the "School Settings" page loads correctly, saves data, and displays in Hebrew.
- [x] **Task: Conductor - User Manual Verification 'Final Cleanup & Quality Check' (Protocol in workflow.md)**
