# Specification: Unified Dashboard Headers

## Overview
Replace inconsistent header implementations in Dashboard components with a single `DashboardCardHeader` component.

## Requirements
- **Consistency:** All headers must look identical in terms of padding, height (`h-11`), font size, and icon placement.
- **Icon Shape:** All header icons must be enclosed in a **perfect circle** (`rounded-full`).
- **Alignment:** Icons must be perfectly centered within their circular container.
- **Components to Update:**
    1.  `Podium`
    2.  `MissionMeter`
    3.  `StudentLeaderboard`
    4.  `ClassTicker`

## Acceptance Criteria
- [ ] `Podium` uses `DashboardCardHeader`. Icon is yellow in a yellow circle.
- [ ] `MissionMeter` uses `DashboardCardHeader`. Icon is orange/yellow in an orange/yellow circle.
- [ ] `StudentLeaderboard` uses `DashboardCardHeader`. Icon changes color based on tab (Pink/Yellow).
- [ ] `ClassTicker` uses `DashboardCardHeader`. Icon is blue in a blue circle.
- [ ] All header icons are `rounded-full`.
