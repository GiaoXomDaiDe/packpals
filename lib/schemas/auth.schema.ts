import { z } from 'zod'

// Sign Up Schema
export const SignUpSchema = z.object({
    username: z.string().min(3, 'Tên người dùng phải có ít nhất 3 ký tự'),
    email: z.string().email('Vui lòng nhập email hợp lệ'),
    phoneNumber: z.string().min(10, 'Số điện thoại phải có ít nhất 10 số'),
    password: z.string()
        .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
        .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
        .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
        .regex(/\d/, 'Mật khẩu phải có ít nhất 1 số')
        .regex(/[@#$%^&*!_]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (@#$%^&*!_)'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
})

// Sign In Schema
export const SignInSchema = z.object({
    email: z.string().email('Vui lòng nhập email hợp lệ'),
    password: z.string().min(1, 'Mật khẩu không được để trống')
})

// Change Password Schema
export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống'),
    newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
    confirmNewPassword: z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmNewPassword"],
})

// Forgot Password Schema
export const ForgotPasswordSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string()
        .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
        .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
        .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
        .regex(/\d/, 'Mật khẩu phải có ít nhất 1 số'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword']
})

// Reset Password Schema
export const ResetPasswordSchema = z.object({
    token: z.string().min(1, 'Mã reset không được để trống'),
    newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
})

// Export form data types
export type SignUpFormData = z.infer<typeof SignUpSchema>
export type SignInFormData = z.infer<typeof SignInSchema>
export type ChangePasswordFormData = z.infer<typeof ChangePasswordSchema>
export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>
