# Implementation Plan: Project Structure Refactoring

This plan outlines the steps to reorganize the project into a standard `src/` directory structure.

## Phase 1: Preparation & Directory Setup [checkpoint: 0087baa]
- [x] Task: Create the `src/` directory if it doesn't already exist. [daa3f1c]
- [x] Task: Create the `src/test/` directory for any root-level test utilities (if applicable). [daa3f1c]
- [x] Task: Conductor - User Manual Verification 'Phase 1: Preparation' (Protocol in workflow.md) [0087baa]

## Phase 2: Source Code Relocation [checkpoint: dce5b5c]
- [x] Task: Move core files (`App.tsx`, `index.tsx`, `index.css`, `types.ts`, `config.ts`, `supabaseClient.ts`) to `src/`. [597b63e]
- [x] Task: Move source directories (`components/`, `contexts/`, `hooks/`, `services/`, `utils/`) to `src/`. [597b63e]
- [x] Task: Conductor - User Manual Verification 'Phase 2: Relocation' (Protocol in workflow.md) [dce5b5c]

## Phase 3: Configuration & Link Updates
- [ ] Task: Update `index.html` to reference `/src/index.tsx`.
- [ ] Task: Update `vite.config.ts` to reflect the new source root.
- [ ] Task: Update `tsconfig.json` (and `tsconfig.node.json` if applicable) for the new structure.
- [ ] Task: Update `vitest.config.ts` to ensure tests point to the correct files.
- [ ] Task: Update `firebase.json` or any deployment scripts if they reference source paths.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Configuration' (Protocol in workflow.md)

## Phase 4: Import Correction & Verification
- [ ] Task: TDD - Run existing tests and identify broken imports.
- [ ] Task: Perform global search and replace to fix relative imports across the entire project.
- [ ] Task: Fix specific imports in `src/index.tsx` and `src/App.tsx`.
- [ ] Task: Verify that `npm run dev` starts the application correctly.
- [ ] Task: Verify that `npm run build` completes without errors.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Verification' (Protocol in workflow.md)

## Phase 5: Cleanup & Final Validation
- [ ] Task: Remove any empty directories or redundant files in the root.
- [ ] Task: Final regression test run of all application features.
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Final Polish' (Protocol in workflow.md)
