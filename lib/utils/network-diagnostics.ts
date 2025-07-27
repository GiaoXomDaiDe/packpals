/**
 * Network Diagnostics
 * Helper functions to test backend connectivity
 */

import { Platform } from 'react-native'
import { LOCALHOST_ALTERNATIVES } from '../config/network.config'

// Test if backend is reachable
export const testBackendConnection = async (url: string): Promise<boolean> => {
    try {
        const response = await fetch(url.replace('/api', '/health') || url, {
            method: 'GET',
            timeout: 5000
        })
        return response.ok
    } catch (error) {
        console.log(`❌ Connection failed for ${url}:`, error)
        return false
    }
}

// Find working backend URL
export const findWorkingBackendURL = async (): Promise<string | null> => {
    const urls = LOCALHOST_ALTERNATIVES[Platform.OS as keyof typeof LOCALHOST_ALTERNATIVES] || []
    
    for (const url of urls) {
        console.log(`🔍 Testing connection to: ${url}`)
        const isWorking = await testBackendConnection(url)
        if (isWorking) {
            console.log(`✅ Found working backend URL: ${url}`)
            return url
        }
    }
    
    console.log('❌ No working backend URL found')
    return null
}

// Common network troubleshooting tips
export const getNetworkTroubleshootingTips = () => {
    const tips = [
        '1. Make sure your backend server is running',
        '2. Check if the backend port is correct (7056)',
        '3. Verify firewall isn't blocking the connection',
        '4. For Android emulator, use  192.168.1.43 instead of localhost',
        '5. For iOS simulator, localhost should work',
        '6. Try using your computer\'s IP address instead of localhost'
    ]
    
    return tips
}

// Log network diagnostics
export const logNetworkDiagnostics = () => {
    console.log('🔧 Network Diagnostics:')
    console.log('- Platform:', Platform.OS)
    console.log('- Available URLs:', LOCALHOST_ALTERNATIVES[Platform.OS as keyof typeof LOCALHOST_ALTERNATIVES])
    console.log('\n💡 Troubleshooting tips:')
    getNetworkTroubleshootingTips().forEach(tip => console.log(tip))
}

export default {
    testBackendConnection,
    findWorkingBackendURL,
    getNetworkTroubleshootingTips,
    logNetworkDiagnostics
}