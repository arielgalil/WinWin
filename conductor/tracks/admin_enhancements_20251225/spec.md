# Specification: Admin Panel Enhancements & Fixes (Dec 2025)

## Overview
This track addresses several UI/UX issues within the Admin Panel, fixes the broken AI analysis feature, and introduces a multi-link sharing capability tailored to user roles.

## Functional Requirements

### 1. Goal Editing UX Improvements
- **Visual Consistency:** Change the "Edit Goal" button color to green to match the "Edit" buttons used elsewhere in the application.
- **Smart Scrolling:** When a user clicks the "Edit" button for a specific goal, the page must automatically and smoothly scroll down to the "Edit Area" (where the form is located), as the selection and editing areas are currently far apart.

### 2. AI Summary Restoration
- **Bug Fix:** Investigate and resolve the issue where "AI Summary & Analysis" loads indefinitely without returning a result. This likely involves checking the integration between `AiSettings.tsx` and `geminiService.ts`.

### 3. Multi-Link Share Functionality
- **Dual Versions:**
    - **Super Admin:** Generates a message with: Dashboard link, Scoring link, and Admin Panel link.
    - **Competition Manager:** Generates a message with: Dashboard link and Scoring link (Admin link excluded).
- **Message Template:**
  ```text
  🌱 תחרות מצמיחה - [שם מוסד] - [שם תחרות]
  * לוח התוצאות 🏆 - [קישור]
  * הזנת ניקוד 🧮 - [קישור]
  * ניהול תחרות ⚙️ - [קישור] (Super Admin only)
  שתהיה תחרות [מעצימה/פוריה/מלאת פרגונים] ומצמיחה!
  ```
- **Placement:** Add a "Share" (Copy) button to both the Admin Panel Header and the Mobile (Hamburger) menu.

## Non-Functional Requirements

### 1. UI Unification
- **Settings Tabs:** Ensure all tab items within the "Settings" view have uniform width, creating a balanced and professional layout.

### 2. Light Mode Accessibility (Admin Panel Only)
- **Contrast Audit:** Increase contrast across the entire Admin Panel when in Light Mode.
- **Typography:** Ensure body text is true black (`#000000`) or high-contrast dark gray.
- **Form UI:** Add/Strengthen borders and shadows for input fields to make them clearly distinguishable from the background.
- **Visual Hierarchy:** Ensure clear outlines and boundaries for sections and cards.

## Acceptance Criteria
- [ ] Clicking "Edit" on a goal scrolls the view to the edit form.
- [ ] The Goal Edit button is green.
- [ ] The AI Summary generates a response successfully.
- [ ] All tabs in the Admin Settings have equal widths.
- [ ] Light mode text and inputs are high-contrast and easily readable in the Admin Panel.
- [ ] Super Admin and Competition Manager see their respective versions of the "Copy" message.
- [ ] Share buttons are accessible in both Desktop Header and Mobile Menu.

## Out of Scope
- Modifications to the Public Scoreboard (Public Leaderboard).
- UI changes to the Teacher Quick Input screen (except for global Light Mode variables if they affect it).
