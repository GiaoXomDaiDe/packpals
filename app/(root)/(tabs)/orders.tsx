import { OrderCardSkeleton, OrderListItem, ScreenHeader, ScreenLoadingState } from '@/components'
import { useUserOrders } from '@/hooks/query'
import { useSmartOrdersRefresh } from '@/hooks/useSmartOrdersRefresh'
import { useUserStore } from '@/store'
import { useFocusEffect } from '@react-navigation/native'
import { router } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { OrderApiData, OrdersSuccessResponse } from '../../../types/type'

const Orders = () => {
    const { user } = useUserStore()
    const [selectedFilter, setSelectedFilter] = useState<string>('ALL')
    const [currentPage, setCurrentPage] = useState<number>(1)
    const pageSize = 10
    
    const userId = user?.id
    
    useSmartOrdersRefresh(userId || '')
    
    // Tối ưu: Lấy tất cả orders một lần, sau đó filter ở client
    const {
        data: ordersResponse,
        isLoading: loading,
        isRefetching: refreshing,
        refetch,
        error
    } = useUserOrders(userId || '', {
        PageIndex: 1,
        PageSize: 100
    }, {
        staleTime: 5 * 60 * 1000, // Cache 5 phút
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: true,
        refetchOnMount: false,
        refetchInterval: false,
        refetchIntervalInBackground: false
    })
    
    // Filter và phân trang ở client để tránh lag
    const { filteredOrders, paginationInfo } = useMemo(() => {
        const responseData = (ordersResponse as OrdersSuccessResponse)?.data
        let allOrders: OrderApiData[] = []
        
        if (responseData && 'data' in responseData && Array.isArray(responseData.data)) {
            allOrders = responseData.data
        } else if (responseData && Array.isArray(responseData)) {
            allOrders = responseData
        }
        
        // Lọc theo trạng thái
        let filtered = allOrders
        
        switch (selectedFilter) {
            case 'PENDING':
                filtered = allOrders.filter(order => order.status === 'PENDING')
                break
            case 'CONFIRMED':
                filtered = allOrders.filter(order => order.status === 'CONFIRMED')
                break
            case 'IN_STORAGE':
                filtered = allOrders.filter(order => order.status === 'IN_STORAGE')
                break
            case 'COMPLETED':
                filtered = allOrders.filter(order => order.status === 'COMPLETED')
                break
            case 'UNPAID':
                filtered = allOrders.filter(order => !order.isPaid)
                break
            case 'PAID':
                filtered = allOrders.filter(order => order.isPaid)
                break
            default:
                filtered = allOrders
                break
        }
        
        // Phân trang ở client
        const totalCount = filtered.length
        const totalPages = Math.ceil(totalCount / pageSize)
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        const paginatedOrders = filtered.slice(startIndex, endIndex)
        
        return {
            filteredOrders: paginatedOrders,
            paginationInfo: {
                totalPages,
                pageIndex: currentPage,
                totalCount,
                hasNext: currentPage < totalPages,
                hasPrevious: currentPage > 1
            }
        }
    }, [ordersResponse, selectedFilter, currentPage, pageSize])
    // Auto-refresh khi quay lại màn hình
    useFocusEffect(
        React.useCallback(() => {
            if (userId) {
                refetch()
            }
        }, [userId, refetch])
    )

    // Filter ngay lập tức không cần gọi API
    const handleFilterChange = (filter: string) => {
        setSelectedFilter(filter)
        setCurrentPage(1)
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

    // Chỉ hiển thị loading khi lần đầu tải, không phải khi filter
    const isInitialLoading = loading && !ordersResponse
    const hasData = !!ordersResponse

    if (!userId && !!user?.id || isInitialLoading) {
        return (
            <ScreenLoadingState
                title="My Orders"
                loadingMessage={!userId ? 'Getting user information...' : 'Loading your orders...'}
                actionIcon="add"
                onActionPress={() => router.push('/(root)/find-storage')}
                actionButtonColor="#3b82f6"
            />
        )
    }


    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScreenHeader
                title="My Orders"
                showRefreshIndicator={refreshing}
                actionIcon="add"
                onActionPress={() => router.push('/(root)/find-storage')}
                actionButtonColor="#3b82f6"
            />
            
            {/* Nút filter */}
            <View className="px-6 py-4">
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
                            activeOpacity={0.7}
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

            {/* Danh sách orders */}
            <ScrollView className="flex-1 px-4 mt-2">
                {loading && !refreshing ? (
                    <OrderCardSkeleton count={5} />
                ) : (
                    filteredOrders && Array.isArray(filteredOrders) ? filteredOrders.map((item: OrderApiData) => (
                        <OrderListItem key={item.id} item={item} />
                    )) : null
                )}
                
                {/* Phân trang */}
                {paginationInfo.totalPages > 1 ? (
                    <View className="mt-6 mb-4">
                        <View className="flex-row justify-center items-center space-x-2">
                            {/* Nút Previous */}
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
                            
                            {/* Số trang */}
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
                            
                            {/* Nút Next */}
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
                        
                        <Text className="text-center text-xs text-gray-500 mt-3 font-JakartaMedium">
                            Trang {paginationInfo.pageIndex} / {paginationInfo.totalPages} • {paginationInfo.totalCount} đơn hàng
                        </Text>
                    </View>
                ) : null}
                
                {/* Trạng thái trống */}
                {(!filteredOrders || !Array.isArray(filteredOrders) || filteredOrders.length === 0) && hasData ? (
                    <View className="flex-1 items-center justify-center py-20">
                        {error ? (
                            <>
                                <View className="bg-red-50 rounded-3xl p-6 mb-4">
                                    <Ionicons name="warning-outline" size={60} color="#ef4444" />
                                </View>
                                <Text className="text-lg font-JakartaBold text-gray-600 mt-4">
                                    Không thể tải đơn hàng
                                </Text>
                                <Text className="text-sm text-gray-500 text-center mt-2 px-4">
                                    {error?.message || 'Đã có lỗi xảy ra'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => refetch()}
                                    className="mt-6 bg-blue-500 px-8 py-4 rounded-2xl"
                                    style={{
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 8,
                                        elevation: 8,
                                    }}
                                >
                                    <Text className="text-white font-JakartaBold">
                                        Thử lại
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View className="bg-gray-100 rounded-3xl p-8 mb-6">
                                    <Ionicons name="receipt-outline" size={80} color="#d1d5db" />
                                </View>
                                <Text className="text-gray-500 text-xl font-JakartaBold mt-4">
                                    Không có đơn hàng
                                </Text>
                                <Text className="text-gray-400 text-center mt-2 px-8">
                                    {selectedFilter === 'ALL' 
                                        ? 'Hãy bắt đầu bằng cách đặt chỗ lưu trữ đầu tiên'
                                        : `Không có đơn hàng với trạng thái "${selectedFilter.toLowerCase()}"`
                                    }
                                </Text>
                                <TouchableOpacity
                                    onPress={() => router.push('/(root)/find-storage')}
                                    className="mt-8 bg-blue-500 rounded-3xl px-8 py-4"
                                    style={{
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 8,
                                        elevation: 8,
                                    }}
                                >
                                    <Text className="text-white font-JakartaBold text-lg">
                                        Tìm kho lưu trữ
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
