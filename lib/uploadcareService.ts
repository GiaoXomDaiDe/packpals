interface UploadcareResponse {
    file: string // URL của file đã upload
}

export class UploadcareService {
    private static readonly API_BASE = 'https://upload.uploadcare.com'
    private static readonly PUBLIC_KEY =
        process.env.EXPO_PUBLIC_UPLOADCARE_KEY || 'your-public-key'

    /**
     * Upload image to Uploadcare CDN
     */
    static async uploadImage(base64DataURL: string): Promise<string | null> {
        try {
            // Create form data
            const formData = new FormData()
            formData.append('UPLOADCARE_PUB_KEY', this.PUBLIC_KEY)
            formData.append('UPLOADCARE_STORE', '1')

            // Convert base64 to blob
            const response = await fetch(base64DataURL)
            const blob = await response.blob()
            formData.append('file', blob, 'profile-image.jpg')

            // Upload to Uploadcare
            const uploadResponse = await fetch(`${this.API_BASE}/base/`, {
                method: 'POST',
                body: formData,
            })

            if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${uploadResponse.status}`)
            }

            const result: UploadcareResponse = await uploadResponse.json()

            // Return CDN URL
            return `https://ucarecdn.com/${result.file}/`
        } catch (error) {
            console.error('Error uploading to Uploadcare:', error)
            return null
        }
    }

    /**
     * Upload image with transformations
     */
    static async uploadImageWithTransform(
        base64DataURL: string,
        transformations: string = '-/resize/400x400/-/quality/smart/'
    ): Promise<string | null> {
        try {
            const baseUrl = await this.uploadImage(base64DataURL)
            if (!baseUrl) return null

            // Add transformations to URL
            return (
                baseUrl.replace(
                    'https://ucarecdn.com/',
                    `https://ucarecdn.com/`
                ) + transformations
            )
        } catch (error) {
            console.error('Error uploading with transforms:', error)
            return null
        }
    }
}
