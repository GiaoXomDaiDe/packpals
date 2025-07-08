import { useUser } from '@clerk/clerk-expo'
import { ActivityIndicator, FlatList, Image, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import CustomButton from '@/components/CustomButton'
import RealTimeMap from '@/components/RealTimeMap'
import RideCard from '@/components/RideCard'
import { images } from '@/constants'
import { useDriverTracking } from '@/hooks/useDriverTracking'
import { useFetch } from '@/lib/fetch'
import { Ride } from '@/types/type'

const Rides = () => {
    const { user } = useUser()
    const { isTracking, startTracking, stopTracking } = useDriverTracking()

    const { data: recentRides, loading } = useFetch<Ride[]>(
        `/(api)/ride/${user?.id}`
    )

    return (
        <SafeAreaView className="flex-1 bg-white">
            <FlatList
                data={recentRides}
                renderItem={({ item }) => (
                    <View className="mb-4">
                        <RideCard ride={item} />

                        {/* Show real-time tracking for active rides */}
                        {item.payment_status === 'paid' && (
                            <View className="mx-5 mb-4">
                                <View className="h-64 mb-4 rounded-lg overflow-hidden">
                                    <RealTimeMap
                                        rideId={item.ride_id}
                                        userLocation={{
                                            latitude: item.origin_latitude,
                                            longitude: item.origin_longitude,
                                        }}
                                        destination={{
                                            latitude: item.destination_latitude,
                                            longitude:
                                                item.destination_longitude,
                                        }}
                                        height={256}
                                    />
                                </View>

                                {/* Driver tracking controls */}
                                <CustomButton
                                    title={
                                        isTracking
                                            ? 'Stop Driver Tracking'
                                            : 'Start Driver Tracking'
                                    }
                                    onPress={
                                        isTracking
                                            ? stopTracking
                                            : startTracking
                                    }
                                    className={`mt-2 ${isTracking ? 'bg-red-500' : 'bg-green-500'}`}
                                />
                            </View>
                        )}
                    </View>
                )}
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
                        <Text className="text-2xl font-JakartaBold my-5">
                            All Rides
                        </Text>
                    </>
                }
            />
        </SafeAreaView>
    )
}

export default Rides
