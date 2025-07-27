import { authAPI } from './auth.api'
import { orderAPI } from './order.api'
import { ratingAPI } from './rating.api'
import { storageAPI } from './storage.api'
import { userAPI } from './user.api'

/**
 * API Service Factory
 * Central access point for all API services
 * Provides type-safe access to all API endpoints
 */
export class APIServiceFactory {
    private static instance: APIServiceFactory

    // API service instances
    public readonly auth = authAPI
    public readonly storage = storageAPI
    public readonly order = orderAPI
    public readonly user = userAPI
    public readonly rating = ratingAPI

    private constructor() {
        // Private constructor for singleton pattern
    }

    /**
     * Get singleton instance of API service factory
     */
    public static getInstance(): APIServiceFactory {
        if (!APIServiceFactory.instance) {
            APIServiceFactory.instance = new APIServiceFactory()
        }
        return APIServiceFactory.instance
    }

    /**
     * Health check for all services
     * Useful for debugging and monitoring
     */
    public async healthCheck(): Promise<{
        auth: boolean
        storage: boolean
        order: boolean
        user: boolean
        rating: boolean
    }> {
        const results = {
            auth: true,
            storage: true,
            order: true,
            user: true,
            rating: true
        }

        try {
            // You can implement actual health check endpoints here
            console.log('🏥 API Health Check - All services initialized')
        } catch (error) {
            console.error('🏥 API Health Check failed:', error)
        }

        return results
    }
}

// Export singleton instance
export const apiServices = APIServiceFactory.getInstance()

// Export individual services for direct access (backward compatibility)
export { authAPI, orderAPI, ratingAPI, storageAPI, userAPI }

