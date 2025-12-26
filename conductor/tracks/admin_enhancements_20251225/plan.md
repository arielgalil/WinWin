# Implementation Plan: Admin Panel Enhancements & Fixes

This plan outlines the steps to improve the Admin Panel UX, restore AI functionality, and implement role-based sharing features.

## Phase 1: UI Consistency & UX Improvements (Goals & Tabs) [checkpoint: 7f77a65]
- [x] Task: TDD - Update Goal Edit button color and style in `GoalsManagement.tsx`. [143be48]
- [x] Task: TDD - Implement smooth scroll logic in `GoalsManagement.tsx` when "Edit" is clicked. [143be48]
- [x] Task: TDD - Unify tab widths in the Settings view (AdminPanel/Settings components). [8709ab4]
- [x] Task: Conductor - User Manual Verification 'Phase 1: UI Consistency' (Protocol in workflow.md)

## Phase 2: Light Mode Accessibility Audit & Fix (Admin Panel)
- [x] Task: TDD - Audit and update typography contrast (true black #000000) for Light Mode in Admin components. [5d65786]
- [x] Task: TDD - Enhance form input visibility (borders/shadows) in Light Mode. [5d65786]
- [x] Task: TDD - Improve visual hierarchy and card outlines for better contrast. [5d65786]
- [x] Task: TDD - Refine subheaders and card backgrounds for better contrast and uniformity (User Feedback). [cbb853e]
- [x] Task: TDD - Fix nested card backgrounds and Action Log/AI text contrast (User Feedback). [447c8f2]
- [x] Task: TDD - Comprehensive Global Contrast Audit & Fix (Nuclear Option - Force Dark Text). [721c5cc]
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Light Mode Accessibility' (Protocol in workflow.md)

## Phase 3: AI Service Restoration
- [ ] Task: TDD - Debug `geminiService.ts` and `AiSettings.tsx` to identify the hanging cause.
- [ ] Task: TDD - Fix AI Summary loading bug and ensure proper error handling/timeouts.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: AI Service Restoration' (Protocol in workflow.md)

## Phase 4: Role-Based Multi-Link Sharing
- [ ] Task: TDD - Create sharing utility to generate dynamic message templates based on user role.
- [ ] Task: TDD - Add Share button to the Admin Panel Header.
- [ ] Task: TDD - Add Share button to the Admin Mobile (Hamburger) Menu.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Multi-Link Sharing' (Protocol in workflow.md)

## Phase 5: Final Polish & Verification
- [ ] Task: Final regression testing of all Admin Panel features.
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Final Polish' (Protocol in workflow.md)
