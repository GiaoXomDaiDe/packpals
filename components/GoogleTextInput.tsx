import { View } from 'react-native'
import GooglePlacesTextInput from 'react-native-google-places-textinput'

import { GoogleInputProps } from '@/types/type'

const googlePlacesApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY

const GoogleTextInput = ({
    icon,
    initialLocation,
    containerStyle,
    textInputBackgroundColor,
    handlePress,
}: GoogleInputProps) => {
    const handleError = (error: any) => {
        console.error('API error:', error)
    }

    return (
        <View
            className={`flex flex-row items-center justify-center relative z-50 rounded-xl w-full ${containerStyle}`} // Đảm bảo width 100%
        >
            <GooglePlacesTextInput
                apiKey={googlePlacesApiKey as string}
                fetchDetails={true}
                placeHolderText="Search"
                languageCode="vi"
                onError={handleError}
                debounceDelay={200}
                style={{
                    container: {
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 20,
                        marginHorizontal: 0,
                        width: '100%',
                        position: 'relative',
                        shadowColor: '#d4d4d4',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 3,
                        elevation: 3,
                    },
                    input: {
                        backgroundColor: textInputBackgroundColor || 'white',
                        fontSize: 18,
                        fontWeight: '600',
                        marginTop: 5,
                        width: 320,
                        borderRadius: 20,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        height: 50,
                    },
                    suggestionsContainer: {
                        backgroundColor: textInputBackgroundColor || 'white',
                        position: 'absolute',
                        top: 55,
                        width: '100%',
                        borderRadius: 10,
                        shadowColor: '#d4d4d4',
                        zIndex: 1000,
                        elevation: 5,
                        maxHeight: 200,
                    },
                    placeholder: {
                        color: '#666',
                    },
                }}
                onPlaceSelect={({ details }) => {
                    handlePress({
                        latitude: details?.location.latitude!,
                        longitude: details?.location.longitude!,
                        address: details?.formattedAddress,
                    })
                }}
                value={initialLocation ?? 'Where do you want to go?'}
            />
        </View>
    )
}

export default GoogleTextInput
