import { useEffect, useState } from 'react'
import { storageAPI } from '../api/storage.api'

interface UseStorageDistanceParams {
    userLatitude: number
    userLongitude: number
    storageLatitude: number
    storageLongitude: number
}

interface StorageDistanceResult {
    distance?: number // in kilometers
    duration?: number // in minutes
    error?: string
}

export const useStorageDistance = (
    params: UseStorageDistanceParams | null,
    enabled: boolean = true
) => {
    const [result, setResult] = useState<StorageDistanceResult | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!params || !enabled) {
            setResult(null)
            return
        }

        const fetchDistance = async () => {
            setIsLoading(true)
            try {
                const response = await storageAPI.getDistance({
                    lat1: params.userLatitude,
                    lon1: params.userLongitude,
                    lat2: params.storageLatitude,
                    lon2: params.storageLongitude,
                })

                // Assuming the API returns { distance: number, duration: number }
                setResult({
                    distance: response.data?.distance || response.distance,
                    duration: response.data?.duration || response.duration,
                })
            } catch (error) {
                console.error('Error fetching storage distance:', error)
                setResult({
                    error: error instanceof Error ? error.message : 'Failed to get distance'
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchDistance()
    }, [
        params?.userLatitude,
        params?.userLongitude,
        params?.storageLatitude,
        params?.storageLongitude,
        enabled
    ])

    return {
        result,
        isLoading,
        refetch: () => {
            if (params && enabled) {
                // Re-trigger the effect
                setResult(null)
            }
        }
    }
}