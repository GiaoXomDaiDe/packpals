import React from 'react'
import { Image, Text, View } from 'react-native'

import StarRating from './StarRating'

interface ReviewCardProps {
    review: {
        id: number
        ride_id: string
        user_id: string
        driver_id: number
        rating: number
        review_text?: string
        created_at: string
        updated_at: string
        first_name?: string
        last_name?: string
        driver_image?: string
    }
    showDriverInfo?: boolean
}

const ReviewCard: React.FC<ReviewCardProps> = ({
    review,
    showDriverInfo = true,
}) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    return (
        <View className="bg-white p-4 rounded-lg shadow-sm shadow-neutral-300 mb-3">
            {showDriverInfo && (
                <View className="flex-row items-center mb-3">
                    <Image
                        source={{
                            uri:
                                review.driver_image ||
                                'https://via.placeholder.com/40',
                        }}
                        className="w-10 h-10 rounded-full mr-3"
                    />
                    <View className="flex-1">
                        <Text className="font-JakartaSemiBold text-lg">
                            {review.first_name} {review.last_name}
                        </Text>
                        <Text className="text-gray-500 text-sm">Driver</Text>
                    </View>
                </View>
            )}

            <View className="flex-row items-center justify-between mb-2">
                <StarRating rating={review.rating} readonly size={20} />
                <Text className="text-gray-500 text-sm">
                    {formatDate(review.created_at)}
                </Text>
            </View>

            {review.review_text && (
                <Text className="text-gray-700 text-base leading-5">
                    {review.review_text}
                </Text>
            )}
        </View>
    )
}

export default ReviewCard
