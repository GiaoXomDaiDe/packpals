import { useEffect, useState } from 'react'
import { orderAPI, OrderCountdownData } from './api/order.api'

/**
 * Hook for using order countdown with real-time updates
 */
export const useOrderCountdown = (orderId: string, updateInterval: number = 60000) => {
    const [countdown, setCountdown] = useState<OrderCountdownData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!orderId) return

        const fetchCountdown = async () => {
            try {
                setError(null)
                const countdownData = await orderAPI.getOrderCountdown(orderId)
                setCountdown(countdownData)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }

        fetchCountdown()
        
        // Update at specified interval
        const interval = setInterval(fetchCountdown, updateInterval)
        return () => clearInterval(interval)
    }, [orderId, updateInterval])

    return { countdown, loading, error }
}

/**
 * Hook for using multiple order countdowns
 */
export const useMultipleOrderCountdown = (orderIds: string[], updateInterval: number = 300000) => {
    const [countdowns, setCountdowns] = useState<OrderCountdownData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!orderIds.length) {
            setCountdowns([])
            setLoading(false)
            return
        }

        const fetchCountdowns = async () => {
            try {
                setError(null)
                const countdownData = await orderAPI.getMultipleOrderCountdown(orderIds)
                setCountdowns(countdownData)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }

        fetchCountdowns()
        
        // Update every 5 minutes for bulk operations
        const interval = setInterval(fetchCountdowns, updateInterval)
        return () => clearInterval(interval)
    }, [orderIds, updateInterval])

    return { countdowns, loading, error }
}
