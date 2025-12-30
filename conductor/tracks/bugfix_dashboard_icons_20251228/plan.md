# Bug Fix: Dashboard Icons Alignment & Styling

## Objective
Fix regression in the Dashboard (Game Board) where icons in card headers are reportedly "not inside a circle anymore" and "not vertically aligned correctly".

## Analysis
- **Recent Change:** `Icons.tsx` was updated to use `inline-flex` and `overflow-hidden`.
- **Symptoms:**
    - "Not inside a circle": Could mean the icon is displacing the circle wrapper, or the wrapper's styles are broken, or the icon itself was supposed to be the circle (unlikely for wrapper pattern). Or maybe `overflow-hidden` is clipping the icon in a way that makes it look uncentered or breaks the "circle" illusion if the icon itself had the border (less likely).
    - "Not vertically aligned": The `inline-flex` change was supposed to fix this, but might need `flex` + `items-center` + `justify-center` on the *parent* wrapper in the Dashboard components, similar to what was done for Admin components.

## Plan
- [x] Task: Audit Dashboard Components [Podium.tsx, MissionMeter.tsx, StudentLeaderboard.tsx]
    - [x] Check how icons are rendered in the headers of these components.
    - [x] Identify if styles are applied to the icon directly or a wrapper.
    - [x] Ensure wrappers have `flex items-center justify-center`.
- [x] Task: Fix Alignment [a228510]
    - [x] Apply the same fix (centering wrapper) to Dashboard components as was done for Admin.
    - [x] If "not in a circle" persists, check if `w-` / `h-` classes on the icon match the font-size logic in `Icons.tsx`.

## Hypothesis
The Dashboard components likely have wrapper `divs` for the icons (the "circles") that relied on the icon being `block` or `flex`, and now with `inline-flex`, vertical alignment might be off if the parent isn't strictly centering.
