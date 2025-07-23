# ImageGallery Component

Một component hiển thị gallery ảnh được tối ưu hóa cho React Native/Expo với khả năng xem ảnh chi tiết.

## Features

✅ **Optimized Performance**
- High priority loading cho ảnh đầu tiên
- Memory-disk caching
- Lazy loading với removeClippedSubviews
- Blur hash placeholders

✅ **Loading States**
- Loading indicators
- Error handling với fallback UI
- Smooth transitions (300ms)

✅ **Flexible Layouts**
- Horizontal scroll
- Grid layout
- Multiple image sizes (small, medium, large)

✅ **Interactive**
- Click để xem full screen
- Pinch to zoom
- Swipe navigation
- Header & footer trong gallery modal

## Usage

### Basic Usage

```tsx
import { ImageGallery } from '@/components/ImageGallery'

const MyComponent = () => {
  const images = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg'
  ]

  return (
    <ImageGallery
      images={images}
      title="Package Certification"
      layout="horizontal"
      imageSize="large"
    />
  )
}
```

### Advanced Usage với Performance Optimization

```tsx
<ImageGallery
  images={certificationImages}
  title="Package Certification"
  layout="horizontal"
  imageSize="large"
  maxImagesVisible={4}
  enableLazyLoading={true}
  showLoadingIndicator={true}
  containerClassName="bg-white p-4 rounded-xl"
/>
```

### Grid Layout

```tsx
<ImageGallery
  images={galleryImages}
  title="Storage Photos"
  layout="grid"
  enableLazyLoading={true}
  showLoadingIndicator={true}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `images` | `string[]` | **Required** | Array của image URLs |
| `title` | `string` | `'Images'` | Tiêu đề gallery |
| `layout` | `'horizontal' \| 'grid'` | `'horizontal'` | Layout hiển thị |
| `imageSize` | `'small' \| 'medium' \| 'large'` | `'medium'` | Kích thước ảnh |
| `maxImagesVisible` | `number` | `5` | Số ảnh tối đa hiển thị (horizontal) |
| `enableLazyLoading` | `boolean` | `true` | Bật tối ưu lazy loading |
| `showLoadingIndicator` | `boolean` | `true` | Hiển thị loading indicator |
| `showImageCount` | `boolean` | `true` | Hiển thị số lượng ảnh |
| `containerClassName` | `string` | `''` | CSS class cho container |
| `imageClassName` | `string` | `''` | CSS class cho từng ảnh |

## Image Sizes

- **Small**: 80x80px, borderRadius: 8px
- **Medium**: 120x120px, borderRadius: 12px  
- **Large**: 160x160px, borderRadius: 16px

## Performance Tips

1. **Sử dụng enableLazyLoading=true** cho danh sách ảnh dài
2. **Giới hạn maxImagesVisible** để tránh render quá nhiều ảnh cùng lúc
3. **Ảnh đầu tiên sẽ có priority='high'** để load nhanh hơn
4. **Caching strategy**: memory-disk cho performance tốt nhất

## Dependencies

- `expo-image`: Hiệu suất tốt hơn React Native Image
- `react-native-image-viewing`: Full screen gallery modal
- `react-native-vector-icons`: Icons

## Examples

### Package Certification (như trong keeper-orderdetails)

```tsx
{order.orderCertification && order.orderCertification.length > 0 && (
  <View className="bg-white rounded-2xl p-6 mx-6 mb-6 shadow-sm border border-gray-100">
    <ImageGallery
      images={order.orderCertification}
      title="Package Certification"
      layout="horizontal"
      imageSize="large"
      maxImagesVisible={4}
      enableLazyLoading={true}
      showLoadingIndicator={true}
    />
    <Text className="text-xs text-gray-500 mt-3 text-center">
      Tap any image to view in full screen
    </Text>
  </View>
)}
```

## Error Handling

Component tự động xử lý:
- ảnh load lỗi (hiển thị fallback icon)
- ảnh không tồn tại
- mạng chậm (loading indicator)
- filter ảnh invalid (empty URLs)
