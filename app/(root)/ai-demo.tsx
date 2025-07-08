import React, { useState } from 'react'
import { Alert, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import AIDriverSuggestions from '@/components/AIDriverSuggestions'
import CustomButton from '@/components/CustomButton'
import InputField from '@/components/InputField'

interface DriverSuggestion {
    driver: {
        id: number
        first_name: string
        last_name: string
        rating: number
    }
    score: number
    distance_km: number
    estimated_arrival_minutes: number
    estimated_price: number
    reasons: string[]
}

const AIDemo = () => {
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [formData, setFormData] = useState({
        pickup_latitude: '10.7769', // Ho Chi Minh City default
        pickup_longitude: '106.7009',
        destination_latitude: '10.8142',
        destination_longitude: '106.6438',
        passenger_count: '2',
    })

    const handleGetSuggestions = () => {
        if (
            !formData.pickup_latitude ||
            !formData.pickup_longitude ||
            !formData.passenger_count
        ) {
            Alert.alert('Error', 'Please fill in all required fields')
            return
        }
        setShowSuggestions(true)
    }

    const handleDriverSelect = (suggestion: DriverSuggestion) => {
        Alert.alert(
            'Driver Selected',
            `You selected ${suggestion.driver.first_name} ${suggestion.driver.last_name}\n\n` +
                `Rating: ${suggestion.driver.rating}⭐\n` +
                `Distance: ${suggestion.distance_km}km\n` +
                `Arrival: ${suggestion.estimated_arrival_minutes} min\n` +
                `Price: ${suggestion.estimated_price.toLocaleString()} VND\n` +
                `AI Score: ${suggestion.score}/100`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Book Now',
                    onPress: () =>
                        Alert.alert('Success', 'Ride booked! (Demo)'),
                },
            ]
        )
    }

    const resetDemo = () => {
        setShowSuggestions(false)
        setFormData({
            pickup_latitude: '10.7769',
            pickup_longitude: '106.7009',
            destination_latitude: '10.8142',
            destination_longitude: '106.6438',
            passenger_count: '2',
        })
    }

    if (showSuggestions) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 px-5">
                    <View className="flex-row items-center justify-between py-4 border-b border-gray-200">
                        <Text className="text-2xl font-bold">
                            🤖 AI Driver Suggestions
                        </Text>
                        <CustomButton
                            title="Reset"
                            onPress={resetDemo}
                            className="bg-gray-500 px-4 py-2 h-auto"
                        />
                    </View>

                    <AIDriverSuggestions
                        pickup_latitude={parseFloat(formData.pickup_latitude)}
                        pickup_longitude={parseFloat(formData.pickup_longitude)}
                        destination_latitude={parseFloat(
                            formData.destination_latitude
                        )}
                        destination_longitude={parseFloat(
                            formData.destination_longitude
                        )}
                        passenger_count={parseInt(formData.passenger_count)}
                        onDriverSelect={handleDriverSelect}
                    />
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView className="flex-1 px-5">
                <View className="py-6">
                    <Text className="text-3xl font-bold text-center mb-2">
                        🤖 AI Driver Demo
                    </Text>
                    <Text className="text-gray-600 text-center mb-8">
                        Test our AI-powered driver suggestion system
                    </Text>

                    <View className="bg-blue-50 p-4 rounded-lg mb-6">
                        <Text className="text-blue-800 font-semibold mb-2">
                            How it works:
                        </Text>
                        <Text className="text-blue-600 text-sm mb-1">
                            • AI analyzes distance, rating, car capacity, and
                            time factors
                        </Text>
                        <Text className="text-blue-600 text-sm mb-1">
                            • Scores each driver based on your specific needs
                        </Text>
                        <Text className="text-blue-600 text-sm">
                            • Provides intelligent recommendations with
                            explanations
                        </Text>
                    </View>

                    <InputField
                        label="Pickup Latitude"
                        placeholder="10.7769"
                        value={formData.pickup_latitude}
                        onChangeText={(text) =>
                            setFormData((prev) => ({
                                ...prev,
                                pickup_latitude: text,
                            }))
                        }
                        containerStyle="mb-4"
                    />

                    <InputField
                        label="Pickup Longitude"
                        placeholder="106.7009"
                        value={formData.pickup_longitude}
                        onChangeText={(text) =>
                            setFormData((prev) => ({
                                ...prev,
                                pickup_longitude: text,
                            }))
                        }
                        containerStyle="mb-4"
                    />

                    <InputField
                        label="Destination Latitude (Optional)"
                        placeholder="10.8142"
                        value={formData.destination_latitude}
                        onChangeText={(text) =>
                            setFormData((prev) => ({
                                ...prev,
                                destination_latitude: text,
                            }))
                        }
                        containerStyle="mb-4"
                    />

                    <InputField
                        label="Destination Longitude (Optional)"
                        placeholder="106.6438"
                        value={formData.destination_longitude}
                        onChangeText={(text) =>
                            setFormData((prev) => ({
                                ...prev,
                                destination_longitude: text,
                            }))
                        }
                        containerStyle="mb-4"
                    />

                    <InputField
                        label="Number of Passengers"
                        placeholder="2"
                        value={formData.passenger_count}
                        onChangeText={(text) =>
                            setFormData((prev) => ({
                                ...prev,
                                passenger_count: text,
                            }))
                        }
                        keyboardType="numeric"
                        containerStyle="mb-6"
                    />

                    <CustomButton
                        title="🤖 Get AI Suggestions"
                        onPress={handleGetSuggestions}
                        className="bg-blue-600"
                    />

                    <View className="mt-8 p-4 bg-gray-50 rounded-lg">
                        <Text className="text-gray-700 font-semibold mb-2">
                            Demo Info:
                        </Text>
                        <Text className="text-gray-600 text-sm mb-1">
                            • Default coordinates are for Ho Chi Minh City
                        </Text>
                        <Text className="text-gray-600 text-sm mb-1">
                            • Driver locations are simulated for demo
                        </Text>
                        <Text className="text-gray-600 text-sm">
                            • Prices and times are estimates
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default AIDemo
