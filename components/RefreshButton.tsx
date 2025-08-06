import React from 'react'
import { TouchableOpacity, TouchableOpacityProps } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'

interface RefreshButtonProps extends TouchableOpacityProps {
    /** Whether the refresh is currently in progress */
    isRefreshing?: boolean
    /** Size of the icon */
    size?: number
    /** Color of the icon */
    color?: string
    /** Background color style variant */
    variant?: 'default' | 'white' | 'transparent' | 'blue'
    /** Custom background color (overrides variant) */
    backgroundColor?: string
    /** Icon to show when refreshing */
    refreshingIcon?: string
    /** Icon to show when not refreshing */
    idleIcon?: string
    /** Custom padding */
    padding?: number
}

/**
 * Reusable refresh button component
 * Features:
 * - Loading state with different icon
 * - Multiple style variants
 * - Customizable size and colors
 * - Disabled state during refresh
 * - Haptic feedback ready
 */
export const RefreshButton: React.FC<RefreshButtonProps> = ({
    isRefreshing = false,
    size = 18,
    color = '#374151',
    variant = 'default',
    backgroundColor,
    refreshingIcon = 'hourglass',
    idleIcon = 'refresh',
    padding = 8,
    disabled,
    activeOpacity = 0.8,
    className,
    style,
    ...props
}) => {
    // Get background style based on variant
    const getBackgroundStyle = () => {
        if (backgroundColor) {
            return { backgroundColor }
        }
        
        switch (variant) {
            case 'white':
                return 'bg-white'
            case 'transparent':
                return 'bg-transparent'
            case 'blue':
                return 'bg-blue-100'
            default:
                return 'bg-gray-100'
        }
    }

    const backgroundClass = getBackgroundStyle()
    const isDisabled = disabled || isRefreshing

    return (
        <TouchableOpacity
            className={`${backgroundClass} rounded-xl ${className || ''}`}
            style={[
                {
                    padding: padding,
                    opacity: isDisabled ? 0.6 : 1,
                },
                style
            ]}
            disabled={isDisabled}
            activeOpacity={activeOpacity}
            {...props}
        >
            <Ionicons
                name={isRefreshing ? refreshingIcon : idleIcon}
                size={size}
                color={color}
            />
        </TouchableOpacity>
    )
}

export default RefreshButton
