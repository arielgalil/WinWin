# Implementation Plan: Decompose and Clean up App.tsx

This plan outlines the steps to simplify `App.tsx` by extracting components, consolidating providers, and refactoring permissions logic.

## Phase 1: UI Component Extraction
- [x] Task: TDD - Create `LoadingScreen` component in `src/components/ui/LoadingScreen.tsx`. [0c847a0]
- [x] Task: TDD - Create `ErrorScreen` component in `src/components/ui/ErrorScreen.tsx`. [0c847a0]
- [x] Task: Update `App.tsx` to import and use the extracted components. [0c847a0]
- [ ] Task: Conductor - User Manual Verification 'Phase 1: UI Extraction' (Protocol in workflow.md)

## Phase 2: Provider Consolidation
- [ ] Task: TDD - Create `AppProviders` wrapper in `src/contexts/AppProviders.tsx`.
- [ ] Task: Update `index.tsx` to wrap `App` with `AppProviders`.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Provider Consolidation' (Protocol in workflow.md)

## Phase 3: Permission Logic Refactoring
- [ ] Task: TDD - Create `useAuthPermissions` hook in `src/services/useAuthPermissions.ts`.
- [ ] Task: Integrate `useAuthPermissions` into `App.tsx` and remove inline logic.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Permission Logic' (Protocol in workflow.md)

## Phase 4: Final Polish & Cleanup
- [ ] Task: Remove redundant imports and unused code from `App.tsx`.
- [ ] Task: Run full test suite and verify build.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Polish' (Protocol in workflow.md)
