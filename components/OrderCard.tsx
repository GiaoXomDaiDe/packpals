import { Image, Text, TouchableOpacity, View } from 'react-native'
import { icons } from '@/constants'
import { Order } from '@/types/type'

interface OrderCardProps {
    order: Order
    onPress?: () => void
    showActions?: boolean
    onConfirm?: () => void
    onStartKeeping?: () => void
    onComplete?: () => void
}

const OrderCard = ({ 
    order, 
    onPress, 
    showActions = false,
    onConfirm,
    onStartKeeping,
    onComplete 
}: OrderCardProps) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-600'
            case 'CONFIRMED': return 'bg-blue-100 text-blue-600'
            case 'IN_STORAGE': return 'bg-green-100 text-green-600'
            case 'COMPLETED': return 'bg-gray-100 text-gray-600'
            case 'CANCELLED': return 'bg-red-100 text-red-600'
            default: return 'bg-gray-100 text-gray-600'
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-general-700"
        >
            <View className="flex flex-row justify-between items-start mb-3">
                <View className="flex-1">
                    <Text className="text-lg font-JakartaBold text-primary-500">
                        Order #{order.id.slice(-8)}
                    </Text>
                    <Text className="text-sm font-JakartaRegular text-general-200">
                        {formatDate(order.orderDate)}
                    </Text>
                </View>
                
                <View className={`px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                    <Text className={`text-xs font-JakartaSemiBold ${getStatusColor(order.status).split(' ')[1]}`}>
                        {order.status}
                    </Text>
                </View>
            </View>

            <View className="flex flex-row items-start mb-3">
                <Image
                    source={icons.point}
                    className="w-5 h-5 mt-1"
                    resizeMode="contain"
                />
                <View className="flex-1 ml-3">
                    <Text className="text-sm font-JakartaSemiBold text-general-800">
                        Storage Location
                    </Text>
                    <Text className="text-sm font-JakartaRegular text-general-200">
                        {order.storage?.address || 'N/A'}
                    </Text>
                </View>
            </View>

            <View className="flex flex-row items-start mb-3">
                <Image
                    source={icons.pin}
                    className="w-5 h-5 mt-1"
                    resizeMode="contain"
                />
                <View className="flex-1 ml-3">
                    <Text className="text-sm font-JakartaSemiBold text-general-800">
                        Package Description
                    </Text>
                    <Text className="text-sm font-JakartaRegular text-general-200">
                        {order.packageDescription}
                    </Text>
                </View>
            </View>

            <View className="flex flex-row justify-between items-center mb-3">
                <View className="flex flex-row items-center">
                    <Image
                        source={icons.dollar}
                        className="w-4 h-4"
                        resizeMode="contain"
                    />
                    <Text className="text-lg font-JakartaBold text-primary-500 ml-1">
                        ${order.totalAmount}
                    </Text>
                </View>
                
                <View className="flex flex-row items-center">
                    <View className={`
                        w-2 h-2 rounded-full mr-2
                        ${order.isPaid ? 'bg-green-500' : 'bg-red-500'}
                    `} />
                    <Text className={`
                        text-sm font-JakartaSemiBold
                        ${order.isPaid ? 'text-green-600' : 'text-red-600'}
                    `}>
                        {order.isPaid ? 'Paid' : 'Unpaid'}
                    </Text>
                </View>
            </View>

            {order.startKeepTime && (
                <View className="flex flex-row items-center mb-3">
                    <Image
                        source={icons.checkmark}
                        className="w-4 h-4"
                        resizeMode="contain"
                    />
                    <Text className="text-sm font-JakartaRegular text-general-200 ml-2">
                        Storage started: {formatDate(order.startKeepTime)}
                    </Text>
                </View>
            )}

            {showActions && (
                <View className="flex flex-row space-x-2 mt-3">
                    {order.status === 'PENDING' && onConfirm && (
                        <TouchableOpacity
                            onPress={onConfirm}
                            className="flex-1 bg-blue-500 py-2 px-4 rounded-lg"
                        >
                            <Text className="text-white text-center font-JakartaSemiBold">
                                Confirm Order
                            </Text>
                        </TouchableOpacity>
                    )}
                    
                    {order.status === 'CONFIRMED' && onStartKeeping && (
                        <TouchableOpacity
                            onPress={onStartKeeping}
                            className="flex-1 bg-green-500 py-2 px-4 rounded-lg"
                        >
                            <Text className="text-white text-center font-JakartaSemiBold">
                                Start Keeping
                            </Text>
                        </TouchableOpacity>
                    )}
                    
                    {order.status === 'IN_STORAGE' && onComplete && (
                        <TouchableOpacity
                            onPress={onComplete}
                            className="flex-1 bg-gray-500 py-2 px-4 rounded-lg"
                        >
                            <Text className="text-white text-center font-JakartaSemiBold">
                                Complete Order
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </TouchableOpacity>
    )
}

export default OrderCard