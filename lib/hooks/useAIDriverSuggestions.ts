import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-expo'
import { useFetch } from '@/lib/fetch'
import { useLocationStore } from '@/store'

export interface AIDriverSuggestion {
    driver: {
        id: number
        first_name: string
        last_name: string
        profile_image_url?: string
        car_image_url?: string
        car_seats: number
        rating: number
        clerk_user_id: string
        current_latitude?: number
        current_longitude?: number
        is_available?: boolean
    }
    score: number
    distance_km: number
    estimated_arrival_minutes: number
    estimated_price: number
    reasons: string[]
}

export interface AIResponse {
    suggestions: AIDriverSuggestion[]
    contextual_info: {
        pickup_location: string
        passenger_count: number
        total_available_drivers: number
        eligible_drivers: number
        context_factors: string[]
        user_preferences: {
            preferred_rating_range: [number, number]
            preferred_car_size: number
            price_sensitivity: number
        }
    }
    ai_insights: {
        recommendation_confidence: number
        personalization_level: string
        time_multiplier: number
        demand_level: string
    }
}

export function useAIDriverSuggestions(passengerCount: number = 1) {
    const { user } = useUser()
    const { userLatitude, userLongitude, destinationLatitude, destinationLongitude } = useLocationStore()
    const [suggestions, setSuggestions] = useState<AIDriverSuggestion[]>([])
    const [contextualInfo, setContextualInfo] = useState<AIResponse['contextual_info'] | null>(null)
    const [aiInsights, setAiInsights] = useState<AIResponse['ai_insights'] | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchAISuggestions = async () => {
        if (!user?.id || !userLatitude || !userLongitude) {
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/(api)/ai/driver-suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pickup_latitude: userLatitude,
                    pickup_longitude: userLongitude,
                    destination_latitude: destinationLatitude || userLatitude,
                    destination_longitude: destinationLongitude || userLongitude,
                    passenger_count: passengerCount,
                    user_id: user.id,
                }),
            })

            const data = await response.json()

            if (data.success) {
                setSuggestions(data.data.suggestions)
                setContextualInfo(data.data.contextual_info)
                setAiInsights(data.data.ai_insights)
            } else {
                setError(data.error || 'Failed to fetch AI suggestions')
            }
        } catch (err) {
            console.error('Error fetching AI suggestions:', err)
            setError('Network error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    // Auto-fetch when location changes
    useEffect(() => {
        if (userLatitude && userLongitude) {
            fetchAISuggestions()
        }
    }, [userLatitude, userLongitude, destinationLatitude, destinationLongitude, passengerCount, user?.id])

    return {
        suggestions,
        contextualInfo,
        aiInsights,
        isLoading,
        error,
        refetch: fetchAISuggestions,
    }
}

export function useAIDriverSuggestionsSimple(passengerCount: number = 1) {
    const { user } = useUser()
    const { userLatitude, userLongitude } = useLocationStore()
    
    const {
        data,
        loading,
        error,
        refetch
    } = useFetch<{
        suggestions: AIDriverSuggestion[]
        user_preferences: any
        personalized: boolean
    }>(`/(api)/ai/driver-suggestions?userId=${user?.id}&lat=${userLatitude}&lng=${userLongitude}&passengers=${passengerCount}`)

    return {
        suggestions: data?.suggestions || [],
        userPreferences: data?.user_preferences,
        personalized: data?.personalized || false,
        isLoading: loading,
        error,
        refetch
    }
}