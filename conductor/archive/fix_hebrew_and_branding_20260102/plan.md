# Plan - Fix Hebrew Translations and Login Branding

## Phase 1: Hebrew Translations

### Task 1: Update Hebrew Translation File
- [x] Add missing keys to `src/utils/translations/he.ts` based on `DataManagement.tsx` and `UsersManager.tsx` usage.
- [x] Verify keys against `en.ts` to ensure no gaps.

### Task 2: Verification
- [x] Run `npm test` to ensure no regressions in translation usage.
- [x] Manual verification of Data/Team Management UI.

## Phase 2: Login Branding & Redirects

### Task 1: Audit Login Redirection
- [x] Check `ProtectedRoute.tsx` to ensure `slug` is always passed to the redirect path.
- [x] Check `App.tsx`'s `LoginRoute` for potential race conditions.

### Task 2: Fix Branded Login Loading
- [x] Update `LoginRoute` in `App.tsx` to strictly wait for `settings` if `slug` is present before rendering `LiteLogin`.
- [x] Ensure `activeSettings` is correctly populated with fallback if full settings aren't loaded yet but campaign is.

### Task 3: Verification
- [x] Manual verification of logout/login flow from a branded dashboard.
- [x] Manual verification of direct navigation to `/login/:slug`.
- [x] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

[checkpoint: ]
