import { authAPI, userAPI } from '@/lib'
import { useMutation } from '@tanstack/react-query'
import { invalidateQueries } from '../client'

export function useLogin(options?: {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}) {
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) => authAPI.login(credentials),
    onSuccess: (data) => {
      invalidateQueries.allOrders()
      invalidateQueries.allStorages()
      invalidateQueries.allSizes()
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      options?.onError?.(error)
    },
  })
}

export function useRegister(options?: {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}) {
  return useMutation({
    mutationFn: (data: {
      email: string
      password: string
      confirmPassword: string
      username: string
      phoneNumber: string
    }) => authAPI.register(data),
    onSuccess: (data) => {
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      options?.onError?.(error)
    },
  })
}

export function useChangePassword(options?: {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}) {
  return useMutation({
    mutationFn: ({ userEmail, passwordData }: {
      userEmail: string
      passwordData: {
        currentPassword: string
        newPassword: string
        confirmNewPassword: string
      }
    }) => authAPI.changePassword(passwordData, userEmail),
    onSuccess: (data) => {
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      options?.onError?.(error)
    },
  })
}

export function useForgotPassword(options?: {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}) {
  return useMutation({
    mutationFn: ({ userEmail, passwordData }: {
      userEmail: string
      passwordData: {
        newPassword: string
        confirmNewPassword: string
      }
    }) => authAPI.forgotPassword(passwordData, userEmail),
    onSuccess: (data) => {
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      options?.onError?.(error)
    },
  })
}

export function useUpdateUserProfile(options?: {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}) {
  return useMutation({
    mutationFn: ({ userId, data }: {
      userId: string
      data: {
        username?: string
        phoneNumber?: string  
        email?: string
      }
    }) => userAPI.updateProfile(userId, data),
    onSuccess: (data, variables) => {
      invalidateQueries.user(variables.userId)
      invalidateQueries.userProfile(variables.userId)
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      options?.onError?.(error)
    },
  })
}
