# Track Specification: Standardize Delete Actions and Safety UI

## 1. Overview
This track aims to enhance the safety and visual consistency of destructive actions (deletion) across the Admin Panel. It focuses on preventing accidental deletions through improved button spacing, mandatory confirmation dialogs with clear "danger" signifiers, and a strict "Anti-Nudge" design for confirmation buttons.

## 2. Functional Requirements

### 2.1 Standardized Delete Buttons (Trigger)
*   **Context:** Applies to Admin Tables (Students, Classes, Logs) and Action Cards (Messages).
*   **Spacing:** Implement a distinct visual gap (increased whitespace) between the Delete button and other row actions (Edit, Duplicate, etc.) to minimize "mis-clicks".
*   **Appearance:** Ensure all delete buttons use the reddish-tint standard defined in the project guidelines (`text-red-600`, reddish background on hover).

### 2.2 Dangerous Action Confirmation (Modals)
*   **Mandatory Confirmation:** Every delete action MUST trigger a confirmation modal. No direct deletion is allowed.
*   **Visual Safety Signifier:** Modals triggered by a delete action MUST feature a clear **red border** around the entire modal container.
*   **Dynamic Action Label:** The confirmation button must explicit state the action (e.g., "מחק תלמיד", "מחק כיתה") instead of a generic "אישור".

### 2.3 Anti-Nudge Button Design (Critical UX)
*   **Visual Equality:** Inside the delete modal, the "Delete" and "Cancel" buttons must be **visually equal** in prominence.
    *   **No Highlighting:** Do not make the Delete button bigger, brighter, or bolder than the Cancel button.
    *   **Goal:** Force the user to read the text rather than clicking the "big shiny button".
    *   **Implementation:** Use identical styling (e.g., both outline or both subtle fill) for both buttons, differentiated only by text content and potentially a neutral vs. danger hover state.

## 3. UI/UX Standards
*   **Consistency:** The red border and equal-button layout must be uniform across all delete modals.
*   **RTL Compliance:** Button ordering follows standard RTL (Confirm Right, Cancel Left).

## 4. Acceptance Criteria
*   [ ] Admin tables show a noticeable gap before the delete button.
*   [ ] Every delete button opens a modal with a red border.
*   [ ] Confirmation buttons (Delete/Cancel) look visually equal (same size/weight).
*   [ ] Confirm button text is specific (e.g., "מחק תלמיד").
