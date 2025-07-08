import { LocationService } from '@/services/LocationService'
import { useUser } from '@clerk/clerk-expo'
import { useEffect, useState } from 'react'
import { Alert } from 'react-native'

export const useDriverTracking = () => {
    const { user } = useUser()
    const [isTracking, setIsTracking] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const locationService = LocationService.getInstance()

    const startTracking = async () => {
        if (!user?.id) {
            setError('User not authenticated')
            return false
        }

        try {
            setError(null)
            const success = await locationService.startTracking(user.id)

            if (success) {
                setIsTracking(true)
                Alert.alert('Success', 'Location tracking started')
            } else {
                setError(
                    'Failed to start location tracking. Please check permissions.'
                )
                Alert.alert(
                    'Error',
                    'Failed to start location tracking. Please check permissions in Settings.'
                )
            }

            return success
        } catch (err: any) {
            setError(err.message)
            Alert.alert('Error', 'Failed to start tracking: ' + err.message)
            return false
        }
    }

    const stopTracking = async () => {
        try {
            await locationService.stopTracking()
            setIsTracking(false)
            setError(null)
            Alert.alert('Success', 'Location tracking stopped')
        } catch (err: any) {
            setError(err.message)
            Alert.alert('Error', 'Failed to stop tracking: ' + err.message)
        }
    }

    useEffect(() => {
        setIsTracking(locationService.isCurrentlyTracking())
    }, [locationService])

    return {
        isTracking,
        error,
        startTracking,
        stopTracking,
    }
}
