import { AuthStore, AuthUser } from '@/lib/types/auth.types'
import { create } from 'zustand'

import {
    CompletedOrder,
    LocationStore,
    OrderStore,
    StorageMarkerData,
    StorageStore
} from '@/lib/types/type'

export const useLocationStore = create<LocationStore>((set) => ({
    userLatitude: null,
    userLongitude: null,
    userAddress: null,
    selectedStorageLatitude: null,
    selectedStorageLongitude: null,
    selectedStorageAddress: null,
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

        const { selectedStorage, clearSelectedStorage } =
            useStorageStore.getState()
        if (selectedStorage) clearSelectedStorage()
    },

    setSelectedStorageLocation: ({
        latitude,
        longitude,
        address,
    }: {
        latitude: number
        longitude: number
        address: string
    }) => {
        set(() => ({
            selectedStorageLatitude: latitude,
            selectedStorageLongitude: longitude,
            selectedStorageAddress: address,
        }))
    },

    clearSelectedStorage: () =>
        set(() => ({
            selectedStorageLatitude: null,
            selectedStorageLongitude: null,
            selectedStorageAddress: null,
        })),
}))

export const useStorageStore = create<StorageStore>((set) => ({
    storages: [] as StorageMarkerData[],
    selectedStorage: null,
    setSelectedStorage: (storageId: string) =>
        set(() => ({ selectedStorage: storageId })),
    setStorages: (storages: StorageMarkerData[]) => set(() => ({ storages })),
    clearSelectedStorage: () => set(() => ({ selectedStorage: null })),
}))

export const useOrderStore = create<OrderStore>((set) => ({
    completedOrder: null,
    setCompletedOrder: (order: CompletedOrder) =>
        set(() => ({ completedOrder: order })),
    clearCompletedOrder: () => set(() => ({ completedOrder: null })),
}))

// User store for authentication and user data using the imported AuthStore interface
export const useUserStore = create<AuthStore>((set) => ({
    user: null,
    isAuthenticated: false,
    token: null,
    setUser: (user: AuthUser, token?: string) => 
        set(() => ({ 
            user, 
            isAuthenticated: true,
            token: token || null
        })),
    clearUser: () => 
        set(() => ({ 
            user: null, 
            isAuthenticated: false,
            token: null
        })),
    setToken: (token: string) =>
        set(() => ({ token })),
}))

// Global reset function to clear all storage-related state
export const resetAllStorageState = () => {
    const { clearSelectedStorage } = useStorageStore.getState()
    const { clearSelectedStorage: clearLocationStorage } = useLocationStore.getState()
    const { clearCompletedOrder } = useOrderStore.getState()

    clearSelectedStorage()
    clearLocationStorage()
    clearCompletedOrder()
}
