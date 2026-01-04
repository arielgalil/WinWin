# Track Specification: Kiosk UX & Performance Optimization

## Overview
This track focuses on refining the Kiosk Rotation experience. The goal is to ensure that external content and the game board feel persistent, videos play as expected, and transitions are optimized through strategic caching and animation management.

## Functional Requirements
- **Audio/Video Auto-play:** Implement a "Start Kiosk" or "Enter Fullscreen" overlay to satisfy browser security policies, enabling unmuted auto-play for rotating video content.
- **Animation Persistence:** Modify the Game Board (Dashboard) components to skip "entry" animations (e.g., Mission Meter filling, list staggers) after the initial load.
- **State Serialization:** Implement a mechanism to save and restore the state/scroll position of rotation sites to minimize the visual impact of refreshes.
- **PWA Caching:** Enhance Service Worker configuration to ensure core assets (icons, typography, and dashboard resources) are cached for near-instant switching.

## Non-Functional Requirements
- **Continuity:** The transition between the game board and external sites should feel like a single persistent application rather than a series of page reloads.
- **Memory Efficiency:** Use state serialization over DOM persistence to maintain performance on low-end kiosk hardware.

## Acceptance Criteria
- [ ] Clicking "Start Kiosk" allows videos in rotating sites to play with audio.
- [ ] Swiping back to the Game Board does not trigger "first-load" animations.
- [ ] Switching between sites feels faster due to PWA asset caching.
- [ ] The Game Board maintains its visual state (scroll/position) after a rotation cycle.

## Out of Scope
- Full DOM persistence of multiple iframes (background loading of all sites at once).
- Modifying security headers of external websites (X-Frame-Options/CORS).
