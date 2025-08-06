import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { palette } from '../constants';
import { OrderCountdownData } from '../hooks/api/order.api';

interface CountdownIndicatorProps {
    countdown?: OrderCountdownData | null;
    loading?: boolean;
    size?: 'small' | 'medium' | 'large';
}

const CountdownIndicator: React.FC<CountdownIndicatorProps> = ({ 
    countdown, 
    loading = false, 
    size = 'medium' 
}) => {
    const sizes = {
        small: { icon: 16, text: 12, container: 8 },
        medium: { icon: 20, text: 14, container: 12 },
        large: { icon: 24, text: 16, container: 16 }
    };

    const currentSize = sizes[size];

    if (loading) {
        return (
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: palette.surfaceVariant,
                paddingHorizontal: currentSize.container,
                paddingVertical: currentSize.container / 2,
                borderRadius: currentSize.container
            }}>
                <Ionicons 
                    name="refresh" 
                    size={currentSize.icon} 
                    color={palette.textSecondary} 
                />
                <Text style={{
                    color: palette.textSecondary,
                    fontSize: currentSize.text,
                    fontWeight: '500',
                    marginLeft: 6
                }}>
                    Loading...
                </Text>
            </View>
        );
    }

    if (!countdown) {
        return (
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: palette.surfaceVariant,
                paddingHorizontal: currentSize.container,
                paddingVertical: currentSize.container / 2,
                borderRadius: currentSize.container
            }}>
                <Ionicons 
                    name="help-circle-outline" 
                    size={currentSize.icon} 
                    color={palette.textSecondary} 
                />
                <Text style={{
                    color: palette.textSecondary,
                    fontSize: currentSize.text,
                    fontWeight: '500',
                    marginLeft: 6
                }}>
                    No data
                </Text>
            </View>
        );
    }

    const isExpired = countdown.isExpired;
    const backgroundColor = isExpired ? palette.errorSoft : palette.primarySoft;
    const textColor = isExpired ? palette.error : palette.primary;
    const iconName = isExpired ? "alert-circle" : "time";

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor,
            paddingHorizontal: currentSize.container,
            paddingVertical: currentSize.container / 2,
            borderRadius: currentSize.container
        }}>
            <Ionicons 
                name={iconName} 
                size={currentSize.icon} 
                color={textColor} 
            />
            <Text style={{
                color: textColor,
                fontSize: currentSize.text,
                fontWeight: '600',
                marginLeft: 6
            }}>
                {countdown.formattedTimeRemaining}
            </Text>
        </View>
    );
};

export default CountdownIndicator;
