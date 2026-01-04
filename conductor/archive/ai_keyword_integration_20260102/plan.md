# Plan - Integrate AI Keywords into Gemini Prompts

## Phase 1: Service Layer Integration (TDD)
Update the core AI service functions to handle keywords and incorporate them into the prompts.

### Task 1: Update generateCompetitionCommentary
- [x] Task: Update function signature to accept keywords.
- [x] Task: Incorporate keywords into the prompt instructions as "natural inspiration".
- [x] Task: Write failing test in `src/services/__tests__/geminiService.test.ts` confirming keywords are in the prompt.
- [x] Task: Implement change to pass test.

### Task 2: Update generateFillerMessages
- [x] Task: Update function signature to accept keywords.
- [x] Task: Write failing test in `src/services/__tests__/geminiService.test.ts`.
- [x] Task: Implement change to pass test.

### Task 3: Update generateAdminSummary
- [x] Task: Ensure the function uses `settings.ai_keywords` in its summary prompt.
- [x] Task: Update existing tests to verify keyword inclusion.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Service Layer Integration (TDD)' (Protocol in workflow.md)

## Phase 2: Integration with Callers
Pass the keywords from settings to the AI service calls in the UI and hooks.

### Task 1: Update useCompetitionEvents.ts
- [x] Task: Modify the hook to pass `settings.ai_keywords` when calling `generateCompetitionCommentary`.

### Task 2: Update DashboardHeader.tsx
- [x] Task: Modify the component to pass `settings.ai_keywords` when calling `generateFillerMessages`.

### Task 3: Verification
- [x] Task: Ensure all callers are correctly providing the data.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Integration with Callers' (Protocol in workflow.md)

## Phase 3: Prompt Refinement & Localization
Refine the Hebrew instructions to ensure keywords are used naturally.

### Task 1: Update Translation Files
- [x] Task: Add a new instruction key (e.g., `ai_keyword_instruction`) to `he.ts` and `en.ts` that guides the AI on how to use keywords.
- [x] Task: Integrate this instruction key into all 3 prompt types.

### Task 2: Final Quality Check
- [x] Task: Run `npm test` and `npm run lint`.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Prompt Refinement & Localization' (Protocol in workflow.md)
