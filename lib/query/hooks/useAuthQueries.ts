import { authAPI, userAPI } from '@/lib/api'
import type { AuthServiceResponse, LoginCredentials, RegisterData } from '@/lib/types/auth.types'
import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { invalidateQueries } from '../client'

// Login Mutation
export function useLogin(
  options?: UseMutationOptions<AuthServiceResponse, Error, LoginCredentials>
) {
  return useMutation<AuthServiceResponse, Error, LoginCredentials>({
    mutationFn: (credentials: LoginCredentials) => authAPI.login(credentials),
    onSuccess: (data) => {
      invalidateQueries.allOrders()
      invalidateQueries.allStorages()
      invalidateQueries.allSizes()
    },
    ...options,
  })
}

// Register Mutation
export function useRegister(
  options?: UseMutationOptions<string, Error, RegisterData>
) {
  return useMutation<string, Error, RegisterData>({
    mutationFn: (data: RegisterData) => authAPI.register(data),
    onSuccess: (data) => {
      // After successful registration, no need to invalidate queries yet
      // User will need to login first
    },
    ...options,
  })
}

// useUserProfile moved to useUserQueries.ts to avoid duplicate exports

// Update User Profile Mutation
export function useUpdateUserProfile(
  options?: UseMutationOptions<any, Error, {
    userId: string
    data: {
      username?: string
      phoneNumber?: string
      email?: string
    }
  }>
) {
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
      // Invalidate user-related queries
      invalidateQueries.user(variables.userId)
      invalidateQueries.userProfile(variables.userId)
    },
    ...options,
  })
}

// Register Keeper Mutation
export function useRegisterKeeper(
  options?: UseMutationOptions<any, Error, {
    email: string
    identityNumber: string
    documents: File
  }>
) {
  return useMutation({
    mutationFn: (data: {
      email: string
      identityNumber: string
      documents: File
    }) => {
      // Note: This would need to use the proper API endpoint
      // For now, this is a placeholder - you'll need to implement the registerKeeper API call
      console.warn('registerKeeper API not implemented yet')
      return Promise.reject(new Error('registerKeeper API not implemented'))
    },
    onSuccess: (data, variables) => {
      // Invalidate user data to reflect role change
      invalidateQueries.allOrders()
      invalidateQueries.allStorages()
    },
    ...options,
  })
}