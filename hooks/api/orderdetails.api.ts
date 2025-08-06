import apiClient from '../../lib/config/axios.config'
import { CreateOrderDetailsRequest } from '../../types/type'

export class OrderDetailsAPI {
    private readonly baseEndpoint = '/OrderDetail'

    // Get order details by order ID (matches backend GET /api/orderdetail/order/{orderId})
    async getOrderDetailsByOrderId(orderId: string, query?: {
        page?: number
        pageSize?: number
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
            
            const response = await apiClient.get(`${this.baseEndpoint}/order/${orderId}?${params.toString()}`)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to fetch order details')
            }
            throw new Error('Network error occurred')
        }
    }

    // Get order detail by ID (matches backend GET /api/orderdetail/{id})
    async getOrderDetailById(id: string) {
        try {
            const response = await apiClient.get(`${this.baseEndpoint}/${id}`)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to fetch order detail')
            }
            throw new Error('Network error occurred')
        }
    }

    // Create order details (matches backend POST /api/OrderDetail/{orderId})
    // Body: Array of { sizeId: "guid" }
    async createOrderDetails(orderId: string, orderDetails: CreateOrderDetailsRequest) {
        try {
            console.log('🔍 OrderDetails API - Creating order details:', {
                orderId,
                orderDetailsCount: orderDetails.length,
                endpoint: `${this.baseEndpoint}/${orderId}`,
                orderDetailsPayload: orderDetails
            })
            
            if (!orderId) {
                console.error('❌ OrderDetails API - orderId is undefined!')
                throw new Error('Order ID is required but was undefined')
            }
            
            const response = await apiClient.post(
                `${this.baseEndpoint}/${orderId}`, 
                orderDetails,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )
            
            console.log('Order details created successfully:', response.data)
            return response.data
        } catch (error: any) {
            console.error('Failed to create order details:', error)
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to create order details')
            }
            throw new Error('Network error occurred')
        }
    }

    // Update order detail (matches backend PUT /api/orderdetail)
    async updateOrderDetail(orderDetailData: {
        id: string
        sizeId: string
    }) {
        try {
            const response = await apiClient.put(this.baseEndpoint, orderDetailData)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to update order detail')
            }
            throw new Error('Network error occurred')
        }
    }

    // Delete order detail (matches backend DELETE /api/orderdetail/{id})
    async deleteOrderDetail(id: string) {
        try {
            const response = await apiClient.delete(`${this.baseEndpoint}/${id}`)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to delete order detail')
            }
            throw new Error('Network error occurred')
        }
    }
}

export const orderDetailsAPI = new OrderDetailsAPI()