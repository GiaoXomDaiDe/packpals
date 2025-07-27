import { useCreatePayOSPayment, useCreatePayOSTransaction, usePayOSPaymentInfo } from '@/lib/query/hooks'
import React, { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Linking,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'

interface PayOSPaymentModalProps {
    visible: boolean
    onClose: () => void
    onSuccess: () => void
    orderId: string
    amount: number
    description: string
    customerEmail?: string
    customerPhone?: string
}

export const PayOSPaymentModal: React.FC<PayOSPaymentModalProps> = ({
    visible,
    onClose,
    onSuccess,
    orderId,
    amount,
    description,
    customerEmail,
    customerPhone
}) => {
    const [paymentCodeId, setPaymentCodeId] = useState<number | null>(null)
    const [transactionId, setTransactionId] = useState<string | null>(null)
    const [paymentStep, setPaymentStep] = useState<'init' | 'creating' | 'pending' | 'processing' | 'completed' | 'failed'>('init')

    // PayOS hooks
    const createPaymentMutation = useCreatePayOSPayment({
        onSuccess: (response) => {
            console.log('✅ Payment link created:', response)
            setPaymentCodeId(response.orderCode)
            setPaymentStep('pending')
            
            // Close modal and open payment URL - app will handle redirect
            onClose()
            
            // Open payment URL in browser
            Linking.openURL(response.checkoutUrl).catch(() => {
                Alert.alert('Error', 'Unable to open payment page. Please try again.')
            })
        },
        onError: (error) => {
            console.error('❌ Payment creation failed:', error)
            setPaymentStep('failed')
            Alert.alert('Payment Error', error.message || 'Failed to create payment. Please try again.')
        }
    })

    const createTransactionMutation = useCreatePayOSTransaction({
        onSuccess: (response) => {
            console.log('✅ Transaction created:', response)
            setTransactionId(response.id)
        },
        onError: (error) => {
            console.error('❌ Transaction creation failed:', error)
            // Continue with payment even if transaction creation fails
        }
    })

    // Poll payment status
    const { data: paymentInfo, isLoading: isPolling } = usePayOSPaymentInfo(
        paymentCodeId || 0,
        {
            enabled: paymentStep === 'pending' && !!paymentCodeId,
            onSuccess: (data) => {
                console.log('📊 Payment status:', data.status)
                if (data.status === 'PAID') {
                    setPaymentStep('completed')
                    setTimeout(() => {
                        onSuccess()
                        handleClose()
                    }, 2000)
                } else if (data.status === 'CANCELLED') {
                    setPaymentStep('failed')
                }
            }
        }
    )

    const handleClose = () => {
        setPaymentStep('init')
        setPaymentCodeId(null)
        setTransactionId(null)
        onClose()
    }

    const handleStartPayment = () => {
        // Validate minimum amount requirement (PayOS minimum might be 2000 VND)
        if (amount < 2000) {
            Alert.alert('Payment Error', 'Minimum payment amount is 2,000 VND')
            return
        }
        
        setPaymentStep('creating')
        
        // Generate unique payment code with timestamp to avoid collisions
        const timestamp = Date.now()
        const random = Math.floor(Math.random() * 999999)
        const paymentCode = `${timestamp}${random}`.slice(0, 12) // Limit to 12 digits
        
        // Create PayOS payment link
        createPaymentMutation.mutate({
            amount,
            description: `PackPals Storage Order`, // Simplified without Vietnamese chars
            returnUrl: `https://a169fb8b36f3.ngrok-free.app/payment/success?orderCode=${paymentCode}&orderId=${orderId}`, // Updated ngrok URL
            cancelUrl: `https://a169fb8b36f3.ngrok-free.app/payment/cancel?orderCode=${paymentCode}&orderId=${orderId}`,   // Updated ngrok URL
            paymentCode,
            orderId,
            buyerEmail: customerEmail,
            buyerPhone: customerPhone
        })

        // Create transaction record
        createTransactionMutation.mutate({
            amount,
            description: `PackPals - ${description}`,
            orderId,
            transactionCode: paymentCode
        })
    }

    const handleRetry = () => {
        setPaymentStep('init')
        setPaymentCodeId(null)
        setTransactionId(null)
    }

    const getStepContent = () => {
        switch (paymentStep) {
            case 'init':
                return (
                    <View className="items-center">
                        <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-6">
                            <Ionicons name="card-outline" size={40} color="#3b82f6" />
                        </View>
                        <Text className="text-xl font-JakartaBold text-gray-900 mb-2">
                            Online Payment
                        </Text>
                        <Text className="text-sm text-gray-600 text-center mb-6 leading-5">
                            Pay securely with PayOS payment gateway. Supports bank transfer, e-wallets, and more.
                        </Text>
                        
                        <View className="bg-blue-50 rounded-xl p-4 w-full mb-6">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-blue-700 font-JakartaMedium">Amount to pay:</Text>
                                <Text className="text-blue-900 text-lg font-JakartaBold">
                                    {amount.toLocaleString()} VND
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleStartPayment}
                            className="bg-blue-600 rounded-xl py-4 px-8 w-full flex-row items-center justify-center"
                        >
                            <Ionicons name="card" size={18} color="white" />
                            <Text className="text-white font-JakartaBold ml-2">
                                Pay with PayOS
                            </Text>
                        </TouchableOpacity>
                    </View>
                )

            case 'creating':
                return (
                    <View className="items-center">
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text className="text-lg font-JakartaBold text-gray-900 mt-4 mb-2">
                            Creating Payment...
                        </Text>
                        <Text className="text-sm text-gray-600 text-center">
                            Please wait while we prepare your payment
                        </Text>
                    </View>
                )

            case 'pending':
                return (
                    <View className="items-center">
                        <View className="w-20 h-20 bg-orange-50 rounded-full items-center justify-center mb-6">
                            <Ionicons name="time-outline" size={40} color="#f59e0b" />
                        </View>
                        <Text className="text-xl font-JakartaBold text-gray-900 mb-2">
                            Payment Pending
                        </Text>
                        <Text className="text-sm text-gray-600 text-center mb-6 leading-5">
                            Complete your payment in the opened browser window. 
                            This dialog will update automatically when payment is confirmed.
                        </Text>
                        
                        {isPolling && (
                            <View className="flex-row items-center mb-4">
                                <ActivityIndicator size="small" color="#3b82f6" />
                                <Text className="text-blue-600 font-JakartaMedium ml-2">
                                    Checking payment status...
                                </Text>
                            </View>
                        )}

                        <View className="bg-gray-50 rounded-xl p-4 w-full">
                            <Text className="text-gray-700 font-JakartaMedium text-center">
                                Payment Code: {paymentCodeId}
                            </Text>
                        </View>
                    </View>
                )

            case 'completed':
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
                        
                        <View className="bg-green-50 rounded-xl p-4 w-full">
                            <Text className="text-green-700 font-JakartaMedium text-center">
                                Amount: {amount.toLocaleString()} VND ✓
                            </Text>
                        </View>
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
                        
                        <TouchableOpacity
                            onPress={handleRetry}
                            className="bg-blue-600 rounded-xl py-4 px-8 w-full flex-row items-center justify-center"
                        >
                            <Ionicons name="refresh" size={18} color="white" />
                            <Text className="text-white font-JakartaBold ml-2">
                                Try Again
                            </Text>
                        </TouchableOpacity>
                    </View>
                )

            default:
                return null
        }
    }

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View className="flex-1 bg-gray-50">
                {/* Header */}
                <View className="bg-white px-6 py-4 border-b border-gray-200">
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity 
                            onPress={handleClose}
                            disabled={paymentStep === 'creating' || paymentStep === 'processing'}
                        >
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text className="text-lg font-JakartaBold text-gray-900">
                            Payment
                        </Text>
                        <View className="w-6" />
                    </View>
                </View>

                <ScrollView className="flex-1 px-6 py-8">
                    {getStepContent()}
                </ScrollView>
            </View>
        </Modal>
    )
}