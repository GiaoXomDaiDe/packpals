import CreateReview from '@/components/CreateReview'
import CustomButton from '@/components/CustomButton'
import { images } from '@/constants'
import { resetAllRideState, useLocationStore, useRideStore } from '@/store'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { BackHandler, Image, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const PaymentSuccess = () => {
    const params = useLocalSearchParams()
    const { rideId, driverId, driverName, driverImage, farePrice } = params

    // Debug log
    console.log('Payment Success Params:', params)

    const { userAddress, destinationAddress } = useLocationStore()
    const { setCompletedRide } = useRideStore()
    const [showReviewModal, setShowReviewModal] = useState(false)

    // Save completed ride info
    useEffect(() => {
        if (rideId && driverId && driverName) {
            const completedRideData = {
                rideId: rideId as string,
                driverId: parseInt(driverId as string),
                driverName: driverName as string,
                driverImage: driverImage as string,
                originAddress: userAddress || 'Unknown location',
                destinationAddress: destinationAddress || 'Unknown destination',
                farePrice: parseFloat(farePrice as string) || 0,
                completedAt: new Date().toISOString(),
            }
            setCompletedRide(completedRideData)
        }
    }, [
        rideId,
        driverId,
        driverName,
        driverImage,
        farePrice,
        userAddress,
        destinationAddress,
        setCompletedRide,
    ])

    const handleRateRide = () => {
        setShowReviewModal(true)
    }

    const handleReviewCreated = () => {
        setShowReviewModal(false)
        // Reset all ride state and navigate back to home
        resetAllRideState()
        router.replace('/(root)/(tabs)/home')
    }

    const handleSkipReview = () => {
        // Reset all ride state and navigate back to home without reviewing
        resetAllRideState()
        router.replace('/(root)/(tabs)/home')
    }

    const handleBackHome = () => {
        // Reset all ride state before going home
        resetAllRideState()
        router.replace('/(root)/(tabs)/home')
    }

    // Handle Android back button
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                // Prevent going back to payment screen, go to home instead
                handleSkipReview()
                return true // Prevent default back action
            }

            const subscription = BackHandler.addEventListener(
                'hardwareBackPress',
                onBackPress
            )

            return () => subscription.remove()
        }, [])
    )

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 px-5 py-3">
                <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl flex-1">
                    <Image source={images.check} className="w-28 h-28 mt-5" />
                    <Text className="text-2xl text-center font-JakartaBold mt-5">
                        Booking placed successfully
                    </Text>
                    <Text className="text-md text-general-200 font-JakartaRegular text-center mt-3">
                        Thank you for your booking. Your reservation has been
                        successfully placed. Please proceed with your trip.
                    </Text>

                    {/* Ride Details */}
                    {driverName && (
                        <View className="bg-gray-50 rounded-xl p-4 mt-6 w-full">
                            <Text className="text-lg font-JakartaBold mb-2">
                                Ride Details
                            </Text>
                            <Text className="text-gray-600">
                                Driver: {String(driverName)}
                            </Text>
                            <Text className="text-gray-600">
                                Fare: ${String(farePrice)}
                            </Text>
                            <Text className="text-gray-600">
                                From: {String(userAddress || 'Unknown')}
                            </Text>
                            <Text className="text-gray-600">
                                To: {String(destinationAddress || 'Unknown')}
                            </Text>
                        </View>
                    )}

                    {/* Rate Your Ride Button */}
                    <CustomButton
                        title="Rate Your Ride"
                        onPress={handleRateRide}
                        className="mt-6 bg-yellow-500"
                    />

                    <CustomButton
                        title="Skip Review & Go Home"
                        onPress={handleSkipReview}
                        className="mt-3"
                    />
                </View>
            </View>

            {/* Review Modal */}
            {rideId && driverId && driverName && (
                <CreateReview
                    isVisible={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    driverId={parseInt(String(driverId))}
                    rideId={String(rideId)}
                    driverName={String(driverName)}
                    onReviewCreated={handleReviewCreated}
                />
            )}
        </SafeAreaView>
    )
}

export default PaymentSuccess
