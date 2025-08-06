import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { ReactNativeModal } from 'react-native-modal'
import Ionicons from 'react-native-vector-icons/Ionicons'

interface ErrorModalProps {
    isVisible: boolean
    title: string
    message: string
    buttonText?: string
    onConfirm: () => void
    onBackdropPress?: () => void
    onBackButtonPress?: () => void
    iconName?: string
    iconColor?: string
    iconBackgroundColor?: string
}

const ErrorModal = ({
    isVisible,
    title,
    message,
    buttonText = 'Đóng',
    onConfirm,
    onBackdropPress,
    onBackButtonPress,
    iconName = 'close-circle',
    iconColor = '#ef4444',
    iconBackgroundColor = '#ef4444'
}: ErrorModalProps) => {
    const handleBackdropPress = () => {
        if (onBackdropPress) {
            onBackdropPress()
        }
        // Nếu không có handler, có thể đóng modal bằng backdrop
        else {
            onConfirm()
        }
    }

    const handleBackButtonPress = () => {
        if (onBackButtonPress) {
            onBackButtonPress()
        }
        // Nếu không có handler, có thể đóng modal bằng back button
        else {
            onConfirm()
        }
    }

    return (
        <ReactNativeModal 
            isVisible={isVisible}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            backdropOpacity={0.5}
            backdropColor="#000"
            onBackdropPress={handleBackdropPress}
            onBackButtonPress={handleBackButtonPress}
        >
            <View className="flex-1 justify-center px-6">
                <View className="bg-white rounded-2xl p-8 items-center">
                    {/* Icon */}
                    <View 
                        className="w-20 h-20 rounded-full items-center justify-center mb-6"
                        style={{ backgroundColor: `${iconBackgroundColor}20` }}
                    >
                        <Ionicons name={iconName} size={40} color={iconColor} />
                    </View>
                    
                    {/* Title */}
                    <Text className="text-2xl font-JakartaBold text-gray-900 text-center mb-3">
                        {title}
                    </Text>
                    
                    {/* Message */}
                    <Text className="text-gray-600 text-center mb-8 font-Jakarta leading-6">
                        {message}
                    </Text>
                    
                    {/* Button */}
                    <TouchableOpacity
                        onPress={onConfirm}
                        className="bg-red-600 py-4 px-8 rounded-lg w-full"
                    >
                        <Text className="text-white font-JakartaBold text-center text-base">
                            {buttonText}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ReactNativeModal>
    )
}

export default ErrorModal
