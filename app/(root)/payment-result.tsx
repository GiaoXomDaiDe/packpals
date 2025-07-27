import { usePayOSPaymentInfo } from '@/lib/query/hooks'
import { useMarkOrderAsPaid, useUpdateOrderStatus } from '@/lib/query/hooks/useOrderQueries'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

export default function PaymentResult() {
    const { orderCode, orderId, status } = useLocalSearchParams<{
        orderCode: string
        orderId: string
        status?: string
    }>()
    
    const [paymentStatus, setPaymentStatus] = useState<'checking' | 'success' | 'failed' | 'cancelled'>('checking')
    const [orderUpdated, setOrderUpdated] = useState(false)

    // Log deep link parameters for debugging
    useEffect(() => {
        console.log('🔗 Payment result deep link received:')
        console.log('- Order ID:', orderId)
        console.log('- Order Code:', orderCode)
        console.log('- Status:', status)
    }, [orderId, orderCode, status])

    // Mutations for updating order
    const markOrderAsPaidMutation = useMarkOrderAsPaid({
        onSuccess: () => {
            console.log('✅ Order marked as paid successfully')
        },
        onError: (error) => {
            console.error('❌ Failed to mark order as paid:', error)
        }
    })

    const updateOrderStatusMutation = useUpdateOrderStatus({
        onSuccess: () => {
            console.log('✅ Order status updated to COMPLETED')
            setOrderUpdated(true)
        },
        onError: (error) => {
            console.error('❌ Failed to update order status:', error)
        }
    })

    // Set initial status from URL parameter if available
    useEffect(() => {
        console.log('📱 Payment result received with status:', status)
        if (status === 'success') {
            setPaymentStatus('success')
        } else if (status === 'cancelled') {
            setPaymentStatus('cancelled')
        }
    }, [status])

    // Update order when payment is successful
    useEffect(() => {
        if (paymentStatus === 'success' && orderId && !orderUpdated) {
            console.log('🔄 Payment successful, updating order:', orderId)
            
            // Mark order as paid
            markOrderAsPaidMutation.mutate({ orderId })
            
            // Update order status to COMPLETED
            updateOrderStatusMutation.mutate({ 
                orderId, 
                status: 'COMPLETED' 
            })
        }
    }, [paymentStatus, orderId, orderUpdated, markOrderAsPaidMutation, updateOrderStatusMutation])

    // Query payment status using orderCode from PayOS to verify
    const { data: paymentInfo } = usePayOSPaymentInfo(
        parseInt(orderCode || '0'),
        {
            enabled: !!orderCode && paymentStatus === 'checking',
        }
    )
    console.log('Payment info:', paymentInfo)

    // Check PayOS payment status and update local state
    useEffect(() => {
        if (paymentInfo?.status) {
            console.log('💳 Payment result verification:', paymentInfo.status)
            switch (paymentInfo.status) {
                case 'PAID':
                    setPaymentStatus('success')
                    break
                case 'CANCELLED':
                    setPaymentStatus('cancelled')
                    break
                default:
                    setPaymentStatus('failed')
            }
        }
    }, [paymentInfo])

    console.log('paymentInfo:', paymentInfo)

    const handleReturnToOrder = () => {
        if (orderId) {
            router.push({
                pathname: '/(root)/orderdetails/[id]',
                params: { id: orderId }
            })
        } else {
            router.push('/(root)/(tabs)/orders')
        }
    }

    const getStatusContent = () => {
        switch (paymentStatus) {
            case 'checking':
                return (
                    <View className="items-center">
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text className="text-lg font-JakartaBold text-gray-900 mt-4 mb-2">
                            Checking Payment Status...
                        </Text>
                        <Text className="text-sm text-gray-600 text-center">
                            Please wait while we verify your payment
                        </Text>
                    </View>
                )

            case 'success':
                return (
                    <View className="items-center">
                        <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-6">
                            <Ionicons name="checkmark-circle" size={40} color="#10b981" />
                        </View>
                        <Text className="text-xl font-JakartaBold text-green-600 mb-2">
                            Payment Successful!
                        </Text>
                        <Text className="text-sm text-gray-600 text-center mb-6 leading-5">
                            Your payment has been processed successfully. 
                            You can now proceed to pick up your items.
                        </Text>
                        
                        {paymentInfo && paymentInfo.amount && (
                            <View className="bg-green-50 rounded-xl p-4 w-full mb-6">
                                <Text className="text-green-700 font-JakartaMedium text-center">
                                    Amount: {paymentInfo.amount.toLocaleString()} VND ✓
                                </Text>
                                <Text className="text-green-600 text-center text-sm mt-1">
                                    Order Code: {orderCode}
                                </Text>
                            </View>
                        )}
                    </View>
                )

            case 'cancelled':
                return (
                    <View className="items-center">
                        <View className="w-20 h-20 bg-orange-50 rounded-full items-center justify-center mb-6">
                            <Ionicons name="close-circle" size={40} color="#f59e0b" />
                        </View>
                        <Text className="text-xl font-JakartaBold text-orange-600 mb-2">
                            Payment Cancelled
                        </Text>
                        <Text className="text-sm text-gray-600 text-center mb-6 leading-5">
                            You cancelled the payment. You can try again anytime.
                        </Text>
                    </View>
                )

            case 'failed':
                return (
                    <View className="items-center">
                        <View className="w-20 h-20 bg-red-50 rounded-full items-center justify-center mb-6">
                            <Ionicons name="close-circle" size={40} color="#ef4444" />
                        </View>
                        <Text className="text-xl font-JakartaBold text-red-600 mb-2">
                            Payment Failed
                        </Text>
                        <Text className="text-sm text-gray-600 text-center mb-6 leading-5">
                            Your payment could not be processed. Please try again or contact support.
                        </Text>
                    </View>
                )

            default:
                return null
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-6 py-4 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="close" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-lg font-JakartaBold text-gray-900">
                        Payment Result
                    </Text>
                    <View className="w-6" />
                </View>
            </View>

            <View className="flex-1 px-6 py-8 justify-center">
                {getStatusContent()}
                
                <TouchableOpacity
                    onPress={handleReturnToOrder}
                    className="bg-blue-600 rounded-xl py-4 px-8 w-full flex-row items-center justify-center mt-8"
                >
                    <Ionicons name="arrow-back" size={18} color="white" />
                    <Text className="text-white font-JakartaBold ml-2">
                        Return to Order
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}