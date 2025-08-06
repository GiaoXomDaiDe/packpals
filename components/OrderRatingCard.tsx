import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useDeleteRating, useUserStorageRating } from '@/hooks/query';
import { OrderRatingCardProps } from '../types/rating.types';
import StarRating from './StarRating';

const OrderRatingCard: React.FC<OrderRatingCardProps> = ({
  orderId,
  storageId,
  storageAddress,
  orderStatus,
  renterId: userId, // Renamed for clarity - this is actually userId
  onRatingComplete,
  className = '',
}) => {
  // Fetch existing rating for this user and storage
  const {
    data: existingRating,
    isLoading: isLoadingRating,
    error: ratingError,
    refetch: refetchRating,
  } = useUserStorageRating(userId, storageId, {
    enabled: orderStatus === 'COMPLETED',
  });

  // Delete rating mutation
  const deleteRatingMutation = useDeleteRating({
    onSuccess: () => {
      Alert.alert('Thành công', 'Đánh giá đã được xóa thành công.');
      refetchRating();
    },
    onError: (error) => {
      Alert.alert('Lỗi', error.message);
    },
  });

  // Navigate to rating form
  const navigateToRatingForm = (editMode: boolean = false): void => {
    router.push({
      pathname: '/(root)/rating-form',
      params: {
        orderId,
        storageId,
        storageAddress,
        renterId: userId, // Use userId instead of renterId
        ...(editMode && existingRating && {
          existingRating: JSON.stringify(existingRating),
        }),
      },
    });
  };

  // Handle rating delete
  const handleDeleteRating = (): void => {
    if (!existingRating) return;

    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa đánh giá này không?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => deleteRatingMutation.mutate({
            ratingId: existingRating.id,
            renterId: userId, // Use userId instead of renterId
            storageId,
          }),
        },
      ]
    );
  };

  // Format rating date
  const formatRatingDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Don't show rating card if order is not completed
  if (orderStatus !== 'COMPLETED') {
    return null;
  }

  // Show loading state
  if (isLoadingRating) {
    return (
      <View className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <View className="flex-row items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text className="text-gray-500 ml-2">Đang tải thông tin đánh giá...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (ratingError) {
    return (
      <View className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-red-700 font-medium mb-1">Lỗi tải đánh giá</Text>
            <Text className="text-red-600 text-sm">
              {ratingError.message}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => refetchRating()}
            className="ml-2 p-2"
          >
            <Ionicons name="refresh" size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show existing rating
  if (existingRating) {
    return (
      <View className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Ionicons name="star" size={18} color="#FFD700" />
            <Text className="text-base font-medium text-gray-900 ml-2">
              Đánh giá của bạn
            </Text>
          </View>
          
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => navigateToRatingForm(true)}
              className="p-2 mr-1"
              accessibilityLabel="Chỉnh sửa đánh giá"
            >
              <Ionicons name="pencil" size={16} color="#6B7280" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleDeleteRating}
              disabled={deleteRatingMutation.isPending}
              className="p-2"
              accessibilityLabel="Xóa đánh giá"
            >
              {deleteRatingMutation.isPending ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Rating Display */}
        <View className="flex-row items-center mb-3">
          <StarRating
            rating={existingRating.star}
            size="small"
            readonly={true}
            showValue={true}
          />
          <Text className="text-xs text-gray-500 ml-3">
            {formatRatingDate(existingRating.ratingDate)}
          </Text>
        </View>

        {/* Comment */}
        <Text className="text-gray-700 text-sm leading-5 mb-3">
          {existingRating.comment}
        </Text>

        {/* Edit Button */}
        <TouchableOpacity
          onPress={() => navigateToRatingForm(true)}
          className="bg-gray-100 py-2 px-4 rounded-lg self-start"
        >
          <Text className="text-gray-700 text-sm font-medium">
            Chỉnh sửa đánh giá
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show rating prompt for completed orders without rating
  return (
    <View className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <View className="flex-row items-center mb-3">
        <Ionicons name="star-outline" size={18} color="#3B82F6" />
        <Text className="text-base font-medium text-blue-900 ml-2">
          Đánh giá kho lưu trữ
        </Text>
      </View>

      {/* Description */}
      <Text className="text-blue-700 text-sm mb-4 leading-5">
        Đơn hàng đã hoàn thành! Hãy chia sẻ trải nghiệm của bạn để giúp những người khác đưa ra lựa chọn tốt hơn.
      </Text>

      {/* Storage Info */}
      <View className="bg-white bg-opacity-60 rounded-lg p-3 mb-4">
        <Text className="text-xs text-blue-600 mb-1">Kho lưu trữ</Text>
        <Text className="text-sm font-medium text-blue-900">
          {storageAddress}
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="flex-row">
        <TouchableOpacity
          onPress={() => navigateToRatingForm(false)}
          className="bg-blue-600 py-3 px-6 rounded-lg flex-1 mr-2"
          accessibilityLabel="Đánh giá ngay"
        >
          <Text className="text-white text-center font-semibold">
            Đánh giá ngay
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => {
            // Maybe implement a "remind me later" feature
            Alert.alert(
              'Nhắc nhở',
              'Bạn có thể đánh giá bất cứ lúc nào trong lịch sử đơn hàng.',
              [{ text: 'OK' }]
            );
          }}
          className="bg-gray-200 py-3 px-4 rounded-lg"
          accessibilityLabel="Để sau"
        >
          <Text className="text-gray-700 text-center font-medium">
            Để sau
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OrderRatingCard;