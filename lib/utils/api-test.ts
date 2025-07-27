import { Platform } from 'react-native';
import { apiConfig } from '../config/config';

// Test different backend URLs
const TEST_URLS = {
    current: apiConfig.baseURL,
    android: 'http://192.168.1.43:5000/api',    // Updated to match current IP
    ios: 'http://localhost:5000/api',           // Updated port to 5000
    localhost: 'http://localhost:5000/api',     // Updated port to 5000
    ip: 'http://192.168.1.100:5000/api' // Replace with your actual IP
}

// Test a single URL
export const testURL = async (url: string): Promise<{ success: boolean; error?: string; status?: number }> => {
    try {
        console.log(`🔍 Testing URL: ${url}`)
        
        const response = await fetch(url.replace('/api', '/health') || url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        
        if (response.ok) {
            console.log(`✅ ${url} - SUCCESS`)
            return { success: true, status: response.status }
        } else {
            console.log(`❌ ${url} - HTTP ${response.status}`)
            return { success: false, status: response.status, error: `HTTP ${response.status}` }
        }
    } catch (error: any) {
        console.log(`❌ ${url} - ERROR:`, error.message)
        return { success: false, error: error.message }
    }
}

// Test all possible URLs
export const testAllURLs = async (): Promise<void> => {
    console.log('🔧 Testing all backend URLs...')
    console.log('Platform:', Platform.OS)
    
    for (const [name, url] of Object.entries(TEST_URLS)) {
        await testURL(url)
    }
    
    console.log('\n💡 Troubleshooting tips:')
    console.log('1. Make sure backend server is running')
    console.log('2. Check backend port (should be 5000)')
    console.log('3. For Android emulator: use 192.168.1.43')
    console.log('4. For iOS simulator: use localhost')
    console.log('5. For physical device: use your computer\'s IP address')
    console.log('6. Check firewall/antivirus settings')
}

// Simple ping test
export const pingBackend = async (): Promise<boolean> => {
    try {
        const response = await fetch(apiConfig.baseURL.replace('/api', '/health') || apiConfig.baseURL, {
            method: 'GET',
        })
        return response.ok
    } catch (error) {
        return false
    }
}

// Get recommended URL based on platform
export const getRecommendedURL = (): string => {
    if (Platform.OS === 'android') {
        return TEST_URLS.android
    } else if (Platform.OS === 'ios') {
        return TEST_URLS.ios
    } else {
        return TEST_URLS.localhost
    }
}

// Log current configuration
export const logCurrentConfig = () => {
    console.log('📡 Current API Configuration:')
    console.log('- Platform:', Platform.OS)
    console.log('- Base URL:', apiConfig.baseURL)
    console.log('- Recommended URL:', getRecommendedURL())
    console.log('- Timeout:', apiConfig.timeout)
}

export default {
    testURL,
    testAllURLs,
    pingBackend,
    getRecommendedURL,
    logCurrentConfig
}