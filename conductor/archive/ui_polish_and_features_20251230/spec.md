# Specification: UI/UX Polish and Feature Enhancement

## 1. Overview
This track combines a series of UI/UX bug fixes, visual polish improvements, and minor feature enhancements across the Admin Panel and Dashboard to improve usability and visual consistency.

## 2. Functional Requirements

### 2.1 Core Functionality
1.  **Competition-Specific Login:** When a user clicks "Manage" or "Score" for a specific competition, the application MUST pass the corresponding `campaign` object to the login route and display the campaign's name and logo. The logo MUST have a white background for visibility.
2.  **Music Preview:** In the "Background Music & Atmosphere" settings, a "Play/Pause" button MUST be added to allow admins to preview the selected YouTube music.
3.  **Translation:** The missing translation for `tip_atmosphere_title` and its description MUST be added to the appropriate translation files.

### 2.2 UI/UX Adjustments & Bug Fixes
1.  **Prize Emoji Size:** In the Mission Meter, when a prize is an emoji, its font size MUST be increased to fill more of the prize container.
2.  **Stage Progress Bar:** The vertical height of the stage progress bars (`GoalCard` component) MUST be reduced.
3.  **Footer Icon Spacing:** The vertical padding (margin/padding above and below) for the footer icons MUST be reduced.
4.  **Admin Sidebar Hover Effect:** A hover effect MUST be added to the navigation items in the Admin Panel's sidebar.
5.  **Admin Header Hover Effects:** A hover effect MUST be added to the "Refresh," "Share," and "Theme Toggle" buttons in the Admin Panel header.
6.  **Light Mode Avatar:** The user avatar circle in the Admin header MUST have a visible border or background in light mode to ensure it's not invisible on a white background.
7.  **AI Keyword Button:** The "+" icon inside the "Add Keyword" button in the AI settings MUST be horizontally centered.
8.  **AI Summary Box:** The text container for the AI-generated summary in the "Activity Log & AI" tab MUST automatically expand to fit its content without requiring a scrollbar.
9.  **Admin Panel Card Width:** The main content cards in the "Points & Group Status" tab MUST be adjusted to match the width and layout of cards in other admin tabs for consistency.
