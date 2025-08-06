import { API_ENDPOINTS, AUTH_KEYS } from '@/constants/auth.constants'
import apiClient from '@/lib/config/axios.config'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { userAPI } from './user.api'

export class AuthAPI {
    private readonly baseEndpoint = API_ENDPOINTS.AUTH

    async login(credentials: { email: string; password: string }) {
        try {
            const response = await apiClient.post(`${this.baseEndpoint}/login`, credentials)

            if (response.status >= 200 && response.status < 300) {
                const tokenData = response.data.data
                
                if (!tokenData?.tokenString || !tokenData?.id) {
                    throw new Error('Invalid token response')
                }

                const { tokenString, id: userId } = tokenData
                
                await AsyncStorage.setItem(AUTH_KEYS.TOKEN, tokenString)
                
                const profileResponse = await userAPI.getProfile(userId)
                const userData = profileResponse.data?.data || profileResponse.data

                await AsyncStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(userData))
                
                return { 
                    user: userData, 
                    token: tokenString 
                }
            }
            throw new Error(response.data?.message || 'Login failed')
            
        } catch (error: any) {
            if (error.response) {
                const status = error.response.status
                const errorData = error.response.data
                const message = errorData?.message || ''
                const code = errorData?.code || ''
                
                // Xử lý validation errors từ Model validation
                if (status === 400 && code === 'VALIDATION_ERROR') {
                    const errors = errorData?.additionalData || {}
                    const errorMessages = []
                    
                    for (const [, messages] of Object.entries(errors)) {
                        if (Array.isArray(messages)) {
                            errorMessages.push(...messages)
                        }
                    }
                    
                    if (errorMessages.length > 0) {
                        throw new Error(errorMessages[0])
                    }
                }
                
                // Xử lý specific error cases
                if (status === 404) {
                    throw new Error('Email hoặc mật khẩu không chính xác')
                }
                
                if (status === 400) {
                    throw new Error(message || 'Thông tin đăng nhập không hợp lệ')
                }
                
                if (status === 401) {
                    throw new Error('Email hoặc mật khẩu không chính xác')
                }
                
                if (status >= 500) {
                    throw new Error('Lỗi server. Vui lòng thử lại sau')
                }
                
                throw new Error(message || 'Đăng nhập thất bại')
            }
            
            if (error.message) {
                throw error
            }
            
            throw new Error('Không thể kết nối đến server')
        }
    }

    async register(userData: {
        email: string
        password: string
        confirmPassword: string
        username: string
        phoneNumber: string
    }) {
        try {
            const backendData = {
                Email: userData.email,
                Password: userData.password,
                ConfirmPassword: userData.confirmPassword,
                Username: userData.username,
                PhoneNumber: userData.phoneNumber,
            }
            
            const response = await apiClient.post(`${this.baseEndpoint}/register`, backendData)
            
            if (response.status >= 200 && response.status < 300) {
                return response.data?.data || 'Registration successful'
            }
            throw new Error(response.data?.message || 'Registration failed')
            
        } catch (error: any) {
            if (error.response) {
                const status = error.response.status
                const errorData = error.response.data
                const message = errorData?.message || ''
                const code = errorData?.code || ''
                
                // Xử lý validation errors từ Model validation
                if (status === 400 && code === 'VALIDATION_ERROR') {
                    const errors = errorData?.additionalData || {}
                    const errorMessages = []
                    
                    for (const [, messages] of Object.entries(errors)) {
                        if (Array.isArray(messages)) {
                            errorMessages.push(...messages)
                        }
                    }
                    
                    if (errorMessages.length > 0) {
                        throw new Error(errorMessages[0])
                    }
                }
                
                // Xử lý business logic validation errors từ AuthService
                if (status === 400) {
                    if (message.includes('Email đã được sử dụng') || message.includes('Account already exist')) {
                        throw new Error('Email đã được sử dụng')
                    }
                    
                    if (message.includes('Mật khẩu phải có ít nhất') || message.includes('Password does not meet requirement')) {
                        throw new Error('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt')
                    }
                    
                    if (message.includes('Xác nhận mật khẩu không khớp') || message.includes('Confirm password not match')) {
                        throw new Error('Xác nhận mật khẩu không khớp')
                    }
                    
                    if (message.includes('Số điện thoại không hợp lệ') || message.includes('Invalid phone number format')) {
                        throw new Error('Số điện thoại không hợp lệ. Vui lòng sử dụng định dạng số điện thoại Việt Nam (VD: 0901234567)')
                    }
                    
                    throw new Error(message || 'Thông tin đăng ký không hợp lệ')
                }
                
                if (status >= 500) {
                    throw new Error('Lỗi server. Vui lòng thử lại sau')
                }
                
                throw new Error(message || 'Đăng ký thất bại')
            }
            
            // Network error
            if (error.message) {
                throw error
            }
            
            throw new Error('Không thể kết nối đến server')
        }
    }

    async changePassword(
        passwordData: {
            currentPassword: string
            newPassword: string
            confirmNewPassword: string
        },
        userEmail: string
    ) {
        try {
            if (!passwordData.currentPassword) {
                throw new Error('Current password is required')
            }

            const response = await apiClient.patch(
                `${this.baseEndpoint}/change-password?userEmail=${userEmail}&IsForgot=false`,
                passwordData
            )
            
            return {
                success: response.status >= 200 && response.status < 300,
                data: response.data.data || 'Password changed successfully',
                message: response.data.message || 'Success',
                statusCode: response.status,
            }
        } catch (error: any) {
            if (error.response) {
                const status = error.response.status
                const errorData = error.response.data
                const message = errorData?.message || ''
                const code = errorData?.code || ''
                
                // Xử lý validation errors từ Model validation
                if (status === 400 && code === 'VALIDATION_ERROR') {
                    const errors = errorData?.additionalData || {}
                    const errorMessages = []
                    
                    for (const [, messages] of Object.entries(errors)) {
                        if (Array.isArray(messages)) {
                            errorMessages.push(...messages)
                        }
                    }
                    
                    if (errorMessages.length > 0) {
                        throw new Error(errorMessages[0])
                    }
                }
                
                // Xử lý User not found error
                if (status === 404) {
                    throw new Error('Không tìm thấy người dùng. Vui lòng kiểm tra lại email')
                }
                
                // Xử lý business logic validation errors
                if (status === 400) {
                    if (message.includes('Mật khẩu hiện tại không thể để trống')) {
                        throw new Error('Mật khẩu hiện tại không thể để trống')
                    }
                    
                    if (message.includes('Mật khẩu hiện tại không chính xác')) {
                        throw new Error('Mật khẩu hiện tại không chính xác')
                    }
                    
                    if (message.includes('Mật khẩu phải có ít nhất') || message.includes('Password does not meet requirement')) {
                        throw new Error('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt')
                    }
                    
                    if (message.includes('Xác nhận mật khẩu không khớp') || message.includes('Confirm password not match')) {
                        throw new Error('Xác nhận mật khẩu không khớp')
                    }
                    
                    throw new Error(message || 'Thông tin thay đổi mật khẩu không hợp lệ')
                }
                
                if (status >= 500) {
                    throw new Error('Lỗi server. Vui lòng thử lại sau')
                }
                
                throw new Error(message || 'Thay đổi mật khẩu thất bại')
            }
            throw error
        }
    }

    async forgotPassword(
        passwordData: {
            newPassword: string
            confirmNewPassword: string
        },
        userEmail: string
    ) {
        try {
            const response = await apiClient.patch(
                `${this.baseEndpoint}/change-password?userEmail=${userEmail}&IsForgot=true`,
                passwordData
            )
            
            return {
                success: response.status >= 200 && response.status < 300,
                data: response.data.data || 'Password reset successfully',
                message: response.data.message || 'Success',
                statusCode: response.status,
            }
        } catch (error: any) {
            if (error.response) {
                const status = error.response.status
                const errorData = error.response.data
                const message = errorData?.message || ''
                const code = errorData?.code || ''
                
                // Xử lý validation errors từ Model validation
                if (status === 400 && code === 'VALIDATION_ERROR') {
                    const errors = errorData?.additionalData || {}
                    const errorMessages = []
                    
                    for (const [, messages] of Object.entries(errors)) {
                        if (Array.isArray(messages)) {
                            errorMessages.push(...messages)
                        }
                    }
                    
                    if (errorMessages.length > 0) {
                        throw new Error(errorMessages[0])
                    }
                }
                
                // Xử lý User not found error
                if (status === 404) {
                    throw new Error('Không tìm thấy người dùng. Vui lòng kiểm tra lại email')
                }
                
                // Xử lý business logic validation errors
                if (status === 400) {
                    if (message.includes('Mật khẩu phải có ít nhất') || message.includes('Password does not meet requirement')) {
                        throw new Error('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt')
                    }
                    
                    if (message.includes('Xác nhận mật khẩu không khớp') || message.includes('Confirm password not match')) {
                        throw new Error('Xác nhận mật khẩu không khớp')
                    }
                    
                    throw new Error(message || 'Thông tin đặt lại mật khẩu không hợp lệ')
                }
                
                if (status >= 500) {
                    throw new Error('Lỗi server. Vui lòng thử lại sau')
                }
                
                throw new Error(message || 'Đặt lại mật khẩu thất bại')
            }
            throw error
        }
    }

    // Đăng xuất người dùng
    async logout(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([AUTH_KEYS.TOKEN, AUTH_KEYS.USER_DATA])
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    async getToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(AUTH_KEYS.TOKEN)
        } catch {
            return null
        }
    }

    async getUser() {
        try {
            const userData = await AsyncStorage.getItem(AUTH_KEYS.USER_DATA)
            return userData ? JSON.parse(userData) : null
        } catch {
            return null
        }
    }

    async isAuthenticated() {
        try {
            const [token, user] = await Promise.all([
                this.getToken(),
                this.getUser()
            ])
            return !!(token && user)
        } catch {
            return false
        }
    }

    async updateStoredUser(updatedUser: any) {
        try {
            const currentUser = await this.getUser()
            if (!currentUser) {
                throw new Error('No user data found')
            }

            const mergedUser = { ...currentUser, ...updatedUser }
            await AsyncStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(mergedUser))
        } catch (error) {
            console.error('Update user error:', error)
            throw error
        }
    }
}

export const authAPI = new AuthAPI()
