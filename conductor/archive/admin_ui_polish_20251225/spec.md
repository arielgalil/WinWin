# Track Specification: Admin UI Polish & Score Formatting

## Overview
This track focuses on refining the Admin Panel's user interface and ensuring global consistency in data presentation. It addresses translation gaps, usability issues, RTL score formatting, visual consistency of admin cards, and strict theme enforcement based on user preference.

## Functional Requirements

### 1. Classes & Students Management (ניהול קבוצות ותלמידים)
*   **Translation Audit:** Comprehensive review of the "Classes Manager" tab. Ensure all static text (headers, buttons, placeholders, tooltips, empty states) is replaced with dynamic `i18n` keys from `he.ts` / `en.ts`.
*   **Verification:** Ensure no hard-coded Hebrew or English strings remain in `ClassesManager.tsx` or its sub-components.

### 2. Goals Management (ניהול יעדים)
*   **Button Spacing:** Increase the visual margin/gap between the "Edit" (Pencil) and "Delete" (Trash) buttons on Goal Cards to prevent accidental clicks. This change applies to both Desktop and Mobile views to ensure consistency across the entire Admin Panel.
*   **Safety:** Ensure the Delete button maintains its distinct red styling.

### 3. Global Score Formatting
*   **RTL Enforcement:** Identify all instances where positive score changes are displayed.
*   **Format Change:** Change the display format from `+100` (LTR) to `100+` (RTL) to align with the Hebrew interface direction.
*   **Implementation:** This should ideally be handled by a utility function or component (e.g., `FormattedNumber`) to ensure consistency across the app.

### 4. Theme Preference Enforcement
*   **Override System Preference:** The application must ignore the browser/OS system theme (light/dark mode).
*   **User Choice Priority:** The theme must be determined *solely* by the user's selection within the application settings (if available) or default to a specific theme if not set, but never automatically switch based on the OS.
*   **Persistence:** Ensure the chosen theme persists across reloads (e.g., via `localStorage`).

## Visual Design Requirements (UI Unification)

### 5. Admin Card Standardization
*   **Scope:** All main sections within Admin Panel tabs.
*   **Standard Container:** Every major management section must be wrapped in a consistent "Card" container with uniform background, border, and shadow.
*   **Standard Header:** Every card must have a header section containing:
    *   **Icon:** A relevant icon.
    *   **Title:** A clear, bold title.
    *   **Description:** A subtitle/description.
    *   **Visual Separator:** A consistent separator between the header and content.

## Acceptance Criteria
*   "Classes & Students Management" tab is fully localized.
*   Delete/Edit buttons in "Goals Management" have sufficient spacing on all devices.
*   Positive scores display as `100+` (plus on the left).
*   App theme is strictly controlled by user setting, ignoring OS preferences.
*   All Admin tabs share a visually identical card structure with Headers, Icons, and Descriptions.
