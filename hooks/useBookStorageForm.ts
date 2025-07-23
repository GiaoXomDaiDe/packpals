import { useState } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'

// Form data type
export interface BookStorageFormData {
  packageDescription: string
  estimatedDays: string
  selectedSizes: { [key: string]: number }
}

// Default form values
const defaultValues: BookStorageFormData = {
  packageDescription: '',
  estimatedDays: '1',
  selectedSizes: {}
}

// Form validation rules
const validationRules = {
  packageDescription: {
    required: 'Please describe your package',
    minLength: {
      value: 10,
      message: 'Package description must be at least 10 characters'
    }
  },
  estimatedDays: {
    required: 'Please enter estimated storage days',
    pattern: {
      value: /^[1-9]\d*$/,
      message: 'Please enter a valid number of days (minimum 1)'
    }
  }
}

// Custom hook for book storage form management
export const useBookStorageForm = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)

  const form: UseFormReturn<BookStorageFormData> = useForm<BookStorageFormData>({
    defaultValues,
    mode: 'onChange'
  })

  const { 
    control, 
    handleSubmit, 
    watch, 
    setValue, 
    getValues, 
    formState: { errors, isValid, isDirty } 
  } = form

  // Watch form values for real-time updates
  const watchedValues = watch()
  const { packageDescription, estimatedDays, selectedSizes } = watchedValues

  // Helper functions for size management
  const handleSizeSelection = (sizeId: string, increment: boolean) => {
    const currentSizes = getValues('selectedSizes')
    const currentCount = currentSizes[sizeId] || 0
    const newCount = increment ? currentCount + 1 : Math.max(0, currentCount - 1)
    
    if (newCount === 0) {
      const { [sizeId]: removed, ...rest } = currentSizes
      setValue('selectedSizes', rest, { shouldValidate: true, shouldDirty: true })
    } else {
      setValue('selectedSizes', { ...currentSizes, [sizeId]: newCount }, { 
        shouldValidate: true, 
        shouldDirty: true 
      })
    }
  }

  // Check if any sizes are selected
  const hasSelectedSizes = () => {
    return Object.keys(selectedSizes).length > 0
  }

  // Calculate total amount based on selected sizes and available sizes
  const calculateTotalAmount = (availableSizes: { id: string; price: number }[]) => {
    const days = parseInt(estimatedDays) || 1
    let total = 0
    
    Object.entries(selectedSizes).forEach(([sizeId, quantity]) => {
      const size = availableSizes.find((s) => s.id === sizeId)
      if (size) {
        total += size.price * quantity * days
      }
    })
    
    return total
  }

  // Custom validation for the form
  const validateForm = () => {
    const errors: string[] = []
    
    if (!packageDescription.trim()) {
      errors.push('Please describe your package')
    }
    
    if (!hasSelectedSizes()) {
      errors.push('Please select at least one storage size')
    }
    
    if (!estimatedDays || parseInt(estimatedDays) < 1) {
      errors.push('Please enter a valid number of storage days')
    }
    
    return errors
  }

  // Reset form to default values
  const resetForm = () => {
    form.reset(defaultValues)
    setCreatedOrderId(null)
    setIsLoading(false)
  }

  // Get form data for submission
  const getFormData = () => {
    return {
      packageDescription: packageDescription.trim(),
      estimatedDays: parseInt(estimatedDays) || 1,
      selectedSizes,
      totalAmount: 0 // Will be calculated with available sizes
    }
  }

  return {
    // Form control
    control,
    handleSubmit,
    errors,
    isValid,
    isDirty,
    
    // Form values
    packageDescription,
    estimatedDays,
    selectedSizes,
    
    // Loading and order state
    isLoading,
    setIsLoading,
    createdOrderId,
    setCreatedOrderId,
    
    // Helper functions
    handleSizeSelection,
    hasSelectedSizes,
    calculateTotalAmount,
    validateForm,
    resetForm,
    getFormData,
    
    // Direct form access if needed
    form
  }
}

export default useBookStorageForm