import { NotificationCenter } from '@/components/NotificationCenter'
import { Stack } from 'expo-router'

const Layout = () => {
    return (
        <>
            <NotificationCenter />
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                {/* Renter */}
                <Stack.Screen name="find-storage" options={{ headerShown: false }} />
                <Stack.Screen name="book-storage" options={{ headerShown: false }} />
                <Stack.Screen name="orderdetails/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="payment-result" options={{ headerShown: false }} />
                <Stack.Screen name="rating-form" options={{ headerShown: false }} />
                <Stack.Screen name="rating-detail" options={{ headerShown: false }} />
                {/* Keeper */}
                <Stack.Screen name="keeper-storages" options={{ headerShown: false }} />
                <Stack.Screen name="storagedetails/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="keeper-orderdetails/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="order-management" options={{ headerShown: false }} />
                <Stack.Screen name="review-management" options={{ headerShown: false }} />
                <Stack.Screen name="update-profile" options={{ headerShown: false }} />
            </Stack>
        </>
    )
}

export default Layout
