# Track Specification: Fix and Expand Ticker Smart Tags

## 1. Overview
The "Ticker" component in the Leaderboard/Dashboard displays scrolling messages. These messages support "smart tags" (placeholders like `[שם המוסד]`) that should be dynamically replaced with real-time competition data. Currently, these tags are not being replaced correctly (appearing as raw text), and several desired tags are missing from the system entirely.

This track will implement robust text replacement logic for a comprehensive list of smart tags, ensuring they reflect live data such as current leaders, scores, and random selections.

## 2. Functional Requirements

### 2.1 Smart Tag Support
The system must correctly identify and replace the following tags within any ticker message:

**General Competition Data:**
*   `[שם המוסד]`: Name of the Institution.
*   `[שם המבצע]`: Name of the current Competition/Campaign.
*   `[ניקוד מוסדי]`: Total accumulated score for the entire institution.
*   `[שם היעד]`: Name of the current active goal/milestone.
*   `[ניקוד היעד]`: Point value/target of the current goal.
*   `[מרחק מהיעד]`: Points remaining until the current goal is reached.

**Group Rankings (Renamed from "Class" to "Group"):**
*   `[קבוצה ראשונה]`: Name of the group currently in 1st place.
*   `[קבוצה שניה]`: Name of the group currently in 2nd place.
*   `[קבוצה שלישית]`: Name of the group currently in 3rd place.
    *   *Note:* Logic should handle cases where fewer than 3 groups exist (display fallback or empty string).

**Student Rankings:**
*   `[מקום ראשון]`: Name of the student currently in 1st place.
*   `[מקום שני]`: Name of the student currently in 2nd place.
*   `[מקום שלישי]`: Name of the student currently in 3rd place.

**Dynamic Content:**
*   `[מקום אקראי]`: A random participant (Group or Student, context-dependent or generally from the active list) selected *each time* the message is displayed/cycled.

### 2.2 Data Integrity
*   If data is missing (e.g., no "Second Place" exists), the tag should be replaced with a generic fallback or the message should seamlessly handle the void (to be determined during implementation, e.g., "N/A").
*   "Random" tags must re-roll their selection on every message cycle, not just on page load.

## 3. Non-Functional Requirements
*   **Performance:** Tag replacement must be efficient and not cause stuttering in the scrolling animation.
*   **Localization:** Tags are in Hebrew as specified.

## 4. Implementation Notes
*   Refactor existing tag parsing logic (if any) to use a unified replacement service/hook.
*   Ensure the `useTickerMessages` or equivalent hook has access to full leaderboard context (Top 3 Groups, Top 3 Students, Totals).
