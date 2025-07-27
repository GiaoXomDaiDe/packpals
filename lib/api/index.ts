// Main API module exports - Centralized access to all API functionality

// Export API service factory (recommended approach)
export { APIServiceFactory, apiServices } from './factory'

// Export individual API services (for direct access)
export { authAPI } from './auth.api'
export { distanceAPI } from './distance.api'
export { orderAPI } from './order.api'
export { orderDetailsAPI } from './orderdetails.api'
export { paymentAPI } from './payment.api'
export { ratingAPI } from './rating.api'
export { sizeAPI } from './size.api'
export { storageAPI } from './storage.api'
export { userAPI } from './user.api'

// Export axios instance for direct HTTP calls if needed
export { default as apiClient } from '../config/axios.config'

// Export configuration and types
export { API_ENDPOINTS, apiConfig, HTTP_STATUS, TIMEOUT_CONFIG } from '../config/config'

// Re-export types for convenience
export type * from '../types/auth.types'
export type * from '../types/rating.types'

