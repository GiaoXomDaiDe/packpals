import * as z from 'zod'

// Create storage schema
export const CreateStorageSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    address: z.string().min(5, 'Address is required'),
    pricePerDay: z.number().min(1, 'Price must be at least $1 per day'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    images: z.array(z.string()).optional(),
})

// Update storage schema
export const UpdateStorageSchema = CreateStorageSchema.partial()

// Search storage schema
export const SearchStorageSchema = z.object({
    address: z.string().optional(),
    maxDistance: z.number().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE']).optional(),
})

// Storage filter schema
export const StorageFilterSchema = z.object({
    priceRange: z.object({
        min: z.number(),
        max: z.number(),
    }).optional(),
    distance: z.number().optional(),
    rating: z.number().min(1).max(5).optional(),
    availability: z.boolean().optional(),
})

// Type exports
export type CreateStorageFormData = z.infer<typeof CreateStorageSchema>
export type UpdateStorageFormData = z.infer<typeof UpdateStorageSchema>
export type SearchStorageFormData = z.infer<typeof SearchStorageSchema>
export type StorageFilterFormData = z.infer<typeof StorageFilterSchema>