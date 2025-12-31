# Implementation Plan: UI Polish, Admin Experience & Visual Revitalization

This plan addresses UI/UX regressions, localization needs, and visual revitalization of the Admin Panel and Competition Selection screen.

## Phase 1: Localization & Persistence (Foundation) [checkpoint: 417461c]
- [x] Task: Implement Sidebar State Persistence in `useLocalStorage` or similar utility. 00fe55a
- [x] Task: Update `LanguageContext` or Root Layout to apply `dir="ltr/rtl"` based on the active language. 6ec7fc9
- [x] Task: Audit and update `AdminLayout` and major components to use Tailwind logical properties (`ps-`, `pe-`, `ms-`, `me-`). bda810c
- [x] Task: Add the missing English translation strings to `public/locales/en.json` (or the respective translation file). fb6c01a
- [x] Task: Conductor - User Manual Verification 'Phase 1: Localization & Persistence' (Protocol in workflow.md) 417461c

## Phase 2: Layout Safety & Component Standardization
- [x] Task: Update "Competition Team Management" and "Classes & Students Management" list views to add the safety margin (`ml-6`/`mr-6`) between Edit and Delete buttons. f2bb2c1
- [x] Task: Standardize "Edit Students" button styling to match the primary dashboard action style. f2bb2c1
- [x] Task: Fix icon frames for "Export & Backup", "Data Restore", and "Danger Zone" to use consistent rounded-square shapes. a5addd9
- [x] Task: Implement wrapping and end-alignment for the AI Summary Copy button. b8b9737
- [~] Task: Conductor - User Manual Verification 'Phase 2: Layout Safety & Component Standardization' (Protocol in workflow.md)

## Phase 3: Visual Revitalization & Theme
- [x] Task: Refactor the Competition Selection screen to use dynamic, vibrant background colors for each card. 5dbd2f0
- [x] Task: Add the Theme Toggle (Light/Dark) to the footer, end-aligned. 5dbd2f0
- [x] Task: Force a fixed soft white-gray background for all logo containers, independent of the active theme. a5addd9
- [x] Task: Verify that all logo and avatar containers are non-selectable and non-draggable. a5addd9
- [~] Task: Conductor - User Manual Verification 'Phase 3: Visual Revitalization & Theme' (Protocol in workflow.md)

## Phase 4: Final Polish & Verification
- [x] Task: Perform a full RTL/LTR audit across all Admin tabs. 95c9252
- [x] Task: Verify mobile responsiveness (44x44px targets) for all new/modified UI elements. 95c9252
- [ ] Task: Run full test suite and ensure no regressions.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Polish & Verification' (Protocol in workflow.md)
