# Plan: Master UI Standardization (Admin Workspace Focus)

## Phase 1: Foundation & Design Tokens
**Goal:** Define the shared DNA and ensure semantic consistency across the app.

- [x] Task: Define Semantic Tokens in Tailwind config (`bg-background`, `bg-surface`, `bg-muted/30`)
- [x] Task: Audit and Standardize Border Radius and Shadows in `globals.css`
- [x] Task: Verify Typography scale and tracking for H1-H3 across themes
- [x] Task: Conductor - User Manual Verification 'Phase 1: Foundation' (Protocol in workflow.md)

## Phase 2: WorkspaceLayout Construction [checkpoint: ]
**Goal:** Build the robust, RTL-aware wrapper for the administrative experience.

- [x] Task: Create `WorkspaceLayout` component structure in `src/components/layouts/`
- [x] Task: Implement RTL-aware Collapsible Sidebar using `SidebarProvider` (Shadcn)
- [x] Task: Implement Sticky Header with Breadcrumbs and Quick Action Slots
- [x] Task: Integrate Unified Padding (`p-4 md:p-6`) and Background tokens into the layout
- [x] Task: Write unit tests for `WorkspaceLayout` (RTL toggle, sticky behavior, slot rendering)
- [x] Task: Conductor - User Manual Verification 'Phase 2: Layout Construction' (Protocol in workflow.md)

## Phase 3: The Great Migration (Admin Focus) [checkpoint: ]
**Goal:** Replace legacy wrappers and clean up "div soup" in the Admin panels.

- [x] Task: Refactor `AdminPanel.tsx` to use `WorkspaceLayout` and pass sidebar/header props
- [x] Task: Refactor `SuperAdminPanel.tsx` to use `WorkspaceLayout`
- [x] Task: Standardize `AdminLayout.tsx` logic into the new system and deprecate the old file
- [x] Task: Remove hardcoded root padding/margin from `UsersManager.tsx` and other Admin sub-pages
- [x] Task: Perform Visual Regression Audit on Desktop and Mobile
- [x] Task: Conductor - User Manual Verification 'Phase 3: Migration' (Protocol in workflow.md)

## Phase 4: Quality Assurance & Polish [checkpoint: ]
**Goal:** Finalize accessibility and RTL fidelity.

- [x] Task: Execute "Fat Finger" Mobile Audit (44x44px targets)
- [x] Task: Perform RTL Stress Test (Language switching verification)
- [x] Task: Verify 100% removal of ad-hoc container spacing in target screens
- [x] Task: Conductor - User Manual Verification 'Phase 4: QA & Polish' (Protocol in workflow.md)
