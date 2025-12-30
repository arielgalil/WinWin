# Plan: Modal-Based Entity Editing

Implementation of focused modal dialogs for all entity editing across the Admin Panel, standardizing the UI with a green-themed "ConfirmationModal" style.

## Phase 1: Shared Infrastructure & UI Refinement [checkpoint: b572c87]
Standardize the modal pattern and ensure the `AdminButton` and dialog components are ready.

- [x] Task: Create or Refine `EditEntityModal` wrapper component based on `ConfirmationModal` structure. b572c87
- [x] Task: Conductor - User Manual Verification 'Phase 1: Shared Infrastructure' (Protocol in workflow.md)

## Phase 2: Groups & Students (ClassesManager) [checkpoint: 436ms_pass]
Transition group and student editing to modals.

- [x] Task: Write tests for `ClassesManager` modal editing flow.
- [x] Task: Implement modal editing for Groups (Classes).
- [x] Task: Implement modal editing for Students list.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Groups & Students' (Protocol in workflow.md)

## Phase 3: Team Members (UsersManager) [checkpoint: 320ms_pass]
Transition staff/user editing to modals.

- [x] Task: Write tests for `UsersManager` modal editing flow.
- [x] Task: Implement modal editing for Team Members.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Team Members' (Protocol in workflow.md)

## Phase 4: Ticker Messages (MessagesManager) [checkpoint: 300ms_pass]
Transition ticker message editing to modals.

- [x] Task: Write tests for `MessagesManager` modal editing flow.
- [x] Task: Implement modal editing for Ticker Messages.
- [x] Task: Conductor - User Manual Verification 'Phase 4: Ticker Messages' (Protocol in workflow.md)

## Phase 5: Goals & Stages (GoalsManager) [checkpoint: 337ms_pass]
Transition institutional goals and stages editing to modals.

- [x] Task: Write tests for `GoalsManager` modal editing flow.
- [x] Task: Implement modal editing for Goals/Stages.
- [x] Task: Conductor - User Manual Verification 'Phase 5: Goals & Stages' (Protocol in workflow.md)
