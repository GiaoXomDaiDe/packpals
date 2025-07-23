import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import MapViewDirections from 'react-native-maps-directions'

import { icons } from '@/constants'
import { storageAPI } from '@/lib'
import { calculateRegion } from '@/lib/map'
import { StorageMarkerData } from '@/lib/types'
import { useLocationStore, useStorageStore } from '@/store'

const directionsAPI = process.env.EXPO_PUBLIC_GOOGLE_API_KEY

const Map = () => {
    const {
        userLongitude,
        userLatitude,
        selectedStorageLatitude,
        selectedStorageLongitude,
    } = useLocationStore()
    const { selectedStorage, storages, setStorages } = useStorageStore()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchStorageLocations()
    }, [userLatitude, userLongitude])

    const fetchStorageLocations = async () => {
        if (!userLatitude || !userLongitude) return
        
        setLoading(true)
        setError(null)
        
        try {
            const response = await storageAPI.getAllStorages({
                status: 'AVAILABLE',
                limit: 50
            })
            
            // Transform backend data to StorageMarkerData format
            const transformedStorages: StorageMarkerData[] = response.data
                .filter((storage: any) => storage.latitude && storage.longitude) // Only show storages with coordinates
                .map((storage: any) => ({
                    id: storage.id,
                    title: storage.description || 'Storage Space',
                    address: storage.address,
                    latitude: storage.latitude,
                    longitude: storage.longitude,
                    status: storage.status,
                    pricePerDay: storage.pricePerDay || 10,
                    rating: storage.rating || 4.5,
                    keeperName: storage.keeper?.user?.username || 'Unknown',
                    images: storage.images || [],
                    description: storage.description || 'Available storage space'
                }))
            
            setStorages(transformedStorages)
        } catch (err) {
            console.error('Error fetching storage locations:', err)
            setError('Failed to load storage locations')
        } finally {
            setLoading(false)
        }
    }

    const region = calculateRegion({
        userLatitude,
        userLongitude,
        destinationLatitude: selectedStorageLatitude,
        destinationLongitude: selectedStorageLongitude,
    })

    if (loading || (!userLatitude && !userLongitude))
        return (
            <View className="flex justify-center items-center w-full h-full">
                <ActivityIndicator size="small" color="#0286FF" />
                <Text className="text-sm text-general-200 mt-2">Loading map...</Text>
            </View>
        )

    if (error)
        return (
            <View className="flex justify-center items-center w-full h-full">
                <Text className="text-sm text-red-500">{error}</Text>
            </View>
        )

    return (
        <MapView
            provider={PROVIDER_DEFAULT}
            style={{
                width: '100%',
                height: '100%',
                borderRadius: 20,
            }}
            tintColor="black"
            mapType="standard"
            showsPointsOfInterest={false}
            initialRegion={region}
            showsUserLocation={true}
            userInterfaceStyle="light"
        >
            {/* Storage Location Markers */}
            {storages.map((storage) => (
                <Marker
                    key={storage.id}
                    coordinate={{
                        latitude: storage.latitude,
                        longitude: storage.longitude,
                    }}
                    title={storage.title}
                    description={`$${storage.pricePerDay}/day - ${storage.status}`}
                    image={
                        selectedStorage === storage.id
                            ? icons.selectedMarker
                            : icons.marker
                    }
                />
            ))}

            {/* Selected Storage Route */}
            {selectedStorageLatitude && selectedStorageLongitude && userLatitude && userLongitude && (
                <>
                    <Marker
                        key="selected-storage"
                        coordinate={{
                            latitude: selectedStorageLatitude,
                            longitude: selectedStorageLongitude,
                        }}
                        title="Selected Storage"
                        image={icons.pin}
                    />
                    <MapViewDirections
                        origin={{
                            latitude: userLatitude,
                            longitude: userLongitude,
                        }}
                        destination={{
                            latitude: selectedStorageLatitude,
                            longitude: selectedStorageLongitude,
                        }}
                        apikey={directionsAPI!}
                        strokeColor="#0286FF"
                        strokeWidth={3}
                        lineDashPattern={[1]}
                    />
                </>
            )}
        </MapView>
    )
}

export default Map
