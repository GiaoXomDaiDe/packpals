import { ConfirmationModal } from '@/components/ConfirmationModal'
import { ImageGallery } from '@/components/ImageGallery'
import { OrderCertificationModal } from '@/components/OrderCertificationModal'
import { icons } from '@/constants'
import {
    useOrder,
    useOrderDetails,
    useSetOrderStartTime,
    useStorage,
    useUpdateOrderStatus
} from '@/lib/query/hooks'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
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
            return 'Awaiting Confirmation'
        case 'CONFIRMED':
            return 'Ready for Drop-off'
        case 'IN_STORAGE':
            return 'Package in Storage'
        case 'COMPLETED':
            return 'Order Completed'
        case 'CANCELLED':
            return 'Order Cancelled'
        default:
            return 'Unknown Status'
    }
}
 
const KeeperOrderDetails = () => {
  const router = useRouter()
    const { id } = useLocalSearchParams<{ id: string }>()
    
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
    
    console.log('🏪 Keeper Order Details page loaded with ID:', id)
    
    // Get order details
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
        isLoading: detailsLoading
    } = useOrderDetails(id || '', {
        enabled: !!id
    })
    
    const order = (orderResponse)?.data
  const orderDetails = (orderDetailsResponse as any)?.data?.data || []
  console.log('📦 Order Details:', orderDetails)
    console.log('📦 Order:', order)
    
    // Get storage information
    const {
        data: storageResponse,
        isLoading: storageLoading
    } = useStorage(order?.storageId || '', {
        enabled: !!order?.storageId
    })
    
    const storage = (storageResponse as any)?.data
    
    // Mutations for order actions
    const updateOrderStatusMutation = useUpdateOrderStatus({
        onSuccess: (data) => {
            console.log('✅ Order status updated successfully')
            refetchOrder()
        },
        onError: (error) => {
            console.error('❌ Failed to update order status:', error)
            Alert.alert('Error', 'Failed to update order status. Please try again.')
        }
    })
    
    const setOrderStartTimeMutation = useSetOrderStartTime({
        onSuccess: (data) => {
            console.log('✅ Order start time set successfully')
            refetchOrder()
        },
        onError: (error) => {
            console.error('❌ Failed to set order start time:', error)
            Alert.alert('Error', 'Failed to set start time. Please try again.')
        }
    })
    
    const handleConfirmOrder = () => {
        setConfirmModal({
            visible: true,
            type: 'confirm',
            orderId: order.id,
            orderDescription: order.packageDescription
        })
    }
    
    const handleReceivePackage = () => {
        setCertificationModal({
            visible: true,
            orderId: order.id,
            orderDescription: order.packageDescription
        })
    }
    
    const handleModalConfirm = () => {
        if (confirmModal.type === 'confirm') {
            console.log('🔄 Confirming order:', confirmModal.orderId)
            updateOrderStatusMutation.mutate({
                orderId: confirmModal.orderId,
                status: 'CONFIRMED'
            })
        }
        setConfirmModal({ ...confirmModal, visible: false })
    }
    
    const handleCertificationConfirm = async (imageUrls: string[]) => {
        console.log('📸 Package certified with image URLs:', imageUrls)
        
        try {
            // Update status to IN_STORAGE with certification images
            updateOrderStatusMutation.mutate({
                orderId: certificationModal.orderId,
                status: 'IN_STORAGE',
                orderCertification: imageUrls
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
    
    // Format date helper
    const formatDate = (dateString: string) => {
        if (!dateString || dateString === "0001-01-01T00:00:00") {
            return 'No date'
        }
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch {
            return 'Invalid date'
        }
    }
    
    const loading = orderLoading || detailsLoading || storageLoading
    
    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="text-gray-600 mt-4 font-JakartaMedium">
                        Loading order details...
                    </Text>
                </View>
            </SafeAreaView>
        )
    }
    
    if (orderError || !order) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 items-center justify-center px-6">
                    <Ionicons name="warning-outline" size={80} color="#ef4444" />
                    <Text className="text-red-500 text-xl font-JakartaBold mt-4 text-center">
                        Order Not Found
                    </Text>
                    <Text className="text-gray-500 text-center mt-2 font-JakartaMedium">
                        The order you&apos;re looking for doesn&apos;t exist or has been removed
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
    
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-6 py-4 shadow-sm border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Image
                            source={icons.backArrow}
                            className="w-6 h-6"
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                    <Text className="text-xl font-JakartaBold text-gray-900">
                        Order Details
                    </Text>
                    <TouchableOpacity
                        onPress={() => refetchOrder()}
                        className="bg-blue-100 rounded-full p-2"
                    >
                        <Ionicons name="refresh" size={20} color="#2563eb" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {/* Order Status Card */}
                <View className="bg-white rounded-2xl p-6 m-6 shadow-sm border border-gray-100">
                    <View className="flex-row items-center justify-between mb-4">
                        <View>
                            <Text className="text-lg font-JakartaBold text-gray-900">
                                Order #{order.id?.slice(-8)}
                            </Text>
                            <Text className="text-sm text-gray-500 mt-1">
                                {formatDate(order.orderDate)}
                            </Text>
                        </View>
                        
                        <View 
                            className="px-4 py-2 rounded-full"
                            style={{ backgroundColor: `${getStatusColor(order.status)}20` }}
                        >
                            <Text 
                                className="text-sm font-JakartaBold"
                                style={{ color: getStatusColor(order.status) }}
                            >
                                {order.status}
                            </Text>
                        </View>
                    </View>
                    
                    <Text className="text-base text-gray-700 font-JakartaMedium mb-4">
                        {getStatusText(order.status)}
                    </Text>
                    
                    {/* Order Progress */}
                    <View className="flex-row items-center justify-between mt-4">
                        {['PENDING', 'CONFIRMED', 'IN_STORAGE', 'COMPLETED'].map((status, index, array) => (
                            <View key={status} className="flex-row items-center flex-1">
                                <View 
                                    className={`w-8 h-8 rounded-full items-center justify-center ${
                                        array.indexOf(order.status) >= index 
                                            ? 'bg-blue-500' 
                                            : 'bg-gray-200'
                                    }`}
                                >
                                    <Text className={`text-xs font-JakartaBold ${
                                        array.indexOf(order.status) >= index 
                                            ? 'text-white' 
                                            : 'text-gray-500'
                                    }`}>
                                        {index + 1}
                                    </Text>
                                </View>
                                {index < array.length - 1 && (
                                    <View className={`flex-1 h-1 mx-2 ${
                                        array.indexOf(order.status) > index 
                                            ? 'bg-blue-500' 
                                            : 'bg-gray-200'
                                    }`} />
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Customer Information */}
                <View className="bg-white rounded-2xl p-6 mx-6 mb-6 shadow-sm border border-gray-100">
                    <Text className="text-lg font-JakartaBold text-gray-900 mb-4">
                        Customer Information
                    </Text>
                    
                    <View className="flex-row items-center mb-3">
                        <View className="bg-blue-100 rounded-full p-2 mr-3">
                            <Ionicons name="person" size={20} color="#2563eb" />
                        </View>
                        <View>
                            <Text className="text-sm text-gray-500">Customer</Text>
                            <Text className="text-base font-JakartaBold text-gray-900">
                                {order.renterName || order.renterUsername || 'N/A Customer'}
                            </Text>
                        </View>
                    </View>
                    
                    <View className="flex-row items-center">
                        <View className="bg-green-100 rounded-full p-2 mr-3">
                            <Ionicons name="mail" size={20} color="#16a34a" />
                        </View>
                        <View>
                            <Text className="text-sm text-gray-500">Contact</Text>
                            <Text className="text-base font-JakartaBold text-gray-900">
                                {order.renterEmail || 'No email provided'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Package Information */}
                <View className="bg-white rounded-2xl p-6 mx-6 mb-6 shadow-sm border border-gray-100">
                    <Text className="text-lg font-JakartaBold text-gray-900 mb-4">
                        Package Details
                    </Text>
                    
                    <View className="bg-gray-50 rounded-xl p-4 mb-4">
                        <Text className="text-sm text-gray-500 mb-1">Description</Text>
                        <Text className="text-base text-gray-900 font-JakartaMedium">
                            {order.packageDescription || 'No description provided'}
                        </Text>
                    </View>
                    
                    <View className="flex-row justify-between">
                        <View className="flex-1 mr-2">
                            <Text className="text-sm text-gray-500 mb-1">Duration</Text>
                            <Text className="text-base font-JakartaBold text-gray-900">
                                {order.estimatedDays} day{order.estimatedDays !== 1 ? 's' : ''}
                            </Text>
                        </View>
                        
                        <View className="flex-1 ml-2">
                            <Text className="text-sm text-gray-500 mb-1">Amount</Text>
                            <Text className="text-base font-JakartaBold text-green-600">
                                {order.totalAmount?.toLocaleString() || '0'} VND
                            </Text>
                        </View>
                    </View>
                    
                    {order.startKeepTime && (
                        <View className="mt-4 pt-4 border-t border-gray-100">
                            <Text className="text-sm text-gray-500 mb-1">Started Storage</Text>
                            <Text className="text-base font-JakartaBold text-gray-900">
                                {formatDate(order.startKeepTime)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Storage Location */}
                {storage && (
                    <View className="bg-white rounded-2xl p-6 mx-6 mb-6 shadow-sm border border-gray-100">
                        <Text className="text-lg font-JakartaBold text-gray-900 mb-4">
                            Storage Location
                        </Text>
                        
                        <View className="flex-row items-start">
                            {storage.images?.[0] && (
                                <Image
                                    source={{ uri: storage.images[0] }}
                                    className="w-16 h-16 rounded-xl mr-4"
                                    resizeMode="cover"
                                />
                            )}
                            <View className="flex-1">
                                <Text className="text-base font-JakartaBold text-gray-900 mb-1">
                                    {storage.description || 'Storage Location'}
                                </Text>
                                <Text className="text-sm text-gray-600">
                                    {storage.address}
                                </Text>
                                {storage.pricePerDay && (
                                    <Text className="text-sm font-JakartaBold text-blue-600 mt-1">
                                        {storage.pricePerDay.toLocaleString()} VND/day
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                )}

                {/* Order Details */}
                {orderDetails.length > 0 && (
                    <View className="bg-white rounded-2xl p-6 mx-6 mb-6 shadow-sm border border-gray-100">
                        <Text className="text-lg font-JakartaBold text-gray-900 mb-4">
                            Order Items
                        </Text>
                        
                        {orderDetails.map((detail: any, index: number) => (
                            <View key={index} className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                                <View className="flex-1">
                                    <Text className="text-base font-JakartaMedium text-gray-900">
                                        {detail.itemName || `Item ${index + 1}`}
                                    </Text>
                                    {detail.description && (
                                        <Text className="text-sm text-gray-600 mt-1">
                                            {detail.description}
                                        </Text>
                                    )}
                                </View>
                                
                                <View className="items-end">
                                    <Text className="text-sm text-gray-500">Qty: {detail.quantity}</Text>
                                    <Text className="text-base font-JakartaBold text-gray-900">
                                        {detail.price?.toLocaleString()} VND
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Certification Images */}
                {order.orderCertification && order.orderCertification.length > 0 && (
                    <View className="bg-white rounded-2xl p-6 mx-6 mb-6 shadow-sm border border-gray-100">
                        <ImageGallery
                            images={order.orderCertification}
                            title="Package Certification"
                            layout="horizontal"
                            imageSize="large"
                            maxImagesVisible={4}
                            containerClassName=""
                            enableLazyLoading={true}
                            showLoadingIndicator={true}
                        />
                        <Text className="text-xs text-gray-500 mt-3 text-center">
                            Tap any image to view in full screen
                        </Text>
                    </View>
                )}

                {/* Action Buttons */}
                <View className="px-6 pb-8">
                    {order.status === 'PENDING' && (
                        <TouchableOpacity
                            onPress={handleConfirmOrder}
                            disabled={updateOrderStatusMutation.isPending}
                            className="bg-blue-600 rounded-2xl py-4 flex-row items-center justify-center mb-3"
                        >
                            {updateOrderStatusMutation.isPending ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="white" />
                                    <Text className="text-white font-JakartaBold ml-2 text-base">
                                        Confirm Order
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                    
                    {order.status === 'CONFIRMED' && (
                        <TouchableOpacity
                            onPress={handleReceivePackage}
                            disabled={updateOrderStatusMutation.isPending || setOrderStartTimeMutation.isPending}
                            className="bg-green-600 rounded-2xl py-4 flex-row items-center justify-center mb-3"
                        >
                            {(updateOrderStatusMutation.isPending || setOrderStartTimeMutation.isPending) ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Ionicons name="cube" size={20} color="white" />
                                    <Text className="text-white font-JakartaBold ml-2 text-base">
                                        Mark as Received
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* Confirmation Modal */}
            <ConfirmationModal
                visible={confirmModal.visible}
                title="Confirm Order"
                message={`Confirm this order?${confirmModal.orderDescription ? `\n\n${confirmModal.orderDescription}` : ''}`}
                confirmText="Confirm"
                confirmColor="#2563eb"
                icon="checkmark-circle"
                iconColor="#2563eb"
                isLoading={updateOrderStatusMutation.isPending}
                onConfirm={handleModalConfirm}
                onCancel={() => setConfirmModal({ ...confirmModal, visible: false })}
            />

            {/* Order Certification Modal */}
            <OrderCertificationModal
                visible={certificationModal.visible}
                orderDescription={certificationModal.orderDescription}
                isLoading={updateOrderStatusMutation.isPending || setOrderStartTimeMutation.isPending}
                onConfirm={handleCertificationConfirm}
                onClose={() => setCertificationModal({ ...certificationModal, visible: false })}
            />
        </SafeAreaView>
    )
}

export default KeeperOrderDetails
