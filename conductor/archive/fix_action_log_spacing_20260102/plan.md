# Plan - Fix Spacing in Activity Log & AI

This plan addresses the spacing issue in the "Activity Log & AI" tab by restoring standard header padding to the "Action History" card while maintaining an edge-to-edge layout for the table itself.

## Phase 1: Implementation of Spacing Fix

### Task 1: Research and Test Setup
- [x] Create failing test in `src/components/admin/__tests__/ActionLogPanelSpacing.test.tsx`
- [x] Run the test and confirm failure.

### Task 2: Refactor ActionLogPanel.tsx
- [x] Remove `!p-0` from the `AdminSectionCard` with title `t('activity_history_title')`.
- [x] Apply `-mx-4 sm:-mx-6` to the `div` immediately wrapping the `table` inside that card.
- [x] Ensure the container also has `overflow-x-auto` to handle mobile scrolling correctly with the negative margins.
- [x] Verify that the header (icon and title) now inherits the default padding from `AdminSectionCard`.

### Task 3: Verification
- [x] Run `npm test src/components/admin/__tests__/ActionLogPanelSpacing.test.tsx` and confirm it passes.
- [x] Run all tests in `src/components/admin/__tests__/ActionLogPanel.test.tsx` to ensure no functional regressions.
- [x] Run `npm run lint` to check for styling issues.
- [x] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

[checkpoint: ]
