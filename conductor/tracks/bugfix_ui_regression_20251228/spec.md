# Specification: UI Regression Fixes

## Overview
This track addresses critical regressions introduced in the previous UI Polish track.

## Critical Issues
1.  **Crash in MissionMeter:** The `MissionMeter` component throws a `ReferenceError` because the `language` variable is used but not defined (not destructured from `useLanguage`).
2.  **Broken Icons:** Several icons (e.g., Sparkles) are showing text fallbacks (e.g., "parkles") because the Material Symbol names are incorrect.
3.  **Broken Animation:** The loading spinner is not rotating or is using the wrong icon for the context.
4.  **UI Inconsistency:** The "Saved" notification varies visually between tabs.

## Requirements
- **Crash Fix:** `MissionMeter` must render without errors.
- **Icon Fixes:** All icons must render as SVGs/Glyphs, not text.
    - Sparkles -> `auto_awesome`
    - Trophy -> `emoji_events`
    - Target -> `track_changes`
    - Crown -> `chess_king`
- **Spinner:** The loading indicator must rotate smoothly and look like a standard spinner (`progress_activity` or `sync`).
- **Notification:** The Save Notification must look identical across all Admin tabs.

## Acceptance Criteria
- [ ] Application loads without `MissionMeter` crash.
- [ ] No "parkles" text visible; `auto_awesome` icon appears.
- [ ] Footer icons are visible.
- [ ] Loading spinner rotates correctly.
