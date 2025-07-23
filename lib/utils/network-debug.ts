/**
 * Network Debug Tool
 * Comprehensive network diagnostics for React Native
 */

import { Platform } from 'react-native'

// Test multiple URLs to find working one
export const testMultipleURLs = async () => {
    const urls = [
        'http://192.168.43.112:5000/api',      // Android emulator
        'http://localhost:5000/api',      // iOS simulator  
        'http://127.0.0.1:5000/api',     // Alternative localhost
        'http://192.168.1.100:5000/api', // Replace with your actual IP
        'http://192.168.43.112:5000',          // Without /api
        'http://localhost:5000',          // Without /api
    ]

    console.log('🔍 Testing all possible URLs...')
    
    for (const url of urls) {
        try {
            console.log(`Testing: ${url}`)
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            
            if (response.ok) {
                console.log(`✅ SUCCESS: ${url} - Status: ${response.status}`)
                return url
            } else {
                console.log(`❌ FAILED: ${url} - Status: ${response.status}`)
            }
        } catch (error: any) {
            console.log(`❌ ERROR: ${url} - ${error.message}`)
        }
    }
    
    console.log('❌ No working URL found!')
    return null
}

// Test if backend is reachable
export const testBackendHealth = async () => {
    console.log('🏥 Testing backend health...')
    
    // Try different health check endpoints
    const healthEndpoints = [
        'http://192.168.43.112:5000/health',
        'http://192.168.43.112:5000/api/health',
        'http://192.168.43.112:5000/',
        'http://192.168.43.112:5000/api',
    ]
    
    for (const endpoint of healthEndpoints) {
        try {
            const response = await fetch(endpoint, { method: 'GET' })
            console.log(`✅ ${endpoint} - Status: ${response.status}`)
            if (response.ok) {
                return endpoint
            }
        } catch (error: any) {
            console.log(`❌ ${endpoint} - ${error.message}`)
        }
    }
    
    return null
}

// Get your computer's IP address instructions
export const getIPInstructions = () => {
    console.log('📍 To find your computer\'s IP address:')
    console.log('Windows: Run "ipconfig" in Command Prompt')
    console.log('Mac: Run "ifconfig" in Terminal')
    console.log('Linux: Run "ip addr" in Terminal')
    console.log('Look for IPv4 address (usually 192.168.x.x)')
}

// Test with actual IP address
export const testWithIP = async (ip: string) => {
    const url = `http://${ip}:5000/api`
    console.log(`🔍 Testing with IP: ${url}`)
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        
        if (response.ok) {
            console.log(`✅ SUCCESS with IP: ${url}`)
            return true
        } else {
            console.log(`❌ FAILED with IP: ${url} - Status: ${response.status}`)
            return false
        }
    } catch (error: any) {
        console.log(`❌ ERROR with IP: ${url} - ${error.message}`)
        return false
    }
}

// Complete network diagnostic
export const runCompleteDiagnostic = async () => {
    console.log('🔧 Running Complete Network Diagnostic...')
    console.log('📱 Platform:', Platform.OS)
    console.log('🕐 Time:', new Date().toLocaleTimeString())
    
    // Step 1: Test multiple URLs
    const workingURL = await testMultipleURLs()
    
    // Step 2: Test backend health
    const healthEndpoint = await testBackendHealth()
    
    // Step 3: Show IP instructions
    getIPInstructions()
    
    // Step 4: Final recommendations
    console.log('\n💡 Troubleshooting Steps:')
    console.log('1. Verify backend is running: Check your terminal shows "Now listening on: http://localhost:5000"')
    console.log('2. Check Windows Firewall: Allow Node.js/dotnet through firewall')
    console.log('3. Try your computer\'s IP address instead of 192.168.43.112')
    console.log('4. Restart Android emulator if needed')
    console.log('5. Check if antivirus is blocking the connection')
    
    return {
        workingURL,
        healthEndpoint,
        platform: Platform.OS,
        timestamp: new Date().toISOString()
    }
}

export default runCompleteDiagnostic