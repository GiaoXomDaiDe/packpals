import { CountdownData } from '@/hooks/useRealTimeCountdown';
import { OrderCountdownData } from '@/lib/api/order.api';
import React from 'react';
import { Text, View } from 'react-native';

interface CountdownProps {
    countdown: CountdownData | OrderCountdownData | null;
}

const palette = {
    warning: '#f59e0b',
    warningSoft: '#fef3c7',
    warningBorder: '#fbbf24',
    success: '#10b981',
    successSoft: '#d1fae5',
    successBorder: '#34d399',
    error: '#ef4444',
    errorSoft: '#fee2e2',
    errorBorder: '#f87171',
    neutral: '#6b7280',
    neutralSoft: '#f9fafb',
    neutralBorder: '#d1d5db',
}

export const CountdownDisplay: React.FC<CountdownProps> = ({ countdown }) => {
    // Handle null countdown
    if (!countdown) {
        return (
            <View style={{ 
                paddingHorizontal: 16, 
                paddingVertical: 12, 
                borderRadius: 12, 
                backgroundColor: palette.neutralSoft,
                borderWidth: 1,
                borderColor: palette.neutralBorder,
                minWidth: 120,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 4
                }}>
                    <Text style={{ fontSize: 12, marginRight: 4 }}>⏳</Text>
                    <Text style={{ 
                        fontSize: 11, 
                        fontWeight: '600', 
                        color: palette.neutral,
                        textAlign: 'center'
                    }}>
                        Loading...
                    </Text>
                </View>
                <Text style={{ 
                    fontWeight: '700',
                    color: palette.neutral,
                    fontSize: 16,
                    textAlign: 'center',
                    letterSpacing: 0.5
                }}>
                    --:--
                </Text>
            </View>
        );
    }

    // Check if it's OrderCountdownData (server countdown)
    const isServerCountdown = 'formattedTimeRemaining' in countdown;

    // Xác định màu sắc dựa trên trạng thái
    const getDisplayColors = () => {
        if (isServerCountdown) {
            // Server countdown logic
            const serverCountdown = countdown as OrderCountdownData;
            if (serverCountdown.isExpired) {
                return {
                    background: palette.errorSoft,
                    text: palette.error,
                    border: palette.errorBorder,
                    label: 'EXPIRED',
                    icon: '🚨'
                };
            } else if (serverCountdown.timeRemainingInMilliseconds < 2 * 60 * 60 * 1000) { // < 2h
                return {
                    background: palette.warningSoft,
                    text: palette.warning,
                    border: palette.warningBorder,
                    label: 'Ending Soon',
                    icon: '⚠️'
                };
            } else {
                return {
                    background: palette.successSoft,
                    text: palette.success,
                    border: palette.successBorder,
                    label: 'Time Left',
                    icon: '⏰'
                };
            }
        } else {
            // Local countdown logic
            const localCountdown = countdown as CountdownData;
            if (localCountdown.isOvertime) {
                return {
                    background: palette.errorSoft,
                    text: palette.error,
                    border: palette.errorBorder,
                    label: 'OVERTIME',
                    icon: '🚨'
                };
            } else if (localCountdown.totalRemainingMs < 2 * 60 * 60 * 1000) { // < 2h
                return {
                    background: palette.warningSoft,
                    text: palette.warning,
                    border: palette.warningBorder,
                    label: 'Ending Soon',
                    icon: '⚠️'
                };
            } else {
                return {
                    background: palette.successSoft,
                    text: palette.success,
                    border: palette.successBorder,
                    label: 'Time Left',
                    icon: '⏰'
                };
            }
        }
    };

    const colors = getDisplayColors();

    // Format thời gian hiển thị
    const formatTime = () => {
        if (isServerCountdown) {
            // Use server formatted time
            const serverCountdown = countdown as OrderCountdownData;
            return serverCountdown.formattedTimeRemaining || '--:--';
        } else {
            // Use local countdown format
            const localCountdown = countdown as CountdownData;
            const { days, hours, minutes, seconds } = localCountdown;
            
            if (days > 0) {
                return `${days}d ${hours}h ${minutes}m`;
            } else if (hours > 0) {
                return `${hours}h ${minutes}m ${seconds}s`;
            } else {
                return `${minutes}m ${seconds}s`;
            }
        }
    };

    return (
        <View style={{ 
            paddingHorizontal: 16, 
            paddingVertical: 12, 
            borderRadius: 12, 
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            minWidth: 120,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 3,
        }}>
            {/* Header with icon and label */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6
            }}>
                <Text style={{ fontSize: 12, marginRight: 4 }}>{colors.icon}</Text>
                <Text style={{ 
                    fontSize: 11, 
                    fontWeight: '600', 
                    color: colors.text,
                    textAlign: 'center'
                }}>
                    {colors.label}
                </Text>
            </View>

            {/* Main time display */}
            <Text style={{ 
                fontWeight: '800',
                color: colors.text,
                fontSize: 16,
                textAlign: 'center',
                letterSpacing: 0.5,
                marginBottom: 2
            }}>
                {formatTime()}
            </Text>

            {/* Additional info */}
            {!isServerCountdown && (countdown as CountdownData).isOvertime && (
                <View style={{
                    backgroundColor: colors.text + '15',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8,
                    marginTop: 2
                }}>
                    <Text style={{ 
                        fontSize: 9, 
                        color: colors.text,
                        textAlign: 'center',
                        fontWeight: '600'
                    }}>
                        +{(countdown as CountdownData).overtimeHours.toFixed(1)}h over
                    </Text>
                </View>
            )}
            
            {isServerCountdown && (countdown as OrderCountdownData).percentageComplete !== undefined && (
                <View style={{
                    backgroundColor: colors.text + '15',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8,
                    marginTop: 2
                }}>
                    <Text style={{ 
                        fontSize: 9, 
                        color: colors.text,
                        textAlign: 'center',
                        fontWeight: '600'
                    }}>
                        {(countdown as OrderCountdownData).percentageComplete.toFixed(1)}% complete
                    </Text>
                </View>
            )}
        </View>
    );
};