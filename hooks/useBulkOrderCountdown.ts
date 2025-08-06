import { useCallback, useEffect, useRef, useState } from 'react';
import { orderAPI, OrderCountdownData } from './api/order.api';

interface BulkCountdownData {
    [orderId: string]: OrderCountdownData;
}

export const useBulkOrderCountdown = (orderIds: string[], serverSyncInterval: number = 10 * 60 * 1000) => {
    const [countdowns, setCountdowns] = useState<BulkCountdownData>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
    
    // Use refs to store intervals so they persist across re-renders
    const serverSyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const clientUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Function to fetch countdown data from server
    const fetchCountdownsFromServer = useCallback(async () => {
        if (orderIds.length === 0) {
            setCountdowns({})
            setLoading(false)
            return
        }

        try {
            setError(null)
            const countdownArray = await orderAPI.getMultipleOrderCountdown(orderIds)
            
            // Convert array to object for easier lookup
            const countdownMap: BulkCountdownData = {}
            countdownArray.forEach(countdown => {
                countdownMap[countdown.orderId] = countdown
            })
            
            setCountdowns(countdownMap)
            setLastSyncTime(new Date())

        } catch (err) {
            console.error('❌ Failed to fetch bulk countdown:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch countdown data')
        } finally {
            setLoading(false)
        }
    }, [orderIds])

    // Function to update countdown data on client side (real-time)
    const updateClientSideCountdowns = useCallback(() => {
        setCountdowns(prevCountdowns => {
            const updatedCountdowns: BulkCountdownData = {}
            
            Object.entries(prevCountdowns).forEach(([orderId, countdown]) => {
                updatedCountdowns[orderId] = orderAPI.calculateClientSideCountdown(countdown)
            })
            
            return updatedCountdowns
        })
    }, [])

    // Memoize orderIds string for dependency array
    const orderIdsString = orderIds.join(',')

    // Initial fetch and setup intervals
    useEffect(() => {
        // Clear existing intervals
        if (serverSyncIntervalRef.current) {
            clearInterval(serverSyncIntervalRef.current)
        }
        if (clientUpdateIntervalRef.current) {
            clearInterval(clientUpdateIntervalRef.current)
        }

        if (orderIds.length === 0) {
            setCountdowns({})
            setLoading(false)
            return
        }

        // Fetch initial data
        fetchCountdownsFromServer()
        
        // Setup server sync interval (every 10 minutes by default)
        serverSyncIntervalRef.current = setInterval(() => {
            console.log('🔄 Syncing countdown data with server...')
            fetchCountdownsFromServer()
        }, serverSyncInterval)
        
        // Setup client-side update interval (every second for real-time)
        clientUpdateIntervalRef.current = setInterval(() => {
            updateClientSideCountdowns()
        }, 1000)

        // Cleanup function
        return () => {
            if (serverSyncIntervalRef.current) {
                clearInterval(serverSyncIntervalRef.current)
            }
            if (clientUpdateIntervalRef.current) {
                clearInterval(clientUpdateIntervalRef.current)
            }
        }
    }, [orderIdsString, serverSyncInterval, fetchCountdownsFromServer, updateClientSideCountdowns, orderIds.length])

    // Manual refresh function
    const refreshFromServer = async () => {
        console.log('🔄 Manual refresh from server...')
        await fetchCountdownsFromServer()
    }

    // Get countdown for specific order
    const getCountdownForOrder = (orderId: string): OrderCountdownData | null => {
        return countdowns[orderId] || null
    }

    // Get all countdowns
    const getAllCountdowns = (): OrderCountdownData[] => {
        return Object.values(countdowns)
    }

    // Get expired orders
    const getExpiredOrders = (): OrderCountdownData[] => {
        return Object.values(countdowns).filter(countdown => countdown.isExpired)
    }

    // Get active orders
    const getActiveOrders = (): OrderCountdownData[] => {
        return Object.values(countdowns).filter(countdown => !countdown.isExpired)
    }

    return {
        countdowns,
        loading,
        error,
        lastSyncTime,
        refreshFromServer,
        getCountdownForOrder,
        getAllCountdowns,
        getExpiredOrders,
        getActiveOrders
    }
}
