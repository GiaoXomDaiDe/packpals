import { TextInputProps, TouchableOpacityProps } from 'react-native'

declare interface Driver {
    id: number
    first_name: string
    last_name: string
    profile_image_url: string
    car_image_url: string
    car_seats: number
    rating: number
}

declare interface MarkerData {
    latitude: number
    longitude: number
    id: number
    title: string
    profile_image_url: string
    car_image_url: string
    car_seats: number
    rating: number
    first_name: string
    last_name: string
    time?: number
    price?: string
}

declare interface MapProps {
    destinationLatitude?: number
    destinationLongitude?: number
    onDriverTimesCalculated?: (driversWithTimes: MarkerData[]) => void
    selectedDriver?: number | null
    onMapReady?: () => void
}

declare interface Ride {
    ride_id: string
    origin_address: string
    destination_address: string
    origin_latitude: number
    origin_longitude: number
    destination_latitude: number
    destination_longitude: number
    ride_time: number
    fare_price: number
    payment_status: string
    driver_id: number
    user_id: string
    created_at: string
    driver: {
        first_name: string
        last_name: string
        car_seats: number
    }
    // New fields for simplified status tracking
    ride_status?:
        | 'pending'
        | 'driver_assigned'
        | 'driver_en_route'
        | 'driver_arrived'
        | 'in_progress'
        | 'completed'
        | 'cancelled'
    driver_assigned_at?: string
    trip_started_at?: string
    trip_completed_at?: string
    estimated_arrival_minutes?: number
    eta_minutes?: number
}

declare interface ButtonProps extends TouchableOpacityProps {
    title: string
    bgVariant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'success'
    textVariant?: 'primary' | 'default' | 'secondary' | 'danger' | 'success'
    IconLeft?: React.ComponentType<any>
    IconRight?: React.ComponentType<any>
    className?: string
    isLoading?: boolean
}

declare interface GoogleInputProps {
    icon?: string
    initialLocation?: string
    containerStyle?: string
    textInputBackgroundColor?: string
    handlePress: ({
        latitude,
        longitude,
        address,
    }: {
        latitude: number
        longitude: number
        address: string
    }) => void
}

declare interface InputFieldProps extends TextInputProps {
    label: string
    icon?: any
    name?:
        | 'name'
        | 'email'
        | 'password'
        | 'confirmPassword'
        | 'dateOfBirth'
        | 'phoneNumber'
        | 'gender'
    secureTextEntry?: boolean
    labelStyle?: string
    containerStyle?: string
    inputStyle?: string
    iconStyle?: string
    className?: string
}

declare interface PaymentProps {
    fullName: string
    email: string
    amount: string
    driverId: number
    rideTime: number
    driverName: string
    driverImage?: string
}

declare interface LocationStore {
    userLatitude: number | null
    userLongitude: number | null
    userAddress: string | null
    destinationLatitude: number | null
    destinationLongitude: number | null
    destinationAddress: string | null
    setUserLocation: ({
        latitude,
        longitude,
        address,
    }: {
        latitude: number
        longitude: number
        address: string
    }) => void
    setDestinationLocation: ({
        latitude,
        longitude,
        address,
    }: {
        latitude: number
        longitude: number
        address: string
    }) => void
    clearDestination: () => void
}

declare interface DriverStore {
    drivers: MarkerData[]
    selectedDriver: number | null
    setSelectedDriver: (driverId: number) => void
    setDrivers: (drivers: MarkerData[]) => void
    clearSelectedDriver: () => void
}

declare interface DriverCardProps {
    item: MarkerData
    selected: number
    setSelected: () => void
}

declare interface Review {
    id: number
    ride_id: string
    user_id: string
    driver_id: number
    rating: number
    review_text?: string
    created_at: string
    updated_at: string
    first_name?: string
    last_name?: string
    driver_image?: string
}

declare interface ReviewSummary {
    reviews: Review[]
    averageRating?: number
    totalReviews?: number
}

declare interface CreateReviewRequest {
    rideId: string
    userId: string
    driverId: number
    rating: number
    reviewText?: string
}

declare interface UpdateReviewRequest {
    reviewId: number
    rating?: number
    reviewText?: string
}

declare interface CompletedRide {
    rideId: string
    driverId: number
    driverName: string
    driverImage?: string
    originAddress: string
    destinationAddress: string
    farePrice: number
    completedAt: string
    reviewed?: boolean
}

declare interface RideStore {
    completedRide: CompletedRide | null
    setCompletedRide: (ride: CompletedRide) => void
    clearCompletedRide: () => void
}
