import apiClient from '@/lib/config/axios.config'
import { DistanceRequest, DistanceSuccessResponse } from '@/lib/types/type'

class DistanceAPI {
    private baseEndpoint = '/distance'

    /**
     * Get distance between user location and storage location
     * Endpoint: GET /distance
     */
    async getDistance(request: DistanceRequest): Promise<DistanceSuccessResponse> {
        try {
            console.log('📍 Fetching distance:', request)
            
            const params = new URLSearchParams({
                userLatitude: request.userLatitude.toString(),
                userLongitude: request.userLongitude.toString(),
                storageLatitude: request.storageLatitude.toString(),
                storageLongitude: request.storageLongitude.toString()
            })
            
            const response = await apiClient.get(`${this.baseEndpoint}?${params.toString()}`)
            console.log('📍 Distance API response:', response.data)
            
            return response.data
        } catch (error: any) {
            console.error('📍 Distance API error:', error)
            
            // Handle different error scenarios
            if (error.response) {
                const errorMessage = error.response.data?.message || 'Failed to get distance'
                throw new Error(errorMessage)
            }
            
            if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
                throw new Error('Network error: Unable to fetch distance. Please check your connection.')
            }
            
            throw new Error('Failed to fetch distance between locations')
        }
    }
}

export const distanceAPI = new DistanceAPI()
export default distanceAPI