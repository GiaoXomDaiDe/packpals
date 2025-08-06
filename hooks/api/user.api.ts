import apiClient from '../../lib/config/axios.config'

// User API - Xử lý các thao tác liên quan đến người dùng: /api/user/*
export class UserAPI {
    private readonly baseEndpoint = '/user'

    // Lấy thông tin profile người dùng - GET /api/user/get-detail
    async getProfile(userId: string) {
        const response = await apiClient.get(`${this.baseEndpoint}/get-detail`, {
            params: { userId: userId.trim() }
        })
        
        return {
            success: response.status >= 200 && response.status < 300,
            data: response.data, // Không cần .data.data nữa vì backend đã fix
            message: response.data.message || 'Thành công',
            statusCode: response.status,
        }
    }

    // Cập nhật profile người dùng - PUT /api/user/{id}
    async updateProfile(userId: string, userData: any) {
        const response = await apiClient.put(`${this.baseEndpoint}/${userId}`, userData)
        
        return {
            success: response.status >= 200 && response.status < 300,
            data: response.data,
            message: response.data.message || 'Thành công',
            statusCode: response.status,
        }
    }

    // Cập nhật avatar người dùng - PUT /api/user/update-avatar
    async updateAvatar(userId: string, imageData: string) {
        try {
            const response = await apiClient.put(`${this.baseEndpoint}/update-avatar`, {
                userId: userId.trim(),
                image: imageData // Base64 string
            })
            
            return {
                success: response.status >= 200 && response.status < 300,
                data: response.data,
                message: response.data.message || 'Avatar updated successfully',
                statusCode: response.status,
            }
        } catch (error: any) {
            console.error('❌ Error updating avatar:', error)
            
            if (error.response?.data) {
                throw new Error(error.response.data.message || error.response.data.error || 'Failed to update avatar')
            }
            throw new Error('Network error while updating avatar')
        }
    }

    // Thay đổi mật khẩu - PUT /api/user/change-password
    async changePassword(userId: string, data: {
        currentPassword: string
        newPassword: string
    }) {
        try {
            const response = await apiClient.put(`${this.baseEndpoint}/change-password`, {
                userId: userId.trim(),
                ...data
            })
            
            return {
                success: response.status >= 200 && response.status < 300,
                data: response.data,
                message: response.data.message || 'Password changed successfully',
                statusCode: response.status,
            }
        } catch (error: any) {
            console.error('❌ Error changing password:', error)
            
            if (error.response?.data) {
                throw new Error(error.response.data.message || error.response.data.error || 'Failed to change password')
            }
            throw new Error('Network error while changing password')
        }
    }
    async updateAccount(userId: string, data: {
        email?: string
        username?: string
        phoneNumber?: string
        role?: string
    }) {
        try {
            const response = await apiClient.put(`${this.baseEndpoint}/update-account`, data, {
                params: { userId }
            })
            
            return {
                success: response.status >= 200 && response.status < 300,
                data: response.data,
                message: response.data.message || 'Thành công',
                statusCode: response.status,
            }
        } catch (error: any) {
            console.error('❌ Lỗi cập nhật tài khoản:', error)
            
            if (error.response?.data) {
                throw new Error(error.response.data.message || error.response.data.error || 'Cập nhật tài khoản thất bại')
            }
            throw new Error('Lỗi mạng khi cập nhật tài khoản')
        }
    }

    // Lấy tất cả người dùng (admin) - GET /api/user
    async getAllUsers(page?: number, limit?: number) {
        const params = new URLSearchParams()
        if (page) params.append('page', page.toString())
        if (limit) params.append('limit', limit.toString())
        
        const response = await apiClient.get(`${this.baseEndpoint}?${params.toString()}`)
        
        return {
            success: response.status >= 200 && response.status < 300,
            data: response.data,
            message: response.data.message || 'Thành công',
            statusCode: response.status,
        }
    }

    // Xóa người dùng - DELETE /api/user/{id}
    async deleteUser(userId: string) {
        const response = await apiClient.delete(`${this.baseEndpoint}/${userId}`)
        
        return {
            success: response.status >= 200 && response.status < 300,
            data: response.data,
            message: response.data.message || 'Thành công',
            statusCode: response.status,
        }
    }

    // Lấy keeper ID từ user ID - Helper method trích xuất keeperId từ user detail
    async getKeeperIdByUserId(userId: string): Promise<string | null> {
        try {
            const response = await this.getProfile(userId)
            
            // Sau khi fix backend: response.data thay vì response.data.data
            const userData = response.data
            const keeperId = userData?.keeper?.keeperId
            
            return keeperId || null
        } catch (error) {
            console.error('❌ Lỗi lấy keeper ID:', error)
            return null
        }
    }

    // Switch user role - POST /api/user/switch-role
    async switchRole(role: string) {
        try {
            const response = await apiClient.post(`${this.baseEndpoint}/switch-role`, {
                role: role
            })
            
            return {
                success: response.status >= 200 && response.status < 300,
                data: response.data,
                message: response.data.message || 'Role switched successfully',
                statusCode: response.status,
            }
        } catch (error: any) {
            console.error('❌ Error switching role:', error)
            
            if (error.response?.data) {
                return {
                    success: false,
                    data: null,
                    message: error.response.data.message || 'Failed to switch role',
                    statusCode: error.response.status,
                }
            }
            
            throw error
        }
    }

    // Lấy renter ID từ user ID - Helper method trích xuất renterId từ user detail
    async getRenterIdByUserId(userId: string): Promise<string | null> {
        try {
            const response = await this.getProfile(userId)
            
            // Sau khi fix backend: response.data thay vì response.data.data
            const userData = response.data
            const renterId = userData?.renter?.renterId
            
            return renterId || null
        } catch (error) {
            console.error('❌ Lỗi lấy renter ID:', error)
            return null
        }
    }
}

export const userAPI = new UserAPI()
