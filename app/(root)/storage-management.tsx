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

import CustomButton from '@/components/CustomButton'
import { icons, images } from '@/constants'
import { storageAPI } from '@/lib/storageAPI'
import { Storage } from '@/types/type'

const StorageManagement = () => {
    const { user } = useUserStore()
    const [storages, setStorages] = useState<Storage[]>([])
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        fetchMyStorages()
    }, [])

    const fetchMyStorages = async () => {
        setLoading(true)
        try {
            // In a real app, you'd get the keeper ID from user data
            const response = await storageAPI.getAllStorages({
                keeperId: user?.id // This would need to be the keeper ID
            })
            setStorages(response.data)
        } catch (error) {
            console.error('Error fetching storages:', error)
            Alert.alert('Error', 'Failed to load your storage locations')
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchMyStorages()
        setRefreshing(false)
    }

    const handleStoragePress = (storage: Storage) => {
        router.push(`/(root)/storage-detail/${storage.id}`)
    }

    const handleAddStorage = () => {
        router.push('/(root)/add-storage')
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return 'bg-green-100 text-green-600'
            case 'OCCUPIED': return 'bg-blue-100 text-blue-600'
            case 'MAINTENANCE': return 'bg-red-100 text-red-600'
            default: return 'bg-gray-100 text-gray-600'
        }
    }

    const renderStorageItem = ({ item }: { item: Storage }) => (
        <TouchableOpacity
            onPress={() => handleStoragePress(item)}
            className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-general-700"
        >
            <View className="flex flex-row justify-between items-start mb-3">
                <View className="flex-1">
                    <Text className="text-lg font-JakartaBold text-primary-500">
                        {item.description || 'Storage Location'}
                    </Text>
                    <Text className="text-sm font-JakartaRegular text-general-200">
                        {item.address}
                    </Text>
                </View>
                
                <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                    <Text className={`text-xs font-JakartaSemiBold ${getStatusColor(item.status).split(' ')[1]}`}>
                        {item.status}
                    </Text>
                </View>
            </View>

            <View className="flex flex-row justify-between items-center">
                <View className="flex flex-row items-center">
                    <Image
                        source={icons.dollar}
                        className="w-4 h-4"
                        resizeMode="contain"
                    />
                    <Text className="text-md font-JakartaSemiBold text-primary-500 ml-1">
                        ${item.pricePerDay || 10}/day
                    </Text>
                </View>
                
                <View className="flex flex-row items-center">
                    <Image
                        source={icons.star}
                        className="w-4 h-4"
                        resizeMode="contain"
                    />
                    <Text className="text-sm font-JakartaRegular text-general-200 ml-1">
                        {item.rating?.toFixed(1) || 'N/A'}
                    </Text>
                    <Text className="text-sm font-JakartaRegular text-general-200 ml-2">
                        ({item.totalOrders || 0} orders)
                    </Text>
                </View>
            </View>

            <View className="flex flex-row justify-between items-center mt-3 pt-3 border-t border-general-700">
                <Text className="text-sm font-JakartaRegular text-general-200">
                    Tap to view orders & details
                </Text>
                <Text className="text-lg text-general-200">→</Text>
            </View>
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
                        My Storages
                    </Text>
                    <TouchableOpacity onPress={handleAddStorage}>
                        <Text className="text-2xl text-primary-500">+</Text>
                    </TouchableOpacity>
                </View>

                <CustomButton
                    title="Add New Storage"
                    onPress={handleAddStorage}
                    className="mb-5"
                />

                <FlatList
                    data={storages}
                    renderItem={renderStorageItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
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
                                        alt="No storage locations"
                                        resizeMode="contain"
                                    />
                                    <Text className="text-center text-lg font-JakartaSemiBold mb-2">
                                        No Storage Locations
                                    </Text>
                                    <Text className="text-center text-sm font-JakartaRegular text-general-200 mb-5">
                                        Add your first storage location to start earning money
                                    </Text>
                                    <CustomButton
                                        title="Add Storage"
                                        onPress={handleAddStorage}
                                        className="w-48"
                                    />
                                </>
                            )}
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    )
}

export default StorageManagement