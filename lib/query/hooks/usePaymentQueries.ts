import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { paymentAPI } from '@/lib/api'
import { invalidateQueries } from '../client'

// Create Payment URL Mutation
export function useCreatePaymentUrl(
  options?: UseMutationOptions<any, Error, {
    amount: number
    orderId: string
    description: string
  }>
) {
  return useMutation({
    mutationFn: (data: {
      amount: number
      orderId: string
      description: string
    }) => paymentAPI.createPaymentUrl(data),
    ...options,
  })
}

// Process Payment Callback Mutation
export function useProcessPaymentCallback(
  options?: UseMutationOptions<any, Error, {
    orderId: string
    paymentData: any
  }>
) {
  return useMutation({
    mutationFn: (data: {
      orderId: string
      paymentData: any
    }) => {
      // TODO: Implement payment callback processing
      console.log('💳 Processing payment callback:', data)
      return Promise.resolve({ success: true })
    },
    onSuccess: (data, variables) => {
      // Invalidate order after payment
      invalidateQueries.order(variables.orderId)
      invalidateQueries.allOrders()
    },
    ...options,
  })
}