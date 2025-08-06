import { ActiveStorageCard } from '@/components/ActiveStorageCard'
import CustomModal from '@/components/CustomModal'
import { QuickActionGrid, useQuickActions } from '@/components/QuickActionGrid'
import { StorageDisplayCard } from '@/components/StorageDisplayCard'
import { UserAvatar } from '@/components/UserAvatar'
import useCustomModal from '@/hooks/useCustomModal'
// import { useStorageNotifications } from '@/hooks/useStorageNotifications' // Disabled for Expo Go
import { AvailableStatus, useStorageAll, useUserOrders } from '@/hooks/query'
import { useBulkOrderCountdown } from '@/hooks/useBulkOrderCountdown'
import { useLocationStore, useUserStore } from '@/store'
import { filterStoragesByRadiusSync, formatAddressDetailed, formatAddressShort } from '@/utils'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    Linking,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

const Home = () => {
    const router = useRouter()
    const [detailedAddress, setDetailedAddress] = useState<any>(null)
    const [isGettingLocation, setIsGettingLocation] = useState(false) // 🔒 Prevent spam calls
    const hasRequestedLocation = useRef(false) // 🔑 Track first location request
    
    // Custom modal hook
    const { modalState, showError, hideModal } = useCustomModal()
    
    // State từ Storage
    const { setUserLocation, userAddress, userLatitude, userLongitude } = useLocationStore()
    const { user: currentUser } = useUserStore()

    //State từ API: Lấy danh sách kho đồ còn trống
    const { data: storagesResponse } = useStorageAll({
        status: AvailableStatus.AVAILABLE,
        limit: 20,
    });

    //State từ API: Lấy đơn hàng trong kho của người dùng
    const userId = currentUser?.id || ''
    const { data: activeOrdersResponse } = useUserOrders(userId, {
        Status: 'IN_STORAGE',
    });
    
    const activeOrders = useMemo(() => {
        if (!activeOrdersResponse?.data?.data || !Array.isArray(activeOrdersResponse.data.data)) {
            return [];
        }
        return activeOrdersResponse.data.data;
    }, [activeOrdersResponse]);

    //  Hàm để lọc kho theo bán kính
    const nearbyStorages = useMemo(() => {
        if (!userLatitude || !userLongitude || !storagesResponse?.data?.data) return [];
        
        return filterStoragesByRadiusSync(
            userLatitude, 
            userLongitude, 
            storagesResponse.data.data, 
            5 // 5km radius
        ).slice(0, 5);
    }, [userLatitude, userLongitude, storagesResponse]);
    
    //  Hàm để lấy ID đơn hàng đang hoạt động
    const activeOrderIds = useMemo(() => {
        return activeOrders.map((order: any) => order.id).filter(Boolean);
    }, [activeOrders]);

    // Dùng useBulkOrderCountdown hook để lấy thời gian đếm ngược
    const {
        loading: countdownLoading,
        error: countdownError,
        lastSyncTime,
        getCountdownForOrder,
        refreshFromServer: refreshCountdowns
    } = useBulkOrderCountdown(activeOrderIds, 10 * 60 * 1000); // 10 phút

    const isKeeper = currentUser?.role === 'KEEPER'

    const quickActions = useQuickActions(currentUser?.role || 'RENTER', router)
    
    // Hàm để mở Google Maps
    const openGoogleMaps = useCallback((address: string) => {
        const encodedAddress = encodeURIComponent(address);
        const url = `https://maps.google.com/?q=${encodedAddress}`;
        
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                showError('Error', 'Cannot open Google Maps')
            }
        });
    }, [showError])

    // 📍 Lấy vị trí "chuẩn" một lần duy nhất - KHÔNG drift, KHÔNG spam
    const requestLocationPermission = useCallback(async () => {
        // 🔒 Ngăn gọi nhiều lần cùng lúc
        if (isGettingLocation) {
            console.log('🚫 Location request already in progress, skipping...')
            return
        }

        try {
            setIsGettingLocation(true) // 🔒 Lock để ngăn spam
            
            // 1. Xin quyền truy cập location
            let { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
                showError(
                    'Location Permission Required',
                    'Please enable location services to find nearby storage options.'
                )
                return
            }
            
            console.log('🎯 Starting high-accuracy location acquisition...')
            
            // 2. Tạm thời "watch" với độ chính xác cao nhất
            const subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation, // ≈ 1-3m accuracy
                    timeInterval: 1000,         // 1s/lần (Android)
                    distanceInterval: 0,        // Luôn gửi (iOS)
                    mayShowUserSettingsDialog: true
                },
                async (location) => {
                    console.log(`📍 GPS reading: ±${location.coords.accuracy?.toFixed(1)}m accuracy`)
                    
                    // 3. Chỉ nhận khi đủ tốt (≤ 20m accuracy)
                    if (location.coords.accuracy && location.coords.accuracy <= 20) {
                        console.log('✅ High accuracy achieved! Stopping GPS tracking...')
                        subscription.remove() // ⚠️ HUỶ ngay để ngừng drift
                        setIsGettingLocation(false) // 🔓 Unlock
                        
                        // 4. Tạo location data với accuracy info
                        const locationData: any = {
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                            accuracy: location.coords.accuracy,
                            address: 'Current Location', // Default fallback
                            addressObj: null,
                            timestamp: new Date().toISOString()
                        }
                        
                        // 5. Reverse geocoding với error handling
                        try {
                            const address = await Location.reverseGeocodeAsync({
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude,
                            })
                            
                            if (address && address.length > 0) {
                                locationData.addressObj = address[0]
                                locationData.address = formatAddressShort(address[0] as any)
                                setDetailedAddress(address[0])
                                console.log(`📧 Address: ${locationData.address}`)
                            }
                        } catch (geocodingError) {
                            console.warn('Reverse geocoding failed:', geocodingError)
                        }
                        
                        // 6. Lưu vào state một lần duy nhất
                        setUserLocation(locationData)
                        console.log(`🎉 Location saved: ${location.coords.latitude}, ${location.coords.longitude} (±${location.coords.accuracy}m)`)
                    }
                }
            )
            
            // 7. Fallback: huỷ sau 8s nếu chưa đủ chính xác
            const fallbackTimer = setTimeout(() => {
                console.log('⏰ Location timeout - using best available reading')
                subscription.remove()
                setIsGettingLocation(false) // 🔓 Unlock on timeout
                
                // Fallback với getCurrentPositionAsync nếu watch không thành công
                Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                }).then(async (fallbackLocation) => {
                    const locationData: any = {
                        latitude: fallbackLocation.coords.latitude,
                        longitude: fallbackLocation.coords.longitude,
                        accuracy: fallbackLocation.coords.accuracy,
                        address: 'Current Location',
                        addressObj: null,
                        timestamp: new Date().toISOString()
                    }
                    
                    try {
                        const address = await Location.reverseGeocodeAsync({
                            latitude: fallbackLocation.coords.latitude,
                            longitude: fallbackLocation.coords.longitude,
                        })
                        
                        if (address && address.length > 0) {
                            locationData.addressObj = address[0]
                            locationData.address = formatAddressShort(address[0] as any)
                            setDetailedAddress(address[0])
                        }
                    } catch (geocodingError) {
                        console.warn('Fallback reverse geocoding failed:', geocodingError)
                    }
                    
                    setUserLocation(locationData)
                    console.log(`📍 Fallback location: ±${fallbackLocation.coords.accuracy?.toFixed(1)}m`)
                }).catch((fallbackError) => {
                    console.error('Fallback location failed:', fallbackError)
                    showError(
                        'Location Unavailable',
                        'Unable to get your current location. Please check your GPS settings.'
                    )
                })
            }, 8000) // 8 giây timeout
            
            // Cleanup timer khi có kết quả sớm
            const originalRemove = subscription.remove
            subscription.remove = () => {
                clearTimeout(fallbackTimer)
                setIsGettingLocation(false) // 🔓 Unlock on success
                originalRemove.call(subscription)
            }
            
        } catch (error) {
            setIsGettingLocation(false) // 🔓 Unlock on error
            console.error('Location permission error:', error)
            
            // Provide user feedback for common errors
            const errorMessage = error instanceof Error ? error.message : String(error)
            if (errorMessage?.includes('UNAVAILABLE') || errorMessage?.includes('NETWORK')) {
                showError(
                    'Location Service Unavailable',
                    'Location services are temporarily unavailable. Please check your internet connection and try again.'
                )
            } else if (errorMessage?.includes('TIMEOUT')) {
                showError(
                    'Location Timeout',
                    'Getting your location is taking too long. Please try again.'
                )
            } else {
                showError(
                    'Location Error',
                    'Failed to get your location. Please ensure GPS is enabled and try again.'
                )
            }
        }
    }, [isGettingLocation, setUserLocation, showError]) // 🔑 Simplified dependencies

    // 🔄 Manual refresh function for button
    const handleRefreshLocation = useCallback(() => {
        console.log('🔄 Manual location refresh requested')
        requestLocationPermission()
    }, [requestLocationPermission])

    useEffect(() => {
        // Chỉ gọi 1 lần khi component mount
        if (!hasRequestedLocation.current) {
            hasRequestedLocation.current = true
            requestLocationPermission()
        }
    }, [requestLocationPermission]) // Vẫn cần dependency nhưng có guard

    useEffect(() => {
        if (countdownError) {
            console.error('❌ Countdown error:', countdownError);
        }
    }, [countdownError]);


    return (
        <View className="flex-1 bg-background">
            <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />
            <SafeAreaView className="flex-1">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                    {/* Header: location info and user profile */}
                    <View className="bg-surface mx-4 mt-4 rounded-2xl p-4 shadow-sm">
                        {/* Compact header layout */}
                        <View className="flex-row justify-between items-center mb-3">
                            <View className="flex-1">
                                <Text className="text-text-secondary text-xs font-medium mb-0.5">
                                    Welcome back 👋
                                </Text>
                                <Text className="text-text text-lg font-bold mb-1">
                                    {currentUser?.username || 'User'}
                                </Text>
                            </View>
                            
                            <UserAvatar 
                                username={currentUser?.username || 'User'} 
                                size={44} 
                            />
                        </View>

                        {/* Location section - enhanced with detailed info and refresh button */}
                        <View className="flex-row items-center">
                            {/* Main location info */}
                            <TouchableOpacity 
                                className="flex-row items-center flex-1"
                                onPress={() => {
                                    if (detailedAddress) {
                                        const { fullAddress } = formatAddressDetailed(detailedAddress);
                                        openGoogleMaps(fullAddress || userAddress || '');
                                    } else if (userAddress) {
                                        openGoogleMaps(userAddress);
                                    }
                                }}
                                activeOpacity={0.7}
                            >
                                <View className="bg-primary-soft rounded-lg p-1.5 mr-2">
                                    <Ionicons name="location" size={14} color="#2563eb" />
                                </View>
                                <View className="flex-1">
                                    {detailedAddress ? (
                                        (() => {
                                            const { primary, secondary } = formatAddressDetailed(detailedAddress);
                                            return (
                                                <>
                                                    <Text className="text-text text-sm font-semibold leading-4 mb-0.5" numberOfLines={1}>
                                                        {primary}
                                                    </Text>
                                                    {secondary && (
                                                        <Text className="text-text-secondary text-xs font-medium leading-3" numberOfLines={1}>
                                                            {secondary}
                                                        </Text>
                                                    )}
                                                </>
                                            );
                                        })()
                                    ) : (
                                        <>
                                            <Text className="text-text-secondary text-xs font-medium mb-0.5">
                                                LOCATION
                                            </Text>
                                            <Text className="text-text text-sm font-semibold leading-4" numberOfLines={2}>
                                                {userAddress || 'Detecting your location...'}
                                            </Text>
                                        </>
                                    )}
                                </View>
                                <Ionicons name="open-outline" size={12} color="#64748b" className="ml-1" />
                            </TouchableOpacity>
                            
                            {/* Refresh location button */}
                            <TouchableOpacity 
                                className={`ml-2 p-2 rounded-lg ${isGettingLocation ? 'bg-amber-50' : 'bg-primary-soft'}`}
                                onPress={handleRefreshLocation}
                                activeOpacity={0.7}
                                disabled={isGettingLocation} // Disable khi đang get location
                            >
                                <Ionicons 
                                    name={isGettingLocation ? "hourglass" : "refresh"} 
                                    size={14} 
                                    color={isGettingLocation ? "#d97706" : "#2563eb"} 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Main Action Card - Different for Keeper vs Renter */}
                    <View className="mt-4 mx-4">
                        <View style={{
                            shadowColor: '#2563eb',
                            shadowOpacity: 0.25,
                            shadowRadius: 20,
                            shadowOffset: { width: 0, height: 10 },
                            elevation: 15,
                        }}>
                            <View style={{
                                shadowColor: '#000',
                                shadowOpacity: 0.15,
                                shadowRadius: 25,
                                shadowOffset: { width: 0, height: 15 },
                                elevation: 20,
                            }}>
                                <View className="bg-primary rounded-xl p-4 relative overflow-hidden">
                                    <View style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        borderRadius: 12,
                                        borderTopColor: 'rgba(255, 255, 255, 0.3)',
                                        borderTopWidth: 1,
                                        borderLeftColor: 'rgba(255, 255, 255, 0.2)',
                                        borderLeftWidth: 0.5,
                                        borderRightColor: 'rgba(0, 0, 0, 0.1)',
                                        borderRightWidth: 0.5,
                                        borderBottomColor: 'rgba(0, 0, 0, 0.15)',
                                        borderBottomWidth: 1,
                                    }} />
                                    {/* Enhanced 3D Background decoration with depth */}
                                    <View style={{
                                        position: 'absolute',
                                        top: -30,
                                        right: -20,
                                        width: 80,
                                        height: 80,
                                        borderRadius: 40,
                                        backgroundColor: 'rgba(255, 255, 255, 0.12)',
                                        shadowColor: 'rgba(255, 255, 255, 0.5)',
                                        shadowOpacity: 1,
                                        shadowRadius: 10,
                                        shadowOffset: { width: -2, height: -2 },
                                    }} />
                                    <View style={{
                                        position: 'absolute',
                                        bottom: -25,
                                        left: -15,
                                        width: 60,
                                        height: 60,
                                        borderRadius: 30,
                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                        shadowColor: 'rgba(0, 0, 0, 0.3)',
                                        shadowOpacity: 1,
                                        shadowRadius: 8,
                                        shadowOffset: { width: 2, height: 2 },
                                    }} />
                                    {/* Additional 3D depth elements */}
                                    <View style={{
                                        position: 'absolute',
                                        top: '50%',
                                        right: -10,
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        transform: [{ translateY: -20 }],
                                    }} />

                                    {isKeeper ? (
                                        <>
                                            <View className="mb-4 z-10">
                                                <View className="flex-row items-center mb-1.5">
                                                    <View style={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                                        borderRadius: 10,
                                                        padding: 6,
                                                        marginRight: 10,
                                                        // 3D button effect
                                                        shadowColor: 'rgba(0, 0, 0, 0.2)',
                                                        shadowOpacity: 1,
                                                        shadowRadius: 3,
                                                        shadowOffset: { width: 0, height: 2 },
                                                        borderTopWidth: 0.5,
                                                        borderTopColor: 'rgba(255, 255, 255, 0.4)',
                                                        borderBottomWidth: 0.5,
                                                        borderBottomColor: 'rgba(0, 0, 0, 0.2)',
                                                    }}>
                                                        <Ionicons name="business" size={20} color="white" />
                                                    </View>
                                                    <Text className="text-white text-lg font-bold tracking-wide" style={{
                                                        textShadowColor: 'rgba(0, 0, 0, 0.3)',
                                                        textShadowOffset: { width: 0, height: 1 },
                                                        textShadowRadius: 2,
                                                    }}>
                                                        Storage Business
                                                    </Text>
                                                </View>
                                                <Text className="text-white/90 text-sm leading-5 font-medium" style={{
                                                    textShadowColor: 'rgba(0, 0, 0, 0.2)',
                                                    textShadowOffset: { width: 0, height: 1 },
                                                    textShadowRadius: 1,
                                                }}>
                                                    Manage orders and grow your storage business
                                                </Text>
                                            </View>
                                        </>
                                    ) : (
                                        <>
                                            <View className="mb-4 z-10">
                                                <View className="flex-row items-center mb-1.5">
                                                    <View style={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                                        borderRadius: 10,
                                                        padding: 6,
                                                        marginRight: 10,
                                                        // 3D button effect
                                                        shadowColor: 'rgba(0, 0, 0, 0.2)',
                                                        shadowOpacity: 1,
                                                        shadowRadius: 3,
                                                        shadowOffset: { width: 0, height: 2 },
                                                        borderTopWidth: 0.5,
                                                        borderTopColor: 'rgba(255, 255, 255, 0.4)',
                                                        borderBottomWidth: 0.5,
                                                        borderBottomColor: 'rgba(0, 0, 0, 0.2)',
                                                    }}>
                                                        <Ionicons name="search" size={20} color="white" />
                                                    </View>
                                                    <Text className="text-white text-lg font-bold tracking-wide" style={{
                                                        textShadowColor: 'rgba(0, 0, 0, 0.3)',
                                                        textShadowOffset: { width: 0, height: 1 },
                                                        textShadowRadius: 2,
                                                    }}>
                                                        Find Storage
                                                    </Text>
                                                </View>
                                                <Text className="text-white/90 text-sm leading-5 font-medium" style={{
                                                    textShadowColor: 'rgba(0, 0, 0, 0.2)',
                                                    textShadowOffset: { width: 0, height: 1 },
                                                    textShadowRadius: 1,
                                                }}>
                                                    Discover trusted storage spaces nearby
                                                </Text>
                                            </View>
                                            <TouchableOpacity 
                                                className="flex-row items-center bg-white rounded-xl px-4 py-3 z-10"
                                                style={{
                                                    // Enhanced 3D button effect
                                                    shadowColor: 'rgba(0, 0, 0, 0.2)',
                                                    shadowOpacity: 1,
                                                    shadowRadius: 8,
                                                    shadowOffset: { width: 0, height: 4 },
                                                    elevation: 8,
                                                    borderTopWidth: 0.5,
                                                    borderTopColor: 'rgba(255, 255, 255, 0.8)',
                                                    borderBottomWidth: 1,
                                                    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
                                                    borderLeftWidth: 0.5,
                                                    borderLeftColor: 'rgba(255, 255, 255, 0.6)',
                                                    borderRightWidth: 0.5,
                                                    borderRightColor: 'rgba(0, 0, 0, 0.05)',
                                                }}
                                                onPress={() => router.push('/(root)/find-storage')}
                                                activeOpacity={0.9}
                                            >
                                                <Ionicons name="location" size={18} color="#2563eb" />
                                                <Text className="text-text text-base font-semibold ml-2.5 flex-1">
                                                    Browse Storage
                                                </Text>
                                                <Ionicons name="arrow-forward" size={18} color="#2563eb" />
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Quick Actions Grid */}
                    <View className="mt-5 mx-4">
                        <QuickActionGrid 
                            actions={quickActions}
                            columns={4}
                            variant="default"
                            spacing="normal"
                        />
                    </View>

                    {/* Content Section - Different for Keeper vs Renter */}
                    <View className="mt-5 mx-4">
                        {isKeeper ? (
                            <>
                                {/* Keeper Dashboard - Content removed per user request */}
                                <View className="bg-surface rounded-2xl p-5 items-center shadow-sm">
                                    <Ionicons name="business" size={48} color="#64748b" />
                                    <Text className="text-text-secondary text-base font-semibold mt-3 text-center">
                                        Keeper Dashboard
                                    </Text>
                                    <Text className="text-text-tertiary text-sm text-center mt-2 leading-5 max-w-[280px]">
                                        Manage your storage business and orders from here
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <>
                                {/* Section 1: Nearby Storage (5km radius) */}
                                {nearbyStorages.length > 0 && (
                                    <View className="mb-7">
                                        {/* Enhanced Header Section */}
                                        <View className="flex-row justify-between items-center mb-4 px-1">
                                            <View className="flex-row items-center flex-1 mr-3">
                                                <View className="bg-primary-soft rounded-xl p-2 mr-3">
                                                    <Ionicons name="location" size={20} color="#2563eb" />
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-text text-lg font-bold mb-0.5">
                                                        Nearby Storage
                                                    </Text>
                                                    <Text className="text-text-secondary text-sm font-medium">
                                                        {nearbyStorages.length} locations within 5km
                                                    </Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity 
                                                onPress={() => router.push('/(root)/find-storage')}
                                                className="flex-row items-center bg-primary-soft px-3 py-2 rounded-full"
                                                activeOpacity={0.8}
                                            >
                                                <Text className="text-primary text-sm font-semibold mr-1">
                                                    All
                                                </Text>
                                                <Ionicons name="arrow-forward" size={12} color="#2563eb" />
                                            </TouchableOpacity>
                                        </View>
                                        
                                        {/* Enhanced Scrollable Cards */}
                                        <ScrollView 
                                            horizontal 
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={{ paddingHorizontal: 4 }}
                                            style={{ marginHorizontal: -4 }}
                                        >
                                            {nearbyStorages.map((storage: any, index: number) => (
                                                <View
                                                    key={storage.id}
                                                    style={{
                                                        marginRight: index === nearbyStorages.length - 1 ? 0 : 12,
                                                        marginLeft: index === 0 ? 0 : 0,
                                                    }}
                                                >
                                                    <StorageDisplayCard
                                                        storage={storage}
                                                        onPress={() => router.push('/(root)/find-storage')}
                                                        variant="horizontal"
                                                        width={200}
                                                    />
                                                </View>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}

                                {/* Section 2: My Active Storage with Countdown */}
                                {activeOrders.length > 0 && (
                                    <View className="mb-7">
                                        {/* Enhanced Header Section */}
                                        <View className="flex-row justify-between items-center mb-4 px-1">
                                            <View className="flex-row items-center flex-1 mr-3">
                                                <View className="bg-cyan-50 rounded-xl p-2 mr-3">
                                                    <Ionicons name="cube" size={20} color="#06b6d4" />
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-slate-800 text-lg font-bold mb-0.5">
                                                        My Active Storage
                                                    </Text>
                                                    <Text className="text-slate-600 text-sm font-medium">
                                                        {activeOrders.length} item{activeOrders.length > 1 ? 's' : ''} stored
                                                        {lastSyncTime && (
                                                            <Text className="text-xs text-blue-600">
                                                                {' • '}
                                                                {Math.floor((new Date().getTime() - lastSyncTime.getTime()) / 60000)}m
                                                            </Text>
                                                        )}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View className="flex-row items-center">
                                                <TouchableOpacity 
                                                    onPress={refreshCountdowns}
                                                    className="mr-2 p-2 rounded-2xl bg-primary-soft"
                                                    activeOpacity={0.7}
                                                >
                                                    <Ionicons 
                                                        name="refresh" 
                                                        size={14} 
                                                        color="#2563eb" 
                                                    />
                                                </TouchableOpacity>
                                                <TouchableOpacity 
                                                    onPress={() => router.push('/(root)/(tabs)/orders')}
                                                    className="flex-row items-center bg-accent-soft px-3 py-2 rounded-full"
                                                    activeOpacity={0.8}
                                                >
                                                    <Text className="text-accent text-sm font-semibold mr-1">
                                                        All
                                                    </Text>
                                                    <Ionicons name="arrow-forward" size={12} color="#06b6d4" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        
                                        {/* Enhanced Storage Cards */}
                                        <View style={{ gap: 12 }}>
                                            {activeOrders.map((order: any) => {
                                                const countdown = getCountdownForOrder(order.id);
                                                return (
                                                    <ActiveStorageCard 
                                                        key={`${order.id}-${order.startKeepTime}`} 
                                                        order={order}
                                                        serverCountdown={countdown}
                                                        loading={countdownLoading}
                                                    />
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}

                                {/* Renter Dashboard - My Stored Items (Fallback if no active orders) */}
                                {activeOrders.length === 0 && (
                                    <View className="mb-7">
                                        {/* Enhanced Header Section */}
                                        <View className="flex-row justify-between items-center mb-4 px-1">
                                            <View className="flex-row items-center flex-1 mr-3">
                                                <View className="bg-surfaceVariant rounded-xl p-2 mr-3">
                                                    <Ionicons name="cube-outline" size={20} color="#64748b" />
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-text text-lg font-bold mb-0.5">
                                                        My Stored Items
                                                    </Text>
                                                    <Text className="text-text-secondary text-sm font-medium">
                                                        No active storage found
                                                    </Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity 
                                                onPress={() => router.push('/(root)/(tabs)/orders')}
                                                className="flex-row items-center bg-surfaceVariant px-3 py-2 rounded-full"
                                                activeOpacity={0.8}
                                            >
                                                <Text className="text-text-secondary text-sm font-semibold mr-1">
                                                    All
                                                </Text>
                                                <Ionicons name="arrow-forward" size={12} color="#64748b" />
                                            </TouchableOpacity>
                                        </View>
                                        
                                        {/* Enhanced Empty State */}
                                        <View className="bg-surface rounded-3xl p-6 shadow-sm items-center">
                                            <View className="bg-primary-soft rounded-3xl p-5 mb-4">
                                                <Ionicons name="cube-outline" size={40} color="#2563eb" />
                                            </View>
                                            <Text className="text-text text-lg font-bold mb-2 text-center">
                                                No Active Storage
                                            </Text>
                                            <Text className="text-text-secondary text-sm text-center mb-5 leading-5 max-w-[280px]">
                                                You don&apos;t have any items in storage right now. Start by finding a nearby storage space for your belongings.
                                            </Text>
                                            <TouchableOpacity 
                                                className="bg-primary rounded-2xl py-3 px-6 flex-row items-center shadow-lg"
                                                style={{
                                                    shadowColor: '#2563eb',
                                                    shadowOpacity: 0.3,
                                                    shadowRadius: 8,
                                                    shadowOffset: { width: 0, height: 4 },
                                                    elevation: 6
                                                }}
                                                onPress={() => router.push('/(root)/find-storage')}
                                                activeOpacity={0.9}
                                            >
                                                <Ionicons name="search" size={18} color="white" className="mr-2" />
                                                <Text className="text-white text-base font-semibold">
                                                    Find Storage
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </>
                        )}
                    </View>

                </ScrollView>
            </SafeAreaView>
            
            <CustomModal
                isVisible={modalState.isVisible}
                type={modalState.type}
                title={modalState.title}
                message={modalState.message}
                onConfirm={hideModal}
            />
        </View>
    )
}

export default Home