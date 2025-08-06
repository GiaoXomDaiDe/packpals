import apiClient from '../../lib/config/axios.config'

export class StorageAPI {
    private readonly baseEndpoint = '/storage'

    // Get all storages with optional query filters
    async getAllStorages(query?: {
        page?: number
        limit?: number
        address?: string
        status?: string
    }) {
        try {
            const params = new URLSearchParams()
            if (query) {
                Object.entries(query).forEach(([key, value]) => {
                    if (value !== undefined) {
                        params.append(key, value.toString())
                    }
                })
            }
            
            const response = await apiClient.get(`${this.baseEndpoint}/all?${params.toString()}`)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to fetch storages')
            }
            throw new Error('Network error occurred')
        }
    }

    // Get storage by ID
    async getStorageById(id: string) {
        try {
            const response = await apiClient.get(`${this.baseEndpoint}/${id}`)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to fetch storage')
            }
            throw new Error('Network error occurred')
        }
    }

    // Get storages by keeper ID
    async getStoragesByKeeperId(keeperId: string) {
        try {
            const response = await apiClient.get(`${this.baseEndpoint}/keepers/${keeperId}/storages`)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to fetch keeper storages')
            }
            throw new Error('Network error occurred')
        }
    }

    // Create new storage (for Keepers)
    async createStorage(storageData: {
        description: string
        address: string
        keeperId: string
    }) {
        try {
            const response = await apiClient.post(this.baseEndpoint, storageData)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to create storage')
            }
            throw new Error('Network error occurred')
        }
    }

    // Update storage (for Keepers)
    async updateStorage(id: string, storageData: {
        description?: string
        address?: string
        status?: string
    }) {
        try {
            const response = await apiClient.put(this.baseEndpoint, {
                id,
                ...storageData
            })
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to update storage')
            }
            throw new Error('Network error occurred')
        }
    }

    // Delete storage (for Keepers)
    async deleteStorage(id: string) {
        try {
            const response = await apiClient.delete(`${this.baseEndpoint}/${id}`)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to delete storage')
            }
            throw new Error('Network error occurred')
        }
    }

    // Get distance between two coordinates
    async getDistance(params: {
        lat1: number
        lon1: number
        lat2: number
        lon2: number
    }) {
        try {
            const queryParams = new URLSearchParams({
                lat1: params.lat1.toString(),
                lon1: params.lon1.toString(),
                lat2: params.lat2.toString(),
                lon2: params.lon2.toString()
            })
            
            const response = await apiClient.get(`${this.baseEndpoint}/distance?${queryParams.toString()}`)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to calculate distance')
            }
            throw new Error('Network error occurred')
        }
    }

    // Get total pending orders count for a keeper
    async getTotalPendingOrdersByKeeperId(keeperId: string) {
        try {
            const response = await apiClient.get(`${this.baseEndpoint}/keepers/${keeperId}/pending-orders-count`)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to fetch pending orders count')
            }
            throw new Error('Network error occurred')
        }
    }
}

export const storageAPI = new StorageAPI()