import apiClient from '../config/axios.config'

/**
 * User API endpoints: /api/user/*
 */
export class UserAPI {
    private readonly baseEndpoint = '/user'

    /**
     * Get user profile
     * GET /api/user/get-detail
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
     * Update user account information (new secure endpoint)
     * PUT /api/user/update-account?userId={userId}
     */
    async updateAccount(userId: string, data: {
        email?: string
        username?: string
        phoneNumber?: string
        role?: string
    }) {
        try {
            console.log('🔄 Updating user account:', { userId, data })
            console.log('🌐 Making request to:', `${this.baseEndpoint}/update-account`)
            console.log('🌐 With params:', { userId })
            console.log('🌐 With data:', data)
            
            const response = await apiClient.put(`${this.baseEndpoint}/update-account`, data, {
                params: { userId }
            })
            
            console.log('✅ Account update successful:', response.data)
            return {
                success: response.status >= 200 && response.status < 300,
                data: response.data.data || response.data,
                message: response.data.message || 'Success',
                statusCode: response.status,
            }
        } catch (error: any) {
            console.error('❌ Account update failed:', error)
            console.error('❌ Error response:', error.response?.data)
            console.error('❌ Error status:', error.response?.status)
            console.error('❌ Error headers:', error.response?.headers)
            
            if (error.response?.data) {
                throw new Error(error.response.data.message || error.response.data.error || 'Failed to update account')
            }
            throw new Error('Network error occurred while updating account')
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

    /**
     * Get keeper ID for a user
     * Helper method that extracts keeperId from user detail
     */
    async getKeeperIdByUserId(userId: string): Promise<string | null> {
        try {
            console.log('🔍 Getting keeper ID for userId:', userId)
            const response = await this.getProfile(userId)
            console.log('🔍 Full user detail response:', response)
            console.log('🔍 Response data structure:', response.data)
            
            // Handle nested data structure: response.data.data.keeper.keeperId
            const userData = response.data?.data || response.data
            const keeperId = userData?.keeper?.keeperId
            
            console.log('🔍 Extracted user data:', userData)
            console.log('🔍 Keeper object:', userData?.keeper)
            console.log('🔍 Extracted keeper ID:', keeperId)
            
            return keeperId || null
        } catch (error) {
            console.error('❌ Failed to get keeper ID:', error)
            return null
        }
    }

    /**
     * Get renter ID for a user
     * Helper method that extracts renterId from user detail
     */
    async getRenterIdByUserId(userId: string): Promise<string | null> {
        try {
            console.log('🔍 Getting renter ID for userId:', userId)
            const response = await this.getProfile(userId)
            
            // Handle nested data structure: response.data.data.renter.renterId
            const userData = response.data?.data || response.data
            const renterId = userData?.renter?.renterId
            
            console.log('🔍 Found renter ID:', renterId)
            return renterId || null
        } catch (error) {
            console.error('❌ Failed to get renter ID:', error)
            return null
        }
    }
}

export const userAPI = new UserAPI()
