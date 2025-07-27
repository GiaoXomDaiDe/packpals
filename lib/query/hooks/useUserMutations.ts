import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userAPI } from '../../api/user.api'

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
