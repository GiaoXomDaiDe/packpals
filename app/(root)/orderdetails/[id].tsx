import OrderRatingCard from '@/components/OrderRatingCard'
import { PayOSPaymentModal } from '@/components/PayOSPaymentModal'
import { useNotifications } from '@/lib/context/NotificationContext'
import { queryKeys } from '@/lib/query/client'
import { useOrder, useOrderDetails, useStorage, useStorageDistance } from '@/lib/query/hooks'
import { useLocationStore, useUserStore } from '@/store'
import { useQueryClient } from '@tanstack/react-query'
import * as Linking from 'expo-linking'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import MapViewDirections from 'react-native-maps-directions'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

// Utility functions for order status with professional color scheme
const getStatusColor = (status: string) => {
    switch (status) {
        case 'PENDING':
            return '#f59e0b' // amber - waiting/pending
        case 'CONFIRMED':
            return '#10b981' // emerald - confirmed/approved
        case 'IN_STORAGE':
            return '#3b82f6' // blue - in progress/storage
        case 'COMPLETED':
            return '#059669' // green - success/completed
        case 'CANCELLED':
            return '#ef4444' // red - error/cancelled
        default:
            return '#6b7280' // gray - unknown
    }
}

const getStatusText = (status: string) => {
    switch (status) {
        case 'PENDING':
            return 'Pending Confirmation'
        case 'CONFIRMED':
            return 'Confirmed & Ready'
        case 'IN_STORAGE':
            return 'Package in Storage'
        case 'COMPLETED':
            return 'Completed'
        case 'CANCELLED':
            return 'Cancelled'
        default:
            return 'Unknown Status'
    }
}

const OrderDetails = () => {
    
    const { id } = useLocalSearchParams<{ id: string }>()
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const queryClient = useQueryClient()
    
    console.log('📋 Order Details page loaded with ID:', id)
    
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
            console.log('📞 Joining renter group for order updates with userId:', userId)
            joinGroup(userId, 'renter')
        }
    }, [userId, isConnected, joinGroup])
    
    // Refresh order data when receiving notifications (optional - TanStack Query will handle this)
    useEffect(() => {
        // Could add specific notification handling here if needed
        console.log('📦 Order details component ready for real-time updates')
    }, [id])
    
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

    console.log('Hehe',userLatitude, userLongitude, storageData?.latitude, storageData?.longitude)
    
    // Get distance if we have coordinates
    const {
        data: distanceResponse
    } = useStorageDistance({
        lat1: userLatitude || 0,
        lon1: userLongitude || 0, 
        lat2: storageData?.latitude || 0,
        lon2: storageData?.longitude || 0
    }, {
        enabled: !!(userLatitude && userLongitude && storageData?.latitude && storageData?.longitude)
    })
    
    const distance = distanceResponse?.data
    console.log('📏 Distance data:', distance)

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="text-gray-600 mt-4">Loading order details...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (hasError) {
        return (
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
    }

    if (!order) {
        return (
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
    }
    console.log('📋 Order Details:', { order, storageData, orderDetails })
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Professional Header */}
            <View className="bg-white shadow-sm">
                <View className="px-6 py-4">
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity
                            onPress={() => {
                                try {
                                    if (router.canGoBack()) {
                                        router.back()
                                    } else {
                                        router.push('/(root)/(tabs)/orders')
                                    }
                                } catch {
                                    router.push('/(root)/(tabs)/orders')
                                }
                            }}
                            className="bg-gray-50 rounded-xl p-3 border border-gray-200"
                            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}
                        >
                            <Ionicons name="chevron-back" size={18} color="#374151" />
                        </TouchableOpacity>
                        <View className="items-center flex-1 mx-4">
                            <Text className="text-lg font-JakartaBold text-gray-900">
                                Order Details
                            </Text>
                            <View className="mt-1 bg-blue-50 px-3 py-1 rounded-full">
                                <Text className="text-xs font-JakartaMedium text-blue-700">
                                    #{order.id?.slice(-8)}
                                </Text>
                            </View>
                        </View>
                        <View className="w-12" />
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                {/* Compact Status Card */}
                <View className="mt-6 mb-6">
                    <View className="bg-white rounded-2xl p-5 border border-gray-100">
                        <View className="flex-row items-center">
                            <View 
                                className="rounded-xl p-3 mr-4"
                                style={{ backgroundColor: getStatusColor(order.status) + '10' }}
                            >
                                <Ionicons 
                                    name={order.status === 'COMPLETED' ? 'checkmark-circle' : 
                                          order.status === 'PENDING' ? 'time' :
                                          order.status === 'CONFIRMED' ? 'checkmark' : 'cube'} 
                                    size={24} 
                                    color={getStatusColor(order.status)} 
                                />
                            </View>
                            <View className="flex-1">
                                <View 
                                    className="self-start px-3 py-1 rounded-full mb-2"
                                    style={{ backgroundColor: getStatusColor(order.status) + '15' }}
                                >
                                    <Text 
                                        className="text-sm font-JakartaBold"
                                        style={{ color: getStatusColor(order.status) }}
                                    >
                                        {getStatusText(order.status)}
                                    </Text>
                                </View>
                                <Text className="text-gray-500 text-sm font-JakartaMedium">
                                    {new Date(order.orderDate || '').toLocaleDateString('en-US', { 
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Compact Storage & Keeper Info */}
                {storageData ? (
                    <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
                        <View className="flex-row items-center mb-3">
                            <View className="bg-blue-50 rounded-lg p-2 mr-2">
                                <Ionicons name="business-outline" size={18} color="#2563eb" />
                            </View>
                            <Text className="text-base font-JakartaBold text-gray-900">
                                Storage & Keeper
                            </Text>
                        </View>
                        
                        {/* Compact Keeper Profile */}
                        <View className="bg-blue-50 rounded-xl p-3 mb-3">
                            <View className="flex-row items-center mb-2">
                                <View className="bg-blue-600 rounded-full p-2 mr-3">
                                    <Ionicons name="person" size={14} color="white" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-blue-900 font-JakartaBold text-sm">
                                        {storageData.keeperName || 'Storage Keeper'}
                                    </Text>
                                    <Text className="text-blue-700 text-xs">
                                        Storage Manager
                                    </Text>
                                </View>
                            </View>
                            
                            {/* Compact Address */}
                            <View className="flex-row items-start bg-white/70 rounded-lg p-2">
                                <Ionicons name="location" size={14} color="#6b7280" style={{ marginTop: 1, marginRight: 6 }} />
                                <Text className="text-gray-700 text-xs font-JakartaMedium flex-1" numberOfLines={2}>
                                    {storageData.address}
                                </Text>
                            </View>
                        </View>

                        {/* Compact Contact Action */}
                        {storageData.keeperPhoneNumber ? (
                            <TouchableOpacity
                                onPress={() => Linking.openURL(`tel:${storageData.keeperPhoneNumber}`)}
                                className="bg-blue-600 rounded-xl py-2.5 px-4 flex-row items-center justify-center"
                                style={{ 
                                    shadowColor: '#2563eb',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 2,
                                    elevation: 2
                                }}
                            >
                                <Ionicons name="call" size={16} color="white" />
                                <Text className="text-white font-JakartaBold ml-2 text-sm">
                                    Call {storageData.keeperPhoneNumber}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <View className="bg-gray-50 rounded-xl py-2.5 px-4 flex-row items-center justify-center border border-gray-200">
                                <Ionicons name="call-outline" size={16} color="#9ca3af" />
                                <Text className="text-gray-500 font-JakartaMedium ml-2 text-sm">
                                    Contact info not available
                                </Text>
                            </View>
                        )}
                    </View>
                ) : null}

                {/* Clean Package Info */}
                <View className="bg-white rounded-2xl p-5 mb-6 border border-gray-100">
                    <View className="flex-row items-center mb-4">
                        <View className="bg-blue-50 rounded-lg p-2 mr-3">
                            <Ionicons name="cube-outline" size={18} color="#3b82f6" />
                        </View>
                        <Text className="text-base font-JakartaBold text-gray-900">
                            Package Details
                        </Text>
                    </View>
                    
                    {/* Package Description */}
                    <View className="mb-4">
                        <Text className="text-gray-500 text-xs font-JakartaMedium mb-2 uppercase tracking-wide">
                            Description
                        </Text>
                        <Text className="text-gray-800 leading-relaxed font-JakartaMedium bg-gray-50 rounded-lg p-3">
                            {order.packageDescription || 'No description provided'}
                        </Text>
                    </View>
                    
                    {/* Payment Summary */}
                    {order.totalAmount ? (
                        <View className="border-t border-gray-100 pt-4">
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-gray-500 text-xs font-JakartaMedium uppercase tracking-wide">
                                        Total Amount
                                    </Text>
                                    <Text className="text-xl font-JakartaBold text-gray-900 mt-1">
                                        {order.totalAmount.toLocaleString()} VND
                                    </Text>
                                </View>
                                <View className={`px-3 py-2 rounded-lg ${order.isPaid ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
                                    <Text className={`text-xs font-JakartaBold ${order.isPaid ? 'text-green-700' : 'text-orange-700'}`}>
                                        {order.isPaid ? '✓ Paid' : '⏳ Unpaid'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : null}
                </View>

                

                {/* Storage Items */}
                {orderDetails.length > 0 ? (
                    <View className="bg-white rounded-2xl p-5 mb-6 border border-gray-100">
                        <View className="flex-row items-center mb-4">
                            <View className="bg-blue-50 rounded-lg p-2 mr-3">
                                <Ionicons name="resize-outline" size={18} color="#3b82f6" />
                            </View>
                            <Text className="text-base font-JakartaBold text-gray-900">
                                Storage Items
                            </Text>
                        </View>
                        
                        {orderDetails.map((detail: any, index: number) => (
                            <View key={index} className={`flex-row items-center justify-between py-3 ${index < orderDetails.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                <View className="flex-1">
                                    <Text className="text-gray-800 font-JakartaMedium">
                                        {detail.size?.sizeDescription || 'Storage Size'}
                                    </Text>
                                </View>
                                <Text className="text-gray-900 font-JakartaBold">
                                    {detail.size?.price?.toLocaleString()} VND
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : null}

                {/* Map Section */}
                {userLatitude && userLongitude && storageData?.latitude && storageData?.longitude ? (
                    <View className="bg-white rounded-2xl p-5 mb-6 border border-gray-100">
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                <View className="bg-blue-50 rounded-lg p-2 mr-3">
                                    <Ionicons name="map-outline" size={18} color="#3b82f6" />
                                </View>
                                <Text className="text-base font-JakartaBold text-gray-900">
                                    Route to Storage
                                </Text>
                            </View>
                            {distance ? (
                                <View className="bg-blue-50 rounded-lg px-3 py-1">
                                    <Text className="text-blue-800 font-JakartaBold text-sm">
                                        {distance.toFixed(1)} km
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                        
                        <View className="rounded-xl overflow-hidden" style={{ height: 200 }}>
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
                ) : null}

                {/* Payment Actions - Show when status is IN_STORAGE */}
                {order.status === 'IN_STORAGE' && (
                    <View className="bg-white rounded-2xl p-5 mb-6 border border-gray-100">
                        <View className="flex-row items-center mb-4">
                            <View className="bg-blue-50 rounded-lg p-2 mr-3">
                                <Ionicons name="card-outline" size={18} color="#3b82f6" />
                            </View>
                            <Text className="text-base font-JakartaBold text-gray-900">
                                Payment Options
                            </Text>
                        </View>
                        
                        <View className="bg-blue-50 rounded-xl p-4 mb-4">
                            <Text className="text-blue-800 font-JakartaBold text-center mb-2">
                                📦 Package in Storage!
                            </Text>
                            <Text className="text-blue-700 text-sm text-center">
                                Your items are now safely stored. Payment is required to complete the order.
                            </Text>
                        </View>

                        <View className="space-y-3">
                            {/* Online Payment Button */}
                            <TouchableOpacity
                                onPress={() => setShowPaymentModal(true)}
                                className="bg-blue-600 rounded-xl py-4 px-6 flex-row items-center justify-center"
                            >
                                <Ionicons name="card" size={18} color="white" />
                                <Text className="text-white font-JakartaBold ml-2 text-base">
                                    Pay Online ({order.totalAmount?.toLocaleString()} VND)
                                </Text>
                            </TouchableOpacity>

                            {/* Cash Payment Info */}
                            <TouchableOpacity
                                onPress={() => {
                                    Alert.alert(
                                        '💵 Cash Payment',
                                        'You can pay in cash when you pick up your items.\n\nAmount: ' + (order.totalAmount?.toLocaleString() || 'N/A') + ' VND\n\nContact the storage keeper for pickup arrangement.',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            { 
                                                text: 'Call Keeper', 
                                                onPress: () => {
                                                    if (storageData?.keeperPhoneNumber) {
                                                        Linking.openURL(`tel:${storageData.keeperPhoneNumber}`);
                                                    }
                                                }
                                            }
                                        ]
                                    );
                                }}
                                className="bg-gray-100 rounded-xl py-4 px-6 flex-row items-center justify-center border border-gray-200"
                            >
                                <Ionicons name="cash-outline" size={18} color="#374151" />
                                <Text className="text-gray-700 font-JakartaBold ml-2 text-base">
                                    Pay with Cash on Pickup
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Rating Section - Show only for COMPLETED orders */}
                {order.status === 'COMPLETED' && userId && storageData ? (
                    <OrderRatingCard
                        orderId={order.id}
                        storageId={order.storageId}
                        storageAddress={storageData.address || 'Storage Location'}
                        orderStatus={order.status}
                        renterId={userId} // Pass userId as renterId prop (component will rename internally)
                        onRatingComplete={(rating) => {
                            console.log('✅ Rating completed:', rating)
                            // Optionally show success message or refresh data
                            Alert.alert(
                                'Cảm ơn bạn!',
                                'Đánh giá của bạn đã được ghi nhận và sẽ giúp những người dùng khác.',
                                [{ text: 'OK' }]
                            )
                        }}
                        className="mb-6"
                    />
                ) : null}

                {/* Add some bottom padding for better scrolling */}
                <View className="h-6" />
            </ScrollView>
            
            {/* PayOS Payment Modal */}
            <PayOSPaymentModal
                visible={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={() => {
                    // Refresh order data after successful payment
                    refetchOrder()
                    
                    // ✅ IMPORTANT: Invalidate user orders list to show updated orders in My Orders tab
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
                    
                    Alert.alert(
                        '✅ Payment Successful',
                        'Your payment has been processed successfully. You can now proceed to pick up your items.',
                        [{ text: 'OK' }]
                    )
                }}
                orderId={order.id}
                amount={order.totalAmount || 0}
                description={`Storage Order - ${order.packageDescription || 'Package Storage'}`}
                customerEmail={user?.email}
                customerPhone={user?.phoneNumber}
            />
        </SafeAreaView>
    )
}

export default OrderDetails