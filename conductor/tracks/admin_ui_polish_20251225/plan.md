# Track Plan: Admin UI Polish & Score Formatting

## Phase 1: Localization Audit & Fixes [checkpoint: 82cf47b]
- [x] Task: Audit `ClassesManager.tsx` for hardcoded strings. [ef8a365]
    - [ ] Subtask: Scan file for Hebrew/English strings not wrapped in `t()`.
    - [ ] Subtask: Extract strings to `he.ts` and `en.ts`.
    - [ ] Subtask: Replace strings with `t('key')` calls.
- [x] Task: Verify localization. [ef8a365]
    - [ ] Subtask: Switch languages and verify all text updates in "Classes & Students Management".
- [x] Task: Conductor - User Manual Verification 'Localization Audit & Fixes' (Protocol in workflow.md) [ef8a365]

## Phase 2: Visual Polish & Unification [checkpoint: a443399]
- [x] Task: Standardize Goals Management buttons. [668586d]
- [x] Task: Unify Admin Tab Cards. [668586d]
    - [ ] Subtask: Create/Refactor a reusable `AdminSectionCard` component (or similar) with props for Title, Icon, Description, and Content.
    - [ ] Subtask: Refactor `Settings`, `Goals`, `Users`, `Classes`, `Messages`, `Points`, and `Logs` managers to use this standard container.
- [x] Task: Conductor - User Manual Verification 'Visual Polish & Unification' (Protocol in workflow.md) [668586d]

## Phase 3: Score Formatting & Theme Logic
- [x] Task: Implement RTL Score Formatting. [a443399]
    - [ ] Subtask: Locate score display components (Ticker, Leaderboard, Toasts).
    - [ ] Subtask: Create or update a formatting utility to ensure format is `100+` (number then sign) for positive numbers.
- [x] Task: Enforce Theme Preference. [a443399]
    - [ ] Subtask: Modify `ThemeContext` (or equivalent) to ignore `window.matchMedia`.
    - [ ] Subtask: Ensure initialization logic only reads from `localStorage` or defaults to a hardcoded value (e.g., 'light'), ignoring the system preference.
- [ ] Task: Conductor - User Manual Verification 'Score Formatting & Theme Logic' (Protocol in workflow.md)
