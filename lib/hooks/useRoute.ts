import { useEffect, useState } from 'react'
import { RouteResult, RouteServiceParams, routeService } from '../services/route.service'

interface UseRouteOptions {
    enabled?: boolean
    onSuccess?: (route: RouteResult) => void
    onError?: (error: Error) => void
}

export const useRoute = (params: RouteServiceParams | null, options: UseRouteOptions = {}) => {
    const [route, setRoute] = useState<RouteResult | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const { enabled = true, onSuccess, onError } = options

    const fetchRoute = async () => {
        if (!params || !enabled) return

        setIsLoading(true)
        setError(null)

        try {
            const routeResult = await routeService.getRoute(params)
            setRoute(routeResult)
            onSuccess?.(routeResult)
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to fetch route')
            setError(error)
            onError?.(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchRoute()
    }, [
        params?.origin.latitude,
        params?.origin.longitude,
        params?.destination.latitude,
        params?.destination.longitude,
        params?.travelMode,
        enabled
    ])

    const refetch = () => {
        fetchRoute()
    }

    return {
        route,
        isLoading,
        error,
        refetch,
    }
}

export const useTravelInfo = (params: RouteServiceParams | null, options: UseRouteOptions = {}) => {
    const [travelInfo, setTravelInfo] = useState<{
        distance: { text: string; value: number }
        duration: { text: string; value: number }
    } | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const { enabled = true, onSuccess, onError } = options

    useEffect(() => {
        if (!params || !enabled) return

        const fetchTravelInfo = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const info = await routeService.getTravelInfo(params)
                setTravelInfo(info)
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to fetch travel info')
                setError(error)
                onError?.(error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchTravelInfo()
    }, [
        params?.origin.latitude,
        params?.origin.longitude,
        params?.destination.latitude,
        params?.destination.longitude,
        params?.travelMode,
        enabled
    ])

    return {
        travelInfo,
        isLoading,
        error,
    }
}