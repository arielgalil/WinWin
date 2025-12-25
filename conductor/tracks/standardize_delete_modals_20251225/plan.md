# Track Plan: Standardize Delete Modals

## Phase 1: Analysis and Component Identification
- [x] Task: Identify the reference delete modal in `GoalsManager.tsx` or `GoalsManagement.tsx`.
    - [x] Subtask: Analyze its structure, props, and styling.
- [x] Task: Identify all delete buttons/triggers in the application that invoke a delete modal.
    - [x] Subtask: For each identified delete button, locate its corresponding modal implementation.
    - [x] Subtask: Document the current design and behavior discrepancies for each modal.
- [x] Task: Assess existing `ConfirmationModal` component (if any) for reusability.
    - [x] Subtask: Determine if the existing component can be adapted or if a new common component is required.
- [x] Task: Conductor - User Manual Verification 'Analysis and Component Identification' (Protocol in workflow.md)

## Phase 2: Implementation - Standardization
- [x] Task: Develop or Refactor a common `ConfirmationModal` component. [fdab77b]
    - [x] Subtask: Write failing tests for the `ConfirmationModal` component covering visual, behavioral, and accessibility requirements. (Red Phase)
    - [x] Subtask: Implement the `ConfirmationModal` component to pass tests, replicating the design and behavior of the reference modal. (Green Phase)
    - [x] Subtask: Refactor the `ConfirmationModal` component (if necessary).
    - [x] Subtask: Verify test coverage for `ConfirmationModal`.
    - [x] Subtask: Commit changes for `ConfirmationModal` component.
- [ ] Task: Integrate the standardized `ConfirmationModal` into each identified delete flow.
    - [ ] Subtask: For each delete flow, replace the existing modal implementation with the new `ConfirmationModal` component.
    - [ ] Subtask: Update `i18n` keys for modal titles, messages, and button labels as needed in `he.ts` and `en.ts`.
    - [ ] Subtask: Ensure dynamic content (e.g., entity name) is correctly passed to the `ConfirmationModal`.
- [ ] Task: Conductor - User Manual Verification 'Implementation - Standardization' (Protocol in workflow.md)

## Phase 3: Testing and Verification
- [ ] Task: Write failing integration tests for key delete flows. (Red Phase)
    - [ ] Subtask: Cover at least one delete flow for Users, Classes, Messages, and Score Presets.
- [ ] Task: Implement integration tests to pass. (Green Phase)
- [ ] Task: Verify overall code coverage.
- [ ] Task: Conductor - User Manual Verification 'Testing and Verification' (Protocol in workflow.md)
