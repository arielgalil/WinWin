# Implementation Plan - Dark/Light Mode Theme Toggle (WCAG AA)

## Objective
Implement a high-contrast (WCAG AA compliant), high-aesthetic theme switcher for the Admin Panel.

## Proposed Design System
### 1. Dark Theme (Refined)
- **Background**: `#020617` (Deepest Navy)
- **Surface**: `rgba(255, 255, 255, 0.05)` (Glassmorphism)
- **Primary Text**: `#F8FAFC` (Slate 50) - **Contrast 19:1**
- **Secondary Text**: `#94A3B8` (Slate 400) - **Contrast 6.4:1**
- **Borders**: `rgba(255, 255, 255, 0.1)`

### 2. Light Theme (New)
- **Background**: `#F1F5F9` (Slate 100)
- **Surface**: `rgba(255, 255, 255, 0.8)` (Blurred White)
- **Primary Text**: `#0F172A` (Slate 900) - **Contrast 19:1**
- **Secondary Text**: `#475569` (Slate 600) - **Contrast 6.4:1**
- **Borders**: `rgba(15, 23, 42, 0.1)` (Soft Slate borders)

## Technical Strategy
1. **Context API**: Create `ThemeContext.tsx` to handle state ('light' | 'dark').
2. **Tailwind Class Method**: Use `darkMode: 'class'` in tailwind config (if possible) or use CSS variables.
3. **CSS Variables**: Update `theme.css` to use semantic names:
   - `--bg-primary`
   - `--text-primary`
   - `--text-secondary`
   - `--surface-glass`
4. **Sidebar Integration**: Add a toggle button in `AdminSidebar.tsx` at the bottom footer section.
5. **UI Components Refactor**: Update `AdminPanel.tsx`, `AdminSidebar.tsx`, and Manager components to use these variables instead of hardcoded `bg-slate-900` or `text-white`.

## Implementation Steps
### Step 1: Core Theme Logic
- Create `C:\Users\WIN10\האחסון שלי\הוראה\projects\winwin\contexts\ThemeContext.tsx`.
- Create `C:\Users\WIN10\האחסון שלי\הוראה\projects\winwin\hooks\useTheme.ts`.
- Wrap `App.tsx` with `ThemeProvider`.

### Step 2: Global CSS Enhancement
- Update `theme.css` with the new WCAG-compliant variables.
- Add transition effects for smooth switching.

### Step 3: Sidebar UI
- Add a button with Moon/Sun icon in the footer of `AdminSidebar.tsx`.
- Add tooltips/translations for "Switch to Dark Mode" / "Switch to Light Mode".

### Step 4: Component Refactoring (Phased)
- Update `AdminPanel.tsx` layout and headers.
- Update `AdminSidebar.tsx` navigation items.
- Update `UsersManager.tsx`, `ClassesManager.tsx`, etc. to ensure they look premium in Light Mode.

## WCAG AA Check
| Element | Background | Hex | Text | Hex | Ratio | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Primary (Light) | Slate 100 | #F1F5F9 | Slate 900 | #0F172A | 16.3:1 | ✅ AA |
| Muted (Light) | Slate 100 | #F1F5F9 | Slate 600 | #475569 | 5.5:1 | ✅ AA |
| Primary (Dark) | Slate 950 | #020617 | Slate 50 | #F8FAFC | 19.5:1 | ✅ AA |
| Muted (Dark) | Slate 950 | #020617 | Slate 400 | #94A3B8 | 6.5:1 | ✅ AA |

## Risk Assessment
- **Hardcoded Colors**: Many components might have hardcoded dark colors (e.g., `text-white`) that will need manual fixing to `text-[var(--text-primary)]`.
- **Gradient Backgrounds**: The `GradientBackground` component might need an overlay adjustment in Light mode to maintain text readability.
