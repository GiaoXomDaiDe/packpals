import { router } from 'expo-router'

/**
 * Safe navigation back function that handles cases where there's no screen to go back to
 * @param fallbackRoute - Route to navigate to if can't go back (default: home)
 */
export const safeGoBack = (fallbackRoute: string = '/(root)/(tabs)/home') => {
    try {
        if (router.canGoBack()) {
            router.back()
        } else {
            router.replace(fallbackRoute)
        }
    } catch (error) {
        console.warn('Navigation error, using fallback route:', error)
        router.replace(fallbackRoute)
    }
}

/**
 * Safe navigation back with custom fallback for different screens
 */
export const safeGoBackToOrders = () => safeGoBack('/(root)/(tabs)/orders')
export const safeGoBackToProfile = () => safeGoBack('/(root)/(tabs)/profile')
export const safeGoBackToHome = () => safeGoBack('/(root)/(tabs)/home')
