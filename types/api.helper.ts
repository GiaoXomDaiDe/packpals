// API Helper Types - Đơn giản và dễ hiểu

// Basic response structure
export interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  message?: string
  statusCode?: number
}

// Simple request/response types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  confirmPassword: string
  username: string
  phoneNumber: string
}

export interface ChangePasswordRequest {
  currentPassword?: string
  newPassword: string
  confirmNewPassword: string
}

export interface ForgotPasswordRequest {
  newPassword: string
  confirmNewPassword: string
}

// Simple response types
export type LoginResponseData = {
  user: any
  token: string
}

export type StringResponse = string
