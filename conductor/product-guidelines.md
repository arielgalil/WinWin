# Product Guidelines & UI/UX Standards - WinWin

## 1. Direction & Localization
- **RTL-First:** The system is fundamentally built for Hebrew speakers. Default layout and text direction must be RTL.
- **i18n (Internationalization):** **Strictly Forbidden** to use hard-coded text strings. All labels, buttons, and messages must be pulled from global translation files (JSON). This ensures maintainability and future scalability.

## 2. Brand Messaging & Voice
- **Tone:** Direct, encouraging, and supportive.
- **Goal:** Align with the gamified nature of the platform to motivate both students and teachers (e.g., "Great job!", "Action successful!", "Keep up the growth!").

## 3. Accessibility & Feedback (WCAG 2.1)
- **Standard:** Target WCAG AAA Compliance (Minimum AA).
- **Interactive Feedback:**
    - Use the **Toast system** for operation status (Success/Error).
    - **Never** use browser-native `window.alert` or `window.confirm`.
## 4. Modals
- **Modals:**
    - Required for **critical actions** (Deletion, Resetting data, etc.).
    - **Labels:** Buttons must be explicit and descriptive: "Delete [Student Name]" (Red) vs. "Cancel" (Gray).
    - **Focus Management:** Implement focus trapping within modals to ensure keyboard navigation remains logical.

## 5. Visual Identity & Consistency
- **Icons:** Use **Lucide React** icons exclusively.
- **Imagery:** Prohibit the use of non-vector (raster) illustrations to maintain a clean, crisp, and professional look across all resolutions.
- **Theme:** Full support for System, Light, and Dark modes.
- **State Feedback:**
    - **Edit Actions:** Greenish tint (`bg-green-50/10`, `text-green-600`).
    - **Delete Actions:** Reddish tint (`bg-red-50/10`, `text-red-600`).
    - **General Actions:** Purplish tint.

## 6. Mobile-First Admin Design
- **Touch Targets:** All interactive elements (buttons, inputs) must have a minimum hit area of **44x44px**.
- **Safe Areas:** Adhere to viewport safe areas; avoid placing critical controls at the extreme top or bottom edges to prevent conflict with OS gestures.
- **Contextual Inputs:** Use appropriate `inputMode` (e.g., `numeric`, `decimal`) for score entries to trigger the optimal mobile keyboard.

## 7. Button Layout Strategy (RTL Table/List Rows)
*Arrange action buttons from Right to Left to match reading order:*
1.  **Right-most:** **Delete** (Icon: Trash). *Must have a distinct visible margin separating it from other actions.*
2.  **Middle:** **Secondary Actions** (e.g., View History, Duplicate).
3.  **Left-most:** **Edit** (Icon: Pencil).
*Note: Action buttons must remain visible by default. Avoid hiding primary actions in overflow menus ("...") unless the interface is critically crowded.*
