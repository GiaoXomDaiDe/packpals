import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          if (error?.response?.status === 408 || error?.response?.status === 429) {
            return failureCount < 2
          }
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        // Retry up to 2 times for other errors
        return failureCount < 2
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})

// Query keys factory
export const queryKeys = {
  // Auth
  auth: ['auth'] as const,
  user: (userId: string) => ['user', userId] as const,
  userProfile: (userId: string) => ['user', 'profile', userId] as const,
  userDetail: (userId: string) => ['user', 'detail', userId] as const,

  // Storage
  storages: ['storages'] as const,
  storageList: (filters?: any) => ['storages', 'list', filters] as const,
  storage: (storageId: string) => ['storages', storageId] as const,
  keeperStorages: (keeperId: string) => ['storages', 'keeper', keeperId] as const,
  keeperPendingOrdersCount: (keeperId: string) => ['storages', 'keeper', keeperId, 'pending-orders-count'] as const,
  storageDistance: (params: { lat1: number; lon1: number; lat2: number; lon2: number }) => 
    ['storages', 'distance', params] as const,

  // Orders
  orders: ['orders'] as const,
  orderList: (filters?: any) => ['orders', 'list', filters] as const,
  order: (orderId: string) => ['orders', orderId] as const,
  userOrders: (userId: string, filters?: any) => ['orders', 'user', userId, filters] as const,
  storageOrders: (storageId: string, filters?: any) => ['orders', 'storage', storageId, filters] as const,
  
  // Order Details
  orderDetails: (orderId: string) => ['orderDetails', orderId] as const,

  // Sizes
  sizes: ['sizes'] as const,
  sizeList: (filters?: any) => ['sizes', 'list', filters] as const,

  // Ratings
  ratings: ['ratings'] as const,
  storageRatings: (storageId: string) => ['ratings', 'storage', storageId] as const,
  userRatings: (userId: string) => ['ratings', 'user', userId] as const,

  // Payment
  payment: ['payment'] as const,
  paymentUrl: (orderId: string) => ['payment', 'url', orderId] as const,
  
  // PayOS
  payos: ['payos'] as const,
  payosPayment: (paymentCodeId: number) => ['payos', 'payment', paymentCodeId] as const,

  // Distance
  distance: (request: any) => ['distance', request] as const,
} as const

// Cache invalidation helpers
export const invalidateQueries = {
  // Invalidate all storage-related queries
  allStorages: () => queryClient.invalidateQueries({ queryKey: queryKeys.storages }),
  storage: (storageId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.storage(storageId) }),
  keeperStorages: (keeperId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.keeperStorages(keeperId) }),
  keeperPendingOrdersCount: (keeperId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.keeperPendingOrdersCount(keeperId) }),

  // Invalidate all order-related queries
  allOrders: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders }),
  order: (orderId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) }),
  userOrders: (userId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.userOrders(userId) }),
  storageOrders: (storageId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.storageOrders(storageId) }),

  // Invalidate order details
  orderDetails: (orderId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.orderDetails(orderId) }),

  // Invalidate user-related queries
  user: (userId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.user(userId) }),
  userProfile: (userId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(userId) }),

  // Invalidate sizes
  allSizes: () => queryClient.invalidateQueries({ queryKey: queryKeys.sizes }),

  // Invalidate ratings
  allRatings: () => queryClient.invalidateQueries({ queryKey: queryKeys.ratings }),
  storageRatings: (storageId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.storageRatings(storageId) }),
  
  // Invalidate PayOS
  allPayos: () => queryClient.invalidateQueries({ queryKey: queryKeys.payos }),
  payosPayment: (paymentCodeId: number) => queryClient.invalidateQueries({ queryKey: queryKeys.payosPayment(paymentCodeId) }),
}

// Optimistic update helpers
export const optimisticUpdates = {
  updateOrderStatus: (orderId: string, newStatus: string) => {
    queryClient.setQueryData(queryKeys.order(orderId), (oldData: any) => {
      if (!oldData) return oldData
      return { ...oldData, status: newStatus }
    })
  },

  updateOrderPayment: (orderId: string, isPaid: boolean) => {
    queryClient.setQueryData(queryKeys.order(orderId), (oldData: any) => {
      if (!oldData) return oldData
      return { ...oldData, isPaid }
    })
  },

  addNewOrder: (order: any, storageId: string) => {
    // Add to storage orders list
    queryClient.setQueryData(queryKeys.storageOrders(storageId), (oldData: any) => {
      if (!oldData?.data) return oldData
      return {
        ...oldData,
        data: [order, ...oldData.data]
      }
    })
  },

  removeOrderFromList: (orderId: string, storageId: string) => {
    // Remove from storage orders list
    queryClient.setQueryData(queryKeys.storageOrders(storageId), (oldData: any) => {
      if (!oldData?.data) return oldData
      return {
        ...oldData,
        data: oldData.data.filter((order: any) => order.id !== orderId)
      }
    })
  }
}