import CustomModal from '@/components/CustomModal'
import InputField from '@/components/InputField'
import { icons } from '@/constants'
import { useRegister } from '@/hooks/query/useAuthQueries'
import { SignUpFormData, SignUpSchema } from '@/lib/schemas/auth.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'

const SignUp = () => {
    const [openEye, setOpenEye] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [errorModal, setErrorModal] = useState({ isVisible: false, message: '' })
    
    const registerMutation = useRegister({
        onSuccess: () => {
            setShowSuccessModal(true)
        },
        onError: (error: any) => {
            console.error('Lỗi đăng ký:', error)
            
            const errorMessage = error.message || 'Đăng ký thất bại. Vui lòng thử lại.'
            
            setErrorModal({
                isVisible: true,
                message: errorMessage
            })
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
    const { handleSubmit, clearErrors } = registerForm

    const toggleEye = () => setOpenEye((prev) => !prev)

    const clearAllErrors = () => {
        clearErrors(['email', 'username', 'phoneNumber', 'password', 'confirmPassword'])
    }

    const onSignUpPress = async (data: SignUpFormData) => {
        clearAllErrors() // Clear errors trước khi gọi API
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
                            {/* Header đơn giản */}
                            <View className="items-center pt-24 pb-8">
                                {/* Logo */}
                                <Text className="text-2xl font-JakartaBold text-blue-600 mb-2">
                                    PackPals
                                </Text>
                                
                                {/* Tiêu đề */}
                                <Text className="text-lg font-JakartaMedium text-gray-700">
                                    Tạo tài khoản của bạn
                                </Text>
                            </View>

                            {/* Container form */}
                            <View className="px-6">
                                {/* Các trường form */}
                                <View className="space-y-4">
                                    <View>
                                        <Text className="text-gray-700 text-sm mb-1 font-JakartaMedium">Tên người dùng</Text>
                                        <InputField
                                            name="username"
                                            label=""
                                            placeholder="Nhập tên người dùng"
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
                                            placeholder="Nhập email của bạn"
                                            icon={icons.email}
                                            textContentType="emailAddress"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-gray-700 text-sm mb-1 font-JakartaMedium">Số điện thoại</Text>
                                        <InputField
                                            name="phoneNumber"
                                            label=""
                                            placeholder="Nhập số điện thoại"
                                            icon={icons.person}
                                            keyboardType="phone-pad"
                                            textContentType="telephoneNumber"
                                        />
                                    </View>
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
                                    <View>
                                        <Text className="text-gray-700 text-sm mb-1 font-JakartaMedium">Xác nhận mật khẩu</Text>
                                        <View className="relative">
                                            <InputField
                                                name="confirmPassword"
                                                label=""
                                                placeholder="Xác nhận mật khẩu của bạn"
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

                                {/* Nút đăng ký */}
                                <TouchableOpacity
                                    onPress={handleSubmit(onSignUpPress)}
                                    disabled={registerMutation.isPending}
                                    className="bg-blue-600 py-4 rounded-lg mt-6 mb-6"
                                >
                                    <Text className="text-white font-JakartaBold text-center text-base">
                                        {registerMutation.isPending ? 'Đang tạo tài khoản...' : 'Đăng ký'}
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

                                {/* Liên kết đăng nhập */}
                                <View className="items-center mb-8">
                                    <Link href="/sign-in" asChild>
                                        <TouchableOpacity>
                                            <Text className="text-gray-600 text-center font-Jakarta">
                                                Đã có tài khoản?{' '}
                                                <Text className="text-blue-600 font-JakartaBold">
                                                    Đăng nhập
                                                </Text>
                                            </Text>
                                        </TouchableOpacity>
                                    </Link>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Modal thành công */}
                        <CustomModal
                            isVisible={showSuccessModal}
                            type="success"
                            title="Tạo tài khoản thành công!"
                            message="Chào mừng đến với PackPals! Tài khoản của bạn đã được tạo thành công. Vui lòng đăng nhập để tiếp tục."
                            buttonText="Tiếp tục đăng nhập"
                            onConfirm={() => {
                                setShowSuccessModal(false)
                                router.replace('/(auth)/sign-in')
                            }}
                        />

                        {/* Error Modal */}
                        <CustomModal
                            isVisible={errorModal.isVisible}
                            type="error"
                            title="Đăng ký thất bại"
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

export default SignUp
