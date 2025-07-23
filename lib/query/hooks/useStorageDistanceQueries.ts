import { useQuery } from '@tanstack/react-query'
import { storageAPI } from '@/lib/api/storage.api'
import { queryKeys } from '../client'

/**
 * Hook to get distance between two coordinates using storage API
 */
export const useStorageDistance = (
    params: {
        lat1: number
        lon1: number
        lat2: number
        lon2: number
    },
    options?: {
        enabled?: boolean
    }
) => {
    return useQuery({
        queryKey: queryKeys.storageDistance(params),
        queryFn: () => storageAPI.getDistance(params),
        enabled: options?.enabled ?? true,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })
}