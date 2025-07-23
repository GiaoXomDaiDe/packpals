import { sizeAPI } from '@/lib/api'
import { SizeSuccessResponse } from '@/lib/types/type'
import { useMutation, UseMutationOptions, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { invalidateQueries, queryKeys } from '../client'

export function useSizeList(
  query?: {
    pageIndex?: number
    pageSize?: number
  },
  options?: Omit<UseQueryOptions<SizeSuccessResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<SizeSuccessResponse>({
    queryKey: queryKeys.sizeList(query),
    queryFn: () => sizeAPI.getAllSizes(query),
    staleTime: 1000 * 60 * 30,
    ...options,
  })
}

export function useSize(
  sizeId: string,
  options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['sizes', sizeId],
    queryFn: () => sizeAPI.getSizeById(sizeId),
    enabled: !!sizeId,
    staleTime: 1000 * 60 * 30,
    ...options,
  })
}

export function useCreateSize(
  options?: UseMutationOptions<any, Error, {
    sizeDescription: string
    price: number
  }>
) {
  return useMutation({
    mutationFn: (data: {
      sizeDescription: string
      price: number
    }) => sizeAPI.createSize(data),
    onSuccess: () => {
      invalidateQueries.allSizes()
    },
    ...options,
  })
}

export function useUpdateSize(
  options?: UseMutationOptions<any, Error, {
    id: string
    sizeDescription: string
    price: number
  }>
) {
  return useMutation({
    mutationFn: ({ id, ...data }: {
      id: string
      sizeDescription: string
      price: number
    }) => sizeAPI.updateSize(id, data),
    onSuccess: () => {
      invalidateQueries.allSizes()
    },
    ...options,
  })
}

export function useDeleteSize(
  options?: UseMutationOptions<any, Error, string>
) {
  return useMutation({
    mutationFn: (sizeId: string) => sizeAPI.deleteSize(sizeId),
    onSuccess: () => {
      invalidateQueries.allSizes()
    },
    ...options,
  })
}