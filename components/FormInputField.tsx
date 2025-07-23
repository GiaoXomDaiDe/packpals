import React from 'react'
import { Control, Controller, FieldError } from 'react-hook-form'
import { Text, TextInput, View, TextInputProps } from 'react-native'

interface FormInputFieldProps extends TextInputProps {
  name: string
  control: Control<any>
  rules?: object
  label?: string
  error?: FieldError
  className?: string
  inputClassName?: string
  labelClassName?: string
  errorClassName?: string
}

const FormInputField: React.FC<FormInputFieldProps> = ({
  name,
  control,
  rules = {},
  label,
  error,
  className = '',
  inputClassName = '',
  labelClassName = '',
  errorClassName = '',
  ...inputProps
}) => {
  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className={`text-sm font-JakartaSemiBold mb-2 ${labelClassName}`}>
          {label}
        </Text>
      )}
      
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            className={`border border-general-700 rounded-lg p-3 text-sm font-JakartaRegular ${
              error ? 'border-red-500' : 'border-general-700'
            } ${inputClassName}`}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            {...inputProps}
          />
        )}
      />
      
      {error && (
        <Text className={`text-red-500 text-xs mt-1 font-JakartaRegular ${errorClassName}`}>
          {error.message}
        </Text>
      )}
    </View>
  )
}

export default FormInputField