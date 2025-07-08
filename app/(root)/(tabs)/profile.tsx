import { useUser } from '@clerk/clerk-expo'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as z from 'zod'

import CustomButton from '@/components/CustomButton'
import DatePicker from '@/components/DatePicker'
import InputField from '@/components/InputField'
import { fetchAPI } from '@/lib/fetch'
import { ImageUploadService } from '@/lib/imageUpload'
import { UploadcareService } from '@/lib/uploadcareService'

// Profile update schema
const ProfileUpdateSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .max(50, 'Name must be less than 50 characters'),
    dateOfBirth: z
        .string()
        .optional()
        .refine(
            (value) => {
                if (!value) return true
                const date = new Date(value)
                return date < new Date()
            },
            {
                message: 'Date of birth must be in the past',
            }
        ),
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
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
})

type ProfileUpdateSchemaType = z.infer<typeof ProfileUpdateSchema>

interface UserProfile {
    name: string
    email: string
    clerk_id: string
    date_of_birth?: string
    profile_image_url?: string
    phone_number?: string
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
}

const Profile = () => {
    const { user } = useUser()
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [editing, setEditing] = useState(false)

    // React Hook Form setup
    const form = useForm<ProfileUpdateSchemaType>({
        resolver: zodResolver(ProfileUpdateSchema),
        defaultValues: {
            name: '',
            dateOfBirth: '',
            phoneNumber: '',
            gender: undefined,
        },
    })

    const { handleSubmit, reset } = form

    const fetchUserProfile = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetchAPI(`/(api)/user?clerkId=${user?.id}`, {
                method: 'GET',
            })

            if (response.data) {
                setUserProfile(response.data)
                reset({
                    name: response.data.name || '',
                    dateOfBirth: response.data.date_of_birth || '',
                    phoneNumber: response.data.phone_number || '',
                    gender: response.data.gender || undefined,
                })
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
        } finally {
            setLoading(false)
        }
    }, [user?.id, reset])

    useEffect(() => {
        if (user?.id) {
            fetchUserProfile()
        }
    }, [user?.id, fetchUserProfile])

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Not provided'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    const calculateAge = (dateString: string) => {
        if (!dateString) return null
        const birthDate = new Date(dateString)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()

        if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
            age--
        }

        return age
    }

    const handleImageUpload = async () => {
        try {
            const imageResult = await ImageUploadService.pickImage({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            })

            if (imageResult) {
                const resizedImage = await ImageUploadService.resizeImage(
                    imageResult,
                    400
                )
                if (resizedImage) {
                    const base64DataURL =
                        await ImageUploadService.convertToBase64DataURL(
                            resizedImage
                        )
                    if (base64DataURL) {
                        // Upload to Uploadcare instead of saving base64
                        const uploadedUrl =
                            await UploadcareService.uploadImageWithTransform(
                                base64DataURL,
                                '-/resize/400x400/-/quality/smart/-/format/webp/'
                            )

                        if (uploadedUrl) {
                            await updateProfile({
                                profileImageUrl: uploadedUrl,
                            })
                        } else {
                            // Fallback to base64 if upload fails
                            await updateProfile({
                                profileImageUrl: base64DataURL,
                            })
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error uploading image:', error)
            Alert.alert('Error', 'Failed to upload image. Please try again.')
        }
    }

    const updateProfile = async (updates: {
        name?: string
        dateOfBirth?: string
        profileImageUrl?: string
        phoneNumber?: string
    }) => {
        try {
            setUpdating(true)

            const response = await fetchAPI('/(api)/user', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clerkId: user?.id,
                    ...updates,
                }),
            })

            if (response.success) {
                setUserProfile(response.data)
                Alert.alert('Success', 'Profile updated successfully!')
                setEditing(false)
            } else {
                throw new Error(response.error || 'Failed to update profile')
            }
        } catch (error) {
            console.error('Error updating profile:', error)
            Alert.alert('Error', 'Failed to update profile')
        } finally {
            setUpdating(false)
        }
    }

    const handleSaveProfile = async (data: ProfileUpdateSchemaType) => {
        await updateProfile({
            name: data.name,
            dateOfBirth: data.dateOfBirth,
            phoneNumber: data.phoneNumber,
        })
        setEditing(false)
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
                    <TouchableOpacity onPress={handleImageUpload}>
                        <Image
                            source={{
                                uri:
                                    userProfile?.profile_image_url ||
                                    (user?.externalAccounts[0]?.imageUrl ??
                                        user?.imageUrl),
                            }}
                            style={{
                                width: 110,
                                height: 110,
                                borderRadius: 110 / 2,
                            }}
                            className=" rounded-full h-[110px] w-[110px] border-[3px] border-white shadow-sm shadow-neutral-300"
                        />
                        <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2">
                            <Text className="text-white text-xs font-bold">
                                📷
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <Text className="text-xs text-gray-500 mt-2">
                        Tap to change profile picture
                    </Text>
                </View>

                <View className="flex flex-col items-start justify-center bg-white rounded-lg shadow-sm shadow-neutral-300 px-5 py-3">
                    <View className="flex flex-col items-start justify-start w-full">
                        {editing ? (
                            <FormProvider {...form}>
                                <InputField
                                    name="name"
                                    label="Full Name"
                                    placeholder="Enter your name"
                                    containerStyle="w-full"
                                    inputStyle="p-3.5"
                                />

                                <DatePicker
                                    name="dateOfBirth"
                                    label="Date of Birth"
                                    placeholder="Select your date of birth"
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
                                                name: userProfile?.name || '',
                                                dateOfBirth:
                                                    userProfile?.date_of_birth ||
                                                    '',
                                                phoneNumber:
                                                    userProfile?.phone_number ||
                                                    '',
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
                                    label="Full Name"
                                    placeholder={
                                        userProfile?.name ||
                                        user?.fullName ||
                                        'Not Found'
                                    }
                                    containerStyle="w-full"
                                    inputStyle="p-3.5"
                                    editable={false}
                                />

                                <InputField
                                    label="Email"
                                    placeholder={
                                        userProfile?.email ||
                                        user?.primaryEmailAddress
                                            ?.emailAddress ||
                                        'Not Found'
                                    }
                                    containerStyle="w-full"
                                    inputStyle="p-3.5"
                                    editable={false}
                                />

                                <InputField
                                    label="Date of Birth"
                                    placeholder={formatDate(
                                        userProfile?.date_of_birth || ''
                                    )}
                                    containerStyle="w-full"
                                    inputStyle="p-3.5"
                                    editable={false}
                                />

                                {userProfile?.date_of_birth && (
                                    <View className="w-full mb-4">
                                        <Text className="text-sm text-gray-600 mb-1">
                                            Age
                                        </Text>
                                        <Text className="text-base bg-gray-100 p-3.5 rounded-lg">
                                            {calculateAge(
                                                userProfile.date_of_birth
                                            )}{' '}
                                            years old
                                        </Text>
                                    </View>
                                )}

                                <InputField
                                    label="Phone"
                                    placeholder={
                                        userProfile?.phone_number ||
                                        'Not provided'
                                    }
                                    containerStyle="w-full"
                                    inputStyle="p-3.5"
                                    editable={false}
                                />
                            </>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Profile
