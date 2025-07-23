// Auth User interface
export interface AuthUser {
    id: string
    email: string
    username: string
    phoneNumber: string
    role: 'RENTER' | 'KEEPER'
}

// Login credentials interface
export interface LoginCredentials {
    email: string
    password: string
}

// Registration data interface
export interface RegisterData {
    email: string
    password: string
    confirmPassword: string // Add confirmPassword field
    username: string
    phoneNumber: string
}

// Auth response from API
export interface AuthResponse {
    success: boolean
    message: string
    statusCode: number
    data: {
        user: AuthUser
        token: string
    } | null
}

// Auth service response
export interface AuthServiceResponse {
    user: AuthUser
    token: string
}

// Auth store interface
export interface AuthStore {
    user: AuthUser | null
    isAuthenticated: boolean
    token: string | null
    setUser: (user: AuthUser, token?: string) => void
    clearUser: () => void
    setToken: (token: string) => void
}

// Password change data
export interface ChangePasswordData {
    oldPassword: string
    newPassword: string
}

// JWT token payload (for future token validation)
export interface JWTPayload {
    sub: string // user id
    email: string
    role: 'RENTER' | 'KEEPER'
    iat: number // issued at
    exp: number // expiration
}

// Auth error types
export interface AuthError {
    message: string
    field?: string
    code?: string
}

// OAuth provider types (for future OAuth implementation)
export type OAuthProvider = 'google' | 'facebook' | 'apple'

export interface OAuthResponse {
    success: boolean
    provider: OAuthProvider
    user?: AuthUser
    token?: string
    error?: string
}