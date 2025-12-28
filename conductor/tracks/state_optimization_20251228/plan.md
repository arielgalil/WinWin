# Plan: State Management & Performance Optimization

## Phase 1: Foundation & Zustand Implementation
Focus on setting up Zustand and migrating the theme state to eliminate one Context provider.

- [x] Task: Install Zustand and setup store. Implement store in `src/services/store.ts` with Theme state. 7d58363
- [x] Task: Refactor `useTheme` hook and remove `ThemeContext.tsx`. 24036b4
- [x] Task: Update `AppProviders.tsx` and all theme-consuming components to use the new Zustand store. 24036b4
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Zustand Implementation' (Protocol in workflow.md)
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Zustand Implementation' (Protocol in workflow.md)

## Phase 2: Atomic React Query Hooks
Decompose the monolithic `useCompetitionData` into specialized, atomic hooks with performance-optimized configurations.

- [ ] Task: Create `src/hooks/useCampaign.ts` (Campaign & Settings) with `select` optimization.
- [ ] Task: Create `src/hooks/useClasses.ts` (Classes & Students) with `select` optimization for specific class/student slices.
- [ ] Task: Create `src/hooks/useTicker.ts` (Ticker Messages).
- [ ] Task: Create `src/hooks/useLogs.ts` (Infinite Logs).
- [ ] Task: Create `src/hooks/useCampaignRole.ts` (Permissions).
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Atomic React Query Hooks' (Protocol in workflow.md)

## Phase 3: Global Migration & Scoreboard Refactor
Migrate all components, including the Dashboard (Scoreboard), to the new atomic hooks.

- [ ] Task: Refactor `Dashboard.tsx` and its sub-components to use atomic hooks.
- [ ] Task: Refactor `AdminPanel.tsx` and its tabs to use atomic hooks.
- [ ] Task: Refactor `LiteTeacherView.tsx` and `CampaignSelector.tsx`.
- [ ] Task: Remove or deprecate the original `useCompetitionData.ts`.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Global Migration & Scoreboard Refactor' (Protocol in workflow.md)

## Phase 4: Performance Audit & Cleanup
Verify re-render reductions and finalize the state management structure.

- [ ] Task: Conduct a performance audit using React Profiler to ensure components only re-render on relevant data changes.
- [ ] Task: Optimize `staleTime` and `refetchInterval` for each atomic hook based on usage patterns.
- [ ] Task: Cleanup unused imports, types, and the remaining logic in `AuthContext` if necessary.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Performance Audit & Cleanup' (Protocol in workflow.md)
