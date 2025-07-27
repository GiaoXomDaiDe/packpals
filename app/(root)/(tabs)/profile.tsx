import { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { authAPI } from '@/lib/api/auth.api'
import { useUserProfile } from '@/lib/query/hooks/useUserQueries'
import { resetAllStorageState, useUserStore } from '@/store'
import { router } from 'expo-router'
import Ionicons from 'react-native-vector-icons/Ionicons'

const Profile = () => {
    const { user, clearUser } = useUserStore()
    const [loggingOut, setLoggingOut] = useState(false)

    // Get user profile to extract renterId for rating history
    const {
        data: userProfileResponse
    } = useUserProfile(user?.id || '', {
        enabled: !!user?.id
    })
    
    const userData = (userProfileResponse as any)?.data.data
    const renterId = userData?.renter?.renterId

    const handleLogout = async () => {
        try {
            setLoggingOut(true)
            
            // Call logout API to clear stored data
            await authAPI.logout()
            
            // Clear user store
            clearUser()
            
            // Reset all storage-related state
            resetAllStorageState()
            
            // Navigate to auth screen
            router.replace('/(auth)/sign-in')
            
            console.log('✅ Logout successful')
        } catch (error) {
            console.error('❌ Logout error:', error)
            Alert.alert(
                'Lỗi đăng xuất',
                'Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại.',
                [{ text: 'OK' }]
            )
        } finally {
            setLoggingOut(false)
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="bg-white px-5 py-6 border-b border-gray-100">
                    <Text className="text-2xl font-JakartaBold text-center text-gray-900">
                        Hồ sơ cá nhân
                    </Text>
                </View>

                {/* Account Management Section */}
                <View className="px-5 py-4">
                    <Text className="text-lg font-JakartaBold mb-4 text-gray-900">
                        Tài khoản
                    </Text>
                    
                    <TouchableOpacity
                        onPress={() => router.push('/(root)/update-profile')}
                        className="flex-row items-center justify-between p-4 bg-white rounded-xl shadow-sm shadow-neutral-200 border border-gray-100"
                    >
                        <View className="flex-row items-center">
                            <View className="bg-blue-600 rounded-full p-2.5 mr-3">
                                <Ionicons name="person-outline" size={18} color="white" />
                            </View>
                            <View>
                                <Text className="text-gray-900 font-JakartaBold text-base">
                                    Xem thông tin cá nhân
                                </Text>
                                <Text className="text-gray-600 text-sm">
                                    Xem và chỉnh sửa thông tin tài khoản
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                {/* Keeper Management Section */}
                {user?.role === 'KEEPER' && (
                    <View className="px-5 py-4">
                        <Text className="text-lg font-JakartaBold mb-4 text-gray-900">
                            Quản lý kho lưu trữ
                        </Text>
                        
                        <View className="space-y-3">
                            <TouchableOpacity
                                onPress={() => router.push('/(root)/keeper-storages')}
                                className="flex-row items-center justify-between p-4 bg-white rounded-xl shadow-sm shadow-neutral-200 border border-gray-100"
                            >
                                <View className="flex-row items-center">
                                    <View className="bg-green-600 rounded-full p-2.5 mr-3">
                                        <Ionicons name="business" size={18} color="white" />
                                    </View>
                                    <View>
                                        <Text className="text-gray-900 font-JakartaBold text-base">
                                            Kho của tôi
                                        </Text>
                                        <Text className="text-gray-600 text-sm">
                                            Quản lý các vị trí kho lưu trữ
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                onPress={() => {
                                    Alert.alert('Sắp ra mắt', 'Tính năng thống kê sẽ sớm có mặt!')
                                }}
                                className="flex-row items-center justify-between p-4 bg-white rounded-xl shadow-sm shadow-neutral-200 border border-gray-100"
                            >
                                <View className="flex-row items-center">
                                    <View className="bg-gray-600 rounded-full p-2.5 mr-3">
                                        <Ionicons name="analytics" size={18} color="white" />
                                    </View>
                                    <View>
                                        <Text className="text-gray-900 font-JakartaBold text-base">
                                            Thống kê
                                        </Text>
                                        <Text className="text-gray-600 text-sm">
                                            Xem doanh thu và số liệu
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Rating History Section */}
                {(user?.role === 'RENTER' || user?.role === 'KEEPER') && renterId && (
                    <View className="px-5 py-4">
                        <Text className="text-lg font-JakartaBold mb-4 text-gray-900">
                            Đánh giá & Phản hồi
                        </Text>
                        
                        <TouchableOpacity
                            onPress={() => router.push('/(root)/(tabs)/reviews')}
                            className="flex-row items-center justify-between p-4 bg-white rounded-xl shadow-sm shadow-neutral-200 border border-gray-100"
                        >
                            <View className="flex-row items-center">
                                <View className="bg-yellow-600 rounded-full p-2.5 mr-3">
                                    <Ionicons name="star" size={18} color="white" />
                                </View>
                                <View>
                                    <Text className="text-gray-900 font-JakartaBold text-base">
                                        Lịch sử đánh giá
                                    </Text>
                                    <Text className="text-gray-600 text-sm">
                                        Xem các đánh giá bạn đã đưa ra
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Settings Section */}
                <View className="px-5 py-4">
                    <Text className="text-lg font-JakartaBold mb-4 text-gray-900">
                        Cài đặt
                    </Text>
                    
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert(
                                'Đăng xuất', 
                                'Bạn có chắc chắn muốn đăng xuất không?', 
                                [
                                    { text: 'Hủy', style: 'cancel' },
                                    { 
                                        text: 'Đăng xuất', 
                                        style: 'destructive',
                                        onPress: handleLogout
                                    }
                                ]
                            )
                        }}
                        className="flex-row items-center justify-between p-4 bg-white rounded-xl shadow-sm shadow-neutral-200 border border-gray-100"
                        disabled={loggingOut}
                    >
                        <View className="flex-row items-center">
                            <View className="bg-red-600 rounded-full p-2.5 mr-3">
                                <Ionicons name="log-out-outline" size={18} color="white" />
                            </View>
                            <View>
                                <Text className="text-gray-900 font-JakartaBold text-base">
                                    {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                </Text>
                                <Text className="text-gray-600 text-sm">
                                    Thoát khỏi tài khoản hiện tại
                                </Text>
                            </View>
                        </View>
                        {loggingOut ? (
                            <ActivityIndicator size="small" color="#dc2626" />
                        ) : (
                            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Profile
