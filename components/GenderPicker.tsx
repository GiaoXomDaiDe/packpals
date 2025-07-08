import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Text, TouchableOpacity, View } from 'react-native'

type GenderOption = 'male' | 'female' | 'other' | 'prefer_not_to_say'

interface GenderPickerProps {
    name: string
    label?: string
    required?: boolean
}

const genderOptions: { value: GenderOption; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const GenderPicker: React.FC<GenderPickerProps> = ({
    name,
    label = 'Gender',
    required = false,
}) => {
    const {
        control,
        formState: { errors },
    } = useFormContext()

    return (
        <View className="my-2">
            <Text className="text-lg font-JakartaSemiBold mb-3">
                {label}
                {required && <Text className="text-red-500"> *</Text>}
            </Text>

            <Controller
                control={control}
                name={name}
                render={({ field: { onChange, value } }) => (
                    <View className="space-y-2">
                        {genderOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() => onChange(option.value)}
                                className={`p-4 rounded-lg border ${
                                    value === option.value
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-300 bg-white'
                                }`}
                            >
                                <View className="flex-row items-center">
                                    <View
                                        className={`w-5 h-5 rounded-full border-2 mr-3 ${
                                            value === option.value
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-gray-300'
                                        }`}
                                    >
                                        {value === option.value && (
                                            <View className="flex-1 bg-white rounded-full m-1" />
                                        )}
                                    </View>
                                    <Text
                                        className={`text-base ${
                                            value === option.value
                                                ? 'text-blue-600 font-JakartaSemiBold'
                                                : 'text-gray-700 font-Jakarta'
                                        }`}
                                    >
                                        {option.label}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            />

            {errors[name] && (
                <Text className="text-red-500 text-sm mt-1">
                    {errors[name]?.message as string}
                </Text>
            )}
        </View>
    )
}

export default GenderPicker
