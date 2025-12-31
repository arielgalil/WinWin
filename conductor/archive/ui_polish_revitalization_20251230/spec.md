# Specification: UI Polish, Admin Experience & Visual Revitalization

## Overview
This track addresses UI/UX regressions in the Admin Panel and Competition Selection screen. It focuses on localization (LTR), design consistency, persistence, and restoring the vibrant visual identity of the platform.

## Functional Requirements

### 1. Localization & Layout
- **Global LTR Support:** When the language is set to English, the layout must reverse to LTR.
    - Root/Container `dir="ltr"` attribute.
    - Usage of Tailwind logical properties (`ps`, `pe`, `ms`, `me`, `start-0`, `end-0`).
- **AI Summary Copy Button:** Support wrapping in the "AI Summary & Analysis" tab. If space is limited, the button moves to the next line and aligns to the **end** of the container.

### 2. Consistency & Design System
- **Delete Button Safety:** In "Competition Team Management" and "Classes & Students Management", the Delete button must be separated from Edit with a distinct margin (`ml-6` RTL / `mr-6` LTR).
- **Edit Students Button:** Standardize to "Standard Dashboard Action" style (consistent background, rounded corners, padding).
- **Icon Frames:** Correct frames for "Export & Backup", "Data Restore", and "Danger Zone" to be consistent rounded squares.
- **Logo Backgrounds:** Backgrounds for all logos must NOT be affected by theme (Light/Dark). They must remain a fixed **soft white-gray** (`#f8fafc` or similar).

### 3. Persistence & Utilities
- **Sidebar Persistence:** Sidebar state (open/collapsed) must be saved in **LocalStorage**.
- **Theme Toggle:** Add a Light/Dark mode toggle in the footer, **end-aligned**.

### 4. Visual Revitalization
- **Competition Selection Screen:** Restore vibrancy and color.
    - **Dynamic Backgrounds:** Each competition card should use a vibrant background color from the system's palette.
    - Ensure the screen feels "alive" and consistent with the platform's high-energy brand.

### 5. Content & Translations
- **English Translation File:** Add missing translations for:
    - Data Management & Backup, Backup Management, Data Export, System Reset, Competition Team Management, Administrators and Teachers Management, Participating in the Competition.

## Acceptance Criteria
- [ ] Language switch to English flips layout to LTR correctly.
- [ ] Sidebar state persists across refreshes.
- [ ] Delete buttons have the required safety margin.
- [ ] "Edit Students" button styling matches the dashboard theme.
- [ ] Competition selection cards are colorful and vibrant.
- [ ] Theme toggle exists in footer and works correctly.
- [ ] Logo backgrounds remain light/neutral regardless of theme.
- [ ] English translations are fully implemented for specified keys.
