# Specification: Header Icon Alignment Fix

## Overview
Ensure perfect vertical centering of icons within their containers in Admin Panel headers and Section Cards.

## Requirements
- **Admin Section Card:** The icon inside the colored rounded box must be centered.
- **Admin Panel Header:** The large icon next to the page title must be centered.
- **Implementation:** Explicitly set `display: flex`, `align-items: center`, and `justify-content: center` on the parent containers of these icons to accommodate the `inline-flex` nature of the Material Icons.

## Acceptance Criteria
- [ ] Icon in `AdminSectionCard` is visually centered.
- [ ] Icon in `AdminPanel` main header is visually centered.
- [ ] No regression in Sidebar or Footer.
