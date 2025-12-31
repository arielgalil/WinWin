# UI Polish: Fix Icon Vertical Alignment

## Objective
Fix vertical alignment issues where icons appear slightly off-center relative to adjacent text. This is likely due to the switch to Material Symbols (font-based) which can have different baseline characteristics than the previous SVG icons.

## Analysis
- **Current State:** Icons use `flex items-center justify-center` in a `span` with `line-height: 1`.
- **Problem:** Font-based icons can be sensitive to line-height and bounding box calculations, sometimes appearing "lifted" or "dropped" compared to SVGs.
- **Target:** Sidebar navigation, Action Buttons, and Footers.

## Plan
- [x] Task: Global Icon Alignment Fix [Icons.tsx] [018318c]
    - [x] Update `Icons.tsx` to ensure the `span` behaves like a proper bounding box.
    - [x] Experiment with removing `flex` and using `inline-flex` or adjusting `line-height`.
    - [x] Ensure `overflow: hidden` is applied to clip any font bounding box weirdness.
    - [x] Verify `w-` and `h-` classes from Tailwind don't conflict with inline styles.
- [x] Task: Footer & Sidebar Audit
    - [x] Check `AdminSidebar` footer icons (Logout, Theme Toggle) for alignment.
    - [x] Check `VersionFooter` or dashboard footer if applicable.

## Technical Details
- Material Symbols are best rendered with `display: inline-flex` and `align-items: center`.
- We might need to adjust the `fontSize` calculation or standard line-heights.