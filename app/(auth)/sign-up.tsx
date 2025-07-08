import CustomButton from '@/components/CustomButton'
import DatePicker from '@/components/DatePicker'
import GenderPicker from '@/components/GenderPicker'
import InputField from '@/components/InputField'
import OAuth from '@/components/OAuth'
import { icons, images } from '@/constants'
import { fetchAPI } from '@/lib/fetch'
import { SignUpSchema, SignUpSchemaType } from '@/schema/auth.schema'
import {
    isClerkAPIResponseError,
    useSession,
    useSignUp,
} from '@clerk/clerk-expo'
import { ClerkAPIError } from '@clerk/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native'
import { ReactNativeModal } from 'react-native-modal'
import Ionicons from 'react-native-vector-icons/Ionicons'

const SignUp = () => {
    const form = useForm<SignUpSchemaType>({
        resolver: zodResolver(SignUpSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            dateOfBirth: '',
            gender: undefined,
        },
    })
    const { handleSubmit, setError } = form
    const { isLoaded, signUp, setActive } = useSignUp()
    const { session } = useSession()
    const [openEye, setOpenEye] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        dateOfBirth: '',
        phoneNumber: '',
        gender: undefined as
            | 'male'
            | 'female'
            | 'other'
            | 'prefer_not_to_say'
            | undefined,
    })
    const [verification, setVerification] = useState({
        state: 'default',
        error: '',
        code: '',
    })
    const [isVerifying, setIsVerifying] = useState(false) // Thêm trạng thái loading

    const toggleEye = () => setOpenEye((prev) => !prev)

    const mapClerkErrorToFormField = (error: ClerkAPIError) => {
        switch (error.meta?.paramName) {
            case 'name':
                return 'name'
            case 'email_address':
                return 'email'
            case 'gender':
                return 'gender'
            case 'date_of_birth':
                return 'dateOfBirth'
            case 'password':
                return 'password'
            case 'confirm_password':
                return 'confirmPassword'
            default:
                return 'root'
        }
    }

    const onSignUpPress = async (data: SignUpSchemaType) => {
        console.log(data)
        setUserData({
            name: data.name,
            email: data.email,
            dateOfBirth: data.dateOfBirth,
            phoneNumber: data.phoneNumber || '',
            gender: data.gender,
        })
        if (!isLoaded) return
        if (session) {
            Alert.alert(
                'Info',
                'You are already signed in. Please log out first.'
            )
            router.replace('/(root)/(tabs)/home')
            return
        }

        try {
            await signUp.create({
                emailAddress: data.email,
                password: data.password,
            })
            await signUp.prepareEmailAddressVerification({
                strategy: 'email_code',
            })
            setVerification({ ...verification, state: 'pending' })
        } catch (err: any) {
            console.log('Lỗi chi tiết:', JSON.stringify(err, null, 2))
            if (isClerkAPIResponseError(err)) {
                err.errors.forEach((error) => {
                    console.log('Error: ', JSON.stringify(error, null, 2))
                    const fieldName = mapClerkErrorToFormField(error)
                    setError(fieldName, {
                        message: error.longMessage,
                    })
                })
            }
            if (err.errors[0].code === 'form_password_incorrect') {
                Alert.alert(
                    'Error',
                    'Mật khẩu không đúng. Vui lòng thử lại hoặc sử dụng "Log In with Google" nếu bạn đã đăng ký qua Google.'
                )
            } else {
                console.log('Error:', err.errors[0].longMessage)
            }
        }
    }

    const onPressVerify = async () => {
        if (!isLoaded) return
        setIsVerifying(true)
        console.log('Verification code:', verification.code)
        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification(
                {
                    code: verification.code,
                }
            )
            if (completeSignUp.status === 'complete') {
                console.log(userData)
                await fetchAPI('/(api)/user', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: userData.name,
                        email: userData.email,
                        clerkId: completeSignUp.createdUserId,
                        dateOfBirth: userData.dateOfBirth,
                        phoneNumber: userData.phoneNumber,
                        gender: userData.gender,
                    }),
                })
                await setActive({ session: completeSignUp.createdSessionId })
                setVerification({ ...verification, state: 'success' })
            } else {
                setVerification({
                    ...verification,
                    error: 'Verification failed. Please check the code or try again.',
                    state: 'failed',
                })
                Alert.alert(
                    'Error',
                    'Verification failed. Please check the code or try again.'
                )
            }
            console.log('đã xác minh thành công:', completeSignUp)
        } catch (err: any) {
            console.log(JSON.stringify(err, null, 2))
            const errorMessage =
                err.errors?.[0]?.longMessage ||
                'Verification failed. Please try again.'
            setVerification({
                ...verification,
                error: errorMessage,
                state: 'failed',
            })
            Alert.alert('Error', errorMessage)
        } finally {
            setIsVerifying(false) // Kết thúc loading
        }
    }

    return (
        <FormProvider {...form}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView className="flex-1 bg-white">
                        <View className="flex-1 bg-white">
                            <View className="relative w-full h-[250px]">
                                <Image
                                    source={images.signUpCar}
                                    className="z-0 w-full h-[250px]"
                                />
                                <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
                                    Create Your Account
                                </Text>
                            </View>
                            <View className="p-5">
                                <InputField
                                    name="name"
                                    label="Name"
                                    placeholder="Enter name"
                                    icon={icons.person}
                                    autoCapitalize="none"
                                    textContentType="name"
                                />
                                <InputField
                                    name="email"
                                    label="Email"
                                    placeholder="Enter email"
                                    icon={icons.email}
                                    textContentType="emailAddress"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                <DatePicker
                                    name="dateOfBirth"
                                    label="Date Of Birth"
                                    placeholder="Select your date of birth"
                                    icon={icons.person}
                                />
                                <InputField
                                    name="phoneNumber"
                                    label="Phone Number"
                                    placeholder="Enter phone number (optional)"
                                    icon={icons.person}
                                    keyboardType="phone-pad"
                                    textContentType="telephoneNumber"
                                />
                                <GenderPicker name="gender" label="Gender" />
                                <View>
                                    <InputField
                                        name="password"
                                        label="Password"
                                        placeholder="Enter password"
                                        icon={icons.lock}
                                        secureTextEntry={!openEye}
                                        autoCapitalize="none"
                                        textContentType="password"
                                    />
                                    <TouchableOpacity
                                        onPress={toggleEye}
                                        className="absolute right-5 bottom-12"
                                    >
                                        <Ionicons
                                            name={
                                                openEye
                                                    ? 'eye-outline'
                                                    : 'eye-off-outline'
                                            }
                                            size={24}
                                            color="#949494"
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View>
                                    <InputField
                                        name="confirmPassword"
                                        label="Confirm Password"
                                        placeholder="Enter confirm password"
                                        icon={icons.lock}
                                        secureTextEntry={!openEye}
                                        autoCapitalize="none"
                                        textContentType="password"
                                    />
                                    <TouchableOpacity
                                        onPress={toggleEye}
                                        className="absolute right-5 bottom-12"
                                    >
                                        <Ionicons
                                            name={
                                                openEye
                                                    ? 'eye-outline'
                                                    : 'eye-off-outline'
                                            }
                                            size={24}
                                            color="#949494"
                                        />
                                    </TouchableOpacity>
                                </View>
                                <CustomButton
                                    title="Sign Up"
                                    onPress={handleSubmit(onSignUpPress)}
                                    className="mt-6"
                                />
                                <OAuth />
                                <Link
                                    href="/sign-in"
                                    className="text-lg text-center text-general-200 mt-10 mb-5"
                                >
                                    Already have an account?
                                    <Text className="text-primary-500">
                                        Log In
                                    </Text>
                                </Link>
                            </View>
                            <ReactNativeModal
                                isVisible={verification.state === 'pending'}
                                onModalHide={() => {
                                    if (verification.state === 'success')
                                        setShowSuccessModal(true)
                                }}
                            >
                                <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
                                    <Text className="font-JakartaExtraBold text-2xl mb-2">
                                        Verification
                                    </Text>
                                    <Text className="font-Jakarta mb-5">
                                        We&apos;ve sent a verification code to
                                        {userData.email}.
                                    </Text>
                                    <View className="my-2 w-full">
                                        <Text className="text-lg font-JakartaSemiBold mb-3">
                                            Code
                                        </Text>
                                        <View className="flex flex-row justify-start items-center relative bg-neutral-100 rounded-full border border-neutral-100 focus:border-primary-500">
                                            <Image
                                                source={icons.lock}
                                                className="w-6 h-6 ml-4"
                                            />
                                            <TextInput
                                                value={verification.code}
                                                onChangeText={(code) =>
                                                    setVerification({
                                                        ...verification,
                                                        code,
                                                    })
                                                }
                                                placeholder="123456"
                                                keyboardType="numeric"
                                                className="rounded-full p-4 font-JakartaSemiBold text-[15px] flex-1 text-left"
                                            />
                                        </View>
                                    </View>
                                    {verification.error && (
                                        <Text className="text-red-500 text-sm mt-1">
                                            {verification.error}
                                        </Text>
                                    )}
                                    <CustomButton
                                        title="Verify Email"
                                        onPress={onPressVerify}
                                        className="mt-5 bg-success-500"
                                        isLoading={isVerifying}
                                    />
                                </View>
                            </ReactNativeModal>
                            <ReactNativeModal isVisible={showSuccessModal}>
                                <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
                                    <Image
                                        source={images.check}
                                        className="w-[110px] h-[110px] mx-auto my-5"
                                    />
                                    <Text className="text-3xl font-JakartaBold text-center">
                                        Verified
                                    </Text>
                                    <Text className="text-base text-gray-400 font-Jakarta text-center mt-2">
                                        You have successfully verified your
                                        account.
                                    </Text>
                                    <CustomButton
                                        title="Browse Home"
                                        onPress={() => {
                                            setShowSuccessModal(false)
                                            router.push('/(root)/(tabs)/home')
                                        }}
                                        className="mt-5"
                                    />
                                </View>
                            </ReactNativeModal>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </FormProvider>
    )
}

export default SignUp
