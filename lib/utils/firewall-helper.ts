/**
 * Firewall Helper
 * Instructions and tests for Windows Firewall with physical devices
 */

// Test if firewall is blocking the connection
export const testFirewallBlocking = async () => {
    const computerIP = ' 192.168.1.43'
    const port = 5000
    
    console.log('🔥 Testing if Windows Firewall is blocking connection...')
    
    try {
        // Test direct connection to backend
        const response = await fetch(`http://${computerIP}:${port}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        
        if (response.ok) {
            console.log('✅ Connection successful - Firewall is NOT blocking')
            return false // Firewall is not blocking
        } else {
            console.log('⚠️ Connection made but server returned error')
            console.log('Status:', response.status)
            return false // Connection was made
        }
    } catch (error: any) {
        console.log('❌ Connection failed - Firewall likely blocking')
        console.log('Error:', error.message)
        return true // Firewall is likely blocking
    }
}

// Windows Firewall commands (for reference)
export const getFirewallCommands = () => {
    const commands = [
        '// Run these commands in Command Prompt as Administrator:',
        '',
        '// Add inbound rule for port 5000:',
        'netsh advfirewall firewall add rule name="Allow Port 5000" dir=in action=allow protocol=TCP localport=5000',
        '',
        '// Add outbound rule for port 5000:',
        'netsh advfirewall firewall add rule name="Allow Port 5000 Out" dir=out action=allow protocol=TCP localport=5000',
        '',
        '// To remove the rules later:',
        'netsh advfirewall firewall delete rule name="Allow Port 5000"',
        'netsh advfirewall firewall delete rule name="Allow Port 5000 Out"',
        '',
        '// Check current firewall rules:',
        'netsh advfirewall firewall show rule name=all',
    ]
    
    return commands
}

// Step-by-step firewall setup
export const getFirewallSetupSteps = () => {
    return [
        '🔥 WINDOWS FIREWALL SETUP FOR EXPO + PHYSICAL DEVICE:',
        '',
        'METHOD 1: Windows Defender Firewall (Recommended)',
        '1. Press Win + R, type "firewall.cpl", press Enter',
        '2. Click "Allow an app or feature through Windows Defender Firewall"',
        '3. Click "Change Settings" (you may need admin rights)',
        '4. Click "Allow another app..."',
        '5. Browse and find your backend executable',
        '6. Add it and make sure both Private and Public are checked',
        '',
        'METHOD 2: Create Port Rule (Alternative)',
        '1. Press Win + R, type "wf.msc", press Enter',
        '2. Click "Inbound Rules" in left panel',
        '3. Click "New Rule..." in right panel',
        '4. Select "Port" → Next',
        '5. Select "TCP" → "Specific local ports" → enter "5000"',
        '6. Select "Allow the connection" → Next',
        '7. Check all network types → Next',
        '8. Name it "PackPals Backend Port 5000" → Finish',
        '',
        'METHOD 3: Temporary Disable (For Testing Only)',
        '1. Open Windows Security (Windows Defender)',
        '2. Go to "Firewall & network protection"',
        '3. Click on "Private network" (your WiFi)',
        '4. Turn off "Windows Defender Firewall" temporarily',
        '5. Test your app - if it works, firewall was the issue',
        '6. IMPORTANT: Turn firewall back on after testing!',
        '',
        'VERIFY SETUP:',
        '1. Open browser on your phone',
        '2. Visit: http://192.168.1.43:5000',
        '3. If you see backend response, firewall is configured correctly',
    ]
}

// Quick test function
export const quickFirewallTest = async () => {
    console.log('🚀 Quick Firewall Test Starting...')
    
    const isBlocked = await testFirewallBlocking()
    
    if (isBlocked) {
        console.log('🔥 FIREWALL IS BLOCKING THE CONNECTION!')
        console.log('')
        getFirewallSetupSteps().forEach(step => console.log(step))
    } else {
        console.log('✅ Firewall is not blocking the connection')
        console.log('✅ Network connectivity is working')
    }
    
    return !isBlocked
}

export default {
    testFirewallBlocking,
    getFirewallCommands,
    getFirewallSetupSteps,
    quickFirewallTest
}