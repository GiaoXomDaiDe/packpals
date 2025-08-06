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
import { useForgotPassword } from '@/hooks/query/useAuthQueries'
import { ForgotPasswordFormData, ForgotPasswordSchema } from '@/lib/schemas/auth.schema'

const ForgotPassword = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [errorModal, setErrorModal] = useState({ isVisible: false, message: '' })

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(ForgotPasswordSchema),
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: '',
        },
    })

    const { handleSubmit, clearErrors } = form

    const forgotPasswordMutation = useForgotPassword({
        onSuccess: () => {
            setShowSuccessModal(true)
        },
        onError: (error: any) => {
            console.error('Lỗi đặt lại mật khẩu:', error)
            
            const errorMessage = error.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.'
            
            setErrorModal({
                isVisible: true,
                message: errorMessage
            })
        }
    })

    const togglePasswordVisibility = () => setShowPassword(prev => !prev)

    const onSubmit = useCallback(
        async (data: ForgotPasswordFormData) => {
            clearErrors(['email', 'password', 'confirmPassword'])
            forgotPasswordMutation.mutate({
                userEmail: data.email,
                passwordData: {
                    newPassword: data.password,
                    confirmNewPassword: data.confirmPassword
                }
            })
        },
        [forgotPasswordMutation, clearErrors]
    )

    const renderPasswordField = (
        name: 'password' | 'confirmPassword',
        label: string,
        placeholder: string
    ) => (
        <View>
            <Text className="text-gray-700 text-sm mb-1 font-JakartaMedium">{label}</Text>
            <View className="relative">
                <InputField
                    name={name}
                    label=""
                    placeholder={placeholder}
                    icon={icons.lock}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    textContentType="newPassword"
                />
                <TouchableOpacity
                    onPress={togglePasswordVisibility}
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
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#9ca3af"
                    />
                </TouchableOpacity>
            </View>
        </View>
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
                            {/* Header */}
                            <View className="items-center pt-24 pb-8">
                                {/* Icon back */}
                                <View className="absolute left-6 top-24">
                                    <TouchableOpacity 
                                        onPress={() => router.back()}
                                        className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
                                    >
                                        <Ionicons name="arrow-back" size={20} color="#374151" />
                                    </TouchableOpacity>
                                </View>

                                {/* Logo */}
                                <Text className="text-2xl font-JakartaBold text-blue-600 mb-2">
                                    PackPals
                                </Text>
                                
                                {/* Tiêu đề */}
                                <Text className="text-lg font-JakartaMedium text-gray-700">
                                    Đặt lại mật khẩu
                                </Text>
                                
                                {/* Mô tả */}
                                <Text className="text-sm text-gray-500 text-center mt-2 px-8">
                                    Nhập email và mật khẩu mới để đặt lại mật khẩu của bạn
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

                                    {/* Trường mật khẩu mới */}
                                    {renderPasswordField('password', 'Mật khẩu mới', 'Nhập mật khẩu mới')}

                                    {/* Trường xác nhận mật khẩu mới */}
                                    {renderPasswordField('confirmPassword', 'Xác nhận mật khẩu mới', 'Xác nhận mật khẩu mới')}
                                </View>

                                {/* Nút đặt lại mật khẩu */}
                                <TouchableOpacity
                                    onPress={handleSubmit(onSubmit)}
                                    disabled={forgotPasswordMutation.isPending}
                                    className="bg-blue-600 py-4 rounded-lg mt-6 mb-6"
                                >
                                    <Text className="text-white font-JakartaBold text-center text-base">
                                        {forgotPasswordMutation.isPending ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Đường phân cách */}
                                <View className="flex-row items-center mb-6">
                                    <View className="flex-1 h-px bg-gray-300" />
                                    <Text className="mx-4 text-gray-500 text-sm font-Jakarta">
                                        hoặc
                                    </Text>
                                    <View className="flex-1 h-px bg-gray-300" />
                                </View>

                                {/* Liên kết quay về đăng nhập */}
                                <View className="items-center mb-8">
                                    <Link href="/(auth)/sign-in" asChild>
                                        <TouchableOpacity>
                                            <Text className="text-gray-600 text-center font-Jakarta">
                                                Nhớ mật khẩu?{' '}
                                                <Text className="text-blue-600 font-JakartaBold">
                                                    Quay về đăng nhập
                                                </Text>
                                            </Text>
                                        </TouchableOpacity>
                                    </Link>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Success Modal */}
                        <CustomModal
                            isVisible={showSuccessModal}
                            type="success"
                            title="Đặt lại mật khẩu thành công!"
                            message="Mật khẩu của bạn đã được đặt lại thành công. Vui lòng đăng nhập bằng mật khẩu mới."
                            buttonText="Tiếp tục đăng nhập"
                            onConfirm={() => {
                                setShowSuccessModal(false)
                                forgotPasswordMutation.reset()
                                router.replace('/(auth)/sign-in')
                            }}
                        />

                        {/* Error Modal */}
                        <CustomModal
                            isVisible={errorModal.isVisible}
                            type="error"
                            title="Lỗi"
                            message={errorModal.message}
                            onConfirm={() => {
                                setErrorModal({ isVisible: false, message: '' })
                            }}
                        />
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </FormProvider>
    )
}

export default ForgotPassword
