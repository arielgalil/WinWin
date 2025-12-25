# Implementation Plan - Admin Panel UI/UX & Security Improvements

## Phase 1: Header & Branding Improvements
Focus: Localization, dynamic titles, and logo interactions in the main Admin Header.

- [x] Task: Update Header Labels & Title [3bde272]
    - [x] Sub-task: Create/Update test to verify header displays "מנהל תחרות" and fetches competition name.
    - [x] Sub-task: Implement changes to replace "Administrator" and "Admin Console".
    - [x] Sub-task: Refactor and verify.
- [x] Task: Fix Header Logo Behavior [3bde272]
    - [x] Sub-task: Create/Update test to verify logo renders without a link/button wrapper.
    - [x] Sub-task: Remove navigation logic from the logo and ensure it displays the competition logo.
    - [x] Sub-task: Refactor and verify.
- [ ] Task: Conductor - User Manual Verification 'Header & Branding Improvements' (Protocol in workflow.md)

## Phase 2: Groups & Settings UI
Focus: Visual tweaks in Settings and the Groups Management table.

- [ ] Task: Settings - Circular Logo Preview
    - [ ] Sub-task: Create/Update test to verify the logo image container has rounded styling classes.
    - [ ] Sub-task: Apply CSS/Tailwind classes to enforce circular shape on the logo preview.
    - [ ] Sub-task: Refactor and verify.
- [ ] Task: Groups Table - Button Icon & Positioning
    - [ ] Sub-task: Create/Update test to verify "Manage Students" button icon and DOM order.
    - [ ] Sub-task: Move button to follow "Student Count" and replace '+' icon with 'Users/Group' icon.
    - [ ] Sub-task: Refactor and verify.
- [ ] Task: Conductor - User Manual Verification 'Groups & Settings UI' (Protocol in workflow.md)

## Phase 3: Staff Security & Layout
Focus: Permission-based UI hiding and button alignment in the Users/Staff Manager.

- [ ] Task: Security - Hide Actions for Super Admins
    - [ ] Sub-task: Create test case: Login as Manager -> Render Staff Table -> Assert Super Admin row has NO Edit/Delete buttons.
    - [ ] Sub-task: Create test case: Login as Super Admin -> Render Staff Table -> Assert buttons exist.
    - [ ] Sub-task: Implement conditional rendering logic based on target user role vs. current user role.
    - [ ] Sub-task: Refactor and verify.
- [ ] Task: Staff Table - Button Alignment
    - [ ] Sub-task: Create/Update test (snapshot or class check) for action column structure.
    - [ ] Sub-task: Apply CSS fixes to ensure vertical alignment of action buttons across all rows.
    - [ ] Sub-task: Refactor and verify.
- [ ] Task: Conductor - User Manual Verification 'Staff Security & Layout' (Protocol in workflow.md)