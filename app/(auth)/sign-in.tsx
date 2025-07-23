import { zodResolver } from '@hookform/resolvers/zod'
import { Link, router } from 'expo-router'
import { useCallback, useState } from 'react'
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
    View
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'

import InputField from '@/components/InputField'
import { icons } from '@/constants'
import { useLogin } from '@/lib/query/hooks/useAuthQueries'
import { SignInFormData, SignInSchema } from '@/lib/schemas/auth.schema'
import { useUserStore } from '@/store'

const SignIn = () => {
    const { setUser } = useUserStore()
    const [openEye, setOpenEye] = useState(false)

    const loginMutation = useLogin({
        onSuccess: (data) => {
            setUser(data.user, data.token)
            Alert.alert('Success', 'Login successful!', [
                {
                    text: 'OK',
                    onPress: () => {
                        loginMutation.reset()
                        router.replace('/(root)/(tabs)/home')
                    }
                }
            ])
        },
        onError: (error: any) => {
            if (error.message && error.message.includes('email')) {
                form.setError('email', { message: error.message })
            } else if (error.message && error.message.includes('password')) {
                form.setError('password', { message: error.message })
            } else {
                Alert.alert('Error', error.message || 'Login failed. Please try again.')
            }
        },
        onMutate: (variables) => {
            form.clearErrors()
        }
    })

    const form = useForm<SignInFormData>({
        resolver: zodResolver(SignInSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const { handleSubmit } = form

    const toggleEye = () => setOpenEye((prev) => !prev)

    const onSignInPress = useCallback(
        async (data: SignInFormData) => {
            loginMutation.mutate({
                email: data.email,
                password: data.password,
            })
        },
        [loginMutation]
    )

    return (
        <FormProvider {...form}>
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
                                    Welcome back
                                </Text>

                            </View>

                            {/* Form Container */}
                            <View className="px-6">
                                {/* Form Fields */}
                                <View className="space-y-4">
                                    {/* Email Field */}
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

                                    {/* Password Field */}
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
                                </View>

                                {/* Sign In Button */}
                                <TouchableOpacity
                                    onPress={handleSubmit(onSignInPress)}
                                    disabled={loginMutation.isPending}
                                    className="bg-blue-600 py-4 rounded-lg mt-6 mb-6"
                                >
                                    <Text className="text-white font-JakartaBold text-center text-base">
                                        {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
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

                                {/* Sign Up Link */}
                                <View className="items-center mb-8">
                                    <Link href="/sign-up" asChild>
                                        <TouchableOpacity>
                                            <Text className="text-gray-600 text-center font-Jakarta">
                                                Don&apos;t have an account?{' '}
                                                <Text className="text-blue-600 font-JakartaBold">
                                                    Sign Up
                                                </Text>
                                            </Text>
                                        </TouchableOpacity>
                                    </Link>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </FormProvider>
    )
}

export default SignIn
