import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'

interface StorageData {
    id: string
    title?: string
    description?: string
    address: string
    images?: string[]
    rating?: number
    pricePerDay?: number
    distance?: number
    status?: string
    latitude?: number
    longitude?: number
    keeperId?: string
    keeperName?: string
    keeperPhoneNumber?: string
}

interface StorageDisplayCardProps {
    storage: StorageData
    onPress: (storage: StorageData) => void
    variant?: 'grid' | 'horizontal'
    width?: number | string
}

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

export const StorageDisplayCard: React.FC<StorageDisplayCardProps> = ({ 
    storage, 
    onPress, 
    variant = 'grid',
    width = variant === 'grid' ? '48%' : 180
}) => {
    const displayTitle = storage.title || storage.description || 'Storage Space'
    const displayRating = storage.rating || 0
    const displayDistance = storage.distance || 0
    const displayImage = storage.images?.[0] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'

    if (variant === 'horizontal') {
        // Enhanced horizontal card for home screen
        return (
            <TouchableOpacity
                onPress={() => onPress(storage)}
                style={{
                    backgroundColor: palette.surface,
                    borderRadius: 16,
                    padding: 0,
                    width: typeof width === 'number' ? width : parseInt(width),
                    shadowColor: palette.shadow,
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 6,
                    overflow: 'hidden'
                }}
                activeOpacity={0.95}
            >
                {/* Image Section */}
                <View style={{ position: 'relative', height: 100 }}>
                    <Image
                        source={{ uri: displayImage }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                    {/* Gradient Overlay */}
                    <View
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.15)',
                        }}
                    />
                    {/* Distance Badge */}
                    <View style={{ 
                        position: 'absolute', 
                        top: 8, 
                        left: 8, 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                        borderRadius: 12, 
                        paddingHorizontal: 8, 
                        paddingVertical: 4,
                        flexDirection: 'row',
                        alignItems: 'center'
                    }}>
                        <Ionicons name="location" size={10} color={palette.success} />
                        <Text style={{ 
                            color: palette.success, 
                            fontSize: 11, 
                            fontWeight: '600',
                            marginLeft: 2
                        }}>
                            {displayDistance.toFixed(1)} km
                        </Text>
                    </View>
                </View>

                {/* Content Section */}
                <View style={{ padding: 12 }}>
                    {/* Title with Icon */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <View style={{ 
                            backgroundColor: palette.primarySoft, 
                            borderRadius: 6, 
                            padding: 4, 
                            marginRight: 8 
                        }}>
                            <Ionicons name="business" size={12} color={palette.primary} />
                        </View>
                        <Text 
                            style={{ 
                                color: palette.text, 
                                fontSize: 14, 
                                fontWeight: '700',
                                flex: 1
                            }} 
                            numberOfLines={1}
                        >
                            {displayTitle}
                        </Text>
                    </View>

                    {/* Address */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                        <Ionicons 
                            name="location-outline" 
                            size={12} 
                            color={palette.textSecondary} 
                            style={{ marginTop: 1, marginRight: 4 }}
                        />
                        <Text 
                            style={{ 
                                color: palette.textSecondary, 
                                fontSize: 12, 
                                flex: 1,
                                lineHeight: 16
                            }} 
                            numberOfLines={2}
                        >
                            {storage.address}
                        </Text>
                    </View>

                    {/* Rating */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text style={{ 
                            color: palette.textSecondary, 
                            fontSize: 12, 
                            fontWeight: '500',
                            marginLeft: 4
                        }}>
                            {displayRating.toFixed(1)} rating
                        </Text>
                        <View style={{ 
                            backgroundColor: palette.successSoft, 
                            borderRadius: 8, 
                            paddingHorizontal: 6, 
                            paddingVertical: 2,
                            marginLeft: 'auto'
                        }}>
                            <Text style={{ 
                                color: palette.success, 
                                fontSize: 10, 
                                fontWeight: '600' 
                            }}>
                                Available
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    // Grid card for find-storage screen
    const gridCardStyle: any = {
        backgroundColor: palette.surface,
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        width: width,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
    }

    return (
        <TouchableOpacity
            onPress={() => onPress(storage)}
            style={gridCardStyle}
            activeOpacity={0.95}
        >
            {/* Image with Overlay */}
            <View style={{ position: 'relative' }}>
                <Image
                    source={{ uri: displayImage }}
                    style={{ width: '100%', height: 112 }}
                    resizeMode="cover"
                />
                {/* Subtle Dark Overlay */}
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    }}
                />


                {/* Distance Badge */}
                <View style={{ 
                    position: 'absolute', 
                    bottom: 8, 
                    left: 8, 
                    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
                    borderRadius: 8, 
                    paddingHorizontal: 8, 
                    paddingVertical: 2 
                }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
                        {displayDistance.toFixed(1)} km
                    </Text>
                </View>
            </View>

            {/* Content Section */}
            <View style={{ padding: 12 }}>
                {/* Title */}
                <Text
                    style={{ 
                        color: palette.text, 
                        fontSize: 14, 
                        fontWeight: '700',
                        marginBottom: 4 
                    }}
                    numberOfLines={1}
                >
                    {displayTitle}
                </Text>

                {/* Address */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="location-outline" size={12} color={palette.textTertiary} />
                    <Text
                        style={{ 
                            color: palette.textSecondary, 
                            marginLeft: 4, 
                            fontSize: 12, 
                            flex: 1 
                        }}
                        numberOfLines={1}
                    >
                        {storage.address}
                    </Text>
                </View>

                {/* Bottom Row: Rating and Status */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text style={{ 
                            color: palette.textSecondary, 
                            marginLeft: 4, 
                            fontSize: 12, 
                            fontWeight: '500' 
                        }}>
                            {displayRating.toFixed(1)}
                        </Text>
                    </View>
                    <View style={{ 
                        backgroundColor: palette.successSoft, 
                        borderRadius: 12, 
                        paddingHorizontal: 8, 
                        paddingVertical: 2 
                    }}>
                        <Text style={{ 
                            color: palette.success, 
                            fontSize: 12, 
                            fontWeight: '500' 
                        }}>
                            Available
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default StorageDisplayCard
