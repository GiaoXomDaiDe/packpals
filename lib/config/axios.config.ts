import AsyncStorage from '@react-native-async-storage/async-storage'
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { apiConfig } from './config'

// Create axios instance with environment-based configuration
const apiClient: AxiosInstance = axios.create({
    baseURL: apiConfig.baseURL,
    timeout: apiConfig.timeout,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
})

// Request interceptor to add auth token and logging
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            // Add auth token if available
            const token = await AsyncStorage.getItem('auth_token')
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }

            // Log request in development
            if (apiConfig.enableLogging) {
                console.log('🌐 API Request:', {
                    method: config.method?.toUpperCase(),
                    url: config.url,
                    baseURL: config.baseURL,
                    hasAuth: !!token,
                    data: config.data ? 'Present' : 'None'
                })
            }
        } catch (error) {
            console.error('❌ Error in request interceptor:', error)
        }
        return config
    },
    (error) => {
        if (apiConfig.enableLogging) {
            console.error('❌ Request interceptor error:', error)
        }
        return Promise.reject(error)
    }
)

// Response interceptor for error handling and logging
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // Log successful responses in development
        if (apiConfig.enableLogging) {
            console.log('✅ API Response:', {
                status: response.status,
                url: response.config.url,
                method: response.config.method?.toUpperCase(),
                dataSize: response.data ? Object.keys(response.data).length : 0
            })
        }
        return response
    },
    async (error) => {
        // Log errors
        if (apiConfig.enableLogging) {
            console.error('❌ API Error:', {
                status: error.response?.status,
                url: error.config?.url,
                method: error.config?.method?.toUpperCase(),
                message: error.response?.data?.message || error.message
            })
        }

        // Handle 401 Unauthorized - clear auth data and potentially redirect
        if (error.response?.status === 401) {
            console.log('🔐 Unauthorized access detected - clearing auth data')
            await AsyncStorage.multiRemove(['auth_token', 'user_data'])
            // Note: Navigation should be handled by the calling component/service
        }
        
        return Promise.reject(error)
    }
)

export default apiClient