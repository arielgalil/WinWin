# Track Plan: Standardize Delete Actions and Safety UI

## Phase 1: Shared Component Enhancements (TDD) [checkpoint: e72e02e]
- [x] **Task: Update ConfirmationModal for Danger Mode & Anti-Nudge.** (d6ca932)
    - Write tests in `components/ui/__tests__/ConfirmationModal.test.tsx`:
        - Verify red border appears when `isDanger` is true.
        - Verify buttons render with "equal weight" classes (removing primary/secondary distinction in danger mode).
    - Update `components/ui/ConfirmationModal.tsx`:
        - Add logic to render "Anti-Nudge" buttons when `isDanger` is true (both buttons share the same base styling).
        - Apply red border to container.
- [x] **Task: Update AdminRowActions with Separation Logic.** (d366896)
    - Write tests in `components/ui/__tests__/AdminRowActions.test.tsx` verifying the gap logic.
    - Update `components/ui/AdminRowActions.tsx` to add `mr-auto` (or explicit margin) to the delete button to push it away from others in RTL.
- [x] **Task: Add Specific Delete Translations.** (7e3ba68)
    - Update `utils/translations` with specific keys: `delete_student`, `delete_group`, `delete_message`, `delete_log`.
- [x] **Task: Conductor - User Manual Verification 'Shared Component Enhancements' (Protocol in workflow.md)**

## Phase 2: Table Safety Integration
- [ ] **Task: Standardize UsersManager Deletion.**
    - Update `components/admin/UsersManager.tsx`:
        - Use `confirmText={t('delete_student')}`.
        - Enable `isDanger={true}`.
- [ ] **Task: Standardize ClassesManager Deletion.**
    - Update `components/admin/ClassesManager.tsx`:
        - Use `confirmText={t('delete_group')}`.
        - Enable `isDanger={true}`.
- [ ] **Task: Standardize ActionLog Deletion.**
    - Update `components/admin/ActionLogPanel.tsx`.
- [ ] **Task: Conductor - User Manual Verification 'Table Safety Integration' (Protocol in workflow.md)**

## Phase 3: Action Card Safety Integration
- [ ] **Task: Standardize MessagesManager Deletion.**
    - Update `components/admin/MessagesManager.tsx`:
        - Ensure it uses `AdminRowActions` with correct spacing.
        - Configure modal with `confirmText={t('delete_message')}` and `isDanger={true}`.
- [ ] **Task: Conductor - User Manual Verification 'Action Card Safety Integration' (Protocol in workflow.md)**

## Phase 4: Final UI Audit
- [ ] **Task: Global destructive action audit.**
    - Manual pass to ensure "Anti-Nudge" design is effectively implemented and buttons look equal.
- [ ] **Task: Conductor - User Manual Verification 'Final UI Audit' (Protocol in workflow.md)**
