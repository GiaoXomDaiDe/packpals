import { router, useLocalSearchParams } from 'expo-router'
import React, { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

import StarRating from '@/components/StarRating'
import { useStorage } from '@/lib/query/hooks'
import { useDeleteRating, useRating } from '@/lib/query/hooks/useRatingQueries'
import { useUserStore } from '@/store'

const RatingDetailScreen: React.FC = () => {
    const params = useLocalSearchParams()
    const ratingId = params.ratingId as string
    const { user } = useUserStore()
    const [isDeleting, setIsDeleting] = useState(false)

    console.log('📋 Rating Detail page loaded with ID:', ratingId)

    // Use userId directly
    const userId = user?.id

    // Fetch rating details
    const {
        data: rating,
        isLoading: ratingLoading,
        error: ratingError,
    } = useRating(ratingId || '', {
        enabled: !!ratingId,
    })

    // Fetch storage details using storageId from rating
    const {
        data: storageResponse,
        isLoading: storageLoading,
    } = useStorage(rating?.storageId || '', {
        enabled: !!rating?.storageId,
    })

    const storageData = (storageResponse as any)?.data

    // Delete rating mutation
    const deleteRatingMutation = useDeleteRating({
        onSuccess: () => {
            Alert.alert(
                'Thành công!',
                'Đánh giá đã được xóa thành công.',
                [
                    {
                        text: 'Về Reviews',
                        onPress: () => router.push('/(root)/(tabs)/reviews'),
                    },
                ]
            )
        },
        onError: (error) => {
            setIsDeleting(false)
            Alert.alert('Lỗi', error.message)
        },
    })

    const loading = ratingLoading || storageLoading
    const hasError = ratingError

    // Format rating date
    const formatRatingDate = (dateString: string): string => {
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    // Handle rating edit
    const handleEditRating = () => {
        console.log('🔧 Edit rating clicked', {
            hasRating: !!rating,
            hasStorageData: !!storageData,
            ratingId: rating?.id,
            storageId: rating?.storageId,
            renterId: rating?.renterId,
        });

        if (!rating) {
            console.error('❌ Cannot edit: No rating data');
            return;
        }

        console.log('✅ Navigating to rating form with params:', {
            orderId: 'unknown',
            storageId: rating.storageId,
            storageAddress: storageData?.address || '',
            renterId: rating.renterId,
            existingRating: 'JSON string provided',
        });

        router.push({
            pathname: '/(root)/rating-form',
            params: {
                orderId: 'unknown', // We don't have order ID in rating detail
                storageId: rating.storageId,
                storageAddress: storageData?.address || '',
                renterId: rating.renterId,
                existingRating: JSON.stringify(rating),
            },
        })
    }

    // Handle rating delete
    const handleDeleteRating = () => {
        if (!rating || !userId) return

        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này không thể hoàn tác.',
            [
                {
                    text: 'Hủy',
                    style: 'cancel',
                },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => {
                        setIsDeleting(true)
                        deleteRatingMutation.mutate({
                            ratingId: rating.id,
                            renterId: userId,
                            storageId: rating.storageId,
                        })
                    },
                },
            ]
        )
    }

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="text-gray-600 mt-4 font-JakartaMedium">
                        Loading rating details...
                    </Text>
                </View>
            </SafeAreaView>
        )
    }

    if (hasError || !rating) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 items-center justify-center px-6">
                    <Ionicons name="alert-circle-outline" size={80} color="#ef4444" />
                    <Text className="text-red-500 text-xl font-JakartaBold mt-4 text-center">
                        Failed to load rating
                    </Text>
                    <Text className="text-gray-500 text-center mt-2">
                        {ratingError?.message || 'The rating you\'re looking for doesn\'t exist or has been removed'}
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mt-6 bg-blue-500 rounded-2xl px-6 py-3"
                    >
                        <Text className="text-white font-JakartaBold">
                            Go Back
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-6 py-4 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-gray-100 rounded-full p-2"
                    >
                        <Ionicons name="chevron-back" size={20} color="#374151" />
                    </TouchableOpacity>
                    
                    <View className="items-center flex-1 mx-4">
                        <Text className="text-lg font-JakartaBold text-gray-900">
                            Chi tiết đánh giá
                        </Text>
                        <Text className="text-xs text-gray-500">
                            #{rating.id.slice(-8)}
                        </Text>
                    </View>

                    <View className="flex-row">
                        <TouchableOpacity
                            onPress={handleEditRating}
                            className="bg-blue-100 rounded-full p-2 mr-2"
                        >
                            <Ionicons name="pencil" size={18} color="#3b82f6" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            onPress={handleDeleteRating}
                            disabled={isDeleting || deleteRatingMutation.isPending}
                            className="bg-red-100 rounded-full p-2"
                        >
                            {isDeleting || deleteRatingMutation.isPending ? (
                                <ActivityIndicator size="small" color="#ef4444" />
                            ) : (
                                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                {/* Rating Summary Card */}
                <View className="mt-6 mb-4">
                    <View className="bg-white rounded-2xl p-6 border border-gray-100">
                        {/* Rating Display */}
                        <View className="items-center mb-6">
                            <StarRating
                                rating={rating.star}
                                size="large"
                                readonly={true}
                                showValue={false}
                            />
                            <Text className="text-3xl font-JakartaBold text-gray-900 mt-2">
                                {rating.star}/5
                            </Text>
                            <Text className="text-gray-500 text-sm mt-1">
                                {formatRatingDate(rating.ratingDate)}
                            </Text>
                        </View>

                        {/* Comment */}
                        <View className="bg-gray-50 rounded-xl p-4">
                            <Text className="text-gray-800 text-base leading-6">
                                {rating.comment}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Storage Information */}
                {storageData && (
                    <View className="bg-white rounded-2xl p-6 mb-4 border border-gray-100">
                        <View className="flex-row items-center mb-4">
                            <Ionicons name="business-outline" size={20} color="#2563eb" />
                            <Text className="text-base font-JakartaBold text-gray-900 ml-2">
                                Thông tin kho lưu trữ
                            </Text>
                        </View>
                        
                        <View className="bg-blue-50 rounded-xl p-4">
                            <View className="flex-row items-start justify-between mb-3">
                                <View className="flex-1">
                                    <Text className="text-blue-900 font-JakartaBold text-base">
                                        {storageData.keeperName || 'Storage Keeper'}
                                    </Text>
                                    <Text className="text-blue-700 text-sm">
                                        Storage Manager
                                    </Text>
                                </View>
                                <View className="bg-blue-600 rounded-full p-2">
                                    <Ionicons name="person" size={16} color="white" />
                                </View>
                            </View>
                            
                            <View className="border-t border-blue-200 pt-3">
                                <Text className="text-xs text-blue-600 mb-1">Địa chỉ</Text>
                                <Text className="text-gray-700 text-sm">
                                    📍 {storageData.address || 'Không có thông tin địa chỉ'}
                                </Text>
                            </View>

                            {storageData.keeperPhoneNumber && (
                                <View className="border-t border-blue-200 pt-3 mt-3">
                                    <Text className="text-xs text-blue-600 mb-1">Liên hệ</Text>
                                    <Text className="text-gray-700 text-sm">
                                        📞 {storageData.keeperPhoneNumber}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Rating Information */}
                <View className="bg-white rounded-2xl p-6 mb-4 border border-gray-100">
                    <View className="flex-row items-center mb-6">
                        <View className="bg-emerald-100 rounded-full p-2 mr-3">
                            <Ionicons name="information-circle" size={20} color="#059669" />
                        </View>
                        <Text className="text-lg font-JakartaBold text-gray-900">
                            Thông tin đánh giá
                        </Text>
                    </View>

                    <View className="space-y-4">
                        {/* Rating Date */}
                        <View className="bg-gray-50 rounded-xl p-4">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="bg-blue-100 rounded-full p-2 mr-3">
                                        <Ionicons name="calendar-outline" size={16} color="#3b82f6" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm text-gray-500 font-JakartaMedium">
                                            Ngày tạo
                                        </Text>
                                        <Text className="text-gray-900 font-JakartaBold text-base">
                                            {formatRatingDate(rating.ratingDate)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                        
                        {/* Rating Score */}
                        <View className="bg-amber-50 rounded-xl p-4">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="bg-amber-100 rounded-full p-2 mr-3">
                                        <Ionicons name="star" size={16} color="#f59e0b" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm text-gray-500 font-JakartaMedium">
                                            Số sao đánh giá
                                        </Text>
                                        <View className="flex-row items-center mt-1">
                                            <Text className="text-gray-900 font-JakartaBold text-lg mr-2">
                                                {rating.star}
                                            </Text>
                                            <StarRating
                                                rating={rating.star}
                                                size="small"
                                                readonly={true}
                                                showValue={false}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Rating Status */}
                        <View className="bg-green-50 rounded-xl p-4">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="bg-green-100 rounded-full p-2 mr-3">
                                        <Ionicons name="checkmark-circle" size={16} color="#059669" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm text-gray-500 font-JakartaMedium">
                                            Trạng thái
                                        </Text>
                                        <View className="flex-row items-center mt-1">
                                            <View className="bg-green-500 rounded-full px-3 py-1">
                                                <Text className="text-white text-sm font-JakartaBold">
                                                    Đã đăng
                                                </Text>
                                            </View>
                                            <Text className="text-green-700 text-xs font-JakartaMedium ml-2">
                                                Công khai
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View className="mb-8">
                    <TouchableOpacity
                        onPress={handleEditRating}
                        className="bg-blue-500 rounded-2xl py-4 px-6 flex-row items-center justify-center mb-3"
                    >
                        <Ionicons name="pencil" size={18} color="white" />
                        <Text className="text-white font-JakartaBold ml-2 text-base">
                            Chỉnh sửa đánh giá
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleDeleteRating}
                        disabled={isDeleting || deleteRatingMutation.isPending}
                        className="bg-red-500 rounded-2xl py-4 px-6 flex-row items-center justify-center"
                    >
                        {isDeleting || deleteRatingMutation.isPending ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Ionicons name="trash-outline" size={18} color="white" />
                        )}
                        <Text className="text-white font-JakartaBold ml-2 text-base">
                            {isDeleting || deleteRatingMutation.isPending ? 'Đang xóa...' : 'Xóa đánh giá'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="h-6" />
            </ScrollView>
        </SafeAreaView>
    )
}

export default RatingDetailScreen