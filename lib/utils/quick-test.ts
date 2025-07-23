/**
 * Quick Network Test
 * Run this to verify the backend connection
 */

import { Platform } from 'react-native'
import { apiConfig } from '../config/config'

export const quickNetworkTest = async () => {
    console.log('🔧 Quick Network Test Starting...')
    console.log('📱 Platform:', Platform.OS)
    console.log('🌐 Base URL:', apiConfig.baseURL)
    console.log('⏱️ Timeout:', apiConfig.timeout)
    
    // Test the configured URL
    try {
        const response = await fetch(apiConfig.baseURL.replace('/api', '/health') || apiConfig.baseURL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        
        if (response.ok) {
            console.log('✅ Backend connection successful!')
            console.log('📊 Response status:', response.status)
            return true
        } else {
            console.log('❌ Backend connection failed')
            console.log('📊 Response status:', response.status)
            return false
        }
    } catch (error: any) {
        console.log('❌ Network error:', error.message)
        console.log('💡 Make sure backend is running on port 5000')
        return false
    }
}

// Test specific URL
export const testSpecificURL = async (url: string) => {
    console.log(`🔍 Testing URL: ${url}`)
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        
        console.log(`📊 Status: ${response.status}`)
        return response.ok
    } catch (error: any) {
        console.log(`❌ Error: ${error.message}`)
        return false
    }
}

export default quickNetworkTest