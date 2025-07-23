import apiClient from '../config/axios.config'

/**
 * User API endpoints
 * Based on backend UserController routes: /api/user/*
 */
export class UserAPI {
    private readonly baseEndpoint = '/user'

    /**
     * Get user profile
     * GET /api/user/{id}
     */
    async getProfile(userId: string) {
        console.log('🌐 User API - Getting profile for userId:', userId, 'Length:', userId.length)
        const response = await apiClient.get(`${this.baseEndpoint}/get-detail`, {
            params: {
                userId: userId.trim()
            }
        })
        console.log('🌐 User API response:', response.data)
        return {
            success: response.status >= 200 && response.status < 300,
            data: response.data.data || response.data,
            message: response.data.message || 'Success',
            statusCode: response.status,
        }
    }

    /**
     * Update user profile
     * PUT /api/user/{id}
     */
    async updateProfile(userId: string, userData: any) {
        const response = await apiClient.put(`${this.baseEndpoint}/${userId}`, userData)
        return {
            success: response.status >= 200 && response.status < 300,
            data: response.data.data || response.data,
            message: response.data.message || 'Success',
            statusCode: response.status,
        }
    }

    /**
     * Get all users (admin)
     * GET /api/user
     */
    async getAllUsers(page?: number, limit?: number) {
        const params = new URLSearchParams()
        if (page) params.append('page', page.toString())
        if (limit) params.append('limit', limit.toString())
        
        const response = await apiClient.get(`${this.baseEndpoint}?${params.toString()}`)
        return {
            success: response.status >= 200 && response.status < 300,
            data: response.data.data || response.data,
            message: response.data.message || 'Success',
            statusCode: response.status,
        }
    }

    /**
     * Delete user
     * DELETE /api/user/{id}
     */
    async deleteUser(userId: string) {
        const response = await apiClient.delete(`${this.baseEndpoint}/${userId}`)
        return {
            success: response.status >= 200 && response.status < 300,
            data: response.data.data || response.data,
            message: response.data.message || 'Success',
            statusCode: response.status,
        }
    }
}

export const userAPI = new UserAPI()
