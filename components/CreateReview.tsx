import CustomButton from '@/components/CustomButton'
import StarRating from '@/components/StarRating'
import { fetchAPI } from '@/lib/fetch'
import { useUserStore } from '@/store'
import React, { useState } from 'react'
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { ReactNativeModal } from 'react-native-modal'

interface CreateReviewProps {
    isVisible: boolean
    onClose: () => void
    driverId: number
    rideId: string
    driverName?: string
    onReviewCreated?: () => void
}

const CreateReview: React.FC<CreateReviewProps> = ({
    isVisible,
    onClose,
    driverId,
    rideId,
    driverName = 'Driver',
    onReviewCreated,
}) => {
    const { user } = useUserStore()
    const [rating, setRating] = useState(0)
    const [reviewText, setReviewText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Error', 'Please select a rating')
            return
        }

        if (!user?.id) {
            Alert.alert('Error', 'User not authenticated')
            return
        }

        try {
            setIsSubmitting(true)
            const response = await fetchAPI('/(api)/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rideId,
                    userId: user.id,
                    driverId,
                    rating,
                    reviewText: reviewText.trim() || undefined,
                }),
            })

            if (response.success) {
                Alert.alert('Success', 'Review submitted successfully!')
                onReviewCreated?.()
                handleClose()
            } else {
                throw new Error(response.error || 'Failed to submit review')
            }
        } catch (error) {
            console.error('Error submitting review:', error)
            Alert.alert('Error', 'Failed to submit review. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setRating(0)
        setReviewText('')
        onClose()
    }

    return (
        <ReactNativeModal
            isVisible={isVisible}
            onBackdropPress={handleClose}
            onSwipeComplete={handleClose}
            swipeDirection="down"
        >
            <View className="bg-white rounded-t-3xl p-6 min-h-[400px]">
                <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

                <Text className="text-2xl font-JakartaBold text-center mb-2">
                    Rate Your Ride
                </Text>

                <Text className="text-gray-600 text-center mb-6">
                    How was your experience with {driverName}?
                </Text>

                <View className="items-center mb-6">
                    <StarRating
                        rating={rating}
                        onRatingChange={setRating}
                        size={40}
                        starStyle="mb-2"
                    />
                    <Text className="text-gray-500">
                        {rating === 0 && 'Tap to rate'}
                        {rating === 1 && 'Poor'}
                        {rating === 2 && 'Fair'}
                        {rating === 3 && 'Good'}
                        {rating === 4 && 'Very Good'}
                        {rating === 5 && 'Excellent'}
                    </Text>
                </View>

                <View className="mb-6">
                    <Text className="text-lg font-JakartaSemiBold mb-2">
                        Write a review (optional)
                    </Text>
                    <TextInput
                        value={reviewText}
                        onChangeText={setReviewText}
                        placeholder="Share your experience..."
                        multiline
                        numberOfLines={4}
                        className="border border-gray-300 rounded-lg p-3 text-base min-h-[100px]"
                        maxLength={500}
                        textAlignVertical="top"
                    />
                    <Text className="text-gray-400 text-sm mt-1 text-right">
                        {reviewText.length}/500
                    </Text>
                </View>

                <View className="flex-row space-x-3">
                    <TouchableOpacity
                        onPress={handleClose}
                        className="flex-1 bg-gray-200 py-3 rounded-lg"
                        disabled={isSubmitting}
                    >
                        <Text className="text-center font-JakartaSemiBold">
                            Cancel
                        </Text>
                    </TouchableOpacity>

                    <CustomButton
                        title={isSubmitting ? 'Submitting...' : 'Submit Review'}
                        onPress={handleSubmit}
                        className="flex-1"
                        isLoading={isSubmitting}
                    />
                </View>
            </View>
        </ReactNativeModal>
    )
}

export default CreateReview
