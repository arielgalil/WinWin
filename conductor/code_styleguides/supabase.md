# Supabase Style Guide

## Database
- **Naming Conventions:** Use `snake_case` for table names and column names.
- **Types:** Generate TypeScript types from your database schema using the Supabase CLI (`supabase gen types`).
- **RLS:** Always enable Row Level Security (RLS) on public tables.

## Client Usage
- **Single Instance:** Use a single instance of the Supabase client created in a dedicated service file.
- **Hooks:** Use React hooks (e.g., `useSession`, `useSupabaseClient`) for interacting with Supabase in components.

## Edge Functions
- **TypeScript:** Write Edge Functions in TypeScript.
- **Environment Variables:** Store secrets in Supabase Dashboard (or `.env` for local dev) and access them via `Deno.env.get()`.
