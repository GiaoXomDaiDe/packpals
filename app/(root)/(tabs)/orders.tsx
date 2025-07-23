import { useUserOrders } from '@/lib/query/hooks'
import { useUserProfile } from '@/lib/query/hooks/useUserQueries'
import { OrderApiData, OrdersSuccessResponse, UserProfileData } from '@/lib/types/type'
import { useUserStore } from '@/store'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

const Orders = () => {
    const { user } = useUserStore()
    const [selectedFilter, setSelectedFilter] = useState<string>('ALL')
    const [currentPage, setCurrentPage] = useState<number>(1)
    const pageSize = 10
    
    // Get user profile to extract renterId
    const {
        data: userProfileResponse,
        isLoading: userProfileLoading,
        error: userProfileError
    } = useUserProfile(user?.id || '', {
        enabled: !!user?.id,
        retry: false // Don't retry on 500 errors
    })
    
    // Extract renterId from user profile with proper typing
    const userData: UserProfileData | undefined = (userProfileResponse as any)?.data.data
    const renterId = userData?.renter?.renterId
    
    console.log('👤 User from store:', user)
    console.log('👤 User Profile Loading:', userProfileLoading)
    console.log('👤 User Profile Error:', userProfileError)
    console.log('👤 User Profile Response Raw:', userProfileResponse)
    console.log('👤 User Profile Data:', userData)
    console.log('🏠 Renter ID:', renterId)
    
    // Log detailed error information
    if (userProfileError) {
        console.error('🚨 User Profile API Error Details:', {
            message: userProfileError.message,
            name: userProfileError.name,
            stack: userProfileError.stack
        })
    }
    
    // Check if it's a database connection error
    const isDatabaseError = (userProfileResponse as any)?.data?.message?.includes('Login failed for user')
    
    console.log('💾 Database Connection Error:', isDatabaseError)
    
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
    } = useUserOrders(renterId || '', getQueryParams(), {
        enabled: !!renterId
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
            case 'PENDING': return 'Awaiting confirmation'
            case 'CONFIRMED': return 'Confirmed by keeper'
            case 'IN_STORAGE': return 'Items in storage'
            case 'COMPLETED': return 'Service completed'
            case 'CANCELLED': return 'Cancelled'
            default: return status || 'Unknown'
        }
    }

    // Show loading if we don't have renterId yet or if orders are loading
    if (userProfileLoading || (!renterId && !!user?.id) || (loading && !refreshing)) {
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
                        {userProfileLoading ? 'Loading user profile...' : 
                         !renterId ? 'Getting renter information...' : 'Loading your orders...'}
                    </Text>
                    {userProfileError ? (
                        <Text className="text-red-500 mt-2 text-sm text-center px-4">
                            Error: {userProfileError.message || 'Failed to load user profile'}
                        </Text>
                    ) : null}
                    {isDatabaseError ? (
                        <View className="mt-4 bg-red-50 p-4 rounded-2xl mx-6">
                            <Text className="text-red-700 font-JakartaBold text-center mb-2">
                                Database Connection Issue
                            </Text>
                            <Text className="text-red-600 text-sm text-center mb-3">
                                The server cannot connect to the database. This might be a temporary issue.
                            </Text>
                            <TouchableOpacity
                                onPress={() => onRefresh()}
                                className="bg-red-500 rounded-lg px-4 py-2 self-center"
                            >
                                <Text className="text-white font-JakartaMedium text-sm">
                                    Retry Connection
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>
            </SafeAreaView>
        )
    }

    // Check if user has a renter profile  
    if (user?.id && !userProfileLoading && userProfileResponse && !renterId) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                {/* Header */}
                <View className="bg-white px-6 py-4 shadow-sm">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-2xl font-JakartaBold text-gray-900">
                            My Orders
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(root)/find-storage')}
                            className="bg-blue-500 rounded-full p-2"
                        >
                            <Ionicons name="add" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
                
                <View className="flex-1 items-center justify-center px-6">
                    <Ionicons name="person-outline" size={80} color="#d1d5db" />
                    <Text className="text-gray-500 text-xl font-JakartaBold mt-4 text-center">
                        Renter Profile Not Found
                    </Text>
                    <Text className="text-gray-400 text-center mt-2">
                        Your account is not set up as a renter. Please contact support or try logging out and back in.
                    </Text>
                    <Text className="text-red-500 text-sm mt-2 text-center">
                        Debug: User Role - {userData?.role || 'Unknown'} | Has Renter: {userData?.renter ? 'Yes' : 'No'}
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.push('/(root)/find-storage')}
                        className="mt-6 bg-blue-500 rounded-2xl px-6 py-3"
                    >
                        <Text className="text-white font-JakartaBold">
                            Find Storage
                        </Text>
                    </TouchableOpacity>
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
                    <View key={item.id} className="mt-3">
                        <TouchableOpacity
                            onPress={() => router.push({
                                            pathname: '/(root)/orderdetails/[id]',
                                            params: { id: item.id.toString() }
                                        })}
                            className="bg-white rounded-2xl overflow-hidden border border-gray-100"
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.05,
                                shadowRadius: 8,
                                elevation: 3,
                            }}
                        >
                            {/* Compact Header */}
                            <View className="p-4">
                                <View className="flex-row items-center justify-between mb-3">
                                    <View className="flex-row items-center flex-1">
                                        <View className="bg-blue-500 rounded-xl p-2 mr-3">
                                            <Ionicons name="receipt" size={16} color="white" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-base font-JakartaBold text-gray-900">
                                                Order #{item.id ? item.id.toString().slice(-8) : 'N/A'}
                                            </Text>
                                            <Text className="text-xs text-gray-500 font-JakartaMedium">
                                                {(() => {
                                                    const dateStr = item.orderDate || item.createdAt
                                                    if (!dateStr) return 'Date not available'
                                                    const date = new Date(dateStr)
                                                    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString('en-US', { 
                                                        month: 'short', 
                                                        day: 'numeric', 
                                                        year: 'numeric' 
                                                    })
                                                })()}
                                            </Text>
                                        </View>
                                    </View>
                                    <View 
                                        className="px-3 py-1.5 rounded-lg"
                                        style={{ backgroundColor: getStatusColor(item.status || '') + '20' }}
                                    >
                                        <Text 
                                            className="text-xs font-JakartaBold"
                                            style={{ color: getStatusColor(item.status || '') }}
                                            numberOfLines={1}
                                        >
                                            {getStatusText(item.status || '')}
                                        </Text>
                                    </View>
                                </View>
                                
                                {/* Package Description */}
                                <View className="bg-gray-50 rounded-xl p-3 mb-3">
                                    <View className="flex-row items-center">
                                        <Ionicons name="cube-outline" size={16} color="#6b7280" />
                                        <Text className="text-gray-700 text-sm font-JakartaMedium flex-1 ml-2" numberOfLines={2}>
                                            {item.packageDescription || 'No description available'}
                                        </Text>
                                    </View>
                                </View>
                                
                                {/* Compact Info Row */}
                                <View className="flex-row justify-between items-center">
                                    {/* Amount */}
                                    <View className="flex-1 mr-3">
                                        <Text className="text-xs text-gray-500 font-JakartaMedium">Total Amount</Text>
                                        <Text className="text-base font-JakartaBold text-blue-600">
                                            {(item.totalAmount && !isNaN(Number(item.totalAmount))) 
                                                ? Number(item.totalAmount).toLocaleString() + ' VND'
                                                : '0 VND'}
                                        </Text>
                                    </View>
                                    
                                    {/* Payment Status */}
                                    <View className="items-center mr-3">
                                        <Text className="text-xs text-gray-500 font-JakartaMedium mb-1">Payment</Text>
                                        <View className={`px-2 py-1 rounded-md ${item.isPaid ? 'bg-green-100' : 'bg-orange-100'}`}>
                                            <Text className={`text-xs font-JakartaBold ${item.isPaid ? 'text-green-700' : 'text-orange-700'}`}>
                                                {item.isPaid ? 'Paid' : 'Unpaid'}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    {/* Action Button */}
                                    <TouchableOpacity
                                        className="bg-blue-500 rounded-xl px-4 py-2"
                                        onPress={() => router.push({
                                            pathname: '/(root)/orderdetails/[id]',
                                            params: { id: item.id.toString() }
                                        })}
                                    >
                                        <Text className="text-white text-xs font-JakartaBold">
                                            Details
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
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
