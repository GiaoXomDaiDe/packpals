import { Platform } from 'react-native';

/**
 * Network Configuration for different development environments
 * Handles localhost connections for React Native apps
 */

// Get the correct localhost URL based on platform
const getLocalhostURL = (port: number = 5000) => {
    // Check if running in Expo tunnel (via exp:// URL)
    const isExpoTunnel = __DEV__ && process.env.EXPO_PUBLIC_DEV_CLIENT_ORIGIN?.includes('exp://');
    
    if (isExpoTunnel) {
        // When using Expo tunnel, we need to use the actual IP address
        // since tunnel creates a different network context
        return `http://192.168.1.43:${port}`;
    }
    
    if (Platform.OS === 'android') {
        // Try different options for Android emulator
        // Option 1: Your computer's IP address
        return `http://192.168.1.43:${port}`
        
        // If above doesn't work, try these alternatives:
        // return `http://localhost:${port}`        // Sometimes works
        // return `http://127.0.0.1:${port}`       // Alternative localhost  
        // return `http://YOUR_IP_HERE:${port}`    // Replace with your computer's IP
    } else if (Platform.OS === 'ios') {
        // iOS simulator can access localhost directly
        return `http://localhost:${port}`
    } else {
        // Web or other platforms
        return `http://localhost:${port}`
    }
}

// Common backend ports for different environments
export const BACKEND_PORTS = {
    DEV: 5000,  // Updated to match your backend port based on logs
    STAGING: 7100,
    PRODUCTION: 443
}

// Network configuration
export const NETWORK_CONFIG = {
    development: {
        // Use localhost instead of ngrok for better compatibility with Expo Go
        baseURL: 'http://192.168.1.43:5000/api',
        
        // Option 2: Use ngrok if needed (updated URL)
        // baseURL: 'https://a169fb8b36f3.ngrok-free.app/api',
        
        timeout: 15000,
        enableLogging: true,
    },
    staging: {
        baseURL: process.env.EXPO_PUBLIC_STAGING_API_URL || `http://staging-api.packpals.com/api`,
        timeout: 12000,
        enableLogging: true,
    },
    production: {
        baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.packpals.com/api',
        timeout: 10000,
        enableLogging: false,
    }
}

// Alternative localhost URLs for troubleshooting
export const LOCALHOST_ALTERNATIVES = {
    android: [
        'http://192.168.1.43:5000/api',  // Android emulator with HTTP
        'http://192.168.1.100:5000/api',  // Replace with your actual IP
        'http://localhost:5000/api'
    ],
    ios: [
        'http://localhost:5000/api',  // iOS simulator with HTTP
        'http://127.0.0.1:5000/api',  // Alternative localhost
        'http://192.168.1.100:5000/api'  // Replace with your actual IP
    ]
}

// Debug helper to log network configuration
export const logNetworkConfig = () => {
    console.log('📡 Network Configuration:')
    console.log('- Platform:', Platform.OS)
    console.log('- Base URL:', NETWORK_CONFIG.development.baseURL)
    console.log('- Timeout:', NETWORK_CONFIG.development.timeout)
    console.log('- Alternative URLs:', LOCALHOST_ALTERNATIVES[Platform.OS as keyof typeof LOCALHOST_ALTERNATIVES])
}

export default NETWORK_CONFIG