import { router } from 'expo-router'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

import CustomButton from '@/components/CustomButton'
import { useUpdateAccount } from '@/lib/query/hooks'
import { useUserStore } from '@/store'

const UpdateProfile = () => {
    const { user, setUser } = useUserStore()
    const updateAccountMutation = useUpdateAccount()

    // Form state
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
    })

    const [errors, setErrors] = useState<{[key: string]: string}>({})

    // Validation
    const validateForm = () => {
        const newErrors: {[key: string]: string} = {}

        // Username validation
        if (!formData.username.trim()) {
            newErrors.username = 'Tên người dùng là bắt buộc'
        } else if (formData.username.length < 2) {
            newErrors.username = 'Tên người dùng phải có ít nhất 2 ký tự'
        } else if (formData.username.length > 50) {
            newErrors.username = 'Tên người dùng phải ít hơn 50 ký tự'
        } else if (!/^[a-zA-Z0-9\s\u00C0-\u1EF9]+$/.test(formData.username)) {
            newErrors.username = 'Tên người dùng chỉ được chứa chữ cái, số và khoảng trắng'
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email là bắt buộc'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ'
        } else if (formData.email.length > 100) {
            newErrors.email = 'Email quá dài'
        }

        // Phone validation
        if (formData.phoneNumber.trim()) {
            // Remove all spaces and special characters except +
            const cleanPhone = formData.phoneNumber.replace(/[\s\-\(\)]/g, '')
            if (!/^[+]?[0-9]{10,15}$/.test(cleanPhone)) {
                newErrors.phoneNumber = 'Số điện thoại phải có 10-15 chữ số'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const updateProfile = async () => {
        if (!validateForm()) return

        if (!user?.id) {
            Alert.alert('Lỗi', 'Không thể xác định thông tin người dùng')
            return
        }

        // Clean and prepare data - MUST include ALL required fields for backend
        const cleanData: any = {
            // Always include ALL required fields (backend requires all)
            email: formData.email.trim().toLowerCase(),
            username: formData.username.trim(),
            phoneNumber: formData.phoneNumber.replace(/[\s\-\(\)]/g, '') || '',
            role: user?.role || 'RENTER', // Default role if not set
        }
        
        console.log('🔄 Updating profile with clean data:', cleanData)
        console.log('📝 Original user data:', { 
            username: user?.username, 
            email: user?.email, 
            phoneNumber: user?.phoneNumber,
            role: user?.role
        })
        
        // Check if there are any actual changes
        const hasActualChanges = 
            cleanData.username !== user?.username ||
            cleanData.email !== user?.email ||
            cleanData.phoneNumber !== (user?.phoneNumber || '')
        
        if (!hasActualChanges) {
            Alert.alert('Thông báo', 'Không có thay đổi nào để cập nhật.')
            return
        }
        
        updateAccountMutation.mutate({ 
            userId: user.id, 
            data: cleanData 
        }, {
            onSuccess: (response) => {
                console.log('✅ Update response:', response)
                if (response.success) {
                    // Cập nhật thông tin user trong store
                    setUser({
                        ...user!,
                        ...cleanData,
                        updatedAt: new Date().toISOString()
                    })
                    
                    Alert.alert(
                        'Thành công',
                        'Cập nhật thông tin cá nhân thành công!',
                        [
                            {
                                text: 'OK',
                                onPress: () => router.back()
                            }
                        ]
                    )
                } else {
                    Alert.alert('Lỗi', response.message || 'Cập nhật thất bại')
                }
            },
            onError: (error: any) => {
                console.error('❌ Error updating profile:', error)
                console.error('❌ Error details:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                })
                Alert.alert(
                    'Lỗi', 
                    error.message || 'Có lỗi xảy ra khi cập nhật thông tin'
                )
            }
        })
    }

    const hasChanges = 
        formData.username.trim() !== user?.username ||
        formData.email.trim().toLowerCase() !== user?.email?.toLowerCase() ||
        formData.phoneNumber.trim() !== user?.phoneNumber

    const handleCancel = () => {
        if (hasChanges) {
            Alert.alert(
                'Xác nhận',
                'Bạn có chắc chắn muốn hủy? Các thay đổi sẽ không được lưu.',
                [
                    { text: 'Tiếp tục chỉnh sửa', style: 'cancel' },
                    { 
                        text: 'Hủy', 
                        style: 'destructive',
                        onPress: () => router.back()
                    }
                ]
            )
        } else {
            router.back()
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-5 py-4 shadow-sm border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={handleCancel}
                        className="flex-row items-center"
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={24} color="#374151" />
                        <Text className="text-gray-700 font-JakartaMedium ml-2 text-base">
                            Quay lại
                        </Text>
                    </TouchableOpacity>
                    
                    <Text className="text-xl font-JakartaBold text-gray-900">
                        Thông tin cá nhân
                    </Text>
                    
                    <View style={{ width: 80 }} />
                </View>
            </View>

            <ScrollView 
                className="flex-1 px-5"
                contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* User Info Display */}
                <View className="bg-white rounded-xl shadow-sm shadow-neutral-300 px-5 py-6 mb-6">
                    <View className="flex-row items-center mb-4">
                        <View className="bg-blue-100 rounded-full p-3 mr-4">
                            <Ionicons name="person" size={24} color="#2563eb" />
                        </View>
                        <View>
                            <Text className="text-lg font-JakartaBold text-gray-900">
                                {user?.username || 'Chưa có tên'}
                            </Text>
                            <Text className="text-sm text-gray-500 capitalize">
                                {user?.role?.toLowerCase() || 'Người dùng'}
                            </Text>
                        </View>
                    </View>
                    
                    <View className="border-t border-gray-100 pt-4">
                        <Text className="text-base font-JakartaBold text-gray-900 mb-3">
                            Thông tin liên hệ
                        </Text>
                        
                        <View className="space-y-3">
                            <View className="flex-row items-center">
                                <Ionicons name="mail" size={18} color="#6b7280" />
                                <Text className="text-gray-700 ml-3 flex-1">
                                    {user?.email || 'Chưa có email'}
                                </Text>
                            </View>
                            
                            <View className="flex-row items-center">
                                <Ionicons name="call" size={18} color="#6b7280" />
                                <Text className="text-gray-700 ml-3 flex-1">
                                    {user?.phoneNumber || 'Chưa có số điện thoại'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Edit Form */}
                <View className="bg-white rounded-xl shadow-sm shadow-neutral-300 px-5 py-6">
                    <Text className="text-lg font-JakartaBold text-gray-900 mb-4">
                        Chỉnh sửa thông tin
                    </Text>

                    {/* Username Field */}
                    <View className="mb-4">
                        <Text className="text-sm font-JakartaMedium text-gray-700 mb-2">
                            Tên người dùng *
                        </Text>
                        <View className={`flex-row items-center bg-gray-50 rounded-lg px-4 py-3 border ${
                            errors.username ? 'border-red-300' : 'border-gray-200'
                        }`}>
                            <Ionicons name="person-outline" size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-900 font-JakartaMedium"
                                value={formData.username}
                                onChangeText={(text) => {
                                    setFormData(prev => ({ ...prev, username: text }))
                                    if (errors.username) {
                                        setErrors(prev => ({ ...prev, username: '' }))
                                    }
                                }}
                                placeholder="Nhập tên người dùng"
                                placeholderTextColor="#9ca3af"
                                maxLength={50}
                            />
                        </View>
                        {errors.username ? (
                            <View className="flex-row items-center mt-1">
                                <Ionicons name="alert-circle" size={14} color="#ef4444" />
                                <Text className="text-red-500 text-sm ml-1">{errors.username}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Email Field */}
                    <View className="mb-4">
                        <Text className="text-sm font-JakartaMedium text-gray-700 mb-2">
                            Email *
                        </Text>
                        <View className={`flex-row items-center bg-gray-50 rounded-lg px-4 py-3 border ${
                            errors.email ? 'border-red-300' : 'border-gray-200'
                        }`}>
                            <Ionicons name="mail-outline" size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-900 font-JakartaMedium"
                                value={formData.email}
                                onChangeText={(text) => {
                                    setFormData(prev => ({ ...prev, email: text }))
                                    if (errors.email) {
                                        setErrors(prev => ({ ...prev, email: '' }))
                                    }
                                }}
                                placeholder="Nhập địa chỉ email"
                                placeholderTextColor="#9ca3af"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                maxLength={100}
                            />
                        </View>
                        {errors.email ? (
                            <View className="flex-row items-center mt-1">
                                <Ionicons name="alert-circle" size={14} color="#ef4444" />
                                <Text className="text-red-500 text-sm ml-1">{errors.email}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Phone Field */}
                    <View className="mb-6">
                        <Text className="text-sm font-JakartaMedium text-gray-700 mb-2">
                            Số điện thoại
                        </Text>
                        <View className={`flex-row items-center bg-gray-50 rounded-lg px-4 py-3 border ${
                            errors.phoneNumber ? 'border-red-300' : 'border-gray-200'
                        }`}>
                            <Ionicons name="call-outline" size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-900 font-JakartaMedium"
                                value={formData.phoneNumber}
                                onChangeText={(text) => {
                                    setFormData(prev => ({ ...prev, phoneNumber: text }))
                                    if (errors.phoneNumber) {
                                        setErrors(prev => ({ ...prev, phoneNumber: '' }))
                                    }
                                }}
                                placeholder="Nhập số điện thoại"
                                placeholderTextColor="#9ca3af"
                                keyboardType="phone-pad"
                                maxLength={15}
                            />
                        </View>
                        {errors.phoneNumber ? (
                            <View className="flex-row items-center mt-1">
                                <Ionicons name="alert-circle" size={14} color="#ef4444" />
                                <Text className="text-red-500 text-sm ml-1">{errors.phoneNumber}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Action Buttons */}
                    <View className="space-y-3">
                        <CustomButton
                            title={updateAccountMutation.isPending ? "Đang cập nhật..." : "Cập nhật thông tin"}
                            onPress={updateProfile}
                            disabled={updateAccountMutation.isPending || !hasChanges}
                            className={`rounded-lg py-4 ${
                                updateAccountMutation.isPending || !hasChanges 
                                ? 'bg-gray-300' 
                                : 'bg-blue-600'
                            }`}
                            IconLeft={() => 
                                updateAccountMutation.isPending ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Ionicons name="checkmark-circle" size={20} color="white" />
                                )
                            }
                        />
                        
                        <TouchableOpacity
                            onPress={handleCancel}
                            className="py-4 px-4 rounded-lg border border-gray-300 bg-white"
                            activeOpacity={0.7}
                        >
                            <Text className="text-gray-700 font-JakartaBold text-center">
                                Hủy
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default UpdateProfile
