import { useAuth } from '@clerk/clerk-expo'
import { useStripe } from '@stripe/stripe-react-native'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { Alert, Image, Text, View } from 'react-native'
import { ReactNativeModal } from 'react-native-modal'

import CustomButton from '@/components/CustomButton'
import { images } from '@/constants'
import { fetchAPI } from '@/lib/fetch'
import { useLocationStore } from '@/store'
import { PaymentProps } from '@/types/type'

const Payment = ({
    fullName,
    email,
    amount,
    driverId,
    rideTime,
    driverName,
    driverImage,
}: PaymentProps) => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe()
    const {
        userAddress,
        userLongitude,
        userLatitude,
        destinationLatitude,
        destinationAddress,
        destinationLongitude,
    } = useLocationStore()

    const { userId } = useAuth()
    const [success, setSuccess] = useState<boolean>(false)

    const openPaymentSheet = async () => {
        await initializePaymentSheet()
        const { error } = await presentPaymentSheet()

        if (error) {
            Alert.alert(`Error code hehe: ${error.code}`, error.message)
        } else {
            setSuccess(true)
        }
    }

    const initializePaymentSheet = async () => {
        const { error } = await initPaymentSheet({
            merchantDisplayName: 'FakeUber',
            intentConfiguration: {
                mode: {
                    amount: parseInt(amount) * 100,
                    currencyCode: 'usd',
                },
                confirmHandler: async (
                    paymentMethod,
                    shouldSavePaymentMethod,
                    intentCreationCallback
                ) => {
                    const { paymentIntent, customer } = await fetchAPI(
                        '/(api)/stripe/create',
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                name: fullName || email.split('@')[0],
                                email: email,
                                amount: amount,
                                paymentMethodId: paymentMethod.id,
                            }),
                        }
                    )

                    if (paymentIntent.client_secret) {
                        const { result } = await fetchAPI('/(api)/stripe/pay', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                payment_method_id: paymentMethod.id,
                                payment_intent_id: paymentIntent.id,
                                customer_id: customer,
                                client_secret: paymentIntent.client_secret,
                            }),
                        })

                        if (result.client_secret) {
                            // Create ride record in new rides table
                            const rideResponse = await fetchAPI(
                                '/(api)/ride/rides',
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        userId,
                                        driverId: parseInt(String(driverId)),
                                        pickupLatitude: userLatitude,
                                        pickupLongitude: userLongitude,
                                        destinationLatitude,
                                        destinationLongitude,
                                        pickupAddress: userAddress,
                                        destinationAddress,
                                        farePrice: amount,
                                        rideTime: Math.round(rideTime || 0),
                                    }),
                                }
                            )

                            // Also create in old ride table for compatibility
                            await fetchAPI('/(api)/ride/create', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    origin_address: userAddress,
                                    destination_address: destinationAddress,
                                    origin_latitude: userLatitude,
                                    origin_longitude: userLongitude,
                                    destination_latitude: destinationLatitude,
                                    destination_longitude: destinationLongitude,
                                    ride_time: (rideTime || 0).toFixed(0),
                                    fare_price: parseInt(amount) * 100,
                                    payment_status: 'paid',
                                    driver_id: driverId,
                                    user_id: userId,
                                }),
                            })

                            intentCreationCallback({
                                clientSecret: result.client_secret,
                            })

                            // Store ride data for payment success page
                            if (rideResponse.success) {
                                // Store in AsyncStorage for payment success
                                import('expo-secure-store').then(
                                    ({ setItemAsync }) => {
                                        setItemAsync(
                                            'tempRideData',
                                            JSON.stringify({
                                                rideId: rideResponse.data
                                                    .ride_id,
                                                driverId: driverId.toString(),
                                                driverName,
                                                driverImage,
                                                farePrice: amount,
                                            })
                                        )
                                    }
                                )
                            }
                        }
                    }
                },
            },
        })

        if (!error) {
        }
    }

    return (
        <>
            <CustomButton
                title="Confirm Ride"
                className="my-10"
                onPress={openPaymentSheet}
            />

            <ReactNativeModal
                isVisible={success}
                onBackdropPress={() => setSuccess(false)}
            >
                <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
                    <Image source={images.check} className="w-28 h-28 mt-5" />

                    <Text className="text-2xl text-center font-JakartaBold mt-5">
                        Booking placed successfully
                    </Text>

                    <Text className="text-md text-general-200 font-JakartaRegular text-center mt-3">
                        Thank you for your booking. Your reservation has been
                        successfully placed. Please proceed with your trip.
                    </Text>

                    <CustomButton
                        title="Continue to Rating"
                        onPress={async () => {
                            setSuccess(false)
                            // Get ride data from storage
                            const { getItemAsync } = await import(
                                'expo-secure-store'
                            )
                            const tempRideData =
                                await getItemAsync('tempRideData')
                            if (tempRideData) {
                                const rideData = JSON.parse(tempRideData)
                                // Clear the temp data
                                const { deleteItemAsync } = await import(
                                    'expo-secure-store'
                                )
                                await deleteItemAsync('tempRideData')
                                router.replace({
                                    pathname: '/(root)/payment-success',
                                    params: rideData,
                                })
                            } else {
                                // Fallback
                                router.replace({
                                    pathname: '/(root)/payment-success',
                                    params: {
                                        rideId: Date.now().toString(),
                                        driverId: driverId.toString(),
                                        driverName,
                                        driverImage,
                                        farePrice: amount,
                                    },
                                })
                            }
                        }}
                        className="mt-5 bg-yellow-500"
                    />

                    <CustomButton
                        title="Skip Rating"
                        onPress={async () => {
                            setSuccess(false)
                            // Clear any temp data
                            const { deleteItemAsync } = await import(
                                'expo-secure-store'
                            )
                            try {
                                await deleteItemAsync('tempRideData')
                            } catch (error) {
                                // Ignore if doesn't exist
                            }
                            // Clear all ride state and go home
                            const { resetAllRideState } = await import('@/store')
                            resetAllRideState()
                            router.replace('/(root)/(tabs)/home')
                        }}
                        className="mt-3"
                    />
                </View>
            </ReactNativeModal>
        </>
    )
}

export default Payment
