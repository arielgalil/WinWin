# Specification: Class Ticker Icons Fix

## Overview
Fix visual inconsistencies in the Class Ticker cards at the bottom of the dashboard. Icons must be consistently wrapped in circular backgrounds and sized appropriately to fit without overflowing.

## Requirements
- **Container:** All status/rank icons must be inside a circular (`rounded-full`) or squircle (`rounded-xl`) container.
- **Centering:** Containers must use `flex items-center justify-center`.
- **Sizing:** Icons must be sized to fit the container (e.g., `w-1/2 h-1/2` or specific pixel sizes relative to the container) to prevent overflow or touching the edges.
- **Consistent styling:** Background colors for trends (up/down/same) should be applied to the *container*, not just the icon color.

## Acceptance Criteria
- [ ] All icons in Class Ticker cards have a background shape.
- [ ] No icons extend beyond their background shape.
- [ ] Icons are centered.
