import { StarRating } from '@/components';
import CustomModal from '@/components/CustomModal';
import DetailHeader from '@/components/DetailHeader';
import { useCreateRating, useUpdateRating, useUserProfile } from '@/hooks/query';
import {
  Rating,
  RATING_VALIDATION,
  RatingFormData,
  RatingFormErrors
} from '@/types/rating.types';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
  
  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // API hooks
  const createRatingMutation = useCreateRating({
    onSuccess: (ratingId) => {
      setSuccessMessage('Your rating has been submitted successfully. You can view it in the Reviews tab.');
      setShowSuccessModal(true);
    },
    onError: (error) => {
      setErrors({ general: error.message });
      setIsSubmitting(false);
    },
  });

  const updateRatingMutation = useUpdateRating({
    onSuccess: (ratingId) => {
      setSuccessMessage('Your rating has been updated successfully. You can view it in the Reviews tab.');
      setShowSuccessModal(true);
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
      newErrors.star = `Please select from ${RATING_VALIDATION.MIN_STAR} to ${RATING_VALIDATION.MAX_STAR} stars`;
    }

    // Validate comment
    if (!formData.comment.trim()) {
      newErrors.comment = 'Comment is required';
    } else if (formData.comment.trim().length < RATING_VALIDATION.MIN_COMMENT_LENGTH) {
      newErrors.comment = `Comment must be at least ${RATING_VALIDATION.MIN_COMMENT_LENGTH} characters`;
    } else if (formData.comment.length > RATING_VALIDATION.MAX_COMMENT_LENGTH) {
      newErrors.comment = `Comment cannot exceed ${RATING_VALIDATION.MAX_COMMENT_LENGTH} characters`;
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
        setErrorMessage('Unable to identify user information. Please try again.');
        setShowErrorModal(true);
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
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-text-secondary mt-4 font-JakartaMedium">
            Loading user information...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if we can't get user profile (only for new ratings)
  if (!isEditMode && (profileError || !actualRenterId)) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-danger-soft rounded-full p-6 mb-4">
            <Ionicons name="warning-outline" size={48} color="#ef4444" />
          </View>
          <Text className="text-danger text-xl font-JakartaBold mb-2 text-center">
            Unable to load information
          </Text>
          <Text className="text-text-secondary text-center mb-6">
            Please try again later or contact support
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary rounded-xl px-6 py-3"
          >
            <Text className="text-white font-JakartaBold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <DetailHeader 
        title={parsedExistingRating ? 'Edit Rating' : 'Rate Storage'}
        subtitle={parsedExistingRating ? 'Update your experience' : 'Share your experience'}
        showBackButton={true}
        onBackPress={() => router.back()}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1 px-4 py-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Storage Information Card */}
          <View className="bg-surface rounded-xl p-4 mb-6 shadow-sm">
            <View className="flex-row items-center mb-3">
              <View className="bg-accent-soft rounded-full p-2 mr-3">
                <Ionicons name="business" size={18} color="#06b6d4" />
              </View>
              <Text className="text-base font-JakartaBold text-text">
                Storage Location
              </Text>
            </View>
            <Text className="text-text-secondary text-sm ml-11">
              {storageAddress}
            </Text>
          </View>

          {/* Star Rating Section */}
          <View className="bg-surface rounded-xl p-6 mb-6 shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="bg-primary-soft rounded-full p-2 mr-3">
                <Ionicons name="star" size={18} color="#2563eb" />
              </View>
              <Text className="text-base font-JakartaBold text-text">
                Your Rating *
              </Text>
            </View>
            
            <View className="items-center py-6 bg-background rounded-lg">
              <StarRating
                rating={formData.star}
                onRatingChange={handleStarChange}
                size="large"
                readonly={false}
                className="mb-3"
              />
              
              {formData.star > 0 && (
                <Text className="text-text-secondary text-sm font-JakartaMedium">
                  {formData.star} {formData.star === 1 ? 'star' : 'stars'}
                </Text>
              )}
            </View>

            {errors.star && (
              <View className="bg-danger-soft rounded-lg p-3 mt-3">
                <Text className="text-danger text-sm font-JakartaMedium">
                  {errors.star}
                </Text>
              </View>
            )}
          </View>

          {/* Comment Section */}
          <View className="bg-surface rounded-xl p-6 mb-6 shadow-sm">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="bg-accent-soft rounded-full p-2 mr-3">
                  <Ionicons name="chatbubble-outline" size={18} color="#06b6d4" />
                </View>
                <Text className="text-base font-JakartaBold text-text">
                  Your Comment *
                </Text>
              </View>
              <Text 
                className={`text-xs font-JakartaMedium ${
                  isCommentLimitExceeded ? 'text-danger' : 'text-text-secondary'
                }`}
              >
                {commentCharCount}/{RATING_VALIDATION.MAX_COMMENT_LENGTH}
              </Text>
            </View>

            <TextInput
              className={`border-2 rounded-xl p-4 text-base text-text font-JakartaRegular ${
                errors.comment ? 'border-danger bg-danger-soft' : 'border-border bg-background'
              } ${isCommentLimitExceeded ? 'border-danger bg-danger-soft' : ''}`}
              value={formData.comment}
              onChangeText={handleCommentChange}
              placeholder="Share your experience with this storage facility..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={RATING_VALIDATION.MAX_COMMENT_LENGTH + 50}
              returnKeyType="default"
              blurOnSubmit={false}
            />

            {errors.comment && (
              <View className="bg-danger-soft rounded-lg p-3 mt-3">
                <Text className="text-danger text-sm font-JakartaMedium">
                  {errors.comment}
                </Text>
              </View>
            )}

            <Text className="text-text-secondary text-xs mt-3 font-JakartaRegular">
              Minimum {RATING_VALIDATION.MIN_COMMENT_LENGTH} characters required
            </Text>
          </View>

          {/* General Error */}
          {errors.general && (
            <View className="bg-danger-soft border border-danger/20 rounded-xl p-4 mb-6">
              <View className="flex-row items-center">
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text className="text-danger text-sm font-JakartaMedium ml-3 flex-1">
                  {errors.general}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Submit Button */}
        <View className="px-4 py-4 border-t border-border bg-surface">
          <TouchableOpacity
            className={`rounded-xl py-4 px-6 flex-row items-center justify-center ${
              isSubmitting || formData.star === 0 || !formData.comment.trim()
                ? 'bg-text-secondary/30'
                : 'bg-primary shadow-md'
            }`}
            onPress={handleSubmit}
            disabled={isSubmitting || formData.star === 0 || !formData.comment.trim()}
            accessibilityLabel={parsedExistingRating ? 'Update Rating' : 'Submit Rating'}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white font-JakartaBold ml-3 text-base">
                  {parsedExistingRating ? 'Updating...' : 'Submitting...'}
                </Text>
              </>
            ) : (
              <>
                <Ionicons 
                  name={parsedExistingRating ? "checkmark-circle" : "send"} 
                  size={20} 
                  color="white" 
                />
                <Text className="text-white font-JakartaBold ml-3 text-base">
                  {parsedExistingRating ? 'Update Rating' : 'Submit Rating'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <CustomModal
        isVisible={showSuccessModal}
        type="success"
        title="Success!"
        message={successMessage}
        buttonText="Go to Reviews"
        onConfirm={() => {
          setShowSuccessModal(false);
          router.push('/(root)/(tabs)/reviews');
        }}
      />

      {/* Error Modal */}
      <CustomModal
        isVisible={showErrorModal}
        type="error"
        title="Error"
        message={errorMessage}
        buttonText="OK"
        onConfirm={() => setShowErrorModal(false)}
      />
    </SafeAreaView>
  );
};

export default RatingFormScreen;