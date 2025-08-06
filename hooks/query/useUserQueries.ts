import { useQuery } from '@tanstack/react-query'
import { UserAPI } from '../api/user.api'
import { queryKeys } from '../client'

// Create userAPI instance
const userAPI = new UserAPI()

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
    return useQuery({
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
    return useQuery({
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

/**
 * Hook to get keeper ID by user ID
 */
export const useKeeperIdByUserId = (
    userId: string,
    options?: {
        enabled?: boolean
        staleTime?: number
        refetchOnWindowFocus?: boolean
    }
) => {
    return useQuery<string | null>({
        queryKey: [...queryKeys.userDetail(userId), 'keeperId'],
        queryFn: () => userAPI.getKeeperIdByUserId(userId),
        enabled: !!userId && options?.enabled !== false,
        staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    })
}

/**
 * Hook to get renter ID by user ID
 */
export const useRenterIdByUserId = (
    userId: string,
    options?: {
        enabled?: boolean
        staleTime?: number
        refetchOnWindowFocus?: boolean
    }
) => {
    return useQuery<string | null>({
        queryKey: [...queryKeys.userDetail(userId), 'renterId'],
        queryFn: () => userAPI.getRenterIdByUserId(userId),
        enabled: !!userId && options?.enabled !== false,
        staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    })
}