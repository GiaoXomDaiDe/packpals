import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'

interface StarRatingProps {
    rating: number
    onRatingChange?: (rating: number) => void
    size?: number
    readonly?: boolean
    showRating?: boolean
    starStyle?: string
}

const StarRating: React.FC<StarRatingProps> = ({
    rating,
    onRatingChange,
    size = 24,
    readonly = false,
    starStyle = '',
}) => {
    const stars = []

    for (let i = 1; i <= 5; i++) {
        const isFilled = i <= rating
        stars.push(
            <TouchableOpacity
                key={i}
                onPress={() => !readonly && onRatingChange?.(i)}
                disabled={readonly}
                className={`${readonly ? '' : 'active:opacity-70'}`}
            >
                <Ionicons
                    name={isFilled ? 'star' : 'star-outline'}
                    size={size}
                    color={isFilled ? '#FFD700' : '#D1D5DB'}
                />
            </TouchableOpacity>
        )
    }

    return <View className={`flex-row items-center ${starStyle}`}>{stars}</View>
}

export default StarRating
