import { useCalculateFinalAmount } from '@/lib/query/hooks/useOrderQueries';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import CustomButton from './CustomButton';

interface OrderPricingCardProps {
  orderId: string;
  baseAmount?: number;
  estimatedDays?: number;
  onProceedPayment?: (finalAmount: number) => void;
  className?: string;
}

const OrderPricingCard: React.FC<OrderPricingCardProps> = ({
  orderId,
  baseAmount,
  estimatedDays,
  onProceedPayment,
  className = "",
}) => {
  const {
    data: pricingResponse,
    isLoading,
    error,
    refetch
  } = useCalculateFinalAmount(orderId, {
    enabled: !!orderId,
    refetchInterval: 30000, // Update every 30 seconds
  });

  const handlePaymentPress = () => {
    if (pricingResponse?.data?.finalAmount && onProceedPayment) {
      onProceedPayment(pricingResponse.data.finalAmount);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <View className={`bg-white rounded-lg p-4 shadow-md ${className}`}>
        <View className="flex-row items-center justify-center">
          <ActivityIndicator size="small" color="#0066CC" />
          <Text className="ml-2 text-gray-600">Calculating pricing...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className={`bg-red-50 rounded-lg p-4 border border-red-200 ${className}`}>
        <Text className="text-red-600 font-medium mb-2">Error calculating price</Text>
        <Text className="text-red-500 text-sm mb-3">
          {error.message || 'Unable to fetch pricing information'}
        </Text>
        <CustomButton
          title="Retry"
          onPress={handleRefresh}
          className="bg-red-600 py-2"
          textVariant="primary"
        />
      </View>
    );
  }

  if (!pricingResponse?.data?.finalAmount) {
    return (
      <View className={`bg-gray-50 rounded-lg p-4 border border-gray-200 ${className}`}>
        <Text className="text-gray-600 text-center">No pricing data available</Text>
      </View>
    );
  }

  const finalAmount = pricingResponse.data.finalAmount;
  const overtimeFees = baseAmount ? Math.max(0, finalAmount - baseAmount) : 0;
  const hasOvertimeFees = overtimeFees > 0;

  return (
    <View className={`bg-white rounded-lg p-4 shadow-md border border-gray-100 ${className}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-gray-800">Order Pricing</Text>
        <View className="bg-blue-100 px-2 py-1 rounded-full">
          <Text className="text-blue-600 text-xs font-medium">Live Update</Text>
        </View>
      </View>

      {/* Pricing Breakdown */}
      <View className="space-y-3 mb-4">
        {/* Base Amount */}
        {baseAmount && (
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-gray-700 font-medium">Base Amount</Text>
              {estimatedDays && (
                <Text className="text-gray-500 text-sm">
                  {estimatedDays} estimated days
                </Text>
              )}
            </View>
            <Text className="text-gray-800 font-semibold">
              {baseAmount.toLocaleString('vi-VN')} VND
            </Text>
          </View>
        )}

        {/* Overtime Fees */}
        {hasOvertimeFees && (
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-orange-600 font-medium">Overtime Fees</Text>
              <Text className="text-orange-500 text-sm">
                Late pickup penalty (500 VND/hour)
              </Text>
            </View>
            <Text className="text-orange-600 font-semibold">
              +{overtimeFees.toLocaleString('vi-VN')} VND
            </Text>
          </View>
        )}

        {/* Divider */}
        {baseAmount && <View className="border-t border-gray-200 my-2" />}

        {/* Final Amount */}
        <View className="flex-row justify-between items-center">
          <Text className="text-lg font-bold text-gray-800">
            {baseAmount ? 'Total Amount' : 'Final Amount'}
          </Text>
          <Text className="text-xl font-bold text-blue-600">
            {finalAmount.toLocaleString('vi-VN')} VND
          </Text>
        </View>
      </View>

      {/* Payment Button */}
      {onProceedPayment && (
        <CustomButton
          title={`Pay ${finalAmount.toLocaleString('vi-VN')} VND`}
          onPress={handlePaymentPress}
          className="bg-blue-600 mt-2"
          textVariant="primary"
        />
      )}

      {/* Info Note */}
      <View className="mt-3 p-3 bg-blue-50 rounded-lg">
        <Text className="text-blue-700 text-xs text-center">
          💡 Pricing updates every 30 seconds. Late pickup incurs 500 VND/hour after 1-hour grace period.
        </Text>
      </View>
    </View>
  );
};

export default OrderPricingCard;
