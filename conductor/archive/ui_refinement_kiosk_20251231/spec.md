# Specification: UI Refinements & Kiosk Rotation System

## Overview
This track addresses mobile UI regressions, refines the Gemini API status interaction, and introduces a "Kiosk Rotation" feature to cycle the Public Scoreboard with external websites.

## Functional Requirements

### 1. Admin UI Refinements
- **Branding Preview (Mobile):** 
    - Fix background shifting/changing during scroll.
    - Ensure all colors are visible in the demo square.
    - Implement a fixed-size, touch-friendly color selection square.
- **Tab Layout Polish:**
    - Ensure a horizontal line exists in each tab.
    - **Constraint:** Zero vertical space between the horizontal line and the cards/content below it.
- **Gemini API Status Button:**
    - Rename button to: **"Check connection"** (בדוק חיבור).
    - **Self-Contained Result:** The success ("Connection OK") or error message must be displayed *within* the button itself, replacing or appending to the text.
    - **Fixed Dimensions:** The button must be sized appropriately from the start to accommodate both the initial text and potential result messages (success or short errors) without layout shifting.
- **PWA Assets:** Fix the issue preventing replaced app icons from updating.

### 2. Kiosk Rotation Feature (Public Scoreboard & Admin)
- **External Site Config:** Add Admin settings to manage a list of external URLs and display durations.
- **Cyclic Display:** The Public Scoreboard will automatically cycle between the game board and configured external sites.
- **Smooth Transitions:** Implement a "swipe" animation (entire screen slides aside) for transitions.
- **Embed Mechanism:** Utilize a robust method (e.g., iframe) to display external sites within the rotation.

## Non-Functional Requirements
- **Layout Stability:** No layout shifts when the API button updates its state.
- **RTL Integrity:** Horizontal lines and animations must align with Hebrew RTL standards.

## Acceptance Criteria
- [ ] Branding preview is stable and touch-friendly on mobile.
- [ ] Horizontal lines in tabs have zero margin to the content below.
- [ ] "Check connection" button displays results internally without separate notifications.
- [ ] Public Scoreboard successfully rotates through external sites with a swipe animation.
- [ ] App icons are updated to the latest versions.
- [ ] Gemini API connectivity is verified.
