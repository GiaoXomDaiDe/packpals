import { Stack } from 'expo-router'

const Layout = () => {
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="find-ride" options={{ headerShown: false }} />
            <Stack.Screen
                name="confirm-ride"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="book-ride"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="ai-demo"
                options={{
                    headerShown: true,
                    title: '🤖 AI Driver Demo',
                    headerBackTitle: 'Back',
                }}
            />
        </Stack>
    )
}

export default Layout
