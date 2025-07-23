import { uploadAPI } from '@/lib/api/upload.api'
import { useMutation, UseMutationOptions } from '@tanstack/react-query'

export interface UseUploadImagesOptions {
  onSuccess?: (urls: string[]) => void
  onError?: (error: Error) => void
}

/**
 * Hook for uploading multiple images
 */
export function useUploadImages(
  options?: UseMutationOptions<string[], Error, string[]>
) {
  return useMutation<string[], Error, string[]>({
    mutationFn: async (imageUris: string[]) => {
      console.log('🔄 Starting image upload process for', imageUris.length, 'images')
      return await uploadAPI.uploadMultipleImages(imageUris)
    },
    onSuccess: (urls, variables) => {
      console.log('✅ Image upload completed successfully:', urls)
    },
    onError: (error, variables) => {
      console.error('❌ Image upload failed:', error)
    },
    ...options,
  })
}

/**
 * Hook for uploading single image
 */
export function useUploadImage(
  options?: UseMutationOptions<string, Error, string>
) {
  return useMutation<string, Error, string>({
    mutationFn: async (imageUri: string) => {
      console.log('🔄 Starting single image upload:', imageUri)
      const url = await uploadAPI.uploadImage(imageUri)
      return url
    },
    onSuccess: (url, variable) => {
      console.log('✅ Single image upload completed:', url)
    },
    onError: (error, variable) => {
      console.error('❌ Single image upload failed:', error)
    },
    ...options,
  })
}