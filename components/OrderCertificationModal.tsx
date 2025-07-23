import React, { useState } from 'react'
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import * as ImagePicker from 'expo-image-picker'
import { useUploadImages } from '@/lib/query/hooks'

interface OrderCertificationModalProps {
    visible: boolean
    onClose: () => void
    onConfirm: (imageUrls: string[]) => void
    orderDescription: string
    isLoading?: boolean
}

export const OrderCertificationModal: React.FC<OrderCertificationModalProps> = ({
    visible,
    onClose,
    onConfirm,
    orderDescription,
    isLoading = false
}) => {
    const [capturedImages, setCapturedImages] = useState<string[]>([])
    
    // Upload images mutation
    const uploadImagesMutation = useUploadImages({
        onSuccess: (imageUrls) => {
            console.log('✅ Images uploaded successfully, URLs:', imageUrls)
            onConfirm(imageUrls)
        },
        onError: (error) => {
            console.error('❌ Image upload failed:', error)
            Alert.alert(
                'Upload Failed',
                'Failed to upload images. Please check your connection and try again.',
                [{ text: 'OK' }]
            )
        }
    })

    const resetState = () => {
        setCapturedImages([])
    }

    const handleClose = () => {
        resetState()
        onClose()
    }

    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
            Alert.alert(
                'Camera Permission Required',
                'Please allow camera access to take photos for order verification.',
                [{ text: 'OK' }]
            )
            return false
        }
        return true
    }

    const captureImage = async () => {
        if (capturedImages.length >= 2) {
            Alert.alert('Limit Reached', 'Maximum 2 photos allowed for verification.')
            return
        }

        const hasPermission = await requestCameraPermission()
        if (!hasPermission) return

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                base64: false
            })

            if (!result.canceled && result.assets[0]) {
                setCapturedImages([...capturedImages, result.assets[0].uri])
            }
        } catch (error) {
            console.error('Error capturing image:', error)
            Alert.alert('Error', 'Failed to capture image. Please try again.')
        }
    }

    const removeImage = (index: number) => {
        const newImages = capturedImages.filter((_, i) => i !== index)
        setCapturedImages(newImages)
    }

    const handleConfirm = () => {
        if (capturedImages.length === 0) {
            Alert.alert('No Photos', 'Please take at least one photo to verify the package.')
            return
        }
        
        // Upload images first
        console.log('📤 Starting image upload process...')
        uploadImagesMutation.mutate(capturedImages)
    }
    
    const isProcessing = isLoading || uploadImagesMutation.isPending

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View className="flex-1 bg-gray-50">
                {/* Header */}
                <View className="bg-white px-6 py-4 border-b border-gray-200">
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity onPress={handleClose} disabled={isProcessing}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text className="text-lg font-JakartaBold text-gray-900">
                            Package Verification
                        </Text>
                        <View className="w-6" />
                    </View>
                </View>

                <ScrollView className="flex-1 px-6 py-6">
                    {/* Instructions */}
                    <View className="bg-blue-50 rounded-xl p-4 mb-6">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="camera" size={20} color="#2563eb" />
                            <Text className="text-blue-900 font-JakartaBold ml-2">
                                Photo Verification Required
                            </Text>
                        </View>
                        <Text className="text-blue-800 text-sm leading-5">
                            Take 1-2 clear photos of the package to verify its condition before storing. 
                            This helps protect both you and the customer.
                        </Text>
                    </View>

                    {/* Package Info */}
                    <View className="bg-white rounded-xl p-4 mb-6">
                        <Text className="text-gray-900 font-JakartaBold mb-2">Package Details:</Text>
                        <Text className="text-gray-700 text-sm leading-5">
                            {orderDescription || 'No description provided'}
                        </Text>
                    </View>

                    {/* Photo Section */}
                    <View className="bg-white rounded-xl p-4 mb-6">
                        <Text className="text-gray-900 font-JakartaBold mb-4">
                            Photos ({capturedImages.length}/2)
                        </Text>

                        {/* Captured Images */}
                        {capturedImages.length > 0 && (
                            <View className="mb-4">
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {capturedImages.map((uri, index) => (
                                        <View key={index} className="mr-3 relative">
                                            <Image
                                                source={{ uri }}
                                                className="w-24 h-24 rounded-lg"
                                                resizeMode="cover"
                                            />
                                            <TouchableOpacity
                                                onPress={() => removeImage(index)}
                                                className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                                            >
                                                <Ionicons name="close" size={12} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Camera Button */}
                        <TouchableOpacity
                            onPress={captureImage}
                            disabled={capturedImages.length >= 2 || isProcessing}
                            className={`border-2 border-dashed rounded-xl py-8 items-center ${
                                capturedImages.length >= 2 
                                    ? 'border-gray-300 bg-gray-50' 
                                    : 'border-blue-300 bg-blue-50'
                            }`}
                        >
                            <Ionicons 
                                name="camera" 
                                size={32} 
                                color={capturedImages.length >= 2 ? "#9ca3af" : "#2563eb"} 
                            />
                            <Text className={`mt-2 font-JakartaBold ${
                                capturedImages.length >= 2 ? 'text-gray-500' : 'text-blue-600'
                            }`}>
                                {capturedImages.length >= 2 ? 'Maximum 2 photos' : 'Take Photo'}
                            </Text>
                            <Text className={`text-sm ${
                                capturedImages.length >= 2 ? 'text-gray-400' : 'text-blue-500'
                            }`}>
                                {capturedImages.length >= 2 ? 'Limit reached' : 'Tap to open camera'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Action Buttons */}
                <View className="bg-white px-6 py-4 border-t border-gray-200">
                    <View className="flex-row space-x-3">
                        <TouchableOpacity
                            onPress={handleClose}
                            disabled={isProcessing}
                            className="flex-1 bg-gray-100 rounded-xl py-4 items-center"
                        >
                            <Text className="text-gray-700 font-JakartaBold">Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            onPress={handleConfirm}
                            disabled={capturedImages.length === 0 || isProcessing}
                            className={`flex-1 rounded-xl py-4 items-center ${
                                capturedImages.length === 0 || isProcessing
                                    ? 'bg-gray-300'
                                    : 'bg-green-600'
                            }`}
                        >
                            <Text className={`font-JakartaBold ${
                                capturedImages.length === 0 || isProcessing
                                    ? 'text-gray-500'
                                    : 'text-white'
                            }`}>
                                {isProcessing ? 'Uploading...' : 'Confirm & Store Package'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}