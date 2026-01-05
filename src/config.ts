// Central configuration file

interface ImportMetaEnv {
  [key: string]: string | undefined;
}

interface CustomImportMeta extends ImportMeta {
  env: ImportMetaEnv;
}

const getEnvVar = (key: string, fallback: string = ""): string => {
  // Try Vite environment variables first (client-side)
  const meta = import.meta as unknown as CustomImportMeta;
  if (meta.env) {
    return meta.env[`VITE_${key}`] || meta.env[key] || fallback;
  }
  // Fallback to process.env (server-side)
  if (typeof process !== "undefined" && process.env) {
    return (process.env as Record<string, string | undefined>)[key] || fallback;
  }
  return fallback;
};

export const CONFIG = {
  // Use env variable set by Vite, with fallback for development
  APP_VERSION: getEnvVar("APP_VERSION", "3.6.0"),

  SUPABASE: {
    URL: getEnvVar("SUPABASE_URL"),
    KEY: getEnvVar("SUPABASE_KEY"),
  },
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
    return cleanRole === "superuser" || cleanRole === "super_user";
  }

  return false;
};

/**
 * Checks if a user has admin or higher privileges.
 */
export const isAdmin = (
  userRole?: string | null,
  campaignRole?: string | null,
) => {
  if (isSuperUser(userRole) || isSuperUser(campaignRole)) return true;

  const cleanUserRole = userRole?.toLowerCase().trim();
  const cleanCampaignRole = campaignRole?.toLowerCase().trim();

  return cleanUserRole === "admin" || cleanCampaignRole === "admin" ||
    cleanCampaignRole === "competition_admin";
};
