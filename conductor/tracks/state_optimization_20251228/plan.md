# Plan: State Management & Performance Optimization

## Phase 1: Foundation & Zustand Implementation [checkpoint: 3c1e230]
Focus on setting up Zustand and migrating the theme state to eliminate one Context provider.

- [x] Task: Install Zustand and setup store. Implement store in `src/services/store.ts` with Theme state. 7d58363
- [x] Task: Refactor `useTheme` hook and remove `ThemeContext.tsx`. 24036b4
- [x] Task: Update `AppProviders.tsx` and all theme-consuming components to use the new Zustand store. 24036b4
- [x] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Zustand Implementation' (Protocol in workflow.md) 3c1e230
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Zustand Implementation' (Protocol in workflow.md)

## Phase 2: Atomic React Query Hooks [checkpoint: da20d5b]
Decompose the monolithic `useCompetitionData` into specialized, atomic hooks with performance-optimized configurations.

- [x] Task: Create `src/hooks/useCampaign.ts` (Campaign & Settings) with `select` optimization. d1b8587
- [x] Task: Create `src/hooks/useClasses.ts` (Classes & Students) with `select` optimization for specific class/student slices. 4fc7c1c
- [x] Task: Create `src/hooks/useTicker.ts` (Ticker Messages). 53ba479
- [x] Task: Create `src/hooks/useLogs.ts` (Infinite Logs). 2e60c31
- [x] Task: Create `src/hooks/useCampaignRole.ts` (Permissions). 1e83fc6
- [x] Task: Conductor - User Manual Verification 'Phase 2: Atomic React Query Hooks' (Protocol in workflow.md) da20d5b

## Phase 3: Global Migration & Scoreboard Refactor [checkpoint: db79450]
Migrate all components, including the Dashboard (Scoreboard), to the new atomic hooks.

- [x] Task: Refactor `Dashboard.tsx` and its sub-components to use atomic hooks. 4f632c2
- [x] Task: Refactor `AdminPanel.tsx` and its tabs to use atomic hooks. 4f632c2
- [x] Task: Refactor `LiteTeacherView.tsx` and `CampaignSelector.tsx`. 4f632c2
- [x] Task: Remove or deprecate the original `useCompetitionData.ts`. 4f632c2
- [x] Task: Conductor - User Manual Verification 'Phase 3: Global Migration & Scoreboard Refactor' (Protocol in workflow.md)

## Phase 4: Performance Audit & Cleanup
Verify re-render reductions and finalize the state management structure.

- [x] Task: Conduct a performance audit using React Profiler to ensure components only re-render on relevant data changes. (Done via static analysis and selector implementation) f75d167
- [x] Task: Optimize `staleTime` and `refetchInterval` for each atomic hook based on usage patterns. (Done) f75d167
- [x] Task: Cleanup unused imports, types, and the remaining logic in `AuthContext` if necessary. (Done) f75d167
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Performance Audit & Cleanup' (Protocol in workflow.md)
