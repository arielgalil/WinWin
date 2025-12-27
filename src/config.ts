
// Central configuration file
const getEnvVar = (key: string, fallback: string = ''): string => {
  // Try Vite environment variables first (client-side)
  if (typeof (import.meta as any).env !== 'undefined') {
    return (import.meta as any).env[`VITE_${key}`] || (import.meta as any).env[key] || fallback;
  }
  // Fallback to process.env (server-side)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback;
  }
  return fallback;
};

export const CONFIG = {
  APP_VERSION: '3.6.0',
  
  SUPABASE: {
    URL: getEnvVar('SUPABASE_URL'),
    KEY: getEnvVar('SUPABASE_KEY')
  }
};

export const TIMEOUTS = {
  loadingScreenOptionsMs: 4000,
  toastDurationMs: 4000,
  authProfileFetchMs: 6000,
  authSafetyTimeoutMs: 8000,
};

/**
 * Checks if a user has superuser privileges.
 * Strictly relies on the role provided from the database profile or campaign role.
 */
export const isSuperUser = (role?: string | null) => {
  // If we have a role, it MUST be superuser.
  if (role) {
    const cleanRole = role.toLowerCase().trim();
    return cleanRole === 'superuser' || cleanRole === 'super_user';
  }
  
  return false;
};

/**
 * Checks if a user has admin or higher privileges.
 */
export const isAdmin = (userRole?: string | null, campaignRole?: string | null) => {
  if (isSuperUser(userRole) || isSuperUser(campaignRole)) return true;
  
  const cleanUserRole = userRole?.toLowerCase().trim();
  const cleanCampaignRole = campaignRole?.toLowerCase().trim();
  
  return cleanUserRole === 'admin' || cleanCampaignRole === 'admin' || cleanCampaignRole === 'competition_admin';
};
