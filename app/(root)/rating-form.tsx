import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import StarRating from '../../components/StarRating';
import { useUserProfile } from '../../lib/query/hooks';
import { useCreateRating, useUpdateRating } from '../../lib/query/hooks/useRatingQueries';
import {
  Rating,
  RATING_VALIDATION,
  RatingFormData,
  RatingFormErrors
} from '../../lib/types/rating.types';

const RatingFormScreen: React.FC = () => {
  // Navigation params
  const params = useLocalSearchParams();
  const { storageId, storageAddress, renterId: userIdParam, existingRating } = params;

  // For existing ratings, we already have the renterId directly
  // For new ratings, we need to get it from user profile
  const isEditMode = !!existingRating;
  
  // Get user profile only for new ratings (when we don't have renterId yet)
  const {
    data: userProfileResponse,
    isLoading: profileLoading,
    error: profileError
  } = useUserProfile(userIdParam as string, {
    enabled: !!userIdParam && !isEditMode // Only fetch if not in edit mode
  });

  const userData = (userProfileResponse as any)?.data?.data;
  
  // For edit mode: use renterId directly from params
  // For new rating: extract renterId from user profile
  const actualRenterId = isEditMode 
    ? (userIdParam as string)
    : userData?.renter?.renterId;

  // Debug logging
  console.log('🔍 Rating Form Debug:', {
    isEditMode,
    userIdParam,
    userData: userData ? 'Present' : 'Not found',
    actualRenterId,
    storageId: Array.isArray(storageId) ? storageId[0] : storageId
  });

  // Parse existing rating if provided
  const parsedExistingRating: Rating | null = existingRating 
    ? JSON.parse(existingRating as string) 
    : null;

  // Form state
  const [formData, setFormData] = useState<RatingFormData>({
    star: parsedExistingRating?.star || 0,
    comment: parsedExistingRating?.comment || '',
  });

  const [errors, setErrors] = useState<RatingFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API hooks
  const createRatingMutation = useCreateRating({
    onSuccess: (ratingId) => {
      Alert.alert(
        'Thành công!',
        'Đánh giá của bạn đã được gửi thành công. Bạn có thể xem lại trong tab Reviews.',
        [
          {
            text: 'Xem Reviews',
            onPress: () => router.push('/(root)/(tabs)/reviews'),
          },
          {
            text: 'Quay lại',
            onPress: () => router.back(),
            style: 'cancel',
          },
        ]
      );
    },
    onError: (error) => {
      setErrors({ general: error.message });
      setIsSubmitting(false);
    },
  });

  const updateRatingMutation = useUpdateRating({
    onSuccess: (ratingId) => {
      Alert.alert(
        'Thành công!',
        'Đánh giá của bạn đã được cập nhật thành công. Bạn có thể xem lại trong tab Reviews.',
        [
          {
            text: 'Xem Reviews',
            onPress: () => router.push('/(root)/(tabs)/reviews'),
          },
          {
            text: 'Quay lại',
            onPress: () => router.back(),
            style: 'cancel',
          },
        ]
      );
    },
    onError: (error) => {
      setErrors({ general: error.message });
      setIsSubmitting(false);
    },
  });

  // Validation
  const validateForm = (): boolean => {
    const newErrors: RatingFormErrors = {};

    // Validate star rating
    if (formData.star < RATING_VALIDATION.MIN_STAR || formData.star > RATING_VALIDATION.MAX_STAR) {
      newErrors.star = `Vui lòng chọn từ ${RATING_VALIDATION.MIN_STAR} đến ${RATING_VALIDATION.MAX_STAR} sao`;
    }

    // Validate comment
    if (!formData.comment.trim()) {
      newErrors.comment = 'Bình luận là bắt buộc';
    } else if (formData.comment.trim().length < RATING_VALIDATION.MIN_COMMENT_LENGTH) {
      newErrors.comment = `Bình luận phải có ít nhất ${RATING_VALIDATION.MIN_COMMENT_LENGTH} ký tự`;
    } else if (formData.comment.length > RATING_VALIDATION.MAX_COMMENT_LENGTH) {
      newErrors.comment = `Bình luận không được vượt quá ${RATING_VALIDATION.MAX_COMMENT_LENGTH} ký tự`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Ensure we have the actual renter ID before proceeding
      if (!actualRenterId) {
        Alert.alert('Lỗi', 'Không thể xác định thông tin người dùng. Vui lòng thử lại.');
        setIsSubmitting(false);
        return;
      }

      if (parsedExistingRating) {
        // Update existing rating
        await updateRatingMutation.mutateAsync({
          id: parsedExistingRating.id,
          star: formData.star,
          comment: formData.comment.trim(),
          renterId: actualRenterId,
          storageId: Array.isArray(storageId) ? storageId[0] : storageId as string,
        });
      } else {
        // Create new rating
        await createRatingMutation.mutateAsync({
          renterId: actualRenterId,
          storageId: Array.isArray(storageId) ? storageId[0] : storageId as string,
          star: formData.star,
          comment: formData.comment.trim(),
        });
      }
    } catch (error) {
      // Error handling is done in mutation callbacks
      console.error('Rating submission failed:', error);
    }
  };

  // Handle star rating change
  const handleStarChange = (rating: number): void => {
    setFormData(prev => ({ ...prev, star: rating }));
    if (errors.star) {
      setErrors(prev => ({ ...prev, star: undefined }));
    }
  };

  // Handle comment change
  const handleCommentChange = (text: string): void => {
    setFormData(prev => ({ ...prev, comment: text }));
    if (errors.comment) {
      setErrors(prev => ({ ...prev, comment: undefined }));
    }
  };

  // Character count for comment
  const commentCharCount = formData.comment.length;
  const isCommentLimitExceeded = commentCharCount > RATING_VALIDATION.MAX_COMMENT_LENGTH;

  // Show loading if user profile is still loading (only for new ratings)
  if (!isEditMode && profileLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-600 mt-4 font-medium">
            Đang tải thông tin người dùng...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if we can't get user profile (only for new ratings)
  if (!isEditMode && (profileError || !actualRenterId)) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="warning-outline" size={60} color="#ef4444" />
          <Text className="text-lg font-semibold text-gray-900 mt-4 text-center">
            Không thể tải thông tin
          </Text>
          <Text className="text-gray-600 mt-2 text-center">
            Vui lòng thử lại sau hoặc liên hệ hỗ trợ
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 bg-blue-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2"
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          
          <Text className="text-lg font-semibold text-gray-900">
            {parsedExistingRating ? 'Sửa đánh giá' : 'Đánh giá kho lưu trữ'}
          </Text>
          
          <View className="w-10" />
        </View>

        <ScrollView 
          className="flex-1 px-4 py-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Storage Information */}
          <View className="bg-gray-50 rounded-lg p-4 mb-6">
            <Text className="text-sm text-gray-500 mb-1">Kho lưu trữ</Text>
            <Text className="text-base font-medium text-gray-900">
              {storageAddress}
            </Text>
          </View>

          {/* Star Rating Section */}
          <View className="mb-6">
            <Text className="text-base font-medium text-gray-900 mb-3">
              Đánh giá của bạn *
            </Text>
            
            <View className="items-center py-4">
              <StarRating
                rating={formData.star}
                onRatingChange={handleStarChange}
                size="large"
                readonly={false}
                className="mb-2"
              />
              
              {formData.star > 0 && (
                <Text className="text-sm text-gray-600">
                  {formData.star} sao
                </Text>
              )}
            </View>

            {errors.star && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.star}
              </Text>
            )}
          </View>

          {/* Comment Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-medium text-gray-900">
                Nhận xét *
              </Text>
              <Text 
                className={`text-sm ${
                  isCommentLimitExceeded ? 'text-red-500' : 'text-gray-500'
                }`}
              >
                {commentCharCount}/{RATING_VALIDATION.MAX_COMMENT_LENGTH}
              </Text>
            </View>

            <TextInput
              className={`border rounded-lg p-4 text-base text-gray-900 ${
                errors.comment ? 'border-red-500' : 'border-gray-300'
              } ${isCommentLimitExceeded ? 'border-red-500' : ''}`}
              value={formData.comment}
              onChangeText={handleCommentChange}
              placeholder="Chia sẻ trải nghiệm của bạn về kho lưu trữ này..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={RATING_VALIDATION.MAX_COMMENT_LENGTH + 50} // Allow slight overflow for warning
              returnKeyType="default"
              blurOnSubmit={false}
            />

            {errors.comment && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.comment}
              </Text>
            )}

            <Text className="text-xs text-gray-500 mt-2">
              Tối thiểu {RATING_VALIDATION.MIN_COMMENT_LENGTH} ký tự
            </Text>
          </View>

          {/* General Error */}
          {errors.general && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <Text className="text-red-700 text-sm">
                {errors.general}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Submit Button */}
        <View className="px-4 py-4 border-t border-gray-200 bg-white">
          <TouchableOpacity
            className={`rounded-lg py-4 px-6 ${
              isSubmitting || formData.star === 0 || !formData.comment.trim()
                ? 'bg-gray-300'
                : 'bg-blue-600'
            }`}
            onPress={handleSubmit}
            disabled={isSubmitting || formData.star === 0 || !formData.comment.trim()}
            accessibilityLabel={parsedExistingRating ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
          >
            {isSubmitting ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white font-semibold ml-2">
                  {parsedExistingRating ? 'Đang cập nhật...' : 'Đang gửi...'}
                </Text>
              </View>
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                {parsedExistingRating ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RatingFormScreen;