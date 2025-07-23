import EnhancedMap from '@/components/EnhancedMap'
import { useStorageDistance } from '@/lib/hooks/useStorageDistance'
import { useStorageList } from '@/lib/query/hooks'
import { StorageApiData, StorageMarkerData } from '@/lib/types/type'
import { filterStoragesByRadius } from '@/lib/utils/distance'
import { useLocationStore, useStorageStore } from '@/store'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { router } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
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
    withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

const FindStorage = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchRadius, setSearchRadius] = useState(10)
    const [filteredStorages, setFilteredStorages] = useState<
        (StorageMarkerData & { distance: number })[]>([])
    const [selectedStorage, setSelectedStorage] = useState<
        (StorageMarkerData & { distance: number }) | null>(null)
    const [searchSuggestions, setSearchSuggestions] = useState<
        (StorageMarkerData & { distance: number })[]>([])
    const [cachedStorages, setCachedStorages] = useState<
        (StorageMarkerData & { distance: number })[]>([])
    const [routeInfo, setRouteInfo] = useState<{ distance: string } | null>(null)
    const [routeError, setRouteError] = useState<string | null>(null)
    const { userLatitude, userLongitude, userAddress } = useLocationStore()
    const { setSelectedStorage: setStoreSelectedStorage, setStorages } =
        useStorageStore()

    // BottomSheet ref and snap points
    const bottomSheetRef = useRef<BottomSheet>(null)
    const mapRef = useRef<any>(null)
    const snapPoints = ['40%', '45%']

    // Animated values for floating header
    const headerTranslateY = useSharedValue(0)

    // Use TanStack Query for consolidated data fetching
    const {
        data: storagesResponse,
        isLoading,
        isRefetching,
        refetch,
        error,
    } = useStorageList({
        status: 'AVAILABLE',
        limit: 100,
    })
    console.log(storagesResponse?.data.data, 'Storage List Response')

    // Process storages data with distance filtering
    const processedStorages = React.useMemo((): (StorageMarkerData & {
        distance: number
    })[] => {
        console.log('Processing storages - API data:', !!storagesResponse?.data?.data, 'User location:', !!userLatitude && !!userLongitude)
        
        // Check if we have valid API response data
        if (!storagesResponse?.data?.data) {
            console.log('No API data available, using cached storages:', cachedStorages.length)
            return cachedStorages
        }

        // Check if we have user location
        if (!userLatitude || !userLongitude) {
            console.log('No user location available, using cached storages:', cachedStorages.length)
            return cachedStorages
        }

        const apiStorages: StorageApiData[] = storagesResponse.data.data
        console.log('Processing', apiStorages.length, 'storages from API')
        
        const storagesWithCoords = apiStorages
            .filter((storage) => storage.latitude && storage.longitude)
            .map(
                (storage): StorageMarkerData => ({
                    id: storage.id,
                    title: storage.description || 'Storage Space',
                    address: storage.address || 'Unknown Location',
                    latitude: storage.latitude,
                    longitude: storage.longitude,
                    status: storage.status || 'AVAILABLE',
                    keeperPhoneNumber: storage.keeperPhoneNumber || 'N/A',
                    keeperId: storage.keeperId || 'unknown',
                    pricePerDay: 50000,
                    rating: storage.averageRating || 4.5,
                    keeperName: storage.keeperName || 'Storage Owner',
                    images: [
                        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
                    ],
                    description:
                        storage.description ||
                        'Secure storage space available for rent',
                    amenities: [
                        'Security Camera',
                        'Climate Control',
                        '24/7 Access',
                    ],
                    totalSpaces: 10,
                    availableSpaces: 8,
                })
            )

        // Filter by radius and add distance
        const filtered = filterStoragesByRadius(
            userLatitude,
            userLongitude,
            storagesWithCoords,
            searchRadius
        )
        
        return filtered
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storagesResponse, userLatitude, userLongitude, searchRadius])
    useEffect(() => {
        if (processedStorages.length > 0) {
            setStorages(processedStorages)
            setCachedStorages(processedStorages)
        }
    }, [processedStorages, setStorages])

    // Filter storages based on search query
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredStorages(processedStorages)
            setSearchSuggestions([])
        } else {
            const filtered = processedStorages.filter(
                (storage) =>
                    storage.title
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    storage.address
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    storage.keeperName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
            )
            setFilteredStorages(filtered)
            setSearchSuggestions(filtered.slice(0, 5)) // Top 5 suggestions
        }
    }, [processedStorages, searchQuery])

    // Use storage distance API for selected storage
    const { result: distanceResult, isLoading: isDistanceLoading } = useStorageDistance(
        selectedStorage && userLatitude && userLongitude
            ? {
                userLatitude,
                userLongitude,
                storageLatitude: selectedStorage.latitude,
                storageLongitude: selectedStorage.longitude,
            }
            : null,
        !!selectedStorage && !!userLatitude && !!userLongitude
    )

    // Update route info when distance result changes
    useEffect(() => {
        if (distanceResult) {
            if (distanceResult.error) {
                setRouteError(distanceResult.error)
                setRouteInfo(null)
            } else if (distanceResult.distance) {
                setRouteInfo({
                    distance: `${distanceResult.distance.toFixed(1)} km`,
                })
                setRouteError(null)
            }
        }
    }, [distanceResult])

    // Handle route errors
    const handleRouteError = (error: string) => {
        setRouteError(error)
        setRouteInfo(null)
        console.error('Route error:', error)
    }

    // Handle storage marker/card press (unified interaction)
    const handleStoragePress = (
        storage: StorageMarkerData & { distance?: number }
    ) => {
        if (typeof storage.distance === 'number') {
            setSelectedStorage(
                storage as StorageMarkerData & { distance: number }
            )
        }
        // Reset route info when selecting new storage
        setRouteInfo(null)
        setRouteError(null)
        
        if (mapRef.current && userLatitude && userLongitude) {
            const coordinates = [
                { latitude: userLatitude, longitude: userLongitude },
                { latitude: storage.latitude, longitude: storage.longitude },
            ]
            mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 300, left: 50 },
                animated: true,
            })
        }
    }

    // Handle book storage navigation
    const handleBookStorage = (
        storage: StorageMarkerData & { distance: number }
    ) => {
        setStoreSelectedStorage(storage.id)

        // Store selected storage location
        if (useLocationStore.getState().setSelectedStorageLocation) {
            useLocationStore.getState().setSelectedStorageLocation({
                latitude: storage.latitude,
                longitude: storage.longitude,
                address: storage.address,
            })
        }

        router.push('/(root)/book-storage')
    }

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

    const onRefresh = () => {
        refetch()
    }

    // Handle map drag behavior - slide header and hide bottom sheet
    const handleMapDrag = (isDragging: boolean) => {
        if (isDragging) {
            // Slide header up when dragging map
            headerTranslateY.value = withTiming(-200, { duration: 300 })
            // Collapse bottom sheet when dragging
            bottomSheetRef.current?.close()
        } else {
            // Slide header back to original position
            headerTranslateY.value = withTiming(0, { duration: 300 })
            // Restore bottom sheet to default position
            bottomSheetRef.current?.snapToIndex(0)
        }
    }

    // Handle bottom sheet change
    const handleSheetChanges = (index: number) => {
        console.log('Bottom sheet index:', index)
    }

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
                        userLatitude={userLatitude}
                        userLongitude={userLongitude}
                        storages={processedStorages}
                        selectedStorageId={selectedStorage?.id}
                        onStorageMarkerPress={handleStoragePress as any}
                        onMapDrag={handleMapDrag}
                        showDirections={
                            !!selectedStorage &&
                            !!userLatitude &&
                            !!userLongitude
                        }
                        zoomToUserLocation={true}
                        showPolyline={false}
                        travelMode="DRIVING"
                    />

                    {/* Floating Header - Compact Design */}
                    <View className="absolute top-0 left-0 right-0 z-10 pt-3">
                        <Animated.View
                            entering={FadeInDown.delay(100).springify()}
                            style={[headerAnimatedStyle]}
                        >
                            <View className="mx-3">
                                {/* Header Bar - More Compact */}
                                <View className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg mb-2">
                                    {/* Top Row: Back button, Location, Refresh */}
                                    <View className="flex-row items-center justify-between mb-3">
                                        <TouchableOpacity
                                            onPress={() => router.back()}
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
                                            {userAddress ? (
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
                                                            {userAddress}
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

                                        <TouchableOpacity
                                            onPress={onRefresh}
                                            className="bg-gray-100 rounded-xl p-2"
                                            disabled={isRefetching}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name={
                                                    isRefetching
                                                        ? 'hourglass'
                                                        : 'refresh'
                                                }
                                                size={18}
                                                color="#374151"
                                            />
                                        </TouchableOpacity>
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
                                                onPress={() =>
                                                    setSearchQuery('')
                                                }
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
                                            {[5, 10, 50].map((range) => (
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
                        
                        {/* Search Suggestions Dropdown - Positioned Below Header */}
                        {searchQuery.length > 0 && searchSuggestions.length > 0 && (
                            <View className="mx-3 mt-2">
                                <View
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
                                            onPress={() => {
                                                console.log('Selected suggestion:', suggestion)
                                                setSelectedStorage(suggestion)
                                                setSearchQuery('')
                                                setSearchSuggestions([])
                                                handleStoragePress(suggestion)
                                                
                                                // Focus on the selected storage on map
                                                if (mapRef.current) {
                                                    mapRef.current.animateToRegion({
                                                        latitude: suggestion.latitude,
                                                        longitude: suggestion.longitude,
                                                        latitudeDelta: 0.005,
                                                        longitudeDelta: 0.005,
                                                    }, 1000)
                                                }
                                            }}
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
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* BottomSheet for Storage List */}
                <BottomSheet
                    ref={bottomSheetRef}
                    snapPoints={snapPoints}
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
                >
                    <BottomSheetScrollView
                        style={{ flex: 1, paddingHorizontal: 20 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefetching}
                                onRefresh={onRefresh}
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
                                                {selectedStorage?.distance?.toFixed(
                                                    1
                                                ) || '0.0'}{' '}
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
                                {/* Selected Storage Detail Card */}
                                <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                                    <View className="flex-row items-start">
                                        <Image
                                            source={{
                                                uri:
                                                    selectedStorage
                                                        ?.images?.[0] ||
                                                    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
                                            }}
                                            className="w-20 h-20 rounded-xl mr-4"
                                            resizeMode="cover"
                                        />
                                        <View className="flex-1">
                                            <Text className="text-lg font-JakartaBold text-gray-900 mb-1">
                                                {selectedStorage?.title ||
                                                    'Storage Space'}
                                            </Text>
                                            <View className="flex-row items-center mb-2">
                                                <Ionicons
                                                    name="location-outline"
                                                    size={14}
                                                    color="#6b7280"
                                                />
                                                <Text
                                                    className="text-gray-600 ml-1 text-sm flex-1"
                                                    numberOfLines={2}
                                                >
                                                    {selectedStorage?.address ||
                                                        'Unknown Location'}
                                                </Text>
                                            </View>
                                            <View className="flex-row items-center justify-between">
                                                <View className="flex-row items-center">
                                                    <Ionicons
                                                        name="star"
                                                        size={14}
                                                        color="#fbbf24"
                                                    />
                                                    <Text className="text-gray-600 ml-1 text-sm">
                                                        {selectedStorage?.rating?.toFixed(
                                                            1
                                                        ) || '4.5'}
                                                    </Text>
                                                </View>
                                                <Text className="text-blue-600 font-JakartaBold text-sm">
                                                    {selectedStorage?.pricePerDay?.toLocaleString() ||
                                                        '50,000'}{' '}
                                                    VND/day
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>


                                {/* Distance Information */}
                                {(routeInfo || isDistanceLoading) && (
                                    <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                                        <Text className="text-gray-900 font-JakartaBold text-lg mb-3">
                                            Distance Information
                                        </Text>
                                        <View className="items-center">
                                            <View className="bg-blue-100 rounded-lg p-3 mb-3">
                                                <Ionicons name="car" size={24} color="#007AFF" />
                                            </View>
                                            {isDistanceLoading ? (
                                                <Text className="text-gray-500 font-JakartaMedium text-sm">
                                                    Calculating distance...
                                                </Text>
                                            ) : (
                                                <>
                                                    <Text className="text-gray-600 text-sm font-JakartaMedium mb-1">
                                                        Driving Distance
                                                    </Text>
                                                    <Text className="text-blue-600 font-JakartaBold text-xl">
                                                        {routeInfo?.distance || 'N/A'}
                                                    </Text>
                                                </>
                                            )}
                                        </View>
                                    </View>
                                )}

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
                                    className="bg-blue-600 rounded-xl p-4 mb-4"
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
                                                    <TouchableOpacity
                                                        key={storage.id}
                                                        onPress={() =>
                                                            handleStoragePress(
                                                                storage
                                                            )
                                                        }
                                                        className="bg-white rounded-2xl mb-3 overflow-hidden"
                                                        activeOpacity={0.95}
                                                        style={{
                                                            width: '48%',
                                                            shadowColor: '#000',
                                                            shadowOffset: {
                                                                width: 0,
                                                                height: 4,
                                                            },
                                                            shadowOpacity: 0.08,
                                                            shadowRadius: 12,
                                                            elevation: 6,
                                                            transform: [
                                                                { scale: 1 },
                                                            ],
                                                        }}
                                                    >
                                                        {/* Image with Overlay */}
                                                        <View className="relative">
                                                            <Image
                                                                source={{
                                                                    uri: storage
                                                                        .images[0],
                                                                }}
                                                                className="w-full h-28"
                                                                resizeMode="cover"
                                                            />
                                                            {/* Subtle Dark Overlay */}
                                                            <View
                                                                className="absolute inset-0"
                                                                style={{
                                                                    backgroundColor:
                                                                        'rgba(0, 0, 0, 0.1)',
                                                                }}
                                                            />

                                                            {/* Price Badge */}
                                                            <View className="absolute top-2 right-2 bg-white/95 rounded-lg px-2 py-1">
                                                                <Text className="text-blue-600 font-JakartaBold text-xs">
                                                                    {(
                                                                        storage.pricePerDay /
                                                                        1000
                                                                    ).toFixed(
                                                                        0
                                                                    )}
                                                                    k/day
                                                                </Text>
                                                            </View>

                                                            {/* Distance Badge */}
                                                            <View className="absolute bottom-2 left-2 bg-black/60 rounded-lg px-2 py-0.5">
                                                                <Text className="text-white text-xs font-JakartaMedium">
                                                                    {storage.distance.toFixed(
                                                                        1
                                                                    )}{' '}
                                                                    km
                                                                </Text>
                                                            </View>
                                                        </View>

                                                        {/* Content Section */}
                                                        <View className="p-3">
                                                            {/* Title */}
                                                            <Text
                                                                className="text-sm font-JakartaBold text-gray-900 mb-1"
                                                                numberOfLines={
                                                                    1
                                                                }
                                                            >
                                                                {storage.title}
                                                            </Text>

                                                            {/* Address */}
                                                            <View className="flex-row items-center mb-2">
                                                                <Ionicons
                                                                    name="location-outline"
                                                                    size={12}
                                                                    color="#9ca3af"
                                                                />
                                                                <Text
                                                                    className="text-gray-500 ml-1 text-xs flex-1"
                                                                    numberOfLines={
                                                                        1
                                                                    }
                                                                >
                                                                    {
                                                                        storage.address
                                                                    }
                                                                </Text>
                                                            </View>

                                                            {/* Bottom Row: Rating and Status */}
                                                            <View className="flex-row items-center justify-between">
                                                                <View className="flex-row items-center">
                                                                    <Ionicons
                                                                        name="star"
                                                                        size={
                                                                            12
                                                                        }
                                                                        color="#fbbf24"
                                                                    />
                                                                    <Text className="text-gray-600 ml-1 text-xs font-JakartaMedium">
                                                                        {storage.rating.toFixed(
                                                                            1
                                                                        )}
                                                                    </Text>
                                                                </View>
                                                                <View className="bg-green-100 rounded-full px-2 py-0.5">
                                                                    <Text className="text-green-700 text-xs font-JakartaMedium">
                                                                        Available
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
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
                                                onPress={() =>
                                                    setSearchQuery('')
                                                }
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
