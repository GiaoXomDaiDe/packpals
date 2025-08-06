import { router, useFocusEffect } from 'expo-router'
import React from 'react'
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { ScreenHeader } from '@/components'
import StarRating from '@/components/StarRating'
import { useUserProfile, useUserRatings } from '@/hooks/query'
import { useUserStore } from '@/store'
import { Rating } from '@/types/rating.types'

interface RatingItemProps {
    rating: Rating
    onPress: (rating: Rating) => void
}

const RatingItem: React.FC<RatingItemProps> = ({ rating, onPress }) => {
    return (
        <TouchableOpacity
            onPress={() => onPress(rating)}
            className="bg-white border border-gray-200 rounded-xl p-4 mb-3"
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 2,
            }}
        >
            {/* Rating & Date */}
            <View className="flex-row items-center justify-between mb-3">
                <StarRating
                    rating={rating.star}
                    size="small"
                    readonly={true}
                    showValue={true}
                />
                <Text className="text-xs text-gray-500">
                    {new Date(rating.ratingDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })}
                </Text>
            </View>

            {/* Comment Preview */}
            <Text className="text-gray-700 text-sm leading-5" numberOfLines={3}>
                {rating.comment || 'No comment'}
            </Text>

            {/* View Detail Indicator */}
            <View className="flex-row items-center justify-end mt-3 pt-3 border-t border-gray-100">
                <Text className="text-blue-600 text-sm font-JakartaMedium mr-1">
                    View Details
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#2563EB" />
            </View>
        </TouchableOpacity>
    )
}

const Reviews = () => {
    const { user } = useUserStore()

    const userId = user?.id

    // Get user profile to extract renterId for ratings
    const {
        data: userProfileResponse,
        isLoading: profileLoading,
        error: profileError,
    } = useUserProfile(userId || '', {
        enabled: !!userId,
    })

    const userData = (userProfileResponse as any)?.data?.data
    const renterId = userData?.renter?.renterId

    // Fetch user ratings using renterId with auto-refresh
    const {
        data: ratings = [],
        isLoading: ratingsLoading,
        error: ratingsError,
        refetch,
    } = useUserRatings(
        renterId || '',
        { pageSize: 50 },
        {
            enabled: !!renterId,
            staleTime: 30 * 1000, // 30 seconds
            refetchInterval: 60 * 1000, // Auto-refresh every 60 seconds
            refetchOnWindowFocus: true,
            refetchOnMount: true,
        }
    )

    // Auto-refresh when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            if (renterId) {
                refetch()
            }
        }, [renterId, refetch])
    )

    const handleRatingPress = (rating: Rating) => {
        router.push({
            pathname: '/(root)/rating-detail',
            params: { ratingId: rating.id },
        })
    }

    // Loading state
    const isLoading = (!userId && !!user?.id) || profileLoading || ratingsLoading
    
    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <ScreenHeader 
                    title="My Reviews"
                />

                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="mt-4 text-gray-600 font-JakartaMedium">
                        {!userId ? 'Getting user information...' 
                            : profileLoading ? 'Loading user profile...' 
                            : 'Loading your reviews...'}
                    </Text>
                </View>
            </SafeAreaView>
        )
    }

    // Error state
    if (profileError || (!profileLoading && !renterId)) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <ScreenHeader 
                    title="My Reviews"
                />

                <View className="flex-1 justify-center items-center px-6">
                    <View className="bg-red-50 rounded-3xl p-6 mb-4">
                        <Ionicons name="warning-outline" size={60} color="#ef4444" />
                    </View>
                    <Text className="text-lg font-JakartaBold text-gray-600 mt-4">
                        Unable to load profile
                    </Text>
                    <Text className="text-sm text-gray-500 text-center mt-2 px-4">
                        {profileError?.message || 'Cannot find renter profile information'}
                    </Text>
                    <TouchableOpacity
                        onPress={() => refetch()}
                        className="mt-6 bg-blue-500 px-8 py-4 rounded-2xl"
                    >
                        <Text className="text-white font-JakartaBold">Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <ScreenHeader 
                title="My Reviews"
                showActionButton={false}
            />

            {/* Reviews List */}
            <ScrollView
                className="flex-1 px-5"
                showsVerticalScrollIndicator={false}
            >
                <View className="py-4">
                    {ratingsError ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <View className="bg-red-50 rounded-3xl p-6 mb-4">
                                <Ionicons name="warning-outline" size={60} color="#ef4444" />
                            </View>
                            <Text className="text-lg font-JakartaBold text-gray-600 mt-4">
                                Failed to load reviews
                            </Text>
                            <Text className="text-sm text-gray-500 text-center mt-2 px-4">
                                {ratingsError?.message || 'Something went wrong'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => refetch()}
                                className="mt-6 bg-blue-500 px-8 py-4 rounded-2xl"
                            >
                                <Text className="text-white font-JakartaBold">Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    ) : ratings.length === 0 ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <View className="bg-gray-100 w-20 h-20 rounded-full items-center justify-center mb-4">
                                <Ionicons name="star-outline" size={40} color="#9CA3AF" />
                            </View>
                            <Text className="text-xl font-JakartaBold text-gray-600 mb-2">
                                No Reviews Yet
                            </Text>
                            <Text className="text-center text-gray-500 px-8">
                                Complete storage orders and leave reviews to help other users make better choices
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* Summary */}
                            <View className="mb-4">
                                <Text className="text-sm text-gray-500">
                                    Total {ratings.length} reviews
                                </Text>
                            </View>

                            {/* Rating Items */}
                            {ratings.map((rating) => (
                                <RatingItem
                                    key={rating.id}
                                    rating={rating}
                                    onPress={handleRatingPress}
                                />
                            ))}
                        </>
                    )}
                </View>

                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    )
}

export default Reviews
