# Specification: Types and Constants Refinement

## Overview
This track aims to improve code quality and type safety by eliminating the use of `any` in key areas and centralizing hardcoded values (magic numbers) into meaningful constants within the configuration layer.

## Functional Requirements

### 1. Type Safety Improvements (Eliminating `any`)
- **`src/types.ts`**: Replace `any` in `snapshot_data` with a precise interface structure or a well-defined union type that reflects the actual data being snapshotted.
- **`src/App.tsx`**: 
    - Fix `LanguageSync` component to use the proper types from `AppSettings` instead of `any`.
    - Audit other occurrences of `any` within `App.tsx` and replace them with specific interfaces or `unknown` where appropriate.
- **Global Audit**: Perform a targeted search for `any` across the `src/` directory and resolve the most critical instances.

### 2. Magic Numbers Refactor (Constants Centralization)
- **Centralize Timeouts**: Move the following hardcoded timeouts from `App.tsx`, `AuthContext.tsx`, and other components to `src/config.ts`:
    - Loading screen auto-options timeout (currently 4000ms).
    - Auth initialization timeouts.
    - Any other relevant animation or polling intervals.
- **Naming Convention**: Use **camelCase** with a descriptive prefix and the `Ms` suffix (e.g., `authLoadingTimeoutMs`).
- **Export/Import**: Ensure all affected components import these constants from `@/config`.

## Non-Functional Requirements
- **Type Correctness**: The project must pass `npx tsc --noEmit` without new errors related to the refactored types.
- **Runtime Consistency**: Ensure that moving magic numbers to constants does not change the actual behavior or timing of the application.

## Acceptance Criteria
- [ ] All `any` usages in `snapshot_data` (`types.ts`) are replaced with specific types.
- [ ] `LanguageSync` in `App.tsx` is fully typed.
- [ ] No "magic number" timeouts remain in `App.tsx` or `AuthContext.tsx`.
- [ ] `src/config.ts` contains the new centralized constants.
- [ ] The application compiles and passes all unit tests.

## Out of Scope
- Adding new application logic or features.
- Refactoring CSS values into JS constants (Tailwind is the standard for styling).
