# Specification: UI Polish, Material Icons, and PWA Fix

## Overview
This track addresses three distinct UI/UX and infrastructure improvements:
1.  **Visual Feedback:** Adding hover background states to Delete/Cancel buttons in standardized modals for better interactivity.
2.  **Iconography Migration:** A full application audit and replacement of the current icon library (Lucide) with Google Material Symbols to unify the visual language.
3.  **PWA Infrastructure:** Resolving build errors caused by oversized assets (specifically `favicon.svg`) and ensuring correct PWA icon generation/referencing.

## Functional Requirements
### 1. Modal Button Hover Effects
- Apply a subtle background color change when hovering over "Delete" (red/destructive) and "Cancel" (neutral/ghost) buttons.
- Target the standardized confirmation modals used throughout the Admin Panel and Dashboard.
- Ensure the transition is smooth (using Tailwind/Framer Motion).

### 2. Material Icons Migration
- Conduct a full audit of all `Lucide` icon usage in the project.
- Replace all instances with corresponding Google Material Symbols.
- Ensure consistent sizing, weight, and color across all components.

### 3. PWA & Asset Optimization
- **Asset Optimization:** Optimize `favicon.svg` to reduce its size from 7.93 MB to well under the 2 MiB default Workbox limit.
- **Icon Standardization:** Ensure all required PWA icon sizes (192x192, 512x512, maskable, etc.) are correctly generated and referenced in the web manifest.
- **Build Success:** Ensure the production build completes without Workbox "maximumFileSizeToCacheInBytes" errors.

## Non-Functional Requirements
- **Performance:** Reduced asset sizes will improve initial load times and service worker installation.
- **Consistency:** Uniform iconography across all platforms (Mobile/Desktop).
- **Maintainability:** Standardizing on a single icon library.

## Acceptance Criteria
- [ ] Hovering over modal buttons shows clear visual feedback.
- [ ] No Lucide icons remain in the codebase.
- [ ] `npm run build` completes successfully without Workbox warnings or errors.
- [ ] `favicon.svg` is significantly smaller than its original 7.93 MB size.
- [ ] PWA manifest correctly references all standard icon sizes and types.

## Out of Scope
- Adding new modals or changing existing modal logic.
- Implementing new PWA features (like push notifications).
