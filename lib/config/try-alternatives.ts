/**
 * Try Alternative URLs
 * Test this in your app to find working URL
 */

// Alternative URLs to try
export const ALTERNATIVE_URLS = [
    'http://192.168.43.112:5000/api',      // Standard Android emulator
    'http://localhost:5000/api',      // Sometimes works on Android
    'http://127.0.0.1:5000/api',     // Alternative localhost
    'http://192.168.1.100:5000/api', // Replace with your IP
    'http://10.0.3.2:5000/api',      // Genymotion emulator
    'http://172.17.0.1:5000/api',    // Docker
]

// Test each URL
export const findWorkingURL = async () => {
    console.log('🔍 Testing alternative URLs...')
    
    for (const url of ALTERNATIVE_URLS) {
        try {
            console.log(`Testing: ${url}`)
            const response = await fetch(url.replace('/api', ''), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            
            if (response.ok) {
                console.log(`✅ WORKING: ${url}`)
                return url
            } else {
                console.log(`❌ Failed: ${url} - Status: ${response.status}`)
            }
        } catch (error: any) {
            console.log(`❌ Error: ${url} - ${error.message}`)
        }
    }
    
    console.log('❌ No working URL found')
    return null
}

export default findWorkingURL