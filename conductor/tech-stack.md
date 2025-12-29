# Technology Stack - WinWin

## Frontend
- **Framework:** [React 19](https://react.dev/) — Latest stable version for building the user interface.
- **Build Tool:** [Vite 6](https://vitejs.dev/) — Provides a fast and efficient development environment.
- **Language:** [TypeScript](https://www.typescriptlang.org/) — Ensures type safety and improves maintainability.
- **Styling:**
    - [Tailwind CSS 4](https://tailwindcss.com/) — Utility-first CSS framework for rapid UI development.
    - [Framer Motion 12](https://www.framer.com/motion/) — Powering the platform's high-energy animations.
    - **Typography:** [Noto Sans Hebrew](https://fonts.google.com/specimen/Noto+Sans+Hebrew) — Primary font for optimized RTL readability.
    - [Google Material Symbols](https://fonts.google.com/icons) — The primary icon set.
- **State Management & Data Fetching:** 
    - [TanStack Query 5 (React Query)](https://tanstack.com/query/latest) — Manages server-state and caching with Supabase.
    - [Zustand 5](https://zustand-demo.pmnd.rs/) — Atomic, high-performance client-side global state management.
- **PWA & Offline Support:** 
    - [Vite PWA Plugin](https://vite-pwa-org.netlify.app/) — Manages service worker generation and web manifest.
    - [Workbox](https://developer.chrome.com/docs/workbox/) — Powering offline asset caching and background synchronization.

## Backend & Infrastructure
- **Platform:** [Supabase](https://supabase.com/)
    - **Database:** PostgreSQL — Handles all persistent data (competitions, users, points).
    - **Authentication:** Supabase Auth — Manages secure user login and role-based access control.
    - **Edge Functions:** Supabase Functions (TypeScript/Deno) — Executes server-side logic, such as AI integrations.
- **AI Integration:** [Google Gemini API](https://ai.google.dev/) — Integrated via `@google/genai` for intelligent settings and analysis.

## Deployment & Hosting
- **Hosting:** [Firebase Hosting](https://firebase.google.com/docs/hosting) — Provides reliable, scalable hosting for the frontend application.
