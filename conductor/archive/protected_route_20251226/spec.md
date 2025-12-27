# Specification: Generic ProtectedRoute Component

## Overview
Currently, the application uses multiple similar routing components (`AdminRoute`, `VoteRoute`) and manual logic in `App.tsx` to handle permission checks. This track introduces a generic `ProtectedRoute` component to centralize security logic, reduce code duplication, and provide a consistent "Access Denied" experience.

## Functional Requirements

### 1. New Component: `ProtectedRoute`
- **Location:** `src/components/ProtectedRoute.tsx`.
- **Props:**
    - `allowedRoles: string[]`: A list of roles permitted to access the route (e.g., `['admin', 'superuser']`).
    - `children: React.ReactNode`: The component(s) to render if authorized.
    - `fallbackPath?: string`: (Optional) Custom path to redirect if the user is not logged in.
- **Logic:**
    - Uses `useAuth` and `useAuthPermissions` to verify status.
    - If **Not Logged In:** Redirects to the login page (or `fallbackPath`).
    - If **Unauthorized Role:** Renders the `ErrorScreen` component with an "Access Denied" message.
    - If **Authorized:** Renders the `children`.

### 2. Integration & Refactoring
- Replace the following custom route components in `src/App.tsx`:
    - Remove `AdminRoute` and use `ProtectedRoute` with `allowedRoles={['admin', 'superuser']}`.
    - Remove `VoteRoute` and use `ProtectedRoute` with `allowedRoles={['teacher', 'admin', 'superuser']}`.
- Clean up any remaining manual permission checks within the `App` component that can now be delegated to the routing layer.

### 3. Loading State Coordination
- Ensure `ProtectedRoute` remains "dormant" while the global authentication and campaign data are loading.
- Coordinate with `App.tsx` so that `ProtectedRoute` only processes logic once `authLoading` and `isLoadingCampaign` are false.

## Non-Functional Requirements
- **Security:** Ensure no unauthorized component even mounts before the role check completes.
- **Clarity:** Use the `useAuthPermissions` hook as the single source of truth for role identity.

## Acceptance Criteria
- [ ] `ProtectedRoute.tsx` is implemented and documented.
- [ ] `AdminRoute` and `VoteRoute` are deleted from `App.tsx`.
- [ ] A logged-out user is redirected to login when accessing `/admin/:slug`.
- [ ] A user with the 'teacher' role sees an "Access Denied" screen when trying to access `/admin/:slug`.
- [ ] A user with the 'admin' role can access both `/vote/:slug` and `/admin/:slug`.
- [ ] The application passes all existing and new unit tests.

## Out of Scope
- Changing the existing role definitions or database schema.
- Implementing feature-level permissions (e.g., "can edit but not delete").
