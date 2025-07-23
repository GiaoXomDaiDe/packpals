import * as z from 'zod'

// Create order schema
export const CreateOrderSchema = z.object({
    storageId: z.string().min(1, 'Storage selection is required'),
    packageDescription: z.string().min(5, 'Package description must be at least 5 characters'),
    estimatedDays: z.number().min(1, 'Estimated days must be at least 1'),
    totalAmount: z.number().min(0, 'Total amount must be positive'),
    deliveryInstructions: z.string().optional(),
})

// Update order schema
export const UpdateOrderSchema = z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'IN_STORAGE', 'COMPLETED', 'CANCELLED']).optional(),
    packageDescription: z.string().optional(),
    actualEndDate: z.string().optional(),
    keeperNotes: z.string().optional(),
})

// Order filter schema
export const OrderFilterSchema = z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'IN_STORAGE', 'COMPLETED', 'CANCELLED']).optional(),
    dateRange: z.object({
        startDate: z.string(),
        endDate: z.string(),
    }).optional(),
    storageId: z.string().optional(),
    renterId: z.string().optional(),
})

// Package tracking schema
export const PackageTrackingSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    trackingCode: z.string().optional(),
    notes: z.string().optional(),
})

// Type exports
export type CreateOrderFormData = z.infer<typeof CreateOrderSchema>
export type UpdateOrderFormData = z.infer<typeof UpdateOrderSchema>
export type OrderFilterFormData = z.infer<typeof OrderFilterSchema>
export type PackageTrackingFormData = z.infer<typeof PackageTrackingSchema>