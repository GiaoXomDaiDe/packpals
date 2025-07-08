import { router } from 'expo-router'
import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { icons } from '@/constants'
import { formatTime } from '@/lib/utils'
import { AIDriverSuggestion } from '@/lib/hooks/useAIDriverSuggestions'

interface AIDriverCardProps {
    suggestion: AIDriverSuggestion
    selected: number
    setSelected: () => void
    showAIInsights?: boolean
}

const AIDriverCard = ({ 
    suggestion, 
    selected, 
    setSelected, 
    showAIInsights = true 
}: AIDriverCardProps) => {
    const { driver, score, distance_km, estimated_arrival_minutes, estimated_price, reasons } = suggestion
    
    const handleViewReviews = () => {
        router.push({
            pathname: '/(root)/driver-reviews',
            params: {
                driverId: driver.id,
                driverName: `${driver.first_name} ${driver.last_name}`,
                driverImage: driver.profile_image_url,
            },
        })
    }

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600'
        if (score >= 75) return 'text-blue-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-gray-600'
    }

    const getScoreBadgeColor = (score: number) => {
        if (score >= 90) return 'bg-green-100 border-green-200'
        if (score >= 75) return 'bg-blue-100 border-blue-200'
        if (score >= 60) return 'bg-yellow-100 border-yellow-200'
        return 'bg-gray-100 border-gray-200'
    }

    return (
        <TouchableOpacity
            onPress={setSelected}
            className={`${
                selected === driver.id ? 'bg-primary-100 border-primary-300' : 'bg-white'
            } flex flex-col border rounded-xl p-4 mb-3 ${showAIInsights ? 'min-h-[140px]' : ''}`}
        >
            {/* Header with AI Score */}
            <View className="flex flex-row items-center justify-between mb-3">
                <View className="flex flex-row items-center">
                    <Image
                        source={{ uri: driver.profile_image_url }}
                        className="w-12 h-12 rounded-full"
                    />
                    <View className="ml-3">
                        <Text className="text-lg font-JakartaSemiBold">
                            {driver.first_name} {driver.last_name}
                        </Text>
                        <View className="flex flex-row items-center">
                            <Image source={icons.star} className="w-3 h-3" />
                            <Text className="text-sm font-JakartaRegular ml-1">
                                {driver.rating.toFixed(1)}
                            </Text>
                            <Text className="text-xs text-gray-500 ml-2">
                                {distance_km}km away
                            </Text>
                        </View>
                    </View>
                </View>

                {showAIInsights && (
                    <View className={`px-2 py-1 rounded-full border ${getScoreBadgeColor(score)}`}>
                        <Text className={`text-xs font-JakartaBold ${getScoreColor(score)}`}>
                            AI: {score}%
                        </Text>
                    </View>
                )}
            </View>

            {/* Ride Details */}
            <View className="flex flex-row items-center justify-between mb-2">
                <View className="flex flex-row items-center">
                    <Image source={icons.dollar} className="w-4 h-4" />
                    <Text className="text-sm font-JakartaRegular ml-1">
                        {estimated_price.toLocaleString()} VND
                    </Text>
                </View>
                <Text className="text-sm text-gray-400">|</Text>
                <Text className="text-sm font-JakartaRegular text-gray-700">
                    {formatTime(estimated_arrival_minutes)} arrival
                </Text>
                <Text className="text-sm text-gray-400">|</Text>
                <Text className="text-sm font-JakartaRegular text-gray-700">
                    {driver.car_seats} seats
                </Text>
            </View>

            {/* AI Insights */}
            {showAIInsights && reasons.length > 0 && (
                <View className="bg-gray-50 rounded-lg p-2 mb-2">
                    <Text className="text-xs font-JakartaMedium text-gray-700 mb-1">
                        🤖 AI Insights:
                    </Text>
                    {reasons.slice(0, 2).map((reason, index) => (
                        <Text key={index} className="text-xs text-gray-600">
                            • {reason}
                        </Text>
                    ))}
                    {reasons.length > 2 && (
                        <Text className="text-xs text-gray-500 mt-1">
                            +{reasons.length - 2} more reasons
                        </Text>
                    )}
                </View>
            )}

            {/* Action Buttons */}
            <View className="flex flex-row items-center justify-between">
                <TouchableOpacity
                    onPress={handleViewReviews}
                    className="bg-primary-100 px-3 py-1.5 rounded-lg"
                >
                    <View className="flex-row items-center">
                        <Ionicons name="star-outline" size={12} color="#0286FF" />
                        <Text className="text-xs text-primary-500 ml-1 font-JakartaMedium">
                            Reviews
                        </Text>
                    </View>
                </TouchableOpacity>

                <Image
                    source={{ uri: driver.car_image_url }}
                    className="h-10 w-10"
                    resizeMode="contain"
                />
            </View>
        </TouchableOpacity>
    )
}

export default AIDriverCard