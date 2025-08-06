import { useState } from 'react'
import {
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ReactNativeModal } from 'react-native-modal'

import { ConfirmationModal } from '@/components/ConfirmationModal'
import CustomModal from '@/components/CustomModal'
import DetailHeader from '@/components/DetailHeader'
import RoleSwitcher from '@/components/RoleSwitcher'
import { authAPI } from '@/hooks/api/auth.api'
import { useChangePassword, useUserProfile } from '@/hooks/query'
import { resetAllStorageState, useUserStore } from '@/store'
import { router } from 'expo-router'
import Ionicons from 'react-native-vector-icons/Ionicons'

const Profile = () => {
    const { user, clearUser } = useUserStore()
    const [loggingOut, setLoggingOut] = useState(false)
    
    // Modal states
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [showComingSoonModal, setShowComingSoonModal] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [showRoleSwitcher, setShowRoleSwitcher] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    // Password change states
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    // Initialize password change mutation
    const changePasswordMutation = useChangePassword()

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
            setErrorMessage('An error occurred during logout. Please try again.')
            setShowErrorModal(true)
        } finally {
            setLoggingOut(false)
        }
    }

    const handlePasswordChange = async () => {
        // Validate passwords
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            Alert.alert('Error', 'Please fill in all password fields')
            return
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            Alert.alert('Error', 'New passwords do not match')
            return
        }

        if (passwordData.newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters long')
            return
        }

        try {
            changePasswordMutation.mutate({
                userEmail: user!.email,
                passwordData: {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                    confirmNewPassword: passwordData.newPassword
                }
            }, {
                onSuccess: (response) => {
                    if (response.success) {
                        Alert.alert('Success', 'Password changed successfully!')
                        setShowPasswordModal(false)
                        setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                        })
                    } else {
                        Alert.alert('Error', response.message || 'Failed to change password')
                    }
                },
                onError: (error: any) => {
                    console.error('Password change error:', error)
                    Alert.alert('Error', error.message || 'Failed to change password')
                }
            })
        } catch (error) {
            console.error('Password change error:', error)
            Alert.alert('Error', 'Failed to change password')
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <DetailHeader 
                title="Profile"
                subtitle="Manage your account and preferences"
                showBackButton={false}
            />
            
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Account Management Section */}
                <View className="px-4 py-6">
                    <View className="flex-row items-center mb-4">
                        <Text className="text-xl font-JakartaBold text-text">
                            Account
                        </Text>
                    </View>
                    
                    <View className="space-y-3">
                        <TouchableOpacity
                            onPress={() => router.push('/(root)/update-profile')}
                            className="flex-row items-center justify-between p-4 bg-surface rounded-xl shadow-sm"
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="bg-primary rounded-full p-3 mr-4">
                                    <Ionicons name="person-outline" size={20} color="white" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-text font-JakartaBold text-base mb-1">
                                        Personal Information
                                    </Text>
                                    <Text className="text-text-secondary text-sm">
                                        View and edit your account details
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            onPress={() => setShowPasswordModal(true)}
                            className="flex-row items-center justify-between p-4 bg-surface rounded-xl shadow-sm"
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="bg-accent rounded-full p-3 mr-4">
                                    <Ionicons name="lock-closed-outline" size={20} color="white" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-text font-JakartaBold text-base mb-1">
                                        Change Password
                                    </Text>
                                    <Text className="text-text-secondary text-sm">
                                        Update your account password
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Keeper Management Section */}
                {user?.role === 'KEEPER' && (
                    <View className="px-4 py-6">
                        <View className="flex-row items-center mb-4">
                            <Text className="text-xl font-JakartaBold text-text">
                                Storage Management
                            </Text>
                        </View>
                        
                        <View className="space-y-3">
                            <TouchableOpacity
                                onPress={() => router.push('/(root)/keeper-storages')}
                                className="flex-row items-center justify-between p-4 bg-surface rounded-xl shadow-sm"
                            >
                                <View className="flex-row items-center flex-1">
                                    <View className="bg-accent rounded-full p-3 mr-4">
                                        <Ionicons name="business" size={20} color="white" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-text font-JakartaBold text-base mb-1">
                                            My Storages
                                        </Text>
                                        <Text className="text-text-secondary text-sm">
                                            Manage your storage locations
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                onPress={() => setShowComingSoonModal(true)}
                                className="flex-row items-center justify-between p-4 bg-surface rounded-xl shadow-sm"
                            >
                                <View className="flex-row items-center flex-1">
                                    <View className="bg-purple-500 rounded-full p-3 mr-4">
                                        <Ionicons name="analytics" size={20} color="white" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-text font-JakartaBold text-base mb-1">
                                            Analytics
                                        </Text>
                                        <Text className="text-text-secondary text-sm">
                                            View revenue and statistics
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
                    <View className="px-4 py-6">
                        <View className="flex-row items-center mb-4">
                            <Text className="text-xl font-JakartaBold text-text">
                                Reviews & Feedback
                            </Text>
                        </View>
                        
                        <TouchableOpacity
                            onPress={() => router.push('/(root)/(tabs)/reviews')}
                            className="flex-row items-center justify-between p-4 bg-surface rounded-xl shadow-sm"
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="bg-yellow-500 rounded-full p-3 mr-4">
                                    <Ionicons name="star" size={20} color="white" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-text font-JakartaBold text-base mb-1">
                                        Review History
                                    </Text>
                                    <Text className="text-text-secondary text-sm">
                                        View your submitted reviews
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Settings Section */}
                <View className="px-4 py-6">
                    <View className="flex-row items-center mb-4">
                        <Text className="text-xl font-JakartaBold text-text">
                            Settings
                        </Text>
                    </View>
                    
                    <View className="space-y-3">
                        {/* Role Switcher - Only show if user has multiple roles */}
                        {user?.roles && user.roles.length > 1 && (
                            <TouchableOpacity
                                onPress={() => setShowRoleSwitcher(true)}
                                className="flex-row items-center justify-between p-4 bg-surface rounded-xl shadow-sm"
                            >
                                <View className="flex-row items-center flex-1">
                                    <View className="bg-purple-500 rounded-full p-3 mr-4">
                                        <Ionicons name="swap-horizontal" size={20} color="white" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-text font-JakartaBold text-base mb-1">
                                            Switch Role
                                        </Text>
                                        <Text className="text-text-secondary text-sm">
                                            Currently: {user?.activeRole || user?.role}
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                            </TouchableOpacity>
                        )}
                        
                        {/* Register Keeper - Only for RENTER role */}
                        {user?.role === 'RENTER' && (
                            <TouchableOpacity
                                onPress={() => router.push('/register-keeper')}
                                className="flex-row items-center justify-between p-4 bg-surface rounded-xl shadow-sm"
                            >
                                <View className="flex-row items-center flex-1">
                                    <View className="bg-green-500 rounded-full p-3 mr-4">
                                        <Ionicons name="business-outline" size={20} color="white" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-text font-JakartaBold text-base mb-1">
                                            Become a Keeper
                                        </Text>
                                        <Text className="text-text-secondary text-sm">
                                            Register to provide storage services
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                            </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity
                            onPress={() => setShowLogoutModal(true)}
                            className="flex-row items-center justify-between p-4 bg-surface rounded-xl shadow-sm"
                            disabled={loggingOut}
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="bg-danger rounded-full p-3 mr-4">
                                    <Ionicons name="log-out-outline" size={20} color="white" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-danger font-JakartaBold text-base mb-1">
                                        {loggingOut ? 'Logging out...' : 'Logout'}
                                    </Text>
                                    <Text className="text-text-secondary text-sm">
                                        Sign out of your account
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Logout Confirmation Modal */}
            <ConfirmationModal
                visible={showLogoutModal}
                title="Logout"
                message="Are you sure you want to logout?"
                confirmText="Logout"
                cancelText="Cancel"
                onConfirm={() => {
                    setShowLogoutModal(false)
                    handleLogout()
                }}
                onCancel={() => setShowLogoutModal(false)}
                confirmColor="#ef4444"
                icon="log-out"
                iconColor="#ef4444"
            />

            {/* Error Modal */}
            <CustomModal
                isVisible={showErrorModal}
                type="error"
                title="Error"
                message={errorMessage}
                buttonText="OK"
                onConfirm={() => setShowErrorModal(false)}
                onBackdropPress={() => setShowErrorModal(false)}
            />

            {/* Coming Soon Modal */}
            <CustomModal
                isVisible={showComingSoonModal}
                type="info"
                title="Coming Soon"
                message="Analytics feature will be available soon!"
                buttonText="OK"
                onConfirm={() => setShowComingSoonModal(false)}
                onBackdropPress={() => setShowComingSoonModal(false)}
            />

            {/* Password Change Modal */}
            <ReactNativeModal
                isVisible={showPasswordModal}
                onBackdropPress={() => setShowPasswordModal(false)}
                onBackButtonPress={() => setShowPasswordModal(false)}
                style={{ margin: 20 }}
            >
                <View className="bg-white rounded-2xl p-6">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-6">
                        <Text className="text-xl font-JakartaBold text-text">
                            Change Password
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowPasswordModal(false)}
                            className="p-2"
                        >
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                    
                    <View className="space-y-4">
                        <View>
                            <Text className="text-sm font-JakartaMedium text-text mb-2">
                                Current Password
                            </Text>
                            <TextInput
                                value={passwordData.currentPassword}
                                onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
                                secureTextEntry
                                placeholder="Enter current password"
                                className="bg-neutral-100 rounded-xl px-4 py-3 text-black font-JakartaMedium"
                            />
                        </View>
                        
                        <View>
                            <Text className="text-sm font-JakartaMedium text-text mb-2">
                                New Password
                            </Text>
                            <TextInput
                                value={passwordData.newPassword}
                                onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
                                secureTextEntry
                                placeholder="Enter new password"
                                className="bg-neutral-100 rounded-xl px-4 py-3 text-black font-JakartaMedium"
                            />
                        </View>
                        
                        <View>
                            <Text className="text-sm font-JakartaMedium text-text mb-2">
                                Confirm New Password
                            </Text>
                            <TextInput
                                value={passwordData.confirmPassword}
                                onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
                                secureTextEntry
                                placeholder="Confirm new password"
                                className="bg-neutral-100 rounded-xl px-4 py-3 text-black font-JakartaMedium"
                            />
                        </View>
                        
                        <View className="flex-row space-x-3 mt-6">
                            <TouchableOpacity
                                onPress={() => setShowPasswordModal(false)}
                                className="flex-1 bg-gray-200 rounded-xl py-3"
                            >
                                <Text className="text-center text-gray-700 font-JakartaBold">
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                onPress={handlePasswordChange}
                                disabled={changePasswordMutation.isPending}
                                className="flex-1 bg-primary rounded-xl py-3"
                            >
                                <Text className="text-center text-white font-JakartaBold">
                                    {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ReactNativeModal>

            {/* Role Switcher Modal */}
            <RoleSwitcher
                visible={showRoleSwitcher}
                onClose={() => setShowRoleSwitcher(false)}
            />
        </SafeAreaView>
    )
}

export default Profile
