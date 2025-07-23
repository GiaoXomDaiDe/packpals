import { Alert, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'

const OAuth = () => {
    const handleGoogleSignIn = async () => {
        Alert.alert('Coming Soon', 'Google Sign-In will be available in the next update.')
    }

    const handleAppleSignIn = async () => {
        Alert.alert('Coming Soon', 'Apple Sign-In will be available in the next update.')
    }

    return (
        <View className="space-y-3">
            {/* Google Sign In */}
            <TouchableOpacity
                onPress={handleGoogleSignIn}
                className="flex-row items-center justify-center bg-white border border-gray-300 py-3 px-4 rounded-lg"
            >
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <Text className="text-gray-700 font-JakartaMedium ml-3">
                    Continue with Google
                </Text>
            </TouchableOpacity>

            {/* Apple Sign In */}
            <TouchableOpacity
                onPress={handleAppleSignIn}
                className="flex-row items-center justify-center bg-black py-3 px-4 rounded-lg"
            >
                <Ionicons name="logo-apple" size={20} color="white" />
                <Text className="text-white font-JakartaMedium ml-3">
                    Continue with Apple
                </Text>
            </TouchableOpacity>
        </View>
    )
}

export default OAuth
