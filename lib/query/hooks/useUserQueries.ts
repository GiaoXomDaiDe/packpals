import { userAPI } from '@/lib/api/user.api'
import { UserDetailApiResponse, UserProfileSuccessResponse } from '@/lib/types/type'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../client'

/**
 * Hook to get user detail by userId
 * Includes keeper/renter profile with phone number
 */
export const useUserDetail = (
    userId: string,
    options?: {
        enabled?: boolean
        staleTime?: number
        refetchOnWindowFocus?: boolean
    }
) => {
    return useQuery<UserDetailApiResponse>({
        queryKey: queryKeys.userDetail(userId),
        queryFn: () => userAPI.getProfile(userId),
        enabled: !!userId && options?.enabled !== false,
        staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    })
}

/**
 * Hook to get user profile (alias for useUserDetail)
 * Used for getting current user's profile information
 */
export const useUserProfile = (
    userId: string,
    options?: {
        enabled?: boolean
        staleTime?: number
        refetchOnWindowFocus?: boolean
    }
) => {
    return useQuery<UserProfileSuccessResponse>({
        queryKey: queryKeys.userProfile(userId),
        queryFn: () => userAPI.getProfile(userId),
        enabled: !!userId && options?.enabled !== false,
        staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    })
}

/**
 * Hook to get keeper detail by keeperId (alias for useUserDetail)
 * This is a convenience hook for getting keeper information
 */
export const useKeeperDetail = (
    keeperId: string,
    options?: {
        enabled?: boolean
        staleTime?: number
        refetchOnWindowFocus?: boolean
    }
) => {
    return useUserDetail(keeperId, options)
}