import { router, useLocalSearchParams } from 'expo-router'
import React, { useState } from 'react'
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { ConfirmationModal } from '@/components/ConfirmationModal'
import CustomModal from '@/components/CustomModal'
import DetailHeader from '@/components/DetailHeader'
import StarRating from '@/components/StarRating'
import { useDeleteRating, useRating, useStorage } from '@/hooks/query'
import { useUserStore } from '@/store'

const RatingDetailScreen: React.FC = () => {
    const params = useLocalSearchParams()
    const ratingId = params.ratingId as string
    const { user } = useUserStore()
    const [isDeleting, setIsDeleting] = useState(false)
    
    // Modal states
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

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

    // Delete rating mutation with enhanced error handling
    const deleteRatingMutation = useDeleteRating({
        onSuccess: () => {
            console.log('✅ Rating deleted successfully');
            setIsDeleting(false);
            setShowSuccessModal(true);
        },
        onError: (error) => {
            console.error('❌ Delete rating error:', error);
            setIsDeleting(false);
            setErrorMessage(error?.message || 'Failed to delete rating. Please try again.');
            setShowErrorModal(true);
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
            setErrorMessage('Rating data not found. Please try again.');
            setShowErrorModal(true);
            return;
        }

        console.log('✅ Navigating to rating form with params:', {
            orderId: 'unknown',
            storageId: rating.storageId,
            storageAddress: storageData?.address || '',
            renterId: rating.renterId,
            existingRating: 'JSON string provided',
        });

        try {
            router.push({
                pathname: '/(root)/rating-form',
                params: {
                    orderId: 'unknown', // We don't have order ID in rating detail
                    storageId: rating.storageId,
                    storageAddress: storageData?.address || '',
                    renterId: rating.renterId,
                    existingRating: JSON.stringify(rating),
                    isEdit: 'true', // Flag to indicate this is an edit operation
                },
            });
        } catch (error) {
            console.error('❌ Navigation error:', error);
            setErrorMessage('Failed to navigate to edit form. Please try again.');
            setShowErrorModal(true);
        }
    }

    // Handle rating delete with better error handling
    const handleDeleteRating = () => {
        if (!rating || !userId) {
            setErrorMessage('Missing required data for delete operation.');
            setShowErrorModal(true);
            return;
        }

        setShowDeleteConfirm(true);
    }

    // Confirm delete action
    const confirmDelete = () => {
        setShowDeleteConfirm(false);
        console.log('🗑️ Deleting rating:', {
            ratingId: rating!.id,
            renterId: userId,
            storageId: rating!.storageId,
        });
        
        setIsDeleting(true);
        deleteRatingMutation.mutate({
            ratingId: rating!.id,
            renterId: userId!,
            storageId: rating!.storageId,
        });
    }

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text className="text-text-secondary mt-4 font-JakartaMedium">
                        Loading rating information...
                    </Text>
                </View>
            </SafeAreaView>
        )
    }

    if (hasError || !rating) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="flex-1 items-center justify-center px-6">
                    <View className="bg-danger-soft rounded-full p-6 mb-4">
                        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                    </View>
                    <Text className="text-danger text-xl font-JakartaBold mb-2 text-center">
                        Unable to load rating
                    </Text>
                    <Text className="text-text-secondary text-center mb-6">
                        {ratingError?.message || 'The rating you are looking for does not exist or has been deleted'}
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-primary rounded-2xl px-6 py-3"
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
        <SafeAreaView className="flex-1 bg-background">
            <DetailHeader 
                title="My Rating"
                subtitle={`ID: ${rating.id.slice(-8)}`}
                showBackButton={true}
                onBackPress={() => router.back()}
            />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Compact Hero Rating Section */}
                <View className="bg-primary px-6 py-8">
                    <View className="items-center">
                        <View className="bg-white/20 rounded-full p-4 mb-4">
                            <Ionicons name="star" size={28} color="white" />
                        </View>
                        
                        <Text className="text-white text-3xl font-JakartaBold mb-2">
                            {rating.star}/5
                        </Text>
                        
                        <StarRating
                            rating={rating.star}
                            size="small"
                            readonly={true}
                            showValue={false}
                        />
                        
                        <Text className="text-white/80 text-xs mt-3 font-JakartaMedium text-center">
                            {formatRatingDate(rating.ratingDate)}
                        </Text>
                    </View>
                </View>

                <View className="px-4 -mt-3">
                    {/* Compact Comment Card */}
                    <View className="bg-surface rounded-xl p-4 mb-4 shadow-sm">
                        <View className="flex-row items-center mb-3">
                            <View className="bg-primary-soft rounded-full p-2 mr-2">
                                <Ionicons name="chatbubble-outline" size={16} color="#2563eb" />
                            </View>
                            <Text className="text-base font-JakartaBold text-text">
                                Comment
                            </Text>
                        </View>
                        
                        <Text className="text-text text-sm leading-5 font-JakartaRegular italic">
                            &ldquo;{rating.comment}&rdquo;
                        </Text>
                    </View>

                    {/* Compact Storage Info Card */}
                    {storageData && (
                        <View className="bg-surface rounded-xl p-4 mb-4 shadow-sm">
                            <View className="flex-row items-center mb-3">
                                <View className="bg-accent-soft rounded-full p-2 mr-2">
                                    <Ionicons name="business" size={16} color="#06b6d4" />
                                </View>
                                <Text className="text-base font-JakartaBold text-text">
                                    Storage
                                </Text>
                            </View>
                            
                            {/* Compact Keeper Info */}
                            <View className="flex-row items-center mb-3">
                                <View className="bg-accent-soft rounded-full p-2 mr-2">
                                    <Ionicons name="person" size={16} color="#06b6d4" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-text font-JakartaBold text-sm">
                                        {storageData.keeperName || 'Storage Keeper'}
                                    </Text>
                                    <Text className="text-text-secondary text-xs">
                                        Storage Manager
                                    </Text>
                                </View>
                            </View>
                            
                            {/* Compact Location */}
                            <View className="flex-row items-start mb-2">
                                <Ionicons name="location-outline" size={14} color="#64748b" className="mt-0.5 mr-2" />
                                <View className="flex-1">
                                    <Text className="text-text-secondary text-xs font-JakartaBold mb-1">
                                        Address
                                    </Text>
                                    <Text className="text-text text-xs">
                                        {storageData.address || 'No address information'}
                                    </Text>
                                </View>
                            </View>

                            {/* Compact Phone */}
                            {storageData.keeperPhoneNumber && (
                                <View className="flex-row items-start">
                                    <Ionicons name="call-outline" size={14} color="#64748b" className="mt-0.5 mr-2" />
                                    <View className="flex-1">
                                        <Text className="text-text-secondary text-xs font-JakartaBold mb-1">
                                            Contact
                                        </Text>
                                        <Text className="text-text text-xs">
                                            {storageData.keeperPhoneNumber}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Compact Action Buttons */}
                    <View className="flex-row gap-3 mb-6">
                        <TouchableOpacity
                            onPress={handleEditRating}
                            disabled={isDeleting || deleteRatingMutation.isPending}
                            className={`flex-1 rounded-lg py-3 px-4 flex-row items-center justify-center ${
                                isDeleting || deleteRatingMutation.isPending 
                                    ? 'bg-primary/50' 
                                    : 'bg-primary'
                            } shadow-sm`}
                        >
                            <Ionicons 
                                name="pencil-outline" 
                                size={18} 
                                color={isDeleting || deleteRatingMutation.isPending ? "#ffffff80" : "white"} 
                            />
                            <Text className={`font-JakartaBold text-sm ml-2 ${
                                isDeleting || deleteRatingMutation.isPending 
                                    ? 'text-white/50' 
                                    : 'text-white'
                            }`}>
                                Edit
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            onPress={handleDeleteRating}
                            disabled={isDeleting || deleteRatingMutation.isPending}
                            className={`flex-1 rounded-lg py-3 px-4 flex-row items-center justify-center ${
                                isDeleting || deleteRatingMutation.isPending 
                                    ? 'bg-red-500' 
                                    : 'bg-red-600'
                            } shadow-sm`}
                        >
                            {isDeleting || deleteRatingMutation.isPending ? (
                                <>
                                    <ActivityIndicator size="small" color="#ffffff" />
                                    <Text className="text-white font-JakartaBold text-sm ml-2">
                                        Deleting...
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="trash-outline" size={18} color="white" />
                                    <Text className="text-white font-JakartaBold text-sm ml-2">
                                        Delete
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                visible={showDeleteConfirm}
                title="Delete Rating"
                message={`Are you sure you want to delete this ${rating?.star}-star rating? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                confirmColor="#dc2626"
                icon="trash-outline"
                iconColor="#dc2626"
                isLoading={isDeleting || deleteRatingMutation.isPending}
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            {/* Success Modal */}
            <CustomModal
                isVisible={showSuccessModal}
                type="success"
                title="Success!"
                message="Your rating has been deleted successfully."
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
    )
}

export default RatingDetailScreen