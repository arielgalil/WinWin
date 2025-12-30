# Specification: Modal-Based Entity Editing

## Overview
This track involves transitioning the administrative editing experience from inline forms to focused modal windows. This change will apply to all manageable entities in the Admin Panel, providing a more consistent and distraction-free editing workflow that mirrors the existing deletion safety patterns.

## Functional Requirements
1.  **Modal Transition:**
    *   Replace all inline "Edit" forms with centered modal dialogs.
    *   Applies to: Groups (Classes), Students, Team Members (Users), Ticker Messages, and Goals/Stages.
2.  **Visual Language:**
    *   **Border:** Modals must feature a green border, mirroring the structure and style of the existing `ConfirmationModal` (which uses red for danger).
    *   **Overlay:** Use a standard dimmed (dark) background overlay to focus user attention on the form.
    *   **Buttons:** 
        *   The "Save" button must use the `AdminButton` component with `variant="success"`.
        *   The "Cancel" button must use `variant="ghost"` or `variant="secondary"`.
3.  **Interaction Patterns:**
    *   Clicking "Edit" opens the modal with current values pre-populated.
    *   Clicking "Save" validates input, performs the update via Supabase, closes the modal, and shows a success toast.
    *   Clicking "Cancel" or the overlay closes the modal without saving changes.
    *   Preserve existing validation logic for each entity.

## Non-Functional Requirements
*   **Consistency:** The modal structure and animation must match the `ConfirmationModal` exactly (using `framer-motion` and `Radix UI Dialog`).
*   **Responsiveness:** Modals must be full-width on mobile devices with appropriate padding.
*   **Performance:** Opening the modal should be instantaneous (optimistic state preparation).

## Acceptance Criteria
- [ ] Inline edit rows/cards are removed from all Admin sections.
- [ ] Modals appear centered with a green border when "Edit" is clicked.
- [ ] Forms within modals are correctly mapped to their respective entities.
- [ ] "Save" button is green and triggers a successful update.
- [ ] "Cancel" button safely closes the modal.
- [ ] UI is consistent across all 5 entity types.

## Out of Scope
*   Creating new entities (remains as inline/top-of-page forms for now unless otherwise specified).
*   Refactoring the underlying data services or Supabase schemas.
