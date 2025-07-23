import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as z from 'zod'

import CustomButton from '@/components/CustomButton'
import InputField from '@/components/InputField'
import { useUserStore } from '@/store'
import { router } from 'expo-router'
import Ionicons from 'react-native-vector-icons/Ionicons'

// Profile update schema
const ProfileUpdateSchema = z.object({
    username: z
        .string()
        .min(1, 'Username is required')
        .max(50, 'Username must be less than 50 characters'),
    phoneNumber: z
        .string()
        .optional()
        .refine(
            (value) => {
                if (!value || value.trim() === '') return true
                const phoneRegex = /^[+]?[(]?[\d\s\-\(\)]{10,}$/
                return phoneRegex.test(value)
            },
            {
                message: 'Please enter a valid phone number',
            }
        ),
})

type ProfileUpdateSchemaType = z.infer<typeof ProfileUpdateSchema>

const Profile = () => {
    const { user } = useUserStore()
    const [loading, setLoading] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [editing, setEditing] = useState(false)

    // React Hook Form setup
    const form = useForm<ProfileUpdateSchemaType>({
        resolver: zodResolver(ProfileUpdateSchema),
        defaultValues: {
            username: user?.username || '',
            phoneNumber: user?.phoneNumber || '',
        },
    })

    const { handleSubmit, reset } = form

    useEffect(() => {
        if (user) {
            reset({
                username: user.username,
                phoneNumber: user.phoneNumber,
            })
        }
    }, [user, reset])

    const updateProfile = async (data: ProfileUpdateSchemaType) => {
        try {
            setUpdating(true)
            // TODO: Implement profile update API call
            Alert.alert('Info', 'Profile update will be implemented with backend integration.')
            setEditing(false)
        } catch (error) {
            console.error('Error updating profile:', error)
            Alert.alert('Error', 'Failed to update profile')
        } finally {
            setUpdating(false)
        }
    }

    const handleSaveProfile = async (data: ProfileUpdateSchemaType) => {
        await updateProfile(data)
    }

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#0286FF" />
                    <Text className="mt-2 text-gray-600">
                        Loading profile...
                    </Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1">
            <ScrollView
                className="px-5"
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                <View className="flex-row justify-between items-center py-5">
                    <Text className="text-2xl font-JakartaBold">
                        My Profile
                    </Text>
                    <TouchableOpacity
                        onPress={() => setEditing(!editing)}
                        className="bg-blue-100 px-4 py-2 rounded-lg"
                        disabled={updating}
                    >
                        <Text className="text-blue-600 font-JakartaMedium">
                            {editing ? 'Cancel' : 'Edit'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="flex items-center justify-center my-5">
                    <View>
                        <View
                            style={{
                                width: 110,
                                height: 110,
                                borderRadius: 110 / 2,
                                backgroundColor: '#E5E7EB',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                            className="rounded-full h-[110px] w-[110px] border-[3px] border-white shadow-sm shadow-neutral-300"
                        >
                            <Text className="text-4xl text-gray-600">
                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                    </View>
                    <Text className="text-xs text-gray-500 mt-2">
                        Profile picture coming soon
                    </Text>
                </View>

                <View className="flex flex-col items-start justify-center bg-white rounded-lg shadow-sm shadow-neutral-300 px-5 py-3">
                    <View className="flex flex-col items-start justify-start w-full">
                        {editing ? (
                            <FormProvider {...form}>
                                <InputField
                                    name="username"
                                    label="Username"
                                    placeholder="Enter your username"
                                    containerStyle="w-full"
                                    inputStyle="p-3.5"
                                />

                                <InputField
                                    name="phoneNumber"
                                    label="Phone Number"
                                    placeholder="Enter your phone number"
                                    containerStyle="w-full"
                                    inputStyle="p-3.5"
                                    keyboardType="phone-pad"
                                />

                                <View className="flex-row space-x-3 mt-4 w-full gap-3">
                                    <CustomButton
                                        title={
                                            updating
                                                ? 'Saving...'
                                                : 'Save Changes'
                                        }
                                        onPress={handleSubmit(
                                            handleSaveProfile
                                        )}
                                        className="flex-1 bg-green-500"
                                        isLoading={updating}
                                    />
                                    <CustomButton
                                        title="Cancel"
                                        onPress={() => {
                                            setEditing(false)
                                            reset({
                                                username: user?.username || '',
                                                phoneNumber: user?.phoneNumber || '',
                                            })
                                        }}
                                        className="flex-1 bg-gray-500"
                                        disabled={updating}
                                    />
                                </View>
                            </FormProvider>
                        ) : (
                            <>
                                <InputField
                                    label="Username"
                                    placeholder={user?.username || 'Not Found'}
                                    containerStyle="w-full"
                                    inputStyle="p-3.5"
                                    editable={false}
                                />

                                <InputField
                                    label="Email"
                                    placeholder={user?.email || 'Not Found'}
                                    containerStyle="w-full"
                                    inputStyle="p-3.5"
                                    editable={false}
                                />

                                <InputField
                                    label="Role"
                                    placeholder={user?.role || 'Not Found'}
                                    containerStyle="w-full"
                                    inputStyle="p-3.5"
                                    editable={false}
                                />

                                <InputField
                                    label="Phone"
                                    placeholder={user?.phoneNumber || 'Not provided'}
                                    containerStyle="w-full"
                                    inputStyle="p-3.5"
                                    editable={false}
                                />
                            </>
                        )}
                    </View>
                </View>

                {/* Keeper Management Section */}
                {user?.role === 'KEEPER' && (
                    <View className="mt-6 bg-white rounded-lg shadow-sm shadow-neutral-300 px-5 py-4">
                        <Text className="text-lg font-JakartaBold mb-4 text-gray-900">
                            Storage Management
                        </Text>
                        
                        <TouchableOpacity
                            onPress={() => router.push('/(root)/keeper-storages')}
                            className="flex-row items-center justify-between p-4 bg-blue-50 rounded-lg mb-3"
                        >
                            <View className="flex-row items-center">
                                <View className="bg-blue-600 rounded-full p-2 mr-3">
                                    <Ionicons name="business" size={20} color="white" />
                                </View>
                                <View>
                                    <Text className="text-blue-900 font-JakartaBold">
                                        My Storages
                                    </Text>
                                    <Text className="text-blue-700 text-sm">
                                        Manage your storage locations
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#2563eb" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            onPress={() => {
                                Alert.alert('Coming Soon', 'Storage analytics feature will be available soon!')
                            }}
                            className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                            <View className="flex-row items-center">
                                <View className="bg-gray-600 rounded-full p-2 mr-3">
                                    <Ionicons name="analytics" size={20} color="white" />
                                </View>
                                <View>
                                    <Text className="text-gray-900 font-JakartaBold">
                                        Analytics
                                    </Text>
                                    <Text className="text-gray-600 text-sm">
                                        View earnings and statistics
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

export default Profile
