import CreateReview from '@/components/CreateReview'
import ReviewCard from '@/components/ReviewCard'
import { fetchAPI } from '@/lib/fetch'
import { useUser } from '@clerk/clerk-expo'
import { useFocusEffect } from '@react-navigation/native'
import React, { useCallback, useState } from 'react'
import {
    ActivityIndicator,
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
    origin_address?: string
    destination_address?: string
    ride_completed_at?: string
}

interface UnreviewedRide {
    ride_id: string
    driver_id: number
    origin_address?: string
    destination_address?: string
    fare_price: number
    trip_completed_at: string
    first_name: string
    last_name: string
    driver_image?: string
    driver_rating: number
}

const Reviews = () => {
    const { user } = useUser()
    const [reviews, setReviews] = useState<Review[]>([])
    const [unreviewedRides, setUnreviewedRides] = useState<UnreviewedRide[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [selectedRide, setSelectedRide] = useState<UnreviewedRide | null>(
        null
    )

    const fetchUserReviews = useCallback(async () => {
        if (!user?.id) return

        try {
            setLoading(true)

            // Fetch existing reviews
            const reviewsResponse = await fetchAPI(
                `/(api)/reviews?userId=${user.id}`,
                {
                    method: 'GET',
                }
            )

            if (reviewsResponse.success) {
                setReviews(reviewsResponse.data.reviews || [])
            }

            // Fetch unreviewed rides
            const unreviewedResponse = await fetchAPI(
                `/(api)/ride/unreviewed?userId=${user.id}`,
                {
                    method: 'GET',
                }
            )

            if (unreviewedResponse.success) {
                setUnreviewedRides(
                    unreviewedResponse.data.unreviewed_rides || []
                )
            }
        } catch (error) {
            console.error('Error fetching user reviews:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [user?.id])

    useFocusEffect(
        useCallback(() => {
            fetchUserReviews()
        }, [fetchUserReviews])
    )

    const onRefresh = () => {
        setRefreshing(true)
        fetchUserReviews()
    }

    const handleReviewRide = (ride: UnreviewedRide) => {
        setSelectedRide(ride)
        setShowReviewModal(true)
    }

    const handleReviewCreated = () => {
        setShowReviewModal(false)
        setSelectedRide(null)
        // Refresh the data to reflect the new review
        fetchUserReviews()
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
                    <Text className="text-2xl font-JakartaBold">
                        My Reviews
                    </Text>
                    <Text className="text-gray-600 mt-1">
                        Reviews from your completed rides
                    </Text>
                </View>

                {/* Reviews List */}
                <ScrollView
                    className="flex-1 px-5"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#0286FF']}
                        />
                    }
                >
                    <View className="py-4">
                        {/* Unreviewed Rides Section */}
                        {unreviewedRides.length > 0 && (
                            <View className="mb-6">
                                <Text className="text-lg font-JakartaBold text-red-600 mb-3">
                                    ⭐ Rate Your Recent Rides
                                </Text>
                                {unreviewedRides.map((ride) => (
                                    <TouchableOpacity
                                        key={ride.ride_id}
                                        onPress={() => handleReviewRide(ride)}
                                        className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-3"
                                    >
                                        <View className="flex-row items-center justify-between">
                                            <View className="flex-1">
                                                <Text className="font-JakartaBold text-gray-800 mb-1">
                                                    {ride.first_name}{' '}
                                                    {ride.last_name}
                                                </Text>
                                                <Text className="text-sm text-gray-600 mb-1">
                                                    {ride.origin_address} →{' '}
                                                    {ride.destination_address}
                                                </Text>
                                                <Text className="text-sm text-gray-500">
                                                    Completed:{' '}
                                                    {new Date(
                                                        ride.trip_completed_at
                                                    ).toLocaleDateString()}
                                                </Text>
                                            </View>
                                            <View className="items-center">
                                                <Ionicons
                                                    name="star-outline"
                                                    size={24}
                                                    color="#F59E0B"
                                                />
                                                <Text className="text-xs text-yellow-600 mt-1">
                                                    Tap to rate
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Existing Reviews Section */}
                        {reviews.length > 0 && (
                            <View>
                                <Text className="text-lg font-JakartaBold text-gray-800 mb-3">
                                    Your Previous Reviews
                                </Text>
                                {reviews.map((review) => (
                                    <ReviewCard
                                        key={review.id}
                                        review={review}
                                        showDriverInfo={true}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Empty State */}
                        {reviews.length === 0 &&
                            unreviewedRides.length === 0 && (
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
                                        Complete rides to leave reviews and help
                                        other passengers
                                    </Text>
                                </View>
                            )}
                    </View>
                </ScrollView>

                {/* Review Modal */}
                {selectedRide && (
                    <CreateReview
                        isVisible={showReviewModal}
                        onClose={() => setShowReviewModal(false)}
                        driverId={selectedRide.driver_id}
                        rideId={selectedRide.ride_id}
                        driverName={`${selectedRide.first_name} ${selectedRide.last_name}`}
                        onReviewCreated={handleReviewCreated}
                    />
                )}
            </View>
        </SafeAreaView>
    )
}

export default Reviews
