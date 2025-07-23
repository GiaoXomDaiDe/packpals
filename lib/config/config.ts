/**
 * API Configuration
 * Environment-based configuration for different deployment stages
 */

import NETWORK_CONFIG from './network.config'

// Environment detection
const isProduction = process.env.NODE_ENV === 'production'

// Get current environment config
const getCurrentConfig = () => {
    if (process.env.EXPO_PUBLIC_ENV === 'staging') {
        return NETWORK_CONFIG.staging
    }
    if (isProduction) {
        return NETWORK_CONFIG.production
    }
    return NETWORK_CONFIG.development
}

export const apiConfig = getCurrentConfig()

// API Endpoints mapping based on backend controllers
export const API_ENDPOINTS = {
    // Auth endpoints (/api/auth/*)
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        CHANGE_PASSWORD: '/auth/change-password',
        REFRESH_TOKEN: '/auth/refresh',
        LOGOUT: '/auth/logout',
    },
    
    // User endpoints (/api/user/*)
    USER: {
        PROFILE: '/user',
        UPDATE_PROFILE: '/user',
        DELETE_ACCOUNT: '/user',
        GET_ALL: '/user/all',
    },
    
    // Storage endpoints (/api/storage/*)
    STORAGE: {
        GET_ALL: '/storage',
        GET_BY_ID: '/storage',
        CREATE: '/storage',
        UPDATE: '/storage',
        DELETE: '/storage',
        SEARCH: '/storage/search',
    },
    
    // Order endpoints (/api/order/*)
    ORDER: {
        GET_ALL: '/order',
        GET_BY_ID: '/order',
        CREATE: '/order',
        UPDATE: '/order',
        DELETE: '/order',
        USER_ORDERS: '/order/user',
    },
    
    // Rating endpoints (/api/rating/*)
    RATING: {
        GET_ALL: '/rating',
        CREATE: '/rating',
        UPDATE: '/rating',
        DELETE: '/rating',
        GET_BY_STORAGE: '/rating/storage',
    },
    
    // Payment endpoints (/api/payment/*)
    PAYMENT: {
        CREATE: '/payment',
        CALLBACK: '/payment/callback',
        IPN: '/payment/ipn-action',
        HISTORY: '/payment/history',
    },
    
    // Upload endpoints (/api/upload/*)
    UPLOAD: {
        IMAGE: '/upload/image',
        DOCUMENT: '/upload/document',
        MULTIPLE: '/upload/multiple',
    },
    
    // Size endpoints (/api/size/*)
    SIZE: {
        GET_ALL: '/size',
        CREATE: '/size',
        UPDATE: '/size',
        DELETE: '/size',
    }
}

// HTTP Status Codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
}

// Request timeout configurations
export const TIMEOUT_CONFIG = {
    DEFAULT: apiConfig.timeout,
    UPLOAD: 30000, // 30 seconds for file uploads
    DOWNLOAD: 60000, // 60 seconds for downloads
}

export default apiConfig
