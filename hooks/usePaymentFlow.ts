import { getPaymentUrls, PayOSPaymentRequest } from '@/hooks/api/payos.api'
import { useCreatePayOSPayment } from '@/lib/query/hooks/usePayOSQueries'
import * as AuthSession from 'expo-auth-session'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'

export interface PaymentFlowOptions {
  orderId: string
  amount: number
  description: string
  paymentCode?: string
  buyerEmail?: string
  buyerPhone?: string
}

/**
 * Custom hook for handling payment flow using Expo Auth Session
 * Works in both development (Expo Go) and production environments
 */
export const usePaymentFlow = () => {
  const createPayOSPayment = useCreatePayOSPayment({
    onSuccess: async (response, variables) => {
      console.log('✅ Payment link created successfully:', response.checkoutUrl)
      
      try {
        // Use Expo Auth Session to open payment and handle redirect
        const redirectUri = AuthSession.makeRedirectUri({
          scheme: 'packpals',
          path: 'payment-result'
        })
        
        console.log('🔗 Opening payment with redirect URI:', redirectUri)
        
        // Open payment page with auth session
        const result = await WebBrowser.openAuthSessionAsync(
          response.checkoutUrl, 
          redirectUri
        )
        
        console.log('💳 Payment session result:', result)
        
        if (result.type === 'success' && result.url) {
          // Parse the result URL and navigate to payment result
          const url = new URL(result.url)
          const params = new URLSearchParams(url.search)
          
          router.push({
            pathname: '/(root)/payment-result',
            params: {
              orderId: params.get('orderId') || variables.orderId,
              orderCode: params.get('orderCode') || '',
              status: params.get('status') || 'unknown'
            }
          })
        } else if (result.type === 'cancel') {
          console.log('💳 Payment cancelled by user')
          router.push({
            pathname: '/(root)/payment-result',
            params: {
              orderId: variables.orderId,
              orderCode: '',
              status: 'cancelled'
            }
          })
        }
        
      } catch (error) {
        console.error('❌ Payment session error:', error)
        throw error
      }
    },
    onError: (error) => {
      console.error('❌ Payment creation failed:', error)
    }
  })

  const initiatePayment = async (options: PaymentFlowOptions) => {
    try {
      console.log('💳 Initiating payment flow for order:', options.orderId)
      
      // Generate development-friendly URLs
      const { returnUrl, cancelUrl } = getPaymentUrls(options.orderId)
      
      const paymentRequest: PayOSPaymentRequest = {
        amount: options.amount,
        description: options.description,
        returnUrl,
        cancelUrl,
        paymentCode: options.paymentCode || `PAY_${options.orderId}_${Date.now()}`,
        orderId: options.orderId,
        buyerEmail: options.buyerEmail,
        buyerPhone: options.buyerPhone
      }

      console.log('🔄 Payment request:', {
        ...paymentRequest,
        returnUrl: paymentRequest.returnUrl,
        cancelUrl: paymentRequest.cancelUrl
      })

      // Create payment link
      await createPayOSPayment.mutateAsync(paymentRequest)
      
    } catch (error) {
      console.error('❌ Payment initiation failed:', error)
      throw error
    }
  }

  return {
    initiatePayment,
    isLoading: createPayOSPayment.isPending,
    error: createPayOSPayment.error,
    reset: createPayOSPayment.reset
  }
}

/**
 * Development helper to test deep linking
 */
export const testDeepLink = (orderId: string, status: 'success' | 'cancelled' = 'success') => {
  console.log('🔗 Testing deep link navigation to payment result')
  
  router.push({
    pathname: '/(root)/payment-result',
    params: {
      orderId,
      orderCode: '12345',
      status
    }
  })
}
