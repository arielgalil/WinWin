# Plan: UI Polish and Consistency

Standardize typography, ensure modal theme compatibility, implement global interaction restrictions, and provide asset placeholders.

## Phase 1: Foundation & Global Interactions
- [x] Task: Define new 5-level typography variables in `src/index.css` (H1, H2, H3, Body, Small) using rem units and responsive clamps. 36c5591
- [x] Task: Apply global CSS to prevent selection and dragging on icons, logos, and avatars. 36c5591
- [x] Task: Conductor - User Manual Verification 'Phase 1: Foundation' (Protocol in workflow.md)

## Phase 2: Component & Asset Refinement
- [x] Task: Create a reusable `ImagePlaceholder` component with the stylized photo icon and dashed border. 069a1cb
- [x] Task: Update the Target Reward logic in `AdminPanel` to display the placeholder when "Image" is selected without an upload. 069a1cb
- [x] Task: Ensure all existing avatars and icons use the new non-selectable/non-draggable utility. 069a1cb
- [x] Task: Conductor - User Manual Verification 'Phase 2: Component & Asset Refinement' (Protocol in workflow.md)

## Phase 3: Typography & Modal Audit
- [ ] Task: Apply the unified H1 font size to all main headings in the Admin interface.
- [ ] Task: Apply H2 and H3 sizes to sub-sections and tab titles respectively.
- [ ] Task: Standardize body text and small text across all data grids and settings.
- [ ] Task: Audit all modals (`AdminPanel`, `SuperAdminPanel`, `CampaignSelector`) for Light/Dark mode compatibility and fix any inconsistencies.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Typography & Modal Audit' (Protocol in workflow.md)

## Phase 4: Final Polish & Verification
- [ ] Task: Perform a final sweep of the interface to ensure no "one-off" font sizes remain.
- [ ] Task: Verify RTL alignment for all newly implemented elements (placeholders, updated headings).
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Polish' (Protocol in workflow.md)
