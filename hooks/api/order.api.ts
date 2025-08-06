import apiClient from '../../lib/config/axios.config';

export interface OrderCountdownData {
    orderId: string;
    startKeepTime: string;
    estimatedDays: number;
    estimatedEndTime: string;
    timeRemainingInMilliseconds: number;
    isExpired: boolean;
    formattedTimeRemaining: string;
    percentageComplete: number;
}

export class OrderAPI {
    private readonly baseEndpoint = '/Order'

    // Get all orders for a user (matches backend GET /api/Order/user/{userId})
    async getUserOrders(userId: string, query?: {
        IsPaid?: boolean
        Status?: string
        PageIndex?: number
        PageSize?: number
        MonthAndYear?: string // Format: "MM/yyyy" or "yyyy-MM"
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

    // Get all orders for a keeper (matches backend GET /api/Order/keeper/{keeperId})
    async getKeeperOrders(keeperId: string, query?: {
        IsPaid?: boolean
        Status?: string
        PageIndex?: number
        PageSize?: number
        MonthAndYear?: string // Format: "MM/yyyy" or "yyyy-MM"
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
            
            console.log('🔍 Fetching keeper orders for keeperId:', keeperId, 'with params:', query)
            const response = await apiClient.get(`${this.baseEndpoint}/keeper/${keeperId}?${params.toString()}`)
            console.log('📋 Keeper orders response:', response.data)
            return response.data
        } catch (error: any) {
            console.error('❌ Failed to fetch keeper orders:', error)
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to fetch keeper orders')
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

    // Calculate final amount with overtime fees (matches backend GET /api/Order/{id}/calculate-fee)
    async calculateFinalAmount(orderId: string) {
        try {
            // console.log('💰 Calculating final amount for order:', orderId)
            const response = await apiClient.get(`${this.baseEndpoint}/${orderId}/calculate-fee`)
            return response.data
        } catch (error: any) {
            console.error('❌ Failed to calculate final amount:', error)
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to calculate final amount')
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

    // Get countdown information for a single order
    async getOrderCountdown(orderId: string): Promise<OrderCountdownData | null> {
        try {
            const response = await apiClient.get(`${this.baseEndpoint}/${orderId}/countdown`)
            
            if (response.data.statusCode === 200) {
                return response.data.data
            }
            
            console.warn(`Failed to get countdown for order ${orderId}:`, response.data.message)
            return null
        } catch (error: any) {
            console.error('Error fetching order countdown:', error)
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to fetch order countdown')
            }
            throw new Error('Network error occurred')
        }
    }

    // Get countdown information for multiple orders (bulk operation)
    async getMultipleOrderCountdown(orderIds: string[]): Promise<OrderCountdownData[]> {
        try {
            if (orderIds.length === 0) return []
            
            // Split into chunks of 50 to respect API limit
            const chunks = []
            for (let i = 0; i < orderIds.length; i += 50) {
                chunks.push(orderIds.slice(i, i + 50))
            }
            
            const allResults: OrderCountdownData[] = []
            
            for (const chunk of chunks) {
                const response = await apiClient.post(`${this.baseEndpoint}/countdown/bulk`, chunk)
                
                if (response.data.statusCode === 200) {
                    allResults.push(...response.data.data)
                } else {
                    console.warn('Failed to get countdown for batch:', response.data.message)
                }
            }
            
            return allResults
        } catch (error: any) {
            console.error('Error fetching multiple order countdown:', error)
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to fetch multiple order countdown')
            }
            throw new Error('Network error occurred')
        }
    }

    // Client-side countdown calculator for real-time updates between API calls
    calculateClientSideCountdown(serverCountdown: OrderCountdownData): OrderCountdownData {
        const now = new Date().getTime()
        const serverTime = new Date(serverCountdown.estimatedEndTime).getTime()
        const startTime = new Date(serverCountdown.startKeepTime).getTime()
        
        const timeRemainingInMilliseconds = serverTime - now
        const isExpired = timeRemainingInMilliseconds <= 0
        
        // Calculate percentage complete
        const totalDuration = serverTime - startTime
        const elapsedTime = now - startTime
        const percentageComplete = Math.max(0, Math.min(100, (elapsedTime / totalDuration) * 100))
        
        // Format time remaining
        const formatTimeRemaining = (ms: number): string => {
            const absMs = Math.abs(ms)
            const days = Math.floor(absMs / (1000 * 60 * 60 * 24))
            const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((absMs % (1000 * 60)) / 1000)

            if (days >= 1) {
                return `${days}d ${hours}h ${minutes}m`
            } else if (hours >= 1) {
                return `${hours}h ${minutes}m`
            } else {
                return `${minutes}m ${seconds}s`
            }
        }

        let formattedTimeRemaining
        if (isExpired) {
            formattedTimeRemaining = `Overdue by ${formatTimeRemaining(-timeRemainingInMilliseconds)}`
        } else {
            formattedTimeRemaining = formatTimeRemaining(timeRemainingInMilliseconds)
        }

        return {
            ...serverCountdown,
            timeRemainingInMilliseconds,
            isExpired,
            formattedTimeRemaining,
            percentageComplete
        }
    }
}

export const orderAPI = new OrderAPI()