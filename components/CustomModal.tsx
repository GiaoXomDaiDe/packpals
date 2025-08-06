import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { ReactNativeModal } from 'react-native-modal'
import Ionicons from 'react-native-vector-icons/Ionicons'

type ModalType = 'info' | 'success' | 'error'

interface CustomModalProps {
    isVisible: boolean
    type: ModalType
    title: string
    message: string
    buttonText?: string
    onConfirm: () => void
    onBackdropPress?: () => void
    onBackButtonPress?: () => void
    // Override props cho customization nâng cao
    customIcon?: string
    customIconColor?: string
    customIconBackgroundColor?: string
    customButtonColor?: string
}

const CustomModal = ({
    isVisible,
    type,
    title,
    message,
    buttonText,
    onConfirm,
    onBackdropPress,
    onBackButtonPress,
    customIcon,
    customIconColor,
    customIconBackgroundColor,
    customButtonColor
}: CustomModalProps) => {
    // Default configurations cho từng type
    const getTypeConfig = (modalType: ModalType) => {
        switch (modalType) {
            case 'success':
                return {
                    icon: 'checkmark-circle',
                    iconColor: '#10b981',
                    iconBackgroundColor: '#10b981',
                    buttonColor: 'bg-green-600',
                    defaultButtonText: 'Đồng ý'
                }
            case 'error':
                return {
                    icon: 'close-circle',
                    iconColor: '#ef4444',
                    iconBackgroundColor: '#ef4444',
                    buttonColor: 'bg-red-600',
                    defaultButtonText: 'Đóng'
                }
            case 'info':
                return {
                    icon: 'information-circle',
                    iconColor: '#3b82f6',
                    iconBackgroundColor: '#3b82f6',
                    buttonColor: 'bg-blue-600',
                    defaultButtonText: 'Đồng ý'
                }
            default:
                return {
                    icon: 'information-circle',
                    iconColor: '#3b82f6',
                    iconBackgroundColor: '#3b82f6',
                    buttonColor: 'bg-blue-600',
                    defaultButtonText: 'Đồng ý'
                }
        }
    }

    const config = getTypeConfig(type)
    
    // Sử dụng custom props nếu có, không thì dùng default từ type
    const finalIcon = customIcon || config.icon
    const finalIconColor = customIconColor || config.iconColor
    const finalIconBackgroundColor = customIconBackgroundColor || config.iconBackgroundColor
    const finalButtonText = buttonText || config.defaultButtonText
    const finalButtonColor = customButtonColor || config.buttonColor

    const handleBackdropPress = () => {
        if (onBackdropPress) {
            onBackdropPress()
        }
        // Info và Success: không đóng khi click backdrop (cần confirm)
        // Error: có thể đóng bằng backdrop
        else if (type === 'error') {
            onConfirm()
        }
    }

    const handleBackButtonPress = () => {
        if (onBackButtonPress) {
            onBackButtonPress()
        }
        // Tương tự backdrop
        else if (type === 'error') {
            onConfirm()
        }
    }

    return (
        <ReactNativeModal 
            isVisible={isVisible}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            statusBarTranslucent={true}
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
                        style={{ backgroundColor: `${finalIconBackgroundColor}20` }}
                    >
                        <Ionicons name={finalIcon} size={40} color={finalIconColor} />
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
                        className={`${finalButtonColor} py-4 px-8 rounded-lg w-full`}
                    >
                        <Text className="text-white font-JakartaBold text-center text-base">
                            {finalButtonText}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ReactNativeModal>
    )
}

export default CustomModal

// Export types cho convenience
export type { CustomModalProps, ModalType }

