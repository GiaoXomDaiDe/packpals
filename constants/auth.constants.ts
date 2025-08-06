// Auth storage keys from environment
export const AUTH_KEYS = {
  TOKEN: process.env.AUTH_TOKEN_KEY || 'auth_token',
  USER_DATA: process.env.USER_DATA_KEY || 'user_data',
} as const

// API endpoints
export const API_ENDPOINTS = {
  AUTH: process.env.AUTH_ENDPOINT || '/auth',
} as const

// Timeouts
export const TIMEOUTS = {
  API: parseInt(process.env.API_TIMEOUT || '10000'),
  LOGIN: parseInt(process.env.LOGIN_TIMEOUT || '15000'),
} as const

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Cannot connect to server. Please check your network connection.',
  INVALID_TOKEN: 'Invalid token data received from server',
  LOGIN_FAILED: 'Login failed',
  REGISTRATION_FAILED: 'Registration failed',
  EMAIL_EXISTS: 'Email already exists. Please use a different email.',
  USERNAME_TAKEN: 'Username is already taken. Please choose another.',
  PHONE_EXISTS: 'Phone number is already registered.',
  PASSWORD_INVALID: 'Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character',
  PASSWORD_MISMATCH: 'Password confirmation does not match',
  TIMEOUT: 'Request timed out. Please check your network connection.',
  NO_USER_DATA: 'No user data to update',
} as const
