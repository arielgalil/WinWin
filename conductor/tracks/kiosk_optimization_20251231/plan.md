# Implementation Plan: Kiosk UX & Performance Optimization

## Phase 1: PWA & Caching Foundation
- [x] Task: Update `vite.config.ts` PWA settings to ensure high-priority caching for dashboard assets (Material Symbols, Noto Sans Hebrew, and core CSS). 3b04278
- [x] Task: Implement a "Pre-warm" utility to ensure these assets are in the cache before the first rotation cycle. 3b04278
- [ ] Task: Conductor - User Manual Verification 'PWA & Caching Foundation' (Protocol in workflow.md)

## Phase 2: Kiosk Initialization & Audio Unlock
- [ ] Task: Create a `KioskStartOverlay` component to prompt for the initial user interaction required for unmuted video.
- [ ] Task: Write tests for `KioskStartOverlay` visibility and interaction.
- [ ] Task: Integrate `KioskStartOverlay` into `src/components/Dashboard.tsx` to "unlock" the audio context.
- [ ] Task: Conductor - User Manual Verification 'Kiosk Initialization & Audio Unlock' (Protocol in workflow.md)

## Phase 3: Animation Persistence & Continuity
- [ ] Task: Implement a `persistent_session` flag in the global state (Zustand) to track if the dashboard has already performed its initial animations.
- [ ] Task: Update `MissionMeter.tsx` to skip entrance animations if `persistent_session` is true.
- [ ] Task: Update `Podium.tsx` and list-based components to skip stagger/entrance animations on sub-sequent rotations.
- [ ] Task: Verify that animations still play correctly on the very first page load.
- [ ] Task: Conductor - User Manual Verification 'Animation Persistence & Continuity' (Protocol in workflow.md)

## Phase 4: State Serialization & Rotation Polish
- [ ] Task: Implement a state serialization utility to store the current rotation index and board state in `sessionStorage`.
- [ ] Task: Update `KioskRotator.tsx` to initialize from serialized state on mount.
- [ ] Task: Refine the `AnimatePresence` transitions in `KioskRotator.tsx` to ensure smooth, non-flickering switches.
- [ ] Task: Conductor - User Manual Verification 'State Serialization & Rotation Polish' (Protocol in workflow.md)
