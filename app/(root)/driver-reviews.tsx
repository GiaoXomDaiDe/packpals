import ReviewCard from '@/components/ReviewCard'
import StarRating from '@/components/StarRating'
import { fetchAPI } from '@/lib/fetch'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

interface Review {
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

interface ReviewSummary {
    reviews: Review[]
    averageRating: number
    totalReviews: number
}

const DriverReviews = () => {
    const { driverId, driverName, driverImage } = useLocalSearchParams()
    const [reviewData, setReviewData] = useState<ReviewSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchDriverReviews = useCallback(async () => {
        if (!driverId) return

        try {
            const response = await fetchAPI(
                `/(api)/reviews?driverId=${driverId}`,
                {
                    method: 'GET',
                }
            )

            if (response.success) {
                setReviewData(response.data)
            }
        } catch (error) {
            console.error('Error fetching driver reviews:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [driverId])

    useEffect(() => {
        fetchDriverReviews()
    }, [fetchDriverReviews])

    const onRefresh = () => {
        setRefreshing(true)
        fetchDriverReviews()
    }

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#0286FF" />
                    <Text className="mt-2 text-gray-600">
                        Loading reviews...
                    </Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="flex-1">
                {/* Header */}
                <View className="bg-white px-5 py-4 border-b border-gray-200">
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="mr-4"
                        >
                            <Ionicons
                                name="arrow-back"
                                size={24}
                                color="#333"
                            />
                        </TouchableOpacity>
                        <Text className="text-xl font-JakartaBold flex-1">
                            Driver Reviews
                        </Text>
                    </View>
                </View>

                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#0286FF']}
                        />
                    }
                >
                    {/* Driver Info Card */}
                    <View className="bg-white mx-5 mt-4 p-5 rounded-lg shadow-sm shadow-neutral-300">
                        <View className="flex-row items-center">
                            <Image
                                source={{
                                    uri:
                                        (driverImage as string) ||
                                        'https://via.placeholder.com/60',
                                }}
                                className="w-16 h-16 rounded-full mr-4"
                            />
                            <View className="flex-1">
                                <Text className="text-xl font-JakartaBold mb-1">
                                    {driverName || 'Driver'}
                                </Text>
                                <View className="flex-row items-center mb-2">
                                    <StarRating
                                        rating={Math.round(
                                            reviewData?.averageRating || 0
                                        )}
                                        readonly
                                        size={20}
                                    />
                                    <Text className="ml-2 text-gray-600">
                                        {reviewData?.averageRating?.toFixed(
                                            1
                                        ) || '0.0'}{' '}
                                        ({reviewData?.totalReviews || 0}{' '}
                                        reviews)
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Reviews List */}
                    <View className="px-5 py-4">
                        {reviewData?.reviews &&
                        reviewData.reviews.length > 0 ? (
                            reviewData.reviews.map((review) => (
                                <ReviewCard
                                    key={review.id}
                                    review={review}
                                    showDriverInfo={false}
                                />
                            ))
                        ) : (
                            <View className="flex-1 justify-center items-center py-20">
                                <View className="bg-gray-100 w-20 h-20 rounded-full items-center justify-center mb-4">
                                    <Ionicons
                                        name="star-outline"
                                        size={40}
                                        color="#9CA3AF"
                                    />
                                </View>
                                <Text className="text-xl font-JakartaBold text-gray-600 mb-2">
                                    No Reviews Yet
                                </Text>
                                <Text className="text-center text-gray-500 px-8">
                                    This driver hasn&apos;t received any reviews
                                    yet
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

export default DriverReviews
