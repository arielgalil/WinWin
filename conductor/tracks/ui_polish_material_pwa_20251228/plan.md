# Implementation Plan: UI Polish, Material Icons, and PWA Fix

## Phase 1: PWA & Asset Optimization [checkpoint: 0f9d731]
*Goal: Fix the build error and ensure PWA compliance.*

- [x] Task: Optimize `public/favicon.svg` [f5e5c6b]
    - [x] Analyze the current `favicon.svg` to identify why it's 7.9MB (likely embedded data/metadata).
    - [x] Optimize/Simplify the SVG to reduce size below 2MB.
- [x] Task: Audit and Standardize PWA Assets [f5e5c6b]
    - [x] Verify `public/pwa-192x192.png` and `public/pwa-512x512.png` exist and are correctly sized.
    - [x] Ensure a maskable icon is present.
- [x] Task: Update Web Manifest and Vite Config [1243907]
    - [x] Update `manifest` in `vite.config.ts` (or `public/manifest.json`) to correctly reference all icon sizes.
    - [x] Verify `workbox` configuration in `vite.config.ts`.
- [x] Task: Build Verification [42164e3]
    - [x] Run `npm run build` to confirm the Workbox error is resolved.
- [x] Task: Conductor - User Manual Verification 'Phase 1: PWA & Asset Optimization' [0f9d731]

## Phase 2: Icon Migration Setup & Audit [checkpoint: e6cc53b]
*Goal: Prepare for the full transition to Google Material Symbols.*

- [x] Task: Install & Configure Material Symbols [c9d4725]
    - [x] Identify the best way to include Material Symbols (e.g., via font-face or a React library matching our tech stack).
    - [x] Add the dependency or asset to the project.
- [x] Task: Full Icon Audit [f2f6eb5]
    - [x] Search the codebase for all `lucide-react` imports.
    - [x] Map each Lucide icon to its closest Material Symbol equivalent.
    - [x] Mapping:
        - Trophy -> trophy
        - TrendingUp -> trending_up
        - TrendingDown -> trending_down
        - Minus -> remove
        - Users -> groups
        - Award -> workspace_premium
        - Lock -> lock
        - Plus -> add
        - RefreshCw -> refresh
        - School -> school
        - LogOut -> logout
        - Sparkles -> sparkles
        - Crown -> crown
        - Medal -> medal
        - Star -> star
        - Trash2 -> delete
        - Upload -> upload
        - Edit2 -> edit
        - Check -> check
        - X -> close
        - Download -> download
        - AlertTriangle -> warning
        - ShieldAlert -> shield_alert
        - Layers -> layers
        - List -> format_list_bulleted
        - Search -> search
        - Menu -> menu
        - Copy -> content_copy
        - Share2 -> share
        - Play -> play_arrow
        - Pause -> pause
        - Sun -> light_mode
        - Moon -> dark_mode
        - Home -> home
        - User -> person
        - Database -> database
        - RotateCcw -> undo
        - RotateCw -> redo
        - Save -> save
        - ArrowRight -> arrow_forward
        - Target -> target
        - Map -> map
        - Compass -> explore
        - Footprints -> footprints
        - Send -> send
        - Link -> link
        - Settings -> settings
        - Calculator -> calculate
        - DollarSign -> attach_money
        - Sprout -> eco
        - Key -> key
        - ChevronRight -> chevron_right
        - Music -> music_note
        - Volume2 -> volume_up
        - VolumeX -> volume_off
        - Zap -> bolt
        - CheckCircle -> check_circle
        - AlertCircle -> error
        - Info -> info
        - Clock -> schedule
        - WifiOff -> wifi_off
        - Wifi -> wifi
- [x] Task: Conductor - User Manual Verification 'Phase 2: Icon Migration Setup & Audit' [e6cc53b]

## Phase 3: Full Icon Replacement (TDD) [checkpoint: 4283668]
*Goal: Replace Lucide with Material Symbols application-wide.*

- [x] Task: Replace Icons in UI Components [e6cc53b]
    - [x] Write a test/check to ensure no `lucide-react` imports remain.
    - [x] Sequentially replace icons in `src/components/ui/`.
    - [x] Sequentially replace icons in `src/components/admin/`.
    - [x] Sequentially replace icons in `src/components/dashboard/`.
- [x] Task: Cleanup Lucide [ae00994]
    - [x] Remove `lucide-react` from `package.json`.
    - [x] Ensure the app builds without errors.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Full Icon Replacement' [4283668]

## Phase 4: Modal UI Enhancements [checkpoint: c2540c5]
- [x] Task: Enhance Button Components [260dbdf]
    - [x] Identify the standard button component or classes used in modals. (Identified in `src/components/ui/ConfirmationModal.tsx`)
    - [x] Write tests for the existence of hover states on these specific buttons. (Verified via `src/components/ui/__tests__/ConfirmationModalHover.test.tsx`)
    - [x] Implement hover background colors in Tailwind (e.g., `hover:bg-red-600` for delete, `hover:bg-gray-100` for cancel).
- [x] Task: Apply to Confirmation Modals [982bce6]
    - [x] Verify the hover effect works in all instances of the standardized confirmation modal.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Modal UI Enhancements' (Protocol in workflow.md)
