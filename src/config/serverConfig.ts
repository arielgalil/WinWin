// Secure environment configuration
// This file should be imported only in server-side code or build tools

export const serverConfig = {
  // Database configuration (server-side only)
  supabase: {
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  
  // AI configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  
  // Application configuration
  app: {
    version: process.env.npm_package_version || '1.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  }
};

// Validation function
export const validateServerConfig = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required server environment variables: ${missing.join(', ')}`);
  }
  
  return true;
};