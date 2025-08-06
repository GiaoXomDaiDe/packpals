
// Đơn giản hóa types - chỉ những gì cần thiết

export interface User {
    id: string
    email: string
    username: string
    phoneNumber: string
    role: string
    status?: string
    avatarUrl?: string
    renter?: {
        renterId: string
    }
    keeper?: any
}

export interface LoginResponse {
    user: any  // Flexible để handle bất kỳ structure nào từ backend
    token: string
}

export interface AuthStore {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    setUser: (user: User, token?: string) => void
    clearUser: () => void
}
