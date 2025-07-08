import { ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { StripeProvider } from '@stripe/stripe-react-native'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack } from 'expo-router'
import { useEffect } from 'react'
import { LogBox } from 'react-native'
import 'react-native-reanimated'
import './global.css'

SplashScreen.preventAutoHideAsync()

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

if (!clerkPublishableKey) {
    throw new Error(
        'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. Please set it in your .env file.'
    )
}

LogBox.ignoreLogs(['Clerk:'])
export default function RootLayout() {
    const [loaded] = useFonts({
        'Jakarta-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
        'Jakarta-ExtraBold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
        'Jakarta-ExtraLight': require('../assets/fonts/PlusJakartaSans-ExtraLight.ttf'),
        'Jakarta-Light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
        'Jakarta-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
        Jakarta: require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
        'Jakarta-SemiBold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    })
    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync()
        }
    }, [loaded])

    if (!loaded) {
        return null
    }

    return (
        <StripeProvider
            publishableKey={
                process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
            }
            merchantIdentifier="merchant.identifier"
            urlScheme="your-url-scheme"
        >
            <ClerkProvider
                publishableKey={clerkPublishableKey}
                tokenCache={tokenCache}
            >
                <Stack>
                    <Stack.Screen
                        name="index"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="(auth)"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="(root)"
                        options={{ headerShown: false }}
                    />
                </Stack>
            </ClerkProvider>
        </StripeProvider>
    )
}
