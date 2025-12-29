# Specification: Dashboard Icon Alignment & Styling Fix

## Overview
Fix visual regressions in the Dashboard (Game Board) card headers where icons are no longer correctly centered or styled within their circular containers.

## Requirements
- **Icon Centering:** Icons within Dashboard card headers (Podium, Mission Meter, Leaderboard) must be perfectly vertically and horizontally centered within their circular wrappers.
- **Circle Styling:** The circular background/border for these icons must be intact and visually consistent.
- **Implementation:** Apply `flex items-center justify-center` to the parent containers of these icons, similar to the fix applied in the Admin Panel.

## Acceptance Criteria
- [ ] Icons in the "Podium" header are centered in their circle.
- [ ] Icons in the "Mission Meter" header are centered in their circle.
- [ ] Icons in the "Student Leaderboard" header are centered in their circle.
- [ ] No regression in other Dashboard UI elements.
