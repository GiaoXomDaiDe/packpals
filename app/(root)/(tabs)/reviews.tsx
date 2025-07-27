import { router, useFocusEffect } from 'expo-router'
import React, { useState } from 'react'
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

import StarRating from '@/components/StarRating'
import { useUserProfile } from '@/lib/query/hooks'
import { useUserRatings } from '@/lib/query/hooks/useRatingQueries'
import { Rating } from '@/lib/types/rating.types'
import { useUserStore } from '@/store'

interface RatingItemProps {
    rating: Rating
    onPress: (rating: Rating) => void
}

const RatingItem: React.FC<RatingItemProps> = ({ rating, onPress }) => {
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

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
                    {formatDate(rating.ratingDate)}
                </Text>
            </View>

            {/* Comment Preview */}
            <Text className="text-gray-700 text-sm leading-5" numberOfLines={3}>
                {rating.comment || 'Không có bình luận'}
            </Text>

            {/* View Detail Indicator */}
            <View className="flex-row items-center justify-end mt-3 pt-3 border-t border-gray-100">
                <Text className="text-blue-600 text-sm font-JakartaMedium mr-1">
                    Xem chi tiết
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#2563EB" />
            </View>
        </TouchableOpacity>
    )
}

const Reviews = () => {
    const { user } = useUserStore()
    const [refreshing, setRefreshing] = useState(false)

    // Use userId to get user profile and extract renterId
    const userId = user?.id

    // Get user profile to extract renterId for rating history
    const {
        data: userProfileResponse,
        isLoading: profileLoading,
        error: profileError,
    } = useUserProfile(userId || '', {
        enabled: !!userId,
    })

    const userData = (userProfileResponse as any)?.data?.data
    const renterId = userData?.renter?.renterId

    console.log('📋 Reviews - User data:', {
        userId,
        hasUserData: !!userData,
        renterId,
        profileLoading,
    })

    // Fetch user ratings using renterId
    const {
        data: ratings = [],
        isLoading: ratingsLoading,
        error: ratingsError,
        refetch,
    } = useUserRatings(
        renterId || '',
        { pageSize: 50 },
        {
            enabled: !!renterId, // Only fetch when we have renterId
        }
    )

    // Auto-refresh when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            if (renterId) {
                console.log(
                    '📱 Reviews tab focused - refreshing data with renterId:',
                    renterId
                )
                refetch()
            }
        }, [renterId, refetch])
    )

    const handleRefresh = async () => {
        setRefreshing(true)
        try {
            await refetch()
        } finally {
            setRefreshing(false)
        }
    }

    const handleRatingPress = (rating: Rating) => {
        router.push({
            pathname: '/(root)/rating-detail',
            params: {
                ratingId: rating.id,
            },
        })
    }

    // Show loading if we don't have userId yet, profile is loading, or ratings are loading
    if (
        (!userId && !!user?.id) ||
        profileLoading ||
        (ratingsLoading && !refreshing)
    ) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="bg-white px-5 py-4 border-b border-gray-200">
                    <Text className="text-2xl font-JakartaBold">
                        My Reviews
                    </Text>
                    <Text className="text-gray-600 mt-1">
                        Reviews from your storage experiences
                    </Text>
                </View>

                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="mt-4 text-gray-600 font-JakartaMedium">
                        {!userId
                            ? 'Getting user information...'
                            : profileLoading
                              ? 'Loading user profile...'
                              : 'Loading your reviews...'}
                    </Text>
                </View>
            </SafeAreaView>
        )
    }

    // Show error if profile loading failed or no renterId found
    if (profileError || (!profileLoading && !renterId)) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="bg-white px-5 py-4 border-b border-gray-200">
                    <Text className="text-2xl font-JakartaBold">
                        My Reviews
                    </Text>
                    <Text className="text-gray-600 mt-1">
                        Reviews from your storage experiences
                    </Text>
                </View>

                <View className="flex-1 justify-center items-center px-6">
                    <View className="bg-red-50 rounded-3xl p-6 mb-4">
                        <Ionicons
                            name="warning-outline"
                            size={60}
                            color="#ef4444"
                        />
                    </View>
                    <Text className="text-lg font-JakartaBold text-gray-600 mt-4">
                        Unable to load profile
                    </Text>
                    <Text className="text-sm text-gray-500 text-center mt-2 px-4">
                        {profileError?.message ||
                            'Cannot find renter profile information'}
                    </Text>
                    <TouchableOpacity
                        onPress={() => refetch()}
                        className="mt-6 bg-blue-500 px-8 py-4 rounded-2xl"
                    >
                        <Text className="text-white font-JakartaBold">
                            Try Again
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-5 py-4 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                        <Text className="text-2xl font-JakartaBold">
                            My Reviews
                        </Text>
                        <Text className="text-gray-600 mt-1">
                            Reviews from your storage experiences
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={handleRefresh}
                        className="bg-gray-100 rounded-full p-2 ml-3"
                        disabled={refreshing}
                    >
                        <Ionicons name="refresh" size={20} color="#6b7280" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Reviews List */}
            <ScrollView
                className="flex-1 px-5"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#3B82F6']}
                        tintColor="#3B82F6"
                    />
                }
            >
                <View className="py-4">
                    {ratingsError ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <View className="bg-red-50 rounded-3xl p-6 mb-4">
                                <Ionicons
                                    name="warning-outline"
                                    size={60}
                                    color="#ef4444"
                                />
                            </View>
                            <Text className="text-lg font-JakartaBold text-gray-600 mt-4">
                                Failed to load reviews
                            </Text>
                            <Text className="text-sm text-gray-500 text-center mt-2 px-4">
                                {ratingsError?.message ||
                                    'Something went wrong'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => refetch()}
                                className="mt-6 bg-blue-500 px-8 py-4 rounded-2xl"
                            >
                                <Text className="text-white font-JakartaBold">
                                    Try Again
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : ratings.length === 0 ? (
                        <View className="flex-1 items-center justify-center py-20">
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
                                Complete storage orders and leave reviews to
                                help other users make better choices
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* Summary */}
                            <View className="mb-4">
                                <Text className="text-sm text-gray-500">
                                    Tổng cộng {ratings.length} đánh giá
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
