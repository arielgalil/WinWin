
import { createClient } from '@supabase/supabase-js';

// --- הוראות הגדרה ---
// 1. צור פרויקט ב-https://supabase.com
// 2. לך ל-Project Settings -> API
// 3. העתק את ה-Project URL וה-Anon Public Key
// 4. הדבק אותם למטה במקום המחרוזות הריקות או הגדר משתני סביבה

// Safely access environment variables
const getEnv = (key: string) => {
  // Try Vite environment variables first (client-side)
  if (typeof (import.meta as any).env !== 'undefined') {
    const val = (import.meta as any).env[`VITE_${key}`] || (import.meta as any).env[key];
    return val ? val.trim() : undefined;
  }
  // Fallback to process.env (server-side)
  if (typeof process !== 'undefined' && process.env) {
    const val = process.env[key];
    return val ? val.trim() : undefined;
  }
  return undefined;
};

// Client-side configuration - only expose what's necessary
const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_KEY');

// Validate required environment variables
if (!supabaseUrl || !supabaseKey) {
  const missing = [];
  if (!supabaseUrl) missing.push("VITE_SUPABASE_URL");
  if (!supabaseKey) missing.push("VITE_SUPABASE_KEY");
  
  console.error(`CRITICAL: Missing Supabase environment variables: ${missing.join(', ')}`);
  
  if (typeof (import.meta as any).env !== 'undefined' && (import.meta as any).env.PROD) {
      throw new Error(`Missing Supabase credentials in production. Required: ${missing.join(', ')}`);
  }
}

// Create client with validated credentials
export const supabase = createClient(supabaseUrl, supabaseKey);

// Export only what's needed for client-side
export { supabaseUrl, supabaseKey };

// Helper to create a temporary client for administrative actions (like creating users)
// without overwriting the current user's session in local storage.
export const createTempClient = () => createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Critical: Do not save this session to localStorage
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'temp_admin_auth_session' // Unique key to prevent "Multiple GoTrueClient" warning
  }
});
