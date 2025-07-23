import { useState, useEffect } from 'react'
import { useUserStore } from '@/store'
import { 
    View, 
    Text, 
    FlatList, 
    ActivityIndicator, 
    TouchableOpacity,
    Image,
    Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'

import OrderCard from '@/components/OrderCard'
import { icons, images } from '@/constants'
import { orderAPI } from '@/lib/storageAPI'
import { Order } from '@/types/type'

const OrderManagement = () => {
    const { user } = useUserStore()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'IN_STORAGE' | 'COMPLETED'>('ALL')

    useEffect(() => {
        fetchAllOrders()
    }, [])

    const fetchAllOrders = async () => {
        setLoading(true)
        try {
            // In a real app, you'd have an endpoint to get all orders for a keeper
            // For now, we'll simulate this - you'd need to create this endpoint
            const response = await orderAPI.getOrdersByKeeperId(user?.id || '')
            setOrders(response.data)
        } catch (error) {
            console.error('Error fetching orders:', error)
            Alert.alert('Error', 'Failed to load orders')
        } finally {
            setLoading(false)
        }
    }

    const handleConfirmOrder = async (orderId: string) => {
        try {
            await orderAPI.updateOrderStatus(orderId, 'CONFIRMED')
            Alert.alert('Success', 'Order confirmed successfully!')
            fetchAllOrders() // Refresh the list
        } catch (error) {
            console.error('Error confirming order:', error)
            Alert.alert('Error', 'Failed to confirm order')
        }
    }

    const handleStartKeeping = async (orderId: string) => {
        try {
            await orderAPI.startKeepTime(orderId)
            await orderAPI.updateOrderStatus(orderId, 'IN_STORAGE')
            Alert.alert('Success', 'Storage time started!')
            fetchAllOrders() // Refresh the list
        } catch (error) {
            console.error('Error starting keep time:', error)
            Alert.alert('Error', 'Failed to start storage time')
        }
    }

    const handleCompleteOrder = async (orderId: string) => {
        Alert.alert(
            'Complete Order',
            'Are you sure the customer has picked up their package?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Complete',
                    onPress: async () => {
                        try {
                            await orderAPI.updateOrderStatus(orderId, 'COMPLETED')
                            Alert.alert('Success', 'Order completed successfully!')
                            fetchAllOrders() // Refresh the list
                        } catch (error) {
                            console.error('Error completing order:', error)
                            Alert.alert('Error', 'Failed to complete order')
                        }
                    }
                }
            ]
        )
    }

    const getFilteredOrders = () => {
        if (activeTab === 'ALL') return orders
        return orders.filter(order => {
            switch (activeTab) {
                case 'PENDING':
                    return order.status === 'PENDING' || order.status === 'CONFIRMED'
                case 'IN_STORAGE':
                    return order.status === 'IN_STORAGE'
                case 'COMPLETED':
                    return order.status === 'COMPLETED'
                default:
                    return true
            }
        })
    }

    const getOrderCount = (status: string) => {
        switch (status) {
            case 'PENDING':
                return orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length
            case 'IN_STORAGE':
                return orders.filter(o => o.status === 'IN_STORAGE').length
            case 'COMPLETED':
                return orders.filter(o => o.status === 'COMPLETED').length
            default:
                return orders.length
        }
    }

    const renderOrderItem = ({ item }: { item: Order }) => (
        <OrderCard
            order={item}
            showActions={true}
            onConfirm={() => handleConfirmOrder(item.id)}
            onStartKeeping={() => handleStartKeeping(item.id)}
            onComplete={() => handleCompleteOrder(item.id)}
        />
    )

    const TabButton = ({ 
        title, 
        tabKey, 
        count 
    }: { 
        title: string
        tabKey: typeof activeTab
        count: number 
    }) => (
        <TouchableOpacity
            onPress={() => setActiveTab(tabKey)}
            className={`px-4 py-2 rounded-lg mr-2 ${
                activeTab === tabKey ? 'bg-primary-500' : 'bg-white border border-general-700'
            }`}
        >
            <Text className={`text-sm font-JakartaSemiBold ${
                activeTab === tabKey ? 'text-white' : 'text-general-200'
            }`}>
                {title} ({count})
            </Text>
        </TouchableOpacity>
    )

    return (
        <SafeAreaView className="bg-general-500 flex-1">
            <View className="px-5 py-3">
                <View className="flex flex-row items-center justify-between mb-5">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Image
                            source={icons.backArrow}
                            className="w-6 h-6"
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                    <Text className="text-xl font-JakartaExtraBold">
                        Order Management
                    </Text>
                    <TouchableOpacity onPress={fetchAllOrders}>
                        <Text className="text-lg text-primary-500">🔄</Text>
                    </TouchableOpacity>
                </View>

                {/* Order Statistics */}
                <View className="bg-white rounded-lg p-4 mb-5">
                    <Text className="text-lg font-JakartaSemiBold mb-3">
                        Order Statistics
                    </Text>
                    <View className="flex flex-row justify-between">
                        <View className="flex flex-col items-center">
                            <Text className="text-2xl font-JakartaBold text-primary-500">
                                {getOrderCount('ALL')}
                            </Text>
                            <Text className="text-sm font-JakartaRegular text-general-200">
                                Total Orders
                            </Text>
                        </View>
                        <View className="flex flex-col items-center">
                            <Text className="text-2xl font-JakartaBold text-yellow-500">
                                {getOrderCount('PENDING')}
                            </Text>
                            <Text className="text-sm font-JakartaRegular text-general-200">
                                Pending
                            </Text>
                        </View>
                        <View className="flex flex-col items-center">
                            <Text className="text-2xl font-JakartaBold text-green-500">
                                {getOrderCount('IN_STORAGE')}
                            </Text>
                            <Text className="text-sm font-JakartaRegular text-general-200">
                                In Storage
                            </Text>
                        </View>
                        <View className="flex flex-col items-center">
                            <Text className="text-2xl font-JakartaBold text-blue-500">
                                {getOrderCount('COMPLETED')}
                            </Text>
                            <Text className="text-sm font-JakartaRegular text-general-200">
                                Completed
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Filter Tabs */}
                <View className="flex flex-row mb-5">
                    <TabButton title="All" tabKey="ALL" count={getOrderCount('ALL')} />
                    <TabButton title="Pending" tabKey="PENDING" count={getOrderCount('PENDING')} />
                    <TabButton title="In Storage" tabKey="IN_STORAGE" count={getOrderCount('IN_STORAGE')} />
                    <TabButton title="Completed" tabKey="COMPLETED" count={getOrderCount('COMPLETED')} />
                </View>

                {/* Orders List */}
                <FlatList
                    data={getFilteredOrders()}
                    renderItem={renderOrderItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListEmptyComponent={() => (
                        <View className="flex flex-col items-center justify-center py-20">
                            {loading ? (
                                <ActivityIndicator size="large" color="#0286FF" />
                            ) : (
                                <>
                                    <Image
                                        source={images.noResult}
                                        className="w-40 h-40"
                                        alt="No orders"
                                        resizeMode="contain"
                                    />
                                    <Text className="text-center text-lg font-JakartaSemiBold mb-2">
                                        No Orders Found
                                    </Text>
                                    <Text className="text-center text-sm font-JakartaRegular text-general-200">
                                        {activeTab === 'ALL' 
                                            ? 'No orders yet. Start by adding storage locations!'
                                            : `No ${activeTab.toLowerCase()} orders found`
                                        }
                                    </Text>
                                </>
                            )}
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    )
}

export default OrderManagement