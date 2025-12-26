# Specification: Decompose and Clean up App.tsx

## Overview
The `App.tsx` file is currently overloaded with UI components, provider logic, and complex permission checks. This track aims to refactor `App.tsx` into a lean routing hub by extracting internal components, consolidating providers into a single wrapper, and moves permissions logic into a dedicated hook.

## Functional Requirements

### 1. Extract UI Components
- Move the `LoadingScreen` component from `App.tsx` to a new file: `src/components/ui/LoadingScreen.tsx`.
- Move the `ErrorScreen` component from `App.tsx` to a new file: `src/components/ui/ErrorScreen.tsx`.
- Ensure these components are properly typed and exported.

### 2. Consolidate Context Providers
- Create a new wrapper component `AppProviders.tsx` in `src/contexts/`.
- This component will aggregate all high-level providers used in `App.tsx` (e.g., `QueryClientProvider`, `LanguageProvider`, `AuthProvider`, `ThemeProvider`, `HashRouter`).
- Update `index.tsx` or `App.tsx` to use this single `<AppProviders>` wrapper.

### 3. Encapsulate Permissions Logic
- Create a new custom hook `useAuthPermissions` in `src/services/useAuthPermissions.ts`.
- Extract the logic responsible for determining access rights, handling redirections, and identifying user roles from `App.tsx` into this hook.
- The hook should return the necessary state (e.g., `isAuthorized`, `userRole`, `isLoading`) to be used by the main `App` component.

## Non-Functional Requirements
- **Maintainability:** `App.tsx` should primarily focus on route definitions.
- **Testability:** Extracted components and the permissions hook should be easier to test in isolation.
- **Zero Regressions:** The application's authentication flow and visual states during loading/error must remain identical to the current behavior.

## Acceptance Criteria
- [ ] `App.tsx` size is significantly reduced (goal: < 150 lines).
- [ ] `LoadingScreen` and `ErrorScreen` are separate, reusable components in `src/components/ui/`.
- [ ] `AppProviders` successfully wraps the application without breaking context availability.
- [ ] `useAuthPermissions` correctly handles access logic previously residing in `App.tsx`.
- [ ] The application compiles and passes all existing tests.

## Out of Scope
- Adding new routes or features.
- Modifying the actual business logic of permissions or authentication.
- Redesigning the Loading or Error screens.
