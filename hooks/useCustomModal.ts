import { ModalType } from '@/components/CustomModal'
import { useState } from 'react'

interface ModalState {
    isVisible: boolean
    type: ModalType
    title: string
    message: string
    buttonText?: string
}

const useCustomModal = () => {
    const [modalState, setModalState] = useState<ModalState>({
        isVisible: false,
        type: 'info',
        title: '',
        message: '',
        buttonText: undefined
    })

    const showModal = (
        type: ModalType,
        title: string,
        message: string,
        buttonText?: string
    ) => {
        setModalState({
            isVisible: true,
            type,
            title,
            message,
            buttonText
        })
    }

    const hideModal = () => {
        setModalState(prev => ({
            ...prev,
            isVisible: false
        }))
    }

    // Convenience methods
    const showSuccess = (title: string, message: string, buttonText?: string) => {
        showModal('success', title, message, buttonText)
    }

    const showError = (title: string, message: string, buttonText?: string) => {
        showModal('error', title, message, buttonText)
    }

    const showInfo = (title: string, message: string, buttonText?: string) => {
        showModal('info', title, message, buttonText)
    }

    return {
        modalState,
        showModal,
        hideModal,
        showSuccess,
        showError,
        showInfo
    }
}

export default useCustomModal
