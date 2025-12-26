# Specification: Project Structure Refactoring

## Overview
Reorganize the project structure by moving core application files and source directories from the root into a dedicated `src/` directory. This aligns the project with standard React/Vite conventions, improving maintainability and clarity.

## Functional Requirements

### 1. Source Relocation
- Move the following files from the root to `src/`:
    - `App.tsx`
    - `index.tsx`
    - `index.css`
    - `types.ts`
    - `config.ts`
    - `supabaseClient.ts`
- Move the following directories from the root to `src/`:
    - `components/`
    - `contexts/`
    - `hooks/`
    - `services/`
    - `utils/`
    - `translations/` (if found outside utils)

### 2. Infrastructure Retention
- Keep the following in the project root:
    - `conductor/`
    - `sql/`
    - `tasks/`
    - `supabase/` (Supabase CLI config)
    - `.github/`
    - `.firebase/`
    - Configuration files (`package.json`, `vite.config.ts`, `tsconfig.json`, etc.)

### 3. Dependency & Link Updates
- **Imports:** Perform a global search and replace/update of all import statements to reflect the new directory structure.
- **Entry Point:** Update `index.html` to point to the new location of `index.tsx` (e.g., `/src/index.tsx`).
- **Build Configurations:** Update `vite.config.ts`, `tsconfig.json`, and `vitest.config.ts` if they reference the root directory for source files or aliases.

## Non-Functional Requirements
- **Build Integrity:** The project must compile successfully after the refactor.
- **Test Integrity:** All existing tests must pass after the reorganization.

## Acceptance Criteria
- [ ] All source files and directories are located inside `src/`.
- [ ] `index.html` correctly points to `src/index.tsx`.
- [ ] The application starts and runs without errors (`npm run dev`).
- [ ] The build command completes successfully (`npm run build`).
- [ ] All unit and integration tests pass.

## Out of Scope
- Creating new components or features.
- Modifying the logic within the files being moved.
- Updating database schema or SQL scripts.
