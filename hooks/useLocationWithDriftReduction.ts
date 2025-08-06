import { useEnhancedLocation } from '@/hooks/useEnhancedLocation'
import { useCallback, useEffect } from 'react'
import { Alert } from 'react-native'

/**
 * Example usage of Enhanced Location Service with GPS drift reduction
 * 
 * This demonstrates how to integrate the enhanced location service
 * into your existing components to reduce GPS drift and improve accuracy.
 */

interface UseLocationWithDriftReductionProps {
    enableContinuousTracking?: boolean
    onLocationUpdate?: (locationData: any) => void
    onError?: (error: string) => void
}

export const useLocationWithDriftReduction = ({
    enableContinuousTracking = false,
    onLocationUpdate,
    onError
}: UseLocationWithDriftReductionProps = {}) => {
    
    // Enhanced location service with drift reduction
    const {
        locationData,
        isLoading,
        error,
        startLocationTracking,
        stopLocationTracking,
        getCurrentLocation,
        resetFilters
    } = useEnhancedLocation({
        enableHighAccuracy: true,        // Strategy #1: Use highest accuracy
        distanceFilter: 5,               // Strategy #3: Min 5m movement
        timeInterval: 2000,              // Strategy #3: Min 2s interval
        accuracyThreshold: 30,           // Strategy #2: Reject poor accuracy
        maxJumpDistance: 100,            // Strategy #2: Reject teleportation
        enableKalmanFilter: true         // Strategy #4: Smooth GPS data
    })

    // Handle location updates
    useEffect(() => {
        if (locationData) {
            onLocationUpdate?.(locationData)
        }
    }, [locationData, onLocationUpdate])

    // Handle errors
    useEffect(() => {
        if (error) {
            onError?.(error)
        }
    }, [error, onError])

    // Initialize location service
    const initializeLocation = useCallback(async () => {
        try {
            if (enableContinuousTracking) {
                await startLocationTracking()
            } else {
                await getCurrentLocation()
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Location service failed'
            onError?.(errorMessage)
        }
    }, [enableContinuousTracking, startLocationTracking, getCurrentLocation, onError])

    // Cleanup when component unmounts
    useEffect(() => {
        return () => {
            stopLocationTracking()
        }
    }, [stopLocationTracking])

    return {
        locationData,
        isLoading,
        error,
        initializeLocation,
        stopLocationTracking,
        getCurrentLocation,
        resetFilters,
        // Helper methods
        refreshLocation: getCurrentLocation,
        toggleTracking: enableContinuousTracking ? stopLocationTracking : startLocationTracking
    }
}

// Example implementation for find-storage.tsx
export const LocationExample = () => {
    const { initializeLocation } = useLocationWithDriftReduction({
        enableContinuousTracking: false, // Only get location once for find-storage
        onLocationUpdate: (location) => {
            console.log('📍 Enhanced location received:', {
                lat: location.latitude,
                lng: location.longitude,
                accuracy: location.accuracy,
                address: location.address
            })
        },
        onError: (errorMessage) => {
            Alert.alert('Location Error', errorMessage)
        }
    })

    // Initialize on component mount
    useEffect(() => {
        initializeLocation()
    }, [initializeLocation])

    return null // This is just an example hook
}

/**
 * Integration guide for existing components:
 * 
 * 1. Replace existing location logic in home.tsx:
 * 
 * // OLD CODE:
 * const requestLocationPermission = useCallback(async () => {
 *     let location = await Location.getCurrentPositionAsync({
 *         accuracy: Location.Accuracy.Balanced,
 *     })
 *     // ... process location
 * }, [])
 * 
 * // NEW CODE:
 * const { initializeLocation } = useLocationWithDriftReduction({
 *     onLocationUpdate: (locationData) => {
 *         setUserLocation(locationData)
 *     },
 *     onError: (error) => showError('Location Error', error)
 * })
 * 
 * useEffect(() => {
 *     initializeLocation()
 * }, [])
 * 
 * 
 * 2. For find-storage.tsx (single location update):
 * 
 * const { locationData, refreshLocation } = useLocationWithDriftReduction({
 *     enableContinuousTracking: false
 * })
 * 
 * 
 * 3. For navigation/tracking pages (continuous updates):
 * 
 * const { locationData, stopLocationTracking } = useLocationWithDriftReduction({
 *     enableContinuousTracking: true
 * })
 * 
 * // Stop tracking when leaving page
 * useEffect(() => {
 *     return () => stopLocationTracking()
 * }, [])
 */

export default useLocationWithDriftReduction
