// URL configuration for Hoshima application
export const API_CONFIG = {
  // Backend URL (uses ngrok in development)
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://k-a-e-l-e-n.onrender.com',
  
  // Endpoints World Wallet
  WORLD_WALLET: {
    NONCE: '/api/world-wallet/nonce',
    COMPLETE_SIWE: '/api/world-wallet/complete-siwe',
    UPDATE_PROFILE: '/api/world-wallet/update-profile',
  },
  
  // Autres endpoints
  CHAT: '/api/chat',
  USERS: '/api/users',
  HEALTH: '/api/health',
};

// Authentication configuration
export const AUTH_CONFIG = {
  // Local storage keys
  TOKEN_KEY: 'hoshima_auth_token',
  USER_KEY: 'hoshima_user',
  
  // Token expiration duration (in milliseconds)
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  
  // SIWE configuration
  SIWE: {
          EXPIRATION_TIME: 7 * 24 * 60 * 60 * 1000, // 7 days
      NOT_BEFORE: 24 * 60 * 60 * 1000, // -1 day
    STATEMENT: 'Connect to Hoshima with your World Wallet to access K.A.E.L.E.N',
  },
};

  // Error messages
export const ERROR_MESSAGES = {
  WORLD_APP_REQUIRED: 'This application must be opened in World App',
  NONCE_FETCH_ERROR: 'Unable to fetch nonce',
  AUTH_CANCELLED: 'Authentication cancelled',
  VERIFICATION_FAILED: 'Authentication verification failed',
  SESSION_EXPIRED: 'Session expired, please reconnect',
  GENERIC_ERROR: 'Authentication error',
};

// Helper to build complete URLs
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}; 