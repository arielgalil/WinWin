# Specification: Master UI Standardization (Admin Workspace Focus)

## 1. Overview
This track implements the "Workspace Mode" of the "One System, Three Modes" design vision. The primary goal is to eliminate visual fragmentation within the Admin and Super Admin panels by introducing a unified `WorkspaceLayout` system based on shared design tokens.

## 2. Functional Requirements
### 2.1 WorkspaceLayout Component
- **Sticky Header:** Persistent top navigation featuring breadcrumbs and dynamic action slots.
- **RTL-aware Sidebar:** A collapsible navigation sidebar that correctly positions itself and transitions for Hebrew (RTL) and English (LTR) contexts.
- **Unified Spacing:** Automatic enforcement of standard padding (`p-4 md:p-6`) for all child content, removing the need for manual spacing on individual pages.
- **Quick Action Slots:** Pre-defined areas in the header for context-aware buttons (e.g., "Share", "Add Points").

### 2.2 Design Tokens & Foundation
- **Semantic Backgrounds:** Standardize `bg-background` (app), `bg-muted/30` (workspace backdrop), and `bg-surface` (cards).
- **Radius & Shadows:** Global application of standardized border-radius (e.g., `rounded-xl`) and shadow depths to all workspace elements.

### 2.3 Migration (High Priority)
- Refactor `AdminPanel.tsx` and `SuperAdminPanel.tsx` to use the new `WorkspaceLayout`.
- Deprecate and replace the legacy `AdminLayout.tsx`.
- Remove ad-hoc spacing classes (`p-8`, `mt-4`, etc.) from the root containers of all Admin sub-pages.

## 3. Non-Functional Requirements
- **Mobile Accessibility:** All touch targets in the new layout components must meet the 44x44px "Fat Finger" standard.
- **RTL Fidelity:** Zero layout breakage when switching between Hebrew and English.
- **Zero Hardcoded Spacing:** No direct pixel-based spacing on container roots after migration.

## 4. Acceptance Criteria (Definition of Done)
- [ ] `WorkspaceLayout` is implemented and integrated into both Admin and Super Admin panels.
- [ ] Visual regression check confirms no loss of functionality or alignment compared to the legacy layout.
- [ ] RTL stress test passes: Sidebar and Header elements mirror correctly in Hebrew.
- [ ] Mobile audit passes: Sidebar toggle and Header actions are fully usable on small screens.
- [ ] Code Audit: All target pages have 0 hardcoded root padding classes.

## 5. Out of Scope
- Full refactor of the Kiosk/Public Dashboard (reserved for a later track).
- Major redesign of individual table contents (focus is on the *wrapper* and *layout*).
