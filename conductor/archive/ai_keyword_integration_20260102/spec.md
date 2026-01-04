# Track Specification: Integrate AI Keywords into Gemini Prompts

## Overview
Currently, the "Keywords" feature in the AI Settings allows users to define specific terms (like slogans or school values) that are saved in the database. However, these keywords are not being passed to the AI service, so they are ignored. This track will integrate these keywords into the prompts for activity summaries, live commentary, and filler messages to provide a more personalized and branded experience.

## Functional Requirements
1.  **Activity Summaries:** Update `generateAdminSummary` to include keywords in the prompt, encouraging the AI to weave them into the WhatsApp-style reports.
2.  **Live Commentary:** Update `generateCompetitionCommentary` to pass keywords, allowing the AI to use them naturally in live cheer-ups.
3.  **Filler Messages:** Update `generateFillerMessages` to include keywords when creating the scrolling motivational messages.
4.  **Prompt Engineering:** Adjust the system instructions to explain that these keywords are "context and inspiration" for a more authentic school voice.

## Acceptance Criteria
- Keywords defined in settings are included in the instructions sent to Gemini.
- AI-generated summaries, commentary, and scrolling messages naturally incorporate the provided keywords.
- The system handles cases with no keywords gracefully without changing existing behavior.

## Out of Scope
- Redesigning the AI Settings interface.
- Changing the primary AI model or logic beyond keyword integration.
