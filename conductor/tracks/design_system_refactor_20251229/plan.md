# Plan: UI/UX Refactor & Design System (Track 4)

This plan overhauls the Admin Panel using Shadcn/UI and Lucide icons, while standardizing design tokens for a professional, branded administrative experience.

## Phase 1: Foundation & Design Tokens [checkpoint: db82d5b]

- [x] Task: Configure Shadcn/UI for Tailwind 4 f8efe90

    - [ ] Install Shadcn/UI dependencies and initialize.

    - [ ] Update `tailwind.config.ts` or CSS variables for Tailwind 4 compatibility.

- [x] Task: Define Brand-Infused Design Tokens c4c542e

    - [ ] Configure `globals.css` with Shadcn base (slate/zinc).

    - [ ] Override `--primary`, `--accent`, and `--ring` variables to match WinWin cyan/purple tones.     

    - [ ] Verify Noto Sans Hebrew is the default font for all UI components.

- [x] Task: Admin-Specific Lucide Icon Integration 9fcf97e

    - [ ] Set up Lucide React for the Admin Panel.

    - [ ] Verify that Dashboard components remain unaffected (using Material Symbols).

- [x] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Design Tokens' (Protocol in workflow.md)

## Phase 2: Core Component Migration
- [~] Task: Implement Base Components (TDD)
    - [ ] Write tests for new Shadcn-based `Button` and `Input`.
    - [ ] Implement `Button` and `Input` with RTL support and 44px touch targets.
- [ ] Task: Implement Surface Components
    - [ ] Implement `Card`, `Badge`, and `Separator`.
    - [ ] Ensure subtle brand infusion (e.g., light cyan/purple tints) is applied.
- [ ] Task: Implement Overlay Components
    - [ ] Implement `Dialog` (Modal) and `DropdownMenu`.
    - [ ] **Critical:** Re-implement "Delete Safety" logic (red borders, anti-nudge buttons) in the new `Dialog`.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Core Component Migration' (Protocol in workflow.md)

## Phase 3: Responsive Navigation Overhaul
- [ ] Task: Build the Shadcn Sidebar
    - [ ] Implement the `Sidebar` component.
    - [ ] Configure RTL-specific animations and positioning.
    - [ ] Ensure collapse/expand behavior is optimized for mobile.
- [ ] Task: Layout Integration
    - [ ] Create a new `AdminLayout` wrapper using the Sidebar.
    - [ ] Migrate `AdminPanel` navigation logic to the new sidebar.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Responsive Navigation Overhaul' (Protocol in workflow.md)

## Phase 4: Refinement & Standards Audit
- [ ] Task: RTL & Accessibility Audit
    - [ ] Perform a full sweep of the Admin Panel to ensure no text/icon inversion issues.
    - [ ] Verify WCAG AAA compliance for new component contrast.
- [ ] Task: Final Polish & "High-Energy" Accents
    - [ ] Add subtle "High-energy" visual cues (gradient accents) to primary Admin views.
    - [ ] Perform final performance audit for low-end mobile devices.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Refinement & Standards Audit' (Protocol in workflow.md)
