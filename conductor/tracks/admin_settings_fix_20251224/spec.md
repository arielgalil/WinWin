# Track Specification: Fix Admin Settings Route Duplication

## Overview
The application currently contains two routes that appear to serve the same "School Settings" purpose: `#/admin/xv0u8j/school` and `#/admin/xv0u8j/settings`. The `.../school` route is problematic and potentially crashing, while `.../settings` is the correct, functioning route. This track aims to eliminate this duplication by removing the problematic route, updating all application links to point exclusively to the correct settings page, and ensuring full Hebrew localization.

## Functional Requirements
1.  **Route Consolidation:**
    -   Remove the route definition for `.../school` from the main router configuration.
    -   Ensure `.../settings` is the single source of truth for the School Settings page.

2.  **Global Link Updates:**
    -   Update **Admin Sidebar/Navigation**: Change any links pointing to `school` to point to `settings`.
    -   Update **Leaderboard/Public Views**: If there are admin links (e.g., "Edit" or "Config"), ensure they point to `settings`.
    -   Update **Super Admin Panel**: Ensure any "Manage School" links redirect to the correct `settings` route.
    -   Update **Dashboard/Home**: Check for any shortcuts or buttons linking to the old route.

3.  **Localization:**
    -   Audit the `settings` page and all updated navigation elements.
    -   Ensure all text strings are fully translated into Hebrew using the project's i18n system.

4.  **Verification:**
    -   Clicking "Settings" (or equivalent) from any part of the app must successfully load `#/admin/xv0u8j/settings`.
    -   The application must no longer crash or error when accessing settings.

## Non-Functional Requirements
-   **Code Quality:** Ensure no dead code (e.g., unused components specific to the old route) remains.
-   **UX Preservation:** The user experience within the Settings page itself should remain unchanged.

## Out of Scope
-   Refactoring the internal logic of the Settings page itself (unless required to fix the route binding).
