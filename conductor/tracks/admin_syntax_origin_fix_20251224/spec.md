# Track Specification: Fix Admin Syntax Error and YouTube Origin Mismatch

## Overview
The Admin Panel is currently failing to load due to a JSX syntax error in the `AiSettings.tsx` component. Additionally, the console reports Origin Mismatch warnings related to the YouTube IFrame API integration in `BackgroundMusic.tsx`. This track aims to restore Admin functionality and resolve the console warnings.

## Functional Requirements
1.  **Fix JSX Syntax Error:**
    -   Correct the mismatched closing tag in `components/admin/AiSettings.tsx` (changing `</h3>` to `</h2>` at line 137).
    -   Verify that the component compiles and can be dynamically imported by the `AdminPanel`.

2.  **Resolve YouTube Origin Mismatch:**
    -   Investigate `components/dashboard/BackgroundMusic.tsx`.
    -   Ensure the `origin` parameter passed to the YouTube IFrame API matches the application's current origin (`http://localhost:3000` or the production URL).
    -   Verify that the `postMessage` errors are resolved in the console.

## Non-Functional Requirements
-   **Stability:** Ensure the Admin Panel loads smoothly without triggering the Error Boundary.
-   **Clean Console:** Minimize or eliminate non-essential error/warning noise in the browser developer tools.

## Acceptance Criteria
-   The Admin Panel loads without a 500 Internal Server Error.
-   The AI Settings tab within the Admin Panel renders correctly.
-   The browser console no longer displays the `postMessage` origin mismatch error from `www-widgetapi.js`.

## Out of Scope
-   Feature enhancements to AI Settings or Background Music.
-   Fixing the missing `favicon.ico` (unless it's a trivial path fix).
