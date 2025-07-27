import * as AuthSession from 'expo-auth-session'
import apiClient from '../config/axios.config'

export interface PayOSPaymentRequest {
  amount: number
  description: string
  returnUrl: string
  cancelUrl: string
  paymentCode: string
  orderId: string
  buyerEmail?: string
  buyerPhone?: string
}

// Helper function to generate redirect URLs for Expo Auth Session
export const getPaymentUrls = (orderId: string, orderCode?: string) => {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'packpals',
    path: 'payment-result'
  })

  console.log('🔗 Payment redirect URI:', redirectUri)

  return {
    returnUrl: `${redirectUri}?orderId=${orderId}&orderCode=${orderCode || ''}&status=success`,
    cancelUrl: `${redirectUri}?orderId=${orderId}&orderCode=${orderCode || ''}&status=cancelled`
  }
}

export interface PayOSCreateTransactionRequest {
  amount: number
  description: string
  orderId: string
  transactionCode: string
}

export interface PayOSPaymentResponse {
  checkoutUrl: string
  orderCode: number
  status: string
  qrCode: string
}

export interface PayOSTransactionResponse {
  id: string
  orderId: string
  transactionCode: string
  amount: number
  description: string
  status: string
  createdAt: string
}

export interface PayOSPaymentInfo {
  id: string
  orderCode: number
  amount: number
  amountPaid: number
  amountRemaining: number
  status: string
  createdAt: string
  description: string
  transactions: any[]
}

export class PayOSAPI {
  private readonly baseEndpoint = '/payment/OS'

  /**
   * Create PayOS payment link
   */
  async createPaymentLink(request: PayOSPaymentRequest): Promise<PayOSPaymentResponse> {
    try {
      console.log('💳 Creating PayOS payment link:', request)
      const response = await apiClient.post(`${this.baseEndpoint}/create-link`, request)
      console.log('✅ PayOS payment link created:', response.data)
      
      if (!response.data?.data) {
        throw new Error('Invalid response format from PayOS')
      }
      
      return response.data.data
    } catch (error: any) {
      console.error('❌ Failed to create PayOS payment link:', error)
      console.error('❌ PayOS API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        request: request
      })
      if (error.response) {
        throw new Error(error.response.data?.message || `HTTP ${error.response.status}: Failed to create payment link`)
      }
      throw new Error('Network error occurred')
    }
  }

  /**
   * Create transaction record in database
   */
  async createTransaction(request: PayOSCreateTransactionRequest): Promise<PayOSTransactionResponse> {
    try {
      console.log('💾 Creating PayOS transaction record:', request)
      const response = await apiClient.post(`${this.baseEndpoint}/create-transaction`, request)
      console.log('✅ PayOS transaction created:', response.data)
      
      if (!response.data?.data) {
        throw new Error('Invalid response format from transaction API')
      }
      
      return response.data.data
    } catch (error: any) {
      console.error('❌ Failed to create PayOS transaction:', error)
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to create transaction')
      }
      throw new Error('Network error occurred')
    }
  }

  /**
   * Get payment information by payment code
   */
  async getPaymentInfo(paymentCodeId: number): Promise<PayOSPaymentInfo> {
    try {
      console.log('🔍 Getting PayOS payment info for code:', paymentCodeId)
      const response = await apiClient.get(`${this.baseEndpoint}/${paymentCodeId}`)
      console.log('✅ PayOS payment info retrieved:', response.data)
      
      if (!response.data?.data) {
        throw new Error('Invalid response format from payment info API')
      }
      
      return response.data.data
    } catch (error: any) {
      console.error('❌ Failed to get PayOS payment info:', error)
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to get payment info')
      }
      throw new Error('Network error occurred')
    }
  }

  /**
   * Cancel payment order
   */
  async cancelPayment(paymentCodeId: number): Promise<PayOSPaymentInfo> {
    try {
      console.log('❌ Cancelling PayOS payment for code:', paymentCodeId)
      const response = await apiClient.put(`${this.baseEndpoint}/${paymentCodeId}`)
      console.log('✅ PayOS payment cancelled:', response.data)
      
      if (!response.data?.data) {
        throw new Error('Invalid response format from cancel API')
      }
      
      return response.data.data
    } catch (error: any) {
      console.error('❌ Failed to cancel PayOS payment:', error)
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to cancel payment')
      }
      throw new Error('Network error occurred')
    }
  }

  /**
   * Confirm webhook URL with PayOS for development environment
   * Uses ngrok URL to receive payment notifications
   */
  async confirmWebhook(webhookUrl?: string): Promise<string> {
    try {
      // Use ngrok URL for development webhook
      const developmentWebhookUrl = webhookUrl || 'https://a169fb8b36f3.ngrok-free.app/api/payment/OS/webhook'
      
      console.log('🔗 Confirming PayOS webhook URL:', developmentWebhookUrl)
      const response = await apiClient.post(`${this.baseEndpoint}/confirm-webhook`, 
        JSON.stringify(developmentWebhookUrl), 
        {
          headers: { 'Content-Type': 'application/json' }
        }
      )
      console.log('✅ PayOS webhook confirmed:', response.data)
      
      return response.data?.data || '0'
    } catch (error: any) {
      console.error('❌ Failed to confirm PayOS webhook:', error)
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to confirm webhook')
      }
      throw new Error('Network error occurred')
    }
  }
}

export const payosAPI = new PayOSAPI()
export default payosAPI