import { Ionicons } from '@expo/vector-icons'
import Feather from '@expo/vector-icons/Feather'
import { router, Tabs, usePathname } from 'expo-router'
import { Text, TouchableOpacity, View } from 'react-native'

const PRIMARY_COLOR = '#130057'
const SECONDARY_COLOR = '#fff'

const CustomNavBar = () => {
    const pathname = usePathname()
    
    const tabs = [
        { name: 'home', title: 'Home', href: '/(root)/(tabs)/home' },
        { name: 'orders', title: 'Orders', href: '/(root)/(tabs)/orders' },
        { name: 'chat', title: 'Reviews', href: '/(root)/(tabs)/chat' },
        { name: 'profile', title: 'Profile', href: '/(root)/(tabs)/profile' },
    ]

    const getIconByRouteName = (routeName: string, color: string) => {
        switch (routeName) {
            case 'home':
                return <Ionicons name="home-outline" size={18} color={color} />
            case 'orders':
                return <Ionicons name="receipt-outline" size={20} color={color} />
            case 'chat':
                return <Ionicons name="star-outline" size={18} color={color} />
            case 'profile':
                return <Ionicons name="person-outline" size={18} color={color} />
            default:
                return <Feather name="home" size={18} color={color} />
        }
    }

    return (
        <View className="absolute flex flex-row justify-center items-center bg-slate-900 w-[90%] self-center bottom-10 rounded-full px-3 py-3 shadow-md">
            {tabs.map((tab) => {
                const isFocused = pathname.includes(tab.name)

                return (
                    <TouchableOpacity
                        key={tab.name}
                        onPress={() => router.push(tab.href)}
                        className={`flex flex-row justify-center items-center h-10 px-4 m-2 rounded-full ${
                            isFocused ? 'bg-[#fff]' : 'bg-transparent'
                        }`}
                    >
                        {getIconByRouteName(
                            tab.name,
                            isFocused ? PRIMARY_COLOR : SECONDARY_COLOR
                        )}
                        {isFocused && (
                            <Text className="text-primary-800 ml-2 font-normal font-JakartaBold text-base">
                                {tab.title}
                            </Text>
                        )}
                    </TouchableOpacity>
                )
            })}
        </View>
    )
}

export default function RootLayout() {
    return (
        <Tabs
            initialRouteName="home"
            tabBar={() => <CustomNavBar />}
        >
            <Tabs.Screen
                name="home"
                options={{ title: 'Home', headerShown: false }}
            />
            <Tabs.Screen
                name="orders"
                options={{ title: 'Orders', headerShown: false }}
            />
            <Tabs.Screen
                name="chat"
                options={{ title: 'Reviews', headerShown: false }}
            />
            <Tabs.Screen
                name="profile"
                options={{ title: 'Profile', headerShown: false }}
            />
        </Tabs>
    )
}
