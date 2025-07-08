import { create } from 'zustand'

import { DriverStore, LocationStore, MarkerData } from '@/types/type'

export const useLocationStore = create<LocationStore>((set) => ({
    userLatitude: null,
    userLongitude: null,
    userAddress: null,
    destinationLatitude: null,
    destinationLongitude: null,
    destinationAddress: null,
    setUserLocation: ({
        latitude,
        longitude,
        address,
    }: {
        latitude: number
        longitude: number
        address: string
    }) => {
        set(() => ({
            userLatitude: latitude,
            userLongitude: longitude,
            userAddress: address,
        }))

        const { selectedDriver, clearSelectedDriver } =
            useDriverStore.getState()
        if (selectedDriver) clearSelectedDriver()
    },

    setDestinationLocation: ({
        latitude,
        longitude,
        address,
    }: {
        latitude: number
        longitude: number
        address: string
    }) => {
        set(() => ({
            destinationLatitude: latitude,
            destinationLongitude: longitude,
            destinationAddress: address,
        }))

        const { selectedDriver, clearSelectedDriver } =
            useDriverStore.getState()
        if (selectedDriver) clearSelectedDriver()
    },

    clearDestination: () =>
        set(() => ({
            destinationLatitude: null,
            destinationLongitude: null,
            destinationAddress: null,
        })),
}))

export const useDriverStore = create<DriverStore>((set) => ({
    drivers: [] as MarkerData[],
    selectedDriver: null,
    setSelectedDriver: (driverId: number) =>
        set(() => ({ selectedDriver: driverId })),
    setDrivers: (drivers: MarkerData[]) => set(() => ({ drivers })),
    clearSelectedDriver: () => set(() => ({ selectedDriver: null })),
}))

interface CompletedRide {
    rideId: string
    driverId: number
    driverName: string
    driverImage?: string
    originAddress: string
    destinationAddress: string
    farePrice: number
    completedAt: string
    reviewed?: boolean
}

interface RideStore {
    completedRide: CompletedRide | null
    setCompletedRide: (ride: CompletedRide) => void
    clearCompletedRide: () => void
}

export const useRideStore = create<RideStore>((set) => ({
    completedRide: null,
    setCompletedRide: (ride: CompletedRide) =>
        set(() => ({ completedRide: ride })),
    clearCompletedRide: () => set(() => ({ completedRide: null })),
}))

// Global reset function to clear all ride-related state
export const resetAllRideState = () => {
    const { clearSelectedDriver } = useDriverStore.getState()
    const { clearDestination } = useLocationStore.getState()
    const { clearCompletedRide } = useRideStore.getState()

    clearSelectedDriver()
    clearDestination()
    clearCompletedRide()
}
