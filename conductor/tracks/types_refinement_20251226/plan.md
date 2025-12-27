# Implementation Plan: Types and Constants Refinement

This plan outlines the steps to enhance type safety and centralize magic numbers across the project.

## Phase 1: Constants Centralization [checkpoint: 329fe94]
- [x] Task: Create and export timeout and polling constants in `src/config.ts`. (2c13b82)
- [x] Task: Refactor `App.tsx` to use constants for loading screen timeouts. (0c022b2)
- [x] Task: Refactor `src/contexts/AuthContext.tsx` to use constants for auth-related timeouts. (d4030ab)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Constants' (Protocol in workflow.md)

## Phase 2: Type Safety - types.ts [checkpoint: 8101f15]
- [x] Task: Audit actual structure of `snapshot_data` usage in the application. (Audit done: currently unused in TS, reserved for future undo/redo logic in DB)
- [x] Task: TDD - Define specific interfaces for `snapshot_data` in `src/types.ts` and replace `any`. (a764c4a)
- [x] Task: Verify that components consuming snapshots still compile and behave correctly.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Types.ts' (Protocol in workflow.md)

## Phase 3: Type Safety - App.tsx & Global Audit [checkpoint: 3689a35]
- [x] Task: TDD - Refactor `LanguageSync` in `App.tsx` to use `AppSettings` and remove `any`. (2940d9a)
- [x] Task: Identify and replace other `any` usages in `App.tsx`. (Fixed App.tsx and config.ts)
- [x] Task: Perform global search for `any` in `src/` and fix high-priority instances (e.g., event handlers, context values).
- [x] Task: Run `npx tsc --noEmit` to verify type integrity.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Global Types' (Protocol in workflow.md)

## Phase 4: Final Verification
- [ ] Task: Run full regression test suite.
- [ ] Task: Verify production build (`npm run build`).
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Polish' (Protocol in workflow.md)
