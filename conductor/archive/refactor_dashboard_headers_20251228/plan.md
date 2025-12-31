# Refactor: Unified Dashboard Card Header

## Objective
Standardize the headers of all dashboard cards (Podium, MissionMeter, StudentLeaderboard, ClassTicker) to use a single, consistent component. This ensures all icons are perfectly centered within a circular wrapper and the layout is identical.

## Analysis
- **Current State:** Each component implements its own header markup. Some use `rounded-[var(--radius-main)]` (squircle), others `rounded-full`. Icon sizing and alignment vary slightly.
- **Solution:** Use the newly created `DashboardCardHeader` component.

## Plan
- [x] Task: Refactor `Podium.tsx` [DashboardCardHeader] [a228510]
- [x] Task: Refactor `MissionMeter.tsx` [DashboardCardHeader] [a228510]
- [x] Task: Refactor `StudentLeaderboard.tsx` [DashboardCardHeader] [a228510]
- [x] Task: Refactor `ClassTicker.tsx` [DashboardCardHeader] [a228510]
- [x] Task: Fix Class Ticker Item Icons [96deca3]
    - [x] While in `ClassTicker.tsx`, also fix the icons *inside* the scrolling cards to be circular and centered (as originally requested in the previous turn).

## Component Spec (`DashboardCardHeader`)
- **Wrapper:** `w-7 h-7 rounded-full flex items-center justify-center`.
- **Props:** `title`, `icon`, `iconColorClass`, `iconBgClass`, `borderColorClass`, `rightContent`.