  import { storageAPI } from '@/hooks/api'
import { useMutation, UseMutationOptions, useQuery, UseQueryOptions } from '@tanstack/react-query'
import {
  KeeperStoragesApiResponse,
  SingleStorageApiResponse,
  StorageSuccessResponse,
  SuccessResponse
} from '../../types/type'
import { invalidateQueries, queryKeys } from '../client'

export enum AvailableStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
}

interface queryParams {
  status: AvailableStatus,
  page: number,
  limit: number,
  address: string,
}

// Lấy danh sách kho đồ
export function useStorageAll(
  query?: Partial<queryParams>,
  options?: Omit<UseQueryOptions<StorageSuccessResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<StorageSuccessResponse>({
    queryKey: queryKeys.storageList(query),
    queryFn: () => storageAPI.getAllStorages(query),
    ...options,
  })
}

// Single Storage Query
export function useStorage(
  storageId: string,
  options?: Omit<UseQueryOptions<SingleStorageApiResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<SingleStorageApiResponse>({
    queryKey: queryKeys.storage(storageId),
    queryFn: () => storageAPI.getStorageById(storageId),
    enabled: !!storageId,
    ...options,
  })
}

// Keeper Storages Query - Now uses real API
export function useKeeperStorages(
  keeperId: string,
  options?: Omit<UseQueryOptions<KeeperStoragesApiResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<KeeperStoragesApiResponse>({
    queryKey: queryKeys.keeperStorages(keeperId),
    queryFn: () => storageAPI.getStoragesByKeeperId(keeperId),
    enabled: !!keeperId,
    ...options,
  })
}

// Create Storage Mutation
export function useCreateStorage(
  options?: UseMutationOptions<SuccessResponse<string>, Error, {
    description: string
    address: string
    keeperId: string
  }>
) {
  return useMutation<SuccessResponse<string>, Error, {
    description: string
    address: string
    keeperId: string
  }>({
    mutationFn: (data) => storageAPI.createStorage(data),
    onSuccess: (data, variables) => {
      // Invalidate keeper storages list
      invalidateQueries.keeperStorages(variables.keeperId)
      invalidateQueries.allStorages()
    },
    ...options,
  })
}

// Update Storage Mutation
export function useUpdateStorage(
  options?: UseMutationOptions<any, Error, {
    id: string
    description?: string
    address?: string
    status?: string
  }>
) {
  return useMutation({
    mutationFn: (data: {
      id: string
      description?: string
      address?: string
      status?: string
    }) => storageAPI.updateStorage(data.id, data),
    onSuccess: (data, variables) => {
      // Invalidate specific storage and related queries
      invalidateQueries.storage(variables.id)
      invalidateQueries.allStorages()
    },
    ...options,
  })
}

// Delete Storage Mutation
export function useDeleteStorage(
  options?: UseMutationOptions<any, Error, string>
) {
  return useMutation({
    mutationFn: (storageId: string) => storageAPI.deleteStorage(storageId),
    onSuccess: () => {
      // Invalidate all storage queries
      invalidateQueries.allStorages()
    },
    ...options,
  })
}

// Keeper Pending Orders Count Query
export function useKeeperPendingOrdersCount(
  keeperId: string,
  options?: Omit<UseQueryOptions<SuccessResponse<number>>, 'queryKey' | 'queryFn'>
) {
  return useQuery<SuccessResponse<number>>({
    queryKey: queryKeys.keeperPendingOrdersCount(keeperId),
    queryFn: () => storageAPI.getTotalPendingOrdersByKeeperId(keeperId),
    enabled: !!keeperId,
    ...options,
  })
}

// Distance Query - Calculate distance between two coordinates
export function useDistance(
  params: {
    lat1: number
    lon1: number
    lat2: number
    lon2: number
  },
  options?: Omit<UseQueryOptions<SuccessResponse<number>>, 'queryKey' | 'queryFn'>
) {
  return useQuery<SuccessResponse<number>>({
    queryKey: ['distance', params.lat1, params.lon1, params.lat2, params.lon2],
    queryFn: () => storageAPI.getDistance(params),
    enabled: !!(params.lat1 && params.lon1 && params.lat2 && params.lon2),
    staleTime: 5 * 60 * 1000, // Distance rarely changes, cache for 5 minutes
    ...options,
  })
}

// Alias for useKeeperStorages to match the naming in new components
export const useStoragesByKeeper = useKeeperStorages