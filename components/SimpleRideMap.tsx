import { icons } from '@/constants'
import { useMockDriver, useRideStatus } from '@/hooks/useRideStatus'
import React, { useRef, useState } from 'react'
import { Alert, Text, TouchableOpacity, View } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import MapViewDirections from 'react-native-maps-directions'

interface SimpleRideMapProps {
    rideId: number
    showDemo?: boolean
}

const SimpleRideMap: React.FC<SimpleRideMapProps> = ({
    rideId,
    showDemo = false,
}) => {
    const { rideStatus, loading, statusMessage, statusColor, refreshStatus } =
        useRideStatus(rideId)
    const { simulateDriverAction, simulating } = useMockDriver()
    const mapRef = useRef<MapView>(null)
    const [mapReady, setMapReady] = useState(false)

    const handleDemoAction = async (action: string) => {
        try {
            const response = await simulateDriverAction(rideId, action)
            if (response.success) {
                Alert.alert('Demo', response.message)
                setTimeout(() => refreshStatus(), 1000)
            }
        } catch (err) {
            console.error('Demo action error:', err)
            Alert.alert('Error', 'Failed to simulate action')
        }
    }

    const fitToMarkers = React.useCallback(() => {
        if (mapRef.current && rideStatus && mapReady) {
            const markers = [
                {
                    latitude: rideStatus.origin_latitude,
                    longitude: rideStatus.origin_longitude,
                },
                {
                    latitude: rideStatus.destination_latitude,
                    longitude: rideStatus.destination_longitude,
                },
            ]

            mapRef.current.fitToCoordinates(markers, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            })
        }
    }, [rideStatus, mapReady])

    React.useEffect(() => {
        if (mapReady && rideStatus) {
            fitToMarkers()
        }
    }, [mapReady, rideStatus, fitToMarkers])

    if (loading && !rideStatus) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-100">
                <Text className="text-lg font-medium">
                    Loading ride details...
                </Text>
            </View>
        )
    }

    if (!rideStatus) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-100">
                <Text className="text-lg font-medium">Ride not found</Text>
            </View>
        )
    }

    return (
        <View className="flex-1">
            {/* Status Bar */}
            <View
                className="p-4 m-4 rounded-lg"
                style={{ backgroundColor: statusColor + '20' }}
            >
                <Text
                    className="text-lg font-semibold text-center"
                    style={{ color: statusColor }}
                >
                    {statusMessage}
                </Text>

                {rideStatus.driver_first_name && (
                    <Text className="text-sm text-gray-600 text-center mt-1">
                        Driver: {rideStatus.driver_first_name}{' '}
                        {rideStatus.driver_last_name}
                        {rideStatus.driver_rating &&
                            ` • ${rideStatus.driver_rating}⭐`}
                    </Text>
                )}
            </View>

            {/* Map */}
            <View className="flex-1 mx-4 mb-4 rounded-lg overflow-hidden">
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    className="flex-1"
                    onMapReady={() => setMapReady(true)}
                    initialRegion={{
                        latitude:
                            (rideStatus.origin_latitude +
                                rideStatus.destination_latitude) /
                            2,
                        longitude:
                            (rideStatus.origin_longitude +
                                rideStatus.destination_longitude) /
                            2,
                        latitudeDelta:
                            Math.abs(
                                rideStatus.destination_latitude -
                                    rideStatus.origin_latitude
                            ) + 0.02,
                        longitudeDelta:
                            Math.abs(
                                rideStatus.destination_longitude -
                                    rideStatus.origin_longitude
                            ) + 0.02,
                    }}
                >
                    {/* Origin Marker */}
                    <Marker
                        coordinate={{
                            latitude: rideStatus.origin_latitude,
                            longitude: rideStatus.origin_longitude,
                        }}
                        title="Pickup Location"
                        description={rideStatus.origin_address}
                        image={icons.pin}
                    />

                    {/* Destination Marker */}
                    <Marker
                        coordinate={{
                            latitude: rideStatus.destination_latitude,
                            longitude: rideStatus.destination_longitude,
                        }}
                        title="Destination"
                        description={rideStatus.destination_address}
                        image={icons.point}
                    />

                    {/* Route */}
                    <MapViewDirections
                        origin={{
                            latitude: rideStatus.origin_latitude,
                            longitude: rideStatus.origin_longitude,
                        }}
                        destination={{
                            latitude: rideStatus.destination_latitude,
                            longitude: rideStatus.destination_longitude,
                        }}
                        apikey={process.env.EXPO_PUBLIC_GOOGLE_API_KEY!}
                        strokeColor={statusColor}
                        strokeWidth={4}
                        onReady={() => {
                            setTimeout(fitToMarkers, 1000)
                        }}
                    />
                </MapView>
            </View>

            {/* Demo Controls (if enabled) */}
            {showDemo && rideStatus.ride_status !== 'completed' && (
                <View className="p-4 bg-yellow-50 border-t border-yellow-200">
                    <Text className="text-sm font-medium text-yellow-800 mb-2">
                        🎮 Demo Controls
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                        {rideStatus.ride_status === 'pending' && (
                            <TouchableOpacity
                                onPress={() =>
                                    handleDemoAction('assign_driver')
                                }
                                disabled={simulating}
                                className="bg-blue-500 px-3 py-2 rounded"
                            >
                                <Text className="text-white text-xs">
                                    Assign Driver
                                </Text>
                            </TouchableOpacity>
                        )}

                        {rideStatus.ride_status === 'driver_assigned' && (
                            <TouchableOpacity
                                onPress={() =>
                                    handleDemoAction('driver_en_route')
                                }
                                disabled={simulating}
                                className="bg-blue-500 px-3 py-2 rounded"
                            >
                                <Text className="text-white text-xs">
                                    Driver En Route
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={() => handleDemoAction('auto_progression')}
                            disabled={simulating}
                            className="bg-green-500 px-3 py-2 rounded"
                        >
                            <Text className="text-white text-xs">
                                Auto Complete (2min)
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    )
}

export default SimpleRideMap
