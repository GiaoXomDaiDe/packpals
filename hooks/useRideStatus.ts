import { fetchAPI } from '@/lib/fetch'
import { useCallback, useEffect, useState } from 'react'

interface RideStatus {
    ride_id: number
    origin_address: string
    destination_address: string
    origin_latitude: number
    origin_longitude: number
    destination_latitude: number
    destination_longitude: number
    ride_status:
        | 'pending'
        | 'driver_assigned'
        | 'driver_en_route'
        | 'driver_arrived'
        | 'in_progress'
        | 'completed'
        | 'cancelled'
    payment_status: string
    driver_assigned_at?: string
    trip_started_at?: string
    trip_completed_at?: string
    estimated_arrival_minutes?: number
    eta_minutes?: number
    fare_price: number
    created_at: string
    driver_first_name?: string
    driver_last_name?: string
    driver_image?: string
    car_seats?: number
    driver_rating?: number
}

export const useRideStatus = (rideId: number) => {
    const [rideStatus, setRideStatus] = useState<RideStatus | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchRideStatus = useCallback(async () => {
        if (!rideId) return

        try {
            setLoading(true)
            setError(null)

            const response = await fetchAPI(
                `/(api)/ride/status?ride_id=${rideId}`,
                {
                    method: 'GET',
                }
            )

            if (response.success) {
                setRideStatus(response.data)
            } else {
                setError(response.error || 'Failed to fetch ride status')
            }
        } catch (err: any) {
            setError(err.message || 'Network error')
        } finally {
            setLoading(false)
        }
    }, [rideId])

    // Auto-refresh every 10 seconds for active rides
    useEffect(() => {
        if (!rideId) return

        fetchRideStatus()

        const interval = setInterval(() => {
            if (
                rideStatus?.ride_status &&
                !['completed', 'cancelled'].includes(rideStatus.ride_status)
            ) {
                fetchRideStatus()
            }
        }, 10000) // Refresh every 10 seconds

        return () => clearInterval(interval)
    }, [rideId, rideStatus?.ride_status, fetchRideStatus])

    const getStatusMessage = () => {
        if (!rideStatus) return 'Loading...'

        switch (rideStatus.ride_status) {
            case 'pending':
                return 'Looking for a driver...'
            case 'driver_assigned':
                return `Driver assigned! ETA: ${rideStatus.eta_minutes || rideStatus.estimated_arrival_minutes} minutes`
            case 'driver_en_route':
                return 'Driver is on the way to pick you up'
            case 'driver_arrived':
                return 'Driver has arrived at pickup location'
            case 'in_progress':
                return 'Trip in progress'
            case 'completed':
                return 'Trip completed'
            case 'cancelled':
                return 'Trip cancelled'
            default:
                return 'Unknown status'
        }
    }

    const getStatusColor = () => {
        if (!rideStatus) return '#666'

        switch (rideStatus.ride_status) {
            case 'pending':
                return '#ff9500'
            case 'driver_assigned':
            case 'driver_en_route':
                return '#007AFF'
            case 'driver_arrived':
                return '#34C759'
            case 'in_progress':
                return '#5856D6'
            case 'completed':
                return '#30D158'
            case 'cancelled':
                return '#FF3B30'
            default:
                return '#666'
        }
    }

    return {
        rideStatus,
        loading,
        error,
        refreshStatus: fetchRideStatus,
        statusMessage: getStatusMessage(),
        statusColor: getStatusColor(),
    }
}

// Hook for demo simulation
export const useMockDriver = () => {
    const [simulating, setSimulating] = useState(false)

    const simulateDriverAction = async (rideId: number, action: string) => {
        try {
            setSimulating(true)

            const response = await fetchAPI('/(api)/mock/driver', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ride_id: rideId,
                    action: action,
                }),
            })

            return response
        } catch (error) {
            console.error('Mock driver simulation error:', error)
            throw error
        } finally {
            setSimulating(false)
        }
    }

    return {
        simulateDriverAction,
        simulating,
    }
}
