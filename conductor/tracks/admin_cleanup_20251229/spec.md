# Specification: Localization Audit and Admin Code Cleanup

## Overview
Following the transition to modal-based editing, this track aims to ensure 100% localization compliance within the new modals and perform a comprehensive cleanup of the Admin Panel components. We will eliminate redundant state, dead logic, and unused assets that remained after the refactor.

## Functional Requirements
1.  **Localization Audit:**
    *   Review all new Edit Modals (Groups, Students, Users, Ticker Messages, Goals) for hard-coded strings.
    *   Ensure all labels, placeholders, and buttons are mapped to `t()` function calls.
    *   Verify that dynamic strings (e.g., error messages or success toasts) within these modals are properly translated in both `he.ts` and `en.ts`.
2.  **Broad Code Cleanup (src/components/admin/):**
    *   **State Removal:** Strip out unused state variables (e.g., `editingId`, `isEditingRow`, `tempValue`) that were previously used for inline editing.
    *   **Logic Removal:** Delete orphaned event handlers and helper functions that were replaced by the modal workflow.
    *   **Translation Purge:** Audit `he.ts` and `en.ts` to remove keys that are no longer referenced anywhere in the codebase.
    *   **Asset Cleanup:** Remove unused imports, icons, and legacy Tailwind classes that became redundant after the UI unification.

## Non-Functional Requirements
*   **Maintainability:** Improve code readability by reducing component complexity and file size.
*   **Performance:** Slightly reduce bundle size by removing dead code and unused translation keys.
*   **Type Safety:** Ensure all component props and state remain correctly typed after the cleanup.

## Acceptance Criteria
- [ ] No hard-coded strings remain in the `src/components/admin/` directory.
- [ ] All 5 new Edit Modals function correctly with full localization support.
- [ ] Unused inline editing residues (state/handlers) are removed from all Manager components.
- [ ] `he.ts` and `en.ts` are free of orphaned translation keys.
- [ ] The project builds and passes type checking (`tsc`) without regression errors.

## Out of Scope
*   Adding new features or changing UI behavior established in previous tracks.
*   Modifying the public-facing Dashboard or non-admin components.
