import CustomButton from '@/components/CustomButton'
import FormInputField from '@/components/FormInputField'
import { icons } from '@/constants'
import { useBookStorageForm } from '@/hooks/useBookStorageForm'
import {
    useCreateOrder,
    useCreateOrderDetails,
    useSizeList,
    useUserProfile
} from '@/lib/query/hooks'
import {
    CreateOrderDetailsParams,
    CreateOrderRequest,
    SizeApiData,
    StorageMarkerData,
    UserProfileData
} from '@/lib/types/type'
import { useLocationStore, useStorageStore, useUserStore } from '@/store'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'

const BookStorage = () => {
    console.log('Rendering BookStorage component-------------------------------------------------')
    const { userAddress } = useLocationStore()
    const { user } = useUserStore()
    const { storages, selectedStorage } = useStorageStore()
    console.log(storages, 'Available Storages')
    
    const {
        control,
        errors,
        estimatedDays,
        selectedSizes,
        isLoading,
        setIsLoading,
        createdOrderId,
        setCreatedOrderId,
        handleSizeSelection,
        hasSelectedSizes,
        calculateTotalAmount,
        validateForm,
        getFormData
    } = useBookStorageForm()

    const {
        data: sizesResponse,
        isLoading: loadingSizes,
        error: sizesError
    } = useSizeList({ pageSize: 50 })
    console.log(sizesResponse, 'Available Sizes')
    const {
        data: userProfileResponse
    } = useUserProfile(user?.id || '', {
        enabled: !!user?.id
    })

    const createOrderMutation = useCreateOrder({
        onSuccess: (orderId: string) => {
            console.log('📦 Order created successfully with ID (from hook):', orderId)
            // This will be handled in the mutation call directly
        },
        onError: (error) => {
            console.error('❌ Order creation failed (from hook):', error)
            // This will be handled in the mutation call directly
        }
    })

    const createOrderDetailsMutation = useCreateOrderDetails({
        onSuccess: () => {
            console.log('📋 Order details created successfully')
        },
        onError: (error) => {
            console.error('❌ Order details creation failed:', error)
        }
    })

    const availableSizes: SizeApiData[] = sizesResponse?.data?.data || []

    const storageDetails: StorageMarkerData | undefined = storages.find(storage => storage.id === selectedStorage)

    if (!storageDetails) {
        return (
            <SafeAreaView className="bg-general-500 flex-1">
                <View className="flex flex-col items-center justify-center p-5">
                    <Text className="text-xl font-JakartaSemiBold mb-3">
                        Storage not found
                    </Text>
                    <Text className="text-md font-JakartaRegular text-center mb-5">
                        Please go back and select a storage location to continue.
                    </Text>
                    <CustomButton
                        title="Go Back"
                        onPress={() => router.back()}
                    />
                </View>
            </SafeAreaView>
        )
    }


    const handleBookingConfirmation = async () => {
        const validationErrors = validateForm()
        if (validationErrors.length > 0) {
            Alert.alert('Validation Error', validationErrors.join('\n'))
            return
        }

        if (!user?.id) {
            Alert.alert('Error', 'User not authenticated. Please login again.')
            return
        }

        if (!selectedStorage) {
            Alert.alert('Error', 'No storage selected. Please go back and select a storage.')
            return
        }
        if (!(userProfileResponse as any)?.data) {
            Alert.alert('Error', 'User profile not loaded. Please try again.')
            return
        }

        setIsLoading(true)
        try {
            const userData: UserProfileData = (userProfileResponse as any).data.data
            let actualRenterId: string | undefined = userData.renter?.renterId
            
            if (!actualRenterId) {
                Alert.alert(
                    'Account Setup Issue', 
                    'Your account may not be properly configured as a renter. Please try logging out and back in.'
                )
                return
            }

            const formData = getFormData()
            const orderData: CreateOrderRequest = {
                renterId: actualRenterId,
                storageId: selectedStorage,
                packageDescription: formData.packageDescription,
                estimatedDays: parseInt(estimatedDays) || 1,
            }
            
            createOrderMutation.mutate(orderData, {
                onSuccess: (orderId: string) => {
                    console.log('📦 Order created successfully with ID:', orderId)
                    console.log('📦 About to set createdOrderId to:', orderId)
                    // Set the order ID immediately
                    setCreatedOrderId(orderId)
                    
                    // Create order details using the orderId directly from success callback
                    const orderDetailsData = Object.entries(selectedSizes).flatMap(([sizeId, quantity]) => 
                        Array(quantity).fill({ sizeId })
                    )
                    console.log(
                        '📋 Creating order details for order ID:', orderId, 
                        'with sizes:', orderDetailsData
                    )
                    
                    if (!orderId) {
                        console.error('❌ ERROR: orderId is undefined when creating order details!')
                        Alert.alert('Error', 'Order ID is missing. Please try again.')
                        setIsLoading(false)
                        return
                    }
                    
                    const orderDetailsRequest: CreateOrderDetailsParams = {
                        orderId, // Use orderId directly from callback, not from state
                        orderDetails: orderDetailsData 
                    }
                    
                    console.log('📋 Order details request payload:', JSON.stringify(orderDetailsRequest, null, 2))
                    
                    createOrderDetailsMutation.mutate(orderDetailsRequest, {
                        onSuccess: () => {
                            console.log('✅ Order and details created successfully with ID:', orderId)
                            setIsLoading(false) // Set loading to false only after everything succeeds
                        },
                        onError: (error) => {
                            console.error('❌ Order details creation failed:', error)
                            Alert.alert('Error', 'Failed to create order details. The order was created but details failed. Please contact support.')
                            setIsLoading(false) // Set loading to false even on error
                        }
                    })
                },
                onError: (error) => {
                    console.error('❌ Order creation failed:', error)
                    const errorMessage = error?.message || 'Unknown error'
                    Alert.alert('Order Creation Failed', `Failed to create order: ${errorMessage}`)
                    setIsLoading(false) // Set loading to false on error
                }
            })
        } catch (error) {
            console.error('Error creating order:', error)
            Alert.alert('Error', 'An error occurred while creating your order.')
            setIsLoading(false) // Set loading to false only in catch block
        }
    }
    console.log(storageDetails, 'Storage Details')
    // Debug logging for orderId tracking
    console.log('🔍 Current createdOrderId state:', createdOrderId)
    
    return (
        <SafeAreaView className="bg-general-500 flex-1">
                <ScrollView className="px-5 py-3">
                    <View className="flex flex-row items-center justify-between mb-5">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Image
                                source={icons.backArrow}
                                className="w-6 h-6"
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                        <Text className="text-xl font-JakartaExtraBold">
                            Book Storage
                        </Text>
                        <View className="w-6" />
                    </View>

                    {/* Storage Information - Simplified */}
                    <View className="bg-white rounded-xl p-4 mb-5">
                        <Text className="text-lg font-JakartaBold text-gray-900 mb-4">
                            Storage Information
                        </Text>

                        {/* Storage Basic Info */}
                        <View className="flex-row items-start mb-4">
                            <Image
                                source={{ uri: storageDetails.images[0] || 'https://via.placeholder.com/80' }}
                                className="w-16 h-16 rounded-lg"
                                resizeMode="cover"
                            />
                            <View className="flex-1 ml-3">
                                <Text className="text-base font-JakartaBold text-gray-900 mb-1" numberOfLines={2}>
                                    {storageDetails.title}
                                </Text>
                                <View className="flex-row items-start mb-2">
                                    <Ionicons name="location" size={14} color="#6b7280" className="mt-0.5" />
                                    <Text className="text-sm text-gray-600 ml-1 flex-1" numberOfLines={3}>
                                        {storageDetails.address}
                                    </Text>
                                </View>
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                        <Ionicons name="star" size={14} color="#f59e0b" />
                                        <Text className="text-sm font-JakartaMedium text-gray-700 ml-1">
                                            {storageDetails.rating?.toFixed(1)}
                                        </Text>
                                    </View>
                                    <Text className="text-base font-JakartaBold text-primary-600">
                                        {storageDetails.pricePerDay.toLocaleString()} VND/day
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Keeper Contact - Simplified */}
                        <View className="bg-blue-50 rounded-lg p-3 flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                                <Ionicons name="person-circle" size={24} color="#2563eb" />
                                <View className="ml-2 flex-1">
                                    <Text className="text-blue-900 font-JakartaBold text-sm" numberOfLines={1}>
                                        {storageDetails.keeperName}
                                    </Text>
                                    <Text className="text-blue-700 text-xs">
                                        Storage Keeper
                                    </Text>
                                </View>
                            </View>
                            
                            {storageDetails.keeperPhoneNumber ? (
                                <TouchableOpacity
                                    onPress={() => {
                                        Linking.openURL(`tel:${storageDetails.keeperPhoneNumber}`)
                                    }}
                                    className="bg-blue-600 rounded-lg py-2 px-3 flex-row items-center"
                                >
                                    <Ionicons name="call" size={14} color="white" />
                                    <Text className="text-white font-JakartaBold text-xs ml-1">
                                        Call
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>

                    {/* Package Information */}
                    <View className="bg-white rounded-lg p-4 mb-5">
                        <Text className="text-lg font-JakartaSemiBold mb-3">
                            Package Information
                        </Text>

                        <FormInputField
                            name="packageDescription"
                            control={control}
                            label="Package Description *"
                            placeholder="Describe your package (size, contents, special instructions)"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            error={errors.packageDescription}
                            rules={{
                                required: 'Please describe your package',
                                minLength: {
                                    value: 10,
                                    message: 'Package description must be at least 10 characters'
                                }
                            }}
                        />

                        <FormInputField
                            name="estimatedDays"
                            control={control}
                            label="Estimated Storage Days"
                            placeholder="Enter number of days"
                            keyboardType="numeric"
                            error={errors.estimatedDays}
                            rules={{
                                required: 'Please enter estimated storage days',
                                pattern: {
                                    value: /^[1-9]\d*$/,
                                    message: 'Please enter a valid number of days (minimum 1)'
                                }
                            }}
                        />
                    </View>

                    {/* Size Selection */}
                    <View className="bg-white rounded-lg p-4 mb-5">
                        <Text className="text-lg font-JakartaSemiBold mb-3">
                            Storage Size Selection *
                        </Text>
                        
                        {loadingSizes || sizesError ? (
                            <View className="flex-row items-center justify-center py-8">
                                {loadingSizes ? (
                                    <>
                                        <ActivityIndicator size="large" color="#0286FF" />
                                        <Text className="ml-3 text-sm font-JakartaRegular text-general-200">
                                            Loading available sizes...
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="warning-outline" size={24} color="#ef4444" />
                                        <Text className="ml-3 text-sm font-JakartaRegular text-danger-600">
                                            Failed to load sizes. Please try again.
                                        </Text>
                                    </>
                                )}
                            </View>
                        ) : (
                            <View>
                                <Text className="text-sm font-JakartaRegular text-general-200 mb-4">
                                    Select the storage sizes you need for your items
                                </Text>
                                
                                {availableSizes.map((size: SizeApiData) => (
                                    <View key={size.id} className="mb-4">
                                        <View className="flex-row items-center justify-between p-4 border border-general-700 rounded-lg">
                                            <View className="flex-1">
                                                <Text className="text-base font-JakartaSemiBold text-general-800">
                                                    {size.sizeDescription}
                                                </Text>
                                                <Text className="text-sm font-JakartaRegular text-general-200">
                                                    {size.price.toLocaleString()} VND/day
                                                </Text>
                                            </View>
                                            
                                            <View className="flex-row items-center">
                                                <TouchableOpacity
                                                    onPress={() => handleSizeSelection(size.id, false)}
                                                    className="w-10 h-10 rounded-full bg-general-700 items-center justify-center mr-3"
                                                    disabled={!selectedSizes[size.id]}
                                                >
                                                    <Ionicons 
                                                        name="remove" 
                                                        size={20} 
                                                        color={selectedSizes[size.id] ? "#000" : "#9CA3AF"} 
                                                    />
                                                </TouchableOpacity>
                                                
                                                <View className="min-w-[40px] items-center">
                                                    <Text className="text-lg font-JakartaBold text-general-800">
                                                        {selectedSizes[size.id] || 0}
                                                    </Text>
                                                </View>
                                                
                                                <TouchableOpacity
                                                    onPress={() => handleSizeSelection(size.id, true)}
                                                    className="w-10 h-10 rounded-full bg-primary-500 items-center justify-center ml-3"
                                                >
                                                    <Ionicons name="add" size={20} color="white" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        
                                        {selectedSizes[size.id] ? (
                                            <View className="mt-2 p-2 bg-primary-50 rounded-lg">
                                                <Text className="text-sm font-JakartaRegular text-primary-600">
                                                    Subtotal: {(size.price * selectedSizes[size.id] * parseInt(estimatedDays)).toLocaleString()} VND
                                                    ({selectedSizes[size.id]} × {size.price.toLocaleString()} VND × {estimatedDays} days)
                                                </Text>
                                            </View>
                                        ) : null}
                                    </View>
                                ))}
                                
                                {!hasSelectedSizes() ? (
                                    <View className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                        <Text className="text-sm font-JakartaRegular text-orange-600 text-center">
                                            Please select at least one storage size to continue
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                        )}
                    </View>

                    {/* Location Information */}
                    <View className="bg-white rounded-lg p-4 mb-5">
                        <Text className="text-lg font-JakartaSemiBold mb-3">
                            Delivery Information
                        </Text>

                        <View className="flex flex-row items-center mb-3">
                            <Image source={icons.point} className="w-5 h-5" />
                            <View className="flex-1 ml-3">
                                <Text className="text-sm font-JakartaSemiBold">Your Location</Text>
                                <Text className="text-sm font-JakartaRegular text-general-200">
                                    {userAddress}
                                </Text>
                            </View>
                        </View>

                        <View className="flex flex-row items-center">
                            <Image source={icons.pin} className="w-5 h-5" />
                            <View className="flex-1 ml-3">
                                <Text className="text-sm font-JakartaSemiBold">Storage Location</Text>
                                <Text className="text-sm font-JakartaRegular text-general-200">
                                    {storageDetails.address}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Pricing Summary */}
                    <View className="bg-white rounded-lg p-4 mb-5">
                        <Text className="text-lg font-JakartaSemiBold mb-3">
                            Pricing Summary
                        </Text>

                        {/* Selected Sizes Breakdown */}
                        {hasSelectedSizes() ? (
                            <View className="mb-3">
                                <Text className="text-sm font-JakartaSemiBold text-general-800 mb-2">
                                    Selected Storage Sizes:
                                </Text>
                                {Object.entries(selectedSizes).map(([sizeId, quantity]) => {
                                    const size = availableSizes.find((s: SizeApiData) => s.id === sizeId)
                                    if (!size) return null
                                    
                                    return (
                                        <View key={sizeId} className="flex flex-row justify-between items-center py-1">
                                            <Text className="text-sm font-JakartaRegular text-general-200">
                                                {size.sizeDescription} × {quantity}
                                            </Text>
                                            <Text className="text-sm font-JakartaRegular">
                                                {(size.price * quantity * parseInt(estimatedDays)).toLocaleString()} VND
                                            </Text>
                                        </View>
                                    )
                                })}
                            </View>
                        ) : null}

                        <View className="flex flex-row justify-between items-center py-2">
                            <Text className="text-sm font-JakartaRegular">
                                Storage duration
                            </Text>
                            <Text className="text-sm font-JakartaRegular">
                                {estimatedDays} days
                            </Text>
                        </View>

                        <View className="flex flex-row justify-between items-center py-2 border-t border-general-700">
                            <Text className="text-lg font-JakartaBold">
                                Total Amount
                            </Text>
                            <Text className="text-lg font-JakartaBold text-primary-500">
                                {calculateTotalAmount(availableSizes).toLocaleString()} VND
                            </Text>
                        </View>
                        
                        {calculateTotalAmount(availableSizes) === 0 ? (
                            <View className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                                <Text className="text-sm font-JakartaRegular text-orange-600 text-center">
                                    Select storage sizes to see total amount
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Order Success Display - Improved Layout */}
                    {createdOrderId ? (
                        <View className="bg-green-50 border border-green-200 rounded-xl p-5 mb-5">
                            {/* Success Header */}
                            <View className="flex-row items-center justify-center mb-4">
                                <Ionicons name="checkmark-circle" size={28} color="#059669" />
                                <Text className="text-green-800 text-lg font-JakartaBold ml-3">
                                    Storage Reserved Successfully!
                                </Text>
                            </View>
                            
                            {/* Main Message */}
                            <Text className="text-green-700 text-center text-sm mb-4">
                                Your storage space has been reserved. Bring your items to store them. Payment is only required when you collect your items back.
                            </Text>
                            
                            {/* Next Steps Card */}
                            <View className="bg-white rounded-lg p-4 mb-4">
                                <Text className="text-gray-900 font-JakartaBold text-sm mb-3">
                                    📋 Next Steps:
                                </Text>
                                <View className="space-y-2">
                                    <View className="flex-row items-start">
                                        <Text className="text-gray-700 text-sm mr-2">•</Text>
                                        <Text className="text-gray-700 text-sm flex-1" numberOfLines={2}>
                                            Bring items to: {storageDetails.title}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-start">
                                        <Text className="text-gray-700 text-sm mr-2">•</Text>
                                        <Text className="text-gray-700 text-sm flex-1">
                                            Contact: {storageDetails.keeperName}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-start">
                                        <Text className="text-gray-700 text-sm mr-2">•</Text>
                                        <Text className="text-gray-700 text-sm flex-1">
                                            Payment when collecting items
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            
                            {/* Action Buttons */}
                            <View className="flex-row space-x-3 gap-3">
                                {storageDetails.keeperPhoneNumber ? (
                                    <TouchableOpacity
                                        onPress={() => Linking.openURL(`tel:${storageDetails.keeperPhoneNumber}`)}
                                        className="flex-1 bg-blue-600 rounded-lg py-3 flex-row items-center justify-center"
                                    >
                                        <Ionicons name="call" size={16} color="white" />
                                        <Text className="text-white font-JakartaBold text-sm ml-2">
                                            Call Keeper
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}
                                <TouchableOpacity
                                    onPress={() => router.replace('/(root)/(tabs)/home')}
                                    className="flex-1 bg-green-600 rounded-lg py-3 flex-row items-center justify-center"
                                >
                                    <Ionicons name="home" size={16} color="white" />
                                    <Text className="text-white font-JakartaBold text-sm ml-2">
                                        Go Home
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : null}

                    {/* Confirmation Button */}
                    {!createdOrderId ? (
                        <CustomButton
                            title="Confirm Booking"
                            onPress={handleBookingConfirmation}
                            isLoading={isLoading}
                            className="mt-5 mb-10"
                        />
                    ) : null}
                </ScrollView>
        </SafeAreaView>
    )
}

export default BookStorage