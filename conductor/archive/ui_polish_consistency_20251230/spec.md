# Specification: UI Polish and Theming Synchronization

## Overview
This track focuses on refining the visual consistency, accessibility, and user interaction across the WinWin platform. Key areas include standardizing typography, ensuring full theme compatibility for modals, preventing unwanted selection/dragging of UI elements, and providing professional placeholders for missing assets.

## Functional Requirements

### 1. Typography Standardization
- Define and implement a unified 5-level font size hierarchy throughout the Admin interface and Quick Input screens.
- **Level 1 (H1 - Main Headings):** Large and prominent, used once per page (e.g., top of main tabs). Target: 32px-48px (responsive).
- **Level 2 (H2 - Sub-headings):** Divides content into major topics (e.g., dashboard sections). Target: 24px-32px (responsive).
- **Level 3 (H3 - Sub-sub-headings):** For detail within sections. Target: 18px-24px (responsive).
- **Level 4 (Body Text):** Standard reading size, prioritized for legibility. Target: 16px-18px.
- **Level 5 (Small/Caption):** Secondary text for notes, metadata, or image descriptions. Target: 12px-14px.
- **Implementation Principles:**
  - Use a modular scale (e.g., 1.25 ratio) for harmonic transitions.
  - Use `rem` units for better accessibility.
  - Limit font weights to 2-3 (e.g., Light, Regular, Bold).
  - Ensure WCAG AAA contrast and minimum 16px for body text.
- **Responsiveness:** Font sizes must adjust appropriately for mobile vs. desktop to prevent awkward word breaks.
- **Implementation:** Use CSS variables in `src/index.css` or Tailwind's theme configuration for centralized control.

### 2. Modal Theme Compatibility
- Audit all modal windows (`AdminPanel`, `SuperAdminPanel`, `TeacherInput`, etc.).
- Ensure modals correctly adapt to Light, Dark, and System modes.
- Borders, backgrounds, and text colors within modals must adhere to the defined theme guidelines (e.g., green tint for edits, red for destructive actions).

### 3. UI Element Selection & Dragging
- Prevent icons, logos, and user avatars from being selectable or draggable across the entire application.
- This applies to:
  - Header Logo
  - Sidebar Icons
  - User Avatars
  - Action Button Icons
- **Implementation:** Use `select-none` and `pointer-events-none` (where appropriate) or `draggable="false"`.

### 4. Target Reward Image Placeholder
- When "Image" is selected as a target reward but no image is uploaded, display a professional placeholder.
- The placeholder must match the size and position of the intended image preview.
- **Visual Style:** A stylized "Photo" icon within a dashed border, accompanied by a "No image uploaded" message in Hebrew.
- **Constraint:** Replace the "image not loaded" error state with this clean placeholder.

## Non-Functional Requirements
- **Consistency:** Ensure the new typography variables are used everywhere to avoid "one-off" font sizes.
- **RTL Support:** All typography and placeholder layouts must be perfectly aligned for RTL.
- **Performance:** CSS-based solutions for non-selectability/non-draggability to avoid JavaScript overhead.

## Acceptance Criteria
- [ ] Main headings in all Admin tabs have a uniform, responsive font size.
- [ ] Sub-tab titles have a uniform, responsive font size.
- [ ] All other text in the interface follows a single base font size.
- [ ] All modals (Edit, Delete, Settings) look correct in both Light and Dark modes.
- [ ] The header logo, avatars, and sidebar icons cannot be selected or dragged.
- [ ] Selecting "Image" target reward without an upload displays the stylized placeholder instead of an error.
- [ ] No regression in RTL layout or functionality.

## Out of Scope
- Redesigning the core navigation structure.
- Modifying the Public Scoreboard visual logic (per general guidelines).
