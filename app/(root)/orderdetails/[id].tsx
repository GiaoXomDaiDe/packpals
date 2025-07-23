import { useNotifications } from '@/lib/context/NotificationContext'
import { useOrder, useOrderDetails, useStorage, useStorageDistance } from '@/lib/query/hooks'
import { useUserProfile } from '@/lib/query/hooks/useUserQueries'
import { useLocationStore, useUserStore } from '@/store'
import { PayOSPaymentModal } from '@/components/PayOSPaymentModal'
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

// Utility functions for order status
const getStatusColor = (status: string) => {
    switch (status) {
        case 'PENDING':
            return '#f59e0b' // amber
        case 'CONFIRMED':
            return '#10b981' // emerald
        case 'IN_STORAGE':
            return '#8b5cf6' // purple
        case 'COMPLETED':
            return '#059669' // green
        case 'CANCELLED':
            return '#ef4444' // red
        default:
            return '#6b7280' // gray
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
    
    // Get user profile to extract renterId
    const {
        data: userProfileResponse
    } = useUserProfile(user?.id || '', {
        enabled: !!user?.id
    })
    
    const userData = (userProfileResponse as any)?.data.data
    const renterId = userData?.renter?.renterId
    
    // SignalR notifications for real-time order updates
    const { isConnected, joinGroup } = useNotifications()
    
    // Setup SignalR for renter to receive order status updates
    useEffect(() => {
        if (renterId && isConnected) {
            console.log('📞 Joining renter group for order updates with renterId:', renterId)
            joinGroup(renterId, 'renter')
        }
    }, [renterId, isConnected, joinGroup])
    
    // Refresh order data when receiving notifications (optional - TanStack Query will handle this)
    useEffect(() => {
        // Could add specific notification handling here if needed
        console.log('📦 Order details component ready for real-time updates')
    }, [id])
    
    // Determine current data source
    const order = orderResponse?.data
    const orderDetails = orderDetailsResponse?.data || []
    const loading = orderLoading || detailsLoading
    const hasError = orderError || detailsError
    
    // Get storage details using storageId from order
    const storageId = order?.storageId
    
    const {
        data: storageResponse,
        isLoading: storageLoading
    } = useStorage(storageId || '', {
        enabled: !!storageId
    })
    
    const storageData = (storageResponse as any)?.data

    console.log('Hehe',userLatitude, userLongitude, storageData?.latitude, storageData?.longitude)
    
    // Get distance if we have coordinates
    const {
        data: distanceResponse,
        isLoading: distanceLoading
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
            {/* Simplified Header */}
            <View className="bg-white px-6 py-4 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => {
                            try {
                                if (router.canGoBack()) {
                                    router.back()
                                } else {
                                    router.push('/(root)/(tabs)/orders')
                                }
                            } catch (error) {
                                router.push('/(root)/(tabs)/orders')
                            }
                        }}
                        className="bg-gray-100 rounded-full p-2"
                    >
                        <Ionicons name="chevron-back" size={20} color="#374151" />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text className="text-lg font-JakartaBold text-gray-900">
                            Order Details
                        </Text>
                        <Text className="text-xs text-gray-500">
                            #{order.id?.slice(-8)}
                        </Text>
                    </View>
                    <View className="w-8 h-8" />
                </View>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                {/* Status Card */}
                <View className="mt-6 mb-4">
                    <View 
                        className="rounded-2xl p-5"
                        style={{
                            backgroundColor: getStatusColor(order.status) + '15',
                            borderLeftWidth: 4,
                            borderLeftColor: getStatusColor(order.status)
                        }}
                    >
                        <View className="flex-row items-center">
                            <View 
                                className="rounded-full p-3 mr-4"
                                style={{ backgroundColor: getStatusColor(order.status) + '20' }}
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
                                <Text 
                                    className="text-lg font-JakartaBold"
                                    style={{ color: getStatusColor(order.status) }}
                                >
                                    {getStatusText(order.status)}
                                </Text>
                                <Text className="text-gray-600 text-sm">
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

                {/* Package Info */}
                <View className="bg-white rounded-2xl p-5 mb-4">
                    <View className="flex-row items-center mb-3">
                        <Ionicons name="cube-outline" size={20} color="#ea580c" />
                        <Text className="text-base font-JakartaBold text-gray-900 ml-2">
                            Package Details
                        </Text>
                    </View>
                    <Text className="text-gray-700 leading-relaxed">
                        {order.packageDescription || 'No description provided'}
                    </Text>
                    
                    {order.totalAmount ? (
                        <View className="mt-4 pt-4 border-t border-gray-100">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-gray-600">Total Amount:</Text>
                                <Text className="text-lg font-JakartaBold text-green-600">
                                    {order.totalAmount.toLocaleString()} VND
                                </Text>
                            </View>
                            <View className="flex-row items-center justify-between">
                                <Text className="text-gray-600">Payment:</Text>
                                <View className={`px-3 py-1 rounded-full ${order.isPaid ? 'bg-green-100' : 'bg-orange-100'}`}>
                                    <Text className={`text-xs font-JakartaBold ${order.isPaid ? 'text-green-800' : 'text-orange-800'}`}>
                                        {order.isPaid ? 'Paid' : 'Unpaid'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : null}
                </View>

                {/* Storage & Keeper Info */}
                {storageData ? (
                    <View className="bg-white rounded-2xl p-5 mb-4">
                        <View className="flex-row items-center mb-4">
                            <Ionicons name="business-outline" size={20} color="#2563eb" />
                            <Text className="text-base font-JakartaBold text-gray-900 ml-2">
                                Storage & Keeper
                            </Text>
                        </View>
                        
                        <View className="bg-blue-50 rounded-xl p-4">
                            <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-1">
                                    <Text className="text-blue-900 font-JakartaBold">
                                        {storageData.keeperName || 'Storage Keeper'}
                                    </Text>
                                    <Text className="text-blue-700 text-sm">
                                        Storage Manager
                                    </Text>
                                </View>
                                <View className="bg-blue-600 rounded-full p-2">
                                    <Ionicons name="person" size={16} color="white" />
                                </View>
                            </View>
                            
                            <Text className="text-gray-700 text-sm mb-3" numberOfLines={2}>
                                📍 {storageData.address}
                            </Text>
                            
                            {storageData.keeperPhoneNumber ? (
                                <TouchableOpacity
                                    onPress={() => Linking.openURL(`tel:${storageData.keeperPhoneNumber}`)}
                                    className="bg-blue-600 rounded-xl py-3 px-4 flex-row items-center justify-center"
                                >
                                    <Ionicons name="call" size={16} color="white" />
                                    <Text className="text-white font-JakartaBold ml-2">
                                        Call {storageData.keeperPhoneNumber}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View className="bg-gray-100 rounded-xl py-3 px-4 flex-row items-center justify-center">
                                    <Ionicons name="call-outline" size={16} color="#6b7280" />
                                    <Text className="text-gray-500 font-JakartaMedium ml-2">
                                        Contact info not available
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                ) : null}

                {/* Order Items */}
                {orderDetails.length > 0 ? (
                    <View className="bg-white rounded-2xl p-5 mb-4">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="resize-outline" size={20} color="#7c3aed" />
                            <Text className="text-base font-JakartaBold text-gray-900 ml-2">
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
                                <Text className="text-purple-600 font-JakartaBold">
                                    {detail.size?.price?.toLocaleString()} VND
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : null}

                {/* Map Section */}
                {userLatitude && userLongitude && storageData?.latitude && storageData?.longitude ? (
                    <View className="bg-white rounded-2xl p-5 mb-4">
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                <Ionicons name="map-outline" size={20} color="#059669" />
                                <Text className="text-base font-JakartaBold text-gray-900 ml-2">
                                    Route to Storage
                                </Text>
                            </View>
                            {distance ? (
                                <View className="bg-green-100 rounded-lg px-3 py-1">
                                    <Text className="text-green-800 font-JakartaBold text-sm">
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
                    <View className="bg-white rounded-2xl p-5 mb-4">
                        <View className="flex-row items-center mb-4">
                            <Ionicons name="card-outline" size={20} color="#10b981" />
                            <Text className="text-base font-JakartaBold text-gray-900 ml-2">
                                Payment Options
                            </Text>
                        </View>
                        
                        <View className="bg-purple-50 rounded-xl p-4 mb-4">
                            <Text className="text-purple-800 font-JakartaBold text-center mb-2">
                                📦 Package in Storage!
                            </Text>
                            <Text className="text-purple-700 text-sm text-center">
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
                    Alert.alert(
                        '✅ Payment Successful',
                        'Your payment has been processed successfully. You can now proceed to pick up your items.',
                        [{ text: 'OK' }]
                    )
                }}
                orderId={order.id}
                amount={order.totalAmount || 0}
                description={`Storage Order - ${order.packageDescription || 'Package Storage'}`}
                customerEmail={userData?.email}
                customerPhone={userData?.phoneNumber}
            />
        </SafeAreaView>
    )
}

export default OrderDetails