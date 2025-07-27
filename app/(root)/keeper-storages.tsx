import { ConnectionStatus } from '@/components/ConnectionStatus'
import { NotificationBadge } from '@/components/NotificationBadge'
import { useNotifications } from '@/lib/context/NotificationContext'
import { useStoragesByKeeper } from '@/lib/query/hooks'
import { useUserProfile } from '@/lib/query/hooks/useUserQueries'
import { useUserStore } from '@/store'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

const KeeperStorages = () => {
    const router = useRouter()
    const { user } = useUserStore()
    const { joinGroup, isConnected } = useNotifications()
    
    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'name' | 'rating' | 'pending' | 'status'>('name')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [showSortMenu, setShowSortMenu] = useState(false)
    const [loadedCount, setLoadedCount] = useState(10) // Start with 10 items
    
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

    // Filter and sort storages
    const filteredAndSortedStorages = useMemo(() => {
        let filtered = storages.filter((storage: any) => {
            const searchTerm = searchQuery.toLowerCase()
            const description = (storage.description || '').toLowerCase()
            const address = (storage.address || '').toLowerCase()
            return description.includes(searchTerm) || address.includes(searchTerm)
        })

        // Sort storages
        filtered = filtered.sort((a: any, b: any) => {
            let aValue, bValue
            switch (sortBy) {
                case 'name':
                    aValue = a.description || `Storage ${a.id.slice(-8)}`
                    bValue = b.description || `Storage ${b.id.slice(-8)}`
                    break
                case 'rating':
                    aValue = a.averageRating || 0
                    bValue = b.averageRating || 0
                    break
                case 'pending':
                    aValue = a.pendingOrdersCount || 0
                    bValue = b.pendingOrdersCount || 0
                    break
                case 'status':
                    aValue = a.status
                    bValue = b.status
                    break
                default:
                    return 0
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortOrder === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue)
            } else {
                return sortOrder === 'asc' 
                    ? aValue - bValue 
                    : bValue - aValue
            }
        })

        return filtered
    }, [storages, searchQuery, sortBy, sortOrder])

    // Lazy loading - only show loadedCount items
    const displayedStorages = useMemo(() => {
        return filteredAndSortedStorages.slice(0, loadedCount)
    }, [filteredAndSortedStorages, loadedCount])

    // Load more function for lazy loading
    const handleLoadMore = useCallback(() => {
        if (loadedCount < filteredAndSortedStorages.length) {
            setLoadedCount(prev => Math.min(prev + 10, filteredAndSortedStorages.length))
        }
    }, [loadedCount, filteredAndSortedStorages.length])

    // Reset loaded count when search/sort changes
    useEffect(() => {
        setLoadedCount(10)
    }, [searchQuery, sortBy, sortOrder])

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
            className="bg-white rounded-3xl mx-4 mb-4 shadow-lg border border-gray-50"
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 8
            }}
        >
            <View className="p-5">
                {/* Header Row */}
                <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center flex-1">
                                <View className="bg-blue-50 rounded-xl p-2 mr-3">
                                    <Ionicons name="business" size={18} color="#3b82f6" />
                                </View>
                                <Text className="text-gray-900 text-lg font-JakartaBold flex-1" numberOfLines={2}>
                                    {item.description || `Storage ${item.id.slice(-8)}`}
                                </Text>
                            </View>
                            
                            {/* Enhanced Status Badge */}
                            <View className={`px-3 py-2 rounded-full shadow-sm ${
                                item.status === 'AVAILABLE' ? 'bg-green-100 border border-green-200' : 
                                item.status === 'OCCUPIED' ? 'bg-orange-100 border border-orange-200' : 'bg-red-100 border border-red-200'
                            }`}>
                                <View className="flex-row items-center">
                                    <View className={`w-2 h-2 rounded-full mr-2 ${
                                        item.status === 'AVAILABLE' ? 'bg-green-500' : 
                                        item.status === 'OCCUPIED' ? 'bg-orange-500' : 'bg-red-500'
                                    }`} />
                                    <Text className={`text-xs font-JakartaBold ${
                                        item.status === 'AVAILABLE' ? 'text-green-700' : 
                                        item.status === 'OCCUPIED' ? 'text-orange-700' : 'text-red-700'
                                    }`}>
                                        {item.status}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        
                        {/* Address with icon - Full width */}
                        <View className="flex-row items-center bg-gray-50 rounded-xl p-3 w-full">
                            <Ionicons name="location" size={14} color="#6b7280" />
                            <Text className="text-gray-600 text-sm font-JakartaMedium ml-2 flex-1" numberOfLines={2}>
                                {item.address}
                            </Text>
                        </View>
                        
                        {/* Pending Orders Badge - Positioned at bottom right of address */}
                        {item.pendingOrdersCount > 0 && (
                            <View className="absolute -top-2 -right-2">
                                <View className="bg-red-500 rounded-full w-8 h-8 items-center justify-center shadow-lg border-2 border-white">
                                    <Text className="text-white text-xs font-JakartaBold">
                                        {item.pendingOrdersCount > 9 ? '9+' : item.pendingOrdersCount}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
                
                {/* Stats Row */}
                <View className="flex-row items-center justify-between bg-gray-50 rounded-xl p-3">
                    <View className="flex-row items-center flex-1">
                        <View className="bg-yellow-100 rounded-lg p-1.5 mr-2">
                            <Ionicons name="star" size={14} color="#f59e0b" />
                        </View>
                        <Text className="text-gray-700 text-sm font-JakartaBold">
                            {item.averageRating?.toFixed(1) || 'New'}
                        </Text>
                        <Text className="text-gray-400 text-sm font-JakartaMedium ml-1">
                            ({item.ratingCount || 0} reviews)
                        </Text>
                    </View>
                    
                    {/* Action arrow */}
                    <View className="bg-blue-50 rounded-lg p-1.5">
                        <Ionicons name="chevron-forward" size={14} color="#3b82f6" />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Enhanced Header with Search */}
            <View className="bg-white border-b border-gray-200">
                {/* Top Header Row */}
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
                            {filteredAndSortedStorages.length} location{filteredAndSortedStorages.length !== 1 ? 's' : ''}
                            {searchQuery && ` • "${searchQuery}"`}
                        </Text>
                    </View>
                    
                    <View className="flex-row items-center space-x-1">
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

                {/* Search Bar */}
                <View className="px-4 pb-4">
                    <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
                        <Ionicons name="search" size={18} color="#6b7280" />
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search by name or address..."
                            className="flex-1 ml-3 text-gray-700 font-JakartaMedium"
                            placeholderTextColor="#9ca3af"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setSearchQuery('')}
                                className="p-1"
                            >
                                <Ionicons name="close-circle" size={18} color="#6b7280" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Sort and Filter Bar */}
                <View className="px-4 pb-4 flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => setShowSortMenu(!showSortMenu)}
                        className="flex-row items-center bg-blue-50 rounded-xl px-4 py-2 border border-blue-200"
                    >
                        <Ionicons name="funnel-outline" size={16} color="#3b82f6" />
                        <Text className="text-blue-700 font-JakartaMedium ml-2 text-sm">
                            Sort: {sortBy === 'name' ? 'Name' : sortBy === 'rating' ? 'Rating' : sortBy === 'pending' ? 'Pending' : 'Status'}
                        </Text>
                        <Ionicons 
                            name={showSortMenu ? "chevron-up" : "chevron-down"} 
                            size={14} 
                            color="#3b82f6" 
                            style={{ marginLeft: 4 }} 
                        />
                    </TouchableOpacity>

                    <View className="flex-row items-center">
                        <Text className="text-gray-500 text-sm font-JakartaMedium">
                            Showing {displayedStorages.length} of {filteredAndSortedStorages.length}
                        </Text>
                    </View>
                </View>

                {/* Sort Menu Dropdown */}
                {showSortMenu && (
                    <View className="mx-4 mb-4 bg-white rounded-xl border border-gray-200 shadow-lg">
                        {[
                            { key: 'name', label: 'Name', icon: 'text-outline' },
                            { key: 'rating', label: 'Rating', icon: 'star-outline' },
                            { key: 'pending', label: 'Pending Orders', icon: 'time-outline' },
                            { key: 'status', label: 'Status', icon: 'checkmark-circle-outline' }
                        ].map((option) => (
                            <TouchableOpacity
                                key={option.key}
                                onPress={() => {
                                    if (sortBy === option.key) {
                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                                    } else {
                                        setSortBy(option.key as any)
                                        setSortOrder('asc')
                                    }
                                    setShowSortMenu(false)
                                }}
                                className={`flex-row items-center justify-between p-4 ${
                                    sortBy === option.key ? 'bg-blue-50' : ''
                                } ${option.key !== 'status' ? 'border-b border-gray-100' : ''}`}
                            >
                                <View className="flex-row items-center">
                                    <Ionicons 
                                        name={option.icon as any} 
                                        size={18} 
                                        color={sortBy === option.key ? "#3b82f6" : "#6b7280"} 
                                    />
                                    <Text className={`ml-3 font-JakartaMedium ${
                                        sortBy === option.key ? 'text-blue-700' : 'text-gray-700'
                                    }`}>
                                        {option.label}
                                    </Text>
                                </View>
                                
                                {sortBy === option.key && (
                                    <View className="flex-row items-center">
                                        <Ionicons 
                                            name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
                                            size={16} 
                                            color="#3b82f6" 
                                        />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Connection Status */}
            <ConnectionStatus showDetails={false} />

            {filteredAndSortedStorages.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                    <View className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 items-center mx-4">
                        <View className="bg-blue-50 rounded-full p-4 mb-4">
                            <Ionicons 
                                name={searchQuery ? "search-outline" : "business-outline"} 
                                size={48} 
                                color="#3b82f6" 
                            />
                        </View>
                        
                        <Text className="text-gray-900 text-xl font-JakartaBold text-center mb-2">
                            {searchQuery ? 'No Results Found' : 'No Storage Yet'}
                        </Text>
                        <Text className="text-gray-600 text-center font-JakartaMedium leading-5 mb-6">
                            {searchQuery 
                                ? `No storages match "${searchQuery}". Try a different search term.`
                                : 'Add your first storage location to start accepting bookings'
                            }
                        </Text>
                    </View>
                </View>
            ) : (
                <FlatList
                    data={displayedStorages}
                    renderItem={renderStorageItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
                    showsVerticalScrollIndicator={false}
                    refreshing={storagesLoading}
                    onRefresh={refetchStorages}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        loadedCount < filteredAndSortedStorages.length ? (
                            <View className="py-4 items-center">
                                <TouchableOpacity
                                    onPress={handleLoadMore}
                                    className="bg-blue-50 rounded-xl px-6 py-3 border border-blue-200"
                                >
                                    <View className="flex-row items-center">
                                        <Ionicons name="chevron-down" size={16} color="#3b82f6" />
                                        <Text className="text-blue-700 font-JakartaMedium ml-2">
                                            Load More ({filteredAndSortedStorages.length - loadedCount} remaining)
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
    )
}

export default KeeperStorages