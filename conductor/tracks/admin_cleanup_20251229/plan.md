# Plan: Localization Audit and Admin Code Cleanup

Comprehensive audit of localization strings in new edit modals and a broad cleanup of redundant state and dead logic within the Admin Panel.

## Phase 1: Localization Audit (Modals & Forms) [checkpoint: ef0b441]
Ensure 100% translation coverage for the new modal-based editing experience.

- [x] Task: Audit `ClassesManager.tsx` and associated modals for hard-coded strings. ef0b441
- [x] Task: Audit `UsersManager.tsx` and associated modals for hard-coded strings. ef0b441
- [x] Task: Audit `MessagesManager.tsx` and associated modals for hard-coded strings. ef0b441
- [x] Task: Audit `GoalsManager.tsx` and associated modals for hard-coded strings. ef0b441
- [x] Task: Conductor - User Manual Verification 'Phase 1: Localization Audit' (Protocol in workflow.md) ef0b441

## Phase 2: Broad Code Cleanup (State & Logic)
Eliminate "residue" from the inline-editing era and remove unused logic.

- [~] Task: Clean up `ClassesManager.tsx` (remove old row-editing state/handlers).
- [ ] Task: Clean up `UsersManager.tsx` (remove redundant state/logic).
- [ ] Task: Clean up `MessagesManager.tsx` (remove legacy reordering/inline residue).
- [ ] Task: Clean up `GoalsManager.tsx` (remove scroll-into-view logic and old card states).
- [ ] Task: Audit and remove unused imports and icons across `src/components/admin/`.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Broad Code Cleanup' (Protocol in workflow.md)

## Phase 3: Translation Purge
Remove deprecated keys from translation files to keep them lean.

- [ ] Task: Identify and remove unused keys in `src/utils/translations/he.ts`.
- [ ] Task: Identify and remove unused keys in `src/utils/translations/en.ts`.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Translation Purge' (Protocol in workflow.md)

## Phase 4: Final Quality Gate
Ensure system integrity after broad deletions.

- [ ] Task: Run full test suite to verify no regressions in admin functionality.
- [ ] Task: Run `npx tsc --noEmit` to ensure type safety after cleanup.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Quality Gate' (Protocol in workflow.md)
