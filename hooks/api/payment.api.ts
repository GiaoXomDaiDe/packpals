import apiClient from '../../lib/config/axios.config'

export class PaymentAPI {
    private readonly baseEndpoint = '/payment'

    // Create VNPay payment URL (matches backend POST /api/payment/create-payment-url)
    async createPaymentUrl(paymentData: {
        amount: number
        orderId: string
        description: string
    }) {
        try {
            const response = await apiClient.post(`${this.baseEndpoint}/create-payment-url`, paymentData)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to create payment URL')
            }
            throw new Error('Network error occurred')
        }
    }

    // Handle VNPay payment callback (matches backend GET /api/payment/callback)
    async handlePaymentCallback(callbackParams: Record<string, string>) {
        try {
            const params = new URLSearchParams()
            Object.entries(callbackParams).forEach(([key, value]) => {
                params.append(key, value)
            })
            
            const response = await apiClient.get(`${this.baseEndpoint}/callback?${params.toString()}`)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Payment callback failed')
            }
            throw new Error('Network error occurred')
        }
    }

    // Handle VNPay IPN (matches backend GET /api/payment/ipn-action)
    async handlePaymentIPN(ipnParams: Record<string, string>) {
        try {
            const params = new URLSearchParams()
            Object.entries(ipnParams).forEach(([key, value]) => {
                params.append(key, value)
            })
            
            const response = await apiClient.get(`${this.baseEndpoint}/ipn-action?${params.toString()}`)
            return response.data
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.message || 'Payment IPN failed')
            }
            throw new Error('Network error occurred')
        }
    }
}

export const paymentAPI = new PaymentAPI()