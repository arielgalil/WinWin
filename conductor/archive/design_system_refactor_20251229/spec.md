# Specification: UI/UX Refactor & Design System (Track 4)

## Overview
This track initiates a comprehensive modernization of the WinWin Admin Panel. By adopting **Shadcn/UI** and **Tailwind 4**, we will replace the legacy custom UI with a professional, high-performance design system. The goal is to create a "Fresh Start" for the administrative experience—cleaner and more professional—while maintaining subtle brand cues that align with the platform's high-energy student dashboard.

## Functional Requirements

### 1. Shadcn/UI & Tailwind 4 Integration
- **Framework Setup:** Properly configure Shadcn/UI to work with the existing Tailwind 4 and React 19 environment.
- **Component Migration (Fresh Start):** Implement new versions of core Admin components:
    - `Button`, `Input`, `Label`
    - `Card`, `Dialog` (Modal), `DropdownMenu`
    - `Tabs`, `Separator`, `Badge`
- **Responsive Sidebar:** Replace the current Admin navigation with the official **Shadcn Sidebar** component (collapsible, mobile-responsive, and RTL-compatible).

### 2. Unified Design Tokens
- **Palette:** Modernize the Admin Panel using a Shadcn-base (slate/zinc) but override primary/accent tokens to reflect WinWin brand colors (subtle infusion of cyan and purple).
- **Typography:** Standardize on Noto Sans Hebrew with consistent scale and line-heights.
- **Spacing:** Enforce a strict spacing scale for margins and padding across all Admin sections.

### 3. Iconography Pivot
- **Lucide Migration:** In the **Admin Panel only**, replace Google Material Symbols with **Lucide React** icons. This provides a cleaner, more contemporary look for administrative tasks.
- **Dashboard Isolation:** The student-facing Dashboard will continue to use Material Symbols to maintain its unique high-energy identity.

### 4. Visual Balance (Subtle Brand Infusion)
- Apply subtle branding touches (e.g., gradient accents on active tabs or tinted backgrounds for status cards) to ensure the Admin Panel feels cohesive with the overall WinWin platform without sacrificing administrative clarity.

## Non-Functional Requirements
- **RTL Compatibility:** All Shadcn components must be verified for perfect RTL behavior (alignment, padding, icon rotation where applicable).
- **Mobile Performance:** Components must be lightweight and pass all existing "Touch Target" size requirements (min 44x44px).
- **React 19 Standards:** Use modern React 19 patterns (e.g., `use` hook, simplified Ref handling).

## Acceptance Criteria
- [ ] Admin Panel is completely navigable via the new Shadcn Sidebar.
- [ ] Primary actions (Create, Edit, Delete) in all managers use new Shadcn components.
- [ ] Administrative icons are consistently Lucide.
- [ ] RTL layout is pixel-perfect on both mobile and desktop.
- [ ] Dashboard visual identity remains untouched.

## Out of Scope
- Refactoring or restyling the Public Scoreboard/Dashboard.
- Modifying backend Supabase Edge Functions or database schema.
- Implementing "Data Tables" or "Command Menu" (deferred to future tracks).
