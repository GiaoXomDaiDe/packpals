import { useUserOrders } from '@/lib/query/hooks'
import { OrderApiData, OrdersSuccessResponse } from '@/lib/types/type'
import { useUserStore } from '@/store'
import { useFocusEffect } from '@react-navigation/native'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

const Orders = () => {
    const { user } = useUserStore()
    const [selectedFilter, setSelectedFilter] = useState<string>('ALL')
    const [currentPage, setCurrentPage] = useState<number>(1)
    const pageSize = 10
    
    // Use userId directly since backend API expects userId, not renterId
    const userId = user?.id
    console.log('👤 Using User ID for orders:', userId)
    
    console.log('👤 User from store:', user)
    
    // 🔍 CRITICAL DEBUG: Check if userId is correct
    console.log('🚨 DEBUG - User ID Check:')
    console.log('   - Current User ID:', userId)
    console.log('   - Expected User ID with orders: should match the renterId from database orders')
    
    
    // Build query based on selected filter
    const getQueryParams = () => {
        const params: { IsPaid?: boolean; Status?: string; PageIndex?: number; PageSize?: number } = {
            PageIndex: currentPage,
            PageSize: pageSize
        }
        
        switch (selectedFilter) {
            case 'PENDING':
                params.Status = 'PENDING'
                break
            case 'CONFIRMED':
                params.Status = 'CONFIRMED'
                break
            case 'IN_STORAGE':
                params.Status = 'IN_STORAGE'
                break
            case 'COMPLETED':
                params.Status = 'COMPLETED'
                break
            case 'UNPAID':
                params.IsPaid = false
                break
            case 'PAID':
                params.IsPaid = true
                break
            case 'DEBUG_ALL':
                // 🔍 DEBUG: Send no filters to get ALL orders regardless of backend logic
                return {
                    PageIndex: currentPage,
                    PageSize: pageSize
                    // No Status or IsPaid filters
                }
            // 'ALL' case - no additional filters
        }
        
        return params
    }
    
    // Use TanStack Query for data fetching with proper typing
    const {
        data: ordersResponse,
        isLoading: loading,
        isRefetching: refreshing,
        refetch,
        error
    } = useUserOrders(userId || '', getQueryParams(), {
        enabled: !!userId
    })
    
    console.log('📋 Orders Response Full:', ordersResponse)
    console.log('📋 Orders Response Data:', (ordersResponse as any)?.data)
    console.log('📋 Orders Response Data Type:', typeof (ordersResponse as any)?.data)
    
    // Handle paginated response structure
    let orders: OrderApiData[] = []
    let paginationInfo = {
        totalPages: 1,
        pageIndex: 1,
        totalCount: 0,
        hasNext: false,
        hasPrevious: false
    }
    
    const responseData = (ordersResponse as OrdersSuccessResponse)?.data
    
    if (responseData && 'data' in responseData && Array.isArray(responseData.data)) {
        // Backend returns paginated response: { data: { data: [...], pageIndex, totalPages, etc } }
        orders = responseData.data
        paginationInfo = {
            totalPages: responseData.totalPages || 1,
            pageIndex: responseData.pageIndex || 1,
            totalCount: responseData.totalCount || 0,
            hasNext: responseData.hasNext || false,
            hasPrevious: responseData.hasPrevious || false
        }
    } else if (responseData && Array.isArray(responseData)) {
        // Backend returns array directly: { data: [...] }
        orders = responseData
    }
    
    console.log('📋 Final Orders Array:', orders)
    console.log('📋 Orders Array Length:', orders?.length)
    console.log('📊 Pagination Info:', paginationInfo)
    
    // 🐛 Debug: Log filter details to understand why orders might be missing
    console.log('🔍 Debug Info:', {
        selectedFilter,
        queryParams: getQueryParams(),
        hasOrders: !!orders && orders.length > 0,
        orderStatuses: orders?.map(o => ({ id: o.id?.slice(-8), status: o.status, isPaid: o.isPaid }))
    })
    
    // 🚨 CRITICAL DEBUG: Log API call details
    console.log('🌐 API Call Debug:')
    console.log('   - API Endpoint: GET /api/order/user/' + userId)
    console.log('   - Query Params:', getQueryParams())
    console.log('   - Expected COMPLETED Order ID: D4BAE145-0073-4B74-8335-55264AEACB2F')
    console.log('   - Raw API Response:', ordersResponse)
    console.log('   - Parsed Orders:', orders)
    
    // 🔍 Check if our COMPLETED order exists in response
    const completedOrderInResponse = orders?.find(o => o.id === 'D4BAE145-0073-4B74-8335-55264AEACB2F')
    console.log('   - Found COMPLETED Order in API response?', !!completedOrderInResponse)
    if (completedOrderInResponse) {
        console.log('   - COMPLETED Order Details:', completedOrderInResponse)
    }

    // 🔄 Auto-refresh when screen comes into focus (e.g., after payment)
    useFocusEffect(
        React.useCallback(() => {
            if (userId) {
                console.log('📱 Orders tab focused - refreshing data...')
                refetch()
            }
        }, [userId, refetch])
    )

    const onRefresh = () => {
        refetch()
    }

    const handleFilterChange = (filter: string) => {
        setSelectedFilter(filter)
        setCurrentPage(1) // Reset to first page when filter changes
        // The query will automatically refetch due to the dependency on getQueryParams()
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const filterButtons = [
        { key: 'ALL', label: 'All', icon: 'list-outline' },
        { key: 'PENDING', label: 'Pending', icon: 'time-outline' },
        { key: 'CONFIRMED', label: 'Confirmed', icon: 'checkmark-circle-outline' },
        { key: 'IN_STORAGE', label: 'In Storage', icon: 'cube-outline' },
        { key: 'PAID', label: 'Paid', icon: 'card-outline' },
        { key: 'COMPLETED', label: 'Completed', icon: 'checkmark-done-outline' },
        // 🔍 DEBUG: Add a test filter to see all possible values
        { key: 'DEBUG_ALL', label: 'Debug All', icon: 'bug-outline' },
    ]

    const getStatusColor = (status: OrderApiData['status'] | string) => {
        switch (status) {
            case 'PENDING': return '#f59e0b'
            case 'CONFIRMED': return '#3b82f6'
            case 'IN_STORAGE': return '#8b5cf6'
            case 'COMPLETED': return '#059669'
            case 'CANCELLED': return '#ef4444'
            default: return '#6b7280'
        }
    }

    const getStatusText = (status: OrderApiData['status'] | string) => {
        switch (status) {
            case 'PENDING': return 'Pending'
            case 'CONFIRMED': return 'Confirmed'
            case 'IN_STORAGE': return 'In Storage'
            case 'COMPLETED': return 'Completed'
            case 'CANCELLED': return 'Cancelled'
            default: return 'Unknown'
        }
    }

    // Show loading if we don't have userId yet or if orders are loading
    if (!userId && !!user?.id || (loading && !refreshing)) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                {/* Header */}
                <View className="bg-white px-6 py-4 shadow-sm">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-2xl font-JakartaBold text-gray-900">
                            My Orders
                        </Text>
                        <View className="flex-row items-center">
                            <TouchableOpacity
                                onPress={() => onRefresh()}
                                className="bg-gray-100 rounded-full p-2 mr-3"
                                disabled={refreshing}
                            >
                                <Ionicons name="refresh" size={20} color="#6b7280" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => router.push('/(root)/find-storage')}
                                className="bg-blue-500 rounded-full p-2"
                            >
                                <Ionicons name="add" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="text-gray-600 mt-4 font-JakartaMedium">
                        {!userId ? 'Getting user information...' : 'Loading your orders...'}
                    </Text>
                </View>
            </SafeAreaView>
        )
    }


    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-6 py-4 shadow-sm">
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-2xl font-JakartaBold text-gray-900">
                        My Orders
                    </Text>
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => onRefresh()}
                            className="bg-gray-100 rounded-full p-2 mr-3"
                            disabled={refreshing}
                        >
                            <Ionicons name="refresh" size={20} color="#6b7280" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/(root)/find-storage')}
                            className="bg-blue-500 rounded-full p-2"
                        >
                            <Ionicons name="add" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
                
                {/* Filter Buttons */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    className="flex-row"
                >
                    {filterButtons.map((item) => (
                        <TouchableOpacity
                            key={item.key}
                            onPress={() => handleFilterChange(item.key)}
                            className={`mr-3 px-4 py-2 rounded-full flex-row items-center ${
                                selectedFilter === item.key ? 'bg-blue-500' : 'bg-gray-100'
                            }`}
                        >
                            <Ionicons 
                                name={item.icon as any} 
                                size={16} 
                                color={selectedFilter === item.key ? 'white' : '#6b7280'} 
                            />
                            <Text className={`ml-2 text-sm font-JakartaMedium ${
                                selectedFilter === item.key ? 'text-white' : 'text-gray-600'
                            }`}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Orders List */}
            <ScrollView className="flex-1 px-4">
                {orders && Array.isArray(orders) ? orders.map((item: OrderApiData) => (
                    <TouchableOpacity
                        key={item.id}
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
                            
                            {/* Status Badge */}
                            <View 
                                className="px-3 py-1 rounded-full"
                                style={{ backgroundColor: getStatusColor(item.status || '') + '15' }}
                            >
                                <Text 
                                    className="text-xs font-JakartaBold"
                                    style={{ color: getStatusColor(item.status || '') }}
                                >
                                    {getStatusText(item.status || '')}
                                </Text>
                            </View>
                        </View>
                        
                        {/* Package Description */}
                        <View className="bg-gray-50 rounded-lg p-3 mb-3">
                            <Text className="text-gray-700 text-sm font-Jakarta" numberOfLines={2}>
                                {item.packageDescription || 'No description'}
                            </Text>
                        </View>
                        
                        {/* Bottom Row */}
                        <View className="flex-row justify-between items-center">
                            {/* Amount */}
                            <View className="flex-1">
                                <Text className="text-lg font-JakartaBold text-blue-600">
                                    {(item.totalAmount && !isNaN(Number(item.totalAmount))) 
                                        ? Number(item.totalAmount).toLocaleString() + ' ₫'
                                        : '0 ₫'}
                                </Text>
                                <Text className="text-xs text-gray-500 font-Jakarta">
                                    Total amount
                                </Text>
                            </View>
                            
                            {/* Payment Status */}
                            <View className="mr-3">
                                <View className={`px-2 py-1 rounded-md ${item.isPaid ? 'bg-green-100' : 'bg-orange-100'}`}>
                                    <Text className={`text-xs font-JakartaBold ${item.isPaid ? 'text-green-700' : 'text-orange-700'}`}>
                                        {item.isPaid ? 'Paid' : 'Unpaid'}
                                    </Text>
                                </View>
                            </View>
                            
                            {/* Arrow Icon */}
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </View>
                    </TouchableOpacity>
                )) : null}
                
                {/* Pagination */}
                {paginationInfo.totalPages > 1 && (
                    <View className="mt-6 mb-4">
                        <View className="flex-row justify-center items-center space-x-2">
                            {/* Previous Button */}
                            <TouchableOpacity
                                onPress={() => handlePageChange(paginationInfo.pageIndex - 1)}
                                disabled={!paginationInfo.hasPrevious}
                                className={`rounded-lg px-3 py-2 ${
                                    paginationInfo.hasPrevious 
                                        ? 'bg-blue-500' 
                                        : 'bg-gray-200'
                                }`}
                            >
                                <Ionicons 
                                    name="chevron-back" 
                                    size={16} 
                                    color={paginationInfo.hasPrevious ? 'white' : '#9ca3af'} 
                                />
                            </TouchableOpacity>
                            
                            {/* Page Numbers */}
                            {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                                let pageNum;
                                if (paginationInfo.totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (paginationInfo.pageIndex <= 3) {
                                    pageNum = i + 1;
                                } else if (paginationInfo.pageIndex >= paginationInfo.totalPages - 2) {
                                    pageNum = paginationInfo.totalPages - 4 + i;
                                } else {
                                    pageNum = paginationInfo.pageIndex - 2 + i;
                                }
                                
                                return (
                                    <TouchableOpacity
                                        key={pageNum}
                                        onPress={() => handlePageChange(pageNum)}
                                        className={`rounded-lg px-3 py-2 min-w-[36px] items-center ${
                                            pageNum === paginationInfo.pageIndex
                                                ? 'bg-blue-500'
                                                : 'bg-white border border-gray-200'
                                        }`}
                                    >
                                        <Text 
                                            className={`text-sm font-JakartaMedium ${
                                                pageNum === paginationInfo.pageIndex
                                                    ? 'text-white'
                                                    : 'text-gray-700'
                                            }`}
                                        >
                                            {pageNum}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                            
                            {/* Next Button */}
                            <TouchableOpacity
                                onPress={() => handlePageChange(paginationInfo.pageIndex + 1)}
                                disabled={!paginationInfo.hasNext}
                                className={`rounded-lg px-3 py-2 ${
                                    paginationInfo.hasNext 
                                        ? 'bg-blue-500' 
                                        : 'bg-gray-200'
                                }`}
                            >
                                <Ionicons 
                                    name="chevron-forward" 
                                    size={16} 
                                    color={paginationInfo.hasNext ? 'white' : '#9ca3af'} 
                                />
                            </TouchableOpacity>
                        </View>
                        
                        {/* Pagination Info */}
                        <Text className="text-center text-xs text-gray-500 mt-3 font-JakartaMedium">
                            Page {paginationInfo.pageIndex} of {paginationInfo.totalPages} • {paginationInfo.totalCount} total orders
                        </Text>
                    </View>
                )}
                
                {/* Empty State */}
                {(!orders || !Array.isArray(orders) || orders.length === 0) ? (
                    <View className="flex-1 items-center justify-center py-20">
                        {error ? (
                            <>
                                <View className="bg-red-50 rounded-3xl p-6 mb-4">
                                    <Ionicons name="warning-outline" size={60} color="#ef4444" />
                                </View>
                                <Text className="text-lg font-JakartaBold text-gray-600 mt-4">
                                    Failed to load orders
                                </Text>
                                <Text className="text-sm text-gray-500 text-center mt-2 px-4">
                                    {error?.message || 'Something went wrong'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => refetch()}
                                    className="mt-6 bg-blue-500 px-8 py-4 rounded-2xl shadow-lg"
                                >
                                    <Text className="text-white font-JakartaBold">
                                        Try Again
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View className="bg-gray-100 rounded-3xl p-8 mb-6">
                                    <Ionicons name="receipt-outline" size={80} color="#d1d5db" />
                                </View>
                                <Text className="text-gray-500 text-xl font-JakartaBold mt-4">
                                    No orders found
                                </Text>
                                <Text className="text-gray-400 text-center mt-2 px-8">
                                    {selectedFilter === 'ALL' 
                                        ? 'Start by booking your first storage space'
                                        : `No orders with status "${selectedFilter.toLowerCase()}"`
                                    }
                                </Text>
                                <TouchableOpacity
                                    onPress={() => router.push('/(root)/find-storage')}
                                    className="mt-8 bg-blue-500 rounded-3xl px-8 py-4 shadow-lg"
                                >
                                    <Text className="text-white font-JakartaBold text-lg">
                                        Find Storage
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                ) : null}
                
                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    )
}

export default Orders
