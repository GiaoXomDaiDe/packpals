import { ratingAPI } from '@/lib/storageAPI'
import { useUserStore } from '@/store'
import { useFocusEffect } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

interface Rating {
    id: string
    orderId: string
    userId: string
    storageId: string
    rating: number
    reviewText?: string
    createdAt: string
    storageName?: string
    storageAddress?: string
}

const Reviews = () => {
    const { user } = useUserStore()
    const [ratings, setRatings] = useState<Rating[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchUserRatings = useCallback(async () => {
        if (!user?.id) return

        try {
            setLoading(true)
            // TODO: Implement API to get user's ratings when backend is ready
            // For now, we'll show a placeholder
            setRatings([])
        } catch (error) {
            console.error('Error fetching user ratings:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [user?.id])

    useFocusEffect(
        useCallback(() => {
            fetchUserRatings()
        }, [fetchUserRatings])
    )

    const onRefresh = () => {
        setRefreshing(true)
        fetchUserRatings()
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
                        Reviews from your storage experiences
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
                        {/* Empty State */}
                        <View className="flex-1 justify-center items-center py-20">
                            <View className="bg-gray-100 w-20 h-20 rounded-full items-center justify-center mb-4">
                                <Ionicons
                                    name="star-outline"
                                    size={40}
                                    color="#9CA3AF"
                                />
                            </View>
                            <Text className="text-xl font-JakartaBold text-gray-600 mb-2">
                                Reviews Coming Soon
                            </Text>
                            <Text className="text-center text-gray-500 px-8">
                                Complete storage orders to leave reviews and help other users
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

export default Reviews
