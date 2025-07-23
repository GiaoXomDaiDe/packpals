import { useUserStore } from '@/store'
import { router } from 'expo-router'
import { useState } from 'react'
import {
    Alert,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import CustomButton from '@/components/CustomButton'
import { icons } from '@/constants'
import { storageAPI } from '@/lib/storageAPI'
import { useLocationStore } from '@/store'

const AddStorage = () => {
    const { user } = useUserStore()
    const { userAddress } = useLocationStore()
    
    const [formData, setFormData] = useState({
        description: '',
        address: userAddress || '',
        pricePerDay: '',
        specialInstructions: ''
    })
    const [isLoading, setIsLoading] = useState(false)

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const validateForm = () => {
        if (!formData.description.trim()) {
            Alert.alert('Error', 'Please enter a storage description')
            return false
        }
        if (!formData.address.trim()) {
            Alert.alert('Error', 'Please enter the storage address')
            return false
        }
        if (!formData.pricePerDay.trim() || isNaN(Number(formData.pricePerDay))) {
            Alert.alert('Error', 'Please enter a valid price per day')
            return false
        }
        if (Number(formData.pricePerDay) <= 0) {
            Alert.alert('Error', 'Price must be greater than 0')
            return false
        }
        return true
    }

    const handleSubmit = async () => {
        if (!validateForm()) return

        setIsLoading(true)
        try {
            // In a real app, you'd get the keeper ID from user data
            const storageData = {
                description: formData.description,
                address: formData.address,
                keeperId: user?.id || '', // This would need to be the actual keeper ID
                pricePerDay: Number(formData.pricePerDay),
                specialInstructions: formData.specialInstructions
            }

            const response = await storageAPI.createStorage(storageData)
            
            if (response.success) {
                Alert.alert(
                    'Success',
                    'Storage location added successfully!',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.back()
                        }
                    ]
                )
            } else {
                Alert.alert('Error', 'Failed to add storage location')
            }
        } catch (error) {
            console.error('Error adding storage:', error)
            Alert.alert('Error', 'An error occurred while adding the storage location')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <SafeAreaView className="bg-general-500 flex-1">
            <ScrollView className="px-5 py-3">
                <View className="flex flex-row items-center justify-between mb-5">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Image
                            source={icons.backArrow}
                            className="w-6 h-6"
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                    <Text className="text-xl font-JakartaExtraBold">
                        Add Storage Location
                    </Text>
                    <View className="w-6" />
                </View>

                {/* Storage Information */}
                <View className="bg-white rounded-lg p-4 mb-5">
                    <Text className="text-lg font-JakartaSemiBold mb-4">
                        Storage Information
                    </Text>

                    <View className="mb-4">
                        <Text className="text-sm font-JakartaSemiBold mb-2 text-general-800">
                            Storage Name/Description *
                        </Text>
                        <TextInput
                            className="border border-general-700 rounded-lg p-3 text-sm font-JakartaRegular"
                            placeholder="e.g., Secure garage storage, Climate-controlled room"
                            value={formData.description}
                            onChangeText={(value) => handleInputChange('description', value)}
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm font-JakartaSemiBold mb-2 text-general-800">
                            Address *
                        </Text>
                        <TextInput
                            className="border border-general-700 rounded-lg p-3 text-sm font-JakartaRegular"
                            placeholder="Full storage address"
                            value={formData.address}
                            onChangeText={(value) => handleInputChange('address', value)}
                            multiline
                            numberOfLines={2}
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm font-JakartaSemiBold mb-2 text-general-800">
                            Price per Day ($) *
                        </Text>
                        <TextInput
                            className="border border-general-700 rounded-lg p-3 text-sm font-JakartaRegular"
                            placeholder="e.g., 10.00"
                            value={formData.pricePerDay}
                            onChangeText={(value) => handleInputChange('pricePerDay', value)}
                            keyboardType="numeric"
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm font-JakartaSemiBold mb-2 text-general-800">
                            Special Instructions (Optional)
                        </Text>
                        <TextInput
                            className="border border-general-700 rounded-lg p-3 text-sm font-JakartaRegular"
                            placeholder="Access instructions, restrictions, contact info, etc."
                            value={formData.specialInstructions}
                            onChangeText={(value) => handleInputChange('specialInstructions', value)}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                {/* Guidelines */}
                <View className="bg-blue-50 rounded-lg p-4 mb-5">
                    <Text className="text-md font-JakartaSemiBold mb-3 text-blue-800">
                        📋 Storage Guidelines
                    </Text>
                    <Text className="text-sm font-JakartaRegular text-blue-700 mb-2">
                        • Ensure your storage location is secure and accessible
                    </Text>
                    <Text className="text-sm font-JakartaRegular text-blue-700 mb-2">
                        • Be available to receive packages when renters arrive
                    </Text>
                    <Text className="text-sm font-JakartaRegular text-blue-700 mb-2">
                        • Provide clear access instructions
                    </Text>
                    <Text className="text-sm font-JakartaRegular text-blue-700 mb-2">
                        • Take photos of packages upon receipt
                    </Text>
                    <Text className="text-sm font-JakartaRegular text-blue-700">
                        • Keep packages safe and dry
                    </Text>
                </View>

                {/* Pricing Information */}
                <View className="bg-green-50 rounded-lg p-4 mb-5">
                    <Text className="text-md font-JakartaSemiBold mb-3 text-green-800">
                        💰 Pricing Tips
                    </Text>
                    <Text className="text-sm font-JakartaRegular text-green-700 mb-2">
                        • Average storage price: $5-15 per day
                    </Text>
                    <Text className="text-sm font-JakartaRegular text-green-700 mb-2">
                        • Secure locations can charge more
                    </Text>
                    <Text className="text-sm font-JakartaRegular text-green-700 mb-2">
                        • Climate-controlled storage is premium
                    </Text>
                    <Text className="text-sm font-JakartaRegular text-green-700">
                        • Consider location convenience
                    </Text>
                </View>

                {/* Submit Button */}
                <CustomButton
                    title="Add Storage Location"
                    onPress={handleSubmit}
                    isLoading={isLoading}
                    className="mb-10"
                />
            </ScrollView>
        </SafeAreaView>
    )
}

export default AddStorage