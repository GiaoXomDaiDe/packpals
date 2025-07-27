import { orderAPI, orderDetailsAPI } from '@/lib/api'
import {
  CreateOrderDetailsParams,
  CreateOrderDetailsResponse,
  CreateOrderRequest,
  OrderSuccessResponse,
  StorageOrdersApiResponse,
  SuccessResponse,
  UpdateOrderRequest,
  UpdateOrderResponse
} from '@/lib/types/type'
import { useMutation, UseMutationOptions, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { invalidateQueries, optimisticUpdates, queryKeys } from '../client'

// Single Order Query
export function useOrder(
  orderId: string,
  options?: Omit<UseQueryOptions<OrderSuccessResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<OrderSuccessResponse>({
    queryKey: queryKeys.order(orderId),
    queryFn: () => orderAPI.getOrderById(orderId),
    enabled: !!orderId,
    ...options,
  })
}

// User Orders Query
export function useUserOrders(
  userId: string,
  query?: {
    IsPaid?: boolean
    Status?: string
    PageIndex?: number
    PageSize?: number
  },
  options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.userOrders(userId, query),
    queryFn: () => orderAPI.getUserOrders(userId, query),
    enabled: !!userId,
    ...options,
  })
}

// Keeper Orders Query
export function useKeeperOrders(
  keeperId: string,
  query?: {
    IsPaid?: boolean
    Status?: string
    PageIndex?: number
    PageSize?: number
  },
  options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.keeperOrders(keeperId, query),
    queryFn: () => orderAPI.getKeeperOrders(keeperId, query),
    enabled: !!keeperId,
    ...options,
  })
}

export function useStorageOrders(
  storageId: string,
  query?: {
    IsPaid?: boolean
    Status?: string
    PageIndex?: number
    PageSize?: number
  },
  options?: Omit<UseQueryOptions<StorageOrdersApiResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<StorageOrdersApiResponse>({
    queryKey: queryKeys.storageOrders(storageId, query),
    queryFn: () => orderAPI.getOrdersByStorage(storageId, query),
    enabled: !!storageId,
    ...options,
  })
}

// Order Details Query
export function useOrderDetails(
  orderId: string,
  options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.orderDetails(orderId),
    queryFn: () => orderDetailsAPI.getOrderDetailsByOrderId(orderId),
    enabled: !!orderId,
    ...options,
  })
}

// Create Order Mutation
export function useCreateOrder(
  options?: UseMutationOptions<string, Error, CreateOrderRequest>
) {
  return useMutation<string, Error, CreateOrderRequest>({
    mutationFn: async (data: CreateOrderRequest) => {
      console.log('🔍 Hook - useCreateOrder mutationFn called with:', data)
      const orderId: string = await orderAPI.createOrder(data)
      console.log('📦 Hook - Received orderId from API:', orderId)
      
      if (!orderId) {
        console.error('❌ Hook - orderId is undefined from API!')
        throw new Error('Order creation failed: No order ID returned')
      }
      
      return orderId // Return the string directly, not response.data
    },
    onSuccess: (orderId, variables) => {
      // Invalidate relevant queries
      invalidateQueries.userOrders(variables.renterId)
      invalidateQueries.storageOrders(variables.storageId)
      invalidateQueries.allOrders()
    },
    ...options,
  })
}

// Update Order Status Mutation
export function useUpdateOrderStatus(
  options?: UseMutationOptions<SuccessResponse<any>, Error, {
    orderId: string
    status: string
    storageId?: string
    renterId?: string // Add renterId for proper invalidation
    orderCertification?: string[]
  }>
) {
  return useMutation<SuccessResponse<any>, Error, {
    orderId: string
    status: string
    storageId?: string
    renterId?: string
    orderCertification?: string[]
  }>({
    mutationFn: ({ orderId, status, orderCertification }: { 
      orderId: string; 
      status: string;
      orderCertification?: string[]
    }) => {
      // Use the new unified PATCH updateOrder method
      return orderAPI.updateOrder({
        id: orderId,
        status,
        ...(orderCertification && orderCertification.length > 0 ? { orderCertification } : {})
      })
    },
    onMutate: async ({ orderId, status }) => {
      // Optimistic update
      optimisticUpdates.updateOrderStatus(orderId, status)
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      invalidateQueries.order(variables.orderId)
      if (variables.storageId) {
        invalidateQueries.storageOrders(variables.storageId)
      }
      invalidateQueries.allOrders()
      
      // 🔄 IMPORTANT: Invalidate user orders to refresh My Orders tab
      if (variables.renterId) {
        invalidateQueries.userOrders(variables.renterId)
      }
    },
    onError: (error, variables) => {
      // Revert optimistic update on error
      invalidateQueries.order(variables.orderId)
    },
    ...options,
  })
}

// Mark Order as Paid Mutation
export function useMarkOrderAsPaid(
  options?: UseMutationOptions<any, Error, {
    orderId: string
    storageId?: string
    renterId?: string // Add renterId for proper invalidation
  }>
) {
  return useMutation({
    mutationFn: ({ orderId }: { orderId: string }) => 
      orderAPI.markOrderAsPaid(orderId),
    onMutate: async ({ orderId }) => {
      // Optimistic update
      optimisticUpdates.updateOrderPayment(orderId, true)
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      invalidateQueries.order(variables.orderId)
      if (variables.storageId) {
        invalidateQueries.storageOrders(variables.storageId)
      }
      invalidateQueries.allOrders()
      
      // 🔄 IMPORTANT: Invalidate user orders to refresh My Orders tab
      if (variables.renterId) {
        invalidateQueries.userOrders(variables.renterId)
      }
    },
    onError: (error, variables) => {
      // Revert optimistic update on error
      invalidateQueries.order(variables.orderId)
    },
    ...options,
  })
}

// Set Order Start Time Mutation
export function useSetOrderStartTime(
  options?: UseMutationOptions<SuccessResponse<any>, Error, string>
) {
  return useMutation<SuccessResponse<any>, Error, string>({
    mutationFn: (orderId: string) => 
      orderAPI.setOrderStartTime(orderId),
    onSuccess: (data, orderId) => {
      // Invalidate relevant queries
      invalidateQueries.order(orderId)
      invalidateQueries.allOrders()
    },
    ...options,
  })
}

// Create Order Details Mutation
// Updated to match POST /api/OrderDetail/{orderId} specification
export function useCreateOrderDetails(
  options?: UseMutationOptions<CreateOrderDetailsResponse, Error, CreateOrderDetailsParams>
) {
  return useMutation<CreateOrderDetailsResponse, Error, CreateOrderDetailsParams>({
    mutationFn: ({ orderId, orderDetails }) => {
      console.log('🔍 Hook - useCreateOrderDetails mutationFn called with:', {
        orderId,
        orderDetailsCount: orderDetails.length,
        hasOrderId: !!orderId
      })
      
      if (!orderId) {
        console.error('❌ Hook - orderId is undefined in mutationFn!')
        throw new Error('Order ID is required but was undefined in mutation')
      }
      
      return orderDetailsAPI.createOrderDetails(orderId, orderDetails)
    },
    onSuccess: (data, variables) => {
      console.log('Order details created successfully:', data)
      // Invalidate order details and related queries
      invalidateQueries.orderDetails(variables.orderId)
      invalidateQueries.order(variables.orderId)
    },
    onError: (error, variables) => {
      console.error('Failed to create order details:', error)
    },
    ...options,
  })
}

// Calculate Final Amount Query (for pickup)
export function useCalculateFinalAmount(
  orderId: string,
  options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.orderFinalAmount(orderId),
    queryFn: () => orderAPI.calculateFinalAmount(orderId),
    enabled: !!orderId,
    // Refetch every 30 seconds when screen is focused to get updated amount
    refetchInterval: 30000,
    ...options,
  })
}

// Update Order Mutation - uses unified PATCH method
export function useUpdateOrder(
  options?: UseMutationOptions<UpdateOrderResponse, Error, UpdateOrderRequest>
) {
  return useMutation<UpdateOrderResponse, Error, UpdateOrderRequest>({
    mutationFn: async (data: UpdateOrderRequest) => {
      console.log('🔄 Hook - useUpdateOrder called with:', data)
      return await orderAPI.updateOrder(data)
    },
    onSuccess: (data, variables) => {
      console.log('✅ Order update completed:', data)
      // Invalidate relevant queries
      invalidateQueries.order(variables.id)
      invalidateQueries.allOrders()
      if (variables.status) {
        // If status was updated, invalidate status-specific queries
        optimisticUpdates.updateOrderStatus(variables.id, variables.status)
      }
    },
    onError: (error, variables) => {
      console.error('❌ Order update failed:', error)
    },
    ...options,
  })
}