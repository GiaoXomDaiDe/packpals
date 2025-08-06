import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    RefreshControl,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

import EnhancedMap from '@/components/EnhancedMap'
import { StorageDisplayCard } from '@/components/StorageDisplayCard'
import { AvailableStatus, useDistance, useStorageAll } from '@/hooks/query'
import { useRefresh } from '@/hooks/useRefresh'
import { useLocationStore, useStorageStore } from '@/store'
import { filterStoragesByRadiusSync } from '@/utils'
import { StorageApiData, StorageMarkerData } from '../../types/type'

// Constants
const SEARCH_RADIUS_OPTIONS = [5, 10, 50]
const SNAP_POINTS = ['40%', '45%']
const DEFAULT_STORAGE_IMAGE = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'
const DEFAULT_AMENITIES = ['Security Camera', 'Climate Control', '24/7 Access']

type StorageWithDistance = StorageMarkerData & { distance: number }

const FindStorage = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchRadius, setSearchRadius] = useState(10)
    const [filteredStorages, setFilteredStorages] = useState<StorageWithDistance[]>([])
    const [selectedStorage, setSelectedStorage] = useState<StorageWithDistance | null>(null)
    const [searchSuggestions, setSearchSuggestions] = useState<StorageWithDistance[]>([])
    const [routeError, setRouteError] = useState<string | null>(null)
    const [isMapDragging, setIsMapDragging] = useState(false)
    
    // Simple variables: User location from device GPS
    const { userLatitude, userLongitude, userAddress } = useLocationStore()
    const userLocation = {
        latitude: userLatitude,
        longitude: userLongitude,
        address: userAddress
    }
    
    const { setSelectedStorage: setStoreSelectedStorage, setStorages: setStoreStorages } = useStorageStore()

    // Refs
    const bottomSheetRef = useRef<BottomSheet>(null)
    const mapRef = useRef<any>(null)
    const hasInitialZoom = useRef(false)
    
    // Animated values
    const headerTranslateY = useSharedValue(0)

    // Simple API call for storages from backend
    const {
        data: storagesResponse,
        isLoading,
        isRefetching,
        refetch,
        error,
    } = useStorageAll({
        status: AvailableStatus.AVAILABLE,
        limit: 100,
    })

    // Simple storages processing - just convert API data to display format
    const storages = useMemo((): StorageWithDistance[] => {        
        // Check if we have user location and API data
        if (!userLocation.latitude || !userLocation.longitude || !storagesResponse?.data?.data) {
            return []
        }

        const apiStorages: StorageApiData[] = storagesResponse.data.data
        
        const processedStorages = apiStorages
            .filter((storage) => storage.latitude && storage.longitude)
            .map((storage): StorageMarkerData => ({
                id: storage.id,
                title: storage.description || 'Storage Space',
                address: storage.address || 'Unknown Location',
                latitude: storage.latitude,
                longitude: storage.longitude,
                status: storage.status || 'AVAILABLE',
                keeperPhoneNumber: storage.keeperPhoneNumber || 'N/A',
                keeperId: storage.keeperId || 'unknown',
                pricePerDay: 0,
                rating: storage.averageRating || 0,
                keeperName: storage.keeperName || 'Storage Owner',
                images: [DEFAULT_STORAGE_IMAGE],
                description: storage.description || 'Secure storage space available for rent',
                amenities: [...DEFAULT_AMENITIES],
                totalSpaces: 10,
                availableSpaces: 8,
            }))

        // Filter by radius and add distance
        return filterStoragesByRadiusSync(
            userLocation.latitude,
            userLocation.longitude,
            processedStorages,
            searchRadius
        )
    }, [storagesResponse, userLocation.latitude, userLocation.longitude, searchRadius])

    // Update global storage store whenever storages change
    useEffect(() => {
        console.log('🏪 Updating global storage store with', storages.length, 'storages')
        setStoreStorages(storages)
    }, [storages, setStoreStorages])

    // Filter storages based on search query
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredStorages(storages)
            setSearchSuggestions([])
        } else {
            const filtered = storages.filter(
                (storage) =>
                    storage.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    storage.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    storage.keeperName.toLowerCase().includes(searchQuery.toLowerCase())
            )
            setFilteredStorages(filtered)
            setSearchSuggestions(filtered.slice(0, 5)) // Top 5 suggestions
        }
    }, [storages, searchQuery])

    // Initial zoom to user location only once - improved logic
    useEffect(() => {
        if (userLocation.latitude && userLocation.longitude && !hasInitialZoom.current) {
            console.log('🎯 Initial zoom triggered:', userLocation.latitude, userLocation.longitude)
            
            // Shorter delay and ensure map is ready
            const timer = setTimeout(() => {
                if (mapRef.current) {
                    console.log('🗺️ Animating to user location')
                    mapRef.current.animateToRegion({
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                        latitudeDelta: 0.015,
                        longitudeDelta: 0.015,
                    }, 1000)
                    hasInitialZoom.current = true
                }
            }, 500) // Reduced delay
            
            return () => clearTimeout(timer)
        }
    }, [userLocation.latitude, userLocation.longitude])

    // Use distance API for selected storage
    const { 
        data: distanceData, 
        isLoading: isDistanceLoading,
        error: distanceError 
    } = useDistance(
        selectedStorage && userLocation.latitude && userLocation.longitude
            ? {
                lat1: userLocation.latitude,
                lon1: userLocation.longitude,
                lat2: selectedStorage.latitude,
                lon2: selectedStorage.longitude,
            }
            : { lat1: 0, lon1: 0, lat2: 0, lon2: 0 },
        {
            enabled: !!(selectedStorage && userLocation.latitude && userLocation.longitude)
        }
    )

    // Update route info when distance result changes
    useEffect(() => {
        console.log('🔄 Distance data changed:', {
            distanceData,
            isDistanceLoading,
            distanceError
        })
        
        if (distanceData) {
            console.log('✅ Distance calculated:', distanceData.data, 'km')
            setRouteError(null)
        } else if (distanceError) {
            console.log('❌ Distance calculation error:', distanceError)
            setRouteError(distanceError.message || 'Failed to calculate distance')
        }
    }, [distanceData, isDistanceLoading, distanceError])

    // Handle storage marker/card press
    const handleStoragePress = useCallback((storage: StorageMarkerData & { distance?: number }) => {
        if (typeof storage.distance === 'number') {
            setSelectedStorage(storage as StorageWithDistance)
        }
        
        // Clear any previous errors
        setRouteError(null)
        
        // Immediate map animation
        if (mapRef.current && userLocation.latitude && userLocation.longitude) {
            const coordinates = [
                { latitude: userLocation.latitude, longitude: userLocation.longitude },
                { latitude: storage.latitude, longitude: storage.longitude },
            ]
            
            mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 300, left: 50 },
                animated: true,
            })
            
            setTimeout(() => {
                mapRef.current?.animateToRegion({
                    latitude: storage.latitude,
                    longitude: storage.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 1000)
            }, 500)
        }
    }, [userLocation.latitude, userLocation.longitude])

    // Handle book storage navigation
    const handleBookStorage = useCallback((storage: StorageWithDistance) => {
        console.log('🚀 Booking storage:', storage.id)
        
        // Ensure the storage exists
        const storageExists = storages.find(s => s.id === storage.id)
        if (!storageExists) {
            Alert.alert('Error', 'Selected storage is not available. Please try again.')
            return
        }
        
        // Set the selected storage ID
        setStoreSelectedStorage(storage.id)
        router.push('/(root)/book-storage')
    }, [setStoreSelectedStorage, storages])

    // Handle map touch behavior - Only hide bottom sheet, keep header visible
    const handleMapDrag = useCallback((isTouching: boolean) => {
        setIsMapDragging(isTouching)
        
        if (isTouching) {
            // Only hide bottom sheet, keep header visible
            bottomSheetRef.current?.close()
        } else {
            // Restore bottom sheet when touch ends
            bottomSheetRef.current?.snapToIndex(0)
        }
    }, [])

    // Handle bottom sheet change with useCallback
    const handleSheetChanges = useCallback((index: number) => {
        console.log('Bottom sheet index:', index)
    }, [])

    // Handle error display with consistent error handling
    useEffect(() => {
        if (error) {
            Alert.alert(
                'Error Loading Storages',
                'Unable to load storage locations. Please check your connection and try again.',
                [
                    { text: 'Retry', onPress: () => refetch() },
                    { text: 'Cancel', style: 'cancel' },
                ]
            )
        }
    }, [error, refetch])

    // Use refresh hook with haptic feedback
    const { isRefreshing: isManualRefreshing, triggerRefresh } = useRefresh({
        onRefresh: async () => {
            await refetch()
        },
        enableHaptics: true,
        showSuccessFeedback: true
    })

    // Handle suggestion selection without excessive haptic feedback
    const handleSuggestionSelect = useCallback((suggestion: StorageWithDistance) => {
        console.log('Selected suggestion:', suggestion)
        
        // Dismiss keyboard first
        Keyboard.dismiss()
        
        // Set selected storage and clear errors
        setSelectedStorage(suggestion)
        setRouteError(null)
        setSearchQuery('')
        setSearchSuggestions([])
        
        // Animate to storage location
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: suggestion.latitude,
                longitude: suggestion.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            }, 1000)
        }
        
        // Call handleStoragePress for full functionality
        handleStoragePress(suggestion)
    }, [handleStoragePress])

    // Handle clear search with useCallback
    const handleClearSearch = useCallback(() => {
        setSearchQuery('')
    }, [])

    // Handle storage card press with useCallback
    const handleStorageCardPress = useCallback((storageData: any) => {
        console.log('🖱️ Storage card pressed:', {
            id: storageData.id,
            title: storageData.title,
            hasDistance: !!storageData.distance
        })
        
        // Convert StorageData back to StorageMarkerData for handleStoragePress
        const markerData: StorageWithDistance = {
            id: storageData.id,
            title: storageData.title || 'Storage Space',
            address: storageData.address,
            latitude: storageData.latitude || 0,
            longitude: storageData.longitude || 0,
            status: storageData.status || 'AVAILABLE',
            keeperPhoneNumber: storageData.keeperPhoneNumber || 'N/A',
            keeperId: storageData.keeperId || 'unknown',
            pricePerDay: storageData.pricePerDay || 0,
            rating: storageData.rating || 0,
            keeperName: storageData.keeperName || 'Storage Owner',
            images: storageData.images || [DEFAULT_STORAGE_IMAGE],
            description: storageData.description || 'Secure storage space available for rent',
            distance: storageData.distance || 0,
        };
        
        // Only call handleStoragePress to show storage details
        // Do NOT automatically navigate - let user click "Book This Storage" button
        handleStoragePress(markerData);
    }, [handleStoragePress])

    const headerAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: headerTranslateY.value }],
        }
    })

    if (isLoading && !isRefetching) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text className="text-gray-600 mt-4 font-JakartaMedium">
                        Loading storage locations...
                    </Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <GestureHandlerRootView className="flex-1">
            <SafeAreaView className="flex-1 bg-gray-50">
                {/* Map Container */}
                <View className="flex-1">
                    <EnhancedMap
                        userLatitude={userLocation.latitude}
                        userLongitude={userLocation.longitude}
                        storages={storages}
                        selectedStorageId={selectedStorage?.id}
                        onStorageMarkerPress={handleStoragePress as any}
                        onMapDrag={handleMapDrag}
                        showDirections={
                            !!selectedStorage &&
                            !!userLocation.latitude &&
                            !!userLocation.longitude
                        }
                        zoomToUserLocation={false}
                        showPolyline={false}
                        travelMode="DRIVING"
                    />

                    {/* Floating Header - Compact Design */}
                    <View className="absolute top-0 left-0 right-0 z-10 pt-3">
                        {/* Wrapper for layout animation */}
                        <Animated.View entering={FadeInDown.delay(100).springify()}>
                            {/* Inner view for transform animation */}
                            <Animated.View style={[headerAnimatedStyle]}>
                                <View className="mx-3">
                                    {/* Header Bar - More Compact */}
                                    <View className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg mb-2">
                                    {/* Top Row: Back button, Location, Refresh */}
                                    <View className="flex-row items-center justify-between mb-3">
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (router.canGoBack()) {
                                                    router.back()
                                                } else {
                                                    router.replace('/(root)/(tabs)/home')
                                                }
                                            }}
                                            className="bg-gray-100 rounded-xl p-2"
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name="chevron-back"
                                                size={20}
                                                color="#374151"
                                            />
                                        </TouchableOpacity>

                                        {/* Current Location as Main Title */}
                                        <View className="flex-1 mx-3 items-center">
                                            {userLocation.address ? (
                                                <View className="flex-row items-center">
                                                    <View className="bg-blue-100 rounded-lg p-1.5 mr-2">
                                                        <Ionicons
                                                            name="location"
                                                            size={16}
                                                            color="#007AFF"
                                                        />
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-blue-900 font-JakartaBold text-xs text-center">
                                                            Your Location
                                                        </Text>
                                                        <Text
                                                            className="text-blue-700 text-xs text-center"
                                                            numberOfLines={1}
                                                        >
                                                            {userLocation.address}
                                                        </Text>
                                                    </View>
                                                </View>
                                            ) : (
                                                <View className="flex-row items-center">
                                                    <Ionicons
                                                        name="location-outline"
                                                        size={16}
                                                        color="#9ca3af"
                                                    />
                                                    <Text className="text-gray-500 font-JakartaMedium text-sm ml-1">
                                                        Getting location...
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* Search Bar - Thinner */}
                                    <View className="flex-row items-center bg-gray-50 rounded-xl px-3 py-2">
                                        <Ionicons
                                            name="search-outline"
                                            size={18}
                                            color="#6b7280"
                                        />
                                        <TextInput
                                            className="flex-1 ml-2 text-gray-900 font-Jakarta text-sm"
                                            placeholder="Search storages..."
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            placeholderTextColor="#9ca3af"
                                            autoCorrect={false}
                                            autoCapitalize="none"
                                        />
                                        {searchQuery.length > 0 && (
                                            <TouchableOpacity
                                                onPress={handleClearSearch}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons
                                                    name="close-circle"
                                                    size={18}
                                                    color="#6b7280"
                                                />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    
                                    {/* Search Range Filter */}
                                    <View className="flex-row items-center justify-between mt-3">
                                        <Text className="text-gray-700 font-JakartaMedium text-sm">Range:</Text>
                                        <View className="flex-row bg-gray-100 rounded-lg p-1">
                                            {SEARCH_RADIUS_OPTIONS.map((range) => (
                                                <TouchableOpacity
                                                    key={range}
                                                    onPress={() => setSearchRadius(range)}
                                                    className={`px-3 py-1 rounded-md ${
                                                        searchRadius === range
                                                            ? 'bg-blue-500'
                                                            : 'bg-transparent'
                                                    }`}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text
                                                        className={`text-xs font-JakartaMedium ${
                                                            searchRadius === range
                                                                ? 'text-white'
                                                                : 'text-gray-600'
                                                        }`}
                                                    >
                                                        {range}km
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </Animated.View>
                        </Animated.View>
                        
                        {/* Search Suggestions Dropdown - Positioned Below Header */}
                        {searchQuery.length > 0 && searchSuggestions.length > 0 && !isMapDragging && (
                            <View className="mx-3 mt-2">
                                <Animated.View
                                    entering={FadeInDown.delay(50).springify()}
                                    style={{
                                        backgroundColor: '#fff',
                                        borderRadius: 12,
                                        shadowColor: '#000',
                                        shadowOpacity: 0.1,
                                        shadowRadius: 8,
                                        shadowOffset: {
                                            width: 0,
                                            height: 4,
                                        },
                                        elevation: 8,
                                        paddingVertical: 4,
                                        maxHeight: 200,
                                    }}
                                >
                                    {searchSuggestions.map((suggestion) => (
                                        <TouchableOpacity
                                            key={suggestion.id}
                                            onPress={() => handleSuggestionSelect(suggestion)}
                                            className="px-4 py-3 border-b border-gray-100 last:border-b-0"
                                            activeOpacity={0.7}
                                        >
                                            <View className="flex-row items-center">
                                                <View className="bg-blue-100 rounded-lg p-2 mr-3">
                                                    <Ionicons name="cube-outline" size={16} color="#007AFF" />
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-gray-900 font-JakartaBold text-sm" numberOfLines={1}>
                                                        {suggestion.title}
                                                    </Text>
                                                    <Text className="text-gray-500 font-Jakarta text-xs mt-1" numberOfLines={1}>
                                                        {suggestion.address} • {suggestion.distance.toFixed(1)}km away
                                                    </Text>
                                                </View>
                                                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </Animated.View>
                            </View>
                        )}
                    </View>
                </View>

                {/* BottomSheet for Storage List */}
                <BottomSheet
                    ref={bottomSheetRef}
                    snapPoints={SNAP_POINTS}
                    onChange={handleSheetChanges}
                    index={0}
                    backgroundStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                    }}
                    handleIndicatorStyle={{
                        backgroundColor: '#d1d5db',
                        width: 48,
                        height: 4,
                    }}
                    enablePanDownToClose={false}
                    animateOnMount={true}
                    animationConfigs={{
                        duration: 300,
                    }}
                    style={{
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 0,
                            height: -2,
                        },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 8,
                    }}
                >
                    <BottomSheetScrollView
                        style={{ flex: 1, paddingHorizontal: 20 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefetching || isManualRefreshing}
                                onRefresh={triggerRefresh}
                                colors={['#007AFF']}
                            />
                        }
                    >
                        {selectedStorage ? (
                            // Selected Storage Details
                            <View>
                                <View className="flex-row items-center justify-between mb-4 px-1">
                                    <View className="flex-row items-center">
                                        <View className="bg-green-100 rounded-lg p-2 mr-3">
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={20}
                                                color="#10b981"
                                            />
                                        </View>
                                        <View>
                                            <Text className="text-lg font-JakartaBold text-gray-900">
                                                You chose this storage
                                            </Text>
                                            <Text className="text-sm text-gray-500">
                                                It is{' '}
                                                {distanceData?.data?.toFixed(1) || selectedStorage?.distance?.toFixed(1) || '0.0'}{' '}
                                                km from you
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setSelectedStorage(null)}
                                        className="bg-gray-100 rounded-lg p-2"
                                    >
                                        <Ionicons
                                            name="close"
                                            size={16}
                                            color="#6b7280"
                                        />
                                    </TouchableOpacity>
                                </View>
                                {/* Selected Storage Detail Card - Enhanced Layout */}
                                <View className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
                                    {/* Header Image with Gradient Overlay */}
                                    <View className="relative">
                                        <Image
                                            source={{
                                                uri: selectedStorage?.images?.[0] || DEFAULT_STORAGE_IMAGE,
                                            }}
                                            className="w-full h-32"
                                            resizeMode="cover"
                                        />
                                        {/* Gradient Overlay */}
                                        <View 
                                            className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
                                            style={{
                                                backgroundColor: 'transparent',
                                                backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)'
                                            }}
                                        />
                                        {/* Status Badge */}
                                        <View className="absolute top-3 right-3 bg-green-500 rounded-full px-3 py-1">
                                            <Text className="text-white font-JakartaBold text-xs">
                                                Available
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Content Section */}
                                    <View className="p-4">
                                        {/* Title and Distance */}
                                        <View className="flex-row items-start justify-between mb-3">
                                            <View className="flex-1">
                                                <Text className="text-xl font-JakartaBold text-gray-900 mb-1">
                                                    {selectedStorage?.title || 'Storage Space'}
                                                </Text>
                                                <View className="flex-row items-center">
                                                    <View className="bg-blue-100 rounded-full p-1 mr-2">
                                                        <Ionicons
                                                            name="location"
                                                            size={12}
                                                            color="#007AFF"
                                                        />
                                                    </View>
                                                    <Text className="text-blue-600 font-JakartaMedium text-sm">
                                                        {distanceData?.data?.toFixed(1) || selectedStorage?.distance?.toFixed(1) || '0.0'} km away
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Address */}
                                        <View className="flex-row items-start mb-4">
                                            <Ionicons
                                                name="location-outline"
                                                size={16}
                                                color="#6b7280"
                                                style={{ marginTop: 2 }}
                                            />
                                            <Text
                                                className="text-gray-600 ml-2 text-sm flex-1 leading-5"
                                                numberOfLines={2}
                                            >
                                                {selectedStorage?.address || 'Unknown Location'}
                                            </Text>
                                        </View>

                                        {/* Rating and Info Row */}
                                        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                                            {/* Rating */}
                                            <View className="flex-row items-center">
                                                <View className="bg-yellow-100 rounded-lg p-2 mr-3">
                                                    <Ionicons
                                                        name="star"
                                                        size={16}
                                                        color="#fbbf24"
                                                    />
                                                </View>
                                                <View>
                                                    <Text className="text-gray-500 text-xs font-JakartaMedium">
                                                        Rating
                                                    </Text>
                                                    <Text className="text-gray-900 font-JakartaBold text-xs">
                                                        {selectedStorage?.rating 
                                                            ? `${selectedStorage.rating.toFixed(1)}/5.0` 
                                                            : 'No ratings yet'
                                                        }
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Keeper Info */}
                                            <View className="flex-row items-center">
                                                <View className="bg-gray-100 rounded-lg p-2 mr-3">
                                                    <Ionicons
                                                        name="person"
                                                        size={16}
                                                        color="#6b7280"
                                                    />
                                                </View>
                                                <View>
                                                    <Text className="text-gray-500 text-xs font-JakartaMedium">
                                                        Keeper
                                                    </Text>
                                                    <Text className="text-gray-900 font-JakartaBold text-xs" numberOfLines={1}>
                                                        {selectedStorage?.keeperName || 'Storage Owner'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Route Error */}
                                {routeError && (
                                    <View className="bg-red-50 rounded-2xl p-4 mb-4 border border-red-200">
                                        <View className="flex-row items-center">
                                            <Ionicons name="warning-outline" size={20} color="#dc2626" />
                                            <Text className="text-red-600 font-JakartaMedium text-sm ml-2 flex-1">
                                                Unable to get route information: {routeError}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* Action Button */}
                                <TouchableOpacity
                                    onPress={() =>
                                        selectedStorage &&
                                        handleBookStorage(selectedStorage)
                                    }
                                    className="bg-blue-600 rounded-xl p-4 mb-8"
                                    activeOpacity={0.8}
                                >
                                    <Text className="text-white font-JakartaBold text-center text-lg">
                                        Book This Storage
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            // Default Storage List
                            <>
                                <View className="flex-row items-center justify-between mb-4 px-1">
                                    <View className="flex-row items-center">
                                        <View className="bg-blue-100 rounded-lg p-2 mr-3">
                                            <Ionicons
                                                name="business"
                                                size={20}
                                                color="#007AFF"
                                            />
                                        </View>
                                        <View>
                                            <Text className="text-lg font-JakartaBold text-gray-900">
                                                Nearby Storage
                                            </Text>
                                            <Text className="text-sm text-gray-500">
                                                {filteredStorages.length}{' '}
                                                locations found
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                {/* Enhanced Storage Grid */}
                                {filteredStorages.length > 0 ? (
                                    <View className="flex-row flex-wrap justify-between">
                                        {filteredStorages.map(
                                            (storage, index) => {
                                                return (
                                                    <StorageDisplayCard
                                                        key={storage.id}
                                                        storage={{
                                                            ...storage,
                                                            title: storage.title,
                                                            description: storage.description,
                                                        }}
                                                        onPress={handleStorageCardPress}
                                                        variant="grid"
                                                        width="48%"
                                                    />
                                                )
                                            }
                                        )}
                                    </View>
                                ) : (
                                    /* Empty State */
                                    <View className="items-center py-12">
                                        <View className="bg-gray-100 rounded-full p-6 mb-4">
                                            <Ionicons
                                                name="business-outline"
                                                size={32}
                                                color="#9ca3af"
                                            />
                                        </View>
                                        <Text className="text-gray-900 font-JakartaBold text-lg mb-2">
                                            No Storage Found
                                        </Text>
                                        <Text className="text-gray-500 text-center text-sm">
                                            {searchQuery
                                                ? 'Try adjusting your search terms or explore different areas.'
                                                : 'No storage locations available in this area.'}
                                        </Text>
                                        {searchQuery && (
                                            <TouchableOpacity
                                                onPress={handleClearSearch}
                                                className="bg-blue-100 rounded-xl px-4 py-2 mt-4"
                                            >
                                                <Text className="text-blue-600 font-JakartaMedium text-sm">
                                                    Clear Search
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </>
                        )}
                    </BottomSheetScrollView>
                </BottomSheet>
            </SafeAreaView>
        </GestureHandlerRootView>
    )
}

export default FindStorage
