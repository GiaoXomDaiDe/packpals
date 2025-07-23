import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from 'react-native'

import { InputFieldProps } from '@/types/type'
import { Controller, useFormContext } from 'react-hook-form'

const InputField = ({
    label,
    icon,
    name,
    secureTextEntry = false,
    labelStyle,
    containerStyle,
    inputStyle,
    iconStyle,
    className,
    ...props
}: InputFieldProps) => {
    let control
    try {
        const formContext = useFormContext()
        control = formContext?.control
    } catch {
        control = null
    }

    if (control && name) {
        return (
            <Controller
                name={name}
                control={control}
                render={({
                    field: { onChange, value, onBlur },
                    fieldState: { error },
                }) => (
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                    >
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View className="my-2 w-full">
                                {label && (
                                    <Text
                                        className={`text-lg font-JakartaSemiBold mb-3 ${labelStyle}`}
                                    >
                                        {label}
                                    </Text>
                                )}
                                <View
                                    className={`flex flex-row justify-start items-center relative bg-gray-50 rounded-lg border ${error ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 ${containerStyle}`}
                                >
                                    {icon && (
                                        <Image
                                            source={icon}
                                            className={`w-6 h-6 ml-4 ${iconStyle}`}
                                        />
                                    )}
                                    <TextInput
                                        onChangeText={onChange}
                                        value={value}
                                        onBlur={onBlur}
                                        className={`rounded-lg p-4 font-Jakarta text-[15px] flex-1 ${inputStyle} text-left`}
                                        secureTextEntry={secureTextEntry}
                                        placeholderTextColor="#9ca3af"
                                        {...props}
                                    />
                                </View>
                                {/* Show error message only if there is an error */}
                                {error?.message && (
                                    <Text className="text-red-500 text-sm mt-1">
                                        {error.message}
                                    </Text>
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                )}
            />
        )
    }

    // Otherwise, use regular input (for pages like sign-in and profile)
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="my-2 w-full">
                    {label && (
                        <Text
                            className={`text-lg font-JakartaSemiBold mb-3 ${labelStyle}`}
                        >
                            {label}
                        </Text>
                    )}
                    <View
                        className={`flex flex-row justify-start items-center relative bg-gray-50 rounded-lg border border-gray-200 focus:border-blue-500 ${containerStyle}`}
                    >
                        {icon && (
                            <Image
                                source={icon}
                                className={`w-6 h-6 ml-4 ${iconStyle}`}
                            />
                        )}
                        <TextInput
                            className={`rounded-lg p-4 font-Jakarta text-[15px] flex-1 ${inputStyle} text-left`}
                            secureTextEntry={secureTextEntry}
                            placeholderTextColor="#9ca3af"
                            {...props}
                        />
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

export default InputField
