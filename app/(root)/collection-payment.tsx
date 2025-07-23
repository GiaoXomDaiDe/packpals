import { router } from 'expo-router'
import { useState } from 'react'
import {
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

import CustomButton from '@/components/CustomButton'
import { icons } from '@/constants'
import { useUserStore } from '@/store'
import { 
    useCreatePaymentUrl, 
    useMarkOrderAsPaid, 
    useUpdateOrderStatus 
} from '@/lib/query/hooks'

// Mock data - in real app, this would come from the order/storage details
const mockStorageOrder = {
    orderId: 'mock-order-12345',
    storageId: 'storage-001',
    storageName: 'Tu ban quan ao',
    keeperName: 'Huy Nguyen',
    keeperPhone: '+84 123 456 789',
    storageAddress: '123 Nguyen Trai, District 1, Ho Chi Minh City',
    packageDescription: 'Personal Electronics',
    storageStartDate: '2024-01-08',
    actualDays: 3,
    sizes: [
        { name: 'Small Box', quantity: 1, pricePerDay: 30000, totalPrice: 90000 },
        { name: 'Medium Box', quantity: 1, pricePerDay: 50000, totalPrice: 150000 }
    ],
    subtotal: 240000,
    serviceFee: 24000,
    total: 264000
}

const palette = {
    background: '#fafafa',
    surface: '#ffffff',
    surfaceVariant: '#f8f9fa',
    primary: '#2563eb',
    primarySoft: '#dbeafe',
    secondary: '#64748b',
    accent: '#06b6d4',
    accentSoft: '#e0f7fa',
    success: '#059669',
    successSoft: '#d1fae5',
    warning: '#d97706',
    warningSoft: '#fed7aa',
    text: '#1e293b',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    border: '#e2e8f0',
    shadow: 'rgba(15, 23, 42, 0.08)'
}

const CollectionPayment = () => {
    const { user } = useUserStore()
    const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'cash'>('vnpay')
    
    // TanStack Query mutations
    const createPaymentUrlMutation = useCreatePaymentUrl({
        onSuccess: (data) => {
            if (data?.paymentUrl) {
                Alert.alert(
                    'Payment Processing',
                    'Redirecting to VNPay for payment...\n\nIn a real app, this would open VNPay payment gateway.',
                    [
                        {
                            text: 'Simulate Success',
                            onPress: () => handlePaymentSuccess()
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel'
                        }
                    ]
                )
            }
        },
        onError: (error) => {
            console.error('❌ Payment URL creation failed:', error)
            Alert.alert(
                'Payment Service Unavailable',
                'Unable to connect to payment service. Please try cash payment or contact the keeper.',
                [
                    {
                        text: 'Try Cash Payment',
                        onPress: () => setPaymentMethod('cash')
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    }
                ]
            )
        }
    })
    
    const markOrderAsPaidMutation = useMarkOrderAsPaid({
        onSuccess: () => {
            console.log('✅ Order marked as paid')
        },
        onError: (error) => {
            console.error('❌ Failed to mark order as paid:', error)
        }
    })
    
    const updateOrderStatusMutation = useUpdateOrderStatus({
        onSuccess: () => {
            console.log('✅ Order status updated')
        },
        onError: (error) => {
            console.error('❌ Failed to update order status:', error)
        }
    })
    
    const isLoading = createPaymentUrlMutation.isPending || 
                     markOrderAsPaidMutation.isPending || 
                     updateOrderStatusMutation.isPending

    const handlePayment = async () => {
        if (!user?.id) {
            Alert.alert('Error', 'User not authenticated. Please login again.')
            return
        }

        try {
            if (paymentMethod === 'vnpay') {
                // Create VNPay payment URL
                const paymentData = {
                    amount: mockStorageOrder.total,
                    orderId: mockStorageOrder.orderId,
                    description: `Payment for storage collection - ${mockStorageOrder.packageDescription}`
                }

                console.log('💳 Creating VNPay payment URL:', paymentData)
                createPaymentUrlMutation.mutate(paymentData)
            } else {
                // Cash payment - mark as completed without online payment
                handleCashPayment()
            }
        } catch (error) {
            console.error('Error processing payment:', error)
            Alert.alert('Error', 'An error occurred while processing payment.')
        }
    }

    const handlePaymentSuccess = async () => {
        try {
            // Mark order as paid
            await markOrderAsPaidMutation.mutateAsync({
                orderId: mockStorageOrder.orderId
            })
            
            // Update order status to COMPLETED
            await updateOrderStatusMutation.mutateAsync({
                orderId: mockStorageOrder.orderId,
                status: 'COMPLETED'
            })
            
            Alert.alert(
                'Payment Successful!',
                'Your payment has been processed and your items have been collected. Thank you for using PackPals!',
                [
                    {
                        text: 'Rate Storage',
                        onPress: () => router.push(`/(root)/rate-storage/${mockStorageOrder.storageId}`)
                    },
                    {
                        text: 'Go to Home',
                        onPress: () => router.replace('/(root)/(tabs)/home')
                    }
                ]
            )
        } catch (error) {
            console.error('Error updating order after payment:', error)
            Alert.alert('Payment Processed', 'Your payment was successful, but there was an issue updating the order status. Please contact support.')
        }
    }

    const handleCashPayment = () => {
        Alert.alert(
            'Cash Payment Confirmation',
            `Please pay ${mockStorageOrder.total.toLocaleString()} VND directly to the keeper: ${mockStorageOrder.keeperName}\n\nAfter payment, your order will be marked as completed.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Paid in Cash',
                    onPress: () => {
                        // Simulate cash payment completion
                        Alert.alert(
                            'Order Completed',
                            'Thank you! Your cash payment has been recorded and your items have been collected.',
                            [
                                {
                                    text: 'Rate Storage',
                                    onPress: () => router.push(`/(root)/rate-storage/${mockStorageOrder.storageId}`)
                                },
                                {
                                    text: 'Go to Home',
                                    onPress: () => router.replace('/(root)/(tabs)/home')
                                }
                            ]
                        )
                    }
                }
            ]
        )
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, marginBottom: 24 }}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Image
                            source={icons.backArrow}
                            style={{ width: 24, height: 24 }}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: palette.text }}>
                        Collect Items & Pay
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Storage Information */}
                <View style={{ backgroundColor: palette.surface, borderRadius: 20, padding: 20, marginHorizontal: 24, marginBottom: 20, shadowColor: palette.shadow, shadowOpacity: 0.08, shadowRadius: 8 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 16 }}>
                        Storage Details
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Ionicons name="business-outline" size={20} color={palette.primary} />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: palette.text, marginLeft: 10 }}>
                            {mockStorageOrder.storageName}
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Ionicons name="person-outline" size={20} color={palette.primary} />
                        <Text style={{ fontSize: 14, color: palette.textSecondary, marginLeft: 10 }}>
                            Keeper: {mockStorageOrder.keeperName}
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Ionicons name="location-outline" size={20} color={palette.primary} />
                        <Text style={{ fontSize: 14, color: palette.textSecondary, marginLeft: 10, flex: 1 }}>
                            {mockStorageOrder.storageAddress}
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="archive-outline" size={20} color={palette.primary} />
                        <Text style={{ fontSize: 14, color: palette.textSecondary, marginLeft: 10 }}>
                            Items: {mockStorageOrder.packageDescription}
                        </Text>
                    </View>
                </View>

                {/* Payment Summary */}
                <View style={{ backgroundColor: palette.surface, borderRadius: 20, padding: 20, marginHorizontal: 24, marginBottom: 20, shadowColor: palette.shadow, shadowOpacity: 0.08, shadowRadius: 8 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 16 }}>
                        Payment Summary
                    </Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ fontSize: 14, color: palette.textSecondary }}>
                            Storage Duration
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: palette.text }}>
                            {mockStorageOrder.actualDays} days
                        </Text>
                    </View>

                    {mockStorageOrder.sizes.map((size, index) => (
                        <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ fontSize: 14, color: palette.textSecondary }}>
                                {size.name} × {size.quantity}
                            </Text>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: palette.text }}>
                                {size.totalPrice.toLocaleString()} VND
                            </Text>
                        </View>
                    ))}

                    <View style={{ height: 1, backgroundColor: palette.border, marginVertical: 12 }} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ fontSize: 14, color: palette.textSecondary }}>
                            Subtotal
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: palette.text }}>
                            {mockStorageOrder.subtotal.toLocaleString()} VND
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 14, color: palette.textSecondary }}>
                            Service Fee (10%)
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: palette.text }}>
                            {mockStorageOrder.serviceFee.toLocaleString()} VND
                        </Text>
                    </View>

                    <View style={{ height: 1, backgroundColor: palette.border, marginVertical: 12 }} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: palette.text }}>
                            Total Amount
                        </Text>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: palette.primary }}>
                            {mockStorageOrder.total.toLocaleString()} VND
                        </Text>
                    </View>
                </View>

                {/* Payment Method Selection */}
                <View style={{ backgroundColor: palette.surface, borderRadius: 20, padding: 20, marginHorizontal: 24, marginBottom: 20, shadowColor: palette.shadow, shadowOpacity: 0.08, shadowRadius: 8 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 16 }}>
                        Payment Method
                    </Text>

                    {/* VNPay Option */}
                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 16,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: paymentMethod === 'vnpay' ? palette.primary : palette.border,
                            backgroundColor: paymentMethod === 'vnpay' ? palette.primarySoft : palette.background,
                            marginBottom: 12
                        }}
                        onPress={() => setPaymentMethod('vnpay')}
                    >
                        <Ionicons
                            name={paymentMethod === 'vnpay' ? 'radio-button-on' : 'radio-button-off'}
                            size={24}
                            color={paymentMethod === 'vnpay' ? palette.primary : palette.textSecondary}
                        />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: palette.text }}>
                                VNPay Online Banking
                            </Text>
                            <Text style={{ fontSize: 14, color: palette.textSecondary }}>
                                Pay securely with your bank account
                            </Text>
                        </View>
                        <Ionicons name="card-outline" size={24} color={palette.primary} />
                    </TouchableOpacity>

                    {/* Cash Option */}
                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 16,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: paymentMethod === 'cash' ? palette.primary : palette.border,
                            backgroundColor: paymentMethod === 'cash' ? palette.primarySoft : palette.background
                        }}
                        onPress={() => setPaymentMethod('cash')}
                    >
                        <Ionicons
                            name={paymentMethod === 'cash' ? 'radio-button-on' : 'radio-button-off'}
                            size={24}
                            color={paymentMethod === 'cash' ? palette.primary : palette.textSecondary}
                        />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: palette.text }}>
                                Cash Payment
                            </Text>
                            <Text style={{ fontSize: 14, color: palette.textSecondary }}>
                                Pay directly to the keeper
                            </Text>
                        </View>
                        <Ionicons name="cash-outline" size={24} color={palette.primary} />
                    </TouchableOpacity>
                </View>

                {/* Payment Button */}
                <View style={{ paddingHorizontal: 24 }}>
                    <CustomButton
                        title={`Pay ${mockStorageOrder.total.toLocaleString()} VND`}
                        onPress={handlePayment}
                        isLoading={isLoading}
                        className="mb-4"
                    />
                    
                    <Text style={{ fontSize: 12, color: palette.textSecondary, textAlign: 'center', lineHeight: 16 }}>
                        By proceeding with payment, you confirm that you have collected your items from the keeper and agree to our terms of service.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default CollectionPayment