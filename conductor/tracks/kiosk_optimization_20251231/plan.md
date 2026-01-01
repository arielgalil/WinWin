# Implementation Plan: Kiosk UX & Performance Optimization

## Phase 1: PWA & Caching Foundation [checkpoint: 64d5144]
- [x] Task: Update `vite.config.ts` PWA settings to ensure high-priority caching for dashboard assets (Material Symbols, Noto Sans Hebrew, and core CSS). 3b04278
- [x] Task: Implement a "Pre-warm" utility to ensure these assets are in the cache before the first rotation cycle. 3b04278
- [x] Task: Conductor - User Manual Verification 'PWA & Caching Foundation' (Protocol in workflow.md) 64d5144

## Phase 2: Kiosk Initialization & Audio Unlock [checkpoint: 0ada69d]
- [x] Task: Create a `KioskStartOverlay` component to prompt for the initial user interaction required for unmuted video. 1eb40ef
- [x] Task: Write tests for `KioskStartOverlay` visibility and interaction. 1eb40ef
- [x] Task: Integrate `KioskStartOverlay` into `src/components/Dashboard.tsx` to "unlock" the audio context. 1eb40ef
- [ ] Task: Conductor - User Manual Verification 'Kiosk Initialization & Audio Unlock' (Protocol in workflow.md)

## Phase 3: Animation Persistence & Continuity [checkpoint: c407d80]
- [x] Task: Implement a `persistent_session` flag in the global state (Zustand) to track if the dashboard has already performed its initial animations. c407d80
- [x] Task: Update `MissionMeter.tsx` to skip entrance animations if `persistent_session` is true. c407d80
- [x] Task: Update `Podium.tsx` and list-based components to skip stagger/entrance animations on sub-sequent rotations. c407d80
- [x] Task: Verify that animations still play correctly on the very first page load. c407d80
- [x] Task: Move Iris pattern generation logic to Zustand store to keep it consistent (Point 18). ab97154
- [x] Task: Conductor - User Manual Verification 'Animation Persistence & Continuity' (Protocol in workflow.md) ab97154

## Phase 4: DOM Persistence (The Stack Approach)
- [x] Task: Rewrite `KioskRotator.tsx` to render all URLs and the Board simultaneously in a "Stack". 83a4ce9
- [x] Task: Use CSS `opacity` and `pointer-events` to toggle visibility without unmounting (Point 17). 83a4ce9
- [x] Task: Refine transitions to ensure high-performance switching on kiosk hardware. 83a4ce9
- [x] Task: Conductor - User Manual Verification 'DOM Persistence & Stack Approach' (Protocol in workflow.md) 83a4ce9
