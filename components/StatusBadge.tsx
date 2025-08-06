import React from 'react'
import { Text, View } from 'react-native'

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'IN_STORAGE' | 'COMPLETED' | 'CANCELLED'

interface StatusBadgeProps {
    status: OrderStatus | string
    size?: 'small' | 'medium' | 'large'
    className?: string
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
    status, 
    size = 'medium',
    className = '' 
}) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return '#f59e0b'
            case 'CONFIRMED': return '#3b82f6'
            case 'IN_STORAGE': return '#8b5cf6'
            case 'COMPLETED': return '#059669'
            case 'CANCELLED': return '#ef4444'
            default: return '#6b7280'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Pending'
            case 'CONFIRMED': return 'Confirmed'
            case 'IN_STORAGE': return 'In Storage'
            case 'COMPLETED': return 'Completed'
            case 'CANCELLED': return 'Cancelled'
            default: return 'Unknown'
        }
    }

    const getSizeClasses = (size: string) => {
        switch (size) {
            case 'small':
                return {
                    container: 'px-2 py-0.5',
                    text: 'text-xs'
                }
            case 'large':
                return {
                    container: 'px-4 py-2',
                    text: 'text-sm'
                }
            default: // medium
                return {
                    container: 'px-3 py-1',
                    text: 'text-xs'
                }
        }
    }

    const sizeClasses = getSizeClasses(size)
    const statusColor = getStatusColor(status)

    return (
        <View 
            className={`rounded-full ${sizeClasses.container} ${className}`}
            style={{ backgroundColor: statusColor + '15' }}
        >
            <Text 
                className={`font-JakartaBold ${sizeClasses.text}`}
                style={{ color: statusColor }}
            >
                {getStatusText(status)}
            </Text>
        </View>
    )
}

export default StatusBadge
