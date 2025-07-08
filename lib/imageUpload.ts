import * as FileSystem from 'expo-file-system'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
import { Alert } from 'react-native'

export interface ImagePickerOptions {
    allowsEditing?: boolean
    aspect?: [number, number]
    quality?: number
    mediaTypes?: ImagePicker.MediaTypeOptions
}

export interface ImageResult {
    uri: string
    base64?: string
    width?: number
    height?: number
    fileName?: string
}

export class ImageUploadService {
    /**
     * Request permissions for image picker
     */
    static async requestPermissions(): Promise<boolean> {
        try {
            // Request camera permission
            const cameraPermission =
                await ImagePicker.requestCameraPermissionsAsync()

            // Request media library permission
            const mediaPermission =
                await ImagePicker.requestMediaLibraryPermissionsAsync()

            if (
                cameraPermission.status !== 'granted' ||
                mediaPermission.status !== 'granted'
            ) {
                Alert.alert(
                    'Permission Required',
                    'Please allow camera and photo library access to change your profile picture.',
                    [{ text: 'OK' }]
                )
                return false
            }

            return true
        } catch (error) {
            console.error('Error requesting permissions:', error)
            return false
        }
    }

    /**
     * Show image picker options (Camera or Gallery)
     */
    static async pickImage(
        options: ImagePickerOptions = {}
    ): Promise<ImageResult | null> {
        try {
            const hasPermission = await this.requestPermissions()
            if (!hasPermission) return null

            return new Promise((resolve) => {
                Alert.alert(
                    'Select Image',
                    'Choose an option to update your profile picture',
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => resolve(null),
                        },
                        {
                            text: 'Camera',
                            onPress: async () => {
                                const result = await this.openCamera(options)
                                resolve(result)
                            },
                        },
                        {
                            text: 'Gallery',
                            onPress: async () => {
                                const result = await this.openGallery(options)
                                resolve(result)
                            },
                        },
                    ]
                )
            })
        } catch (error) {
            console.error('Error picking image:', error)
            return null
        }
    }

    /**
     * Open camera to take photo
     */
    static async openCamera(
        options: ImagePickerOptions = {}
    ): Promise<ImageResult | null> {
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes:
                    options.mediaTypes || ImagePicker.MediaTypeOptions.Images,
                allowsEditing: options.allowsEditing ?? true,
                aspect: options.aspect || [1, 1],
                quality: options.quality || 0.8,
                base64: true,
            })

            if (result.canceled || !result.assets?.[0]) {
                return null
            }

            const asset = result.assets[0]
            return {
                uri: asset.uri,
                base64: asset.base64 || undefined,
                width: asset.width,
                height: asset.height,
                fileName: asset.fileName || `camera_${Date.now()}.jpg`,
            }
        } catch (error) {
            console.error('Error opening camera:', error)
            Alert.alert('Error', 'Failed to open camera')
            return null
        }
    }

    /**
     * Open gallery to select photo
     */
    static async openGallery(
        options: ImagePickerOptions = {}
    ): Promise<ImageResult | null> {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes:
                    options.mediaTypes || ImagePicker.MediaTypeOptions.Images,
                allowsEditing: options.allowsEditing ?? true,
                aspect: options.aspect || [1, 1],
                quality: options.quality || 0.8,
                base64: true,
            })

            if (result.canceled || !result.assets?.[0]) {
                return null
            }

            const asset = result.assets[0]
            return {
                uri: asset.uri,
                base64: asset.base64 || undefined,
                width: asset.width,
                height: asset.height,
                fileName: asset.fileName || `gallery_${Date.now()}.jpg`,
            }
        } catch (error) {
            console.error('Error opening gallery:', error)
            Alert.alert('Error', 'Failed to open gallery')
            return null
        }
    }

    /**
     * Convert image to base64 data URL for uploading
     */
    static async convertToBase64DataURL(
        imageResult: ImageResult
    ): Promise<string | null> {
        try {
            if (imageResult.base64) {
                return `data:image/jpeg;base64,${imageResult.base64}`
            }

            // If base64 not available, read from file system
            const base64 = await FileSystem.readAsStringAsync(imageResult.uri, {
                encoding: FileSystem.EncodingType.Base64,
            })

            return `data:image/jpeg;base64,${base64}`
        } catch (error) {
            console.error('Error converting to base64:', error)
            return null
        }
    }

    /**
     * Resize image if needed (for large images)
     */
    static async resizeImage(
        imageResult: ImageResult,
        maxWidth: number = 800
    ): Promise<ImageResult | null> {
        try {
            if (!imageResult.width || imageResult.width <= maxWidth) {
                return imageResult
            }

            const ratio = maxWidth / imageResult.width
            const newHeight = imageResult.height
                ? Math.floor(imageResult.height * ratio)
                : maxWidth

            const manipulatedImage = await manipulateAsync(
                imageResult.uri,
                [{ resize: { width: maxWidth, height: newHeight } }],
                {
                    compress: 0.8,
                    format: SaveFormat.JPEG,
                    base64: true,
                }
            )

            return {
                uri: manipulatedImage.uri,
                base64: manipulatedImage.base64,
                width: maxWidth,
                height: newHeight,
                fileName: imageResult.fileName,
            }
        } catch (error) {
            console.error('Error resizing image:', error)
            return imageResult // Return original if resize fails
        }
    }
}
