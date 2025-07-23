import { useDeepLinking } from '@/hooks/useDeepLinking'
import { NotificationProvider } from '@/lib/context/NotificationContext'
import { QueryProvider } from '@/lib/query/provider'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack } from 'expo-router'
import { useEffect } from 'react'
import { LogBox } from 'react-native'
import 'react-native-reanimated'
import './global.css'

SplashScreen.preventAutoHideAsync()

LogBox.ignoreLogs([])
export default function RootLayout() {
    // Initialize deep linking handler
    useDeepLinking()
    
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
        <QueryProvider>
            <NotificationProvider
                baseUrl="http://192.168.43.112:5000" // Updated to correct IP and port
                autoConnect={true}
                showAlerts={true}
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
            </NotificationProvider>
        </QueryProvider>
    )
}
