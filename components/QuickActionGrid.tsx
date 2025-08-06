import React from 'react'
import { Text, TouchableOpacity, View, ViewStyle } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'

// Types for better TypeScript support
export interface QuickAction {
    id: string
    title: string
    icon: string
    color: string
    onPress: () => void
    badge?: number | string // Optional badge for notifications
    disabled?: boolean
}

export interface QuickActionGridProps {
    actions: QuickAction[]
    columns?: number // Default 4, but can be customized
    variant?: 'default' | 'compact' | 'large'
    spacing?: 'tight' | 'normal' | 'loose'
    style?: ViewStyle
    showTitles?: boolean
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({
    actions,
    columns = 4,
    variant = 'default',
    spacing = 'normal',
    style,
    showTitles = true
}) => {
    // Simple width calculation for equal distribution
    const itemWidth = columns === 4 ? '23%' : `${100 / columns - 2}%`

    // Get size values based on variant
    const getSize = () => {
        switch (variant) {
            case 'compact': return { icon: 24 }
            case 'large': return { icon: 40 }
            default: return { icon: 32 }
        }
    }

    const { icon: iconSize } = getSize()

    return (
        <View 
            style={[
                {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                },
                style
            ]}
        >
            {actions.map((action) => (
                <TouchableOpacity
                    key={action.id}
                    onPress={action.onPress}
                    disabled={action.disabled}
                    style={{
                        width: itemWidth as any,
                        aspectRatio: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#ffffff',
                        borderRadius: variant === 'compact' ? 12 : 16,
                        padding: variant === 'compact' ? 8 : 12,
                        shadowColor: 'rgba(15, 23, 42, 0.08)',
                        shadowOpacity: 0.06,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 4,
                        opacity: action.disabled ? 0.5 : 1,
                    }}
                    activeOpacity={0.8}
                >
                    {/* Icon with optional badge */}
                    <View style={{ position: 'relative', marginBottom: showTitles ? 8 : 0 }}>
                        <Ionicons 
                            name={action.icon as any} 
                            size={iconSize} 
                            color={action.disabled ? '#94a3b8' : action.color} 
                        />
                        
                        {/* Badge */}
                        {action.badge ? (
                            <View style={{
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                backgroundColor: '#ef4444',
                                borderRadius: 10,
                                minWidth: 20,
                                height: 20,
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingHorizontal: 6,
                            }}>
                                <Text style={{
                                    color: 'white',
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                }}>
                                    {typeof action.badge === 'number' && action.badge > 99 ? '99+' : action.badge}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                    
                    {/* Title */}
                    {showTitles ? (
                        <Text style={{
                            color: action.disabled ? '#94a3b8' : '#1e293b',
                            fontSize: variant === 'compact' ? 10 : 12,
                            fontWeight: '600',
                            textAlign: 'center',
                            lineHeight: variant === 'compact' ? 12 : 14,
                        }} numberOfLines={2}>
                            {action.title}
                        </Text>
                    ) : null}
                </TouchableOpacity>
            ))}
        </View>
    )
}

// Hook để tạo actions dựa trên user role
export const useQuickActions = (userRole: string, router: any) => {
    const renterActions: QuickAction[] = [
        {
            id: 'storage',
            title: 'Storage',
            icon: 'location',
            color: '#2563eb',
            onPress: () => router.push('/(root)/find-storage'),
        },
        {
            id: 'orders',
            title: 'Orders',
            icon: 'bag',
            color: '#06b6d4',
            onPress: () => router.push('/(root)/(tabs)/orders'),
        },
        {
            id: 'reviews',
            title: 'Reviews',
            icon: 'heart',
            color: '#059669',
            onPress: () => router.push('/(root)/(tabs)/reviews'),
        },
        {
            id: 'profile',
            title: 'Profile',
            icon: 'person-circle',
            color: '#d97706',
            onPress: () => router.push('/(root)/(tabs)/profile'),
        },
    ]

    const keeperActions: QuickAction[] = [
        {
            id: 'storages',
            title: 'Storages',
            icon: 'location',
            color: '#2563eb',
            onPress: () => router.push('/(root)/keeper-storages'),
        },
        {
            id: 'orders',
            title: 'Orders',
            icon: 'bag',
            color: '#06b6d4',
            onPress: () => router.push('/(root)/order-management'),
            badge: 5, // Example: 5 pending orders
        },
        {
            id: 'reviews',
            title: 'Reviews',
            icon: 'heart',
            color: '#059669',
            onPress: () => router.push('/(root)/review-management'),
        },
        {
            id: 'profile',
            title: 'Profile',
            icon: 'person-circle',
            color: '#d97706',
            onPress: () => router.push('/(root)/(tabs)/profile'),
        },
    ]

    return userRole === 'KEEPER' ? keeperActions : renterActions
}
