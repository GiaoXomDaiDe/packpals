import apiClient from '../config/axios.config'

export class OrderAPI {
    private readonly baseEndpoint = '/Order'

    // Get all orders for a user (matches backend GET /api/Order/user/{userId})
    async getUserOrders(userId: string, query?: {
        IsPaid?: boolean
        Status?: string
        PageIndex?: number
        PageSize?: number
    }) {
        try {
            const params = new URLSearchParams()
            if (query) {
                Object.entries(query).forEach(([key, value]) => {
                    if (value !== undefined) {
                        params.append(key, value.toString())
                    }
                })
            }
            
            console.log('🔍 Fetching user orders for userId:', userId, 'with params:', query)
            const response = await apiClient.get(`${this.baseEndpoint}/user/${userId}?${params.toString()}`)
            console.log('📋 User orders response:', response.data)
            return response.data
        } catch (error: any) {
            console.error('❌ Failed to fetch user orders:', error)
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to fetch user orders')
            }
            throw new Error('Network error occurred')
        }
    }

    // Get order by ID
    async getOrderById(id: string) {
        try {
            const response = await apiClient.get(`${this.baseEndpoint}/${id}`)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to fetch order')
            }
            throw new Error('Network error occurred')
        }
    }

    // Create new order (matches backend POST /api/Order)
    async createOrder(orderData: {
        renterId: string
        storageId: string
        packageDescription: string
        estimatedDays?: number
    }) {
        try {
            console.log('🚀 Sending order data to API:', orderData)
            const response = await apiClient.post(this.baseEndpoint, orderData)
            console.log('✅ Order API response:', response.data)
            
            // Extract the order ID from the response
            const orderId = response.data?.data
            if (!orderId) {
                throw new Error('Order ID not found in response')
            }
            
            console.log('📦 Extracted order ID:', orderId)
            return orderId
        } catch (error: any) {
            console.error('❌ Order creation error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            })
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to create order')
            }
            throw new Error('Network error occurred')
        }
    }

    // Update order status (matches backend PUT /api/Order/status/{id})
    async updateOrderStatus(id: string, status: string) {
        try {
            const response = await apiClient.put(`${this.baseEndpoint}/status/${id}`, JSON.stringify(status), {
                headers: { 'Content-Type': 'application/json' }
            })
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to update order status')
            }
            throw new Error('Network error occurred')
        }
    }

    // Mark order as paid (matches backend PUT /api/Order/paid/{id})
    async markOrderAsPaid(id: string) {
        try {
            const response = await apiClient.put(`${this.baseEndpoint}/paid/${id}`)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to mark order as paid')
            }
            throw new Error('Network error occurred')
        }
    }

    // Get orders by storage (matches backend GET /api/Order/storage/{storageId})
    async getOrdersByStorage(storageId: string, query?: {
        IsPaid?: boolean
        Status?: string
        PageIndex?: number
        PageSize?: number
    }) {
        try {
            const params = new URLSearchParams()
            if (query) {
                Object.entries(query).forEach(([key, value]) => {
                    if (value !== undefined) {
                        params.append(key, value.toString())
                    }
                })
            }
            
            const response = await apiClient.get(`${this.baseEndpoint}/storage/${storageId}?${params.toString()}`)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to fetch orders by storage')
            }
            throw new Error('Network error occurred')
        }
    }

    // Set order start time (matches backend PUT /api/Order/start-time/{id})
    async setOrderStartTime(id: string) {
        try {
            const response = await apiClient.put(`${this.baseEndpoint}/start-time/${id}`)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to set order start time')
            }
            throw new Error('Network error occurred')
        }
    }

    // Update order - flexible PATCH method (matches backend PATCH /api/Order)
    async updateOrder(orderData: {
        id: string
        packageDescription?: string
        status?: string
        orderCertification?: string[]
        estimatedDays?: number
        isPaid?: boolean
        startTime?: string
        endTime?: string
        totalAmount?: number
        [key: string]: any // Allow additional fields
    }) {
        try {
            console.log('🔄 Updating order with PATCH:', orderData)
            const response = await apiClient.patch(this.baseEndpoint, orderData)
            console.log('✅ Order update response:', response.data)
            return response.data
        } catch (error: any) {
            console.error('❌ Failed to update order:', error)
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to update order')
            }
            throw new Error('Network error occurred')
        }
    }

    // Delete order (matches backend DELETE /api/Order/{id})
    async deleteOrder(id: string) {
        try {
            const response = await apiClient.delete(`${this.baseEndpoint}/${id}`)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to delete order')
            }
            throw new Error('Network error occurred')
        }
    }

    // Cancel order (update status to CANCELLED)
    async cancelOrder(id: string) {
        try {
            const response = await this.updateOrderStatus(id, 'CANCELLED')
            return response
        } catch (error: any) {
            console.error('❌ Failed to cancel order:', error)
            throw new Error('Failed to cancel order')
        }
    }
}

export const orderAPI = new OrderAPI()