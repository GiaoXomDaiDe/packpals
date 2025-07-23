import apiClient from '../config/axios.config'
import { SuccessResponse } from '../types/type'

// Updated interface to match backend response
export interface UploadFileData {
  fileUrl: string
  fileName: string
  fileSize: number
  uploadDate: string
}

export type UploadApiResponse = SuccessResponse<{
  fileUrl: UploadFileData
}>

export class UploadAPI {
    private readonly baseEndpoint = '/upload'

    /**
     * Upload image file to server
     */
    async uploadImage(imageUri: string, fileName?: string): Promise<string> {
        try {
            console.log('📤 Uploading image:', imageUri)
            
            // Create FormData
            const formData = new FormData()
            
            // Generate filename if not provided
            const finalFileName = fileName || `image_${Date.now()}.jpg`
            
            // Add file to FormData
            formData.append('file', {
                uri: imageUri,
                type: 'image/jpeg',
                name: finalFileName,
            } as any)

            console.log('📤 FormData prepared, sending to:', this.baseEndpoint)

            const response = await apiClient.post(this.baseEndpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            })

            console.log('📤 Upload response status:', response.status)
            
            const result: UploadApiResponse = response.data
            console.log('✅ Upload successful:', result)
            
            // Extract the actual file URL from the nested response structure
            const fileUrl = result.data?.fileUrl?.fileUrl
            if (!fileUrl) {
                throw new Error('No file URL found in upload response')
            }
            
            return fileUrl
        } catch (error: any) {
            console.error('❌ Upload error:', error)
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to upload image')
            }
            throw error
        }
    }

    /**
     * Upload multiple images
     */
    async uploadMultipleImages(imageUris: string[]): Promise<string[]> {
        try {
            console.log('📤 Uploading multiple images:', imageUris.length)
            
            const uploadPromises = imageUris.map((uri, index) => 
                this.uploadImage(uri, `certification_${Date.now()}_${index}.jpg`)
            )
            
            const results = await Promise.all(uploadPromises)
            // Results are now string URLs directly
            
            console.log('✅ All images uploaded successfully:', results)
            return results
        } catch (error: any) {
            console.error('❌ Multiple upload error:', error)
            if (error.response) {
                throw new Error(error.response.data?.message || 'Failed to upload multiple images')
            }
            throw error
        }
    }
}

export const uploadAPI = new UploadAPI()
export default uploadAPI