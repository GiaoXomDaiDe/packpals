import { useQueryClient } from '@tanstack/react-query'
import * as Linking from 'expo-linking'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import MapViewDirections from 'react-native-maps-directions'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

// Components
import {
    CashPaymentModal,
    CustomModal,
    OrderRatingCard,
    StatusBadge
} from '@/components'
import { PayOSPaymentModal } from '@/components/PayOSPaymentModal'

// Hooks & Context
import { useNotifications } from '@/context/NotificationContext'
import { queryKeys } from '@/hooks/client'
import { useDistance, useMarkOrderAsPaid, useOrder, useOrderDetails, useStorage, useUpdateOrderStatus } from '@/hooks/query'
import { useLocationStore, useUserStore } from '@/store'

// Helper Functions
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric'
    })
}

const formatCurrency = (amount: number) => {
    // Round up to nearest 1000 VND for cleaner display
    const roundedAmount = Math.ceil(amount / 1000) * 1000;
    return roundedAmount.toLocaleString();
}

const roundCoordinate = (coordinate: number) => {
    return Math.round(coordinate * 1000000) / 1000000
}

const handleGoBack = () => {
    if (router.canGoBack()) {
        router.back()
    } else {
        router.replace('/(root)/(tabs)/orders')
    }
}

const renderLoadingState = () => (
    <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-600 mt-4">Loading order details...</Text>
        </View>
    </SafeAreaView>
)

const renderErrorState = () => (
    <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="alert-circle-outline" size={80} color="#ef4444" />
            <Text className="text-red-500 text-xl font-JakartaBold mt-4 text-center">
                Failed to load order
            </Text>
            <Text className="text-gray-500 text-center mt-2">
                Please check your connection and try again
            </Text>
            <TouchableOpacity
                onPress={() => router.push('/(root)/(tabs)/orders')}
                className="mt-6 bg-blue-500 rounded-2xl px-6 py-3"
            >
                <Text className="text-white font-JakartaBold">
                    Go Back
                </Text>
            </TouchableOpacity>
        </View>
    </SafeAreaView>
)

const renderNotFoundState = () => (
    <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="document-text-outline" size={80} color="#d1d5db" />
            <Text className="text-gray-500 text-xl font-JakartaBold mt-4">
                Order not found
            </Text>
            <Text className="text-gray-400 text-center mt-2">
                The order you&apos;re looking for doesn&apos;t exist or has been removed
            </Text>
            <TouchableOpacity
                onPress={() => router.push('/(root)/(tabs)/orders')}
                className="mt-6 bg-blue-500 rounded-2xl px-6 py-3"
            >
                <Text className="text-white font-JakartaBold">
                    Go Back
                </Text>
            </TouchableOpacity>
        </View>
    </SafeAreaView>
)

const OrderDetails = () => {
    
    const { id } = useLocalSearchParams<{ id: string }>()
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [showCashPaymentModal, setShowCashPaymentModal] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [showRatingSuccessModal, setShowRatingSuccessModal] = useState(false)
    const queryClient = useQueryClient()
    
    // Payment status update mutations
    const markOrderAsPaidMutation = useMarkOrderAsPaid({
        onSuccess: () => {
            console.log('✅ Order marked as paid successfully')
            // Refresh order data immediately
            refetchOrder()
        },
        onError: (error) => {
            console.error('❌ Failed to mark order as paid:', error)
        }
    })
    
    const updateOrderStatusMutation = useUpdateOrderStatus({
        onSuccess: () => {
            console.log('✅ Order status updated to COMPLETED successfully')
            // Refresh order data immediately
            refetchOrder()
        },
        onError: (error) => {
            console.error('❌ Failed to update order status:', error)
        }
    })
    
    // Only log once when component mounts or ID changes
    useEffect(() => {
        if (id) {
            console.log('📋 Order Details page loaded with ID:', id)
        }
    }, [id])
    
    // Use TanStack Query for real orders
    const {
        data: orderResponse,
        isLoading: orderLoading,
        error: orderError,
        refetch: refetchOrder
    } = useOrder(id || '', {
        enabled: !!id
    })
    
    const {
        data: orderDetailsResponse,
        isLoading: detailsLoading,
        error: detailsError
    } = useOrderDetails(id || '', {
        enabled: !!id
    })

    // Get user location and stores
    const { userLatitude, userLongitude } = useLocationStore()
    const { user } = useUserStore()
    
    // Use userId directly for rating functionality
    const userId = user?.id
    
    // SignalR notifications for real-time order updates
    const { isConnected, joinGroup } = useNotifications()
    
    // Setup SignalR for renter to receive order status updates
    useEffect(() => {
        if (userId && isConnected) {
            joinGroup(userId, 'renter')
        }
    }, [userId, isConnected, joinGroup])

    // Determine current data source
    const order = orderResponse?.data
    const orderDetails = (orderDetailsResponse as any)?.data || []
    const loading = orderLoading || detailsLoading
    const hasError = orderError || detailsError
    
    // Get storage details using storageId from order
    const storageId = order?.storageId
    
    const {
        data: storageResponse
    } = useStorage(storageId || '', {
        enabled: !!storageId
    })
    
    const storageData = (storageResponse as any)?.data

    // Memoize coordinates to prevent unnecessary distance API calls
    const distanceParams = useMemo(() => {
        if (!userLatitude || !userLongitude || !storageData?.latitude || !storageData?.longitude) {
            return null
        }
        
        return {
            lat1: roundCoordinate(userLatitude),
            lon1: roundCoordinate(userLongitude),
            lat2: roundCoordinate(storageData.latitude),
            lon2: roundCoordinate(storageData.longitude)
        }
    }, [userLatitude, userLongitude, storageData?.latitude, storageData?.longitude])

    // Get distance only when coordinates are stable
    const {
        data: distanceResponse
    } = useDistance(distanceParams || { lat1: 0, lon1: 0, lat2: 0, lon2: 0 }, {
        enabled: !!distanceParams,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000 // 10 minutes
    })
    
    const distance = distanceResponse?.data

    // Only log when order and storage are first loaded
    useEffect(() => {
        if (order?.id && storageData?.id) {
            console.log('📋 Order details loaded for:', order.id)
        }
    }, [order?.id, storageData?.id])

    // Helper function for payment success
    const handlePaymentSuccess = async () => {
        console.log('💳 Payment successful, updating order status...')
        
        if (!order?.id) {
            console.error('❌ No order ID available for payment update')
            return
        }

        try {
            // Step 1: Mark order as paid
            console.log('🔄 Marking order as paid...')
            await markOrderAsPaidMutation.mutateAsync({
                orderId: order.id,
                storageId: order.storageId,
                renterId: userId
            })

            // Step 2: Update order status to completed
            console.log('🔄 Updating order status to COMPLETED...')
            await updateOrderStatusMutation.mutateAsync({
                orderId: order.id,
                status: 'COMPLETED',
                storageId: order.storageId,
                renterId: userId
            })

            console.log('✅ Payment processing completed successfully')
            
        } catch (error) {
            console.error('❌ Failed to update order after payment:', error)
            // Still continue with UI updates even if API calls fail
        }
        
        // Refresh order data after successful payment
        refetchOrder()
        
        // Invalidate user orders list to show updated orders in My Orders tab
        if (userId) {
            queryClient.invalidateQueries({
                queryKey: queryKeys.userOrders(userId)
            })
            
            // Also invalidate all variations of user orders queries (with different filters)
            queryClient.invalidateQueries({
                predicate: (query) => {
                    return query.queryKey[0] === 'userOrders' && query.queryKey[1] === userId
                }
            })
        }
        
        setShowSuccessModal(true)
    }

    if (loading) {
        return renderLoadingState()
    }

    if (hasError) {
        return renderErrorState()
    }

    if (!order) {
        return renderNotFoundState()
    }
    
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Compact Header */}
            <View className="bg-white px-6 py-3 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity
                            onPress={handleGoBack}
                            className="bg-gray-50 rounded-lg p-2 mr-3"
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={18} color="#374151" />
                        </TouchableOpacity>
                        
                        <View className="flex-1">
                            <Text className="text-lg font-JakartaBold text-gray-900">
                                Order Details
                            </Text>
                            <Text className="text-xs text-gray-500 font-JakartaMedium">
                                #{order.id?.slice(-6) || 'N/A'}
                            </Text>
                        </View>
                    </View>
                    
                    <View className="flex-row items-center">
                        <StatusBadge 
                            status={order.status || ''} 
                            size="medium"
                        />
                        <View className="ml-3 items-end">
                            <Text className="text-xs text-gray-400 font-JakartaMedium">
                                {formatDate(order.orderDate || '')}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Package Info */}
                <View className="mx-4 mt-4 mb-3">
                    <View className="bg-white rounded-xl border border-gray-100 p-4">
                        <View className="flex-row items-center mb-3">
                            <View className="bg-blue-100 rounded-lg p-2 mr-3">
                                <Ionicons name="cube-outline" size={16} color="#3b82f6" />
                            </View>
                            <Text className="text-base font-JakartaBold text-gray-900">
                                Package Details
                            </Text>
                        </View>
                        
                        <Text className="text-gray-700 text-sm font-JakartaMedium leading-5 mb-3">
                            {order.packageDescription || 'No description provided'}
                        </Text>
                        
                        {order.totalAmount && (
                            <View className="flex-row items-center justify-between bg-gray-50 rounded-lg p-3">
                                <View>
                                    <Text className="text-gray-500 text-xs font-JakartaMedium">
                                        Total Amount
                                    </Text>
                                    <Text className="text-lg font-JakartaBold text-gray-900">
                                        {formatCurrency(order.totalAmount)} VND
                                    </Text>
                                </View>
                                <View className={`px-3 py-1 rounded-lg ${
                                    order.isPaid ? 'bg-green-100' : 'bg-orange-100'
                                }`}>
                                    <Text className={`text-xs font-JakartaBold ${
                                        order.isPaid ? 'text-green-700' : 'text-orange-700'
                                    }`}>
                                        {order.isPaid ? '✓ Paid' : 'Unpaid'}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Storage & Keeper */}
                {storageData && (
                    <View className="mx-4 mb-3">
                        <View className="bg-white rounded-xl border border-gray-100 p-4">
                            <View className="flex-row items-center mb-3">
                                <View className="bg-green-100 rounded-lg p-2 mr-3">
                                    <Ionicons name="business-outline" size={16} color="#059669" />
                                </View>
                                <Text className="text-base font-JakartaBold text-gray-900">
                                    Storage & Keeper
                                </Text>
                            </View>
                            
                            {/* Keeper Info */}
                            <View className="flex-row items-center mb-3">
                                <View className="bg-gray-100 rounded-full p-2 mr-3">
                                    <Ionicons name="person" size={16} color="#374151" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-900 font-JakartaBold text-sm">
                                        {storageData.keeperName || 'Storage Keeper'}
                                    </Text>
                                    <Text className="text-gray-500 text-xs font-JakartaMedium">
                                        Storage Manager
                                    </Text>
                                </View>
                            </View>
                            
                            {/* Address */}
                            <View className="bg-gray-50 rounded-lg p-3 mb-3">
                                <View className="flex-row items-start">
                                    <Ionicons name="location-outline" size={14} color="#6b7280" style={{ marginTop: 1, marginRight: 6 }} />
                                    <Text className="text-gray-700 font-JakartaMedium flex-1 text-sm leading-4">
                                        {storageData.address}
                                    </Text>
                                </View>
                            </View>

                            {/* Contact Button */}
                            {storageData.keeperPhoneNumber ? (
                                <TouchableOpacity
                                    onPress={() => Linking.openURL(`tel:${storageData.keeperPhoneNumber}`)}
                                    className="bg-green-500 rounded-lg py-3 px-4 flex-row items-center justify-center"
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="call" size={16} color="white" />
                                    <Text className="text-white font-JakartaBold ml-2 text-sm">
                                        Call {storageData.keeperPhoneNumber}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View className="bg-gray-100 rounded-lg py-3 px-4 flex-row items-center justify-center">
                                    <Ionicons name="call-outline" size={16} color="#9ca3af" />
                                    <Text className="text-gray-500 font-JakartaMedium ml-2 text-sm">
                                        Contact info not available
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Storage Items */}
                {orderDetails.length > 0 && (
                    <View className="mx-4 mb-3">
                        <View className="bg-white rounded-xl border border-gray-100 p-4">
                            <View className="flex-row items-center mb-3">
                                <View className="bg-purple-100 rounded-lg p-2 mr-3">
                                    <Ionicons name="resize-outline" size={16} color="#7c3aed" />
                                </View>
                                <Text className="text-base font-JakartaBold text-gray-900">
                                    Storage Items
                                </Text>
                            </View>
                            
                            {orderDetails.map((detail: any, index: number) => (
                                <View 
                                    key={index} 
                                    className={`flex-row items-center justify-between py-3 ${
                                        index < orderDetails.length - 1 ? 'border-b border-gray-100' : ''
                                    }`}
                                >
                                    <Text className="text-gray-900 font-JakartaBold text-sm flex-1">
                                        {detail.size?.sizeDescription || 'Storage Size'}
                                    </Text>
                                    <View className="bg-purple-50 rounded-lg px-3 py-1">
                                        <Text className="text-purple-900 font-JakartaBold text-sm">
                                            {formatCurrency(detail.size?.price || 0)} VND
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Map Section */}
                {userLatitude && userLongitude && storageData?.latitude && storageData?.longitude && (
                    <View className="mx-4 mb-3">
                        <View className="bg-white rounded-xl border border-gray-100 p-4">
                            <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-row items-center">
                                    <View className="bg-orange-100 rounded-lg p-2 mr-3">
                                        <Ionicons name="map-outline" size={16} color="#ea580c" />
                                    </View>
                                    <Text className="text-base font-JakartaBold text-gray-900">
                                        Route to Storage
                                    </Text>
                                </View>
                                {distance && (
                                    <View className="bg-orange-50 rounded-lg px-2 py-1">
                                        <Text className="text-orange-800 font-JakartaBold text-xs">
                                            {distance.toFixed(1)} km
                                        </Text>
                                    </View>
                                )}
                            </View>
                            
                            <View className="rounded-lg overflow-hidden" style={{ height: 180 }}>
                                <MapView
                                    style={{ flex: 1 }}
                                    initialRegion={{
                                        latitude: (userLatitude + storageData.latitude) / 2,
                                        longitude: (userLongitude + storageData.longitude) / 2,
                                        latitudeDelta: Math.abs(userLatitude - storageData.latitude) * 1.5 || 0.01,
                                        longitudeDelta: Math.abs(userLongitude - storageData.longitude) * 1.5 || 0.01,
                                    }}
                                >
                                    <Marker
                                        coordinate={{
                                            latitude: userLatitude,
                                            longitude: userLongitude,
                                        }}
                                        title="Your Location"
                                        pinColor="#007AFF"
                                    />
                                    
                                    <Marker
                                        coordinate={{
                                            latitude: storageData.latitude,
                                            longitude: storageData.longitude,
                                        }}
                                        title="Storage Location"
                                        description={storageData.address || 'Storage facility'}
                                        pinColor="#FF6B35"
                                    />
                                    
                                    <MapViewDirections
                                        origin={{
                                            latitude: userLatitude,
                                            longitude: userLongitude,
                                        }}
                                        destination={{
                                            latitude: storageData.latitude,
                                            longitude: storageData.longitude,
                                        }}
                                        apikey={process.env.EXPO_PUBLIC_GOOGLE_API_KEY || ''}
                                        strokeWidth={3}
                                        strokeColor="#007AFF"
                                        mode="DRIVING"
                                    />
                                </MapView>
                            </View>
                        </View>
                    </View>
                )}

                {/* Payment Actions */}
                {order.status === 'IN_STORAGE' && (
                    <View className="mx-4 mb-3">
                        <View className="bg-white rounded-xl border border-gray-100 p-4">
                            <View className="flex-row items-center mb-3">
                                <View className="bg-blue-100 rounded-lg p-2 mr-3">
                                    <Ionicons name="card-outline" size={16} color="#3b82f6" />
                                </View>
                                <Text className="text-base font-JakartaBold text-gray-900">
                                    Payment Options
                                </Text>
                            </View>
                            
                            <View className="bg-blue-50 rounded-lg p-3 mb-4">
                                <View className="flex-row items-center mb-1">
                                    <Text className="text-lg mr-2">📦</Text>
                                    <Text className="text-blue-900 font-JakartaBold text-sm">
                                        Package in Storage!
                                    </Text>
                                </View>
                                <Text className="text-blue-700 text-xs font-JakartaMedium">
                                    Your items are safely stored. Payment required to complete order.
                                </Text>
                            </View>

                            <View className="space-y-2">
                                <TouchableOpacity
                                    onPress={() => setShowPaymentModal(true)}
                                    className="bg-blue-600 rounded-lg py-3 px-4 flex-row items-center justify-center mb-2"
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="card" size={16} color="white" />
                                    <Text className="text-white font-JakartaBold ml-2 text-sm">
                                        Pay Online ({formatCurrency(order.totalAmount || 0)} VND)
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setShowCashPaymentModal(true)}
                                    className="bg-gray-100 rounded-lg py-3 px-4 flex-row items-center justify-center border border-gray-200"
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="cash-outline" size={16} color="#374151" />
                                    <Text className="text-gray-700 font-JakartaBold ml-2 text-sm">
                                        Pay Cash on Pickup
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* Rating Section */}
                {order.status === 'COMPLETED' && userId && storageData && (
                    <View className="mx-4 mb-4">
                        <OrderRatingCard
                            orderId={order.id}
                            storageId={order.storageId}
                            storageAddress={storageData.address || 'Storage Location'}
                            orderStatus={order.status}
                            renterId={userId}
                            onRatingComplete={(rating) => {
                                console.log('✅ Rating completed:', rating)
                                setShowRatingSuccessModal(true)
                            }}
                        />
                    </View>
                )}

                <View className="h-6" />
            </ScrollView>
            
            {/* PayOS Payment Modal */}
            <PayOSPaymentModal
                visible={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={handlePaymentSuccess}
                orderId={order.id}
                amount={order.totalAmount || 0}
                description={`Storage Order - ${order.packageDescription || 'Package Storage'}`}
                customerEmail={user?.email}
                customerPhone={user?.phoneNumber}
            />
            
            {/* Cash Payment Modal */}
            <CashPaymentModal
                isVisible={showCashPaymentModal}
                amount={order.totalAmount || 0}
                onClose={() => setShowCashPaymentModal(false)}
                onCallKeeper={() => {
                    setShowCashPaymentModal(false)
                    if (storageData?.keeperPhoneNumber) {
                        Linking.openURL(`tel:${storageData.keeperPhoneNumber}`)
                    }
                }}
            />
            
            {/* Payment Success Modal */}
            <CustomModal
                isVisible={showSuccessModal}
                type="success"
                title="Payment Successful!"
                message="Your payment has been processed successfully. You can now proceed to pick up your items."
                buttonText="OK"
                onConfirm={() => setShowSuccessModal(false)}
            />
            
            {/* Rating Success Modal */}
            <CustomModal
                isVisible={showRatingSuccessModal}
                type="success"
                title="Thank you!"
                message="Your rating has been recorded and will help other users."
                buttonText="OK"
                onConfirm={() => setShowRatingSuccessModal(false)}
            />
        </SafeAreaView>
    )
}

export default OrderDetails