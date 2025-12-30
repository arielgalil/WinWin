# Specification: UI Polish and Layout Cleanup

## Overview
This track focuses on refining the user interface across several key areas: standardizing the footer layout, adding a real-time visual preview for branding settings, improving the emoji selection workflow, and removing redundant UI elements in the management interface.

## Functional Requirements

### 1. Footer Rebuild & Refinement
- **Objective:** Standardize spacing and remove decorative lines.
- **Requirement:** Completely rebuild the footer layout to ensure perfectly uniform spacing between the logo, navigation text, and action icons.
- **Requirement:** Remove all horizontal/vertical lines within the footer area.
- **Requirement:** Ensure the layout remains responsive and centered on mobile devices.

### 2. Branding Visual Preview
- **Objective:** Provide immediate visual feedback for brand color and background selections.
- **Requirement:** Implement a floating preview card (likely in the Admin Settings).
- **Requirement:** The card must show a "Sample Title" using the selected "Brand Palette" (Primary and Secondary colors).
- **Requirement:** The card's background must match the currently selected competition background.
- **Requirement:** The preview must update in real-time as settings are modified.

### 3. Emoji Selection Workflow
- **Objective:** Improve the "Insert Emoji" interaction within the target edit modal.
- **Requirement:** Change the "Insert Emoji" trigger to open a non-dimming popover instead of a centered modal.
- **Requirement:** Position the popover near the target input field.
- **Requirement:** Ensure the popover does not obscure critical parts of the edit modal.

### 4. Management Tab Cleanup
- **Objective:** Remove redundant interface sections.
- **Requirement:** Locate the "Scoring and Group Management" tab.
- **Requirement:** Remove the entire second/bottom half of the tab that currently duplicates the functionality of the first half.

## Acceptance Criteria
- Footer spacing is visually uniform across all screen sizes.
- No decorative lines are visible in the footer.
- The branding preview card correctly reflects color and background changes instantly.
- Emoji selection opens as a popover without dimming the background.
- The "Scoring and Group Management" tab contains only one instance of the management interface.

## Out of Scope
- Modifying the actual scoring logic or data structures.
- Changing the Public Scoreboard styling.
