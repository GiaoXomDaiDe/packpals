import { fetchAPI } from '@/lib/fetch'
import * as Location from 'expo-location'

export class LocationService {
    private static instance: LocationService
    private watchSubscription: Location.LocationSubscription | null = null
    private isTracking = false

    static getInstance(): LocationService {
        if (!LocationService.instance) {
            LocationService.instance = new LocationService()
        }
        return LocationService.instance
    }

    async requestPermissions(): Promise<boolean> {
        try {
            const { status: foregroundStatus } =
                await Location.requestForegroundPermissionsAsync()

            if (foregroundStatus !== 'granted') {
                console.log('Foreground location permission denied')
                return false
            }

            const { status: backgroundStatus } =
                await Location.requestBackgroundPermissionsAsync()

            if (backgroundStatus !== 'granted') {
                console.log('Background location permission denied')
                return false
            }

            return true
        } catch (error) {
            console.error('Error requesting permissions:', error)
            return false
        }
    }

    async startTracking(driverId: string): Promise<boolean> {
        if (this.isTracking) {
            console.log('Already tracking location')
            return true
        }

        const hasPermission = await this.requestPermissions()
        if (!hasPermission) {
            return false
        }

        try {
            this.watchSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 5000, // Update every 5 seconds
                    distanceInterval: 10, // Update when moved 10 meters
                },
                (location) => {
                    this.updateDriverLocation(driverId, location)
                }
            )

            this.isTracking = true
            console.log('Started location tracking')
            return true
        } catch (error) {
            console.error('Error starting location tracking:', error)
            return false
        }
    }

    async stopTracking(): Promise<void> {
        if (this.watchSubscription) {
            this.watchSubscription.remove()
            this.watchSubscription = null
        }
        this.isTracking = false
        console.log('Stopped location tracking')
    }

    private async updateDriverLocation(
        clerkUserId: string,
        location: Location.LocationObject
    ): Promise<void> {
        try {
            console.log(
                'Updating location for user:',
                clerkUserId,
                'at:',
                location.coords.latitude,
                location.coords.longitude
            )

            await fetchAPI('/(api)/location/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clerk_user_id: clerkUserId,
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    heading: location.coords.heading || 0,
                    speed: location.coords.speed || 0,
                    accuracy: location.coords.accuracy || 0,
                }),
            })

            console.log('Successfully updated location')
        } catch (error) {
            console.error('Error updating driver location:', error)
        }
    }

    isCurrentlyTracking(): boolean {
        return this.isTracking
    }
}
