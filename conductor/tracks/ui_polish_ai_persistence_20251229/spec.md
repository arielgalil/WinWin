# Specification: UI Polish and AI Summary Persistence

## Overview
This track addresses several UI regressions and enhances the AI summary feature by adding persistence. The goal is to improve visual stability, fix text formatting errors, and reduce unnecessary AI API calls.

## Functional Requirements

### 1. AI Summary Persistence
- **Goal:** Prevent automatic regeneration of the AI summary on every visit.
- **Behavior:** Store the generated summary in the database.
- **Persistence:** The summary must persist across sessions and page refreshes.
- **Interaction:** Add a manual "Regenerate" button to trigger a new summary.

### 2. Placeholder Replacement Fixes
- **Goal:** Fix logic where template placeholders are visible to the user.
- **Target Strings:**
    - "הגעתם יחד לשיא! %{emoji}"
    - "משלב %{stage}!"
    - "%{names} מתקדמים!"
- **Requirement:** Ensure all placeholders are correctly replaced with their intended values before rendering.

### 3. Ticker Formatting
- **Goal:** Clean up the display of asterisk-prefixed messages in the ticker.
- **Requirement:** Convert asterisks (`*`) into visual bullet points (•) or appropriate spacing separators within the ticker display.

### 4. Momentum/Stars UI
- **Goal:** Improve group identification in the "Stars of the Yeshiva" / "Momentum" view.
- **Requirement:** Group names must have a background color that matches the group's assigned color.

### 5. Leading Column Icon Synchronization
- **Goal:** Fix "jumping" behavior where the crown and circle icons move independently.
- **Requirement:** Refactor the crown and circle into a single unified component or container to ensure they animate and move as one coherent unit.

## Acceptance Criteria
- AI summary only updates when the user clicks "Regenerate".
- No `% {placeholder}` text is visible in the UI.
- Ticker shows bullets instead of raw asterisks.
- Group names in the stars view are colored correctly.
- Crown and circle icons in the leading column move without jitter or independent jumping.

## Out of Scope
- Changing the AI summary prompt or model logic (focus is on persistence).
- General redesign of the Dashboard or Admin panels.
