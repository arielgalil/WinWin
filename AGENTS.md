# AGENTS.md

This file contains guidelines and commands for agentic coding agents working in this repository.

## Build Commands

### Development
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run analyze` - Build with bundle analysis (sets ANALYZE=true)

### Testing
- `npm test` - Run all tests with Vitest
- `npm test -- --run` - Run tests once (no watch mode)
- `npm test -- path/to/test.test.tsx` - Run single test file
- `npm test -- --reporter=verbose` - Run tests with verbose output

### Linting & Type Checking
- **Important**: Always run type checking after making changes
- This project uses TypeScript strict mode - check for type errors
- If lint/typecheck commands are not available, ask the user for the correct commands

## Project Structure

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State Management**: Zustand + React Query
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **PWA**: Vite PWA plugin with service worker
- **Testing**: Vitest + React Testing Library + jsdom

### Key Directories
- `src/components/` - React components (ui/, dashboard/, admin/, lite/)
- `src/hooks/` - Custom React hooks
- `src/contexts/` - React contexts (Auth, Language, SaveNotification)
- `src/utils/` - Utility functions
- `src/services/` - External service integrations
- `src/lib/` - Core library functions
- `src/types.ts` - TypeScript type definitions
- `supabase/` - Database and Supabase configuration

## Code Style Guidelines

### Import Organization
```typescript
// 1. React and core libraries
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Third-party libraries
import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';

// 3. Internal imports (use @ alias)
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
```

### Component Patterns
- Use functional components with React.FC type annotation
- Forward refs for UI components that need them
- Use shadcn/ui patterns with class-variance-authority (CVA)
- Export components and their variants separately

```typescript
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Component logic
  }
);
Button.displayName = "Button";
```

### TypeScript Conventions
- Use strict TypeScript settings (already configured)
- Prefer interfaces over types for object shapes
- Use proper typing for all props and return values
- Use generic types where appropriate
- No implicit any - always type parameters

### State Management
- Use Zustand for global state
- Use React Query for server state
- Custom hooks for component state logic
- Context providers for cross-cutting concerns (auth, language)

### Error Handling
- Use error boundaries for component errors
- Implement proper error formatting with `useErrorFormatter`
- Log errors appropriately but don't expose sensitive data
- Use try-catch blocks for async operations

### Styling Conventions
- Use Tailwind CSS classes exclusively
- Leverage shadcn/ui component system
- Use `cn()` utility for conditional classes
- Follow responsive design patterns with Tailwind breakpoints
- Use CSS variables for theme colors

### Naming Conventions
- Components: PascalCase (e.g., `DashboardHeader`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth`)
- Utilities: camelCase (e.g., `cn`, `formatDate`)
- Constants: UPPER_SNAKE_CASE (e.g., `APP_VERSION`)
- Files: PascalCase for components, camelCase for utilities

### File Organization
- Keep components in their respective directories
- Co-locate hooks with their components when specific
- Use `index.ts` files for clean exports
- Separate test files with `.test.tsx` or `.spec.tsx` suffix

### Testing Guidelines
- Write tests for components and custom hooks
- Use React Testing Library for component testing
- Mock external dependencies (Supabase, API calls)
- Test user interactions and state changes
- Use proper setup files for test configuration

### Performance Considerations
- Use React.memo for expensive components
- Implement proper loading states
- Use code splitting for large components
- Optimize bundle size with manual chunks in Vite config
- Leverage React Query for caching and deduplication

### Security Best Practices
- Never expose secrets or API keys to client
- Use proper authentication checks with `useAuth`
- Implement proper role-based access control
- Validate all user inputs
- Use Supabase RLS policies for data access

## Development Workflow

1. Before making changes, understand the existing codebase structure
2. Follow the established patterns and conventions
3. Write tests for new functionality
4. Run lint and typecheck commands before committing
5. Test the changes thoroughly
6. Ensure all tests pass

## Special Notes

- This is a multilingual application (Hebrew/English)
- PWA functionality is enabled with service worker
- Real-time updates use Supabase subscriptions
- The app has both admin and dashboard modes
- Background music and sound effects are implemented
- Responsive design is critical for various screen sizes