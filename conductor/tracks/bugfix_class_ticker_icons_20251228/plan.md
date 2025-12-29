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
- [ ] Task: Audit `ClassTicker.tsx`
    - [ ] Read file to identify icon rendering logic.
    - [ ] Check `TrendUpIcon`, `TrendDownIcon`, `TrendSameIcon` usages.
- [ ] Task: Implement Dynamic Sizing / CSS Fixes
    - [ ] Ensure all icon containers have consistent dimensions (e.g., `w-8 h-8`).
    - [ ] Apply `flex items-center justify-center` to all containers (consistent with previous fixes).
    - [ ] Use padding or responsive font-size to ensure icons don't overflow.
- [ ] Task: Wrap Naked Icons
    - [ ] Identify icons rendered without a wrapper.
    - [ ] Wrap them in a standardized circular container (e.g., `rounded-full bg-white/10`).
