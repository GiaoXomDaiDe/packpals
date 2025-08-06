import { useCalculateFinalAmount } from '@/hooks/query';
import { OrderApiData } from '@/types/type';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import StatusBadge from './StatusBadge';

// Helper function
const formatCurrency = (amount: number) => {
    // Round up to nearest 1000 VND for cleaner display
    const roundedAmount = Math.ceil(amount / 1000) * 1000;
    return roundedAmount.toLocaleString();
};

interface OrderListItemProps {
    item: OrderApiData;
}

export const OrderListItem: React.FC<OrderListItemProps> = ({ item }) => {
    // Calculate final amount including late pickup penalties
    const { data: finalAmountData } = useCalculateFinalAmount(item.id, {
        enabled: !!item.id,
        refetchInterval: 30000, // Update every 30 seconds
        staleTime: 10000, // Consider data stale after 10 seconds
    });

    // Use calculated final amount if available, otherwise fall back to original amount
    const finalAmountResponse = finalAmountData as any;
    const displayAmount = finalAmountResponse?.data?.finalAmount || item.totalAmount || 0;
    const hasLateFee = finalAmountResponse?.data?.finalAmount 
        && finalAmountResponse.data.finalAmount > (item.totalAmount || 0);

    return (
        <TouchableOpacity
            onPress={() => router.push({
                pathname: '/(root)/orderdetails/[id]',
                params: { id: item.id.toString() }
            })}
            className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
            }}
        >
            {/* Header Row */}
            <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1">
                    <View className="bg-blue-500 rounded-lg p-2 mr-3">
                        <Ionicons name="receipt-outline" size={18} color="white" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-base font-JakartaBold text-gray-900" numberOfLines={1}>
                            #{item.id ? item.id.toString().slice(-8) : 'N/A'}
                        </Text>
                        <Text className="text-xs text-gray-500 font-Jakarta">
                            {(() => {
                                const dateStr = item.orderDate || item.createdAt
                                if (!dateStr) return 'No date'
                                const date = new Date(dateStr)
                                return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric'
                                })
                            })()}
                        </Text>
                    </View>
                </View>
                
                <StatusBadge 
                    status={item.status || ''} 
                    size="small"
                />
            </View>
            
            {/* Mô tả gói hàng */}
            <View className="bg-gray-50 rounded-lg p-3 mb-3">
                <Text className="text-gray-700 text-sm font-Jakarta" numberOfLines={2}>
                    {item.packageDescription || 'No description'}
                </Text>
            </View>
            
            {/* Bottom Row */}
            <View className="flex-row justify-between items-center">
                {/* Số tiền */}
                <View className="flex-1">
                    <View className="flex-row items-center">
                        <Text className={`text-lg font-JakartaBold ${hasLateFee ? 'text-orange-600' : 'text-blue-600'}`}>
                            {(displayAmount && !isNaN(Number(displayAmount))) 
                                ? formatCurrency(Number(displayAmount)) + ' ₫'
                                : '0 ₫'}
                        </Text>
                        {hasLateFee && (
                            <View className="ml-2 bg-orange-100 px-2 py-1 rounded-md">
                                <Text className="text-orange-700 text-xs font-JakartaBold">
                                    +Late Fee
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text className="text-xs text-gray-500 font-Jakarta">
                        {hasLateFee ? 'Current amount (with late fee)' : 'Total amount'}
                    </Text>
                    {hasLateFee && (
                        <Text className="text-xs text-gray-400 font-Jakarta line-through">
                            Original: {formatCurrency(Number(item.totalAmount || 0))} ₫
                        </Text>
                    )}
                </View>
                
                {/* Trạng thái thanh toán */}
                <View className="mr-3">
                    <View className={`px-2 py-1 rounded-md ${item.isPaid ? 'bg-green-100' : 'bg-orange-100'}`}>
                        <Text className={`text-xs font-JakartaBold ${item.isPaid ? 'text-green-700' : 'text-orange-700'}`}>
                            {item.isPaid ? 'Paid' : 'Unpaid'}
                        </Text>
                    </View>
                </View>
                
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </View>
        </TouchableOpacity>
    );
};
