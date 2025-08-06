export interface LoginReqBody {
    email: string
    password: string
}

export interface RegisterReqBody {
    email: string
    password: string
    confirmPassword: string
    username: string
    phoneNumber: string
}

export interface ChangePasswordReqBody {
    currentPassword?: string
    newPassword: string
    confirmNewPassword: string
}

export interface ForgotPasswordReqBody {
    currentPassword?: string
    newPassword: string
    confirmNewPassword: string
}