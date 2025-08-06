import { useLocationStore } from '@/store'
import * as Location from 'expo-location'
import { useCallback, useEffect, useRef, useState } from 'react'

interface LocationData {
    latitude: number
    longitude: number
    address: string
    addressObj?: any
    accuracy?: number
    timestamp: number
}

interface LocationOptions {
    enableHighAccuracy?: boolean
    distanceFilter?: number
    timeInterval?: number
    accuracyThreshold?: number
    maxJumpDistance?: number
    enableKalmanFilter?: boolean
}

// Simple Kalman Filter implementation for GPS smoothing
class SimpleKalmanFilter {
    private Q: number // Process noise
    private R: number // Measurement noise
    private P: number // Estimation error
    private K: number // Kalman gain
    public X: number // Current estimate (public for initialization)

    constructor(processNoise = 0.01, measurementNoise = 0.25) {
        this.Q = processNoise
        this.R = measurementNoise
        this.P = 1
        this.K = 0
        this.X = 0
    }

    filter(measurement: number): number {
        // Prediction step
        this.P = this.P + this.Q

        // Update step
        this.K = this.P / (this.P + this.R)
        this.X = this.X + this.K * (measurement - this.X)
        this.P = (1 - this.K) * this.P

        return this.X
    }

    reset() {
        this.P = 1
        this.K = 0
        this.X = 0
    }
}

export const useEnhancedLocation = (options: LocationOptions = {}) => {
    const {
        enableHighAccuracy = true,
        distanceFilter = 5, // Minimum 5m movement to trigger update
        timeInterval = 2000, // Minimum 2s between updates
        accuracyThreshold = 30, // Ignore readings worse than 30m accuracy
        maxJumpDistance = 100, // Ignore jumps > 100m within 2s
        enableKalmanFilter = true
    } = options

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [locationData, setLocationData] = useState<LocationData | null>(null)
    
    const { setUserLocation } = useLocationStore()
    
    // Refs for filtering
    const lastValidLocation = useRef<LocationData | null>(null)
    const lastUpdateTime = useRef<number>(0)
    const watchSubscription = useRef<Location.LocationSubscription | null>(null)
    
    // Kalman filters for latitude and longitude
    const latitudeFilter = useRef(new SimpleKalmanFilter())
    const longitudeFilter = useRef(new SimpleKalmanFilter())

    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = useCallback((
        lat1: number, lon1: number, 
        lat2: number, lon2: number
    ): number => {
        const R = 6371000 // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        return R * c
    }, [])

    // Filter function to validate GPS readings
    const isValidLocation = useCallback((
        newLocation: Location.LocationObject
    ): boolean => {
        const { coords } = newLocation
        const now = Date.now()

        // Check accuracy threshold (Strategy #2)
        if (coords.accuracy && coords.accuracy > accuracyThreshold) {
            console.log(`🚫 Location rejected - poor accuracy: ${coords.accuracy}m`)
            return false
        }

        // Check for teleportation (Strategy #2)
        if (lastValidLocation.current && lastUpdateTime.current) {
            const timeDiff = (now - lastUpdateTime.current) / 1000 // seconds
            const distance = calculateDistance(
                lastValidLocation.current.latitude,
                lastValidLocation.current.longitude,
                coords.latitude,
                coords.longitude
            )

            // Reject if moved more than maxJumpDistance in less than 2 seconds
            if (distance > maxJumpDistance && timeDiff < 2) {
                console.log(`🚫 Location rejected - teleportation: ${distance}m in ${timeDiff}s`)
                return false
            }
        }

        return true
    }, [accuracyThreshold, maxJumpDistance, calculateDistance])

    // Process and filter location data
    const processLocation = useCallback(async (location: Location.LocationObject) => {
        if (!isValidLocation(location)) {
            return
        }

        let { latitude, longitude } = location.coords
        const now = Date.now()

        // Apply Kalman filtering (Strategy #4)
        if (enableKalmanFilter) {
            // Initialize filters with first reading
            if (!lastValidLocation.current) {
                latitudeFilter.current = new SimpleKalmanFilter()
                longitudeFilter.current = new SimpleKalmanFilter()
                latitudeFilter.current.X = latitude
                longitudeFilter.current.X = longitude
            } else {
                latitude = latitudeFilter.current.filter(latitude)
                longitude = longitudeFilter.current.filter(longitude)
            }
        }

        // Round coordinates to reduce micro-updates (similar to your EnhancedMap precision)
        const processedLatitude = Number(latitude.toFixed(6))
        const processedLongitude = Number(longitude.toFixed(6))

        try {
            // Reverse geocoding with error handling
            let address = 'Current Location'
            let addressObj = null

            try {
                const geocodeResult = await Location.reverseGeocodeAsync({
                    latitude: processedLatitude,
                    longitude: processedLongitude,
                })
                
                if (geocodeResult && geocodeResult.length > 0) {
                    addressObj = geocodeResult[0]
                    // Create a simple formatted address
                    const addr = geocodeResult[0]
                    const parts = [
                        addr.streetNumber,
                        addr.street,
                        addr.district,
                        addr.city
                    ].filter(Boolean)
                    address = parts.length > 0 ? parts.join(', ') : 'Current Location'
                }
            } catch (geocodingError) {
                console.warn('Reverse geocoding failed:', geocodingError)
            }

            const processedLocationData: LocationData = {
                latitude: processedLatitude,
                longitude: processedLongitude,
                address,
                addressObj,
                accuracy: location.coords.accuracy || undefined,
                timestamp: now
            }

            // Update state and store
            setLocationData(processedLocationData)
            setUserLocation(processedLocationData)
            
            // Update tracking refs
            lastValidLocation.current = processedLocationData
            lastUpdateTime.current = now

            console.log(`📍 Location updated: ${processedLatitude}, ${processedLongitude} (±${location.coords.accuracy?.toFixed(1)}m)`)

        } catch (error) {
            console.error('Error processing location:', error)
            setError('Failed to process location data')
        }
    }, [isValidLocation, enableKalmanFilter, setUserLocation])

    // Start location tracking with enhanced options
    const startLocationTracking = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            // Request permissions
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
                throw new Error('Location permission not granted')
            }

            // Enable high accuracy mode on Android (Strategy #5)
            try {
                await Location.enableNetworkProviderAsync()
            } catch {
                console.log('Network provider already enabled or not supported')
            }

            // Get initial position with high accuracy (Strategy #1)
            const initialLocation = await Location.getCurrentPositionAsync({
                accuracy: enableHighAccuracy 
                    ? Location.Accuracy.BestForNavigation 
                    : Location.Accuracy.High,
            })

            await processLocation(initialLocation)

            // Start continuous tracking with filtering (Strategy #3)
            watchSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: enableHighAccuracy 
                        ? Location.Accuracy.Highest 
                        : Location.Accuracy.High,
                    distanceInterval: distanceFilter, // Minimum distance in meters
                    timeInterval: timeInterval, // Minimum time in milliseconds
                },
                processLocation
            )

            setIsLoading(false)
            console.log('🎯 Enhanced location tracking started')

        } catch (error) {
            setIsLoading(false)
            const errorMessage = error instanceof Error ? error.message : 'Unknown location error'
            setError(errorMessage)
            console.error('Enhanced location error:', error)
        }
    }, [enableHighAccuracy, distanceFilter, timeInterval, processLocation])

    // Stop location tracking
    const stopLocationTracking = useCallback(() => {
        if (watchSubscription.current) {
            watchSubscription.current.remove()
            watchSubscription.current = null
            console.log('📍 Location tracking stopped')
        }
    }, [])

    // Get current location once (without tracking)
    const getCurrentLocation = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            const { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
                throw new Error('Location permission not granted')
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: enableHighAccuracy 
                    ? Location.Accuracy.BestForNavigation 
                    : Location.Accuracy.High,
            })

            await processLocation(location)
            setIsLoading(false)

        } catch (error) {
            setIsLoading(false)
            const errorMessage = error instanceof Error ? error.message : 'Unknown location error'
            setError(errorMessage)
            console.error('Get current location error:', error)
        }
    }, [enableHighAccuracy, processLocation])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopLocationTracking()
        }
    }, [stopLocationTracking])

    return {
        locationData,
        isLoading,
        error,
        startLocationTracking,
        stopLocationTracking,
        getCurrentLocation,
        // Helper methods
        resetFilters: () => {
            latitudeFilter.current.reset()
            longitudeFilter.current.reset()
            lastValidLocation.current = null
            lastUpdateTime.current = 0
        }
    }
}

export default useEnhancedLocation
