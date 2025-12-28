# Specification: Icon Alignment Polish

## Overview
Fix visual regression where Material Symbols icons are not perfectly vertically centered with adjacent text.

## Requirements
- **Vertical Alignment:** Icons must be visually centered relative to single-line and multi-line text blocks next to them.
- **Consistency:** The fix must apply globally to all icons using the `Icons.tsx` wrapper.
- **No Layout Shift:** The fix should not change the overall size of buttons or containers.

## Implementation Details
- Modify `src/components/ui/Icons.tsx`.
- Ensure the wrapper `span`:
    - Uses `inline-flex`.
    - Has `justify-content: center` and `align-items: center`.
    - Has `overflow: hidden` (optional, if glyphs spill out).
    - explicit `line-height: 1`.

## Acceptance Criteria
- [ ] Sidebar icons are centered with their labels.
- [ ] Button icons (Save, Delete) are centered with their text.
- [ ] Footer icons are aligned.
