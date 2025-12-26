# Implementation Plan: Generic ProtectedRoute Component

This plan outlines the steps to centralize security logic by implementing a generic `ProtectedRoute` component and refactoring the routing layer in `App.tsx`.

## Phase 1: ProtectedRoute Component Creation
- [x] Task: TDD - Create unit tests for `ProtectedRoute` in `src/components/__tests__/ProtectedRoute.test.tsx`. [eaeb97a]
- [x] Task: TDD - Implement `ProtectedRoute` component in `src/components/ProtectedRoute.tsx`. [eaeb97a]
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Component Creation' (Protocol in workflow.md)

## Phase 2: Routing Layer Refactoring
- [ ] Task: Update `src/App.tsx` to use `ProtectedRoute` for `/admin` and `/vote` routes.
- [ ] Task: Remove `AdminRoute` and `VoteRoute` component definitions from `App.tsx`.
- [ ] Task: Refactor `App.tsx` to ensure loading states (`authLoading`, `isLoadingCampaign`) are handled before the router is processed.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Refactoring' (Protocol in workflow.md)

## Phase 3: Verification & Polish
- [ ] Task: Verify redirection and "Access Denied" behavior for different user roles (Super Admin, Admin, Teacher, Logged out).
- [ ] Task: Run full regression test suite and ensure build success.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Final Polish' (Protocol in workflow.md)
