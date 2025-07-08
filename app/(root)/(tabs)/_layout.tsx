import { Ionicons } from '@expo/vector-icons'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Tabs } from 'expo-router'

import { TouchableOpacity, View } from 'react-native'

import Feather from '@expo/vector-icons/Feather'
import Animated, {
    FadeIn,
    FadeOut,
    LinearTransition,
} from 'react-native-reanimated'

const AnimatedTouchableOpacity =
    Animated.createAnimatedComponent(TouchableOpacity)

const PRIMARY_COLOR = '#130057'
const SECONDARY_COLOR = '#fff'

const CustomNavBar: React.FC<BottomTabBarProps> = ({
    state,
    descriptors,
    navigation,
}) => {
    return (
        <View className="absolute flex flex-row justify-center items-center bg-slate-900 w-[90%] self-center bottom-10 rounded-full px-3 py-3 shadow-md">
            {state.routes.map((route, index) => {
                if (['_sitemap', '+not-found'].includes(route.name)) return null

                const { options } = descriptors[route.key]
                const label =
                    options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                          ? options.title
                          : route.name

                const isFocused = state.index === index

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    })

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params)
                    }
                }

                return (
                    <AnimatedTouchableOpacity
                        layout={LinearTransition.springify().mass(0.5)}
                        key={route.key}
                        onPress={onPress}
                        className={`flex flex-row justify-center items-center h-10 px-4 m-2 rounded-full ${
                            isFocused ? 'bg-[#fff]' : 'bg-transparent'
                        }`}
                    >
                        {getIconByRouteName(
                            route.name,
                            isFocused ? PRIMARY_COLOR : SECONDARY_COLOR
                        )}
                        {isFocused && (
                            <Animated.Text
                                className="text-primary-800 ml-2 font-normal font-JakartaBold text-base"
                                entering={FadeIn.duration(200)}
                                exiting={FadeOut.duration(200)}
                            >
                                {label as string}
                            </Animated.Text>
                        )}
                    </AnimatedTouchableOpacity>
                )
            })}
        </View>
    )

    function getIconByRouteName(routeName: string, color: string) {
        switch (routeName) {
            case 'home':
                return <Ionicons name="home-outline" size={18} color={color} />
            case 'rides':
                return (
                    <Ionicons
                        name="car-sport-outline"
                        size={20}
                        color={color}
                    />
                )
            case 'chat':
                return <Ionicons name="star-outline" size={18} color={color} />
            case 'profile':
                return (
                    <Ionicons name="person-outline" size={18} color={color} />
                )
            default:
                return <Feather name="home" size={18} color={color} />
        }
    }
}

export default function RootLayout() {
    return (
        <Tabs
            initialRouteName="home"
            tabBar={(props) => <CustomNavBar {...props} />}
        >
            <Tabs.Screen
                name="home"
                options={{ title: 'Home', headerShown: false }}
            />
            <Tabs.Screen
                name="rides"
                options={{ title: 'Rides', headerShown: false }}
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
