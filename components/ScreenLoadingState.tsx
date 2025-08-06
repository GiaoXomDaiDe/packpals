import React from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

interface ScreenLoadingStateProps {
    title: string
    loadingMessage: string
    actionIcon?: string
    onActionPress?: () => void
    showActionButton?: boolean
    actionButtonColor?: string
    backgroundColor?: string
}

const ScreenLoadingState: React.FC<ScreenLoadingStateProps> = ({
    title,
    loadingMessage,
    actionIcon = 'add',
    onActionPress,
    showActionButton = true,
    actionButtonColor = '#3b82f6',
    backgroundColor = '#f9fafb'
}) => {
    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor }}>
            {/* Header */}
            <View 
                className="bg-white px-6 py-4"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 2,
                }}
            >
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-2xl font-JakartaBold text-gray-900">
                        {title}
                    </Text>
                    {showActionButton && onActionPress ? (
                        <View className="flex-row items-center">
                            <TouchableOpacity
                                onPress={onActionPress}
                                className="rounded-full p-2"
                                style={{ backgroundColor: actionButtonColor }}
                            >
                                <Ionicons name={actionIcon as any} size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>
            </View>
            
            {/* Loading Content */}
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={actionButtonColor} />
                <Text className="text-gray-600 mt-4 font-JakartaMedium text-center px-8">
                    {loadingMessage}
                </Text>
            </View>
        </SafeAreaView>
    )
}

export default ScreenLoadingState
