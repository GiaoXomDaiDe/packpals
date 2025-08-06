import { ConfirmationModal } from '@/components/ConfirmationModal'
import { OrderCertificationModal } from '@/components/OrderCertificationModal'
import { icons } from '@/constants'
import {
  useSetOrderStartTime,
  useStorage,
  useStorageOrders,
  useUpdateOrderStatus
} from '@/hooks/query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

const StorageDetail = () => {
    const router = useRouter()
    const { id } = useLocalSearchParams<{ id: string }>()
    const [refreshing, setRefreshing] = useState(false)
    const [activeTab, setActiveTab] = useState<'PENDING' | 'IN_STORAGE'>('PENDING')
    
    // Modal states
    const [confirmModal, setConfirmModal] = useState({
        visible: false,
        type: '' as 'confirm' | 'receive',
        orderId: '',
        orderDescription: ''
    })
    
    const [certificationModal, setCertificationModal] = useState({
        visible: false,
        orderId: '',
        orderDescription: ''
    })
    
    console.log('🏪 Storage Detail page loaded with ID:', id)
    
    // Get storage details
    const {
        data: storageResponse,
        isLoading: storageLoading,
        error: storageError,
        refetch: refetchStorage
    } = useStorage(id || '', {
        enabled: !!id
    })
    
    // Get orders for this storage
    const {
        data: ordersResponse,
        isLoading: ordersLoading,
        error: ordersError,
        refetch: refetchOrders
    } = useStorageOrders(id || '', {}, {
        enabled: !!id
    })
    
    console.log('🏪 Storage response:', storageResponse)
    console.log('🏪 Storage ID:', id)
    console.log('🏪 Orders response:', ordersResponse)
    
    const storage = (storageResponse as any)?.data
    // Handle both direct array and nested data structure
    const ordersRawData = (ordersResponse as any)?.data
    const ordersData = ordersRawData?.data || ordersRawData || []
    const orders = Array.isArray(ordersData) ? ordersData : []
    const pendingOrders = orders.filter((order: any) => order.status === 'PENDING')
    const confirmedOrders = orders.filter((order: any) => order.status === 'CONFIRMED')
    const activeOrders = orders.filter((order: any) => ['IN_STORAGE'].includes(order.status))
    
    console.log('🏪 Storage data:', storage)
    console.log('📦 Orders response:', ordersResponse)
    console.log('📦 Orders data:', ordersData) 
    console.log('📦 Orders array:', orders)
    console.log('📦 Orders summary:', { total: orders.length, pending: pendingOrders.length, confirmed: confirmedOrders.length })
    
    // Mutations for order status updates
    const updateOrderStatusMutation = useUpdateOrderStatus({
        onSuccess: (data) => {
            console.log('✅ Order status updated successfully')
            console.log('📦 Update response:', data)
            refetchOrders()
        },
        onError: (error) => {
            console.error('❌ Failed to update order status:', error)
            Alert.alert('Error', 'Failed to update order status. Please try again.')
        }
    })
    
    const setOrderStartTimeMutation = useSetOrderStartTime({
        onSuccess: (data) => {
            console.log('✅ Order start time set successfully')
            console.log('⏰ Start time response:', data)
            refetchOrders()
        },
        onError: (error) => {
            console.error('❌ Failed to set order start time:', error)
            Alert.alert('Error', 'Failed to set start time. Please try again.')
        }
    })
    
    const handleRefresh = async () => {
        setRefreshing(true)
        await Promise.all([refetchStorage(), refetchOrders()])
        setRefreshing(false)
    }
    
    const handleConfirmOrder = (orderId: string, orderDescription: string) => {
        setConfirmModal({
            visible: true,
            type: 'confirm',
            orderId,
            orderDescription
        })
    }
    
    const handleReceivePackage = (orderId: string, orderDescription: string) => {
        // Open certification modal instead of direct confirmation
        setCertificationModal({
            visible: true,
            orderId,
            orderDescription
        })
    }

    const handleModalConfirm = () => {
        if (confirmModal.type === 'confirm') {
            console.log('🔄 Confirming order:', confirmModal.orderId)
            updateOrderStatusMutation.mutate({
                orderId: confirmModal.orderId,
                status: 'CONFIRMED'
            })
        } else if (confirmModal.type === 'receive') {
            console.log('📦 Package received for order:', confirmModal.orderId)
            // First update status to IN_STORAGE
            updateOrderStatusMutation.mutate({
                orderId: confirmModal.orderId,
                status: 'IN_STORAGE'
            })
            // Then set start time
            setOrderStartTimeMutation.mutate(confirmModal.orderId)
        }
        setConfirmModal({ ...confirmModal, visible: false })
    }

    const handleModalCancel = () => {
        setConfirmModal({ ...confirmModal, visible: false })
    }

    const handleCertificationConfirm = async (imageUrls: string[]) => {
        console.log('📸 Package certified with image URLs:', imageUrls)
        console.log('📦 Processing package receipt for order:', certificationModal.orderId)
        
        try {
            // Update status to IN_STORAGE with certification images
            updateOrderStatusMutation.mutate({
                orderId: certificationModal.orderId,
                status: 'IN_STORAGE',
                orderCertification: imageUrls // Pass uploaded image URLs
            })
            // Set start time
            setOrderStartTimeMutation.mutate(certificationModal.orderId)
            
            // Close modal
            setCertificationModal({ ...certificationModal, visible: false })
        } catch (error) {
            console.error('❌ Failed to process package certification:', error)
            Alert.alert('Error', 'Failed to process package certification. Please try again.')
        }
    }

    const handleCertificationCancel = () => {
        setCertificationModal({ ...certificationModal, visible: false })
    }

    const getFilteredOrders = () => {
        return orders.filter((order: any) => {
            if (activeTab === 'PENDING') {
                return order.status === 'PENDING' || order.status === 'CONFIRMED'
            } else {
                return order.status === 'IN_STORAGE'
            }
        })
    }

    if (storageLoading || ordersLoading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="text-gray-600 mt-4">Loading storage details...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (storageError || !storage) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 items-center justify-center px-6">
                    <Ionicons name="warning-outline" size={80} color="#ef4444" />
                    <Text className="text-red-500 text-xl font-JakartaBold mt-4 text-center">
                        {storageError ? 'Failed to Load Storage' : 'Storage Not Found'}
                    </Text>
                    <Text className="text-gray-500 text-center mt-2">
                        {storageError 
                            ? 'There was an error loading the storage details. Please try again.'
                            : 'The storage you\'re looking for doesn\'t exist or has been removed'
                        }
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
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

    const renderOrderItem = ({ item }: { item: any }) => {
        const formatDate = (dateString: string) => {
            if (!dateString || dateString === "0001-01-01T00:00:00") return 'No date';
            try {
                return new Date(dateString).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric'
                });
            } catch {
                return 'Invalid date';
            }
        }
        
        return (
            <View className="bg-white rounded-2xl p-5 mb-3 border border-gray-100">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-1">
                        <Text className="text-base font-JakartaBold text-gray-900 mb-1">
                            Order #{item.id?.slice(-8)}
                        </Text>
                        <Text className="text-sm text-gray-600" numberOfLines={1}>
                            {item.packageDescription || 'No description'}
                        </Text>
                    </View>
                    
                    <View 
                        className={`px-3 py-1.5 rounded-full ${
                            item.status === 'PENDING' ? 'bg-orange-100' :
                            item.status === 'CONFIRMED' ? 'bg-blue-100' :
                            item.status === 'IN_STORAGE' ? 'bg-purple-100' : 'bg-gray-100'
                        }`}
                    >
                        <Text 
                            className={`text-xs font-JakartaBold ${
                                item.status === 'PENDING' ? 'text-orange-700' :
                                item.status === 'CONFIRMED' ? 'text-blue-700' :
                                item.status === 'IN_STORAGE' ? 'text-purple-700' : 'text-gray-700'
                            }`}
                        >
                            {item.status}
                        </Text>
                    </View>
                </View>
                
                {/* Info Row */}
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center flex-1">
                        <Ionicons name="person-circle" size={20} color="#6b7280" />
                        <Text className="text-sm text-gray-600 ml-2 flex-1" numberOfLines={1}>
                            {item.renter?.username || item.renter?.name || 'Unknown'}
                        </Text>
                    </View>
                    
                    <View className="flex-row items-center">
                        <Ionicons name="calendar" size={16} color="#6b7280" />
                        <Text className="text-sm text-gray-600 ml-1">
                            {formatDate(item.orderDate || item.createdAt)}
                        </Text>
                    </View>
                </View>
                
                {/* Amount */}
                {item.totalAmount > 0 && (
                    <View className="bg-green-50 p-3 rounded-xl mb-4">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-sm text-green-700 font-JakartaMedium">Total Amount</Text>
                            <Text className="text-base font-JakartaBold text-green-700">
                                {item.totalAmount.toLocaleString()} VND
                            </Text>
                        </View>
                    </View>
                )}
                
                {/* Actions */}
                <View className="flex-row gap-2">
                    {item.status === 'PENDING' && (
                        <TouchableOpacity
                            onPress={() => handleConfirmOrder(item.id, item.packageDescription)}
                            disabled={updateOrderStatusMutation.isPending}
                            className="flex-1 bg-blue-600 rounded-xl py-3 flex-row items-center justify-center"
                        >
                            {updateOrderStatusMutation.isPending ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark" size={16} color="white" />
                                    <Text className="text-white font-JakartaBold ml-2 text-sm">Confirm</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                    
                    {item.status === 'CONFIRMED' && (
                        <TouchableOpacity
                            onPress={() => handleReceivePackage(item.id, item.packageDescription)}
                            disabled={updateOrderStatusMutation.isPending || setOrderStartTimeMutation.isPending}
                            className="flex-1 bg-green-600 rounded-xl py-3 flex-row items-center justify-center"
                        >
                            {(updateOrderStatusMutation.isPending || setOrderStartTimeMutation.isPending) ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Ionicons name="cube" size={16} color="white" />
                                    <Text className="text-white font-JakartaBold ml-2 text-sm">Receive</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                        onPress={() => router.replace({
                            pathname: "/(root)/keeper-orderdetails/[id]",
                            params: { id: item.id }
                        })}
                        className="bg-gray-100 rounded-xl py-3 px-4 flex-row items-center justify-center"
                    >
                        <Ionicons name="eye" size={16} color="#6b7280" />
                        <Text className="text-gray-700 font-JakartaBold ml-1 text-sm">View</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-6 py-4 shadow-sm">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Image
                            source={icons.backArrow}
                            className="w-6 h-6"
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                    <Text className="text-xl font-JakartaBold text-gray-900">
                        Storage Details
                    </Text>
                    <TouchableOpacity
                        onPress={handleRefresh}
                        className="bg-blue-100 rounded-full p-2"
                    >
                        <Ionicons name="refresh" size={24} color="#2563eb" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Storage Information Card */}
                <View className="bg-white rounded-2xl p-6 m-6 shadow-sm border border-gray-100">
                    <Text className="text-lg font-JakartaBold text-gray-900 mb-3">
                        {storage.description || 'Storage Location'}
                    </Text>
                    
                    <View className="flex-row items-start mb-4">
                        <Image
                            source={{ 
                                uri: storage.images?.[0] || 'https://via.placeholder.com/100x100?text=Storage'
                            }}
                            className="w-24 h-24 rounded-xl"
                            resizeMode="cover"
                        />
                        <View className="flex-1 ml-4">
                            <View className="flex-row items-center mb-2">
                                <Image
                                    source={icons.pin}
                                    className="w-4 h-4"
                                    resizeMode="contain"
                                />
                                <Text className="text-sm text-gray-600 ml-2 flex-1" numberOfLines={2}>
                                    {storage.address}
                                </Text>
                            </View>
                            
                            <View className="flex-row items-center justify-between">
                                <View 
                                    className={`px-3 py-1 rounded-full ${
                                        storage.status === 'AVAILABLE' 
                                            ? 'bg-green-100' 
                                            : storage.status === 'OCCUPIED'
                                            ? 'bg-blue-100' 
                                            : 'bg-red-100'
                                    }`}
                                >
                                    <Text 
                                        className={`text-xs font-JakartaBold ${
                                            storage.status === 'AVAILABLE' 
                                                ? 'text-green-700' 
                                                : storage.status === 'OCCUPIED'
                                                ? 'text-blue-700' 
                                                : 'text-red-700'
                                        }`}
                                    >
                                        {storage.status}
                                    </Text>
                                </View>
                                
                                {storage.pricePerDay && (
                                    <View className="flex-row items-center">
                                        <Image
                                            source={icons.dollar}
                                            className="w-4 h-4"
                                            resizeMode="contain"
                                        />
                                        <Text className="text-md font-JakartaBold text-primary-500 ml-1">
                                            {storage.pricePerDay.toLocaleString()} VND/day
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                    
                    {/* Statistics */}
                    <View className="flex-row justify-around pt-4 border-t border-gray-100">
                        <View className="items-center">
                            <Text className="text-xl font-JakartaBold text-orange-600">
                                {pendingOrders.length}
                            </Text>
                            <Text className="text-xs text-gray-600">Pending</Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-xl font-JakartaBold text-blue-600">
                                {confirmedOrders.length}
                            </Text>
                            <Text className="text-xs text-gray-600">Confirmed</Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-xl font-JakartaBold text-purple-600">
                                {activeOrders.length}
                            </Text>
                            <Text className="text-xs text-gray-600">In Storage</Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-xl font-JakartaBold text-gray-600">
                                {orders.length}
                            </Text>
                            <Text className="text-xs text-gray-600">Total</Text>
                        </View>
                    </View>
                </View>

                {/* Tab Navigation */}
                <View className="flex-row bg-white rounded-lg p-1 mx-6 mb-5">
                    <TouchableOpacity
                        onPress={() => setActiveTab('PENDING')}
                        className={`flex-1 py-3 rounded-lg ${
                            activeTab === 'PENDING' ? 'bg-primary-500' : 'bg-transparent'
                        }`}
                    >
                        <Text className={`text-center font-JakartaSemiBold ${
                            activeTab === 'PENDING' ? 'text-white' : 'text-gray-600'
                        }`}>
                            Pending ({orders.filter((o: any) => o.status === 'PENDING' || o.status === 'CONFIRMED').length})
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        onPress={() => setActiveTab('IN_STORAGE')}
                        className={`flex-1 py-3 rounded-lg ${
                            activeTab === 'IN_STORAGE' ? 'bg-primary-500' : 'bg-transparent'
                        }`}
                    >
                        <Text className={`text-center font-JakartaSemiBold ${
                            activeTab === 'IN_STORAGE' ? 'text-white' : 'text-gray-600'
                        }`}>
                            In Storage ({orders.filter((o: any) => o.status === 'IN_STORAGE').length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Orders List */}
                <View className="mx-6 mb-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-lg font-JakartaBold text-gray-900">
                            Orders ({getFilteredOrders().length})
                        </Text>
                        {ordersError && (
                            <View className="bg-red-100 px-2 py-1 rounded-lg">
                                <Text className="text-red-600 text-xs font-JakartaMedium">
                                    Failed to load orders
                                </Text>
                            </View>
                        )}
                    </View>
                    
                    {ordersLoading ? (
                        <View className="bg-white rounded-2xl p-6 items-center">
                            <ActivityIndicator size="large" color="#3b82f6" />
                            <Text className="text-gray-600 mt-2">Loading orders...</Text>
                        </View>
                    ) : getFilteredOrders().length === 0 ? (
                        <View className="bg-white rounded-2xl p-6 items-center">
                            <Ionicons name="cube-outline" size={60} color="#d1d5db" />
                            <Text className="text-gray-500 text-lg font-JakartaBold mt-4">
                                {activeTab === 'PENDING' ? 'No Pending Orders' : 'No Packages in Storage'}
                            </Text>
                            <Text className="text-gray-400 text-center mt-2">
                                {activeTab === 'PENDING' 
                                    ? 'No pending orders for this storage location'
                                    : 'No packages currently in storage'
                                }
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={getFilteredOrders().sort((a: any, b: any) => {
                                // Sort by status priority: PENDING > CONFIRMED > IN_STORAGE > others
                                const statusPriority: { [key: string]: number } = {
                                    'PENDING': 1,
                                    'CONFIRMED': 2,
                                    'IN_STORAGE': 3,
                                    'COMPLETED': 4,
                                    'CANCELLED': 5
                                }
                                return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99)
                            })}
                            renderItem={renderOrderItem}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </ScrollView>

            {/* Custom Confirmation Modal */}
            <ConfirmationModal
                visible={confirmModal.visible}
                title={
                    confirmModal.type === 'confirm' 
                        ? 'Confirm Order' 
                        : 'Package Received'
                }
                message={
                    confirmModal.type === 'confirm' 
                        ? `Confirm this order?${confirmModal.orderDescription ? `\n\n${confirmModal.orderDescription}` : ''}` 
                        : `Mark package as received?${confirmModal.orderDescription ? `\n\n${confirmModal.orderDescription}` : ''}`
                }
                confirmText={
                    confirmModal.type === 'confirm' 
                        ? 'Confirm' 
                        : 'Received'
                }
                confirmColor={
                    confirmModal.type === 'confirm' 
                        ? '#2563eb' 
                        : '#16a34a'
                }
                icon={
                    confirmModal.type === 'confirm' 
                        ? 'checkmark-circle' 
                        : 'cube'
                }
                iconColor={
                    confirmModal.type === 'confirm' 
                        ? '#2563eb' 
                        : '#16a34a'
                }
                isLoading={updateOrderStatusMutation.isPending || setOrderStartTimeMutation.isPending}
                onConfirm={handleModalConfirm}
                onCancel={handleModalCancel}
            />

            {/* Order Certification Modal */}
            <OrderCertificationModal
                visible={certificationModal.visible}
                orderDescription={certificationModal.orderDescription}
                isLoading={updateOrderStatusMutation.isPending || setOrderStartTimeMutation.isPending}
                onConfirm={handleCertificationConfirm}
                onClose={handleCertificationCancel}
            />
        </SafeAreaView>
    )
}

export default StorageDetail