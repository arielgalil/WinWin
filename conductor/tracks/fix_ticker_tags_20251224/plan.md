# Track Plan: Fix and Expand Ticker Smart Tags

This plan outlines the steps to implement a robust smart tag replacement system for the Dashboard ticker, ensuring all placeholders are replaced with real-time competition data.

## Phase 1: Data Flow & Infrastructure [checkpoint: 7390130]
- [x] **Task: Update DashboardHeader Props.** (4a3c156)
    -   Modify `DashboardHeaderProps` in `components/dashboard/DashboardHeader.tsx` to accept `sortedClasses` and `topStudents`.
- [x] **Task: Update Dashboard Component.** (4a3c156)
    -   Update `components/Dashboard.tsx` to pass the calculated `sortedClasses` and `top10Students` to the `DashboardHeader`.
- [x] **Task: Conductor - User Manual Verification 'Data Flow & Infrastructure' (Protocol in workflow.md)**

## Phase 2: Tag Replacement Logic (TDD)
- [x] **Task: Write Tests for replaceSmartTags.** (b787fbc)
    -   Create `utils/__tests__/stringUtils.test.ts` (or update existing).
    -   Define test cases for all tags:
        -   Static: `[שם המוסד]`, `[שם המבצע]`, `[ניקוד מוסדי]`.
        -   Goals: `[שם היעד]`, `[ניקוד היעד]`, `[מרחק מהיעד]`.
        -   Groups: `[קבוצה ראשונה]`, `[קבוצה שניה]`, `[קבוצה שלישית]`.
        -   Students: `[מקום ראשון]`, `[מקום שני]`, `[מקום שלישי]`.
        -   Dynamic: `[מקום אקראי]`.
- [x] **Task: Implement replaceSmartTags Utility.** (b787fbc)
    -   Add `replaceSmartTags` to `utils/stringUtils.ts`.
    -   Implement logic to find the current active goal from `settings.goals_config`.
    -   Implement logic to pick the top 3 groups and students.
    -   Implement logic for `[מקום אקראי]` using an optional seed for stability during a single render cycle.
- [~] **Task: Conductor - User Manual Verification 'Tag Replacement Logic (TDD)' (Protocol in workflow.md)**

## Phase 3: UI Integration & Refinement
- [x] **Task: Apply Tag Replacement in DashboardHeader.** (6b9340d)
    -   Modify the `chunks` useMemo in `DashboardHeader.tsx` to call `replaceSmartTags` on the selected message from the playlist.
    -   Ensure `currentIndex` is used to provide a stable but cycling selection for `[מקום אקראי]`.
- [x] **Task: Verify "Random" Cycling.** (6b9340d)
    -   Confirm that `[מקום אקראי]` selects a different participant when the message cycles back.
- [~] **Task: Conductor - User Manual Verification 'UI Integration & Refinement' (Protocol in workflow.md)**

## Phase 4: Final Quality Check
- [ ] **Task: Regression Test.**
    -   Ensure the ticker still handles long messages (chunking) correctly after tag replacement.
    -   Verify that empty states (no students/groups yet) don't crash the replacement logic.
- [ ] **Task: Conductor - User Manual Verification 'Final Quality Check' (Protocol in workflow.md)**
