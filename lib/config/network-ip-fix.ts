/**
 * IP Address Fix
 * Replace YOUR_IP_HERE with your actual IP address
 */

import { Platform } from 'react-native'

// STEP 1: Find your IP address
// Windows: Run 'ipconfig' in Command Prompt
// Mac: Run 'ifconfig' in Terminal
// Look for IPv4 address (usually 192.168.x.x)

// STEP 2: Replace this with your actual IP address
const YOUR_COMPUTER_IP = '192.168.1.100' // CHANGE THIS!

// STEP 3: Use this configuration
export const getWorkingURL = (port: number = 5000) => {
    if (Platform.OS === 'android') {
        // Use your computer's IP address for Android emulator
        return `http://${YOUR_COMPUTER_IP}:${port}`
    } else if (Platform.OS === 'ios') {
        // iOS can use localhost
        return `http://localhost:${port}`
    } else {
        return `http://localhost:${port}`
    }
}

export const IP_CONFIG = {
    baseURL: getWorkingURL(5000) + '/api',
    timeout: 15000,
    enableLogging: true,
}

// Test this configuration
export const testIPConfig = async () => {
    try {
        const response = await fetch(IP_CONFIG.baseURL.replace('/api', ''), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        
        console.log(`✅ IP Config test: ${response.status}`)
        return response.ok
    } catch (error: any) {
        console.log(`❌ IP Config failed: ${error.message}`)
        return false
    }
}

export default IP_CONFIG