# Specification - Fix Hebrew Translations and Login Branding

## Overview
This track addresses two distinct UI/UX issues:
1.  **Missing Translations:** Several keys in the "Data Management" and "Team Management" sections of the Admin Panel lack Hebrew translations, causing raw keys or incorrect text to appear.
2.  **Branding Inconsistency:** The login page occasionally reverts to a generic "Sprout" branding instead of the campaign-specific branding, likely due to routing or data fetching issues when a slug is present.

## Functional Requirements

### 1. Hebrew Translations
- Add missing keys to `src/utils/translations/he.ts` for `DataManagement.tsx` and `UsersManager.tsx`.
- Keys to include:
    - `full_backup_desc`
    - `structure_backup_desc`
    - `settings_backup_desc`
    - `staff_backup_desc`
    - `users_management_title`
    - `users_management_desc`
    - `bulk_import`
    - `update_error_msg`
- Ensure consistency between `he.ts` and `en.ts`.

### 2. Login Branding & Redirects
- **Branded Login Enforcement:** When a `slug` is present in the URL (e.g., `/login/:slug`), the `LoginRoute` must wait for campaign/settings data before rendering `LiteLogin`.
- **Redirect Fixes:** Ensure `ProtectedRoute` and other navigation points correctly preserve or include the `slug` when redirecting to login.
- **Race Condition Fix:** Prevent the "Access Denied" error screen from flashing if the user is logged in but campaign role data is still loading.

## Acceptance Criteria

### Translations
- [ ] All buttons and labels in the Data Management section are in Hebrew.
- [ ] The Team Management section (Users) has Hebrew headers and buttons.

### Branding
- [ ] Navigating to `/admin/:slug` while logged out correctly redirects to `/login/:slug` with proper branding.
- [ ] The login page displays the campaign name, logo, and colors when a slug is present.
- [ ] No "Generic" branding flash when navigating to a branded login page.

## Out of Scope
- Adding new functional features to Data Management or Login.
- Changes to the Super Admin panel translations (unless overlapping).
