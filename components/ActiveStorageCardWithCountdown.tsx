import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../constants';
import { OrderCountdownData } from '../lib/api/order.api';

interface ActiveStorageCardWithCountdownProps {
    order: any;
    countdown?: OrderCountdownData | null;
    loading?: boolean;
}

const ActiveStorageCardWithCountdown: React.FC<ActiveStorageCardWithCountdownProps> = ({ 
    order, 
    countdown, 
    loading = false 
}) => {
    // Extract storage and package info
    const storage = order.storage || {};
    const packageDescription = order.packageDescription || 'No description';
    
    // Format start time
    const startTime = countdown?.startKeepTime 
        ? new Date(countdown.startKeepTime).toLocaleDateString('vi-VN')
        : order.startKeepTime 
        ? new Date(order.startKeepTime).toLocaleDateString('vi-VN')
        : 'Unknown';

    if (loading) {
        return (
            <View style={{
                backgroundColor: palette.surface,
                borderRadius: 20,
                padding: 16,
                shadowColor: palette.shadow,
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
                minHeight: 200
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1
                }}>
                    <Ionicons name="refresh" size={20} color={palette.textSecondary} />
                    <Text style={{
                        color: palette.textSecondary,
                        fontSize: 14,
                        marginLeft: 8
                    }}>
                        Loading countdown...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <TouchableOpacity
            style={{
                backgroundColor: palette.surface,
                borderRadius: 20,
                padding: 16,
                shadowColor: palette.shadow,
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
                borderWidth: countdown?.isExpired ? 2 : 0,
                borderColor: countdown?.isExpired ? palette.error : 'transparent'
            }}
            onPress={() => router.push(`/(root)/(tabs)/orders` as any)}
            activeOpacity={0.9}
        >
            {/* Header Section */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 12
            }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{
                        color: palette.text,
                        fontSize: 16,
                        fontWeight: '700',
                        marginBottom: 4
                    }} numberOfLines={1}>
                        {storage.title || 'Storage Location'}
                    </Text>
                    <Text style={{
                        color: palette.textSecondary,
                        fontSize: 13,
                        fontWeight: '500'
                    }} numberOfLines={2}>
                        {storage.address || 'Address not available'}
                    </Text>
                </View>
                
                {/* Status Badge */}
                <View style={{
                    backgroundColor: countdown?.isExpired ? palette.errorSoft : palette.successSoft,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12
                }}>
                    <Text style={{
                        color: countdown?.isExpired ? palette.error : palette.success,
                        fontSize: 11,
                        fontWeight: '600'
                    }}>
                        {countdown?.isExpired ? 'EXPIRED' : 'ACTIVE'}
                    </Text>
                </View>
            </View>

            {/* Middle Section - Countdown */}
            {countdown ? (
                <View style={{
                    backgroundColor: countdown.isExpired ? palette.errorSoft : palette.primarySoft,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    alignItems: 'center'
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8
                    }}>
                        <Ionicons
                            name={countdown.isExpired ? "alert-circle" : "time"}
                            size={24}
                            color={countdown.isExpired ? palette.error : palette.primary}
                            style={{ transform: [{ scale: 1.2 }] }}
                        />
                        <Text style={{
                            color: countdown.isExpired ? palette.error : palette.primary,
                            fontSize: 18,
                            fontWeight: '700',
                            marginLeft: 8
                        }}>
                            {countdown.formattedTimeRemaining}
                        </Text>
                    </View>
                    
                    {/* Progress Bar */}
                    <View style={{
                        width: '100%',
                        height: 6,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: 3,
                        overflow: 'hidden'
                    }}>
                        <View style={{
                            width: `${countdown.percentageComplete}%`,
                            height: '100%',
                            backgroundColor: countdown.isExpired ? palette.error : palette.primary,
                            borderRadius: 3
                        }} />
                    </View>
                    
                    <Text style={{
                        color: countdown.isExpired ? palette.error : palette.primary,
                        fontSize: 12,
                        fontWeight: '600',
                        marginTop: 4
                    }}>
                        {countdown.percentageComplete.toFixed(1)}% complete
                    </Text>
                </View>
            ) : (
                // Fallback when no countdown data
                <View style={{
                    backgroundColor: palette.surfaceVariant,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    alignItems: 'center'
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8
                    }}>
                        <Ionicons
                            name="help-circle-outline"
                            size={24}
                            color={palette.textSecondary}
                        />
                        <Text style={{
                            color: palette.textSecondary,
                            fontSize: 16,
                            fontWeight: '600',
                            marginLeft: 8
                        }}>
                            Countdown not available
                        </Text>
                    </View>
                    <Text style={{
                        color: palette.textSecondary,
                        fontSize: 12,
                        textAlign: 'center'
                    }}>
                        Storage period may not have started yet
                    </Text>
                </View>
            )}

            {/* Footer Section */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <View style={{ flex: 1 }}>
                    <Text style={{
                        color: palette.textSecondary,
                        fontSize: 11,
                        fontWeight: '500',
                        marginBottom: 2
                    }}>
                        Package • Started {startTime}
                    </Text>
                    <Text style={{
                        color: palette.text,
                        fontSize: 13,
                        fontWeight: '600'
                    }} numberOfLines={1}>
                        {packageDescription}
                    </Text>
                </View>
                
                <TouchableOpacity
                    style={{
                        backgroundColor: palette.primary,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        flexDirection: 'row',
                        alignItems: 'center'
                    }}
                    onPress={() => router.push(`/(root)/(tabs)/orders` as any)}
                    activeOpacity={0.8}
                >
                    <Text style={{
                        color: 'white',
                        fontSize: 12,
                        fontWeight: '600',
                        marginRight: 4
                    }}>
                        Details
                    </Text>
                    <Ionicons name="arrow-forward" size={12} color="white" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

export default ActiveStorageCardWithCountdown;
