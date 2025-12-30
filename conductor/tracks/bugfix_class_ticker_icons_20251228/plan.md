# Bug Fix: Class Ticker Icons Sizing & Styling

## Objective
Fix issues in the `ClassTicker` component (bottom team tabs) where:
1.  Icons do not always fit their circular containers (too big or too small).
2.  Some icons are missing their circular background wrapper entirely.

## Analysis
- **Component:** `src/components/dashboard/ClassTicker.tsx`
- **Issue 1 (Sizing):** Icons need to be sized relative to their container or have appropriate padding.
- **Issue 2 (Missing Circles):** Verify all states (rank, trend, default) wrap the icon in a styled `div` (circle/rounded).

## Plan
- [x] Task: Audit `ClassTicker.tsx`
    - [x] Read file to identify icon rendering logic.
    - [x] Check `TrendUpIcon`, `TrendDownIcon`, `TrendSameIcon` usages. (Note: These icons are no longer used; replaced by Group Icons).
- [x] Task: Implement Dynamic Sizing / CSS Fixes
    - [x] Ensure all icon containers have consistent dimensions (e.g., `w-8 h-8`).
    - [x] Apply `flex items-center justify-center` to all containers (consistent with previous fixes).
    - [x] Use padding or responsive font-size to ensure icons don't overflow.
- [x] Task: Wrap Naked Icons
    - [x] Identify icons rendered without a wrapper.
    - [x] Wrap them in a standardized circular container.
