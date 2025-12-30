# Plan: UI Polish and Layout Cleanup

## Phase 1: Layout Cleanup & Redundancy Removal [checkpoint: a764a0e]
- [x] Task: Remove duplicate section in "Scoring and Group Management" tab
    - [x] Write tests to verify the presence of only one management container
    - [x] Remove the redundant bottom half of the tab in `AdminPanel.tsx` or its subcomponents
- [x] Task: Conductor - User Manual Verification 'Layout Cleanup & Redundancy Removal' (Protocol in workflow.md)

## Phase 2: Footer Rebuild
- [x] Task: Redesign Footer component for uniform spacing [43c2533]
    - [x] Write unit tests for the `Footer` component layout properties
    - [x] Refactor Footer to use a clean Flexbox/Grid layout with consistent gaps
    - [x] Remove all decorative lines and dividers
- [x] Task: Conductor - User Manual Verification 'Footer Rebuild' (Protocol in workflow.md) [ce41977]

## Phase 3: Emoji Workflow Improvement
- [ ] Task: Convert Emoji Selection to Popover
    - [ ] Write tests for the new Popover-based emoji trigger
    - [ ] Implement `Popover` from Shadcn/UI for the emoji picker in target modals
    - [ ] Ensure the popover is non-dimming and correctly positioned
- [ ] Task: Conductor - User Manual Verification 'Emoji Workflow Improvement' (Protocol in workflow.md)

## Phase 4: Branding Visual Preview
- [ ] Task: Implement Floating Preview Card
    - [ ] Write tests for the `BrandingPreview` component
    - [ ] Create the `BrandingPreview` component with dynamic style bindings
    - [ ] Integrate the preview card into the competition settings interface
- [ ] Task: Conductor - User Manual Verification 'Branding Visual Preview' (Protocol in workflow.md)
