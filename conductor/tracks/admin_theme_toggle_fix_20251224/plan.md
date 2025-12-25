# Track Plan: Fix Broken Theme Toggle in Admin Panel

This plan focuses on synchronizing the theme state with the actual CSS application layer to ensure Light/Dark mode transitions work correctly in the Admin Panel.

## Phase 1: Investigation & Reproduction [checkpoint: 5a0ff2f]
- [x] **Task: Audit Theme Application Logic.**
    - Inspect `contexts/ThemeContext.tsx` and `App.tsx`.
    - Identify why the `theme` state isn't adding/removing the `.dark` class from the root element.
- [x] **Task: Write Failing Tests for Theme Sync.**
    - Create a test that toggles the theme and asserts that the `dark` class is applied to `document.documentElement`.
    - Confirm the test fails as expected.
- [x] **Task: Conductor - User Manual Verification 'Investigation & Reproduction' (Protocol in workflow.md)**

## Phase 2: Core Fix Implementation
- [~] **Task: Implement State-to-DOM Synchronization.**
    - Update the theme context or root component to use a `useEffect` hook that applies the theme class to the HTML/Body tag.
    - Ensure the logic works seamlessly with React 19's rendering cycle.
- [ ] **Task: Fix Persistence Logic.**
    - Verify `localStorage` is correctly updated and read on initial load.
- [ ] **Task: Verify Tests Pass.**
    - Run the theme synchronization tests and ensure they are now green.
- [ ] **Task: Conductor - User Manual Verification 'Core Fix Implementation' (Protocol in workflow.md)**

## Phase 3: Admin Panel UI Pass
- [ ] **Task: Verify Tailwind Dark Mode Coverage.**
    - Perform a quick audit of `components/AdminPanel.tsx` and `components/admin/*` to ensure `dark:` utility classes are present on key containers.
- [ ] **Task: Final Integration Test.**
    - Ensure the toggle works across all Admin tabs without refresh.
- [ ] **Task: Conductor - User Manual Verification 'Admin Panel UI Pass' (Protocol in workflow.md)**
