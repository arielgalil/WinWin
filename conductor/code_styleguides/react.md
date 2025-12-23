# React Style Guide

## Components
- **Functional Components:** Use functional components with hooks for all new components.
- **PascalCase:** Use PascalCase for component names and filenames (e.g., `UserProfile.tsx`).
- **Props:** Define props interfaces or types for all components. Use `React.FC<Props>` or destructured props with type annotations.

## Hooks
- **Rules of Hooks:** Adhere strictly to the Rules of Hooks (only call at the top level, only call from React functions).
- **Custom Hooks:** Extract reusable logic into custom hooks, naming them `use[Feature]`.

## State Management
- **TanStack Query:** Use `useQuery` and `useMutation` for server state.
- **Local State:** Use `useState` for simple local UI state.
- **Context:** Use Context API sparingly for global state that doesn't fit into server state (e.g., themes, auth session).

## Performance
- **Memoization:** Use `useMemo` and `useCallback` only when necessary to prevent expensive re-renders or stable references for dependency arrays.
- **Lazy Loading:** Use `React.lazy` and `Suspense` for route-based code splitting.

## JSX
- **Self-Closing Tags:** Use self-closing tags when there are no children.
- **Fragments:** Use short syntax `<>` and `</>` for fragments.
