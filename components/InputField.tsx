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
                                <Text
                                    className={`text-lg font-JakartaSemiBold mb-3 ${labelStyle}`}
                                >
                                    {label}
                                </Text>
                                <View
                                    className={`flex flex-row justify-start items-center relative bg-neutral-100 rounded-full border border-neutral-100 focus:border-primary-500  ${containerStyle}`}
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
                                        className={`rounded-full p-4 font-JakartaSemiBold text-[15px] flex-1 ${inputStyle} text-left`}
                                        secureTextEntry={secureTextEntry}
                                        {...props}
                                    />
                                </View>
                                {/* Show lỗi */}
                                <Text className="text-red-500 text-sm ml-5 mt-1">
                                    {error?.message}
                                </Text>
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
                    <Text
                        className={`text-lg font-JakartaSemiBold mb-3 ${labelStyle}`}
                    >
                        {label}
                    </Text>
                    <View
                        className={`flex flex-row justify-start items-center relative bg-neutral-100 rounded-full border border-neutral-100 focus:border-primary-500  ${containerStyle}`}
                    >
                        {icon && (
                            <Image
                                source={icon}
                                className={`w-6 h-6 ml-4 ${iconStyle}`}
                            />
                        )}
                        <TextInput
                            className={`rounded-full p-4 font-JakartaSemiBold text-[15px] flex-1 ${inputStyle} text-left`}
                            secureTextEntry={secureTextEntry}
                            {...props}
                        />
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

export default InputField
