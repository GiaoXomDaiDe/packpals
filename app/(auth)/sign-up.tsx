import InputField from '@/components/InputField'
import { icons } from '@/constants'
import { useRegister } from '@/lib/query/hooks/useAuthQueries'
import { SignUpFormData, SignUpSchema } from '@/lib/schemas/auth.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native'
import { ReactNativeModal } from 'react-native-modal'
import Ionicons from 'react-native-vector-icons/Ionicons'

const SignUp = () => {
    const [openEye, setOpenEye] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    
    const registerMutation = useRegister({
        onSuccess: () => {
            setShowSuccessModal(true)
        },
        onError: (error: any) => {
            console.error('Registration error:', error)
            
            const errorMessage = error.message || 'Registration failed. Please try again.'
            
            if (errorMessage.toLowerCase().includes('email')) {
                setError('email', { 
                    type: 'server', 
                    message: 'This email is already registered. Please use a different email.' 
                })
            } else if (errorMessage.toLowerCase().includes('username')) {
                setError('username', { 
                    type: 'server', 
                    message: 'This username is already taken. Please choose a different username.' 
                })
            } else if (errorMessage.toLowerCase().includes('phone')) {
                setError('phoneNumber', { 
                    type: 'server', 
                    message: 'This phone number is already registered.' 
                })
            } else if (errorMessage.toLowerCase().includes('password')) {
                setError('password', { 
                    type: 'server', 
                    message: 'Password does not meet requirements.' 
                })
            } else {
                Alert.alert('Registration Failed', errorMessage)
            }
        },
        onMutate: () => {
            clearAllErrors()
        }
    })
    
    const registerForm = useForm<SignUpFormData>({
        resolver: zodResolver(SignUpSchema),
        defaultValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            phoneNumber: '',
        },
    })
    const { handleSubmit, setError, clearErrors } = registerForm

    const toggleEye = () => setOpenEye((prev) => !prev)

    const clearAllErrors = () => {
        clearErrors(['email', 'username', 'phoneNumber', 'password', 'confirmPassword'])
    }

    const onSignUpPress = async (data: SignUpFormData) => {
        registerMutation.mutate({
            email: data.email,
            password: data.password,
            confirmPassword: data.confirmPassword,
            username: data.username,
            phoneNumber: data.phoneNumber,
        })
    }

    return (
        <FormProvider {...registerForm}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View className="flex-1 bg-white">
                        <ScrollView 
                            className="flex-1" 
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 50 }}
                        >
                            {/* Simple Header */}
                            <View className="items-center pt-16 pb-8">
                                {/* Logo */}
                                <Text className="text-2xl font-JakartaBold text-blue-600 mb-2">
                                    PackPals
                                </Text>
                                
                                {/* Title */}
                                <Text className="text-lg font-JakartaMedium text-gray-700">
                                    Create your account
                                </Text>
                            </View>

                            {/* Form Container */}
                            <View className="px-6">
                                {/* Form Fields */}
                                <View className="space-y-4">
                                    <View>
                                        <Text className="text-gray-700 text-sm mb-1 font-JakartaMedium">Username</Text>
                                        <InputField
                                            name="username"
                                            label=""
                                            placeholder="Enter your username"
                                            icon={icons.person}
                                            autoCapitalize="none"
                                            textContentType="username"
                                        />
                                    </View>

                                    <View>
                                        <Text className="text-gray-700 text-sm mb-1 font-JakartaMedium">Email</Text>
                                        <InputField
                                            name="email"
                                            label=""
                                            placeholder="Enter your email"
                                            icon={icons.email}
                                            textContentType="emailAddress"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>

                                    <View>
                                        <Text className="text-gray-700 text-sm mb-1 font-JakartaMedium">Phone Number</Text>
                                        <InputField
                                            name="phoneNumber"
                                            label=""
                                            placeholder="Enter your phone number"
                                            icon={icons.person}
                                            keyboardType="phone-pad"
                                            textContentType="telephoneNumber"
                                        />
                                    </View>

                                    <View>
                                        <Text className="text-gray-700 text-sm mb-1 font-JakartaMedium">Password</Text>
                                        <View className="relative">
                                            <InputField
                                                name="password"
                                                label=""
                                                placeholder="Enter your password"
                                                icon={icons.lock}
                                                secureTextEntry={!openEye}
                                                autoCapitalize="none"
                                                textContentType="password"
                                            />
                                            <TouchableOpacity
                                                onPress={toggleEye}
                                                className="absolute right-4 top-2"
                                                style={{
                                                    height: 56, // Fixed height to match input field height
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    width: 24,
                                                }}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Ionicons
                                                    name={openEye ? 'eye-outline' : 'eye-off-outline'}
                                                    size={20}
                                                    color="#9ca3af"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View>
                                        <Text className="text-gray-700 text-sm mb-1 font-JakartaMedium">Confirm Password</Text>
                                        <View className="relative">
                                            <InputField
                                                name="confirmPassword"
                                                label=""
                                                placeholder="Confirm your password"
                                                icon={icons.lock}
                                                secureTextEntry={!openEye}
                                                autoCapitalize="none"
                                                textContentType="password"
                                            />
                                            <TouchableOpacity
                                                onPress={toggleEye}
                                                className="absolute right-4 top-2"
                                                style={{
                                                    height: 56, // Fixed height to match input field height
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    width: 24,
                                                }}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Ionicons
                                                    name={openEye ? 'eye-outline' : 'eye-off-outline'}
                                                    size={20}
                                                    color="#9ca3af"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>

                                {/* Sign Up Button */}
                                <TouchableOpacity
                                    onPress={handleSubmit(onSignUpPress)}
                                    disabled={registerMutation.isPending}
                                    className="bg-blue-600 py-4 rounded-lg mt-6 mb-6"
                                >
                                    <Text className="text-white font-JakartaBold text-center text-base">
                                        {registerMutation.isPending ? 'Creating Account...' : 'Sign Up'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Or Divider */}
                                <View className="flex-row items-center mb-6">
                                    <View className="flex-1 h-px bg-gray-300" />
                                    <Text className="mx-4 text-gray-500 text-sm font-Jakarta">
                                        or
                                    </Text>
                                    <View className="flex-1 h-px bg-gray-300" />
                                </View>

                                {/* Social Login */}
                                {/* <OAuth /> */}

                                {/* Sign In Link */}
                                <View className="items-center mb-8">
                                    <Link href="/sign-in" asChild>
                                        <TouchableOpacity>
                                            <Text className="text-gray-600 text-center font-Jakarta">
                                                Already have an account?{' '}
                                                <Text className="text-blue-600 font-JakartaBold">
                                                    Sign In
                                                </Text>
                                            </Text>
                                        </TouchableOpacity>
                                    </Link>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Success Modal */}
                        <ReactNativeModal 
                            isVisible={showSuccessModal}
                            animationIn="slideInUp"
                            animationOut="slideOutDown"
                            backdropOpacity={0.5}
                            backdropColor="#000"
                            onBackdropPress={() => {}}
                            onBackButtonPress={() => {}}
                        >
                            <View className="flex-1 justify-center px-6">
                                <View className="bg-white rounded-2xl p-8 items-center">
                                    <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
                                        <Ionicons name="checkmark-circle" size={40} color="#10b981" />
                                    </View>
                                    
                                    <Text className="text-2xl font-JakartaBold text-gray-900 text-center mb-3">
                                        Account Created Successfully!
                                    </Text>
                                    
                                    <Text className="text-gray-600 text-center mb-8 font-Jakarta leading-6">
                                        Welcome to PackPals! Your account has been created successfully. Please sign in to continue.
                                    </Text>
                                    
                                    <TouchableOpacity
                                        onPress={() => {
                                            setShowSuccessModal(false)
                                            router.replace('/(auth)/sign-in')
                                        }}
                                        className="bg-blue-600 py-4 px-8 rounded-lg w-full"
                                    >
                                        <Text className="text-white font-JakartaBold text-center text-base">
                                            Continue to Sign In
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ReactNativeModal>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </FormProvider>
    )
}

export default SignUp
