import { CountdownDisplay } from '@/components/CountdownDisplay'
import { StorageDisplayCard } from '@/components/StorageDisplayCard'
import { UserAvatar } from '@/components/UserAvatar'
import { useRealTimeCountdown } from '@/hooks/useRealTimeCountdown'
// import { useStorageNotifications } from '@/hooks/useStorageNotifications' // Disabled for Expo Go
import { palette } from '@/constants'
import { useBulkOrderCountdown } from '@/lib/hooks/useBulkOrderCountdown'
import { AvailableStatus, useStorageList } from '@/lib/query/hooks'
import { useCalculateFinalAmount, useUserOrders } from '@/lib/query/hooks/useOrderQueries'
import { filterStoragesByRadius } from '@/lib/utils/distance'
import { useLocationStore, useUserStore } from '@/store'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Alert,
    AppState,
    Linking,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import {
    Easing,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

const Home = () => {
    const router = useRouter()
    const { setUserLocation, userAddress, userLatitude, userLongitude } = useLocationStore()
    const { user: currentUser } = useUserStore()

    // Create a state to store detailed address info
    const [detailedAddress, setDetailedAddress] = useState<any>(null)

    // Function to open Google Maps
    const openGoogleMaps = useCallback((address: string) => {
        const encodedAddress = encodeURIComponent(address);
        const url = `https://maps.google.com/?q=${encodedAddress}`;
        
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert('Error', 'Cannot open Google Maps');
            }
        });
    }, [])


    // Fetch nearby storages (5km radius)
    const { data: storagesResponse } = useStorageList({
        status: AvailableStatus.AVAILABLE,
        limit: 20,
    });

    const nearbyStorages = useMemo(() => {
        if (!userLatitude || !userLongitude || !storagesResponse?.data?.data) return [];
        
        return filterStoragesByRadius(
            userLatitude, 
            userLongitude, 
            storagesResponse.data.data, 
            5 // 5km radius
        ).slice(0, 5); // Top 5 nearest
    }, [userLatitude, userLongitude, storagesResponse]);

    // Fetch user orders using corrected userId-based API
    const userId = currentUser?.id
    const { data: activeOrdersResponse } = useUserOrders(userId || '', {
        Status: 'IN_STORAGE',
    });
    
    const activeOrders = useMemo(() => {
        return (activeOrdersResponse as any)?.data?.data || [];
    }, [activeOrdersResponse]);

    // Extract order IDs for bulk countdown
    const activeOrderIds = useMemo(() => {
        return activeOrders.map((order: any) => order.id).filter(Boolean);
    }, [activeOrders]);

    // Use bulk countdown hook with 10-minute server sync interval
    const {
        loading: countdownLoading,
        error: countdownError,
        lastSyncTime,
        getCountdownForOrder,
        refreshFromServer: refreshCountdowns
    } = useBulkOrderCountdown(activeOrderIds, 10 * 60 * 1000); // 10 minutes

    // Log countdown sync status
    useEffect(() => {
        if (lastSyncTime) {
            console.log('🕒 Last countdown sync:', lastSyncTime.toLocaleTimeString());
        }
        if (countdownError) {
            console.error('❌ Countdown error:', countdownError);
        }
    }, [lastSyncTime, countdownError]);

    // Subtle animations
    const breatheValue = useSharedValue(1)
    const floatValue = useSharedValue(0)

    useEffect(() => {
        breatheValue.value = withRepeat(
            withTiming(1.02, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        )

        floatValue.value = withRepeat(
            withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        )
    }, [breatheValue, floatValue])

    const formatAddressShort = useCallback((addressObj: any, maxLength = 45) => {
        if (!addressObj) return '';
        
        const { street, streetNumber, district, city, region } = addressObj;
        
        // Build address parts in priority order
        const parts = [];
        
        if (streetNumber && street) {
            parts.push(`${streetNumber} ${street}`);
        } else if (street) {
            parts.push(street);
        }
        
        if (district) {
            parts.push(district);
        }
        
        if (city) {
            if (city.includes('Hồ Chí Minh') || city.includes('Ho Chi Minh')) {
                parts.push('TP.HCM');
            } else if (city.includes('Hà Nội')) {
                parts.push('Hà Nội');
            } else {
                parts.push(city);
            }
        } else if (region) {
            parts.push(region);
        }
        
        let result = parts.filter(Boolean).join(', ');
        return result.length > maxLength ? result.slice(0, maxLength - 3) + '...' : result;
    }, [])

    // Enhanced address formatting with more detailed info
    const formatAddressDetailed = useCallback((addressObj: any) => {
        if (!addressObj) return { primary: 'Unknown Location', secondary: '' };
        
        const { 
            street, 
            streetNumber, 
            name, 
            city, 
            district, 
            region,
            subregion,
            formattedAddress
        } = addressObj;

        // Optimized: Only log once per unique address object to prevent render loops
        // console.log('Address Object:', addressObj); // Debug log - DISABLED to prevent continuous rendering

        // If we have formattedAddress, use it as a base but make it more readable
        if (formattedAddress) {
            // Extract meaningful parts from formatted address
            const addressParts = formattedAddress.split(', ');
            
            // Primary: Street number + Street name (most specific)
            let primary = '';
            if (streetNumber && street) {
                primary = `${streetNumber} ${street}`;
            } else if (name && streetNumber) {
                primary = `${streetNumber} ${street || 'Đường Nam Cao'}`;
            } else if (addressParts[0]) {
                primary = addressParts[0]; // First part usually most specific
            }

            // Secondary: Area hierarchy (Ward → District → City)
            let secondary = '';
            const secondaryParts = [];
            
            // Add subregion (Thủ Đức, Quận X, etc.)
            if (subregion && subregion !== region) {
                if (subregion.includes('Thủ Đức')) {
                    secondaryParts.push('TP. Thủ Đức');
                } else {
                    secondaryParts.push(subregion);
                }
            }
            
            // Add region (TP.HCM, Hà Nội, etc.)  
            if (region) {
                if (region.includes('Hồ Chí Minh') || region.includes('Ho Chi Minh')) {
                    secondaryParts.push('TP.HCM');
                } else if (region.includes('Hà Nội')) {
                    secondaryParts.push('Hà Nội');
                } else {
                    secondaryParts.push(region);
                }
            }

            secondary = secondaryParts.slice(0, 2).join(', ');

            return {
                primary: primary.length > 40 ? primary.slice(0, 37) + '...' : primary,
                secondary: secondary.length > 35 ? secondary.slice(0, 32) + '...' : secondary,
                fullAddress: formattedAddress // Keep full address for Google Maps
            };
        }

        // Fallback to manual construction if no formattedAddress
        let primary = '';
        if (name && !name.includes('Unnamed')) {
            primary = name;
        } else if (streetNumber && street) {
            primary = `${streetNumber} ${street}`;
        } else if (street) {
            primary = street;
        } else {
            primary = district || city || subregion || 'Unknown Location';
        }

        let secondary = '';
        const secondaryParts = [];
        
        if (district && !primary.includes(district)) {
            secondaryParts.push(district);
        }
        if (subregion && subregion !== district) {
            secondaryParts.push(subregion);
        }
        if (region) {
            if (region.includes('Hồ Chí Minh')) {
                secondaryParts.push('TP.HCM');
            } else if (region.includes('Hà Nội')) {
                secondaryParts.push('Hà Nội');
            } else {
                secondaryParts.push(region);
            }
        }

        secondary = secondaryParts.slice(0, 3).join(', ');

        return {
            primary: primary.length > 40 ? primary.slice(0, 37) + '...' : primary,
            secondary: secondary.length > 35 ? secondary.slice(0, 32) + '...' : secondary,
            fullAddress: `${primary}, ${secondary}` // Construct full address
        };
    }, [])

    const requestLocationPermission = useCallback(async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert(
                    'Location Permission Required',
                    'Please enable location services to find nearby storage options.',
                    [{ text: 'OK' }]
                )
                return
            }
            
            // Get current position with timeout
            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            })
            
            // Set location with coordinates even if reverse geocoding fails
            const locationData: any = {
                latitude: location.coords?.latitude,
                longitude: location.coords?.longitude,
                address: 'Current Location', // Default fallback
                addressObj: null, // Store full address object
            }
            
            // Try reverse geocoding with error handling
            try {
                const address = await Location.reverseGeocodeAsync({
                    latitude: location.coords?.latitude!,
                    longitude: location.coords?.longitude!,
                })
                
                if (address && address.length > 0) {
                    locationData.addressObj = address[0]; // Store full object
                    locationData.address = formatAddressShort(address[0]);
                    setDetailedAddress(address[0]); // Store detailed address for UI
                    
                    // Optimized debug logs - Only log once to prevent continuous rendering
                    console.log('🏠 Location Updated:', {
                        latitude: location.coords?.latitude,
                        longitude: location.coords?.longitude,
                        address: locationData.address
                    });
                }
            } catch (geocodingError) {
                console.warn('Reverse geocoding failed:', geocodingError)
                // Keep the default 'Current Location' address
            }
            
            setUserLocation(locationData)
        } catch (error) {
            console.error('Location permission error:', error)
            
            // Provide user feedback for common errors
            const errorMessage = error instanceof Error ? error.message : String(error)
            if (errorMessage?.includes('UNAVAILABLE') || errorMessage?.includes('NETWORK')) {
                Alert.alert(
                    'Location Service Unavailable',
                    'Location services are temporarily unavailable. Please check your internet connection and try again.',
                    [{ text: 'OK' }]
                )
            } else if (errorMessage?.includes('TIMEOUT')) {
                Alert.alert(
                    'Location Timeout',
                    'Getting your location is taking too long. Please try again.',
                    [{ text: 'OK' }]
                )
            }
        }
    }, [setUserLocation, formatAddressShort])

    useEffect(() => {
        requestLocationPermission()
    }, [requestLocationPermission])

    const isKeeper = currentUser?.role === 'KEEPER'

    // Quick Actions based on user role
    const renterQuickActions = [
        {
            title: 'Storage',
            icon: 'location',
            color: palette.primary,
            onPress: () => router.push('/(root)/find-storage'),
        },
        {
            title: 'My Orders',
            icon: 'bag',
            color: palette.accent,
            onPress: () => router.push('/(root)/(tabs)/orders'),
        },
        {
            title: 'Reviews',
            icon: 'heart',
            color: palette.success,
            onPress: () => router.push('/(root)/(tabs)/reviews'),
        },
        {
            title: 'Profile',
            icon: 'person-circle',
            color: palette.warning,
            onPress: () => router.push('/(root)/(tabs)/profile'),
        },
    ]

    const keeperQuickActions = [
        {
            title: 'Storages',
            icon: 'location',
            color: palette.primary,
            onPress: () => router.push('/(root)/keeper-storages'),
        },
        {
            title: 'Orders',
            icon: 'bag',
            color: palette.accent,
            onPress: () => router.push('/(root)/order-management'),
        },
        {
            title: 'Reviews',
            icon: 'heart',
            color: palette.success,
            onPress: () => router.push('/(root)/review-management'),
        },
        {
            title: 'Profile',
            icon: 'person-circle',
            color: palette.warning,
            onPress: () => router.push('/(root)/(tabs)/profile'),
        },
    ]

    const quickActions = isKeeper ? keeperQuickActions : renterQuickActions

    return (
        <View className="flex-1 bg-background">
            <StatusBar barStyle="dark-content" backgroundColor={palette.background} />
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
                            
                            <View className="relative">
                                <UserAvatar 
                                    username={currentUser?.username || 'User'} 
                                    size={44} 
                                />
                                {/* Online status indicator */}
                                <View className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white" />
                            </View>
                        </View>

                        {/* Location section - enhanced with detailed info */}
                        <TouchableOpacity 
                            className="flex-row items-center"
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
                                <Ionicons name="location" size={14} color={palette.primary} />
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
                            <Ionicons name="open-outline" size={12} color={palette.textSecondary} className="ml-1" />
                        </TouchableOpacity>
                    </View>

                    {/* Main Action Card - Different for Keeper vs Renter */}
                    <View className="mt-4 mx-4">
                        <View style={{
                            shadowColor: palette.primary,
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
                                                <Ionicons name="location" size={18} color={palette.primary} />
                                                <Text className="text-text text-base font-semibold ml-2.5 flex-1">
                                                    Browse Storage
                                                </Text>
                                                <Ionicons name="arrow-forward" size={18} color={palette.primary} />
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Quick Actions grid - 4 icons in 1 row */}
                    <View className="mt-5 mx-4">
                        <View className="flex-row justify-between">
                            {quickActions.map((action, idx) => (
                                <TouchableOpacity 
                                    key={action.title} 
                                    onPress={action.onPress} 
                                    className="w-[23%] aspect-square items-center justify-center bg-surface rounded-2xl p-2 shadow-sm"
                                    style={{
                                        shadowColor: palette.shadow,
                                        shadowOpacity: 0.06,
                                        shadowRadius: 8,
                                        shadowOffset: { width: 0, height: 2 },
                                        elevation: 4
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name={action.icon as any} size={32} color={action.color} />
                                    <Text className="text-text text-xs font-semibold text-center mt-1 leading-3">
                                        {action.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Content Section - Different for Keeper vs Renter */}
                    <View className="mt-5 mx-4">
                        {isKeeper ? (
                            <>
                                {/* Keeper Dashboard - Content removed per user request */}
                                <View className="bg-surface rounded-2xl p-5 items-center shadow-sm">
                                    <Ionicons name="business" size={48} color={palette.textSecondary} />
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
                                            <View className="flex-row items-center">
                                                <View className="bg-primary-soft rounded-xl p-2 mr-3">
                                                    <Ionicons name="location" size={20} color={palette.primary} />
                                                </View>
                                                <View>
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
                                                    See all
                                                </Text>
                                                <Ionicons name="arrow-forward" size={12} color={palette.primary} />
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
                                            <View className="flex-row items-center">
                                                <View className="bg-cyan-50 rounded-xl p-2 mr-3">
                                                    <Ionicons name="cube" size={20} color="#06b6d4" />
                                                </View>
                                                <View>
                                                    <Text className="text-slate-800 text-lg font-bold mb-0.5">
                                                        My Active Storage
                                                    </Text>
                                                    <Text className="text-slate-600 text-sm font-medium">
                                                        {activeOrders.length} item{activeOrders.length > 1 ? 's' : ''} currently stored
                                                        {lastSyncTime && (
                                                            <Text className="text-xs text-blue-600">
                                                                {' • Synced '}
                                                                {Math.floor((new Date().getTime() - lastSyncTime.getTime()) / 60000)}m ago
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
                                                        color={palette.primary} 
                                                    />
                                                </TouchableOpacity>
                                                <TouchableOpacity 
                                                    onPress={() => router.push('/(root)/(tabs)/orders')}
                                                    className="flex-row items-center bg-accent-soft px-3 py-2 rounded-full"
                                                    activeOpacity={0.8}
                                                >
                                                    <Text className="text-accent text-sm font-semibold mr-1">
                                                        View all
                                                    </Text>
                                                    <Ionicons name="arrow-forward" size={12} color={palette.accent} />
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
                                            <View className="flex-row items-center">
                                                <View className="bg-surfaceVariant rounded-xl p-2 mr-3">
                                                    <Ionicons name="cube-outline" size={20} color={palette.textSecondary} />
                                                </View>
                                                <View>
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
                                                    See all
                                                </Text>
                                                <Ionicons name="arrow-forward" size={12} color={palette.textSecondary} />
                                            </TouchableOpacity>
                                        </View>
                                        
                                        {/* Enhanced Empty State */}
                                        <View className="bg-surface rounded-3xl p-6 shadow-sm items-center">
                                            <View className="bg-primary-soft rounded-3xl p-5 mb-4">
                                                <Ionicons name="cube-outline" size={40} color={palette.primary} />
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
                                                    shadowColor: palette.primary,
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
        </View>
    )
}

// ActiveStorageCard Component with App State Management (Notifications disabled for Expo Go)
const ActiveStorageCard = React.memo(({ 
    order, 
    serverCountdown = null, 
    loading = false 
}: { 
    order: any; 
    serverCountdown?: any; 
    loading?: boolean; 
}) => {
    const router = useRouter();
    const [appState, setAppState] = useState(AppState.currentState);
    // const { scheduleOrderNotifications } = useStorageNotifications(); // Disabled for Expo Go
    
    const { data: finalAmountData } = useCalculateFinalAmount(order.id, {
        refetchInterval: 30000, // Update every 30s
        enabled: !!order.id
    });

    // Stabilize the countdown inputs to prevent infinite re-renders
    const startKeepTime = useMemo(() => {
        // Use server countdown data first, then fallback to order data
        return serverCountdown?.startKeepTime || order.startKeepTime || new Date().toISOString();
    }, [serverCountdown?.startKeepTime, order.startKeepTime]);
    
    const estimatedDays = useMemo(() => {
        // Use server countdown data first, then fallback to order data
        return serverCountdown?.estimatedDays || order.estimatedDays || 1;
    }, [serverCountdown?.estimatedDays, order.estimatedDays]);
    
    // Always call hooks, but use server countdown if available
    const localCountdown = useRealTimeCountdown(startKeepTime, estimatedDays);
    const countdown = serverCountdown || localCountdown;

    // Extract complex expression for dependency
    const finalAmount = (finalAmountData as any)?.data?.finalAmount;

    // Debug logging (only when order or countdown changes)
    useEffect(() => {
        console.log('🔍 ActiveStorageCard Data Debug:');
        console.log('📦 Order Object:', JSON.stringify(order, null, 2));
        console.log('🏢 Storage Info:', {
            id: order.storage?.id || order.storageId,
            title: order.storage?.title,
            description: order.storage?.description,
            address: order.storage?.address,
            storageIdFromOrder: order.storageId
        });
        console.log('📋 Package Info:', {
            description: order.packageDescription,
            startTime: order.startKeepTime || 'No startKeepTime in order',
            estimatedDays: order.estimatedDays || 'No estimatedDays in order',
            totalAmount: order.totalAmount,
            serverStartTime: serverCountdown?.startKeepTime || 'No server startKeepTime',
            serverEstimatedDays: serverCountdown?.estimatedDays || 'No server estimatedDays'
        });
        console.log('📅 Date Formatting Test:', {
            raw: order.startKeepTime,
            serverRaw: serverCountdown?.startKeepTime,
            usingServerData: !!serverCountdown,
            finalStartTime: startKeepTime,
            formatted: startKeepTime ? 
                new Date(startKeepTime).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric'
                }) : 
                'Not started yet'
        });

        console.log('⏰ Server Countdown Data:', {
            serverCountdown,
            localCountdown,
            localStartKeepTime: startKeepTime,
            estimatedDays,
            finalCountdown: countdown,
            isExpired: countdown?.isExpired,
            countdownType: countdown ? ('formattedTimeRemaining' in countdown ? 'server' : 'local') : 'null',
            loading
        });

        console.log('💰 Final Amount Data:', finalAmountData);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order.id, serverCountdown?.startKeepTime, finalAmount]); // Only log when these key values change

    // Schedule notifications when order becomes active (Disabled for Expo Go)
    useEffect(() => {
        // if (order.id && order.startKeepTime && order.estimatedDays && !countdown.isExpired) {
        //     scheduleOrderNotifications(order);
        // }
        console.log('Notifications disabled for Expo Go compatibility');
    }, [order, countdown.isExpired]);

    // Handle app state changes for accurate countdown
    useEffect(() => {
        const handleAppStateChange = (nextAppState: any) => {
            if (appState.match(/inactive|background/) && nextAppState === 'active') {
                // App just came to foreground - countdown tự động cập nhật
                console.log('App returned to foreground, countdown will auto-update');
            }
            setAppState(nextAppState);
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [appState]);


    return (
        <TouchableOpacity 
            onPress={() => router.replace({
                pathname: '/(root)/orderdetails/[id]',
                params: { id: order.id }
            })}
            className="bg-surface rounded-3xl p-0 mb-3 shadow-lg border border-border"
            style={{
                shadowColor: palette.shadow,
                shadowOpacity: 0.12,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 8 },
                elevation: 8,
                borderWidth: 1,
                borderColor: palette.border
            }}
            activeOpacity={0.96}
        >
            {/* Top Section - Storage Header */}
            <View className="bg-primary-soft px-5 py-4 rounded-t-3xl border-b border-border">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <View className="bg-primary rounded-xl p-2.5 mr-3">
                            <Ionicons name="archive" size={18} color="white" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-text text-base font-bold mb-0.5" numberOfLines={1}>
                                {order.storage?.title || order.storage?.description || 'Storage Location'}
                            </Text>
                            <Text className="text-text-secondary text-sm font-medium" numberOfLines={2}>
                                Items: {order.packageDescription || 'Package stored'}
                            </Text>
                        </View>
                    </View>
                    <View className="bg-surface rounded-lg px-2 py-1">
                        <Text className="text-success text-xs font-bold uppercase">
                            ACTIVE
                        </Text>
                    </View>
                </View>
            </View>

            {/* Middle Section - Countdown */}
            <View className="px-5 py-6 items-center">
                <Text className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
                    STORAGE COUNTDOWN
                </Text>
                <CountdownDisplay countdown={countdown} />
                <Text className="text-text-secondary text-xs mt-4 text-center">
                    Started: {countdown?.startKeepTime ? 
                        new Date(countdown.startKeepTime).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric'
                        }) : 
                        order.startKeepTime ? 
                        new Date(order.startKeepTime).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric'
                        }) : 
                        'Not started yet'
                    }
                </Text>
            </View>

            {/* Bottom Section - Cost & Action */}
            <View className="bg-surfaceVariant px-5 py-4 rounded-b-3xl flex-row items-center justify-between">
                <View>
                    <Text className="text-text-secondary text-xs font-semibold uppercase mb-1">
                        TOTAL COST
                    </Text>
                    <Text className="text-text font-extrabold text-lg">
                        {(finalAmountData as any)?.data?.finalAmount ? 
                            `${(finalAmountData as any).data.finalAmount.toLocaleString()}` : 
                            `${(order.totalAmount || 0).toLocaleString()}`
                        } <Text className="text-xs text-text-secondary">VND</Text>
                    </Text>
                </View>
                <View className="bg-primary rounded-2xl px-4 py-2.5 flex-row items-center shadow-lg"
                    style={{
                        shadowColor: palette.primary,
                        shadowOpacity: 0.4,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 6
                    }}
                >
                    <Ionicons name="chevron-forward" size={14} color="white" />
                    <Text className="text-white font-bold text-xs ml-1">
                        VIEW
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
});

ActiveStorageCard.displayName = 'ActiveStorageCard';

export default Home