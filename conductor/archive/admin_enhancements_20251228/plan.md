# Plan: UI/UX Polish & Admin Enhancements

## Phase 1: Header & Navigation Improvements [checkpoint: ]
Enhance the Admin header with missing identity and profile information.

- [x] Task: Update Admin header component to include Institution Logo (right-aligned in RTL). 273f8cc
- [x] Task: Update User Profile section in header to show Full Name and Role (Teacher/Manager/SuperAdmin). 273f8cc
- [x] Task: Write/Update unit tests for the Admin Header to verify Logo and Role visibility. 273f8cc
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Header & Navigation Improvements' (Protocol in workflow.md)

## Phase 2: RTL & Data Display Fixes [checkpoint: ]
Address layout issues and formatting errors in data-heavy views.

- [x] Task: Fix the dropdown arrow alignment in the Group Selection component for RTL. 273f8cc
- [x] Task: Refactor Goal progress display to use a consistent `Current / Total` format that handles RTL correctly. 273f8cc
- [x] Task: Audit and refactor all score/point displays to use a unified `ScoreDisplay` component. 273f8cc
- [x] Task: Write tests for number formatting and score component logic. b02ee7f
- [ ] Task: Conductor - User Manual Verification 'Phase 2: RTL & Data Display Fixes' (Protocol in workflow.md)

## Phase 3: Manager Tab Enhancements [checkpoint: 6d34a81]
Improve usability in the Data Management and Goal Management sections.

- [x] Task: Add download icons to all export cards in the Data Management & Backup section. 6d34a81
- [x] Task: Fix the mobile layout for "Add Institutional Goal" to prevent overflow (stacking layout). 6d34a81
- [x] Task: Ensure the "End Prize" section is fully visible on small screens. 6d34a81
- [x] Task: Verify mobile responsiveness using Safari dev tools. 6d34a81
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Manager Tab Enhancements' (Protocol in workflow.md)

## Phase 4: Final Polish & Audit [checkpoint: 6d34a81]
Ensure consistency across the entire admin experience.

- [x] Task: Final audit of RTL alignment across all tabs in the Admin Panel. 6d34a81
- [x] Task: Conductor - User Manual Verification 'Phase 4: Final Polish & Audit' (Protocol in workflow.md)
