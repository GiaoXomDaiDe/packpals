import * as Haptics from 'expo-haptics'
import { useCallback, useState } from 'react'

interface UseRefreshOptions {
    /** Function to execute on refresh */
    onRefresh: () => Promise<void> | void
    /** Enable haptic feedback on refresh */
    enableHaptics?: boolean
    /** Custom haptic style */
    hapticStyle?: Haptics.ImpactFeedbackStyle
    /** Show success feedback after refresh */
    showSuccessFeedback?: boolean
}

interface UseRefreshReturn {
    /** Whether refresh is currently in progress */
    isRefreshing: boolean
    /** Function to trigger refresh with feedback */
    triggerRefresh: () => Promise<void>
    /** Manually set refreshing state */
    setRefreshing: (refreshing: boolean) => void
}

/**
 * Custom hook for handling refresh logic with haptic feedback
 * Can be used with RefreshButton or RefreshControl
 */
export const useRefresh = ({
    onRefresh,
    enableHaptics = true,
    hapticStyle = Haptics.ImpactFeedbackStyle.Light,
    showSuccessFeedback = false
}: UseRefreshOptions): UseRefreshReturn => {
    const [isRefreshing, setRefreshing] = useState(false)

    const triggerRefresh = useCallback(async () => {
        if (isRefreshing) return

        try {
            // Haptic feedback on start
            if (enableHaptics) {
                await Haptics.impactAsync(hapticStyle)
            }

            setRefreshing(true)
            await onRefresh()

            // Success haptic feedback
            if (enableHaptics && showSuccessFeedback) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            }
        } catch (error) {
            console.error('Refresh error:', error)
            
            // Error haptic feedback
            if (enableHaptics) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
            }
        } finally {
            setRefreshing(false)
        }
    }, [isRefreshing, onRefresh, enableHaptics, hapticStyle, showSuccessFeedback])

    return {
        isRefreshing,
        triggerRefresh,
        setRefreshing
    }
}

export default useRefresh
