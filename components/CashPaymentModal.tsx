import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { ReactNativeModal } from 'react-native-modal'
import Ionicons from 'react-native-vector-icons/Ionicons'

interface CashPaymentModalProps {
    isVisible: boolean
    amount: number
    onClose: () => void
    onCallKeeper: () => void
}

const CashPaymentModal = ({
    isVisible,
    amount,
    onClose,
    onCallKeeper
}: CashPaymentModalProps) => {
    return (
        <ReactNativeModal 
            isVisible={isVisible}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            backdropOpacity={0.5}
            backdropColor="#000"
            onBackdropPress={onClose}
            onBackButtonPress={onClose}
        >
            <View className="flex-1 justify-center px-6">
                <View className="bg-white rounded-2xl p-8 items-center">
                    {/* Icon */}
                    <View className="w-20 h-20 rounded-full items-center justify-center mb-6 bg-green-100">
                        <Ionicons name="cash" size={40} color="#059669" />
                    </View>
                    
                    {/* Title */}
                    <Text className="text-2xl font-JakartaBold text-gray-900 text-center mb-3">
                        💵 Cash Payment
                    </Text>
                    
                    {/* Message */}
                    <Text className="text-gray-600 text-center mb-2 font-Jakarta leading-6">
                        You can pay in cash when picking up items.
                    </Text>
                    
                    {/* Amount */}
                    <View className="bg-green-50 rounded-lg p-3 mb-6 w-full">
                        <Text className="text-green-700 text-center font-JakartaMedium text-sm">
                            Amount to pay:
                        </Text>
                        <Text className="text-green-900 text-center font-JakartaBold text-lg">
                            {amount.toLocaleString()} VND
                        </Text>
                    </View>
                    
                    <Text className="text-gray-600 text-center mb-8 font-Jakarta leading-6">
                        Contact keeper to arrange pickup.
                    </Text>
                    
                    {/* Buttons */}
                    <View className="w-full space-y-3">
                        <TouchableOpacity
                            onPress={onCallKeeper}
                            className="bg-green-600 py-4 px-8 rounded-lg w-full"
                        >
                            <Text className="text-white font-JakartaBold text-center text-base">
                                Call Keeper
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            onPress={onClose}
                            className="bg-gray-100 py-4 px-8 rounded-lg w-full"
                        >
                            <Text className="text-gray-700 font-JakartaBold text-center text-base">
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ReactNativeModal>
    )
}

export default CashPaymentModal
