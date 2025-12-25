# Track Specification: Standardize Delete Modals

## Overview
This track addresses the inconsistency in design and behavior of delete confirmation modals across the application. The goal is to standardize all delete modals to match the approved design and behavior currently implemented in the "ניהול יעדים" (Goals Management) tab. This will ensure a uniform and predictable user experience for all destructive actions.

## Functional Requirements
1.  **Scope:** All delete confirmation modals throughout the application must be updated. This includes, but is not limited to, modals for Users, Classes, Messages, Score Presets, Action Logs, and any other entity with a delete function.
2.  **Standardization Source:** The delete modal found in the "ניהול יעדים" (Goals Management) tab will serve as the reference for design and behavior.
3.  **Content Consistency:**
    *   Modal title and message content must be consistent with the reference, utilizing clear, explicit wording.
    *   Messages should support dynamic content (e.g., entity name) where applicable.
4.  **Behavior Consistency:**
    *   All delete buttons, when clicked, must open a confirmation delete modal.
    *   The confirmation flow (confirm, cancel) must be identical to the reference modal.

## Non-Functional Requirements
1.  **Visual Styling:** All standardized delete modals must adhere to the visual styling of the reference modal, specifically:
    *   Red container border.
    *   "Anti-Nudge" buttons (Delete and Cancel visually equal in weight/color).
    *   Use of appropriate icons (e.g., Lucide React `TrashIcon` for delete).
    *   Adherence to `Reddish tint` for delete actions as per `product-guidelines.md`.
2.  **Accessibility:**
    *   Implement focus trapping within modals to ensure keyboard navigation remains logical, as per `product-guidelines.md`.
    *   Ensure all interactive elements meet WCAG AAA (Minimum AA) compliance standards, especially regarding touch targets (minimum 44x44px for mobile).
3.  **Localization (i18n):** All modal labels, buttons, and messages must be pulled from global translation files (`he.ts`, `en.ts`), ensuring no hard-coded text strings remain. This aligns with `product-guidelines.md`.
4.  **Code Reusability:** Favor reusing an existing generic `ConfirmationModal` component (if one exists and meets requirements) or creating a new reusable component to avoid code duplication.

## Acceptance Criteria
-   All delete actions across the application trigger a confirmation modal.
-   All delete confirmation modals match the visual design and interactive behavior of the delete modal in the "ניהול יעדים" tab.
-   All text within the delete modals is localized via the i18n system.
-   Keyboard navigation and focus management work correctly within the delete modals.
-   No new regressions are introduced to existing delete functionalities.

## Out of Scope
-   Changes to the core delete logic (e.g., database operations) unless directly required to integrate with the new modal structure.
-   Refactoring of other modal types (non-delete).
