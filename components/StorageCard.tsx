import { Image, Text, TouchableOpacity, View } from 'react-native'
import { StorageCardProps } from '@/types/type'
import { icons } from '@/constants'

const StorageCard = ({ item, selected, setSelected }: StorageCardProps) => {
    return (
        <TouchableOpacity
            onPress={setSelected}
            className={`
                flex flex-row items-center justify-between py-5 px-3 rounded-xl 
                ${selected === item.id ? 'bg-general-600' : 'bg-white'}
                ${selected === item.id ? 'border-2 border-primary-500' : 'border border-general-700'}
            `}
        >
            <View className="flex flex-row items-center justify-center">
                <Image
                    source={{ uri: item.images[0] || 'https://via.placeholder.com/150' }}
                    className="w-20 h-20 rounded-lg"
                    resizeMode="cover"
                />

                <View className="flex flex-col items-start justify-center mx-3">
                    <Text className="text-lg font-JakartaBold text-primary-500">
                        {item.title}
                    </Text>
                    <Text className="text-sm font-JakartaRegular text-general-200">
                        {item.address}
                    </Text>
                    <Text className="text-sm font-JakartaRegular text-general-200">
                        {item.description}
                    </Text>
                    
                    <View className="flex flex-row items-center mt-1">
                        <Image
                            source={icons.star}
                            className="w-3.5 h-3.5"
                            resizeMode="contain"
                        />
                        <Text className="text-sm font-JakartaRegular text-general-200 ml-1">
                            {item.rating?.toFixed(1) || 'N/A'}
                        </Text>
                        <Text className="text-sm font-JakartaRegular text-general-200 ml-2">
                            ({item.keeperName})
                        </Text>
                    </View>
                </View>
            </View>

            <View className="flex flex-col items-end">
                <View className="flex flex-row items-center">
                    <Text className="text-lg font-JakartaBold text-primary-500">
                        ${item.pricePerDay}
                    </Text>
                    <Text className="text-sm font-JakartaRegular text-general-200">
                        /day
                    </Text>
                </View>
                
                <View className={`
                    px-2 py-1 rounded-full mt-2
                    ${item.status === 'AVAILABLE' ? 'bg-green-100' : 'bg-red-100'}
                `}>
                    <Text className={`
                        text-xs font-JakartaSemiBold
                        ${item.status === 'AVAILABLE' ? 'text-green-600' : 'text-red-600'}
                    `}>
                        {item.status}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default StorageCard