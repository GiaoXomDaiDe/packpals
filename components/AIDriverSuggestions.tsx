import { icons } from '@/constants'
import { fetchAPI } from '@/lib/fetch'
import { useUser } from '@clerk/clerk-expo'
import React, { useCallback, useEffect, useState } from 'react'
import {
    ActivityIndicator,
    FlatList,
    Image,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

interface Driver {
    id: number
    first_name: string
    last_name: string
    profile_image_url?: string
    car_image_url?: string
    car_seats: number
    rating: number
}

interface DriverSuggestion {
    driver: Driver
    score: number
    distance_km: number
    estimated_arrival_minutes: number
    estimated_price: number
    reasons: string[]
}

interface Props {
    pickup_latitude: number
    pickup_longitude: number
    destination_latitude?: number
    destination_longitude?: number
    passenger_count: number
    onDriverSelect?: (suggestion: DriverSuggestion) => void
}

const AIDriverSuggestions: React.FC<Props> = ({
    pickup_latitude,
    pickup_longitude,
    destination_latitude,
    destination_longitude,
    passenger_count,
    onDriverSelect,
}) => {
    const { user } = useUser()
    const [suggestions, setSuggestions] = useState<DriverSuggestion[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchSuggestions = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetchAPI('/(api)/ai/driver-suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pickup_latitude,
                    pickup_longitude,
                    destination_latitude,
                    destination_longitude,
                    passenger_count,
                    user_id: user?.id,
                }),
            })

            if (response.success) {
                setSuggestions(response.data.suggestions)
            } else {
                setError('Failed to get driver suggestions')
            }
        } catch (error) {
            console.error('Error fetching AI suggestions:', error)
            setError('Failed to load driver suggestions')
        } finally {
            setLoading(false)
        }
    }, [
        user?.id,
        pickup_latitude,
        pickup_longitude,
        destination_latitude,
        destination_longitude,
        passenger_count,
    ])

    useEffect(() => {
        if (
            user?.id &&
            pickup_latitude &&
            pickup_longitude &&
            passenger_count
        ) {
            fetchSuggestions()
        }
    }, [
        fetchSuggestions,
        user?.id,
        pickup_latitude,
        pickup_longitude,
        passenger_count,
    ])

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price)
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'bg-green-500'
        if (score >= 60) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent Match'
        if (score >= 60) return 'Good Match'
        return 'Fair Match'
    }

    const renderDriverCard = ({
        item,
        index,
    }: {
        item: DriverSuggestion
        index: number
    }) => (
        <TouchableOpacity
            className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
            onPress={() => onDriverSelect?.(item)}
        >
            {/* Header with ranking */}
            <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                    <View className="bg-blue-100 rounded-full w-8 h-8 items-center justify-center mr-3">
                        <Text className="text-blue-600 font-bold">
                            #{index + 1}
                        </Text>
                    </View>
                    <Text className="text-lg font-bold text-gray-800">
                        AI Recommended
                    </Text>
                </View>
                <View
                    className={`px-3 py-1 rounded-full ${getScoreColor(item.score)}`}
                >
                    <Text className="text-white text-xs font-semibold">
                        {getScoreLabel(item.score)}
                    </Text>
                </View>
            </View>

            {/* Driver Info */}
            <View className="flex-row items-center mb-3">
                <Image
                    source={{
                        uri:
                            item.driver.profile_image_url ||
                            'https://via.placeholder.com/80',
                    }}
                    className="w-16 h-16 rounded-full mr-4"
                />
                <View className="flex-1">
                    <Text className="text-xl font-semibold text-gray-800">
                        {item.driver.first_name} {item.driver.last_name}
                    </Text>
                    <View className="flex-row items-center mt-1">
                        <Image source={icons.star} className="w-4 h-4 mr-1" />
                        <Text className="text-gray-600">
                            {item.driver.rating.toFixed(1)} •{' '}
                            {item.driver.car_seats} seats
                        </Text>
                    </View>
                </View>
            </View>

            {/* Trip Details */}
            <View className="bg-gray-50 rounded-lg p-3 mb-3">
                <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center">
                        <Image source={icons.target} className="w-4 h-4 mr-2" />
                        <Text className="text-gray-600">Distance</Text>
                    </View>
                    <Text className="font-semibold">{item.distance_km} km</Text>
                </View>

                <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center">
                        <Text className="text-gray-600 mr-2">⏰</Text>
                        <Text className="text-gray-600">Arrival</Text>
                    </View>
                    <Text className="font-semibold">
                        {item.estimated_arrival_minutes} min
                    </Text>
                </View>

                <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                        <Image source={icons.dollar} className="w-4 h-4 mr-2" />
                        <Text className="text-gray-600">Estimate</Text>
                    </View>
                    <Text className="font-bold text-green-600">
                        {formatPrice(item.estimated_price)}
                    </Text>
                </View>
            </View>

            {/* AI Reasons */}
            <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    🤖 Why AI recommends this driver:
                </Text>
                {item.reasons.slice(0, 3).map((reason, index) => (
                    <Text key={index} className="text-sm text-gray-600 mb-1">
                        • {reason}
                    </Text>
                ))}
            </View>

            {/* AI Score */}
            <View className="mt-3 pt-3 border-t border-gray-200">
                <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-gray-600">
                        AI Compatibility Score
                    </Text>
                    <View className="flex-row items-center">
                        <View className="bg-gray-200 rounded-full h-2 w-20 mr-2">
                            <View
                                className={`h-2 rounded-full ${getScoreColor(item.score)}`}
                                style={{ width: `${item.score}%` }}
                            />
                        </View>
                        <Text className="font-bold text-gray-800">
                            {item.score}/100
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center py-8">
                <ActivityIndicator size="large" color="#0066CC" />
                <Text className="text-gray-600 mt-4">
                    🤖 AI is finding the best drivers for you...
                </Text>
            </View>
        )
    }

    if (error) {
        return (
            <View className="flex-1 justify-center items-center py-8">
                <Text className="text-red-500 text-center mb-4">{error}</Text>
                <TouchableOpacity
                    className="bg-blue-500 px-6 py-3 rounded-lg"
                    onPress={fetchSuggestions}
                >
                    <Text className="text-white font-semibold">Try Again</Text>
                </TouchableOpacity>
            </View>
        )
    }

    if (suggestions.length === 0) {
        return (
            <View className="flex-1 justify-center items-center py-8">
                <Text className="text-gray-600 text-center">
                    No suitable drivers found for your requirements
                </Text>
                <TouchableOpacity
                    className="bg-blue-500 px-6 py-3 rounded-lg mt-4"
                    onPress={fetchSuggestions}
                >
                    <Text className="text-white font-semibold">Refresh</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View className="flex-1">
            <View className="bg-blue-50 p-4 mb-4 rounded-lg">
                <Text className="text-blue-800 font-semibold mb-1">
                    🤖 AI Driver Suggestions
                </Text>
                <Text className="text-blue-600 text-sm">
                    Our AI analyzed {suggestions.length} drivers and ranked them
                    based on your preferences, location, and trip requirements.
                </Text>
            </View>

            <FlatList
                data={suggestions}
                renderItem={renderDriverCard}
                keyExtractor={(item) => item.driver.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    )
}

export default AIDriverSuggestions
