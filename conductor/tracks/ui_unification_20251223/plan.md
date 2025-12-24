# Track Plan: Admin Panel UI Unification

This plan outlines the steps to unify the Admin Panel UI, ensuring consistency and mobile-first responsiveness.

## Phase 1: Infrastructure & Shared Components [checkpoint: 6776d19]
- [x] **Task: Audit Existing Admin Components.** Scan `components/admin` to identify all unique UI patterns and variations. (e126786)
- [x] **Task: Define Shared Action Buttons.** Write tests and implement a standardized `AdminActionButton` with color variants (Edit, Delete, Secondary). (f0662fa)
- [x] **Task: Refactor ConfirmModal.** Write tests and implement focus trapping and standard RTL button ordering for `ConfirmationModal`. (917fea0)
- [x] **Task: Conductor - User Manual Verification 'Infrastructure & Shared Components' (Protocol in workflow.md)**

## Phase 2: Responsive Data Grids [checkpoint: 99f8ee8]
- [x] **Task: Create Shared AdminTable Component.** Write tests and implement a responsive table that switches to "Card" layout on mobile. (02845d2)
- [x] **Task: Standardize Table Action Column.** Implement the RTL button layout: [Right] Delete -> [Middle] Secondary -> [Left] Edit. (4b97018)
- [x] **Task: Conductor - User Manual Verification 'Responsive Data Grids' (Protocol in workflow.md)**

## Phase 3: Area-by-Area Unification
- [x] **Task: Fix Theme Toggle.** Write tests and fix the light/dark mode toggle button in the Admin Panel. (08921e4)
- [ ] **Task: Unify ClassesManager UI.** Refactor the Classes management area to use the new shared components.
- [ ] **Task: Unify UsersManager UI.** Refactor the Users management area to use the new shared components.
- [ ] **Task: Unify Points/Goals Management UI.** Refactor the Points and Goals areas to use the new shared components.
- [ ] **Task: Conductor - User Manual Verification 'Area-by-Area Unification' (Protocol in workflow.md)**

## Phase 4: Quality Assurance & Polishing
- [ ] **Task: Audit i18n Coverage.** Ensure all admin screens use the translation system exclusively.
- [ ] **Task: Verify Mobile Touch Targets.** Perform a pass over all admin screens to ensure min 44px hit areas.
- [ ] **Task: Refine Border Radius.** Apply subtle rounded corners to all cards, except for the bottom edges of charts/graphs.
- [ ] **Task: Final UI/UX Consistency Pass.** Ensure spacing, typography, and animations are perfectly aligned across all areas.
- [ ] **Task: Conductor - User Manual Verification 'Quality Assurance & Polishing' (Protocol in workflow.md)**
