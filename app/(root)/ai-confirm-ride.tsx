import { router } from 'expo-router'
import React, { useState } from 'react'
import { 
    ActivityIndicator, 
    FlatList, 
    Switch, 
    Text, 
    TouchableOpacity, 
    View 
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'

import CustomButton from '@/components/CustomButton'
import AIDriverCard from '@/components/AIDriverCard'
import DriverCard from '@/components/DriverCard'
import RideLayout from '@/components/RideLayout'
import { useAIDriverSuggestionsSimple } from '@/lib/hooks/useAIDriverSuggestions'
import { useDriverStore, useLocationStore } from '@/store'
import { MarkerData } from '@/types/type'

const AIConfirmRide = () => {
    const { drivers, selectedDriver, setSelectedDriver } = useDriverStore()
    const { destinationLatitude, destinationLongitude } = useLocationStore()
    const [useAIMode, setUseAIMode] = useState(true)
    const [passengerCount, setPassengerCount] = useState(1)
    
    const { 
        suggestions, 
        userPreferences, 
        personalized, 
        isLoading, 
        error,
        refetch 
    } = useAIDriverSuggestionsSimple(passengerCount)

    // Convert AI suggestions to MarkerData format for compatibility
    const convertedSuggestions: MarkerData[] = suggestions.map(suggestion => ({
        id: suggestion.driver.id,
        latitude: suggestion.driver.current_latitude || 0,
        longitude: suggestion.driver.current_longitude || 0,
        title: `${suggestion.driver.first_name} ${suggestion.driver.last_name}`,
        profile_image_url: suggestion.driver.profile_image_url || '',
        car_image_url: suggestion.driver.car_image_url || '',
        car_seats: suggestion.driver.car_seats,
        rating: suggestion.driver.rating,
        first_name: suggestion.driver.first_name,
        last_name: suggestion.driver.last_name,
        time: suggestion.estimated_arrival_minutes,
        price: (suggestion.estimated_price / 1000).toString(), // Convert to thousands for display
    }))

    const displayDrivers = useAIMode ? convertedSuggestions : drivers

    const handlePassengerChange = (increment: boolean) => {
        setPassengerCount(prev => {
            const newCount = increment ? prev + 1 : prev - 1
            return Math.max(1, Math.min(8, newCount))
        })
    }

    const renderHeader = () => (
        <View className="px-5 pb-4">
            {/* AI Mode Toggle */}
            <View className="flex-row items-center justify-between bg-white p-4 rounded-xl mb-4 shadow-sm">
                <View className="flex-row items-center">
                    <Ionicons 
                        name={useAIMode ? "sparkles" : "list"} 
                        size={20} 
                        color={useAIMode ? "#0286FF" : "#6B7280"} 
                    />
                    <Text className="text-base font-JakartaMedium ml-2">
                        {useAIMode ? '🤖 AI Recommendations' : '📋 All Drivers'}
                    </Text>
                    {personalized && useAIMode && (
                        <View className="bg-green-100 px-2 py-1 rounded ml-2">
                            <Text className="text-xs text-green-700 font-JakartaMedium">
                                Personalized
                            </Text>
                        </View>
                    )}
                </View>
                <Switch
                    value={useAIMode}
                    onValueChange={setUseAIMode}
                    trackColor={{ false: "#E5E7EB", true: "#0286FF" }}
                    thumbColor={useAIMode ? "#FFFFFF" : "#9CA3AF"}
                />
            </View>

            {/* Passenger Count Selector */}
            <View className="flex-row items-center justify-between bg-white p-4 rounded-xl mb-4 shadow-sm">
                <Text className="text-base font-JakartaMedium">Passengers</Text>
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => handlePassengerChange(false)}
                        className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center"
                        disabled={passengerCount <= 1}
                    >
                        <Ionicons 
                            name="remove" 
                            size={16} 
                            color={passengerCount <= 1 ? "#9CA3AF" : "#374151"} 
                        />
                    </TouchableOpacity>
                    <Text className="text-lg font-JakartaBold mx-4">{passengerCount}</Text>
                    <TouchableOpacity
                        onPress={() => handlePassengerChange(true)}
                        className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center"
                        disabled={passengerCount >= 8}
                    >
                        <Ionicons 
                            name="add" 
                            size={16} 
                            color={passengerCount >= 8 ? "#9CA3AF" : "#374151"} 
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* AI Insights */}
            {useAIMode && userPreferences && (
                <View className="bg-blue-50 p-4 rounded-xl mb-4">
                    <View className="flex-row items-center mb-2">
                        <Ionicons name="information-circle" size={16} color="#0286FF" />
                        <Text className="text-sm font-JakartaMedium text-blue-700 ml-1">
                            Your Preferences
                        </Text>
                    </View>
                    <Text className="text-xs text-blue-600">
                        Preferred rating: {userPreferences.preferredRatingRange[0].toFixed(1)}+ ⭐ | 
                        Car size: {userPreferences.preferredCarSize} seats | 
                        Price sensitivity: {(userPreferences.priceSensitivity * 100).toFixed(0)}%
                    </Text>
                </View>
            )}

            {/* Loading/Error States */}
            {useAIMode && isLoading && (
                <View className="flex-row items-center justify-center py-4">
                    <ActivityIndicator size="small" color="#0286FF" />
                    <Text className="text-gray-600 ml-2">Loading AI recommendations...</Text>
                </View>
            )}

            {useAIMode && error && (
                <View className="bg-red-50 p-4 rounded-xl mb-4">
                    <View className="flex-row items-center">
                        <Ionicons name="warning" size={16} color="#DC2626" />
                        <Text className="text-sm text-red-700 ml-2">{error}</Text>
                        <TouchableOpacity onPress={refetch} className="ml-auto">
                            <Text className="text-sm text-red-600 font-JakartaMedium">Retry</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <Text className="text-lg font-JakartaBold">
                {useAIMode ? `🎯 Top ${displayDrivers.length} Matches` : `📋 ${displayDrivers.length} Available Drivers`}
            </Text>
        </View>
    )

    return (
        <RideLayout title={'Choose Your Ride'} snapPoints={['70%', '90%']}>
            <FlatList
                data={displayDrivers}
                keyExtractor={(item, index) => `${useAIMode ? 'ai' : 'normal'}-${item.id}-${index}`}
                ListHeaderComponent={renderHeader}
                renderItem={({ item, index }) => {
                    if (useAIMode && suggestions[index]) {
                        return (
                            <View className="px-5">
                                <AIDriverCard
                                    suggestion={suggestions[index]}
                                    selected={selectedDriver!}
                                    setSelected={() => setSelectedDriver(item.id!)}
                                    showAIInsights={true}
                                />
                            </View>
                        )
                    } else {
                        return (
                            <View className="px-5 mb-3">
                                <DriverCard
                                    item={item}
                                    selected={selectedDriver!}
                                    setSelected={() => setSelectedDriver(item.id!)}
                                />
                            </View>
                        )
                    }
                }}
                ListFooterComponent={() => (
                    <View className="px-5 mt-6 mb-10">
                        <CustomButton
                            title={useAIMode ? "Book AI Recommended Ride" : "Select Ride"}
                            onPress={() => {
                                if (!selectedDriver) {
                                    // Auto-select top AI recommendation if none selected
                                    if (useAIMode && displayDrivers.length > 0) {
                                        setSelectedDriver(displayDrivers[0].id!)
                                    }
                                }
                                router.push('/(root)/book-ride')
                            }}
                            disabled={displayDrivers.length === 0}
                            IconLeft={() => useAIMode ? (
                                <Ionicons name="sparkles" size={16} color="white" />
                            ) : null}
                        />
                        
                        {useAIMode && displayDrivers.length > 0 && !selectedDriver && (
                            <Text className="text-xs text-gray-500 text-center mt-2">
                                💡 We'll auto-select the top recommendation for you
                            </Text>
                        )}
                    </View>
                )}
                showsVerticalScrollIndicator={false}
            />
        </RideLayout>
    )
}

export default AIConfirmRide