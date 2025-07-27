import {
    AuthServiceResponse,
    AuthUser,
    LoginCredentials,
    RegisterData
} from '@/lib/types/auth.types'
import AsyncStorage from '@react-native-async-storage/async-storage'
import apiClient from '../config/axios.config'

// Auth storage keys
const AUTH_TOKEN_KEY = 'auth_token'
const USER_DATA_KEY = 'user_data'

/**
 * Auth API endpoints - Combined API calls with business logic
 * Based on backend AuthController routes: /api/auth/*
 */
export class AuthAPI {
    private readonly baseEndpoint = '/auth'

    /**
     * Login user with credentials
     * Handles token storage and user data extraction
     */
    async login(credentials: LoginCredentials): Promise<AuthServiceResponse> {
        try {
            console.log('🔐 Attempting login with:', { email: credentials.email })
            const response = await apiClient.post(`${this.baseEndpoint}/login`, credentials)
            console.log('🔐 Full response:', response.data)
            console.log('🔐 Login API response:', { success: response.status >= 200, message: response.data.message })
            
            if (response.status >= 200 && response.status < 300) {
                // Handle nested response structure: response.data.data.data
                const tokenData = response.data.data?.data || response.data.data || response.data
                
                // Validate token data structure
                if (!tokenData || !tokenData.tokenString || !tokenData.id || !tokenData.email) {
                    console.error('🔐 Invalid token data structure:', tokenData)
                    throw new Error('Invalid token data received from server')
                }
                
                const { tokenString, id, email, role } = tokenData
                
                // Create user object from token data
                const user: AuthUser = {
                    id,
                    email,
                    username: email.split('@')[0], // Extract username from email until backend provides it
                    phoneNumber: '', // Will be populated from user profile API
                    role: role as 'RENTER' | 'KEEPER'
                }
                
                console.log('🔐 Login successful for user:', { id, email, role })
                
                // Store auth data in AsyncStorage
                await AsyncStorage.setItem(AUTH_TOKEN_KEY, tokenString)
                await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user))
                
                return { user, token: tokenString }
            } else {
                throw new Error(response.data.message || 'Login failed')
            }
        } catch (error: any) {
            console.error('🔐 Login error:', error)
            
            // Enhanced error handling for better UX
            if (error.response) {
                const errorMessage = error.response.data?.message || error.response.data?.title || 'Login failed'
                throw new Error(errorMessage)
            }
            
            throw error
        }
    }

    /**
     * Register new user
     * Returns user ID on successful registration
     */
    async register(userData: RegisterData): Promise<string> {
        try {
            console.log('📝 Attempting registration with full data:', userData)
            console.log('📝 Data keys:', Object.keys(userData))
            console.log('📝 Data values:', Object.values(userData))
            
            // Transform to match backend expectations (PascalCase)
            const backendData = {
                Email: userData.email,
                Password: userData.password,
                ConfirmPassword: userData.confirmPassword,
                Username: userData.username,
                PhoneNumber: userData.phoneNumber,
            }
            
            console.log('📝 Sending backend data:', backendData)
            
            const response = await apiClient.post(`${this.baseEndpoint}/register`, backendData)
            console.log('📝 Registration API response:', { 
                success: response.status >= 200, 
                status: response.status,
                message: response.data.message,
                data: response.data 
            })
            
            if (response.status >= 200 && response.status < 300 && response.data.data) {
                // Backend returns GUID string for successful registration
                const userId = response.data.data
                console.log('📝 Registration successful for user ID:', userId)
                
                return userId
            } else {
                throw new Error(response.data.message || 'Registration failed')
            }
        } catch (error: any) {
            console.error('📝 Registration error:', error)
            
            // Handle different types of network errors
            if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
                throw new Error('Cannot connect to server. Please check:\n• Backend server is running on port 5000\n• Network connection (Android: use  192.168.1.43, iOS: use localhost)\n• Firewall/antivirus not blocking the connection')
            }
            
            // Handle backend validation errors
            if (error.response && error.response.status === 400) {
                const errorData = error.response.data
                if (typeof errorData === 'string') {
                    // Backend returns plain text error messages
                    if (errorData.includes('Email đã tồn tại')) {
                        throw new Error('Email already exists. Please use a different email.')
                    } else if (errorData.includes('Mật khẩu không hợp lệ')) {
                        throw new Error('Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character (@#$%^&*!_)')
                    } else if (errorData.includes('Xác nhận mật khẩu không khớp')) {
                        throw new Error('Password confirmation does not match')
                    } else {
                        throw new Error(errorData)
                    }
                } else if (errorData.message) {
                    throw new Error(errorData.message)
                }
            }
            
            // Handle timeout errors
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                throw new Error('Request timed out. Please check your network connection and try again.')
            }
            
            // Handle specific API errors from backend
            if (error.response) {
                console.log('📝 Backend error response:', {
                    status: error.response.status,
                    data: error.response.data,
                    message: error.response.data?.message
                })
                
                const errorMessage = error.response.data?.message || error.response.data?.title || 'Registration failed'
                
                // Check for specific errors
                if (errorMessage.toLowerCase().includes('email')) {
                    throw new Error('This email is already registered. Please use a different email.')
                } else if (errorMessage.toLowerCase().includes('username')) {
                    throw new Error('This username is already taken. Please choose a different username.')
                } else if (errorMessage.toLowerCase().includes('phone')) {
                    throw new Error('This phone number is already registered.')
                }
                
                throw new Error(errorMessage)
            }
            
            throw error
        }
    }

    /**
     * Change password
     * PATCH /api/auth/change-password?userEmail={email}&IsForgot={boolean}
     * Backend expects: ChangePasswordRequest in body + query params
     */
    async changePassword(
        passwordData: { 
            currentPassword: string
            newPassword: string
            confirmNewPassword: string 
        },
        userEmail: string,
        isForgot: boolean = false
    ) {
        const response = await apiClient.patch(
            `${this.baseEndpoint}/change-password?userEmail=${userEmail}&IsForgot=${isForgot}`,
            passwordData
        )
        return {
            success: response.status >= 200 && response.status < 300,
            data: response.data.data || response.data,
            message: response.data.message || 'Success',
            statusCode: response.status,
        }
    }

    /**
     * Logout user
     * Clears all stored auth data
     */
    async logout(): Promise<void> {
        try {
            console.log('🚪 Logging out user')
            await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY])
            console.log('🚪 Logout successful - cleared stored data')
        } catch (error) {
            console.error('🚪 Logout error:', error)
            // Don't throw error for logout - best effort cleanup
        }
    }

    /**
     * Get stored auth token
     */
    async getToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(AUTH_TOKEN_KEY)
        } catch (error) {
            console.error('🔑 Get token error:', error)
            return null
        }
    }

    /**
     * Get stored user data
     */
    async getUser(): Promise<AuthUser | null> {
        try {
            const userData = await AsyncStorage.getItem(USER_DATA_KEY)
            return userData ? JSON.parse(userData) : null
        } catch (error) {
            console.error('👤 Get user error:', error)
            return null
        }
    }

    /**
     * Check if user is authenticated
     * Validates both token and user data existence
     */
    async isAuthenticated(): Promise<boolean> {
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

    /**
     * Update stored user data
     * Used when user profile is updated
     */
    async updateStoredUser(updatedUser: Partial<AuthUser>): Promise<void> {
        try {
            const currentUser = await this.getUser()
            if (!currentUser) {
                throw new Error('No user data to update')
            }

            const mergedUser = { ...currentUser, ...updatedUser }
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(mergedUser))
            console.log('👤 User data updated in storage')
        } catch (error) {
            console.error('👤 Update stored user error:', error)
            throw error
        }
    }
}

// Export singleton instance
export const authAPI = new AuthAPI()
