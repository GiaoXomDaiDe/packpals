import React, { useEffect, useMemo, useRef } from 'react'
import { Platform, View } from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, Region } from 'react-native-maps'
import MapViewDirections from 'react-native-maps-directions'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { calculateRegion } from '@/lib/map'
import { StorageMarkerData } from '@/lib/types/type'
import { useLocationStore, useStorageStore } from '@/store'

const directionsAPI = process.env.EXPO_PUBLIC_GOOGLE_API_KEY

interface EnhancedMapProps {
  userLatitude?: number | null
  userLongitude?: number | null
  storages: (StorageMarkerData & { distance?: number })[]
  selectedStorageId?: string | null
  onStorageMarkerPress: (storage: StorageMarkerData & { distance?: number }) => void
  showDirections?: boolean
  onMapDrag?: (isDragging: boolean) => void
  zoomToUserLocation?: boolean
  showPolyline?: boolean
  polylineCoordinates?: { latitude: number; longitude: number }[]
  travelMode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT'
  onRouteReady?: (result: any) => void
  onRouteError?: (error: string) => void
}

const EnhancedMap: React.FC<EnhancedMapProps> = ({
  userLatitude,
  userLongitude,
  storages,
  selectedStorageId,
  onStorageMarkerPress,
  showDirections = false,
  onMapDrag,
  zoomToUserLocation = false,
  showPolyline = false,
  polylineCoordinates = [],
  travelMode = 'DRIVING',
  onRouteReady,
  onRouteError
}) => {
  const mapRef = useRef<MapView>(null)
  
  // Get store functions
  const { setSelectedStorage } = useStorageStore()
  const { setSelectedStorageLocation } = useLocationStore()

  // Memoize selectedStorage để tránh tính toán lại không cần thiết
  const selectedStorage = useMemo(() => 
    storages.find(s => s.id === selectedStorageId), 
    [storages, selectedStorageId]
  )

  // Memoize initial region để tránh tính toán lại
  const initialRegion = useMemo((): Region => {
    if (selectedStorage && showDirections) {
      return calculateRegion({
        userLatitude: userLatitude || null,
        userLongitude: userLongitude || null,
        destinationLatitude: selectedStorage.latitude,
        destinationLongitude: selectedStorage.longitude,
      })
    } else if (userLatitude && userLongitude) {
      return {
        latitude: userLatitude,
        longitude: userLongitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    } else {
      // Default to Ho Chi Minh City center
      return {
        latitude: 10.762622,
        longitude: 106.660172,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    }
  }, [selectedStorage, showDirections, userLatitude, userLongitude])

  // Zoom to user location when enabled
  useEffect(() => {
    if (zoomToUserLocation && userLatitude && userLongitude && mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: userLatitude,
          longitude: userLongitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 1000)
      }, 500) // Small delay to ensure map is fully loaded

      return () => clearTimeout(timer)
    }
  }, [zoomToUserLocation, userLatitude, userLongitude])

  // Calculate initial region
  const getInitialRegion = (): Region => {
    return initialRegion
  }

  const handleStorageMarkerPress = (storage: StorageMarkerData & { distance?: number }) => {
    // Set selected storage in store
    setSelectedStorage(storage.id)
    
    // Store selected storage location for navigation
    setSelectedStorageLocation({
      latitude: storage.latitude,
      longitude: storage.longitude,
      address: storage.address
    })
    
    // Call the parent callback - let parent handle navigation
    onStorageMarkerPress(storage)
  }

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_DEFAULT}
      style={{
        width: '100%',
        height: '100%',
      }}
      initialRegion={getInitialRegion()}
      mapType="standard"
      showsPointsOfInterest={false}
      showsUserLocation={true}
      showsMyLocationButton={false}
      userInterfaceStyle="light"
      onPanDrag={() => onMapDrag?.(true)}
      onRegionChangeComplete={() => onMapDrag?.(false)}
      pitchEnabled={true}
      rotateEnabled={true}
      scrollEnabled={true}
      zoomEnabled={true}
    >
      {/* User Location Marker (custom) */}
      {userLatitude && userLongitude && (
        <Marker
          coordinate={{
            latitude: userLatitude,
            longitude: userLongitude,
          }}
          title="Your Location"
          description="You are here"
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#007AFF',
            borderWidth: 3,
            borderColor: 'white',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 5,
          }} />
        </Marker>
      )}

      {/* Storage Markers */}
      {storages.map((storage) => {
        const isSelected = selectedStorageId === storage.id
        
        return (
          <Marker
            key={storage.id}
            coordinate={{
              latitude: storage.latitude,
              longitude: storage.longitude,
            }}
            title={storage.title}
            description={`${storage.pricePerDay.toLocaleString()} VND/day`}
            onPress={() => handleStorageMarkerPress(storage)}
            anchor={{ x: 0.5, y: 0.5 }}
            centerOffset={{ x: 0, y: 0 }}
          >
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              
            }}>
              {/* Clean Circular Storage Pin */}
              <View style={{
                backgroundColor: isSelected ? '#007AFF' : '#FFFFFF',
                width: 28,
                height: 28,
                borderRadius: 24,
                borderWidth: 3,
                borderColor: isSelected ? '#0056b3' : '#007AFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 2,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {/* Storage Icon */}
                <Ionicons 
                  name="cube" 
                  size={20} 
                  color={isSelected ? 'white' : '#007AFF'} 
                />
              </View>
              

            </View>
          </Marker>
        )
      })}

      {/* Simple Polyline for Distance Route */}
      {showPolyline && polylineCoordinates.length >= 2 && (
        <Polyline
          coordinates={polylineCoordinates}
          strokeColor="#007AFF"
          strokeWidth={3}
          lineDashPattern={Platform.OS === 'ios' ? [1] : undefined}
          lineCap="round"
          lineJoin="round"
        />
      )}

      {/* Directions (for Google Maps routing - optimized) */}
      {showDirections && 
       selectedStorage && 
       userLatitude && 
       userLongitude && 
       directionsAPI && (
        <MapViewDirections
          origin={{
            latitude: userLatitude,
            longitude: userLongitude,
          }}
          destination={{
            latitude: selectedStorage.latitude,
            longitude: selectedStorage.longitude,
          }}
          apikey={directionsAPI}
          strokeColor="#007AFF"
          strokeWidth={4}
          lineDashPattern={Platform.OS === 'ios' ? [1] : undefined}
          optimizeWaypoints={false}
          mode={travelMode}
          language="vi"
          region="VN"
          onReady={(result) => {
            console.log('Route ready:', {
              distance: result.distance,
              duration: result.duration,
              coordinates: result.coordinates.length
            })
            
            // Chỉ fit coordinates nếu cần thiết
            if (mapRef.current && result.coordinates.length > 2) {
              requestAnimationFrame(() => {
                mapRef.current?.fitToCoordinates(result.coordinates, {
                  edgePadding: {
                    right: 50,
                    bottom: 300,
                    left: 50,
                    top: 100,
                  },
                  animated: false, // Tắt animation để nhanh hơn
                })
              })
            }
            
            onRouteReady?.(result)
          }}
          onError={(errorMessage) => {
            console.error('MapViewDirections error:', errorMessage)
            onRouteError?.(errorMessage)
          }}
          resetOnChange={false}
          precision="low"
          timePrecision="none"
          splitWaypoints={false}
        />
      )}
    </MapView>
  )
}

export default EnhancedMap