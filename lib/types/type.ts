import { TextInputProps, TouchableOpacityProps } from 'react-native'

export interface SuccessResponse<T = any> {
    data: T
    additionalData: null
    message: string
    statusCode: number
    code: string
}

export interface ErrorResponse {
    message: string
    statusCode: number
    code: string
}

export interface SuccessResponseWithPagination<T> {
    data: {
        pageIndex: number
        totalPages: number
        pageSize: number
        totalCount: number
        hasPrevious: boolean
        hasNext: boolean
        data: T[]
    }
    additionalData: null
    message: string
    statusCode: number
    code: string
}

// SignalR Notification Types
export interface SignalRNotification {
    id: string
    type: 'NEW_ORDER' | 'ORDER_STATUS_CHANGE' | 'PENDING_COUNT_UPDATE'
    title: string
    message: string
    data: any
    timestamp: Date
    read: boolean
}

export interface NewOrderNotification {
    orderId: string
    storageId: string
    customerName: string
    itemCount: number
    totalAmount: number
    createdAt: string
    message: string
}

export interface OrderStatusChangeNotification {
    orderId: string
    oldStatus: string
    newStatus: string
    customerName: string
    updatedAt: string
    message: string
}

export interface PendingCountNotification {
    keeperId: string
    pendingCount: number
}

export interface SignalRConnectionState {
    isConnected: boolean
    isConnecting: boolean
    connectionError: string | null
    lastConnectedAt: Date | null
    reconnectAttempts: number
}

// Storage Domain Types
export interface Storage {
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
    keeperPhoneNumber?: string
    pendingOrdersCount?: number // New field for keeper notification badges
}

// Storage API Response Types (matching backend exactly)
export interface StorageApiData {
    id: string
    status: 'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE'
    description: string
    address: string
    keeperId: string
    latitude: number
    longitude: number
    keeperName: string
    keeperPhoneNumber: string
    averageRating: number
    ratingCount: number
    pendingOrdersCount?: number // New field for keeper notification badges
}

export interface StorageListResponse {
    pageIndex: number
    totalPages: number
    pageSize: number
    totalCount: number
    hasPrevious: boolean
    hasNext: boolean
    data: StorageApiData[]
}

// Updated to use generic SuccessResponseWithPagination
export type StorageSuccessResponse = SuccessResponseWithPagination<StorageApiData>

// Single storage response
export type SingleStorageApiResponse = SuccessResponse<StorageApiData>

// Keeper storages response (array of storages)
export type KeeperStoragesApiResponse = SuccessResponse<StorageApiData[]>

export interface Keeper {
    id: string
    identityNumber: string
    documents: string
    userId: string
    user?: User
    storages?: Storage[]
}

export interface User {
    id: string
    email: string
    username: string
    phoneNumber: string
    role: 'RENTER' | 'KEEPER'
}

// Enhanced Order types for API responses
export interface OrderApiData {
    id: string
    renterId: string
    storageId: string
    status: 'PENDING' | 'CONFIRMED' | 'IN_STORAGE' | 'COMPLETED' | 'CANCELLED'
    totalAmount?: number
    packageDescription: string
    orderDate?: string
    createdAt?: string
    updatedAt?: string
    isPaid: boolean
    startKeepTime?: string
    endKeepTime?: string
    renter?: RenterProfile
    storage?: StorageOrderInfo
    orderDetails?: OrderDetailApiData[]
}

export interface StorageOrderInfo {
    id: string
    description: string
    address: string
    keeperId: string
    keeperName?: string
    latitude?: number
    longitude?: number
    status?: string
}

export interface OrderDetailApiData {
    id: string
    orderId: string
    sizeId: string
    quantity?: number
    unitPrice?: number
    totalPrice?: number
    size?: SizeApiData
}

// Orders list API response
export interface OrdersListResponse {
    pageIndex: number
    totalPages: number
    pageSize: number
    totalCount: number
    hasPrevious: boolean
    hasNext: boolean
    data: OrderApiData[]
}

// Updated Order API responses
export type OrdersSuccessResponse = SuccessResponseWithPagination<OrderApiData>
export type OrderSuccessResponse = SuccessResponse<OrderApiData>
export type StorageOrdersApiResponse = SuccessResponse<OrderApiData[]>

// Legacy Order interface (for backward compatibility)
export interface Order {
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

export interface OrderDetail {
    id: string
    orderId: string
    sizeId: string
    quantity: number
    unitPrice: number
    totalPrice: number
    size?: Size
}

export interface Size {
    id: string
    name: string
    sizeDescription: string
    price: number
    dimensions: string
}

// API Response Types for Book Storage
export interface SizeApiData {
    id: string
    name: string
    sizeDescription: string
    price: number
    dimensions: string
}

export interface SizeListResponse {
    pageIndex: number
    totalPages: number
    pageSize: number
    totalCount: number
    hasPrevious: boolean
    hasNext: boolean
    data: SizeApiData[]
}

// Updated Size API response
export type SizeSuccessResponse = SuccessResponseWithPagination<SizeApiData>

// User Profile API Response Types
export interface RenterProfile {
    renterId: string
}

export interface KeeperProfile {
    keeperId: string
    identityNumber: string
    documents: string
}

export interface UserDetailData {
    id: string
    email: string
    username: string
    phoneNumber: string
    role: 'RENTER' | 'KEEPER'
    renter?: RenterProfile
    keeper?: KeeperProfile
}

// Updated User API responses
export type UserDetailApiResponse = SuccessResponse<UserDetailData>

export interface UserProfileData {
    id: string
    email: string
    password: null
    username: string
    phoneNumber: string
    role: 'RENTER' | 'KEEPER'
    renter: RenterProfile | null
    keeper: KeeperProfile | null
}

export type UserProfileSuccessResponse = SuccessResponse<UserProfileData>

// Order Creation API Types
export interface CreateOrderRequest {
    renterId: string
    storageId: string
    packageDescription: string
    estimatedDays: number
}

export type CreateOrderResponse = SuccessResponse<string>

// Order Details API Types (matching POST /api/OrderDetail/{orderId})
export interface OrderDetailItem {
    sizeId: string
}

// Request body for creating order details (array of size IDs)
// The orderId is passed as URL parameter, not in the body
export type CreateOrderDetailsRequest = OrderDetailItem[]

// For the hook, we need both orderId and the request body
export interface CreateOrderDetailsParams {
    orderId: string
    orderDetails: CreateOrderDetailsRequest
}

// Response for creating order details
export type CreateOrderDetailsResponse = SuccessResponse<any>

// Distance API Types
export interface DistanceRequest {
    userLatitude: number
    userLongitude: number
    storageLatitude: number
    storageLongitude: number
}

export interface DistanceResponse {
    distance: number // in kilometers
    duration: number // in minutes
    route?: {
        coordinates: Array<{
            latitude: number
            longitude: number
        }>
    }
}

export type DistanceSuccessResponse = SuccessResponse<DistanceResponse>

export interface StorageMarkerData {
    id: string
    title: string
    address: string
    latitude: number
    keeperId: string
    longitude: number
    status: string
    pricePerDay: number
    rating: number
    keeperName: string
    keeperPhoneNumber: string
    images: string[]
    description: string
    amenities?: string[]
    totalSpaces?: number
    availableSpaces?: number
}

export interface ButtonProps extends TouchableOpacityProps {
    title: string
    bgVariant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'success'
    textVariant?: 'primary' | 'default' | 'secondary' | 'danger' | 'success'
    IconLeft?: React.ComponentType<any>
    IconRight?: React.ComponentType<any>
    className?: string
    isLoading?: boolean
}

export interface GoogleInputProps {
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

export interface InputFieldProps extends TextInputProps {
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

export interface PaymentProps {
    fullName: string
    email: string
    amount: string
    storageId: string
    orderId: string
    storageName: string
    storageImage?: string
}

export interface LocationStore {
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

export interface StorageStore {
    storages: StorageMarkerData[]
    selectedStorage: string | null
    setSelectedStorage: (storageId: string) => void
    setStorages: (storages: StorageMarkerData[]) => void
    clearSelectedStorage: () => void
}

export interface StorageCardProps {
    item: StorageMarkerData
    selected: string | null
    setSelected: () => void
}

export interface StorageRating {
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

export interface RatingSummary {
    ratings: StorageRating[]
    averageRating?: number
    totalRatings?: number
}

export interface CreateRatingRequest {
    orderId: string
    userId: string
    storageId: string
    rating: number
    reviewText?: string
}

export interface UpdateRatingRequest {
    ratingId: string
    rating?: number
    reviewText?: string
}

export interface CompletedOrder {
    orderId: string
    storageId: string
    storageName: string
    storageImage?: string
    packageDescription: string
    totalAmount: number
    completedAt: string
    reviewed?: boolean
}

export interface OrderStore {
    completedOrder: CompletedOrder | null
    setCompletedOrder: (order: CompletedOrder) => void
    clearCompletedOrder: () => void
}

// Ride types (these seem to be legacy)
export interface Ride {
    id: string
    // Add other ride properties as needed
}

export interface Driver {
    id: string
    // Add other driver properties as needed
}

export interface MarkerData {
    id: string
    // Add other marker properties as needed
}

export interface DriverCardProps {
    // Add driver card properties as needed
}

export enum OrderStatus {
    PENDING = 'PENDING',     // Vừa tạo, chờ keeper confirm
    CONFIRMED = 'CONFIRMED', // Keeper đã xác nhận
    IN_STORAGE = 'IN_STORAGE', // Nhận được gói hàng và bắt đầu tính giờ
    COMPLETED = 'COMPLETED', // Hoàn thành và đã thanh toán
    CANCELLED = 'CANCELLED'  // Đã hủy
}

// Order Update API Types (supports PATCH method)
export interface UpdateOrderRequest {
    id: string
    packageDescription?: string
    status?: string
    orderCertification?: string[]
    estimatedDays?: number
    isPaid?: boolean
    startTime?: string
    endTime?: string
    totalAmount?: number
    [key: string]: any // Allow additional fields
}

export type UpdateOrderResponse = SuccessResponse<any>
