# UI Polish: Fix Icon Vertical Alignment in Headers

## Objective
Fix vertical alignment of icons in headers and subheaders, particularly in the Admin Panel section headers where the user reported issues "from the left" (likely referring to the main content area headers in RTL layout).

## Analysis
- **Sidebar:** Confirmed fixed.
- **Main Content Headers (`AdminSectionCard`):** Uses `flex items-center`. The icon is wrapped in a `div` with padding.
- **Problem:** With `inline-flex` now applied to the icon itself, the interaction with the wrapper div might be causing a slight offset if `line-height` or vertical alignment isn't strictly controlled in the flex container.
- **Goal:** Ensure the icon inside the colored box in `AdminSectionCard` is perfectly centered.

## Plan
- [x] Task: Fix `AdminSectionCard` alignment [Icons.tsx] [a228510]
    - [x] Update `AdminSectionCard.tsx` to ensure the icon wrapper uses `flex items-center justify-center`.
    - [x] Verify `line-height` inheritance.
- [x] Task: Fix `AdminPanel` Main Header [a228510]
    - [x] Check the dynamic header in `AdminPanel.tsx` (the one with the large icon and title/desc).
    - [x] Ensure the icon wrapper `div` centers the `inline-flex` icon correctly.

## Technical Details
- When an `inline-flex` element (the icon) is inside a `flex` container (the wrapper div), it should center if `items-center` and `justify-center` are set.
- I will enforce `flex justify-center items-center` on the wrapper divs in `AdminSectionCard` and `AdminPanel`.