# Track Plan: Fix Broken Theme Toggle in Admin Panel

This plan focuses on synchronizing the theme state with the actual CSS application layer to ensure Light/Dark mode transitions work correctly in the Admin Panel.

## Phase 1: Investigation & Reproduction [checkpoint: b74abde]
- [x] **Task: Audit Theme Application Logic.** (b74abde)
    - Inspect `contexts/ThemeContext.tsx` and `App.tsx`.
    - Identify why the `theme` state isn't adding/removing the `.dark` class from the root element.
- [x] **Task: Write Failing Tests for Theme Sync.** (b74abde)
    - Create a test that toggles the theme and asserts that the `dark` class is applied to `document.documentElement`.
    - Confirm the test fails as expected.
- [x] **Task: Conductor - User Manual Verification 'Investigation & Reproduction' (Protocol in workflow.md)**

## Phase 2: Core Fix Implementation [checkpoint: b74abde]
- [x] **Task: Implement State-to-DOM Synchronization.** (b74abde)
    - Update the theme context or root component to use a `useEffect` hook that applies the theme class to the HTML/Body tag.
    - Ensure the logic works seamlessly with React 19's rendering cycle.
- [x] **Task: Fix Persistence Logic.** (b74abde)
    - Verify `localStorage` is correctly updated and read on initial load.
- [x] **Task: Verify Tests Pass.** (b74abde)
    - Run the theme synchronization tests and ensure they are now green.
- [x] **Task: Conductor - User Manual Verification 'Core Fix Implementation' (Protocol in workflow.md)**

## Phase 3: Admin Panel UI Pass
- [x] **Task: Verify Tailwind Dark Mode Coverage.** (b74abde)
    - Perform a quick audit of `components/AdminPanel.tsx` and `components/admin/*` to ensure `dark:` utility classes are present on key containers.
- [x] **Task: Final Integration Test.** (b74abde)
    - Ensure the toggle works across all Admin tabs without refresh.
- [x] **Task: Conductor - User Manual Verification 'Admin Panel UI Pass' (Protocol in workflow.md)**
