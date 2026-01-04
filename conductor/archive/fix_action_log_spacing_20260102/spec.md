# Specification - Fix Spacing in Activity Log & AI

## Overview
In the "Activity Log & AI" tab, the "Action History" card currently removes all padding to allow the table to be edge-to-edge. However, this also removes the padding from the header (icon and title), making it look cramped. The goal is to restore the header's padding while maintaining the edge-to-edge look for the history table.

## Functional Requirements
- **Restore Header Padding:** The header of the "Action History" card (containing the icon and title) must have the standard padding used across the application (`p-4 sm:p-6`).
- **Maintain Edge-to-Edge Table:** The table content must continue to touch the left and right edges of the card for maximum horizontal space, especially important for data-heavy logs.
- **Visual Consistency:** The overall card should feel integrated with the rest of the Admin Panel while providing an optimized view for the log data.

## Acceptance Criteria
- [ ] The "Action History" icon and title are properly padded from the card edges.
- [ ] The "Action History" table remains edge-to-edge (0 horizontal padding relative to the card border).
- [ ] Horizontal scroll on mobile works correctly without being clipped by unintended padding.
- [ ] No regression in the "AI Summary" card layout.

## Out of Scope
- Changes to table column data or sorting logic.
- UI changes to the AI analysis section.
