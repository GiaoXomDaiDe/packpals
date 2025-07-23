import { Stack } from 'expo-router'

const Layout = () => {
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            {/* Renter */}
            <Stack.Screen name="find-storage" options={{ headerShown: false }} />
            <Stack.Screen name="book-storage" options={{ headerShown: false }} />
            <Stack.Screen name="storage-management" options={{ headerShown: false }} />
            <Stack.Screen name="add-storage" options={{ headerShown: false }} />
            <Stack.Screen name="order-management" options={{ headerShown: false }} />
            <Stack.Screen name="orderdetails/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="payment-result" options={{ headerShown: false }} />
            {/* Keeper */}
            <Stack.Screen name="keeper-storages" options={{ headerShown: false }} />
            <Stack.Screen name="storagedetails/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="keeper-orderdetails/[id]" options={{ headerShown: false }} />
        </Stack>
    )
}

export default Layout
