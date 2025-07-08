import { useAuth, useUser } from '@clerk/clerk-expo'
import * as Location from 'expo-location'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    FlatList,
    Image,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import GoogleTextInput from '@/components/GoogleTextInput'
import Map from '@/components/Map'
import RideCard from '@/components/RideCard'
import { icons, images } from '@/constants'
// import { useDriverTracking } from '@/hooks/useDriverTracking'
import { useFetch } from '@/lib/fetch'
import { useLocationStore } from '@/store'
import { Ride } from '@/types/type'

const Home = () => {
    const { user } = useUser()
    const { signOut } = useAuth()
    const { setUserLocation, setDestinationLocation } = useLocationStore()
    // const { isTracking, startTracking, stopTracking } = useDriverTracking()

    const handleSignOut = async () => {
        await signOut()
        router.replace('/(auth)/sign-in')
    }
    const [, setHasPermission] = useState<boolean>(false)

    const { data: recentRides, loading } = useFetch<Ride[]>(
        `/(api)/ride/${user?.id}`
    )
    useEffect(() => {
        ;(async () => {
            let { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
                setHasPermission(false)
                return
            }

            let location = await Location.getCurrentPositionAsync({})
            const address = await Location.reverseGeocodeAsync({
                latitude: location.coords?.latitude!,
                longitude: location.coords?.longitude!,
            })

            setUserLocation({
                latitude: location.coords?.latitude,
                longitude: location.coords?.longitude,
                address: `${address[0].name}, ${address[0].region}`,
            })
        })()
    }, [setUserLocation])

    const handleDestinationPress = (location: {
        latitude: number
        longitude: number
        address: string
    }) => {
        setDestinationLocation(location)

        router.push('/(root)/find-ride')
    }

    return (
        <SafeAreaView className="bg-general-500">
            <FlatList
                data={recentRides?.slice(0, 5)}
                renderItem={({ item }) => <RideCard ride={item} />}
                keyExtractor={(item, index) => index.toString()}
                className="px-5"
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                    paddingBottom: 100,
                }}
                ListEmptyComponent={() => (
                    <View className="flex flex-col items-center justify-center">
                        {!loading ? (
                            <>
                                <Image
                                    source={images.noResult}
                                    className="w-40 h-40"
                                    alt="No recent rides found"
                                    resizeMode="contain"
                                />
                                <Text className="text-sm">
                                    No recent rides found
                                </Text>
                            </>
                        ) : (
                            <ActivityIndicator size="small" color="#000" />
                        )}
                    </View>
                )}
                ListHeaderComponent={
                    <>
                        <View className="flex flex-row items-center justify-between my-5">
                            <Text className="text-2xl font-JakartaExtraBold">
                                Welcome {user?.firstName}👋
                            </Text>
                            <View className="flex-row items-center space-x-3">
                                <TouchableOpacity
                                    onPress={() =>
                                        router.push('/(root)/ai-demo')
                                    }
                                    className="justify-center items-center w-10 h-10 rounded-full bg-blue-500"
                                >
                                    <Text className="text-white text-lg">
                                        🤖
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSignOut}
                                    className="justify-center items-center w-10 h-10 rounded-full bg-white"
                                >
                                    <Image
                                        source={icons.out}
                                        className="w-4 h-4"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <GoogleTextInput
                            icon={icons.search}
                            containerStyle="bg-white shadow-md shadow-neutral-300"
                            handlePress={handleDestinationPress}
                        />

                        <>
                            <Text className="text-xl font-JakartaBold mt-5 mb-3">
                                Your current location
                            </Text>
                            <View className="flex flex-row items-center bg-transparent h-[300px]">
                                <Map />
                            </View>
                        </>

                        {/* Driver Tracking Controls - Temporarily Hidden */}
                        {/* <View className="mt-5 mb-3">
                            <Text className="text-xl font-JakartaBold mb-3">
                                Driver Mode
                            </Text>
                            <CustomButton
                                title={
                                    isTracking
                                        ? 'Stop Driver Tracking'
                                        : 'Start Driver Tracking'
                                }
                                onPress={
                                    isTracking ? stopTracking : startTracking
                                }
                                className={`${isTracking ? 'bg-red-500' : 'bg-green-500'}`}
                            />
                        </View> */}

                        <Text className="text-xl font-JakartaBold mt-5 mb-3">
                            Recent Rides
                        </Text>
                    </>
                }
            />
        </SafeAreaView>
    )
}

export default Home
