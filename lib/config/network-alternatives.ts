/**
 * Network Alternative Configurations
 * Different URL configurations to try for Android emulator connectivity
 */


// Different localhost alternatives for Android emulator
export const ANDROID_ALTERNATIVES = [
    'http://192.168.43.112:5000/api',      // Standard Android emulator
    'http://localhost:5000/api',      // Sometimes works
    'http://127.0.0.1:5000/api',     // Alternative localhost
    'http://192.168.1.100:5000/api', // Replace with your IP
    'http://10.0.3.2:5000/api',      // Genymotion emulator
    'http://172.16.0.1:5000/api',    // VirtualBox host
]

// Get your computer's IP address
export const getComputerIP = () => {
    // This is a placeholder - user needs to find their actual IP
    // Windows: ipconfig | findstr IPv4
    // Mac: ifconfig | grep "inet "
    // Linux: ip addr show
    return '192.168.1.100' // Replace with actual IP
}

// Create configuration with IP address
export const createIPConfig = (ip: string) => ({
    baseURL: `http://${ip}:5000/api`,
    timeout: 15000,
    enableLogging: true,
})

// Test configuration
export const testConfig = async (config: { baseURL: string }) => {
    try {
        const response = await fetch(config.baseURL.replace('/api', '') + '/health', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        
        return {
            success: response.ok,
            status: response.status,
            url: config.baseURL
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
            url: config.baseURL
        }
    }
}

// Find working configuration
export const findWorkingConfig = async () => {
    console.log('🔍 Finding working network configuration...')
    
    const configs = ANDROID_ALTERNATIVES.map(url => ({ baseURL: url }))
    
    for (const config of configs) {
        console.log(`Testing: ${config.baseURL}`)
        const result = await testConfig(config)
        
        if (result.success) {
            console.log(`✅ Found working config: ${config.baseURL}`)
            return config
        } else {
            console.log(`❌ Failed: ${config.baseURL} - ${result.error || result.status}`)
        }
    }
    
    console.log('❌ No working configuration found')
    return null
}

// Manual IP configuration
export const useManualIP = (ip: string) => {
    const config = createIPConfig(ip)
    console.log(`🔧 Using manual IP configuration: ${config.baseURL}`)
    return config
}

export default {
    ANDROID_ALTERNATIVES,
    getComputerIP,
    createIPConfig,
    testConfig,
    findWorkingConfig,
    useManualIP
}