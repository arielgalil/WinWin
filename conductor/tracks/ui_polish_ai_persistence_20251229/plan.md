# Plan: UI Polish and AI Summary Persistence

This plan addresses AI summary persistence, text placeholder fixes, ticker formatting, and UI synchronization for the leading column.

## Phase 1: AI Summary Persistence & Backend Integration [checkpoint: 43942a5]
- [x] Task: Update Database Schema for AI Summaries
    - [x] Create migration/SQL to add `ai_summary` column to the appropriate table (e.g., `campaigns` or a new `summaries` table).
    - [x] Add `ai_summary_updated_at` timestamp.
- [x] Task: Update Supabase Client/Types
    - [x] Update `src/types.ts` to include the new fields.
- [x] Task: Implement Persistence Logic in `geminiService.ts`
    - [x] Write tests for fetching/saving summaries to Supabase.
    - [x] Modify `geminiService.ts` to check for existing summaries before calling the Gemini API.
    - [x] Implement the save logic after a successful API call.
- [x] Task: UI Implementation for Regeneration
    - [x] Write tests for the summary display component.
    - [x] Add a "Regenerate" button to the AI summary section.
    - [x] Ensure the UI displays the "last updated" time.
- [x] Task: Conductor - User Manual Verification 'Phase 1: AI Summary Persistence & Backend Integration' (Protocol in workflow.md)

## Phase 2: Text Formatting & Ticker Improvements [checkpoint: a24a851]
- [x] Task: Fix Placeholder Replacement Logic 0dfe05f
    - [x] Identify all instances of `% {emoji}`, `% {stage}`, and `% {names}` in the codebase (likely in `useTicker.ts` or message generators).
    - [x] Write unit tests for the replacement utility function.
    - [x] Ensure all placeholders are correctly substituted with dynamic data.
- [x] Task: Ticker Asterisk Formatting 08e19f2
    - [x] Write tests for the ticker message formatter.
    - [x] Implement logic to replace `*` with `•` (bullet points) or appropriate separators.
    - [x] Ensure consistent spacing between bulleted items.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Text Formatting & Ticker Improvements' (Protocol in workflow.md) a24a851

## Phase 3: UI Polish & Component Refactoring [checkpoint: 8125da3]
- [x] Task: Momentum/Stars Group Coloring 120da0d
    - [x] Identify the component rendering the "Stars of the Yeshiva" (likely in `src/components/dashboard/`).
    - [x] Write tests for group color application.
    - [x] Update the styling to apply the group's color as a background to the group name.
- [x] Task: Unified Leading Column Component
    - [x] Locate the current crown and circle icon implementation.
    - [x] Create a new unified component (e.g., `LeaderIcon.tsx`) that wraps both icons.
    - [x] Synchronize animations (Framer Motion or CSS) to ensure they move as one.
    - [x] Replace existing separate icons with the new unified component.
    - [x] Fix: LeaderIcon size regression (crown too small) and movement separation. f2d5a2a
    - [x] Fix: Missing background color for group tags in Momentum/Stars view. (Verified implementation is correct; potentially data issue if persisting)
    - [x] Fix: Podium animation not smooth (Rebuild animation).
    - [x] Fix: Missing delicate background color for group cards in 'Class Status' ticker.
- [x] Task: Conductor - User Manual Verification 'Phase 3: UI Polish & Component Refactoring' (Protocol in workflow.md)
