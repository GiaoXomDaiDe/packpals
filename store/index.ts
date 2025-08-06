import { create } from 'zustand'
import { AuthStore, User } from '../types/auth.types'

import {
    CompletedOrder,
    LocationStore,
    OrderStore,
    StorageMarkerData,
    StorageStore
} from '../types/type'

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

        // Don't automatically clear selected storage when user location updates
        // This was causing issues when user is on BookStorage page
        // Let components handle storage clearing manually when needed
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
    setSelectedStorage: (storageId: string) => {
        console.log('🏪 Setting selected storage:', storageId)
        set(() => ({ selectedStorage: storageId }))
    },
    setStorages: (storages: StorageMarkerData[]) => set(() => ({ storages })),
    clearSelectedStorage: () => {
        console.log('🗑️ Clearing selected storage (called from:', new Error().stack?.split('\n')[2]?.trim() || 'unknown', ')')
        set(() => ({ selectedStorage: null }))
    },
}))

export const useOrderStore = create<OrderStore>((set) => ({
    completedOrder: null,
    setCompletedOrder: (order: CompletedOrder) =>
        set(() => ({ completedOrder: order })),
    clearCompletedOrder: () => set(() => ({ completedOrder: null })),
}))

// User store for authentication and user data using the imported AuthStore interface
export const useUserStore = create<AuthStore>((set, get) => ({
    user: null,
    isAuthenticated: false,
    token: null,
    setUser: (user: User, token?: string) => 
        set(() => ({ 
            user: {
                ...user,
                activeRole: user.activeRole || user.role // Set activeRole to current role if not provided
            }, 
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
    updateUserRole: (newRole: string) => {
        const currentUser = get().user
        if (currentUser) {
            set(() => ({
                user: {
                    ...currentUser,
                    role: newRole,
                    roles: currentUser.roles?.includes(newRole) 
                        ? currentUser.roles 
                        : [...(currentUser.roles || [currentUser.role]), newRole],
                    activeRole: newRole
                }
            }))
        }
    },
    switchActiveRole: (role: string) => {
        const currentUser = get().user
        if (currentUser && currentUser.roles?.includes(role)) {
            set(() => ({
                user: {
                    ...currentUser,
                    activeRole: role
                }
            }))
        }
    }
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
