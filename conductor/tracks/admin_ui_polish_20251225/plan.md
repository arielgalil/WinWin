# Track Plan: Admin UI Polish & Score Formatting

## Phase 1: Localization Audit & Fixes
- [x] Task: Audit `ClassesManager.tsx` for hardcoded strings. [6bc00d1]
    - [ ] Subtask: Scan file for Hebrew/English strings not wrapped in `t()`.
    - [ ] Subtask: Extract strings to `he.ts` and `en.ts`.
    - [ ] Subtask: Replace strings with `t('key')` calls.
- [ ] Task: Verify localization.
    - [ ] Subtask: Switch languages and verify all text updates in "Classes & Students Management".
- [ ] Task: Conductor - User Manual Verification 'Localization Audit & Fixes' (Protocol in workflow.md)

## Phase 2: Visual Polish & Unification
- [ ] Task: Standardize Goals Management buttons.
    - [ ] Subtask: Increase margin/gap between Edit and Delete buttons in `GoalsManager` (Desktop & Mobile).
    - [ ] Subtask: Ensure Delete button styling matches the standardized red design.
- [ ] Task: Unify Admin Tab Cards.
    - [ ] Subtask: Create/Refactor a reusable `AdminSectionCard` component (or similar) with props for Title, Icon, Description, and Content.
    - [ ] Subtask: Refactor `Settings`, `Goals`, `Users`, `Classes`, `Messages`, `Points`, and `Logs` managers to use this standard container.
- [ ] Task: Conductor - User Manual Verification 'Visual Polish & Unification' (Protocol in workflow.md)

## Phase 3: Score Formatting & Theme Logic
- [ ] Task: Implement RTL Score Formatting.
    - [ ] Subtask: Locate score display components (Ticker, Leaderboard, Toasts).
    - [ ] Subtask: Create or update a formatting utility to ensure format is `100+` (number then sign) for positive numbers.
- [ ] Task: Enforce Theme Preference.
    - [ ] Subtask: Modify `ThemeContext` (or equivalent) to ignore `window.matchMedia`.
    - [ ] Subtask: Ensure initialization logic only reads from `localStorage` or defaults to a hardcoded value (e.g., 'light'), ignoring the system preference.
- [ ] Task: Conductor - User Manual Verification 'Score Formatting & Theme Logic' (Protocol in workflow.md)
