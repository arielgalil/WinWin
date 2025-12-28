# Specification: UI/UX Polish & Admin Enhancements

## Overview
A collection of UI/UX improvements focused on the Admin Panel, including layout fixes for RTL, mobile responsiveness in Goal Management, header enhancements (Logo/Profile), and standardizing score displays across the application.

## Functional Requirements

### 1. Header Enhancements (Admin Panel)
- **Institution Logo:** Add a placeholder or dynamic logo container to the top-right of the Admin Panel header.
- **User Profile (Top Left):**
    - Display the user's **Full Name** instead of just the initial or email start.
    - Display the user's **Role** (e.g., "מורה", "מנהל תחרות", "משתמש על") directly below the name.

### 2. RTL & Formatting Fixes
- **Group Selection Dropdown:** Audit the dropdown arrow alignment in "Score & Group Status". Ensure the arrow is visually on the left in RTL mode.
- **Goals Tab Number Order:** Correct the display of personal/group goals to visually read "Current / Total" (e.g., `5,765 / 7,000`). Ensure the separator and numbers don't flip incorrectly in RTL.
- **Score Display Audit:** Global check of the application to ensure all score/point displays (positive and negative) utilize the dedicated `ScoreDisplay` component (or equivalent) for consistent RTL styling.

### 3. Feature Enhancements & Mobile
- **Data Management Icons:** Add "Download" icons (Lucide `Download`) to all export/backup cards or tabs.
- **Goal Management Mobile Fix:** 
    - Fix the overflow issue in the "Add Institutional Goal" section.
    - Break the layout into two vertical rows on mobile screens to prevent the "פרס הסיום" (End Prize) area from cutting off.

## Non-Functional Requirements
- **Responsive Design:** All changes must be tested on mobile (iPhone/Safari) and desktop.
- **Visual Consistency:** Use existing Tailwind colors and Lucide icons.

## Acceptance Criteria
- [ ] Admin header shows Institution Logo (Right) and Full Name/Role (Left).
- [ ] Dropdown arrow in Group Selection is correctly aligned for RTL.
- [ ] Goal progress displays as `Current / Total` with correct spacing.
- [ ] All score displays use a unified styling component.
- [ ] Goal creation form is fully visible and usable on mobile (no horizontal overflow).
- [ ] Download cards in Backup section have visible download icons.

## Out of Scope
- Backend changes for user profile data (assuming data is available in `AuthContext`).
- Changing the Public Scoreboard layout.
