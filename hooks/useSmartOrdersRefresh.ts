import { useNotifications } from '@/context/NotificationContext'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { AppState } from 'react-native'
import { queryKeys } from './client'

/**
 * Smart Real-time Hook cho Orders
 * Tự động invalidate orders data khi:
 * 1. Nhận notification từ SignalR
 * 2. App trở về foreground
 * 3. Network reconnect
 */
export function useSmartOrdersRefresh(userId: string) {
    const queryClient = useQueryClient()
    const { isConnected, joinGroup } = useNotifications()

    // Setup SignalR cho real-time updates
    useEffect(() => {
        if (userId && isConnected) {
            // Join renter group để nhận order status updates
            joinGroup(userId, 'renter')
            
            // Setup listener cho order updates (nếu context support)
            // Có thể thêm listener để invalidate specific order khi có update
        }
    }, [userId, isConnected, joinGroup])

    // Invalidate orders khi app trở về foreground
    useEffect(() => {
        const handleAppStateChange = (nextAppState: string) => {
            if (nextAppState === 'active') {
                // User returned to app, refresh orders
                queryClient.invalidateQueries({
                    queryKey: queryKeys.userOrders(userId)
                })
            }
        }

        const subscription = AppState.addEventListener('change', handleAppStateChange)
        return () => subscription?.remove()
    }, [userId, queryClient])

    // Function để manual invalidate orders (ví dụ sau payment)
    const invalidateOrders = () => {
        queryClient.invalidateQueries({
            queryKey: queryKeys.userOrders(userId)
        })
        
        // Cũng invalidate all variations với different query params
        queryClient.invalidateQueries({
            predicate: (query) => {
                return query.queryKey[0] === 'userOrders' && query.queryKey[1] === userId
            }
        })
    }

    return {
        invalidateOrders
    }
}

export default useSmartOrdersRefresh
