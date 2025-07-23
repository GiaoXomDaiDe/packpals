import { distanceAPI } from '@/lib/api'
import { DistanceRequest, DistanceSuccessResponse } from '@/lib/types/type'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { queryKeys } from '../client'

// Distance Query
export function useDistance(
  request: DistanceRequest,
  options?: Omit<UseQueryOptions<DistanceSuccessResponse>, 'queryKey' | 'queryFn' | 'enabled' | 'staleTime' |
  'cacheTime'>
) {
  return useQuery<DistanceSuccessResponse>({
    queryKey: queryKeys.distance(request),
    queryFn: () => distanceAPI.getDistance(request),
    enabled: !!(request.userLatitude && request.userLongitude && request.storageLatitude && request.storageLongitude),
    staleTime: 1000 * 60 * 10, // 10 minutes - distance doesn't change frequently
    cacheTime: 1000 * 60 * 30, // 30 minutes cache
    ...options,
  })
}

export default useDistance