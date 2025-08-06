import { useCreatePayOSPayment, useCreatePayOSTransaction } from '@/hooks/query'
import React, { useCallback, useState } from 'react'
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { WebView } from 'react-native-webview'
import CustomModal from './CustomModal'

// Helper function
const formatCurrency = (amount: number) => {
    // Round up to nearest 1000 VND for cleaner display
    const roundedAmount = Math.ceil(amount / 1000) * 1000;
    return roundedAmount.toLocaleString();
}

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
    const [paymentStep, setPaymentStep] = useState<'init' | 'creating' | 'embedded' | 'completed' | 'failed'>('init')
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
    const [paymentCode, setPaymentCode] = useState<string>('')

    // PayOS hooks
    const createPaymentMutation = useCreatePayOSPayment({
        onSuccess: (response) => {
            console.log('✅ Payment link created:', response)
            setPaymentCode(response.orderCode.toString())
            setCheckoutUrl(response.checkoutUrl)
            setPaymentStep('embedded')
        },
        onError: (error) => {
            console.error('❌ Payment creation failed:', error)
            setPaymentStep('failed')
            setErrorMessage(error.message || 'Failed to create payment. Please try again.')
            setShowErrorModal(true)
        }
    })

    const createTransactionMutation = useCreatePayOSTransaction({
        onSuccess: (response) => {
            console.log('✅ Transaction created:', response)
        },
        onError: (error) => {
            console.error('❌ Transaction creation failed:', error)
            // Continue with payment even if transaction creation fails
        }
    })

    const handleClose = useCallback(() => {
        setPaymentStep('init')
        setCheckoutUrl(null)
        setPaymentCode('')
        onClose()
    }, [onClose])

    // Handle WebView navigation for payment result
    const handleWebViewNavigationStateChange = (navState: any) => {
        const { url } = navState
        console.log('🌐 WebView URL:', url)
        
        // Check for success URL
        if (url.includes('payment-success') || url.includes('success')) {
            console.log('✅ Payment detected as successful')
            setPaymentStep('completed')
            setTimeout(() => {
                onSuccess()
                handleClose()
            }, 1500)
        }
        
        // Check for cancel URL
        if (url.includes('payment-cancel') || url.includes('cancel')) {
            console.log('❌ Payment cancelled')
            setPaymentStep('failed')
        }
    }

    const handleStartPayment = () => {
        // Validate minimum amount requirement (PayOS minimum might be 2000 VND)
        if (amount < 2000) {
            setErrorMessage('Minimum payment amount is 2,000 VND')
            setShowErrorModal(true)
            return
        }
        
        setPaymentStep('creating')
        
        // Generate unique payment code with timestamp to avoid collisions
        const timestamp = Date.now()
        const random = Math.floor(Math.random() * 999999)
        const generatedPaymentCode = `${timestamp}${random}`.slice(0, 12) // Limit to 12 digits
        
        // Create PayOS payment link for embedded form
        createPaymentMutation.mutate({
            amount,
            description: `PackPals Storage Order`, 
            returnUrl: `exp://packpals/payment-success?orderCode=${generatedPaymentCode}&orderId=${orderId}`,
            cancelUrl: `exp://packpals/payment-cancel?orderCode=${generatedPaymentCode}&orderId=${orderId}`,
            paymentCode: generatedPaymentCode,
            orderId,
            buyerEmail: customerEmail,
            buyerPhone: customerPhone
        })

        // Create transaction record
        createTransactionMutation.mutate({
            amount,
            description: `PackPals - ${description}`,
            orderId,
            transactionCode: generatedPaymentCode
        })
    }

    const handleRetry = () => {
        setPaymentStep('init')
        setCheckoutUrl(null)
        setPaymentCode('')
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
                                    {formatCurrency(amount)} VND
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

            case 'embedded':
                return (
                    <View className="flex-1">
                        <View className="items-center mb-3">
                            <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center mb-2">
                                <Ionicons name="card" size={24} color="#3b82f6" />
                            </View>
                            <Text className="text-base font-JakartaBold text-gray-900 mb-1">
                                Complete Payment
                            </Text>
                            <Text className="text-xs text-gray-600 text-center mb-2 leading-4">
                                Complete your payment in the form below
                            </Text>
                            
                            <View className="bg-blue-50 rounded-lg p-2 mb-3">
                                <Text className="text-blue-700 text-center font-JakartaMedium text-xs">
                                    Code: {paymentCode}
                                </Text>
                            </View>
                        </View>

                        {checkoutUrl && (
                            <View className="w-full flex-1" style={{ minHeight: 500, maxHeight: 600 }}>
                                <WebView
                                    source={{ uri: checkoutUrl }}
                                    onNavigationStateChange={handleWebViewNavigationStateChange}
                                    startInLoadingState={true}
                                    renderLoading={() => (
                                        <View className="flex-1 items-center justify-center">
                                            <ActivityIndicator size="large" color="#3b82f6" />
                                            <Text className="text-gray-600 mt-2">Loading payment form...</Text>
                                        </View>
                                    )}
                                    style={{ 
                                        borderRadius: 12,
                                        overflow: 'hidden',
                                        backgroundColor: '#f9fafb',
                                        flex: 1
                                    }}
                                    scalesPageToFit={true}
                                    scrollEnabled={true}
                                    bounces={false}
                                    showsVerticalScrollIndicator={true}
                                    showsHorizontalScrollIndicator={false}
                                    automaticallyAdjustContentInsets={false}
                                    contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
                                    contentInsetAdjustmentBehavior="never"
                                />
                            </View>
                        )}
                        
                        <TouchableOpacity
                            onPress={handleClose}
                            className="bg-gray-100 rounded-lg py-2 px-4 mt-2"
                            activeOpacity={0.8}
                        >
                            <Text className="text-gray-700 font-JakartaBold text-xs text-center">
                                Cancel Payment
                            </Text>
                        </TouchableOpacity>
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
                                Amount: {formatCurrency(amount)} VND ✓
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
                            disabled={paymentStep === 'creating' || paymentStep === 'embedded'}
                        >
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text className="text-lg font-JakartaBold text-gray-900">
                            Payment
                        </Text>
                        <View className="w-6" />
                    </View>
                </View>

                <ScrollView 
                    className="flex-1 px-6"
                    contentContainerStyle={{ 
                        flexGrow: 1,
                        paddingTop: 20,
                        ...(paymentStep === 'embedded' && { paddingBottom: 10 })
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {getStepContent()}
                </ScrollView>
            </View>
            
            {/* Error Modal */}
            <CustomModal
                isVisible={showErrorModal}
                type="error"
                title="Payment Error"
                message={errorMessage}
                buttonText="OK"
                onConfirm={() => setShowErrorModal(false)}
            />
        </Modal>
    )
}