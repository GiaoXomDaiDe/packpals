import DateTimePicker from '@react-native-community/datetimepicker'
import React, { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native'

interface DatePickerProps {
    name?: string
    label: string
    placeholder?: string
    icon?: any
    labelStyle?: string
    containerStyle?: string
    inputStyle?: string
    iconStyle?: string
    value?: Date
    onDateChange?: (date: Date) => void
}

const DatePicker = ({
    name,
    label,
    placeholder = 'Select date',
    icon,
    labelStyle,
    containerStyle,
    inputStyle,
    iconStyle,
    value,
    onDateChange,
}: DatePickerProps) => {
    const [show, setShow] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date>(value || new Date())

    let control
    try {
        const formContext = useFormContext()
        control = formContext?.control
    } catch {
        control = null
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        })
    }

    const handleDateChange = (event: any, date?: Date) => {
        setShow(Platform.OS === 'ios')

        if (date) {
            setSelectedDate(date)
            if (onDateChange) {
                onDateChange(date)
            }
        }
    }
    console.log('show', show)
    console.log('selectedDate', selectedDate)

    if (control && name) {
        return (
            <Controller
                name={name}
                control={control}
                render={({
                    field: { onChange, value },
                    fieldState: { error },
                }) => {
                    const currentDate = value ? new Date(value) : selectedDate

                    const handleControllerDateChange = (
                        event: any,
                        date?: Date
                    ) => {
                        setShow(Platform.OS === 'ios')

                        if (date) {
                            setSelectedDate(date)
                            onChange(date.toISOString().split('T')[0])
                        }
                    }

                    return (
                        <View className="my-2 w-full">
                            <Text
                                className={`text-lg font-JakartaSemiBold mb-3 ${labelStyle}`}
                            >
                                {label}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShow(true)}
                                className={`flex flex-row justify-start items-center relative bg-neutral-100 rounded-full border border-neutral-100 focus:border-primary-500 ${containerStyle}`}
                            >
                                {icon && (
                                    <Image
                                        source={icon}
                                        className={`w-6 h-6 ml-4 ${iconStyle}`}
                                    />
                                )}
                                <View
                                    className={`rounded-full p-4 font-JakartaSemiBold text-[15px] flex-1 ${inputStyle} text-left justify-center`}
                                >
                                    <Text
                                        className={`font-JakartaSemiBold text-[15px] ${
                                            value
                                                ? 'text-black'
                                                : 'text-gray-400'
                                        }`}
                                    >
                                        {value
                                            ? formatDate(currentDate)
                                            : placeholder}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            {error && (
                                <Text className="text-red-500 text-sm ml-5 mt-1">
                                    {error.message}
                                </Text>
                            )}
                            {show && (
                                <DateTimePicker
                                    value={currentDate}
                                    mode="date"
                                    display={
                                        Platform.OS === 'ios'
                                            ? 'spinner'
                                            : 'default'
                                    }
                                    onChange={handleControllerDateChange}
                                    maximumDate={new Date()}
                                />
                            )}
                        </View>
                    )
                }}
            />
        )
    }

    // Otherwise, use regular date picker (for pages without form context)
    return (
        <View className="my-2 w-full">
            <Text className={`text-lg font-JakartaSemiBold mb-3 ${labelStyle}`}>
                {label}
            </Text>
            <TouchableOpacity
                onPress={() => setShow(true)}
                className={`flex flex-row justify-start items-center relative bg-neutral-100 rounded-full border border-neutral-100 focus:border-primary-500 ${containerStyle}`}
            >
                {icon && (
                    <Image
                        source={icon}
                        className={`w-6 h-6 ml-4 ${iconStyle}`}
                    />
                )}
                <View
                    className={`rounded-full p-4 font-JakartaSemiBold text-[15px] flex-1 ${inputStyle} text-left justify-center`}
                >
                    <Text
                        className={`font-JakartaSemiBold text-[15px] ${
                            selectedDate ? 'text-black' : 'text-gray-400'
                        }`}
                    >
                        {formatDate(selectedDate)}
                    </Text>
                </View>
            </TouchableOpacity>
            {show && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                />
            )}
        </View>
    )
}

export default DatePicker
