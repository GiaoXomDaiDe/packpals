import { fetchAPI } from '@/lib/fetch'
import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps'

interface RealTimeMapProps {
    rideId: string
    userLocation: {
        latitude: number
        longitude: number
    }
    destination: {
        latitude: number
        longitude: number
    }
    height?: number
}

interface DriverLocation {
    latitude: number
    longitude: number
    heading?: number
    speed?: number
    lastUpdate?: string
    driverName?: string
    driverImage?: string
}

const RealTimeMap: React.FC<RealTimeMapProps> = ({
    rideId,
    userLocation,
    destination,
    height = 300,
}) => {
    const mapRef = useRef<MapView>(null)
    const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(
        null
    )
    const [route, setRoute] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const trackingInterval = useRef<any>(null)

    useEffect(() => {
        startTracking()
        return () => stopTracking()
    }, [rideId]) // eslint-disable-line react-hooks/exhaustive-deps

    const startTracking = () => {
        if (!rideId) {
            setError('No ride ID provided')
            setIsLoading(false)
            return
        }

        // Initial fetch
        fetchDriverLocation()

        // Set up interval for real-time updates
        trackingInterval.current = setInterval(() => {
            fetchDriverLocation()
        }, 5000) // Update every 5 seconds
    }

    const stopTracking = () => {
        if (trackingInterval.current) {
            clearInterval(trackingInterval.current)
            trackingInterval.current = null
        }
    }

    const fetchDriverLocation = async () => {
        try {
            const response = await fetchAPI(
                `/(api)/location/track?ride_id=${rideId}`
            )

            if (response.success && response.data) {
                const {
                    driver_current_lat,
                    driver_current_lng,
                    heading,
                    speed,
                    driver_first_name,
                    driver_last_name,
                    driver_image,
                } = response.data

                if (driver_current_lat && driver_current_lng) {
                    const newDriverLocation = {
                        latitude: parseFloat(driver_current_lat),
                        longitude: parseFloat(driver_current_lng),
                        heading: heading || 0,
                        speed: speed || 0,
                        driverName: `${driver_first_name} ${driver_last_name}`,
                        driverImage: driver_image,
                    }

                    setDriverLocation(newDriverLocation)
                    setError(null)

                    // Get route from driver to destination
                    await getRoute(newDriverLocation, destination)

                    // Adjust map view to show all points
                    setTimeout(() => fitMapToMarkers(), 1000)
                } else {
                    setError('Driver location not available')
                }
            } else {
                setError('Failed to fetch driver location')
            }
            setIsLoading(false)
        } catch (error) {
            console.error('Error fetching driver location:', error)
            setError('Error fetching driver location')
            setIsLoading(false)
        }
    }

    const getRoute = async (origin: any, dest: any) => {
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${dest.latitude},${dest.longitude}&key=${process.env.EXPO_PUBLIC_GOOGLE_API_KEY}`
            )
            const data = await response.json()

            if (data.routes && data.routes.length > 0) {
                const points = data.routes[0].overview_polyline.points
                const decodedPoints = decodePolyline(points)
                setRoute(decodedPoints)
            }
        } catch (error) {
            console.error('Error getting route:', error)
        }
    }

    const decodePolyline = (polyline: string) => {
        const points = []
        let index = 0
        const len = polyline.length
        let lat = 0
        let lng = 0

        while (index < len) {
            let b
            let shift = 0
            let result = 0
            do {
                b = polyline.charCodeAt(index++) - 63
                result |= (b & 0x1f) << shift
                shift += 5
            } while (b >= 0x20)
            const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
            lat += dlat

            shift = 0
            result = 0
            do {
                b = polyline.charCodeAt(index++) - 63
                result |= (b & 0x1f) << shift
                shift += 5
            } while (b >= 0x20)
            const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
            lng += dlng

            points.push({
                latitude: lat / 1e5,
                longitude: lng / 1e5,
            })
        }
        return points
    }

    const fitMapToMarkers = () => {
        if (mapRef.current && driverLocation) {
            const coordinates = [userLocation, driverLocation, destination]
            mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            })
        }
    }

    if (isLoading) {
        return (
            <View
                style={{ height }}
                className="justify-center items-center bg-gray-100 rounded-lg"
            >
                <ActivityIndicator size="large" color="#0286FF" />
                <Text className="mt-2 text-gray-600">
                    Loading driver location...
                </Text>
            </View>
        )
    }

    if (error) {
        return (
            <View
                style={{ height }}
                className="justify-center items-center bg-gray-100 rounded-lg"
            >
                <Text className="text-red-500 text-center px-4">{error}</Text>
            </View>
        )
    }

    return (
        <View style={{ height }} className="rounded-lg overflow-hidden">
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                className="w-full h-full"
                showsUserLocation={false}
                showsMyLocationButton={false}
                initialRegion={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
            >
                {/* User Location Marker */}
                <Marker
                    coordinate={userLocation}
                    title="Your Location"
                    description="Pickup point"
                    pinColor="blue"
                />

                {/* Driver Location Marker */}
                {driverLocation && (
                    <Marker
                        coordinate={driverLocation}
                        title={`Driver: ${driverLocation.driverName}`}
                        description={`Speed: ${Math.round(driverLocation.speed || 0)} km/h`}
                        rotation={driverLocation.heading || 0}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View className="w-10 h-10 bg-green-500 rounded-full items-center justify-center border-2 border-white">
                            <View className="w-4 h-4 bg-white rounded-full" />
                        </View>
                    </Marker>
                )}

                {/* Destination Marker */}
                <Marker
                    coordinate={destination}
                    title="Destination"
                    description="Drop-off point"
                    pinColor="red"
                />

                {/* Route Polyline */}
                {route.length > 0 && (
                    <Polyline
                        coordinates={route}
                        strokeColor="#0286FF"
                        strokeWidth={4}
                        lineDashPattern={[5, 10]}
                    />
                )}
            </MapView>
        </View>
    )
}

export default RealTimeMap
