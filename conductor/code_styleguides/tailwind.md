# Tailwind CSS Style Guide

## Class Ordering
- **Logical Ordering:** Group utility classes logically (Layout -> Box Model -> Typography -> Visuals -> Misc) or use a linter plugin for consistent ordering.

## Utility-First
- **Avoid Custom CSS:** Prefer Tailwind utility classes over writing custom CSS in `.css` files. Use `theme.extend` in `tailwind.config.js` for custom values.
- **Modifiers:** Use prefixes like `hover:`, `focus:`, `md:`, `dark:` directly in the class string.

## Components
- **Extracting Classes:** For highly reusable patterns, consider extracting them into a React component rather than using `@apply`.
- **Dynamic Classes:** Use `clsx` or `tailwind-merge` for constructing dynamic class strings conditionally.

## Responsive Design
- **Mobile-First:** Style for mobile first, then use `sm:`, `md:`, `lg:`, `xl:` overrides for larger screens.
