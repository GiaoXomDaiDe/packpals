import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userAPI } from '../api/user.api'

/**
 * Hook for updating user account information
 */
export const useUpdateAccount = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ userId, data }: {
            userId: string
            data: {
                email?: string
                username?: string
                phoneNumber?: string
                role?: string
            }
        }) => userAPI.updateAccount(userId, data),
        onSuccess: (response) => {
            console.log('✅ Account update successful:', response)
            
            // Invalidate and refetch user profile
            queryClient.invalidateQueries({
                queryKey: ['userProfile']
            })
            
            // You might also want to update other related queries
            queryClient.invalidateQueries({
                queryKey: ['user']
            })
        },
        onError: (error) => {
            console.error('❌ Account update failed:', error)
        }
    })
}

/**
 * Hook for updating user avatar
 */
export const useUpdateAvatar = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ userId, imageData }: {
            userId: string
            imageData: string
        }) => userAPI.updateAvatar(userId, imageData),
        onSuccess: (response) => {
            console.log('✅ Avatar update successful:', response)
            
            // Invalidate and refetch user profile
            queryClient.invalidateQueries({
                queryKey: ['userProfile']
            })
            
            queryClient.invalidateQueries({
                queryKey: ['user']
            })
        },
        onError: (error) => {
            console.error('❌ Avatar update failed:', error)
        }
    })
}
