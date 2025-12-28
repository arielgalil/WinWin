# Specification: State Management & Performance Optimization

## Overview
Optimize the application's performance by refactoring state management to reduce unnecessary re-renders. This involves introducing **Zustand** for atomic client-side global state and decomposing monolithic **React Query** hooks into smaller, specialized hooks using data selectors.

## Functional Requirements

### 1. Zustand Integration
- Implement a global store in `src/services/store.ts`.
- **Migrate UI State:** Move theme management (currently in `ThemeContext`) to Zustand.
- **Migrate High-Frequency UI Indicators:** Move ticker-related UI states or temporary interface flags to Zustand.
- **Atomic Updates:** Ensure components can subscribe to specific state slices (e.g., `useStore(state => state.theme)`) to avoid re-rendering on unrelated changes.

### 2. React Query Optimization (Atomic Hooks)
- **Decompose `useCompetitionData`:** Split the monolithic hook into smaller, specialized hooks:
    - `useCampaign`: Basic campaign info and settings.
    - `useClasses`: Class and student data.
    - `useTicker`: Ticker messages.
    - `useLogs`: Action logs with infinite scroll.
    - `useCampaignRole`: User permission data for the specific campaign.
- **Implement Selectors:** Use the `select` option in `useQuery` to return only the specific data needed by a component, preventing re-renders when other fields in the same query update.
- **Granular Caching:** Fine-tune `staleTime` and `refetchInterval` for each specialized hook (e.g., settings might change less frequently than scores).

### 3. Context API Reduction
- Deprecate `ThemeContext` in favor of the Zustand store.
- Evaluate `AuthContext` to ensure it only handles slow-changing authentication state.

### 4. Scoreboard Refactor
- Update the `Dashboard` and related components (the "Scoreboard") to utilize the new atomic hooks (e.g., `useClasses`, `useTicker`) and Zustand state.
- Ensure the Scoreboard benefits from the performance optimizations (reduced re-renders) applied to the rest of the application.

## Non-Functional Requirements
- **Performance:** Significant reduction in CPU usage during high-frequency updates (e.g., real-time score changes).
- **Maintainability:** Clearer separation of concerns by having specialized data hooks.
- **Responsiveness:** Improved UI feel on low-end mobile devices due to reduced reconciliation cycles.

## Acceptance Criteria
- [ ] Zustand is installed and the store is initialized at `src/services/store.ts`.
- [ ] `ThemeContext` is removed, and all components use the Zustand-based `useTheme` or store selector.
- [ ] `useCompetitionData` is replaced by granular hooks across the codebase, including the Scoreboard (Dashboard).
- [ ] Components using `useClasses` or `useTicker` only re-render when their relevant data changes (verified via React Profiler).
- [ ] Application remains fully functional with no regressions in data fetching or UI state.

## Out of Scope
- Database schema changes.
