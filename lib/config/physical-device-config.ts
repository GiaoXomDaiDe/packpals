/**
 * Physical Device Configuration
 * Special configuration for Expo apps running on physical devices
 */

// Configuration for physical devices using Expo
export const PHYSICAL_DEVICE_CONFIG = {
    // Your computer's IP address (found with ipconfig)
    computerIP: '192.168.1.43',
    
    // Backend port
    backendPort: 5000,
    
    // Full API URL for physical device
    getAPIURL: () => {
        return `http://192.168.1.43:5000/api`
    },
    
    // Test URL without /api
    getTestURL: () => {
        return `http://192.168.1.43:5000`
    }
}

// Test physical device connection
export const testPhysicalDeviceConnection = async () => {
    const testURL = PHYSICAL_DEVICE_CONFIG.getTestURL()
    
    console.log('📱 Testing physical device connection...')
    console.log('🌐 Test URL:', testURL)
    
    try {
        const response = await fetch(testURL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        
        console.log('📊 Response status:', response.status)
        
        if (response.ok) {
            console.log('✅ Physical device can reach backend!')
            return true
        } else {
            console.log('❌ Backend responded but with error status')
            return false
        }
    } catch (error: any) {
        console.log('❌ Connection failed:', error.message)
        console.log('🔥 This is likely a firewall issue!')
        return false
    }
}

// Get firewall instructions
export const getFirewallInstructions = () => {
    const instructions = [
        '🔥 FIREWALL SETUP REQUIRED:',
        '',
        '1. Open Windows Defender Firewall',
        '2. Click "Allow an app or feature through Windows Defender Firewall"',
        '3. Click "Change Settings" then "Allow another app..."',
        '4. Find and add your backend executable (.NET Core/Node.js)',
        '5. Make sure both Private and Public networks are checked',
        '',
        'OR temporarily disable Windows Firewall for testing:',
        '1. Open Windows Security',
        '2. Go to Firewall & network protection',
        '3. Turn off firewall for Private network (temporarily)',
        '',
        'Alternative: Create firewall rule for port 5000:',
        '1. Open Windows Defender Firewall with Advanced Security',
        '2. Click "Inbound Rules" → "New Rule..."',
        '3. Select "Port" → "TCP" → "Specific local ports: 5000"',
        '4. Allow the connection → Apply to all profiles',
    ]
    
    return instructions
}

// Log complete physical device troubleshooting
export const logPhysicalDeviceTroubleshooting = () => {
    console.log('📱 PHYSICAL DEVICE TROUBLESHOOTING:')
    console.log('================================')
    console.log('Your phone needs to connect to your computer over WiFi')
    console.log('')
    console.log('✅ Prerequisites:')
    console.log('- Phone and computer on same WiFi network')
    console.log('- Backend running on computer (port 5000)')
    console.log('- Computer IP:', PHYSICAL_DEVICE_CONFIG.computerIP)
    console.log('- API URL:', PHYSICAL_DEVICE_CONFIG.getAPIURL())
    console.log('')
    
    getFirewallInstructions().forEach(instruction => {
        console.log(instruction)
    })
    
    console.log('')
    console.log('🧪 Next steps:')
    console.log('1. Run testPhysicalDeviceConnection() to test')
    console.log('2. If it fails, check firewall settings')
    console.log('3. Try temporarily disabling Windows Firewall')
    console.log('4. Test in browser: http://192.168.1.43:5000')
}

export default PHYSICAL_DEVICE_CONFIG