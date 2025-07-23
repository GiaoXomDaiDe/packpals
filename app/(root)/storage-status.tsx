import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

import CustomButton from '@/components/CustomButton'
import { orderAPI, storageAPI } from '@/lib/api'
import { useUserStore } from '@/store'
import { Order, StorageMarkerData } from '@/types/type'

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

const StorageStatus = () => {
    const { orderId } = useLocalSearchParams<{ orderId: string }>()
    const { user } = useUserStore()
    
    const [order, setOrder] = useState<Order | null>(null)
    const [storageDetails, setStorageDetails] = useState<StorageMarkerData | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        if (orderId && orderId !== 'mock-order') {
            fetchOrderDetails()
        } else {
            setLoading(false)
            createMockOrderForTesting()
        }
    }, [orderId])

    const fetchOrderDetails = async () => {
        try {
            setLoading(true)
            const orderResponse = await orderAPI.getOrderById(orderId!)
            
            if (orderResponse.code === 'SUCCESS' && orderResponse.data) {
                setOrder(orderResponse.data)
                
                // Get storage details
                const storageId = orderResponse.data.storageId
                try {
                    const storageResponse = await storageAPI.getStorageById(storageId)
                    if (storageResponse.code === 'SUCCESS') {
                        const transformedStorage: StorageMarkerData = {
                            id: storageResponse.data.id,
                            title: storageResponse.data.description || 'Storage Space',
                            address: storageResponse.data.address || 'Unknown Location',
                            latitude: storageResponse.data.latitude || 0,
                            longitude: storageResponse.data.longitude || 0,
                            status: storageResponse.data.status || 'AVAILABLE',
                            pricePerDay: storageResponse.data.pricePerDay || 50000,
                            rating: storageResponse.data.rating || 4.5,
                            keeperName: storageResponse.data.keeper?.user?.username || 'Storage Owner',
                            images: storageResponse.data.images || ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'],
                            description: storageResponse.data.description || 'Secure storage space'
                        }
                        setStorageDetails(transformedStorage)
                    }
                } catch (storageError) {
                    console.error('Failed to fetch storage details:', storageError)
                }
            }
        } catch (error) {
            console.error('Error fetching order details:', error)
            Alert.alert('Error', 'Failed to load order details')
        } finally {
            setLoading(false)
        }
    }

    const createMockOrderForTesting = () => {
        const mockOrder: Order = {
            id: 'mock-order-' + Date.now(),
            renterId: user?.id || 'mock-renter',
            storageId: 'mock-storage',
            status: 'IN_STORAGE',
            totalAmount: 150000,
            packageDescription: 'Personal Electronics and Documents',
            orderDate: '2024-01-08T10:00:00Z',
            isPaid: false,
            startKeepTime: '2024-01-08T14:30:00Z'
        }
        setOrder(mockOrder)
        
        const mockStorage: StorageMarkerData = {
            id: 'mock-storage',
            title: 'Tu ban quan ao',
            address: '123 Nguyen Trai, District 1, Ho Chi Minh City',
            latitude: 10.8231,
            longitude: 106.6297,
            status: 'OCCUPIED',
            pricePerDay: 50000,
            rating: 4.8,
            keeperName: 'Huy Nguyen',
            images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'],
            description: 'Safe and secure storage space in the heart of District 1'
        }
        setStorageDetails(mockStorage)
    }

    const getStatusInfo = () => {
        if (!order) return { title: 'Unknown', description: 'Loading...', color: palette.textSecondary, icon: 'help-circle' }
        
        switch (order.status) {
            case 'PENDING':
                return {
                    title: 'Reservation Pending',
                    description: 'Waiting for keeper to confirm your storage reservation',
                    color: palette.warning,
                    icon: 'time-outline',
                    backgroundColor: palette.warningSoft
                }
            case 'CONFIRMED':
                return {
                    title: 'Storage Confirmed',
                    description: 'Keeper confirmed! You can bring your items to storage',
                    color: palette.accent,
                    icon: 'checkmark-circle-outline',
                    backgroundColor: palette.accentSoft
                }
            case 'IN_STORAGE':
                return {
                    title: 'Items Safely Stored',
                    description: 'Your items are securely stored with the keeper',
                    color: palette.success,
                    icon: 'shield-checkmark-outline',
                    backgroundColor: palette.successSoft
                }
            case 'COMPLETED':
                return {
                    title: 'Storage Complete',
                    description: 'Items collected and service completed',
                    color: palette.primary,
                    icon: 'checkmark-done-outline',
                    backgroundColor: palette.primarySoft
                }
            case 'CANCELLED':
                return {
                    title: 'Storage Cancelled',
                    description: 'This storage order has been cancelled',
                    color: palette.textSecondary,
                    icon: 'close-circle-outline',
                    backgroundColor: '#f5f5f5'
                }
            default:
                return {
                    title: 'Unknown Status',
                    description: 'Contact support for assistance',
                    color: palette.textSecondary,
                    icon: 'help-circle-outline',
                    backgroundColor: '#f5f5f5'
                }
        }
    }

    const getStorageDuration = () => {
        if (!order?.startKeepTime) return 'Not started'
        
        const startDate = new Date(order.startKeepTime)
        const currentDate = new Date()
        const diffTime = Math.abs(currentDate.getTime() - startDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays === 0) return 'Started today'
        if (diffDays === 1) return '1 day'
        return `${diffDays} days`
    }

    const calculateCurrentCost = () => {
        if (!order?.startKeepTime || !storageDetails?.pricePerDay) return 0
        
        const startDate = new Date(order.startKeepTime)
        const currentDate = new Date()
        const diffTime = Math.abs(currentDate.getTime() - startDate.getTime())
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
        
        return diffDays * storageDetails.pricePerDay
    }

    const handleCollectItems = () => {
        Alert.alert(
            'Collect Your Items',
            `Ready to collect your stored items?\n\n• Current storage duration: ${getStorageDuration()}\n• Estimated cost: ${calculateCurrentCost().toLocaleString()} VND\n\nContact the keeper to arrange pickup time.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Contact Keeper', onPress: () => {
                    Alert.alert('Contact Keeper', `Call ${storageDetails?.keeperName || 'the keeper'} to arrange pickup time.\n\nFeature coming soon!`)
                }},
                { text: 'Go to Payment', onPress: () => {
                    router.push('/(root)/collection-payment')
                }}
            ]
        )
    }

    const handleCancelStorage = async () => {
        if (!order) return
        
        Alert.alert(
            'Cancel Storage',
            'Are you sure you want to cancel this storage order? This action cannot be undone.',
            [
                { text: 'No, Keep Storage', style: 'cancel' },
                { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
                    setUpdating(true)
                    try {
                        await orderAPI.updateOrderStatus(order.id, 'CANCELLED')
                        setOrder({ ...order, status: 'CANCELLED' })
                        Alert.alert('Storage Cancelled', 'Your storage order has been cancelled.')
                    } catch (error) {
                        Alert.alert('Error', 'Failed to cancel storage order.')
                    } finally {
                        setUpdating(false)
                    }
                }}
            ]
        )
    }

    const statusInfo = getStatusInfo()

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={palette.primary} />
                    <Text style={{ color: palette.textSecondary, marginTop: 16 }}>Loading storage status...</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
            {/* Header */}
            <Animated.View 
                entering={FadeInDown.delay(100).springify()}
                style={{ backgroundColor: palette.surface, paddingHorizontal: 24, paddingVertical: 16, shadowColor: palette.shadow, shadowOpacity: 0.08, shadowRadius: 8 }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ backgroundColor: palette.surfaceVariant, borderRadius: 20, padding: 8 }}
                    >
                        <Ionicons name="chevron-back" size={24} color={palette.text} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: palette.text }}>
                        Storage Status
                    </Text>
                    <View style={{ width: 40 }} />
                </View>
            </Animated.View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {/* Status Card */}
                <Animated.View entering={FadeInUp.delay(200).springify()} style={{ marginHorizontal: 24, marginTop: 24 }}>
                    <View style={{ backgroundColor: statusInfo.backgroundColor, borderRadius: 20, padding: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <Text style={{ color: statusInfo.color, fontSize: 24, fontWeight: '700' }}>
                                {statusInfo.title}
                            </Text>
                            <Ionicons name={statusInfo.icon as any} size={32} color={statusInfo.color} />
                        </View>
                        <Text style={{ color: statusInfo.color, fontSize: 16, opacity: 0.8 }}>
                            {statusInfo.description}
                        </Text>
                    </View>
                </Animated.View>

                {/* Order Details */}
                {order && (
                    <Animated.View entering={FadeInUp.delay(300).springify()} style={{ backgroundColor: palette.surface, borderRadius: 20, padding: 20, marginHorizontal: 24, marginTop: 24, shadowColor: palette.shadow, shadowOpacity: 0.08, shadowRadius: 8 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 16 }}>
                            Order Information
                        </Text>
                        
                        <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="receipt-outline" size={20} color={palette.primary} />
                            <Text style={{ color: palette.textSecondary, marginLeft: 12, flex: 1 }}>
                                Order ID: #{order.id.slice(-8)}
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="archive-outline" size={20} color={palette.primary} />
                            <Text style={{ color: palette.textSecondary, marginLeft: 12, flex: 1 }}>
                                Items: {order.packageDescription}
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="calendar-outline" size={20} color={palette.primary} />
                            <Text style={{ color: palette.textSecondary, marginLeft: 12, flex: 1 }}>
                                Order Date: {new Date(order.orderDate).toLocaleDateString()}
                            </Text>
                        </View>

                        {order.startKeepTime && (
                            <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="time-outline" size={20} color={palette.primary} />
                                <Text style={{ color: palette.textSecondary, marginLeft: 12, flex: 1 }}>
                                    Storage Duration: {getStorageDuration()}
                                </Text>
                            </View>
                        )}
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="card-outline" size={20} color={palette.primary} />
                            <Text style={{ color: palette.textSecondary, marginLeft: 12, flex: 1 }}>
                                Current Cost: {calculateCurrentCost().toLocaleString()} VND
                            </Text>
                        </View>
                    </Animated.View>
                )}

                {/* Storage Location */}
                {storageDetails && (
                    <Animated.View entering={FadeInUp.delay(400).springify()} style={{ backgroundColor: palette.surface, borderRadius: 20, padding: 20, marginHorizontal: 24, marginTop: 24, shadowColor: palette.shadow, shadowOpacity: 0.08, shadowRadius: 8 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 16 }}>
                            Storage Location
                        </Text>
                        
                        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                            <Image
                                source={{ uri: storageDetails.images[0] }}
                                style={{ width: 64, height: 64, borderRadius: 12 }}
                                resizeMode="cover"
                            />
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: palette.text }}>
                                    {storageDetails.title}
                                </Text>
                                <Text style={{ color: palette.textSecondary, fontSize: 14, marginTop: 4 }}>
                                    Managed by {storageDetails.keeperName}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <Ionicons name="star" size={14} color="#fbbf24" />
                                    <Text style={{ color: palette.textSecondary, fontSize: 14, marginLeft: 4 }}>
                                        {storageDetails.rating.toFixed(1)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'start', marginBottom: 16 }}>
                            <Ionicons name="location-outline" size={20} color={palette.primary} />
                            <Text style={{ color: palette.textSecondary, marginLeft: 12, flex: 1 }}>
                                {storageDetails.address}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={{ backgroundColor: palette.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                            onPress={() => {
                                Alert.alert('Contact Keeper', 'Feature coming soon! You can call or message the keeper directly.')
                            }}
                        >
                            <Ionicons name="call-outline" size={18} color="white" style={{ marginRight: 8 }} />
                            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Contact Keeper</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Action Buttons */}
                <Animated.View entering={FadeInUp.delay(500).springify()} style={{ marginHorizontal: 24, marginTop: 24, marginBottom: 32 }}>
                    {order?.status === 'IN_STORAGE' && (
                        <>
                            <CustomButton
                                title="Collect Items & Pay"
                                IconLeft={() => <Ionicons name="cube-outline" size={20} color="white" />}
                                onPress={handleCollectItems}
                                className="mb-4"
                            />
                            <CustomButton
                                title="Cancel Storage"
                                IconLeft={() => <Ionicons name="close-outline" size={20} color="#ef4444" />}
                                onPress={handleCancelStorage}
                                isLoading={updating}
                                bgVariant="outline"
                                textVariant="danger"
                                className="border-red-500"
                            />
                        </>
                    )}

                    {order?.status === 'CONFIRMED' && (
                        <CustomButton
                            title="Contact Keeper"
                            IconLeft={() => <Ionicons name="call-outline" size={20} color="white" />}
                            onPress={() => {
                                Alert.alert('Contact Keeper', 'Call the keeper to arrange drop-off time for your items.')
                            }}
                        />
                    )}

                    {order?.status === 'COMPLETED' && (
                        <CustomButton
                            title="Rate This Storage"
                            IconLeft={() => <Ionicons name="star-outline" size={20} color="white" />}
                            onPress={() => {
                                router.push(`/(root)/rate-storage/${storageDetails?.id}`)
                            }}
                        />
                    )}

                    {order?.status === 'PENDING' && (
                        <CustomButton
                            title="Cancel Reservation"
                            IconLeft={() => <Ionicons name="close-outline" size={20} color="#ef4444" />}
                            onPress={handleCancelStorage}
                            isLoading={updating}
                            bgVariant="outline"
                            textVariant="danger"
                            className="border-red-500"
                        />
                    )}
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default StorageStatus