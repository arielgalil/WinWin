# Track Specification: Admin Panel UI/UX & Security Improvements

## Overview
This track focuses on refining the Admin Panel's user interface for better localization, brand consistency, and hierarchical security. It addresses specific visual misalignments, incorrect labeling, and critical permission gaps in user management.

## Functional Requirements

### 1. Localization & Branding (Header)
- **Label Correction:** Change the "Administrator" string in the header to "מנהל תחרות" (Competition Manager).
- **Dynamic Title:** Replace the "Admin Console" text with the actual name of the competition.
- **Logo Integration:**
    - Replace the placeholder icon (purple square with white circle) with the competition logo.
    - **Behavior:** This logo element must be static and non-interactive (remove the "back to competition" button functionality).

### 2. Settings & Visuals
- **Logo Preview:** In the Settings/Configuration modal, ensure that the uploaded/selected logo is displayed within a circular container (clip-path or border-radius).

### 3. User Management (Staff Table)
- **Security Logic:** Implement a check to prevent lower-level users from editing or deleting users with higher roles.
    - **Specific Rule:** A Competition Manager (מנהל תחרות) cannot edit or delete a Super Admin (משתמש על).
- **UI Logic:** For rows representing a Super Admin, the "Edit" and "Delete" action buttons must be completely hidden if the current user is not also a Super Admin.
- **Alignment:** Ensure all "Edit" buttons in the staff table are perfectly aligned vertically within their column.

### 4. Groups Management (Groups Table)
- **Button Positioning:** Move the "Manage Students" button to appear immediately after the "Student Count" display.
- **Icon Update:** Change the button's icon from a "plus" (+) icon to a "group/users" icon (e.g., `Users` or `UserGroup` from Lucide).

## Non-Functional Requirements
- **RTL Support:** Ensure all layout changes (button positioning and alignment) respect the project's RTL (Right-to-Left) direction.
- **Consistency:** Use existing UI components (e.g., `AdminTable`, `Logo`) where applicable to maintain design system integrity.

## Acceptance Criteria
- [ ] Header displays "מנהל תחרות" and the competition name.
- [ ] Header logo is the competition logo and is not clickable.
- [ ] Settings logo preview is circular.
- [ ] In the Staff table, Super Admin rows do not show action buttons to non-Super Admin users.
- [ ] Staff table edit buttons are vertically aligned.
- [ ] Groups table "Manage Students" button has the correct icon and position.

## Out of Scope
- Refactoring the entire permissions system (Roles should stay as they are defined).
- Modifying the Public Scoreboard.