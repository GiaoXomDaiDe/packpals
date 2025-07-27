import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'

interface StarRatingProps {
    rating: number
    onRatingChange?: (rating: number) => void
    size?: number | 'small' | 'medium' | 'large'
    readonly?: boolean
    showValue?: boolean
    starStyle?: string
    className?: string
}

const StarRating: React.FC<StarRatingProps> = ({
    rating,
    onRatingChange,
    size = 24,
    readonly = false,
    showValue = false,
    starStyle = '',
    className = '',
}) => {
    // Handle size prop (number or string)
    const getStarSize = (): number => {
        if (typeof size === 'number') return size;
        switch (size) {
            case 'small': return 16;
            case 'medium': return 24;
            case 'large': return 32;
            default: return 24;
        }
    };

    const starSize = getStarSize();
    const stars = []

    for (let i = 1; i <= 5; i++) {
        const isFilled = i <= rating
        stars.push(
            <TouchableOpacity
                key={i}
                onPress={() => !readonly && onRatingChange?.(i)}
                disabled={readonly}
                className={`${readonly ? '' : 'active:opacity-70'} mr-1`}
                accessibilityLabel={`${i} star${i !== 1 ? 's' : ''}`}
                accessibilityRole="button"
            >
                <Ionicons
                    name={isFilled ? 'star' : 'star-outline'}
                    size={starSize}
                    color={isFilled ? '#FFD700' : '#D1D5DB'}
                />
            </TouchableOpacity>
        )
    }

    return (
        <View className={`flex-row items-center ${starStyle} ${className}`}>
            {stars}
            {showValue && (
                <Text className="ml-2 text-sm text-gray-600 font-medium">
                    {rating.toFixed(1)}
                </Text>
            )}
        </View>
    )
}

export default StarRating
