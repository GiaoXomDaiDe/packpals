import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native'
import { ReactNativeModal } from 'react-native-modal'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { WebView } from 'react-native-webview'

import CustomButton from '@/components/CustomButton'
import { orderAPI, paymentAPI } from '@/lib/api'
import { useLocationStore, useOrderStore, useUserStore } from '@/store'
import { PaymentProps } from '@/types/type'

const Payment = ({
    fullName,
    email,
    amount,
    storageId,
    orderId,
    storageName,
    storageImage,
    onPaymentSuccess,
}: PaymentProps) => {
    const { userAddress } = useLocationStore()
    const { setCompletedOrder } = useOrderStore()
    const { user } = useUserStore()

    const [success, setSuccess] = useState<boolean>(false)
    const [showPaymentWebView, setShowPaymentWebView] = useState<boolean>(false)
    const [paymentUrl, setPaymentUrl] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState<boolean>(false)
    const [isRouterReady, setIsRouterReady] = useState<boolean>(false)

    // Wait for router to be ready before allowing navigation
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsRouterReady(true)
        }, 200) // Small delay to ensure NavigationContainer is mounted
        
        return () => clearTimeout(timer)
    }, [])

    // Safe navigation function to prevent context errors
    const safeNavigate = (path: string) => {
        if (!isRouterReady) {
            console.warn('Router not ready yet, skipping navigation to:', path)
            return
        }
        
        try {
            router.push(path)
        } catch (error) {
            console.error('Navigation error:', error)
            // Fallback: try again after a short delay
            setTimeout(() => {
                try {
                    router.push(path)
                } catch (retryError) {
                    console.error('Navigation retry failed:', retryError)
                }
            }, 500)
        }
    }

    const openPaymentGateway = async () => {
        setIsProcessing(true)
        try {
            // Create VNPay payment URL using the backend API
            const paymentData = {
                amount: parseFloat(amount) * 23000, // Convert USD to VND (approximate rate)
                orderId: orderId,
                description: `Payment for storage service at ${storageName}`
            }

            console.log('Creating payment with data:', paymentData)
            const paymentResponse = await paymentAPI.createPaymentUrl(paymentData)

            if (paymentResponse.success && paymentResponse.data) {
                const paymentUrl = paymentResponse.data.paymentUrl || paymentResponse.data
                console.log('Payment URL created:', paymentUrl)
                setPaymentUrl(paymentUrl)
                setShowPaymentWebView(true)
            } else {
                Alert.alert('Payment Error', 'Failed to create payment URL. Please try again.')
            }
        } catch (error: any) {
            console.error('Payment creation error:', error)
            Alert.alert('Payment Error', error.message || 'An error occurred while processing payment')
        } finally {
            setIsProcessing(false)
        }
    }

    const handlePaymentResult = async (url: string) => {
        console.log('Payment result URL:', url)
        
        // Parse VNPay response parameters
        if (url.includes('vnp_ResponseCode')) {
            try {
                const urlParams = new URLSearchParams(url.split('?')[1])
                const responseCode = urlParams.get('vnp_ResponseCode')
                const transactionStatus = urlParams.get('vnp_TransactionStatus')
                
                console.log('VNPay Response Code:', responseCode)
                console.log('Transaction Status:', transactionStatus)
                
                if (responseCode === '00' && transactionStatus === '00') {
                    // Payment successful
                    setShowPaymentWebView(false)
                    
                    try {
                        // Mark order as paid in the backend
                        await orderAPI.markOrderAsPaid(orderId)
                        
                        // Update order status to PAID
                        await orderAPI.updateOrderStatus(orderId, 'PAID')
                        
                        // Store completed order data
                        setCompletedOrder({
                            orderId: orderId,
                            storageId: storageId,
                            storageName: storageName,
                            storageImage: storageImage,
                            packageDescription: 'Package storage service',
                            totalAmount: parseFloat(amount),
                            completedAt: new Date().toISOString(),
                            reviewed: false
                        })
                        
                        setSuccess(true)
                        
                        // Call the callback if provided (for delivery tracking flow)
                        if (onPaymentSuccess) {
                            onPaymentSuccess()
                        }
                    } catch (error) {
                        console.error('Error updating payment status:', error)
                        Alert.alert('Warning', 'Payment successful but failed to update order status')
                    }
                } else {
                    // Payment failed
                    setShowPaymentWebView(false)
                    
                    let errorMessage = 'Payment failed. Please try again.'
                    switch (responseCode) {
                        case '24':
                            errorMessage = 'Transaction was cancelled by user.'
                            break
                        case '15':
                            errorMessage = 'Incorrect OTP or payment information.'
                            break
                        case '06':
                            errorMessage = 'Transaction error. Please try again.'
                            break
                        case '07':
                            errorMessage = 'Transaction was rejected by the bank.'
                            break
                    }
                    
                    Alert.alert('Payment Failed', errorMessage)
                }
            } catch (error) {
                console.error('Error parsing payment response:', error)
                Alert.alert('Payment Error', 'Error processing payment response')
            }
        } else if (url.includes('cancel') || url.includes('error')) {
            setShowPaymentWebView(false)
            Alert.alert('Payment Cancelled', 'Payment was cancelled or failed')
        }
    }

    return (
        <>
            <View className="my-6">
                <TouchableOpacity
                    onPress={openPaymentGateway}
                    disabled={isProcessing}
                    className="rounded-2xl overflow-hidden"
                >
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="p-4 flex-row items-center justify-center"
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <Ionicons name="card-outline" size={24} color="white" />
                                <Text className="text-white font-JakartaBold text-lg ml-3">
                                    Pay with VNPay
                                </Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
                <Text className="text-gray-500 text-sm text-center mt-2">
                    Secure payment via VNPay gateway
                </Text>
            </View>

            {/* Enhanced Payment WebView Modal */}
            <ReactNativeModal
                isVisible={showPaymentWebView}
                onBackdropPress={() => setShowPaymentWebView(false)}
                style={{ margin: 0 }}
                animationIn="slideInUp"
                animationOut="slideOutDown"
            >
                <View className="flex-1 bg-white">
                    {/* Header */}
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        className="p-4 pt-12"
                    >
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                                <Text className="text-white text-xl font-JakartaBold mb-1">
                                    VNPay Payment
                                </Text>
                                <Text className="text-white/80 text-sm">
                                    Secure payment gateway
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowPaymentWebView(false)}
                                className="bg-white/20 rounded-full p-2"
                            >
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                    
                    {/* Payment Amount Display */}
                    <View className="bg-gray-50 p-4 border-b border-gray-200">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-gray-600 text-sm">
                                Payment Amount:
                            </Text>
                            <Text className="text-gray-900 font-JakartaBold text-lg">
                                {(parseFloat(amount) * 23000).toLocaleString()} VND
                            </Text>
                        </View>
                        <Text className="text-gray-500 text-xs mt-1">
                            For: {storageName}
                        </Text>
                    </View>
                    
                    {/* WebView with Loading State */}
                    <View className="flex-1 relative">
                        <WebView
                            source={{ uri: paymentUrl }}
                            onNavigationStateChange={(navState) => {
                                console.log('Navigation state:', navState.url)
                                if (navState.url.includes('callback') ||
                                    navState.url.includes('return') ||
                                    navState.url.includes('vnp_ResponseCode')) {
                                    handlePaymentResult(navState.url)
                                }
                            }}
                            style={{ flex: 1 }}
                            startInLoadingState={true}
                            renderLoading={() => (
                                <View className="flex-1 items-center justify-center bg-white">
                                    <ActivityIndicator size="large" color="#667eea" />
                                    <Text className="text-gray-600 mt-4 text-center">
                                        Loading VNPay payment gateway...
                                    </Text>
                                </View>
                            )}
                            onError={(error) => {
                                console.error('WebView error:', error)
                                Alert.alert('Error', 'Failed to load payment gateway')
                            }}
                        />
                    </View>
                </View>
            </ReactNativeModal>

            {/* Enhanced Success Modal */}
            <ReactNativeModal
                isVisible={success}
                onBackdropPress={() => setSuccess(false)}
                animationIn="zoomIn"
                animationOut="zoomOut"
                backdropOpacity={0.5}
            >
                <View className="flex flex-col items-center justify-center bg-white p-8 rounded-3xl mx-4">
                    {/* Success Icon with Gradient Background */}
                    <View className="w-32 h-32 rounded-full items-center justify-center mb-6 overflow-hidden">
                        <LinearGradient
                            colors={['#43e97b', '#38f9d7']}
                            className="w-full h-full items-center justify-center"
                        >
                            <Ionicons name="checkmark-circle" size={80} color="white" />
                        </LinearGradient>
                    </View>

                    <Text className="text-2xl text-center font-JakartaBold text-gray-900 mb-3">
                        Payment Successful!
                    </Text>

                    <Text className="text-base text-gray-600 font-JakartaRegular text-center mb-6 leading-6">
                        Your storage booking has been confirmed and paid. 
                        Please proceed to deliver your package to the storage location.
                    </Text>

                    {/* Payment Details */}
                    <View className="bg-gray-50 rounded-2xl p-4 mb-6 w-full">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-gray-600 text-sm">
                                Order ID:
                            </Text>
                            <Text className="text-gray-900 font-JakartaBold text-sm">
                                {orderId.slice(-8)}
                            </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-gray-600 text-sm">
                                Amount Paid:
                            </Text>
                            <Text className="text-gray-900 font-JakartaBold text-sm">
                                {(parseFloat(amount) * 23000).toLocaleString()} VND
                            </Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                            <Text className="text-gray-600 text-sm">
                                Storage:
                            </Text>
                            <Text className="text-gray-900 font-JakartaBold text-sm">
                                {storageName}
                            </Text>
                        </View>
                    </View>

                    {/* Next Steps */}
                    <View className="bg-blue-50 rounded-2xl p-4 mb-6 w-full">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="information-circle" size={20} color="#3b82f6" />
                            <Text className="text-blue-800 font-JakartaBold ml-2">
                                Next Steps:
                            </Text>
                        </View>
                        <View className="space-y-2">
                            <View className="flex-row items-start">
                                <Text className="text-blue-700 font-JakartaBold mr-2">1.</Text>
                                <Text className="text-blue-700 text-sm flex-1">
                                    Bring your package to: {storageName}
                                </Text>
                            </View>
                            <View className="flex-row items-start">
                                <Text className="text-blue-700 font-JakartaBold mr-2">2.</Text>
                                <Text className="text-blue-700 text-sm flex-1">
                                    Contact the keeper when you arrive
                                </Text>
                            </View>
                            <View className="flex-row items-start">
                                <Text className="text-blue-700 font-JakartaBold mr-2">3.</Text>
                                <Text className="text-blue-700 text-sm flex-1">
                                    Wait for keeper confirmation
                                </Text>
                            </View>
                            <View className="flex-row items-start">
                                <Text className="text-blue-700 font-JakartaBold mr-2">4.</Text>
                                <Text className="text-blue-700 text-sm flex-1">
                                    Your storage time will start once confirmed
                                </Text>
                            </View>
                        </View>
                    </View>

                    <CustomButton
                        title="Track Delivery"
                        IconLeft={() => <Ionicons name="navigate-outline" size={20} color="white" />}
                        onPress={() => {
                            setSuccess(false)
                            safeNavigate(`/(root)/delivery-tracking?orderId=${orderId}`)
                        }}
                        className="mt-5 w-full"
                    />

                    <CustomButton
                        title="Continue to Home"
                        onPress={async () => {
                            setSuccess(false)
                            // Clear all storage state and go home
                            const { resetAllStorageState } = await import('@/store')
                            resetAllStorageState()
                            safeNavigate('/(root)/(tabs)/home')
                        }}
                        className="mt-3 w-full bg-gray-600"
                    />

                    <CustomButton
                        title="View Order Details"
                        onPress={async () => {
                            setSuccess(false)
                            safeNavigate(`/(root)/orderdetails/${orderId}`)
                        }}
                        className="mt-3 w-full"
                        bgVariant="outline"
                    />
                </View>
            </ReactNativeModal>
        </>
    )
}

export default Payment
