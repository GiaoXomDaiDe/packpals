import { TextInputProps, TouchableOpacityProps } from 'react-native'

// API Response Types
declare interface SuccessResponse<T = any> {
    data: T
    additionalData?: any
    message: string
    statusCode: 200
    code: 'SUCCESS'
}

declare interface ErrorResponse {
    message: string
    statusCode: number
}

// Storage Domain Types
declare interface Storage {
    id: string
    status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
    description: string
    address: string
    keeperId: string
    keeper?: Keeper
    latitude?: number
    longitude?: number
    pricePerDay?: number
    images?: string[]
    rating?: number
    totalOrders?: number
}

declare interface Keeper {
    id: string
    identityNumber: string
    documents: string
    userId: string
    user?: User
    storages?: Storage[]
}

declare interface User {
    id: string
    email: string
    username: string
    phoneNumber: string
    role: 'RENTER' | 'KEEPER'
}

declare interface Order {
    id: string
    renterId: string
    storageId: string
    status: 'PENDING' | 'CONFIRMED' | 'IN_STORAGE' | 'COMPLETED' | 'CANCELLED'
    totalAmount: number
    packageDescription: string
    orderDate: string
    isPaid: boolean
    startKeepTime?: string
    renter?: User
    storage?: Storage
    orderDetails?: OrderDetail[]
}

declare interface OrderDetail {
    id: string
    orderId: string
    sizeId: string
    quantity: number
    unitPrice: number
    totalPrice: number
    size?: Size
}

declare interface Size {
    id: string
    name: string
    description: string
    price: number
    dimensions: string
}

declare interface StorageMarkerData {
    id: string
    title: string
    address: string
    latitude: number
    longitude: number
    status: string
    pricePerDay: number
    rating: number
    keeperName: string
    images: string[]
    description: string
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
        | 'username'
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
    storageId: string
    orderId: string
    storageName: string
    storageImage?: string
    onPaymentSuccess?: () => void
}

declare interface LocationStore {
    userLatitude: number | null
    userLongitude: number | null
    userAddress: string | null
    selectedStorageLatitude: number | null
    selectedStorageLongitude: number | null
    selectedStorageAddress: string | null
    setUserLocation: ({
        latitude,
        longitude,
        address,
    }: {
        latitude: number
        longitude: number
        address: string
    }) => void
    setSelectedStorageLocation: ({
        latitude,
        longitude,
        address,
    }: {
        latitude: number
        longitude: number
        address: string
    }) => void
    clearSelectedStorage: () => void
}

declare interface StorageStore {
    storages: StorageMarkerData[]
    selectedStorage: string | null
    setSelectedStorage: (storageId: string) => void
    setStorages: (storages: StorageMarkerData[]) => void
    clearSelectedStorage: () => void
}

declare interface StorageCardProps {
    item: StorageMarkerData
    selected: string | null
    setSelected: () => void
}

declare interface StorageRating {
    id: string
    orderId: string
    userId: string
    storageId: string
    rating: number
    reviewText?: string
    createdAt: string
    updatedAt: string
    userName?: string
    userImage?: string
}

declare interface RatingSummary {
    ratings: StorageRating[]
    averageRating?: number
    totalRatings?: number
}

declare interface CreateRatingRequest {
    orderId: string
    userId: string
    storageId: string
    rating: number
    reviewText?: string
}

declare interface UpdateRatingRequest {
    ratingId: string
    rating?: number
    reviewText?: string
}

declare interface CompletedOrder {
    orderId: string
    storageId: string
    storageName: string
    storageImage?: string
    packageDescription: string
    totalAmount: number
    completedAt: string
    reviewed?: boolean
}

declare interface OrderStore {
    completedOrder: CompletedOrder | null
    setCompletedOrder: (order: CompletedOrder) => void
    clearCompletedOrder: () => void
}
