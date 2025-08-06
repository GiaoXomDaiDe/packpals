// Đơn giản hóa - chỉ những gì cần thiết

export interface LoginTokenData {
    tokenString: string
    id: string
    email: string
    role: string
    expiresInMilliseconds: number
}

// Basic response wrapper
export interface ApiResponse<T = any> {
    data: T
    message?: string
    statusCode?: number
    success?: boolean
}

