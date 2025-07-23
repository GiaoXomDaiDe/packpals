import { router, useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'

export default function PaymentCancel() {
    const { orderCode, orderId, status } = useLocalSearchParams<{
        orderCode: string
        orderId: string
        status?: string
    }>()

    useEffect(() => {
        console.log('❌ Payment cancel callback received:', { orderCode, orderId, status })
        
        // Redirect to payment-result screen with cancelled status
        if (orderCode && orderId) {
            router.replace({
                pathname: '/(root)/payment-result',
                params: {
                    orderCode,
                    orderId,
                    status: 'cancelled'
                }
            })
        } else {
            // Fallback to orders list if missing parameters
            router.replace('/(root)/(tabs)/orders')
        }
    }, [orderCode, orderId, status])

    // This component just handles the redirect, no UI needed
    return null
}