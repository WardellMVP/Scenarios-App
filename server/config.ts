/**
 * Application Configuration
 * 
 * This module centralizes all environment-based configuration settings,
 * making it easier to adapt the application to different hosting environments.
 */

// Server configuration
export const SERVER = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SESSION_SECRET: process.env.SESSION_SECRET || 'cybersim_session_secret',
}

// Database configuration
export const DATABASE = {
  URL: process.env.DATABASE_URL,
  USER: process.env.PGUSER,
  PASSWORD: process.env.PGPASSWORD,
  HOST: process.env.PGHOST,
  PORT: process.env.PGPORT,
  NAME: process.env.PGDATABASE,
}

// GitLab OAuth configuration
export const OAUTH = {
  GITLAB_CLIENT_ID: process.env.GITLAB_CLIENT_ID,
  GITLAB_SECRET: process.env.GITLAB_SECRET,
  REDIRECT_URI: process.env.GITLAB_REDIRECT_URI || `http://localhost:${SERVER.PORT}/auth/gitlab/callback`,
  GITLAB_AUTH_URL: "https://gitlab.com/oauth/authorize",
  GITLAB_TOKEN_URL: "https://gitlab.com/oauth/token",
  GITLAB_API_URL: "https://gitlab.com/api/v4",
}

// Scenario configuration
export const SCENARIOS = {
  DIR: process.env.SCENARIOS_DIR || './scenarios',
}

// Cookie settings
export const COOKIE = {
  SECURE: process.env.NODE_ENV === 'production',
  HTTP_ONLY: true,
  MAX_AGE: 24 * 60 * 60 * 1000, // 1 day
}

// Validate critical configuration
export function validateConfig() {
  const missingVars = [];
  
  if (!OAUTH.GITLAB_CLIENT_ID) missingVars.push('GITLAB_CLIENT_ID');
  if (!OAUTH.GITLAB_SECRET) missingVars.push('GITLAB_SECRET');
  if (!DATABASE.URL) missingVars.push('DATABASE_URL');
  
  if (missingVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('Some features may not work correctly without these variables.');
  } else {
    console.log('Configuration validated successfully.');
  }
  
  // Log the redirect URI for debugging purposes
  console.log(`Using OAuth redirect URI: ${OAUTH.REDIRECT_URI}`);
  
  return missingVars.length === 0;
}