import { router } from 'expo-router'
import React from 'react'
import { StatusBar, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'

interface DetailHeaderProps {
    title: string
    subtitle?: string
    onBackPress?: () => void
    showBackButton?: boolean
    rightComponent?: React.ReactNode
}

const DetailHeader: React.FC<DetailHeaderProps> = ({
    title,
    subtitle,
    onBackPress,
    showBackButton = true,
    rightComponent
}) => {
    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress()
        } else {
            try {
                if (router.canGoBack()) {
                    router.back()
                } else {
                    router.push('/(root)/(tabs)/orders')
                }
            } catch {
                router.push('/(root)/(tabs)/orders')
            }
        }
    }

    return (
        <View className="bg-white">
            <StatusBar backgroundColor="white" barStyle="dark-content" />
            <View 
                className="bg-white"
                style={{
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 2,
                }}
            >
                <View className="px-6 py-4">
                    <View className="flex-row items-center justify-between">
                        {showBackButton ? (
                            <TouchableOpacity
                                onPress={handleBackPress}
                                className="bg-gray-50 rounded-xl p-3 border border-gray-200"
                                style={{ 
                                    shadowColor: '#000', 
                                    shadowOffset: { width: 0, height: 1 }, 
                                    shadowOpacity: 0.05, 
                                    shadowRadius: 2,
                                    elevation: 2
                                }}
                            >
                                <Ionicons name="chevron-back" size={18} color="#374151" />
                            </TouchableOpacity>
                        ) : (
                            <View className="w-12" />
                        )}
                        
                        <View className="items-center flex-1 mx-4">
                            <Text className="text-lg font-JakartaBold text-gray-900">
                                {title}
                            </Text>
                            {subtitle ? (
                                <View className="mt-1 bg-blue-50 px-3 py-1 rounded-full">
                                    <Text className="text-xs font-JakartaMedium text-blue-700">
                                        {subtitle}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                        
                        {rightComponent ? (
                            <View className="w-12 items-end">
                                {rightComponent}
                            </View>
                        ) : (
                            <View className="w-12" />
                        )}
                    </View>
                </View>
            </View>
        </View>
    )
}

export default DetailHeader
