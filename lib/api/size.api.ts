import apiClient from '../config/axios.config'

export class SizeAPI {
    private readonly baseEndpoint = '/size'

    // Get all sizes (matches backend GET /api/size/all)
    async getAllSizes(query?: {
        pageIndex?: number
        pageSize?: number
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
                throw new Error(error.response.data?.message || 'Failed to fetch sizes')
            }
            throw new Error('Network error occurred')
        }
    }

    // Get size by ID (matches backend GET /api/size/{id})
    async getSizeById(id: string) {
        try {
            const response = await apiClient.get(`${this.baseEndpoint}/${id}`)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to fetch size')
            }
            throw new Error('Network error occurred')
        }
    }

    // Create new size (matches backend POST /api/size)
    async createSize(sizeData: {
        sizeDescription: string
        price: number
    }) {
        try {
            const response = await apiClient.post(this.baseEndpoint, sizeData)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to create size')
            }
            throw new Error('Network error occurred')
        }
    }

    // Update size (matches backend PUT /api/size)
    async updateSize(id: string, sizeData: {
        sizeDescription: string
        price: number
    }) {
        try {
            const response = await apiClient.put(this.baseEndpoint, {
                id,
                ...sizeData
            })
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to update size')
            }
            throw new Error('Network error occurred')
        }
    }

    // Delete size (matches backend DELETE /api/size/{id})
    async deleteSize(id: string) {
        try {
            const response = await apiClient.delete(`${this.baseEndpoint}/${id}`)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to delete size')
            }
            throw new Error('Network error occurred')
        }
    }
}

export const sizeAPI = new SizeAPI()