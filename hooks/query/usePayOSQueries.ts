import { payosAPI, PayOSCreateTransactionRequest, PayOSPaymentInfo, PayOSPaymentRequest, PayOSPaymentResponse, PayOSTransactionResponse } from '@/hooks/api/payos.api'
import { useMutation, UseMutationOptions, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { invalidateQueries, queryKeys } from '../client'

/**
 * Hook for creating PayOS payment link
 */
export function useCreatePayOSPayment(
  options?: UseMutationOptions<PayOSPaymentResponse, Error, PayOSPaymentRequest>
) {
  return useMutation<PayOSPaymentResponse, Error, PayOSPaymentRequest>({
    mutationFn: async (request: PayOSPaymentRequest) => {
      console.log('🔄 Creating PayOS payment link...')
      return await payosAPI.createPaymentLink(request)
    },
    onSuccess: (data, variables) => {
      console.log('✅ PayOS payment link created successfully:', data.checkoutUrl)
    },
    onError: (error, variables) => {
      console.error('❌ PayOS payment creation failed:', error)
    },
    ...options,
  })
}

/**
 * Hook for creating PayOS transaction record
 */
export function useCreatePayOSTransaction(
  options?: UseMutationOptions<PayOSTransactionResponse, Error, PayOSCreateTransactionRequest>
) {
  return useMutation<PayOSTransactionResponse, Error, PayOSCreateTransactionRequest>({
    mutationFn: async (request: PayOSCreateTransactionRequest) => {
      console.log('🔄 Creating PayOS transaction record...')
      return await payosAPI.createTransaction(request)
    },
    onSuccess: (data, variables) => {
      console.log('✅ PayOS transaction created successfully:', data.id)
    },
    onError: (error, variables) => {
      console.error('❌ PayOS transaction creation failed:', error)
    },
    ...options,
  })
}

/**
 * Hook for getting PayOS payment information
 */
export function usePayOSPaymentInfo(
  paymentCodeId: number,
  options?: Omit<UseQueryOptions<PayOSPaymentInfo>, 'queryKey' | 'queryFn'>
) {
  return useQuery<PayOSPaymentInfo>({
    queryKey: queryKeys.payosPayment(paymentCodeId),
    queryFn: () => payosAPI.getPaymentInfo(paymentCodeId),
    enabled: !!paymentCodeId && paymentCodeId > 0,
    refetchInterval: (data) => {
      // Stop polling if payment is completed or cancelled
      if (data?.status === 'PAID' || data?.status === 'CANCELLED') {
        return false
      }
      // Poll every 3 seconds for pending payments
      return 3000
    },
    ...options,
  })
}

/**
 * Hook for cancelling PayOS payment
 */
export function useCancelPayOSPayment(
  options?: UseMutationOptions<PayOSPaymentInfo, Error, number>
) {
  return useMutation<PayOSPaymentInfo, Error, number>({
    mutationFn: async (paymentCodeId: number) => {
      console.log('🔄 Cancelling PayOS payment...')
      return await payosAPI.cancelPayment(paymentCodeId)
    },
    onSuccess: (data, paymentCodeId) => {
      console.log('✅ PayOS payment cancelled successfully:', paymentCodeId)
      // Invalidate payment info query
      invalidateQueries.payosPayment(paymentCodeId)
    },
    onError: (error, paymentCodeId) => {
      console.error('❌ PayOS payment cancellation failed:', error)
    },
    ...options,
  })
}

/**
 * Hook for confirming PayOS webhook
 */
export function useConfirmPayOSWebhook(
  options?: UseMutationOptions<string, Error, string>
) {
  return useMutation<string, Error, string>({
    mutationFn: async (webhookUrl: string) => {
      console.log('🔄 Confirming PayOS webhook...')
      return await payosAPI.confirmWebhook(webhookUrl)
    },
    onSuccess: (data, webhookUrl) => {
      console.log('✅ PayOS webhook confirmed successfully:', webhookUrl)
    },
    onError: (error, webhookUrl) => {
      console.error('❌ PayOS webhook confirmation failed:', error)
    },
    ...options,
  })
}