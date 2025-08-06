import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

import CustomButton from '@/components/CustomButton'
import DetailHeader from '@/components/DetailHeader'
import { useUpdateAccount, useUpdateAvatar } from '@/hooks/query'
import { useUserStore } from '@/store'

const UpdateProfile = () => {
    const { user, setUser } = useUserStore()
    const updateAccountMutation = useUpdateAccount()
    const updateAvatarMutation = useUpdateAvatar()
    const [isEditing, setIsEditing] = useState(false)

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
            newErrors.username = 'Username is required'
        } else if (formData.username.length < 2) {
            newErrors.username = 'Username must be at least 2 characters'
        } else if (formData.username.length > 50) {
            newErrors.username = 'Username must be less than 50 characters'
        } else if (!/^[a-zA-Z0-9\s\u00C0-\u1EF9]+$/.test(formData.username)) {
            newErrors.username = 'Username can only contain letters, numbers and spaces'
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format'
        } else if (formData.email.length > 100) {
            newErrors.email = 'Email is too long'
        }

        // Phone validation
        if (formData.phoneNumber.trim()) {
            // Remove all spaces and special characters except +
            const cleanPhone = formData.phoneNumber.replace(/[\s\-\(\)]/g, '')
            if (!/^[+]?[0-9]{10,15}$/.test(cleanPhone)) {
                newErrors.phoneNumber = 'Phone number must have 10-15 digits'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const updateProfile = async () => {
        if (!validateForm()) return

        if (!user?.id) {
            Alert.alert('Error', 'Unable to identify user information')
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
            Alert.alert('Notice', 'No changes to update.')
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
                        'Success',
                        'Personal information updated successfully!',
                        [
                            {
                                text: 'OK',
                                onPress: () => {
                                    setIsEditing(false)
                                    router.back()
                                }
                            }
                        ]
                    )
                } else {
                    Alert.alert('Error', response.message || 'Update failed')
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
                    'Error', 
                    error.message || 'An error occurred while updating information'
                )
            }
        })
    }

    const hasChanges = 
        formData.username.trim() !== user?.username ||
        formData.email.trim().toLowerCase() !== user?.email?.toLowerCase() ||
        formData.phoneNumber.trim() !== user?.phoneNumber

    const handleCancel = () => {
        if (isEditing) {
            if (hasChanges) {
                Alert.alert(
                    'Confirm',
                    'Are you sure you want to cancel? Changes will not be saved.',
                    [
                        { text: 'Continue editing', style: 'cancel' },
                        { 
                            text: 'Cancel', 
                            style: 'destructive',
                            onPress: () => {
                                // Reset form data to original values
                                setFormData({
                                    username: user?.username || '',
                                    email: user?.email || '',
                                    phoneNumber: user?.phoneNumber || '',
                                })
                                setErrors({})
                                setIsEditing(false)
                            }
                        }
                    ]
                )
            } else {
                setIsEditing(false)
            }
        } else {
            router.back()
        }
    }

    const handleEdit = () => {
        setIsEditing(true)
    }

    const handleAvatarChange = async () => {
        try {
            // Request permission
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
            
            if (permissionResult.granted === false) {
                Alert.alert('Permission Required', 'Please allow access to your photo library to change your avatar.')
                return
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                base64: true,
            })

            if (!result.canceled && result.assets[0].base64) {
                const base64Image = result.assets[0].base64
                
                updateAvatarMutation.mutate({
                    userId: user!.id,
                    imageData: base64Image
                }, {
                    onSuccess: (response) => {
                        if (response.success) {
                            // Update user avatar in store
                            setUser({
                                ...user!,
                                avatarUrl: response.data.avatarUrl || response.data.avatar
                            })
                            Alert.alert('Success', 'Avatar updated successfully!')
                        } else {
                            Alert.alert('Error', response.message || 'Failed to update avatar')
                        }
                    },
                    onError: (error: any) => {
                        console.error('Avatar update error:', error)
                        Alert.alert('Error', error.message || 'Failed to update avatar')
                    }
                })
            }
        } catch (error) {
            console.error('Image picker error:', error)
            Alert.alert('Error', 'Failed to open image picker')
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <DetailHeader 
                title="Personal Information"
                subtitle="Update your account details"
                onBackPress={handleCancel}
                rightComponent={
                    !isEditing ? (
                        <TouchableOpacity
                            onPress={handleEdit}
                            className="bg-primary rounded-full p-2"
                            activeOpacity={0.7}
                        >
                            <Ionicons name="pencil" size={18} color="white" />
                        </TouchableOpacity>
                    ) : null
                }
            />

            <ScrollView 
                className="flex-1 px-4"
                contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* User Info Display */}
                <View className="bg-surface rounded-xl shadow-sm px-4 py-6 mb-6">
                    <View className="flex-row items-center mb-4">
                        <View className="relative mr-4">
                            {user?.avatarUrl ? (
                                <Image 
                                    source={{ uri: user.avatarUrl }}
                                    className="w-16 h-16 rounded-full"
                                    style={{ resizeMode: 'cover' }}
                                />
                            ) : (
                                <View className="bg-primary-soft rounded-full p-4 w-16 h-16 items-center justify-center">
                                    <Ionicons name="person" size={32} color="#2563eb" />
                                </View>
                            )}
                            <TouchableOpacity
                                onPress={handleAvatarChange}
                                className="absolute -bottom-1 -right-1 bg-[#00B14F] rounded-full p-1.5"
                                disabled={updateAvatarMutation.isPending}
                            >
                                <Ionicons 
                                    name="camera" 
                                    size={12} 
                                    color="white" 
                                />
                            </TouchableOpacity>
                        </View>
                        <View>
                            <Text className="text-lg font-JakartaBold text-text">
                                {user?.username || 'No name'}
                            </Text>
                            <Text className="text-sm text-text-secondary capitalize">
                                {user?.role?.toLowerCase() || 'User'}
                            </Text>
                        </View>
                    </View>
                    
                    <View className="border-t border-border pt-4">
                        <Text className="text-base font-JakartaBold text-text mb-3">
                            Contact Information
                        </Text>
                        
                        <View className="space-y-3">
                            <View className="flex-row items-center">
                                <Ionicons name="mail" size={18} color="#6b7280" />
                                <Text className="text-text-secondary ml-3 flex-1">
                                    {user?.email || 'No email'}
                                </Text>
                            </View>
                            
                            <View className="flex-row items-center">
                                <Ionicons name="call" size={18} color="#6b7280" />
                                <Text className="text-text-secondary ml-3 flex-1">
                                    {user?.phoneNumber || 'No phone number'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Edit Form - Only show when editing */}
                {isEditing && (
                    <View className="bg-surface rounded-xl shadow-sm px-4 py-6">
                        <Text className="text-lg font-JakartaBold text-text mb-4">
                            Edit Information
                        </Text>

                    {/* Username Field */}
                    <View className="mb-4">
                        <Text className="text-sm font-JakartaMedium text-text mb-2">
                            Username *
                        </Text>
                        <View className={`flex-row items-center bg-input rounded-lg px-4 py-3 border ${
                            errors.username ? 'border-danger' : 'border-border'
                        }`}>
                            <Ionicons name="person-outline" size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-text font-JakartaMedium"
                                value={formData.username}
                                onChangeText={(text) => {
                                    setFormData(prev => ({ ...prev, username: text }))
                                    if (errors.username) {
                                        setErrors(prev => ({ ...prev, username: '' }))
                                    }
                                }}
                                placeholder="Enter username"
                                placeholderTextColor="#9ca3af"
                                maxLength={50}
                                editable={isEditing}
                            />
                        </View>
                        {errors.username ? (
                            <View className="flex-row items-center mt-1">
                                <Ionicons name="alert-circle" size={14} color="#ef4444" />
                                <Text className="text-danger text-sm ml-1">{errors.username}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Email Field */}
                    <View className="mb-4">
                        <Text className="text-sm font-JakartaMedium text-text mb-2">
                            Email *
                        </Text>
                        <View className={`flex-row items-center bg-input rounded-lg px-4 py-3 border ${
                            errors.email ? 'border-danger' : 'border-border'
                        }`}>
                            <Ionicons name="mail-outline" size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-text font-JakartaMedium"
                                value={formData.email}
                                onChangeText={(text) => {
                                    setFormData(prev => ({ ...prev, email: text }))
                                    if (errors.email) {
                                        setErrors(prev => ({ ...prev, email: '' }))
                                    }
                                }}
                                placeholder="Enter email address"
                                placeholderTextColor="#9ca3af"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                maxLength={100}
                                editable={isEditing}
                            />
                        </View>
                        {errors.email ? (
                            <View className="flex-row items-center mt-1">
                                <Ionicons name="alert-circle" size={14} color="#ef4444" />
                                <Text className="text-danger text-sm ml-1">{errors.email}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Phone Field */}
                    <View className="mb-6">
                        <Text className="text-sm font-JakartaMedium text-text mb-2">
                            Phone Number
                        </Text>
                        <View className={`flex-row items-center bg-input rounded-lg px-4 py-3 border ${
                            errors.phoneNumber ? 'border-danger' : 'border-border'
                        }`}>
                            <Ionicons name="call-outline" size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-text font-JakartaMedium"
                                value={formData.phoneNumber}
                                onChangeText={(text) => {
                                    setFormData(prev => ({ ...prev, phoneNumber: text }))
                                    if (errors.phoneNumber) {
                                        setErrors(prev => ({ ...prev, phoneNumber: '' }))
                                    }
                                }}
                                placeholder="Enter phone number"
                                placeholderTextColor="#9ca3af"
                                keyboardType="phone-pad"
                                maxLength={15}
                                editable={isEditing}
                            />
                        </View>
                        {errors.phoneNumber ? (
                            <View className="flex-row items-center mt-1">
                                <Ionicons name="alert-circle" size={14} color="#ef4444" />
                                <Text className="text-danger text-sm ml-1">{errors.phoneNumber}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Action Buttons - Only show when editing */}
                    <View className="flex-row mt-6" style={{ gap: 12 }}>
                        <View className="flex-1">
                            <CustomButton
                                title={updateAccountMutation.isPending ? "Updating..." : "Update Information"}
                                onPress={() => {
                                    updateProfile()
                                    if (!updateAccountMutation.isPending) {
                                        setIsEditing(false)
                                    }
                                }}
                                disabled={updateAccountMutation.isPending || !hasChanges}
                                className={`rounded-lg py-4 ${
                                    updateAccountMutation.isPending || !hasChanges 
                                    ? 'bg-gray-300' 
                                    : 'bg-primary'
                                }`}
                                IconLeft={() => 
                                    updateAccountMutation.isPending ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <Ionicons name="checkmark-circle" size={20} color="white" />
                                    )
                                }
                            />
                        </View>
                        
                        <View className="flex-1">
                            <TouchableOpacity
                                onPress={handleCancel}
                                className="py-4 px-4 rounded-lg border border-border bg-surface"
                                activeOpacity={0.7}
                            >
                                <Text className="text-text font-JakartaBold text-center">
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

export default UpdateProfile
