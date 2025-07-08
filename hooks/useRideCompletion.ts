import { useRideStore } from '@/store'
import { useEffect, useState } from 'react'

export const useRideCompletion = () => {
    const { completedRide, clearCompletedRide } = useRideStore()
    const [showReviewPrompt, setShowReviewPrompt] = useState(false)

    useEffect(() => {
        // Show review prompt if there's a completed ride that hasn't been reviewed
        if (completedRide && !completedRide.reviewed) {
            setShowReviewPrompt(true)
        }
    }, [completedRide])

    const dismissReviewPrompt = () => {
        setShowReviewPrompt(false)
        clearCompletedRide()
    }

    const markAsReviewed = () => {
        setShowReviewPrompt(false)
        clearCompletedRide()
    }

    return {
        completedRide,
        showReviewPrompt,
        dismissReviewPrompt,
        markAsReviewed,
    }
}
