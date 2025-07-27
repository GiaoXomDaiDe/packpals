import { useMutation, UseMutationOptions, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { ratingAPI } from '@/lib/api/rating.api'
import { CreateRatingRequest, UpdateRatingRequest, Rating, RatingQuery } from '@/lib/types/rating.types'
import { invalidateQueries, queryKeys } from '../client'

// Single Rating Query
export function useRating(
  ratingId: string,
  options?: Omit<UseQueryOptions<Rating>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Rating>({
    queryKey: queryKeys.rating(ratingId),
    queryFn: () => ratingAPI.getRatingById(ratingId),
    enabled: !!ratingId,
    ...options,
  })
}

// User Ratings Query
export function useUserRatings(
  userId: string,
  query: RatingQuery = {},
  options?: Omit<UseQueryOptions<Rating[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Rating[]>({
    queryKey: queryKeys.userRatings(userId, query),
    queryFn: () => ratingAPI.getUserRatings(userId, query),
    enabled: !!userId,
    ...options,
  })
}

// Storage Ratings Query
export function useStorageRatings(
  storageId: string,
  query: RatingQuery = {},
  options?: Omit<UseQueryOptions<Rating[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Rating[]>({
    queryKey: queryKeys.storageRatings(storageId, query),
    queryFn: () => ratingAPI.getStorageRatings(storageId, query),
    enabled: !!storageId,
    ...options,
  })
}

// Check if User has rated a Storage
export function useUserStorageRating(
  userId: string,
  storageId: string,
  options?: Omit<UseQueryOptions<Rating | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Rating | null>({
    queryKey: queryKeys.userStorageRating(userId, storageId),
    queryFn: () => ratingAPI.hasUserRatedStorage(userId, storageId),
    enabled: !!(userId && storageId),
    ...options,
  })
}

// Storage Rating Statistics Query
export function useStorageRatingStats(
  storageId: string,
  options?: Omit<UseQueryOptions<{
    averageRating: number
    totalRatings: number
    ratingDistribution: { [key: number]: number }
  }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.storageRatingStats(storageId),
    queryFn: () => ratingAPI.getStorageRatingStats(storageId),
    enabled: !!storageId,
    ...options,
  })
}

// Create Rating Mutation
export function useCreateRating(
  options?: UseMutationOptions<string, Error, CreateRatingRequest & { storageId: string }>
) {
  return useMutation<string, Error, CreateRatingRequest & { storageId: string }>({
    mutationFn: async (data) => {
      return await ratingAPI.createRating(data)
    },
    onSuccess: (ratingId, variables) => {
      // Invalidate relevant queries
      invalidateQueries.allRatings()
      invalidateQueries.userRatings(variables.renterId)
      invalidateQueries.storageRatings(variables.storageId)
      invalidateQueries.userStorageRating(variables.renterId, variables.storageId)
      invalidateQueries.storageRatingStats(variables.storageId)
    },
    ...options,
  })
}

// Update Rating Mutation
export function useUpdateRating(
  options?: UseMutationOptions<string, Error, UpdateRatingRequest & { renterId: string; storageId: string }>
) {
  return useMutation<string, Error, UpdateRatingRequest & { renterId: string; storageId: string }>({
    mutationFn: async (data) => {
      return await ratingAPI.updateRating(data)
    },
    onSuccess: (ratingId, variables) => {
      // Invalidate relevant queries
      invalidateQueries.rating(variables.id)
      invalidateQueries.allRatings()
      invalidateQueries.userRatings(variables.renterId)
      invalidateQueries.storageRatings(variables.storageId)
      invalidateQueries.userStorageRating(variables.renterId, variables.storageId)
      invalidateQueries.storageRatingStats(variables.storageId)
    },
    ...options,
  })
}

// Delete Rating Mutation
export function useDeleteRating(
  options?: UseMutationOptions<void, Error, { ratingId: string; renterId: string; storageId: string }>
) {
  return useMutation<void, Error, { ratingId: string; renterId: string; storageId: string }>({
    mutationFn: async ({ ratingId }) => {
      return await ratingAPI.deleteRating(ratingId)
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      invalidateQueries.rating(variables.ratingId)
      invalidateQueries.allRatings()
      invalidateQueries.userRatings(variables.renterId)
      invalidateQueries.storageRatings(variables.storageId)
      invalidateQueries.userStorageRating(variables.renterId, variables.storageId)
      invalidateQueries.storageRatingStats(variables.storageId)
    },
    ...options,
  })
}

// Compound Hook for complete rating management
export function useRatingManagement(renterId: string, storageId: string) {
  const { data: existingRating, isLoading: checkingRating } = useUserStorageRating(renterId, storageId)
  
  const createRatingMutation = useCreateRating({
    onSuccess: () => {
      console.log('✅ Rating created successfully')
    },
    onError: (error) => {
      console.error('❌ Failed to create rating:', error)
    }
  })
  
  const updateRatingMutation = useUpdateRating({
    onSuccess: () => {
      console.log('✅ Rating updated successfully')
    },
    onError: (error) => {
      console.error('❌ Failed to update rating:', error)
    }
  })
  
  const deleteRatingMutation = useDeleteRating({
    onSuccess: () => {
      console.log('✅ Rating deleted successfully')
    },
    onError: (error) => {
      console.error('❌ Failed to delete rating:', error)
    }
  })
  
  return {
    existingRating,
    checkingRating,
    hasRating: !!existingRating,
    createRating: createRatingMutation.mutate,
    updateRating: updateRatingMutation.mutate,
    deleteRating: deleteRatingMutation.mutate,
    isCreating: createRatingMutation.isPending,
    isUpdating: updateRatingMutation.isPending,
    isDeleting: deleteRatingMutation.isPending,
    isWorking: createRatingMutation.isPending || updateRatingMutation.isPending || deleteRatingMutation.isPending,
  }
}