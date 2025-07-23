import { ConnectionStatus } from '@/components/ConnectionStatus'
import { NotificationBadge } from '@/components/NotificationBadge'
import { useNotifications } from '@/lib/context/NotificationContext'
import { useStoragesByKeeper } from '@/lib/query/hooks'
import { useUserProfile } from '@/lib/query/hooks/useUserQueries'
import { useUserStore } from '@/store'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import {
    ActivityIndicator,
    FlatList,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

const KeeperStorages = () => {
    const router = useRouter()
    const { user } = useUserStore()
    const { joinGroup, isConnected } = useNotifications()
    
    console.log('🏪 Keeper Storages page loaded for user:', user?.id)
    
    // Get user profile to extract keeperId
    const {
        data: userProfileResponse,
        isLoading: profileLoading
    } = useUserProfile(user?.id || '', {
        enabled: !!user?.id
    })
    
    const userData = (userProfileResponse as any)?.data.data
    const keeperId = userData?.keeper?.keeperId
    
    console.log('👤 User profile data:', userData)
    console.log('🔑 Keeper ID:', keeperId)
    
    // Get storages owned by this keeper
    const {
        data: storagesResponse,
        isLoading: storagesLoading,
        error: storagesError,
        refetch: refetchStorages
    } = useStoragesByKeeper(keeperId || '', {
        enabled: !!keeperId
    })
    
    const storages = storagesResponse?.data || []
    const loading = profileLoading || storagesLoading
    
    console.log('🏪 Keeper storages:', storages)

    // Join SignalR group when keeperId is available
    useEffect(() => {
        if (keeperId && isConnected) {
            console.log('🔔 Joining notification group for keeper:', keeperId)
            joinGroup(keeperId, 'keeper')
        }
    }, [keeperId, isConnected, joinGroup])

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
                <View className="flex-1 items-center justify-center">
                    <View className="bg-white rounded-3xl p-8 mx-6 shadow-lg">
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text className="text-gray-700 mt-4 text-center font-JakartaMedium">
                            Loading your storages...
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        )
    }

    if (storagesError || !keeperId) {
        return (
            <SafeAreaView className="flex-1 bg-gradient-to-br from-red-50 to-pink-100">
                <View className="flex-1 items-center justify-center px-6">
                    <View className="bg-white rounded-3xl p-8 shadow-lg items-center">
                        <View className="bg-red-100 rounded-full p-4 mb-4">
                            <Ionicons name="warning-outline" size={48} color="#ef4444" />
                        </View>
                        <Text className="text-red-600 text-xl font-JakartaBold text-center">
                            {!keeperId ? 'Not a Keeper Account' : 'Failed to Load Storages'}
                        </Text>
                        <Text className="text-gray-600 text-center mt-3 font-JakartaMedium leading-6">
                            {!keeperId 
                                ? 'Your account is not set up as a keeper. Please contact support.'
                                : 'Please check your connection and try again'
                            }
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(root)/(tabs)/home')}
                            className="mt-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl px-8 py-4 shadow-md"
                        >
                            <Text className="text-white font-JakartaBold text-center">
                                Go Home
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        )
    }

    const renderStorageItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => router.replace({
                pathname: "/(root)/storagedetails/[id]",
                params: { id: item.id }
            })}
            className="bg-white rounded-2xl mx-4 mb-4 shadow-sm border border-gray-100"
        >
            <View className="p-4">
                {/* Header Row */}
                <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 pr-3">
                        <View className="flex-row items-center">
                            <Text className="text-gray-900 text-lg font-JakartaBold flex-1" numberOfLines={2}>
                                {item.description || `Storage ${item.id.slice(-8)}`}
                            </Text>
                            {/* Notification Badge for Pending Orders */}
                            {item.pendingOrdersCount > 0 && (
                                <View className="bg-red-500 rounded-full w-6 h-6 items-center justify-center ml-2">
                                    <Text className="text-white text-xs font-JakartaBold">
                                        {item.pendingOrdersCount > 9 ? '9+' : item.pendingOrdersCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View className="flex-row items-center mt-1">
                            <Ionicons name="location-outline" size={14} color="#6b7280" />
                            <Text className="text-gray-500 text-sm font-JakartaMedium ml-1 flex-1" numberOfLines={1}>
                                {item.address.split(',')[0]}
                            </Text>
                        </View>
                    </View>
                    
                    {/* Status Badge */}
                    <View className={`px-2 py-1 rounded-full ${
                        item.status === 'AVAILABLE' ? 'bg-green-100' : 
                        item.status === 'OCCUPIED' ? 'bg-orange-100' : 'bg-red-100'
                    }`}>
                        <Text className={`text-xs font-JakartaBold ${
                            item.status === 'AVAILABLE' ? 'text-green-700' : 
                            item.status === 'OCCUPIED' ? 'text-orange-700' : 'text-red-700'
                        }`}>
                            {item.status}
                        </Text>
                    </View>
                </View>
                
                {/* Stats Row */}
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <Ionicons name="star" size={16} color="#f59e0b" />
                        <Text className="text-gray-700 text-sm font-JakartaMedium ml-1">
                            {item.averageRating?.toFixed(1) || 'New'}
                        </Text>
                        <Text className="text-gray-400 text-sm font-JakartaMedium ml-1">
                            ({item.ratingCount || 0})
                        </Text>
                    </View>
                    
                    {item.pendingOrdersCount > 0 && (
                        <View className="bg-red-500 rounded-full px-2 py-1">
                            <Text className="text-white text-xs font-JakartaBold">
                                {item.pendingOrdersCount} pending
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    )

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Simple Header */}
            <View className="bg-white border-b border-gray-200">
                <View className="px-4 py-4 flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 -ml-2"
                    >
                        <Ionicons name="chevron-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    
                    <View className="flex-1 items-center">
                        <Text className="text-gray-900 text-lg font-JakartaBold">
                            My Storages
                        </Text>
                        <Text className="text-gray-500 text-sm font-JakartaMedium">
                            {storages.length} location{storages.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                    
                    <View className="flex-row items-center space-x-2">
                        {/* Notification Badge */}
                        <View className="relative">
                            <TouchableOpacity className="p-2">
                                <Ionicons name="notifications-outline" size={20} color="#374151" />
                            </TouchableOpacity>
                            <NotificationBadge size="small" />
                        </View>
                        
                        <TouchableOpacity
                            onPress={() => refetchStorages()}
                            className="p-2"
                        >
                            <Ionicons name="refresh-outline" size={20} color="#374151" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Connection Status */}
            <ConnectionStatus showDetails={false} />

            {storages.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                    <View className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 items-center mx-4">
                        <View className="bg-blue-50 rounded-full p-4 mb-4">
                            <Ionicons name="business-outline" size={48} color="#3b82f6" />
                        </View>
                        
                        <Text className="text-gray-900 text-xl font-JakartaBold text-center mb-2">
                            No Storage Yet
                        </Text>
                        <Text className="text-gray-600 text-center font-JakartaMedium leading-5 mb-6">
                            Add your first storage location to start accepting bookings
                        </Text>
                        
                        <TouchableOpacity
                            onPress={() => router.push('/(root)/add-storage')}
                            className="bg-blue-600 rounded-xl px-6 py-3"
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="add" size={18} color="white" />
                                <Text className="text-white font-JakartaBold ml-1">
                                    Add Storage
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <FlatList
                    data={storages}
                    renderItem={renderStorageItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
                    showsVerticalScrollIndicator={false}
                    refreshing={storagesLoading}
                    onRefresh={refetchStorages}
                />
            )}
        </SafeAreaView>
    )
}

export default KeeperStorages