import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
    Alert,
    Image,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { authAPI } from '@/lib/api'
import { Order } from '@/lib/types'
import { useLocationStore, useUserStore } from '@/store'

// Sophisticated neutral palette
const palette = {
    background: '#fafafa',
    surface: '#ffffff',
    surfaceVariant: '#f8f9fa',
    primary: '#2563eb',
    primarySoft: '#dbeafe',
    secondary: '#64748b',
    accent: '#06b6d4',
    accentSoft: '#e0f7fa',
    success: '#059669',
    successSoft: '#d1fae5',
    warning: '#d97706',
    warningSoft: '#fed7aa',
    text: '#1e293b',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    border: '#e2e8f0',
    shadow: 'rgba(15, 23, 42, 0.08)'
}

const Home = () => {
    const router = useRouter()
    const { setUserLocation, userAddress } = useLocationStore()
    const { user: currentUser, clearUser } = useUserStore()
    const [hasPermission, setHasPermission] = useState<boolean>(false)
    const [recentOrders] = useState<Order[]>([])

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

    const breatheStyle = useAnimatedStyle(() => ({
        transform: [{ scale: breatheValue.value }],
    }))

    const floatStyle = useAnimatedStyle(() => ({
        transform: [{ 
            translateY: interpolate(floatValue.value, [0, 1], [0, -6])
        }],
    }))

    useEffect(() => {
        requestLocationPermission()
    }, [requestLocationPermission])

    const formatAddress = (addressObj: any) => {
        if (!addressObj) return '';
        const { street, name, region, city, postalCode, country } = addressObj;
        return [street, name, region, city, postalCode, country].filter(Boolean).join(', ');
    };

    const formatAddressShort = useCallback((addressObj: any, maxLength = 32) => {
        if (!addressObj) return '';
        const { street, city, country } = addressObj;
        let result = [street, city, country].filter(Boolean).join(', ');
        return result.length > maxLength ? result.slice(0, maxLength - 3) + '...' : result;
    }, [])

    const requestLocationPermission = useCallback(async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
                setHasPermission(false)
                Alert.alert(
                    'Location Permission Required',
                    'Please enable location services to find nearby storage options.',
                    [{ text: 'OK' }]
                )
                return
            }
            setHasPermission(true)
            
            // Get current position with timeout
            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            })
            
            // Set location with coordinates even if reverse geocoding fails
            const locationData = {
                latitude: location.coords?.latitude,
                longitude: location.coords?.longitude,
                address: 'Current Location', // Default fallback
            }
            
            // Try reverse geocoding with error handling
            try {
                const address = await Location.reverseGeocodeAsync({
                    latitude: location.coords?.latitude!,
                    longitude: location.coords?.longitude!,
                })
                
                if (address && address.length > 0) {
                    locationData.address = formatAddressShort(address[0])
                }
            } catch (geocodingError) {
                console.warn('Reverse geocoding failed:', geocodingError)
                // Keep the default 'Current Location' address
            }
            
            setUserLocation(locationData)
        } catch (error) {
            console.error('Location permission error:', error)
            setHasPermission(false)
            
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
    }, [setUserLocation, setHasPermission, formatAddressShort])

    const handleSignOut = async () => {
        await authAPI.logout()
        clearUser()
        router.replace('/(auth)/sign-in')
    }

    const isKeeper = currentUser?.role === 'KEEPER'

    // Quick Actions based on user role
    const renterQuickActions = [
        {
            title: 'Find Storage',
            icon: 'search-outline',
            color: palette.primary,
            background: palette.primarySoft,
            onPress: () => router.push('/(root)/find-storage'),
        },
        {
            title: 'My Orders',
            icon: 'receipt-outline',
            color: palette.accent,
            background: palette.accentSoft,
            onPress: () => router.push('/(root)/(tabs)/rides'),
        },
        {
            title: 'Support',
            icon: 'help-circle-outline',
            color: palette.success,
            background: palette.successSoft,
            onPress: () => router.push('/(root)/(tabs)/chat'),
        },
        {
            title: 'Profile',
            icon: 'person-outline',
            color: palette.warning,
            background: palette.warningSoft,
            onPress: () => router.push('/(root)/(tabs)/profile'),
        },
    ]

    const keeperQuickActions = [
        {
            title: 'My Storages',
            icon: 'business-outline',
            color: palette.primary,
            background: palette.primarySoft,
            onPress: () => router.push('/(root)/keeper-storages'),
        },
        {
            title: 'Add Storage',
            icon: 'add-circle-outline',
            color: palette.accent,
            background: palette.accentSoft,
            onPress: () => router.push('/(root)/add-storage'),
        },
        {
            title: 'Analytics',
            icon: 'analytics-outline',
            color: palette.success,
            background: palette.successSoft,
            onPress: () => router.push('/(root)/keeper-analytics'),
        },
        {
            title: 'Profile',
            icon: 'person-outline',
            color: palette.warning,
            background: palette.warningSoft,
            onPress: () => router.push('/(root)/(tabs)/profile'),
        },
    ]

    const quickActions = isKeeper ? keeperQuickActions : renterQuickActions

    return (
        <View style={{ flex: 1, backgroundColor: palette.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={palette.background} />
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                    {/* Header: avatar, username, logout, location */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Image source={{ uri: 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif' }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 14 }} />
                            <View>
                                <Text style={{ color: palette.text, fontSize: 17, fontWeight: '700' }}>{currentUser?.username || 'User'}</Text>
                                <Text style={{ color: palette.textSecondary, fontSize: 13, marginTop: 2 }}>{userAddress || 'Detecting location...'}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={handleSignOut} style={{ backgroundColor: palette.surface, borderRadius: 16, padding: 8 }}>
                            <Ionicons name="log-out-outline" size={22} color={palette.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Main Action Card - Different for Keeper vs Renter */}
                    <View style={{ marginTop: 28, marginHorizontal: 24 }}>
                        <View style={{ backgroundColor: palette.primary, borderRadius: 28, padding: 24, shadowColor: palette.primary, shadowOpacity: 0.08, shadowRadius: 12 }}>
                            {isKeeper ? (
                                <>
                                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 10 }}>Manage Your Storage Business</Text>
                                    <Text style={{ color: 'white', fontSize: 14, marginBottom: 18 }}>View orders, manage spaces, and grow your revenue</Text>
                                    <TouchableOpacity 
                                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 }}
                                        onPress={() => router.push('/(root)/keeper-storage-list')}
                                    >
                                        <Ionicons name="business-outline" size={20} color={palette.primary} />
                                        <Text style={{ color: palette.textSecondary, fontSize: 15, marginLeft: 8, flex: 1 }}>View my storage locations</Text>
                                        <Ionicons name="arrow-forward-outline" size={20} color={palette.primary} />
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 10 }}>Find Storage Near You</Text>
                                    <Text style={{ color: 'white', fontSize: 14, marginBottom: 18 }}>Connect with trusted keepers in your area</Text>
                                    <TouchableOpacity 
                                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 }}
                                        onPress={() => router.push('/(root)/find-storage')}
                                    >
                                        <Ionicons name="search-outline" size={20} color={palette.primary} />
                                        <Text style={{ color: palette.textSecondary, fontSize: 15, marginLeft: 8, flex: 1 }}>Search storage locations</Text>
                                        <Ionicons name="location-outline" size={20} color={palette.primary} />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>

                    {/* Quick Actions grid */}
                    <View style={{ marginTop: 28, marginHorizontal: 24 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            {quickActions.slice(0,2).map((action, idx) => (
                                <TouchableOpacity key={action.title} onPress={action.onPress} style={{ flex: 1, alignItems: 'center', marginHorizontal: 6 }}>
                                    <View style={{ backgroundColor: action.background, borderRadius: 16, padding: 14, marginBottom: 8 }}>
                                        <Ionicons name={action.icon as any} size={24} color={action.color} />
                                    </View>
                                    <Text style={{ color: palette.text, fontSize: 14, fontWeight: '600' }}>{action.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                            {quickActions.slice(2,4).map((action, idx) => (
                                <TouchableOpacity key={action.title} onPress={action.onPress} style={{ flex: 1, alignItems: 'center', marginHorizontal: 6 }}>
                                    <View style={{ backgroundColor: action.background, borderRadius: 16, padding: 14, marginBottom: 8 }}>
                                        <Ionicons name={action.icon as any} size={24} color={action.color} />
                                    </View>
                                    <Text style={{ color: palette.text, fontSize: 14, fontWeight: '600' }}>{action.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Content Section - Different for Keeper vs Renter */}
                    <View style={{ marginTop: 32, marginHorizontal: 24 }}>
                        {isKeeper ? (
                            <>
                                {/* Keeper Dashboard */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <Text style={{ color: palette.text, fontSize: 17, fontWeight: '700' }}>Recent Activity</Text>
                                    <TouchableOpacity onPress={() => router.push('/(root)/keeper-storage-list')}>
                                        <Text style={{ color: palette.primary, fontSize: 13, fontWeight: '600' }}>View all</Text>
                                    </TouchableOpacity>
                                </View>
                                
                                {/* Pending Orders Alert */}
                                <View style={{ backgroundColor: palette.warningSoft, borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: palette.warning }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                        <Ionicons name="time-outline" size={20} color={palette.warning} />
                                        <Text style={{ color: palette.warning, fontSize: 16, fontWeight: '700', marginLeft: 8 }}>3 Orders Need Attention</Text>
                                    </View>
                                    <Text style={{ color: palette.warning, fontSize: 13, marginBottom: 12 }}>
                                        You have pending orders that require confirmation or package receipt.
                                    </Text>
                                    <TouchableOpacity
                                        style={{ backgroundColor: palette.warning, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start' }}
                                        onPress={() => router.push('/(root)/keeper-storage-list')}
                                    >
                                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>Review Orders</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Storage Performance */}
                                <View style={{ backgroundColor: palette.surface, borderRadius: 24, padding: 20, shadowColor: palette.shadow, shadowOpacity: 0.08, shadowRadius: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                        <Ionicons name="analytics-outline" size={28} color={palette.primary} />
                                        <View style={{ marginLeft: 12 }}>
                                            <Text style={{ color: palette.text, fontSize: 16, fontWeight: '700' }}>This Month's Performance</Text>
                                            <Text style={{ color: palette.textSecondary, fontSize: 13 }}>January 2024</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <View style={{ alignItems: 'center', flex: 1 }}>
                                            <Text style={{ color: palette.primary, fontSize: 20, fontWeight: '700' }}>20</Text>
                                            <Text style={{ color: palette.textSecondary, fontSize: 12 }}>Completed Orders</Text>
                                        </View>
                                        <View style={{ alignItems: 'center', flex: 1 }}>
                                            <Text style={{ color: palette.success, fontSize: 20, fontWeight: '700' }}>2.4M</Text>
                                            <Text style={{ color: palette.textSecondary, fontSize: 12 }}>VND Earned</Text>
                                        </View>
                                        <View style={{ alignItems: 'center', flex: 1 }}>
                                            <Text style={{ color: palette.warning, fontSize: 20, fontWeight: '700' }}>4.8</Text>
                                            <Text style={{ color: palette.textSecondary, fontSize: 12 }}>Avg Rating</Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity 
                                        style={{ 
                                            backgroundColor: palette.primary, 
                                            borderRadius: 12, 
                                            paddingVertical: 10, 
                                            paddingHorizontal: 16, 
                                            marginTop: 8,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        onPress={() => router.push('/(root)/keeper-analytics')}
                                    >
                                        <Ionicons name="analytics-outline" size={18} color="white" style={{ marginRight: 8 }} />
                                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>View Analytics</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <>
                                {/* Renter Dashboard - My Stored Items */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <Text style={{ color: palette.text, fontSize: 17, fontWeight: '700' }}>My Stored Items</Text>
                                    <TouchableOpacity onPress={() => router.push('/(root)/(tabs)/rides')}>
                                        <Text style={{ color: palette.primary, fontSize: 13, fontWeight: '600' }}>See all</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ backgroundColor: palette.surface, borderRadius: 24, padding: 20, shadowColor: palette.shadow, shadowOpacity: 0.08, shadowRadius: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                        <Ionicons name="archive-outline" size={28} color={palette.primary} />
                                        <View style={{ marginLeft: 12 }}>
                                            <Text style={{ color: palette.text, fontSize: 16, fontWeight: '700' }}>Personal Electronics</Text>
                                            <Text style={{ color: palette.textSecondary, fontSize: 13 }}>#Storage ID: S2024001</Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                        <Ionicons name="business-outline" size={16} color={palette.primary} />
                                        <Text style={{ color: palette.textSecondary, fontSize: 13, marginLeft: 6 }}>Stored at: Tu ban quan ao</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                        <Ionicons name="person-outline" size={16} color={palette.primary} />
                                        <Text style={{ color: palette.textSecondary, fontSize: 13, marginLeft: 6 }}>Keeper: Huy Nguyen</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                        <Ionicons name="time-outline" size={16} color={palette.primary} />
                                        <Text style={{ color: palette.textSecondary, fontSize: 13, marginLeft: 6 }}>Stored since: 3 days ago</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.success, marginRight: 6 }} />
                                        <Text style={{ color: palette.textSecondary, fontSize: 13 }}>Status: Items safely stored</Text>
                                    </View>
                                    
                                    {/* Collect Items Button */}
                                    <TouchableOpacity 
                                        style={{ 
                                            backgroundColor: palette.primary, 
                                            borderRadius: 12, 
                                            paddingVertical: 10, 
                                            paddingHorizontal: 16, 
                                            marginTop: 12,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        onPress={() => {
                                            Alert.alert(
                                                'Collect Your Items',
                                                'Ready to collect your stored items from the keeper?\n\n• Storage duration: 3 days\n• Estimated cost: ~150,000 VND\n• Payment will be calculated when you arrive\n\nContact Huy Nguyen to arrange pickup time.',
                                                [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    { text: 'Contact Keeper', onPress: () => {
                                                        Alert.alert('Contact Keeper', 'Feature coming soon! You can call or message the keeper directly.')
                                                    }},
                                                    { text: 'Go to Storage', onPress: () => {
                                                        router.push('/(root)/collection-payment')
                                                    }}
                                                ]
                                            )
                                        }}
                                    >
                                        <Ionicons name="cube-outline" size={18} color="white" style={{ marginRight: 8 }} />
                                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Collect Items</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Bottom navigation (placeholder) */}
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 32, paddingBottom: 18 }}>
                        <View style={{ flexDirection: 'row', backgroundColor: palette.surface, borderRadius: 24, shadowColor: palette.shadow, shadowOpacity: 0.08, shadowRadius: 8, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 14 }}>
                            <TouchableOpacity><Ionicons name="home" size={24} color={palette.primary} /></TouchableOpacity>
                            <TouchableOpacity><Ionicons name="cube-outline" size={24} color={palette.accent} /></TouchableOpacity>
                            <TouchableOpacity><Ionicons name="add-circle-outline" size={28} color={palette.primary} /></TouchableOpacity>
                            <TouchableOpacity><Ionicons name="person-outline" size={24} color={palette.warning} /></TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    )
}

export default Home