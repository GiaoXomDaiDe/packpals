import { fetchAPI } from './fetch'

// Base URL for your backend - configurable via environment variable
const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://localhost:7056/api'

// Storage API Functions
export const storageAPI = {
    // Get all storages with optional query filters
    getAllStorages: async (query?: {
        page?: number
        limit?: number
        address?: string
        status?: string
    }) => {
        const queryString = query ? new URLSearchParams(query as any).toString() : ''
        const url = `${API_BASE_URL}/storage/all${queryString ? `?${queryString}` : ''}`
        return await fetchAPI(url)
    },

    // Get storage by ID
    getStorageById: async (id: string) => {
        return await fetchAPI(`${API_BASE_URL}/storage/${id}`)
    },

    // Create new storage (for Keepers)
    createStorage: async (storageData: {
        description: string
        address: string
        keeperId: string
    }) => {
        return await fetchAPI(`${API_BASE_URL}/storage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(storageData),
        })
    },

    // Update storage (for Keepers)
    updateStorage: async (id: string, storageData: {
        description?: string
        address?: string
        status?: string
    }) => {
        return await fetchAPI(`${API_BASE_URL}/storage`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, ...storageData }),
        })
    },

    // Delete storage
    deleteStorage: async (id: string) => {
        return await fetchAPI(`${API_BASE_URL}/storage/${id}`, {
            method: 'DELETE',
        })
    },
}

// Order API Functions
export const orderAPI = {
    // Get all orders for a specific storage (for Keepers)
    getOrdersByStorageId: async (storageId: string, query?: {
        page?: number
        limit?: number
        status?: string
    }) => {
        const queryString = query ? new URLSearchParams(query as any).toString() : ''
        const url = `${API_BASE_URL}/order/storage/${storageId}${queryString ? `?${queryString}` : ''}`
        return await fetchAPI(url)
    },

    // Get order by ID
    getOrderById: async (id: string) => {
        return await fetchAPI(`${API_BASE_URL}/order/${id}`)
    },

    // Create new order (for Renters)
    createOrder: async (orderData: {
        renterId: string
        storageId: string
        packageDescription: string
        totalAmount: number
    }) => {
        return await fetchAPI(`${API_BASE_URL}/order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
        })
    },

    // Update order
    updateOrder: async (id: string, orderData: {
        status?: string
        packageDescription?: string
        totalAmount?: number
    }) => {
        return await fetchAPI(`${API_BASE_URL}/order`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, ...orderData }),
        })
    },

    // Mark order as paid
    markOrderAsPaid: async (id: string) => {
        return await fetchAPI(`${API_BASE_URL}/order/paid/${id}`, {
            method: 'PUT',
        })
    },

    // Update order status
    updateOrderStatus: async (id: string, status: string) => {
        return await fetchAPI(`${API_BASE_URL}/order/status/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(status),
        })
    },

    // Start keep time (when package is received)
    startKeepTime: async (id: string) => {
        return await fetchAPI(`${API_BASE_URL}/order/start-time/${id}`, {
            method: 'PUT',
        })
    },

    // Delete order
    deleteOrder: async (id: string) => {
        return await fetchAPI(`${API_BASE_URL}/order/${id}`, {
            method: 'DELETE',
        })
    },
}

// Authentication API Functions
export const authAPI = {
    // Login
    login: async (credentials: {
        email: string
        password: string
    }) => {
        return await fetchAPI(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        })
    },

    // Register
    register: async (userData: {
        email: string
        password: string
        username: string
        phoneNumber: string
        role?: string
    }) => {
        return await fetchAPI(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        })
    },

    // Change password
    changePassword: async (
        passwordData: {
            oldPassword: string
            newPassword: string
        },
        userEmail: string,
        isForgot: boolean = false
    ) => {
        return await fetchAPI(`${API_BASE_URL}/auth/change-password?userEmail=${userEmail}&IsForgot=${isForgot}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(passwordData),
        })
    },
}

// Size API Functions (for order details)
export const sizeAPI = {
    getAllSizes: async () => {
        return await fetchAPI(`${API_BASE_URL}/size/all`)
    },

    getSizeById: async (id: string) => {
        return await fetchAPI(`${API_BASE_URL}/size/${id}`)
    },
}

// Rating API Functions
export const ratingAPI = {
    // Get ratings for a storage
    getRatingsByStorageId: async (storageId: string) => {
        return await fetchAPI(`${API_BASE_URL}/rating/storage/${storageId}`)
    },

    // Create rating
    createRating: async (ratingData: {
        orderId: string
        userId: string
        storageId: string
        rating: number
        reviewText?: string
    }) => {
        return await fetchAPI(`${API_BASE_URL}/rating`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ratingData),
        })
    },

    // Update rating
    updateRating: async (id: string, ratingData: {
        rating?: number
        reviewText?: string
    }) => {
        return await fetchAPI(`${API_BASE_URL}/rating`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, ...ratingData }),
        })
    },
}

// Add missing methods to orderAPI
Object.assign(orderAPI, {
    // Get orders by keeper ID (for keeper's order management)
    getOrdersByKeeperId: async (keeperId: string, query?: {
        page?: number
        limit?: number
        status?: string
    }) => {
        const queryString = query ? new URLSearchParams(query as any).toString() : ''
        const url = `${API_BASE_URL}/order/keeper/${keeperId}${queryString ? `?${queryString}` : ''}`
        return await fetchAPI(url)
    },

    // Get orders by renter ID (for renter's order history)
    getOrdersByRenterId: async (renterId: string, query?: {
        page?: number
        limit?: number
        status?: string
    }) => {
        const queryString = query ? new URLSearchParams(query as any).toString() : ''
        const url = `${API_BASE_URL}/order/renter/${renterId}${queryString ? `?${queryString}` : ''}`
        return await fetchAPI(url)
    },
})

// Payment API Functions
export const paymentAPI = {
    // Create payment (using VNPAY)
    createPayment: async (paymentData: {
        orderId: string
        amount: number
        description: string
        customerInfo?: {
            name: string
            email: string
            phone?: string
        }
    }) => {
        return await fetchAPI(`${API_BASE_URL}/payment/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData),
        })
    },

    // Handle payment callback
    handlePaymentCallback: async (callbackData: any) => {
        return await fetchAPI(`${API_BASE_URL}/payment/callback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(callbackData),
        })
    },

    // Handle payment IPN (Instant Payment Notification)
    handlePaymentIPN: async (ipnData: any) => {
        return await fetchAPI(`${API_BASE_URL}/payment/ipn-action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ipnData),
        })
    },
}