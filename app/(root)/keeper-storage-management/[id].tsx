import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

import CustomButton from '@/components/CustomButton'
import {
    useMarkOrderAsPaid,
    useSetOrderStartTime,
    useStorage,
    useStorageOrders,
    useUpdateOrderStatus
} from '@/lib/query/hooks'
import { Order } from '@/lib/types'
import { useUserStore } from '@/store'


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
    danger: '#dc2626',
    dangerSoft: '#fee2e2',
    text: '#1e293b',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    border: '#e2e8f0',
    shadow: 'rgba(15, 23, 42, 0.08)'
}

interface StorageDetails {
    id: string
    description: string
    address: string
    status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
    keeperId: string
    totalSpaces: number
    availableSpaces: number
    images: string[]
    pricePerDay: number
    keeper: {
        user: {
            username: string
            phoneNumber: string
        }
    }
}

const KeeperStorageManagement = () => {
    const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>()
    const { user } = useUserStore()
    
    const [activeTab, setActiveTab] = useState<'pending' | 'in-storage'>(tab === 'pending' ? 'pending' : 'pending')

    // Use TanStack Query for data fetching
    const {
        data: storageResponse,
        isLoading: storageLoading,
        error: storageError
    } = useStorage(id || '', {
        enabled: !!id,
    })

    const {
        data: ordersResponse,
        isLoading: ordersLoading,
        isRefetching,
        refetch,
        error: ordersError
    } = useStorageOrders(id || '', undefined, {
        enabled: !!id,
    })

    // Mutations for order management
    const updateOrderStatusMutation = useUpdateOrderStatus({
        onSuccess: () => {
            Alert.alert('Success', 'Order status updated successfully')
        },
        onError: (error) => {
            Alert.alert('Error', `Failed to update order status: ${error.message}`)
        }
    })

    const markOrderAsPaidMutation = useMarkOrderAsPaid({
        onSuccess: () => {
            Alert.alert('Success', 'Order marked as paid successfully')
        },
        onError: (error) => {
            Alert.alert('Error', `Failed to mark order as paid: ${error.message}`)
        }
    })

    const setOrderStartTimeMutation = useSetOrderStartTime({
        onSuccess: () => {
            Alert.alert('Success', 'Storage timer started successfully')
        },
        onError: (error) => {
            Alert.alert('Error', `Failed to start storage timer: ${error.message}`)
        }
    })

    // Extract data
    const storage = storageResponse?.data
    const orders = ordersResponse?.data || []
    
    // Separate orders by status
    const pendingOrders = orders.filter((order: Order) => 
        order.status === 'PENDING' || order.status === 'CONFIRMED'
    )
    const inStorageOrders = orders.filter((order: Order) => 
        order.status === 'IN_STORAGE'
    )

    const isLoading = storageLoading || ordersLoading
    const error = storageError || ordersError

    const onRefresh = () => {
        refetch()
    }

    const handleConfirmOrder = async (order: Order) => {
        Alert.alert(
            'Confirm Order',
            `Confirm order from ${order.renter?.username}?\n\nPackage: ${order.packageDescription}\nAmount: ${order.totalAmount?.toLocaleString()} VND`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Confirm', onPress: () => {
                    updateOrderStatusMutation.mutate({
                        orderId: order.id,
                        status: 'CONFIRMED',
                        storageId: id
                    })
                }}
            ]
        )
    }

    const handleReceivePackage = async (order: Order) => {
        Alert.alert(
            'Package Received',
            `Mark package from ${order.renter?.username} as received?\n\nThis will start the storage timer and move the order to In-Storage.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Received', onPress: () => {
                    // First update status to IN_STORAGE
                    updateOrderStatusMutation.mutate({
                        orderId: order.id,
                        status: 'IN_STORAGE',
                        storageId: id
                    })
                    // Then set start time
                    setOrderStartTimeMutation.mutate({
                        orderId: order.id,
                        storageId: id
                    })
                }}
            ]
        )
    }

    const handlePackageReturn = async (order: Order) => {
        Alert.alert(
            'Package Return',
            `${order.renter?.username} is collecting their package?\n\nMake sure they have completed payment before marking as complete.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Payment Pending', onPress: () => {
                    Alert.alert(
                        'Payment Status',
                        'Has the customer completed payment?',
                        [
                            { text: 'Not Yet', style: 'cancel' },
                            { text: 'Payment Done', onPress: () => {
                                // Mark as paid and complete
                                markOrderAsPaidMutation.mutate({
                                    orderId: order.id,
                                    storageId: id
                                })
                                updateOrderStatusMutation.mutate({
                                    orderId: order.id,
                                    status: 'COMPLETED',
                                    storageId: id
                                })
                            }}
                        ]
                    )
                }},
                { text: 'Already Paid', onPress: () => {
                    updateOrderStatusMutation.mutate({
                        orderId: order.id,
                        status: 'COMPLETED',
                        storageId: id
                    })
                }}
            ]
        )
    }

    const getStorageDuration = (startTime?: string) => {
        if (!startTime) return 'Not started'
        
        const start = new Date(startTime)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays === 0) return 'Started today'
        if (diffDays === 1) return '1 day'
        return `${diffDays} days`
    }

    const renderOrderCard = (order: Order, type: 'pending' | 'in-storage') => {
        return (
            <Animated.View 
                key={order.id}
                entering={FadeInUp.delay(100).springify()}
                style={{ 
                    backgroundColor: palette.surface, 
                    borderRadius: 16, 
                    padding: 16, 
                    marginBottom: 16,
                    shadowColor: palette.shadow,
                    shadowOpacity: 0.08,
                    shadowRadius: 8
                }}
            >
                {/* Order Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: palette.text }}>
                            {order.renter?.username}
                        </Text>
                        <Text style={{ fontSize: 12, color: palette.textSecondary }}>
                            Order #{order.id.slice(-8)}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: palette.primary }}>
                            {order.totalAmount?.toLocaleString()} VND
                        </Text>
                        <Text style={{ fontSize: 12, color: palette.textSecondary }}>
                            {new Date(order.orderDate).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* Package Description */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Ionicons name="cube-outline" size={16} color={palette.textSecondary} />
                    <Text style={{ color: palette.textSecondary, fontSize: 14, marginLeft: 8, flex: 1 }}>
                        {order.packageDescription}
                    </Text>
                </View>

                {/* Contact Info */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Ionicons name="call-outline" size={16} color={palette.textSecondary} />
                    <Text style={{ color: palette.textSecondary, fontSize: 14, marginLeft: 8 }}>
                        {order.renter?.phoneNumber}
                    </Text>
                </View>

                {/* Storage Duration (for in-storage orders) */}
                {type === 'in-storage' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Ionicons name="time-outline" size={16} color={palette.textSecondary} />
                        <Text style={{ color: palette.textSecondary, fontSize: 14, marginLeft: 8 }}>
                            Stored for: {getStorageDuration(order.startKeepTime)}
                        </Text>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                    {type === 'pending' && (
                        <>
                            {order.status === 'PENDING' && (
                                <>
                                    <TouchableOpacity
                                        onPress={() => handleConfirmOrder(order)}
                                        disabled={updating === order.id}
                                        style={{ 
                                            backgroundColor: palette.primary,
                                            borderRadius: 8,
                                            paddingHorizontal: 16,
                                            paddingVertical: 8,
                                            flex: 1,
                                            marginRight: 8,
                                            opacity: updating === order.id ? 0.6 : 1
                                        }}
                                    >
                                        {updating === order.id ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
                                                Confirm Order
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => router.push(`/(root)/orderdetails/${order.id}`)}
                                        style={{ 
                                            backgroundColor: palette.surfaceVariant,
                                            borderRadius: 8,
                                            paddingHorizontal: 16,
                                            paddingVertical: 8,
                                            flex: 1,
                                            marginLeft: 8
                                        }}
                                    >
                                        <Text style={{ color: palette.text, fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
                                            View Details
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            {order.status === 'CONFIRMED' && (
                                <TouchableOpacity
                                    onPress={() => handleReceivePackage(order)}
                                    disabled={updating === order.id}
                                    style={{ 
                                        backgroundColor: palette.success,
                                        borderRadius: 8,
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        flex: 1,
                                        opacity: updating === order.id ? 0.6 : 1
                                    }}
                                >
                                    {updating === order.id ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
                                            Package Received
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </>
                    )}

                    {type === 'in-storage' && (
                        <>
                            <TouchableOpacity
                                onPress={() => handlePackageReturn(order)}
                                disabled={updating === order.id}
                                style={{ 
                                    backgroundColor: palette.warning,
                                    borderRadius: 8,
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    flex: 1,
                                    marginRight: 8,
                                    opacity: updating === order.id ? 0.6 : 1
                                }}
                            >
                                {updating === order.id ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
                                        Package Return
                                    </Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => router.push(`/(root)/orderdetails/${order.id}`)}
                                style={{ 
                                    backgroundColor: palette.surfaceVariant,
                                    borderRadius: 8,
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    flex: 1,
                                    marginLeft: 8
                                }}
                            >
                                <Text style={{ color: palette.text, fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
                                    View Details
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </Animated.View>
        )
    }

    if (isLoading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={palette.primary} />
                    <Text style={{ color: palette.textSecondary, marginTop: 16, fontSize: 16 }}>
                        Loading storage management...
                    </Text>
                </View>
            </SafeAreaView>
        )
    }

    if (error) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
                    <Ionicons name="warning-outline" size={60} color={palette.danger} />
                    <Text style={{ color: palette.text, fontSize: 18, fontWeight: '600', marginTop: 16, textAlign: 'center' }}>
                        Failed to load storage data
                    </Text>
                    <Text style={{ color: palette.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                        {error.message || 'Something went wrong while fetching storage information.'}
                    </Text>
                    <CustomButton
                        title="Try Again"
                        onPress={() => refetch()}
                        className="mt-6"
                        IconLeft={() => <Ionicons name="refresh-outline" size={20} color="white" />}
                    />
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
            {/* Header */}
            <Animated.View 
                entering={FadeInDown.delay(100).springify()}
                style={{ 
                    backgroundColor: palette.surface, 
                    paddingHorizontal: 24, 
                    paddingVertical: 16, 
                    shadowColor: palette.shadow, 
                    shadowOpacity: 0.08, 
                    shadowRadius: 8 
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ backgroundColor: palette.surfaceVariant, borderRadius: 20, padding: 8 }}
                    >
                        <Ionicons name="chevron-back" size={24} color={palette.text} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: palette.text, flex: 1, textAlign: 'center' }}>
                        Storage Management
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.push(`/(root)/storage-detail/${id}`)}
                        style={{ backgroundColor: palette.surfaceVariant, borderRadius: 20, padding: 8 }}
                    >
                        <Ionicons name="settings-outline" size={24} color={palette.text} />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 32 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[palette.primary]}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Storage Info */}
                {storage && (
                    <Animated.View entering={FadeInUp.delay(200).springify()} style={{ marginHorizontal: 24, marginTop: 24 }}>
                        <View style={{ backgroundColor: palette.surface, borderRadius: 20, padding: 20, shadowColor: palette.shadow, shadowOpacity: 0.08, shadowRadius: 8 }}>
                            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                                <Image
                                    source={{ uri: storage.images[0] }}
                                    style={{ width: 60, height: 60, borderRadius: 12 }}
                                    resizeMode="cover"
                                />
                                <View style={{ flex: 1, marginLeft: 16 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: palette.text }}>
                                        {storage.description}
                                    </Text>
                                    <Text style={{ color: palette.textSecondary, fontSize: 14, marginTop: 4 }}>
                                        {storage.address}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={{ color: palette.primary, fontSize: 18, fontWeight: '700' }}>
                                        {storage.availableSpaces}/{storage.totalSpaces}
                                    </Text>
                                    <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
                                        Available
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={{ color: palette.warning, fontSize: 18, fontWeight: '700' }}>
                                        {pendingOrders.length}
                                    </Text>
                                    <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
                                        Pending
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={{ color: palette.success, fontSize: 18, fontWeight: '700' }}>
                                        {inStorageOrders.length}
                                    </Text>
                                    <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
                                        In Storage
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                )}

                {/* Tab Navigation */}
                <Animated.View entering={FadeInUp.delay(300).springify()} style={{ marginHorizontal: 24, marginTop: 24 }}>
                    <View style={{ flexDirection: 'row', backgroundColor: palette.surfaceVariant, borderRadius: 12, padding: 4 }}>
                        <TouchableOpacity
                            onPress={() => setActiveTab('pending')}
                            style={{
                                flex: 1,
                                backgroundColor: activeTab === 'pending' ? palette.surface : 'transparent',
                                borderRadius: 8,
                                paddingVertical: 12,
                                alignItems: 'center'
                            }}
                        >
                            <Text style={{
                                color: activeTab === 'pending' ? palette.text : palette.textSecondary,
                                fontSize: 14,
                                fontWeight: '600'
                            }}>
                                Pending ({pendingOrders.length})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('in-storage')}
                            style={{
                                flex: 1,
                                backgroundColor: activeTab === 'in-storage' ? palette.surface : 'transparent',
                                borderRadius: 8,
                                paddingVertical: 12,
                                alignItems: 'center'
                            }}
                        >
                            <Text style={{
                                color: activeTab === 'in-storage' ? palette.text : palette.textSecondary,
                                fontSize: 14,
                                fontWeight: '600'
                            }}>
                                In Storage ({inStorageOrders.length})
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Orders List */}
                <View style={{ marginHorizontal: 24, marginTop: 24 }}>
                    {activeTab === 'pending' && (
                        <>
                            {pendingOrders.length === 0 ? (
                                <Animated.View entering={FadeInUp.delay(400).springify()} style={{ alignItems: 'center', paddingVertical: 40 }}>
                                    <Ionicons name="time-outline" size={60} color={palette.textTertiary} />
                                    <Text style={{ color: palette.textSecondary, fontSize: 16, fontWeight: '600', marginTop: 16 }}>
                                        No Pending Orders
                                    </Text>
                                    <Text style={{ color: palette.textTertiary, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                                        New orders will appear here for your confirmation
                                    </Text>
                                </Animated.View>
                            ) : (
                                pendingOrders.map((order) => renderOrderCard(order, 'pending'))
                            )}
                        </>
                    )}

                    {activeTab === 'in-storage' && (
                        <>
                            {inStorageOrders.length === 0 ? (
                                <Animated.View entering={FadeInUp.delay(400).springify()} style={{ alignItems: 'center', paddingVertical: 40 }}>
                                    <Ionicons name="cube-outline" size={60} color={palette.textTertiary} />
                                    <Text style={{ color: palette.textSecondary, fontSize: 16, fontWeight: '600', marginTop: 16 }}>
                                        No Items in Storage
                                    </Text>
                                    <Text style={{ color: palette.textTertiary, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                                        Items being stored will appear here
                                    </Text>
                                </Animated.View>
                            ) : (
                                inStorageOrders.map((order) => renderOrderCard(order, 'in-storage'))
                            )}
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default KeeperStorageManagement