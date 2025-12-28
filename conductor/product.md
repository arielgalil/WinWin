# Product Specification: "Tacharut Matzmiha" (Growth Competition)

## Project Overview
"Tacharut Matzmiha" (🌱 תחרות מצמיחה) is a gamified educational platform focused on collective and individual growth. Unlike standard zero-sum competitions, this system emphasizes **collaborative achievement**: as individuals and groups accumulate points, they unlock shared goals and reveal a hidden prize (visualized as a progressive image reveal).

## Core Entities & Structure
1.  **Dual Unit System:**
    * **Students:** Individual entities accumulating personal scores.
    * **Groups:** Aggregations of students (e.g., classes). Points can be awarded directly to a group or aggregated from student scores.
2.  **The "Big Goal" (Collaborative Gamification):**
    * **Shared Progress:** A global score meter that aggregates all groups' achievements.
    * **The Reveal:** As the global score approaches the target, a hidden image (The Prize) is progressively revealed to the public.
    * **Timeline:** Undefined/Flexible. The competition ends when the goal is reached, not by a specific date.

## User Roles & Permissions

1.  **Super Admin (משתמש על):**

    *   **Capability:** Full CRUD on Competitions (Create/Delete/Archive).

    *   **Hierarchical Authority:** Only Super Admins can manage other Super Admin profiles.

    *   **Sharing:** Can generate and share comprehensive multi-link invitations (Dashboard, Scoring, and Admin Panel).

    *   **Interface:** Dedicated Super Admin Dashboard.

2.  **Competition Manager (מנהל תחרות):**

    *   **Capability:** The central power user.

        * Manage Users (Teachers/Students) and Groups.

        * **Restriction:** Cannot edit or delete Super Admin users.

        * Manage Configuration (Target score, Prize image, Rules).

        * Full Data Control: Can edit/delete score transactions for *anyone*.

        * View Reports: Detailed breakdown of progress per group/student.

        * **Sharing:** Can generate and share filtered multi-link invitations (Dashboard and Scoring only).

    *   **Interface:** Comprehensive Admin Panel (Must be Mobile-Friendly).
3.  **Teacher (מורה):**
    * **Capability:** Restricted input. Can only award points to *their* specific assigned students or *their* assigned group.
    * **Interface:** "Quick Input" mobile-first screen for rapid scoring in the field.
4.  **Public/Students:**
    * **Capability:** View-only.
    * **Interface:** Public Scoreboard (Leaderboard & Image Reveal).
    * **Note:** The Public Scoreboard is a pre-existing module. **Do not modify** without explicit instruction.

## Key Interfaces & Workflows

### 1. The Admin Panel (Competition Manager)
* **Purpose:** Total control over the competition lifecycle and data.
* **Requirements:**
    * **Data Grids:** Advanced tables with filtering, sorting, and bulk actions (e.g., "Add 50 points to selected students").
        *   **CRUD Operations:** Create/Edit/Delete groups and students with strict validation and **enforced delete safety protocols**.
        *   **Audit Logs:** Ability to see who gave points to whom and when.
        *   **Responsiveness:** Must be fully functional on Desktop and Mobile (using specific RTL button layouts and destructive action safety gaps defined in Guidelines).
    *   **Quick Actions:** Role-based "Share" utility in header and mobile menu for easy distribution of competition links.

### 2. The Quick Input Screen (Teacher)
* **Purpose:** Rapid data entry in real-time (e.g., in class).
* **Requirements:**
    * Optimized for "Fat Finger" / Mobile usage.
    * Context Switching: Fast toggle between "My Group" vs. "My Students".
    * Action: Select Entity -> Input Score -> Submit (Optimistic UI).

## Technical Constraints & Guardrails
* **Existing Module:** The Public Scoreboard code is strictly "Out of Bounds" for refactoring unless requested.
* **UI Focus:** Development efforts are focused on stabilizing and enhancing the **Admin Panel** and the **Teacher Input Interface** (Mobile-first, WCAG AAA).
* **Performance Architecture:** Employs atomic state management (Zustand) and granular data fetching (React Query with selectors) to ensure responsiveness on low-end mobile devices during real-time updates.

---

# Approved Product Guide - WinWin

## Vision
WinWin is a gamified education and competition platform designed to transform the learning environment into an engaging, interactive experience. By leveraging real-time data visualization and gamification mechanics, the platform fosters a sense of healthy competition and community within educational institutions.

## Target Users
*   **Teachers & Administrators:** The primary users who manage the day-to-day operations, including class setup, student management, and real-time points distribution.
*   **Students:** The core participants who engage with the platform to track their progress and see their standing on institutional leaderboards.

## Core Goals
*   **Engagement through Gamification:** Increase student motivation by turning educational milestones into rewarding game-like achievements.
*   **Community Building:** Use school-wide leaderboards and collective "Mission Meters" to build a shared sense of progress and institutional pride.
*   **Streamlined Management:** Provide educators with a visually cohesive, mobile-first interface powered by a shared UI component library for managing competitions without administrative overhead.

## Key Features
*   **Real-time Visualization:** Dynamic leaderboards, podiums, and progress meters that update instantly as points are awarded.
*   **Robust Admin Suite:** Comprehensive tools for managing classes, importing student data via Excel, and fine-tuning competition settings.
*   **Role-Based Sharing:** Intelligent link generation that provides the right tools to the right users with a single click.
*   **Centralized Access Control:** Dedicated internal services for managing user permissions and routing safety.
*   **Unified Routing Security:** Generic ProtectedRoute infrastructure for consistent and reliable permission checks across the platform.
*   **AI Integration:** Leverages Google Gemini to provide intelligent settings management and potentially automated feedback or analysis.
*   **Multi-Platform Access:** A responsive web application designed for both large-screen dashboard displays and mobile-first teacher interactions.
*   **PWA Capabilities:** Fully installable Progressive Web App with offline support, asset caching, and background synchronization for reliable data entry in low-connectivity environments.

## Aesthetic & UX Strategy
*   **Maintain Established Identity:** The platform will strictly adhere to its current vibrant and high-energy visual style, utilizing existing animations, gradients, and UI patterns.
*   **Mobile-First Efficiency:** Prioritize quick-action workflows for teachers to ensure points can be managed in real-time during active classroom sessions.
