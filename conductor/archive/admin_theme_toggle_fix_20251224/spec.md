# Track Specification: Fix Broken Theme Toggle in Admin Panel

## Overview
Users reported that the Light/Dark mode toggle in the Admin Panel is partially broken. While clicking the button updates the internal state (the icon changes), the actual visual design (colors, backgrounds, text) remains unchanged. Refreshing the page does not resolve the issue, suggesting a disconnection between the theme state and the CSS application layer.

## Functional Requirements
1.  **State-to-DOM Synchronization:** Ensure that changing the theme state correctly adds or removes the `dark` class from the root element (typically `<html>` or `<body>`) or updates the relevant CSS variables.
2.  **Immediate Visual Feedback:** The UI must reflect the new theme immediately upon clicking the toggle without requiring a refresh.
3.  **Persistence Integrity:** Verify that the theme preference is correctly read from and saved to storage (e.g., `localStorage`) and applied during the initial app load.
4.  **Admin Panel Scope:** Specifically ensure that the new Unified UI components in the Admin Panel are correctly listening to the theme context.

## Acceptance Criteria
- Clicking the theme toggle in the Admin Sidebar/Header changes the icon.
- Clicking the theme toggle immediately changes the background and text colors of the Admin Panel.
- After a page refresh, the Admin Panel loads with the last selected theme.
- All Admin Panel sub-pages (Users, Classes, Points, etc.) respect the selected theme.

## Technical Notes
- The project uses **Tailwind CSS 4** and **React 19**.
- The theme toggle logic likely resides in `contexts/ThemeContext.tsx` or a similar hook.
- Investigate if the `AdminPanel` or its layout wrapper is missing the theme provider or failing to apply theme-related classes.
