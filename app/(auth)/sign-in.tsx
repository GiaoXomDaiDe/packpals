import { useSession, useSignIn } from '@clerk/clerk-expo'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, router } from 'expo-router'
import { useCallback } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Alert, Image, ScrollView, Text, View } from 'react-native'
import * as z from 'zod'

import CustomButton from '@/components/CustomButton'
import InputField from '@/components/InputField'
import OAuth from '@/components/OAuth'
import { icons, images } from '@/constants'

// Sign-in schema
const SignInSchema = z.object({
    email: z.string().email('Invalid email format').min(1, 'Email is required'),
    password: z.string().min(1, 'Password is required'),
})

type SignInSchemaType = z.infer<typeof SignInSchema>

const SignIn = () => {
    const { signIn, setActive, isLoaded } = useSignIn()
    const { session } = useSession()

    // React Hook Form setup
    const form = useForm<SignInSchemaType>({
        resolver: zodResolver(SignInSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const { handleSubmit } = form

    // useEffect(() => {
    //     if (session) {
    //         router.replace('/(root)/(tabs)/home')
    //     }
    // }, [session])

    const onSignInPress = useCallback(
        async (data: SignInSchemaType) => {
            if (!isLoaded) return

            if (session) {
                Alert.alert('Info', 'You are already signed in.')
                router.replace('/(root)/(tabs)/home')
                return
            }

            try {
                console.log('Da vao duoc vao day')
                const signInAttempt = await signIn.create({
                    identifier: data.email,
                    password: data.password,
                })

                if (signInAttempt.status === 'complete') {
                    await setActive({ session: signInAttempt.createdSessionId })
                    router.replace('/(root)/(tabs)/home')
                } else {
                    console.log(JSON.stringify(signInAttempt, null, 2))
                    Alert.alert('Error', 'Log in failed. Please try again.')
                }
            } catch (err: any) {
                console.log(JSON.stringify(err, null, 2))
                Alert.alert('Error', err.errors[0].longMessage)
            }
        },
        [isLoaded, session, signIn, setActive]
    )

    return (
        <ScrollView className="flex-1 bg-white">
            <View className="flex-1 bg-white">
                <View className="relative w-full h-[250px]">
                    <Image
                        source={images.signUpCar}
                        className="z-0 w-full h-[250px]"
                    />
                    <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
                        Welcome 👋
                    </Text>
                </View>

                <FormProvider {...form}>
                    <View className="p-5">
                        <InputField
                            name="email"
                            label="Email"
                            placeholder="Enter email"
                            icon={icons.email}
                            textContentType="emailAddress"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <InputField
                            name="password"
                            label="Password"
                            placeholder="Enter password"
                            icon={icons.lock}
                            secureTextEntry={true}
                            textContentType="password"
                            autoCapitalize="none"
                        />

                        <CustomButton
                            title="Sign In"
                            onPress={handleSubmit(onSignInPress)}
                            className="mt-6"
                        />

                        <OAuth />

                        <Link
                            href="/sign-up"
                            className="text-lg text-center text-general-200 my-10"
                        >
                            Dont have an account?{' '}
                            <Text className="text-primary-500">Sign Up</Text>
                        </Link>
                    </View>
                </FormProvider>
            </View>
        </ScrollView>
    )
}

export default SignIn
