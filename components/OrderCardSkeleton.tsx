import React from 'react'
import { View } from 'react-native'

interface OrderCardSkeletonProps {
    count?: number
}

const OrderCardSkeleton: React.FC<OrderCardSkeletonProps> = ({ count = 3 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <View
                    key={index}
                    className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 2,
                    }}
                >
                    {/* Header Skeleton */}
                    <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center flex-1">
                            <View className="bg-gray-200 rounded-lg p-2 mr-3 w-10 h-10" />
                            <View className="flex-1">
                                <View className="bg-gray-200 rounded h-4 w-24 mb-2" />
                                <View className="bg-gray-200 rounded h-3 w-16" />
                            </View>
                        </View>
                        <View className="bg-gray-200 rounded-full px-3 py-1 w-20 h-6" />
                    </View>
                    
                    {/* Description Skeleton */}
                    <View className="bg-gray-100 rounded-lg p-3 mb-3">
                        <View className="bg-gray-200 rounded h-3 w-full mb-1" />
                        <View className="bg-gray-200 rounded h-3 w-3/4" />
                    </View>
                    
                    {/* Bottom Row Skeleton */}
                    <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                            <View className="bg-gray-200 rounded h-5 w-20 mb-1" />
                            <View className="bg-gray-200 rounded h-3 w-16" />
                        </View>
                        <View className="mr-3">
                            <View className="bg-gray-200 rounded-md px-2 py-1 w-12 h-6" />
                        </View>
                        <View className="bg-gray-200 rounded w-5 h-5" />
                    </View>
                </View>
            ))}
        </>
    )
}

export default OrderCardSkeleton
