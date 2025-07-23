import { Image } from 'expo-image'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import ImageViewing from 'react-native-image-viewing'
import Ionicons from 'react-native-vector-icons/Ionicons'

interface ImageGalleryProps {
    images: string[]
    title?: string
    containerClassName?: string
    imageClassName?: string
    showImageCount?: boolean
    imageSize?: 'small' | 'medium' | 'large'
    layout?: 'horizontal' | 'grid'
    maxImagesVisible?: number
    enableLazyLoading?: boolean
    showLoadingIndicator?: boolean
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
    images,
    title = 'Images',
    containerClassName = '',
    imageClassName = '',
    showImageCount = true,
    imageSize = 'medium',
    layout = 'horizontal',
    maxImagesVisible = 5,
    enableLazyLoading = true,
    showLoadingIndicator = true
}) => {
    const [isVisible, setIsVisible] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loadingStates, setLoadingStates] = useState<{ [key: number]: boolean }>({})
    const [loadErrors, setLoadErrors] = useState<{ [key: number]: boolean }>({})
    
    const screenWidth = Dimensions.get('window').width
    
    // Filter out invalid images
    const validImages = images.filter(img => img && img.trim() !== '')
    
    if (validImages.length === 0) {
        return null
    }
    
    // Image size configurations
    const getSizeConfig = () => {
        switch (imageSize) {
            case 'small':
                return { width: 80, height: 80, borderRadius: 8 }
            case 'large':
                return { width: 160, height: 160, borderRadius: 16 }
            default: // medium
                return { width: 120, height: 120, borderRadius: 12 }
        }
    }
    
    const sizeConfig = getSizeConfig()
    
    // Prepare images for ImageViewing (convert to required format)
    const galleryImages = validImages.map(uri => ({ uri }))
    
    const openImageViewer = (index: number) => {
        setCurrentIndex(index)
        setIsVisible(true)
    }
    
    const handleImageLoadStart = (index: number) => {
        setLoadingStates(prev => ({ ...prev, [index]: true }))
        setLoadErrors(prev => ({ ...prev, [index]: false }))
    }
    
    const handleImageLoadEnd = (index: number) => {
        setLoadingStates(prev => ({ ...prev, [index]: false }))
    }
    
    const handleImageError = (index: number) => {
        console.warn(`Failed to load image at index ${index}:`, validImages[index])
        setLoadingStates(prev => ({ ...prev, [index]: false }))
        setLoadErrors(prev => ({ ...prev, [index]: true }))
    }
    
    const renderOptimizedImage = (imageUrl: string, index: number, style: any) => (
        <View style={style} className="relative">
            <Image
                source={{ uri: imageUrl }}
                style={[style, { backgroundColor: '#f3f4f6' }]}
                contentFit="cover"
                transition={300}
                priority={index < 2 ? 'high' : 'low'} // High priority for first 2 images
                cachePolicy={enableLazyLoading ? 'memory-disk' : 'memory'}
                onLoadStart={() => handleImageLoadStart(index)}
                onLoadEnd={() => handleImageLoadEnd(index)}
                onError={() => handleImageError(index)}
                placeholder={{
                    uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNS41IDQwSDY0LjVDNjYuNDMzIDQwIDY4IDQxLjU2NyA2OCA0My41VjY0LjVDNjggNjYuNDMzIDY2LjQzMyA2OCA2NC41IDY4SDM1LjVDMzMuNTY3IDY4IDMyIDY2LjQzMyAzMiA2NC41VjQzLjVDMzIgNDEuNTY3IDMzLjU2NyA0MCAzNS41IDQwWiIgZmlsbD0iI0Q1RDdEQSIvPgo8Y2lyY2xlIGN4PSI0MiIgY3k9IjQ4IiByPSIzIiBmaWxsPSIjOUM5RkEzIi8+CjxwYXRoIGQ9Ik0zOCA1OEw0NCA1Mkw1MiA2MEw1OCA1NEw2MiA1OFY2NEgzOFY1OFoiIGZpbGw9IiM5QzlGQTMiLz4KPC9zdmc+',
                    blurhash: 'LGFFaXYk^6#M@-5c,1J5@[or[Q6.',
                }}
            />
            
            {/* Loading indicator */}
            {showLoadingIndicator && loadingStates[index] && (
                <View className="absolute inset-0 items-center justify-center bg-gray-100/80">
                    <ActivityIndicator size="small" color="#6b7280" />
                </View>
            )}
            
            {/* Error state */}
            {loadErrors[index] && (
                <View className="absolute inset-0 items-center justify-center bg-gray-100">
                    <Ionicons name="image-outline" size={24} color="#9ca3af" />
                    <Text className="text-gray-400 text-xs mt-1">Failed to load</Text>
                </View>
            )}
        </View>
    )
    
    const renderHorizontalLayout = () => (
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="flex-row"
            removeClippedSubviews={enableLazyLoading}
        >
            {validImages.slice(0, maxImagesVisible).map((imageUrl, index) => (
                <TouchableOpacity
                    key={`${imageUrl}-${index}`}
                    onPress={() => openImageViewer(index)}
                    className={`mr-3 relative ${imageClassName}`}
                    activeOpacity={0.8}
                >
                    {renderOptimizedImage(imageUrl, index, sizeConfig)}
                    
                    {/* Image counter overlay for first image if there are more */}
                    {index === 0 && validImages.length > maxImagesVisible && (
                        <View className="absolute inset-0 bg-black/30 items-center justify-center" style={{ borderRadius: sizeConfig.borderRadius }}>
                            <Ionicons name="images" size={24} color="white" />
                            <Text className="text-white text-xs font-JakartaBold mt-1">
                                +{validImages.length - maxImagesVisible + 1}
                            </Text>
                        </View>
                    )}
                    
                    {/* Zoom indicator */}
                    <View className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                        <Ionicons name="expand" size={12} color="white" />
                    </View>
                </TouchableOpacity>
            ))}
            
            {/* View All button if there are more images */}
            {validImages.length > maxImagesVisible && (
                <TouchableOpacity
                    onPress={() => openImageViewer(0)}
                    className="items-center justify-center bg-gray-100 rounded-xl px-4"
                    style={{ height: sizeConfig.height }}
                >
                    <Ionicons name="grid" size={24} color="#6b7280" />
                    <Text className="text-gray-600 text-xs font-JakartaMedium mt-1">
                        View All
                    </Text>
                    <Text className="text-gray-500 text-xs">
                        ({validImages.length})
                    </Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    )
    
    const renderGridLayout = () => {
        const numColumns = 3
        const imageWidth = (screenWidth - 48 - (numColumns - 1) * 8) / numColumns // 48px for padding, 8px for gaps
        const gridImageStyle = { 
            width: imageWidth, 
            height: imageWidth, 
            borderRadius: 8 
        }
        
        return (
            <View className="flex-row flex-wrap">
                {validImages.map((imageUrl, index) => (
                    <TouchableOpacity
                        key={`${imageUrl}-${index}`}
                        onPress={() => openImageViewer(index)}
                        className={`mb-2 ${index % numColumns !== numColumns - 1 ? 'mr-2' : ''}`}
                        activeOpacity={0.8}
                    >
                        {renderOptimizedImage(imageUrl, index, gridImageStyle)}
                        
                        {/* Zoom indicator */}
                        <View className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                            <Ionicons name="expand" size={10} color="white" />
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        )
    }
    
    return (
        <View className={containerClassName}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-JakartaBold text-gray-900">
                    {title}
                </Text>
                {showImageCount && (
                    <View className="bg-blue-100 px-2 py-1 rounded-full">
                        <Text className="text-blue-700 text-xs font-JakartaMedium">
                            {validImages.length} image{validImages.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                )}
            </View>
            
            {/* Images */}
            {layout === 'horizontal' ? renderHorizontalLayout() : renderGridLayout()}
            
            {/* Image Viewing Modal */}
            <ImageViewing
                images={galleryImages}
                imageIndex={currentIndex}
                visible={isVisible}
                onRequestClose={() => setIsVisible(false)}
                animationType="fade"
                swipeToCloseEnabled
                doubleTapToZoomEnabled
                FooterComponent={({ imageIndex }) => (
                    <View className="bg-black/80 px-6 py-4">
                        <Text className="text-white text-center font-JakartaMedium">
                            {imageIndex + 1} of {validImages.length}
                        </Text>
                        <Text className="text-white/70 text-center text-xs mt-1">
                            Swipe left/right to navigate • Pinch to zoom • Tap to close
                        </Text>
                    </View>
                )}
                HeaderComponent={({ imageIndex }) => (
                    <View className="bg-black/80 px-6 py-4 flex-row items-center justify-between">
                        <Text className="text-white font-JakartaBold text-lg">
                            {title}
                        </Text>
                        <TouchableOpacity
                            onPress={() => setIsVisible(false)}
                            className="bg-white/20 rounded-full p-2"
                        >
                            <Ionicons name="close" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    )
}

export default ImageGallery

// Export for easy importing
export { ImageGallery }

