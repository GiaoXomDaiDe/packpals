import { zodResolver } from '@hookform/resolvers/zod'
import { Link, router } from 'expo-router'
import { useCallback, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
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

import CustomModal from '@/components/CustomModal'
import InputField from '@/components/InputField'
import { icons } from '@/constants'
import { useLogin } from '@/hooks/query/useAuthQueries'
import useCustomModal from '@/hooks/useCustomModal'
import { SignInFormData, SignInSchema } from '@/lib/schemas/auth.schema'
import { useUserStore } from '@/store'

const SignIn = () => {
    const { setUser } = useUserStore()
    const [openEye, setOpenEye] = useState(false)
    const { modalState, showSuccess, showError, hideModal } = useCustomModal()

    const loginMutation = useLogin({
        onSuccess: (data) => {
            setUser(data.user, data.token)
            showSuccess(
                'Thành công',
                'Đăng nhập thành công!',
                'Tiếp tục'
            )
        },
        onError: (error: any) => {
            showError(
                'Lỗi đăng nhập',
                error.message || 'Đăng nhập thất bại. Vui lòng thử lại.'
            )
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
            form.clearErrors()
            loginMutation.mutate({
                email: data.email,
                password: data.password,
            })
        },
        [loginMutation, form]
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
                            {/* Header đơn giản */}
                            <View className="items-center pt-24 pb-8">
                                {/* Logo */}
                                <Text className="text-2xl font-JakartaBold text-blue-600 mb-2">
                                    PackPals
                                </Text>
                                
                                {/* Tiêu đề */}
                                <Text className="text-lg font-JakartaMedium text-gray-700">
                                    Chào mừng trở lại
                                </Text>
                            </View>

                            {/* Container form */}
                            <View className="px-6">
                                {/* Các trường form */}
                                <View className="space-y-4">
                                    {/* Trường Email */}
                                    <View>
                                        <Text className="text-gray-700 text-sm mb-1 font-JakartaMedium">Email</Text>
                                        <InputField
                                            name="email"
                                            label=""
                                            placeholder="Nhập email của bạn"
                                            icon={icons.email}
                                            textContentType="emailAddress"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>

                                    {/* Trường mật khẩu */}
                                    <View>
                                        <Text className="text-gray-700 text-sm mb-1 font-JakartaMedium">Mật khẩu</Text>
                                        <View className="relative">
                                            <InputField
                                                name="password"
                                                label=""
                                                placeholder="Nhập mật khẩu của bạn"
                                                icon={icons.lock}
                                                secureTextEntry={!openEye}
                                                autoCapitalize="none"
                                                textContentType="password"
                                            />
                                            <TouchableOpacity
                                                onPress={toggleEye}
                                                className="absolute right-4 top-2"
                                                style={{
                                                    height: 56,
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

                                {/* Nút đăng nhập */}
                                <TouchableOpacity
                                    onPress={handleSubmit(onSignInPress)}
                                    disabled={loginMutation.isPending}
                                    className="bg-blue-600 py-4 rounded-lg mt-6 mb-4"
                                >
                                    <Text className="text-white font-JakartaBold text-center text-base">
                                        {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Link quên mật khẩu */}
                                <View className="items-center mb-6">
                                    <Link href="/(auth)/forgot-password" asChild>
                                        <TouchableOpacity>
                                            <Text className="text-blue-600 font-JakartaMedium">
                                                Quên mật khẩu?
                                            </Text>
                                        </TouchableOpacity>
                                    </Link>
                                </View>

                                {/* Đường phân cách */}
                                <View className="flex-row items-center mb-6">
                                    <View className="flex-1 h-px bg-gray-300" />
                                    <Text className="mx-4 text-gray-500 text-sm font-Jakarta">
                                        hoặc
                                    </Text>
                                    <View className="flex-1 h-px bg-gray-300" />
                                </View>

                                {/* Liên kết đăng ký */}
                                <View className="items-center mb-8">
                                    <Link href="/sign-up" asChild>
                                        <TouchableOpacity>
                                            <Text className="text-gray-600 text-center font-Jakarta">
                                                Chưa có tài khoản?{' '}
                                                <Text className="text-blue-600 font-JakartaBold">
                                                    Đăng ký
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

            {/* Custom Modal */}
            <CustomModal
                isVisible={modalState.isVisible}
                type={modalState.type}
                title={modalState.title}
                message={modalState.message}
                buttonText={modalState.buttonText}
                onConfirm={() => {
                    hideModal()
                    if (modalState.type === 'success') {
                        loginMutation.reset()
                        router.replace('/(root)/(tabs)/home')
                    }
                }}
            />
        </FormProvider>
    )
}

export default SignIn
