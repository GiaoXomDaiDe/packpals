import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useKeeperIdByUserId, useKeeperOrders } from '@/hooks/query';
import { ViewSummaryOrderModel } from '../../types/type';

import { useUserStore } from '@/store';
import { formatCurrency } from '@/utils';

const ORDER_STATUS_COLORS = {
  'PENDING': '#F59E0B',
  'CONFIRMED': '#3B82F6', 
  'IN_STORAGE': '#8B5CF6',
  'COMPLETED': '#10B981',
  'CANCELLED': '#EF4444',
} as const;

const ORDER_STATUS_DISPLAY = {
  'PENDING': 'Pending',
  'CONFIRMED': 'Confirmed',
  'IN_STORAGE': 'In Storage',
  'COMPLETED': 'Completed', 
  'CANCELLED': 'Cancelled',
} as const;

const OrderManagement: React.FC = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);
  
  // State for pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  
  // Get keeper ID for the user
  const { 
    data: keeperId, 
    isLoading: isLoadingKeeperId, 
    error: keeperIdError 
  } = useKeeperIdByUserId(user?.id || '', {
    enabled: !!user?.id && user?.role === 'KEEPER'
  });

  // Debug logging
  console.log('🔍 Order Management Debug:', {
    userId: user?.id,
    userRole: user?.role,
    keeperId: keeperId,
    isLoadingKeeperId: isLoadingKeeperId,
    keeperIdError: keeperIdError?.message,
    isKeeper: user?.role === 'KEEPER',
    hasKeeperId: !!keeperId
  });
  
  const {
    data: ordersResponse,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useKeeperOrders(
    keeperId || '',
    {
      PageIndex: currentPage,
      PageSize: 20,
      Status: selectedStatus || undefined,
      IsPaid: false, // Show unpaid orders by default
    },
    {
      enabled: !!keeperId, // Only run when we have keeperId
    }
  );

  // Safely extract data with proper fallbacks
  const ordersData = (ordersResponse as any)?.data;
  const orders = ordersData?.data || [];
  const totalItems = ordersData?.totalCount || 0;
  const hasNextPage = ordersData?.hasNext || false;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetching) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleOrderPress = (orderId: string) => {
    console.log('Navigating to order details:', orderId);
    router.push({
      pathname: "/(root)/keeper-orderdetails/[id]",
      params: { id: orderId }
    });
  };

  const getStatusColor = (status: string) => {
    return ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS] || '#6B7280';
  };

  const renderOrderItem = ({ item }: { item: ViewSummaryOrderModel }) => (
    <TouchableOpacity
      onPress={() => handleOrderPress(item.id)}
      className="bg-white mx-4 my-2 rounded-xl shadow-md border border-gray-100 overflow-hidden"
      style={{ 
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      }}
    >
      {/* Header with Order ID and Status */}
      <View className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-100">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center flex-1">
            <View className="bg-blue-100 rounded-full p-2 mr-3">
              <Ionicons name="receipt-outline" size={18} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
                Order #{item.id.slice(0, 8)}
              </Text>
              <Text className="text-sm text-gray-500">
                ID: {item.id.slice(-8)}
              </Text>
            </View>
          </View>
          <View
            className="px-3 py-1.5 rounded-full shadow-sm"
            style={{ backgroundColor: `${getStatusColor(item.status)}15` }}
          >
            <Text
              className="text-xs font-bold tracking-wide"
              style={{ color: getStatusColor(item.status) }}
            >
              {ORDER_STATUS_DISPLAY[item.status as keyof typeof ORDER_STATUS_DISPLAY] || item.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View className="p-4">
        {/* Renter Info */}
        <View className="flex-row items-center mb-3 bg-gray-50 p-3 rounded-lg">
          <View className="bg-green-100 rounded-full p-2 mr-3">
            <Ionicons name="person-outline" size={16} color="#10B981" />
          </View>
          <View className="flex-1">
            <Text className="text-sm text-gray-500 font-medium">Customer</Text>
            <Text className="text-base font-semibold text-gray-900">
              {item.renter?.name || 'Unknown Renter'}
            </Text>
          </View>
        </View>

        {/* Order Date */}
        <View className="flex-row items-center mb-3">
          <View className="bg-orange-100 rounded-full p-2 mr-3">
            <Ionicons name="calendar-outline" size={16} color="#F59E0B" />
          </View>
          <View className="flex-1">
            <Text className="text-sm text-gray-500 font-medium">Order Date</Text>
            <Text className="text-base font-semibold text-gray-900">
              {new Date(item.orderDate).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </View>
        </View>

        {/* Payment Info */}
        <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
          <View className="flex-row items-center">
            <View className="bg-green-100 rounded-full p-2 mr-3">
              <Ionicons name="cash-outline" size={16} color="#10B981" />
            </View>
            <View>
              <Text className="text-sm text-gray-500 font-medium">Total Amount</Text>
              <Text className="text-xl font-bold text-green-600">
                {formatCurrency(item.totalAmount)}
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            {item.isPaid ? (
              <View className="flex-row items-center bg-green-100 px-3 py-2 rounded-full">
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text className="text-green-700 text-sm font-bold ml-1">Paid</Text>
              </View>
            ) : (
              <View className="flex-row items-center bg-orange-100 px-3 py-2 rounded-full">
                <Ionicons name="time-outline" size={16} color="#F59E0B" />
                <Text className="text-orange-700 text-sm font-bold ml-1">Pending</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Click Indicator */}
      <View className="bg-blue-50 px-4 py-2 border-t border-blue-100">
        <View className="flex-row items-center justify-center">
          <Text className="text-blue-600 text-sm font-medium mr-2">View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStatusFilter = () => (
    <View className="px-4 mb-4 bg-white mx-4 rounded-xl shadow-sm border border-gray-100 py-4">
      <View className="flex-row items-center mb-3">
        <View className="bg-blue-100 rounded-full p-2 mr-3">
          <Ionicons name="filter-outline" size={18} color="#3B82F6" />
        </View>
        <Text className="text-lg font-bold text-gray-900">Filter by Status</Text>
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[null, ...Object.keys(ORDER_STATUS_COLORS)]}
        keyExtractor={(item) => item || 'all'}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setSelectedStatus(item);
              setCurrentPage(1);
            }}
            className={`mr-3 px-4 py-2.5 rounded-full border-2 ${
              selectedStatus === item
                ? 'bg-blue-500 border-blue-500 shadow-lg'
                : 'bg-white border-gray-200 shadow-sm'
            }`}
            style={{
              elevation: selectedStatus === item ? 4 : 1,
            }}
          >
            <Text
              className={`font-bold text-sm ${
                selectedStatus === item ? 'text-white' : 'text-gray-700'
              }`}
            >
              {item ? ORDER_STATUS_DISPLAY[item as keyof typeof ORDER_STATUS_DISPLAY] || item : 'All Orders'}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderHeader = () => (
    <View className="bg-white mx-4 mb-2 rounded-xl shadow-sm border border-gray-100 p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="bg-green-100 rounded-full p-2 mr-3">
            <Ionicons name="document-text-outline" size={20} color="#10B981" />
          </View>
          <View>
            <Text className="text-sm text-gray-500 font-medium">Total Orders</Text>
            <Text className="text-2xl font-bold text-gray-900">{totalItems}</Text>
          </View>
        </View>
        {selectedStatus && (
          <View className="bg-blue-50 px-3 py-1.5 rounded-full">
            <Text className="text-blue-700 text-sm font-bold">
              {ORDER_STATUS_DISPLAY[selectedStatus as keyof typeof ORDER_STATUS_DISPLAY] || selectedStatus}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isFetching) return null;
    
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center py-20 px-8">
      <View className="bg-gray-100 rounded-full p-8 mb-6">
        <Ionicons name="document-outline" size={64} color="#9CA3AF" />
      </View>
      <Text className="text-gray-900 text-xl font-bold mb-2 text-center">No orders found</Text>
      <Text className="text-gray-500 text-center text-base leading-relaxed">
        {selectedStatus 
          ? `No orders with status "${ORDER_STATUS_DISPLAY[selectedStatus as keyof typeof ORDER_STATUS_DISPLAY] || selectedStatus}" found. Try selecting a different status filter.`
          : "You haven't received any orders yet. Orders will appear here once customers book your storage spaces."
        }
      </Text>
      {selectedStatus && (
        <TouchableOpacity
          onPress={() => {
            setSelectedStatus(null);
            setCurrentPage(1);
          }}
          className="bg-blue-500 px-6 py-3 rounded-full mt-6"
        >
          <Text className="text-white font-bold">Show All Orders</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (keeperIdError) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View 
          className="bg-white px-4 py-6 border-b border-gray-200"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 bg-gray-100 rounded-full p-2"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900">Order Management</Text>
          </View>
        </View>
        <View className="flex-1 justify-center items-center px-8">
          <View className="bg-red-100 rounded-full p-8 mb-6">
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          </View>
          <Text className="text-red-600 text-xl font-bold mb-2 text-center">
            Error Loading User Info
          </Text>
          <Text className="text-gray-600 text-center mb-6 text-base leading-relaxed">
            {keeperIdError.message || 'Failed to load user information. Please try again.'}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-blue-500 px-8 py-4 rounded-full shadow-lg"
          >
            <Text className="text-white font-bold text-base">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading while getting keeperId
  if (isLoadingKeeperId) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View 
          className="bg-white px-4 py-6 border-b border-gray-200"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 bg-gray-100 rounded-full p-2"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900">Order Management</Text>
          </View>
        </View>
        <View className="flex-1 justify-center items-center">
          <View className="bg-blue-100 rounded-full p-8 mb-6">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
          <Text className="text-gray-600 text-lg font-medium">Loading user information...</Text>
          <Text className="text-gray-500 text-center mt-2">Please wait while we verify your account</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show message if user is not a keeper or doesn't have keeperId
  if (user?.role !== 'KEEPER' || !keeperId) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View 
          className="bg-white px-4 py-6 border-b border-gray-200"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 bg-gray-100 rounded-full p-2"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900">Order Management</Text>
          </View>
        </View>
        <View className="flex-1 justify-center items-center px-8">
          <View className="bg-orange-100 rounded-full p-8 mb-6">
            <Ionicons name="person-outline" size={64} color="#F59E0B" />
          </View>
          <Text className="text-gray-900 text-xl font-bold mb-2 text-center">
            Access Restricted
          </Text>
          <Text className="text-gray-500 text-center text-base leading-relaxed mb-6">
            {user?.role !== 'KEEPER' 
              ? 'This feature is only available for keepers. Please register as a keeper to access order management.'
              : 'Please complete your keeper registration to access orders and start managing your storage business.'
            }
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-blue-500 px-8 py-4 rounded-full shadow-lg"
          >
            <Text className="text-white font-bold text-base">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View 
          className="bg-white px-4 py-6 border-b border-gray-200"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 bg-gray-100 rounded-full p-2"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900">Order Management</Text>
          </View>
        </View>
        <View className="flex-1 justify-center items-center px-8">
          <View className="bg-red-100 rounded-full p-8 mb-6">
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          </View>
          <Text className="text-red-600 text-xl font-bold mb-2 text-center">
            Error Loading Orders
          </Text>
          <Text className="text-gray-600 text-center mb-6 text-base leading-relaxed">
            {error.message || 'Failed to load orders. Please check your connection and try again.'}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="bg-blue-500 px-8 py-4 rounded-full shadow-lg"
          >
            <Text className="text-white font-bold text-base">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View 
        className="bg-white px-4 py-6 border-b border-gray-200"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 bg-gray-100 rounded-full p-2"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">Order Management</Text>
            <Text className="text-sm text-gray-500 mt-1">Manage your keeper orders</Text>
          </View>
          <View className="bg-blue-100 rounded-full p-3">
            <Ionicons name="receipt-outline" size={24} color="#3B82F6" />
          </View>
        </View>
      </View>

      {/* Status Filter */}
      {renderStatusFilter()}

      {/* Orders List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 20,
        }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View 
          className="absolute inset-0 bg-white bg-opacity-90 justify-center items-center"
          style={{ zIndex: 1000 }}
        >
          <View className="bg-white rounded-xl p-8 shadow-xl border border-gray-100 items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-600 mt-4 font-medium text-base">Loading orders...</Text>
            <Text className="text-gray-500 text-sm mt-1">Please wait a moment</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default OrderManagement;
