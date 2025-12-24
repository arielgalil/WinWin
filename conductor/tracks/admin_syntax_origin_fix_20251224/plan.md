# Track Plan: Fix Admin Syntax Error and YouTube Origin Mismatch

This plan addresses the critical syntax error preventing the Admin Panel from loading and resolves the origin mismatch warnings from the YouTube integration.

## Phase 1: Restore Admin Functionality
- [x] **Task: Fix JSX Syntax in AiSettings.tsx.** (7aeb54a)
    -   Locate line 137 in `components/admin/AiSettings.tsx`.
    -   Change the incorrect `</h3>` closing tag to `</h2>`.
- [x] **Task: Verify Compilation.** (7aeb54a)
    -   Ensure the dev server (Vite) no longer reports a 500 error for this module.
    -   Confirm the component renders in the browser.
- [ ] **Task: Conductor - User Manual Verification 'Restore Admin Functionality' (Protocol in workflow.md)**

## Phase 2: Resolve YouTube Console Warnings
- [ ] **Task: Update YouTube IFrame Origin.**
    -   Inspect `components/dashboard/BackgroundMusic.tsx`.
    -   Identify the `initPlayer` function or YouTube player configuration.
    -   Ensure the `origin` parameter is set to `window.location.origin` or the correct local/production host.
- [ ] **Task: Verify Console Output.**
    -   Open the Dashboard and confirm that `postMessage` origin mismatch errors are no longer appearing.
- [ ] **Task: Conductor - User Manual Verification 'Resolve YouTube Console Warnings' (Protocol in workflow.md)**
