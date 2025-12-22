// Environment variable configuration with security validation

// Helper function to get environment variables consistently
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

// Only expose non-sensitive environment variables to client
export const publicEnv = {
  APP_VERSION: getEnvVar('APP_VERSION', '1.0.0'),
  API_URL: getEnvVar('API_URL', 'http://localhost:3000'),
  NODE_ENV: getEnvVar('NODE_ENV', 'development')
};

// Server-side only environment variables (never exposed to browser)
export const serverEnv = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  DATABASE_URL: process.env.DATABASE_URL || ''
} as const;

// Validation function for required environment variables
export const validateEnv = () => {
  const required = ['VITE_API_URL'] as const;
  const missing = required.filter(key => !publicEnv[key as keyof typeof publicEnv]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Only validate server-side variables on server
  if (typeof window === 'undefined') {
    const serverRequired = ['GEMINI_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
    const serverMissing = serverRequired.filter(key => !serverEnv[key as keyof typeof serverEnv]);
    
    if (serverMissing.length > 0) {
      throw new Error(`Missing required server environment variables: ${serverMissing.join(', ')}`);
    }
  }
};

// Auto-validate on import
validateEnv();