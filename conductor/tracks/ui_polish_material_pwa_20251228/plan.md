# Implementation Plan: UI Polish, Material Icons, and PWA Fix

## Phase 1: PWA & Asset Optimization
*Goal: Fix the build error and ensure PWA compliance.*

- [x] Task: Optimize `public/favicon.svg` [f5e5c6b]
    - [x] Analyze the current `favicon.svg` to identify why it's 7.9MB (likely embedded data/metadata).
    - [x] Optimize/Simplify the SVG to reduce size below 2MB.
- [ ] Task: Audit and Standardize PWA Assets
    - [ ] Verify `public/pwa-192x192.png` and `public/pwa-512x512.png` exist and are correctly sized.
    - [ ] Ensure a maskable icon is present.
- [ ] Task: Update Web Manifest and Vite Config
    - [ ] Update `manifest` in `vite.config.ts` (or `public/manifest.json`) to correctly reference all icon sizes.
    - [ ] Verify `workbox` configuration in `vite.config.ts`.
- [ ] Task: Build Verification
    - [ ] Run `npm run build` to confirm the Workbox error is resolved.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: PWA & Asset Optimization' (Protocol in workflow.md)

## Phase 2: Icon Migration Setup & Audit
*Goal: Prepare for the full transition to Google Material Symbols.*

- [ ] Task: Install & Configure Material Symbols
    - [ ] Identify the best way to include Material Symbols (e.g., via font-face or a React library matching our tech stack).
    - [ ] Add the dependency or asset to the project.
- [ ] Task: Full Icon Audit
    - [ ] Search the codebase for all `lucide-react` imports.
    - [ ] Map each Lucide icon to its closest Material Symbol equivalent.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Icon Migration Setup & Audit' (Protocol in workflow.md)

## Phase 3: Full Icon Replacement (TDD)
*Goal: Replace Lucide with Material Symbols application-wide.*

- [ ] Task: Replace Icons in UI Components
    - [ ] Write a test/check to ensure no `lucide-react` imports remain.
    - [ ] Sequentially replace icons in `src/components/ui/`.
    - [ ] Sequentially replace icons in `src/components/admin/`.
    - [ ] Sequentially replace icons in `src/components/dashboard/`.
- [ ] Task: Cleanup Lucide
    - [ ] Remove `lucide-react` from `package.json`.
    - [ ] Ensure the app builds without errors.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Full Icon Replacement' (Protocol in workflow.md)

## Phase 4: Modal UI Enhancements (TDD)
*Goal: Improve interactivity for destructive/cancel actions.*

- [ ] Task: Enhance Button Components
    - [ ] Identify the standard button component or classes used in modals.
    - [ ] Write tests for the existence of hover states on these specific buttons.
    - [ ] Implement hover background colors in Tailwind (e.g., `hover:bg-red-600` for delete, `hover:bg-gray-100` for cancel).
- [ ] Task: Apply to Confirmation Modals
    - [ ] Verify the hover effect works in all instances of the standardized confirmation modal.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Modal UI Enhancements' (Protocol in workflow.md)
