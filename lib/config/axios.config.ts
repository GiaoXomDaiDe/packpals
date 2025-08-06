import AsyncStorage from '@react-native-async-storage/async-storage'
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { apiConfig } from './config'


const apiClient: AxiosInstance = axios.create({
    baseURL: apiConfig.baseURL,
    timeout: apiConfig.timeout,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Add ngrok header to skip browser warning for ngrok free plan
        'ngrok-skip-browser-warning': 'true',
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
                const logData = {
                    method: config.method?.toUpperCase(),
                    url: config.url,
                    baseURL: config.baseURL,
                    hasAuth: !!token,
                    hasData: !!config.data,
                    ...(config.data && { requestData: config.data })
                }
                console.log('🌐 API Request:', JSON.stringify(logData, null, 2))
            }
        } catch (error) {
            console.error('❌ Error in request interceptor:', error)
        }
        return config
    },
    (error) => {
        if (apiConfig.enableLogging) {
            const errorData = {
                type: 'Request Interceptor Error',
                message: error.message,
                stack: error.stack
            }
            console.error('❌ Request interceptor error:', JSON.stringify(errorData, null, 2))
        }
        return Promise.reject(error)
    }
)

// Response interceptor for error handling and logging
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // Log successful responses in development
        if (apiConfig.enableLogging) {
            const logData = {
                status: response.status,
                statusText: response.statusText,
                url: response.config.url,
                method: response.config.method?.toUpperCase(),
                hasData: !!response.data,
                dataKeys: response.data ? Object.keys(response.data) : [],
                dataSize: response.data ? Object.keys(response.data).length : 0
            }
            console.log('✅ API Response:', JSON.stringify(logData, null, 2))
        }
        return response
    },
    async (error) => {
        // Log errors
        if (apiConfig.enableLogging) {
            const errorData = {
                status: error.response?.status,
                url: error.config?.url,
                method: error.config?.method?.toUpperCase(),
                message: error.response?.data?.message || error.message,
                responseData: error.response?.data || null
            }
            console.error('❌ API Error:', JSON.stringify(errorData, null, 2))
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