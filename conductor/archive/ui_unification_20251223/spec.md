# Track Specification: Admin Panel UI Unification

## Goal
Transform the existing, fragmented Admin Panel into a visually cohesive, mobile-first interface that feels like it was designed by a single designer.

## Core Objectives
1.  **Shared UI Component Library:** Extract and refine common UI elements (Buttons, Tables, Form Controls, Modals) into a reusable library within `src/components/ui`.
2.  **Unified Styling Strategy:** Standardize on Tailwind CSS 4 utility classes and a central theme configuration.
3.  **Responsive Consistency:** Implement a standard "Card" layout for mobile data grids and ensure 44px touch targets across all administrative screens.
4.  **RTL Optimization:** Strictly enforce RTL button layouts and text alignment across all components.

## Target Components
- **Data Tables:** Replace generic HTML tables with a responsive, shared `AdminTable` component.
- **Buttons:** Standardize `Edit` (Green), `Delete` (Red), and `Secondary` (Purple) actions.
- **Modals:** Ensure all destructive actions use a consistent `ConfirmModal` with focus trapping.
- **Forms:** Unify spacing, typography, and validation feedback using standard components.

## Technical Requirements
- **Styling:** Tailwind CSS 4 + Framer Motion 12.
- **Icons:** Lucide React exclusively.
- **Accessibility:** WCAG AAA targets.
- **i18n:** No hard-coded strings.
