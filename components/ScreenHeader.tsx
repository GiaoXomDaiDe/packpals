import React from 'react'
import { ActivityIndicator, StatusBar, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'

interface ScreenHeaderProps {
    title: string
    showRefreshIndicator?: boolean
    actionIcon?: string
    onActionPress?: () => void
    showActionButton?: boolean
    actionButtonColor?: string
    subtitle?: string
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
    title,
    showRefreshIndicator = false,
    actionIcon = 'add',
    onActionPress,
    showActionButton = true,
    actionButtonColor = '#3b82f6',
    subtitle
}) => {
    return (
        <View className="bg-white">
            <StatusBar backgroundColor="white" barStyle="dark-content" />
            <View 
                className="bg-white px-6 py-6"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 2,
                }}
            >
                <View className="flex-row items-center justify-between">
                <View className="flex-1">
                    <Text className="text-2xl font-JakartaBold text-gray-900">
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text className="text-sm text-gray-500 font-JakartaMedium mt-1">
                            {subtitle}
                        </Text>
                    ) : null}
                </View>
                <View className="flex-row items-center">
                    {/* Smart refresh indicator */}
                    {showRefreshIndicator ? (
                        <View className="mr-3">
                            <ActivityIndicator size="small" color={actionButtonColor} />
                        </View>
                    ) : null}
                    {showActionButton && onActionPress ? (
                        <TouchableOpacity
                            onPress={onActionPress}
                            className="rounded-full p-2"
                            style={{ backgroundColor: actionButtonColor }}
                        >
                            <Ionicons name={actionIcon as any} size={20} color="white" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        </View>
        </View>
    )
}

export default ScreenHeader
