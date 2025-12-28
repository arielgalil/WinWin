# Plan: Remote Kiosk Update Mechanism

## Phase 1: Service Worker Integration & State [checkpoint: ]
Set up the mechanism to capture update events and manage the update status.

- [~] Task: Create a new hook `src/hooks/useAutoUpdate.ts` to manage the PWA update logic.
- [ ] Task: Implement Service Worker registration listeners (`onNeedRefresh`) within the hook.
- [ ] Task: Write unit tests for `useAutoUpdate` (mocking service worker events).
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Service Worker Integration & State' (Protocol in workflow.md)

## Phase 2: Idle Timer Logic [checkpoint: ]
Implement the "wait-for-idle" logic before triggering the refresh.

- [ ] Task: Add idle timer functionality to `useAutoUpdate.ts` using `setTimeout` and event listeners (mousemove, touchstart).
- [ ] Task: Implement the auto-refresh call (`window.location.reload()`) upon timer expiration.
- [ ] Task: Write tests to verify the timer resets on interaction and triggers after the idle period.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Idle Timer Logic' (Protocol in workflow.md)

## Phase 3: Global Integration & Logging [checkpoint: ]
Enable the mechanism globally and add monitoring.

- [ ] Task: Integrate `useAutoUpdate` hook into the root `App.tsx` or a global provider.
- [ ] Task: Add descriptive logging for the update lifecycle (Detection -> Idle Wait -> Refresh).
- [ ] Task: Verify that the mechanism doesn't interfere with existing PWA prompts (if any).
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Global Integration & Logging' (Protocol in workflow.md)

## Phase 4: Final Verification [checkpoint: ]
Ensure the end-to-end flow works in a production-like build.

- [ ] Task: Perform a local build and simulate a service worker update to verify the auto-refresh.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Verification' (Protocol in workflow.md)
