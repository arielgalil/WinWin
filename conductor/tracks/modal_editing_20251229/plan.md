# Plan: Modal-Based Entity Editing

Implementation of focused modal dialogs for all entity editing across the Admin Panel, standardizing the UI with a green-themed "ConfirmationModal" style.

## Phase 1: Shared Infrastructure & UI Refinement
Standardize the modal pattern and ensure the `AdminButton` and dialog components are ready.

- [~] Task: Create or Refine `EditEntityModal` wrapper component based on `ConfirmationModal` structure.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Shared Infrastructure' (Protocol in workflow.md)

## Phase 2: Groups & Students (ClassesManager)
Transition group and student editing to modals.

- [ ] Task: Write tests for `ClassesManager` modal editing flow.
- [ ] Task: Implement modal editing for Groups (Classes).
- [ ] Task: Implement modal editing for Students list.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Groups & Students' (Protocol in workflow.md)

## Phase 3: Team Members (UsersManager)
Transition staff/user editing to modals.

- [ ] Task: Write tests for `UsersManager` modal editing flow.
- [ ] Task: Implement modal editing for Team Members.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Team Members' (Protocol in workflow.md)

## Phase 4: Ticker Messages (MessagesManager)
Transition ticker message editing to modals.

- [ ] Task: Write tests for `MessagesManager` modal editing flow.
- [ ] Task: Implement modal editing for Ticker Messages.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Ticker Messages' (Protocol in workflow.md)

## Phase 5: Goals & Stages (GoalsManager)
Transition institutional goals and stages editing to modals.

- [ ] Task: Write tests for `GoalsManager` modal editing flow.
- [ ] Task: Implement modal editing for Goals/Stages.
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Goals & Stages' (Protocol in workflow.md)
