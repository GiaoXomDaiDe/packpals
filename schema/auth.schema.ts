import * as z from 'zod'

export const SignUpSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, 'Name is required')
            .max(50, 'Name must be less than 50 characters'),
        email: z
            .string()
            .email('Invalid email format')
            .trim()
            .min(1, 'Email is required')
            .max(100, 'Email must be less than 100 characters'),
        dateOfBirth: z
            .string()
            .date('Invalid date format')
            .refine(
                (value) => {
                    const date = new Date(value)
                    const today = new Date()
                    return date <= today
                },
                {
                    message: 'Date of birth must be in the past',
                }
            ),
        phoneNumber: z
            .string()
            .trim()
            .optional()
            .refine(
                (value) => {
                    if (!value || value === '') return true
                    const phoneRegex = /^[+]?[(]?[\d\s\-\(\)]{10,}$/
                    return phoneRegex.test(value)
                },
                {
                    message: 'Please enter a valid phone number',
                }
            ),
        gender: z
            .enum(['male', 'female', 'other', 'prefer_not_to_say'])
            .optional(),
        password: z
            .string()
            .trim()
            .min(8, 'Password must be at least 8 characters long')
            .max(50, 'Password must be less than 50 characters'),
        confirmPassword: z
            .string()
            .trim()
            .min(8, 'Confirm Password must be at least 8 characters long')
            .max(50, 'Confirm Password must be less than 50 characters'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match hehe',
        path: ['confirmPassword'],
    })

export type SignUpSchemaType = z.infer<typeof SignUpSchema>
