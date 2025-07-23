import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';

export const useDeepLinking = () => {
    const router = useRouter()
    
    // Use Expo's recommended hook for URL handling
    const url = Linking.useURL()

    const handleDeepLink = useCallback((url: string) => {
        try {
            console.log('🔍 Processing deep link:', url)
            
            // Use Linking.parse for better URL parsing
            const parsed = Linking.parse(url)
            console.log('📊 Parsed URL:', {
                scheme: parsed.scheme,
                hostname: parsed.hostname,
                path: parsed.path,
                queryParams: parsed.queryParams
            })

            const { path, queryParams } = parsed
            
            if (path?.includes('payment/success')) {
                console.log('✅ Processing payment success deep link')
                
                router.push({
                    pathname: '/(root)/payment-result',
                    params: { 
                        orderId: queryParams?.orderId || 'unknown',
                        status: 'success', 
                        orderCode: queryParams?.orderCode || 'unknown'
                    }
                })
            } else if (path?.includes('payment/cancel')) {
                console.log('❌ Processing payment cancel deep link')
                
                router.push({
                    pathname: '/(root)/payment-result',
                    params: { 
                        orderId: queryParams?.orderId || 'unknown',
                        status: 'cancelled',
                        orderCode: queryParams?.orderCode || 'unknown'
                    }
                })
            } else if (path?.includes('payment-result')) {
                console.log('📊 Processing direct payment result deep link')
                
                router.push({
                    pathname: '/(root)/payment-result',
                    params: { 
                        orderId: queryParams?.orderId || 'unknown',
                        status: queryParams?.status || 'unknown',
                        orderCode: queryParams?.orderCode || 'unknown'
                    }
                })
            } else {
                console.log('🔗 Unknown deep link format:', url)
                console.log('Available paths:', { path, queryParams })
            }
            
        } catch (error) {
            console.error('❌ Error processing deep link:', error)
            Alert.alert('Deep Link Error', `Failed to process: ${url}`)
        }
    }, [router])

    useEffect(() => {
        if (url) {
            console.log('📱 Deep link received via useURL hook:', url)
            handleDeepLink(url)
        }
    }, [url, handleDeepLink])

    // Also handle initial URL for when app is opened from closed state
    useEffect(() => {
        Linking.getInitialURL().then((initialUrl) => {
            if (initialUrl && initialUrl !== url) {
                console.log('🚀 App opened with initial URL:', initialUrl)
                handleDeepLink(initialUrl)
            }
        }).catch((error) => {
            console.error('❌ Error getting initial URL:', error)
        })
    }, [handleDeepLink, url])
}

export default useDeepLinking
