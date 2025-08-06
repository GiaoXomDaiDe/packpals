import { CountdownDisplay } from '@/components/CountdownDisplay'
import { useCalculateFinalAmount } from '@/hooks/query'
import { useRealTimeCountdown } from '@/hooks/useRealTimeCountdown'
import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import {
    AppState,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'

// Helper function for currency formatting
const formatCurrency = (amount: number) => {
    // Round up to nearest 1000 VND for cleaner display
    const roundedAmount = Math.ceil(amount / 1000) * 1000;
    return roundedAmount.toLocaleString();
};

interface ActiveStorageCardProps {
    order: any;
    serverCountdown?: any;
    loading?: boolean;
}

// ActiveStorageCard Component with App State Management 
export const ActiveStorageCard = React.memo<ActiveStorageCardProps>(({ 
    order, 
    serverCountdown = null, 
    loading = false 
}) => {
    const router = useRouter();
    const [appState, setAppState] = useState(AppState.currentState);
    
    const { data: finalAmountData } = useCalculateFinalAmount(order.id, {
        refetchInterval: 30000, // Update every 30s
        enabled: !!order.id
    });

    // Stabilize the countdown inputs to prevent infinite re-renders
    const startKeepTime = useMemo(() => 
        serverCountdown?.startKeepTime || order.startKeepTime || new Date().toISOString(),
        [serverCountdown?.startKeepTime, order.startKeepTime]
    );
    
    const estimatedDays = useMemo(() => 
        serverCountdown?.estimatedDays || order.estimatedDays || 1,
        [serverCountdown?.estimatedDays, order.estimatedDays]
    );
    
    // Always call hooks, but use server countdown if available
    const localCountdown = useRealTimeCountdown(startKeepTime, estimatedDays);
    const countdown = serverCountdown || localCountdown;

    // Helper function to format date
    const formatStartDate = useMemo(() => {
        const dateToFormat = countdown?.startKeepTime || order.startKeepTime;
        return dateToFormat ? 
            new Date(dateToFormat).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
            }) : 
            'Not started yet';
    }, [countdown?.startKeepTime, order.startKeepTime]);

    // Helper function to get final amount display
    const displayAmount = useMemo(() => {
        const finalAmount = (finalAmountData as any)?.data?.finalAmount;
        return finalAmount || order.totalAmount || 0;
    }, [finalAmountData, order.totalAmount]);

    // Schedule notifications when order becomes active (Disabled for Expo Go)
    useEffect(() => {
        // Notifications functionality disabled for Expo Go compatibility
        // if (order.id && order.startKeepTime && order.estimatedDays && !countdown.isExpired) {
        //     scheduleOrderNotifications(order);
        // }
    }, [order, countdown.isExpired]);

    // Handle app state changes for accurate countdown
    useEffect(() => {
        const handleAppStateChange = (nextAppState: any) => {
            if (appState.match(/inactive|background/) && nextAppState === 'active') {
                // App returned to foreground - countdown will auto-update
            }
            setAppState(nextAppState);
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [appState]);

    return (
        <TouchableOpacity 
            onPress={() => router.replace({
                pathname: '/(root)/orderdetails/[id]',
                params: { id: order.id }
            })}
            className="bg-surface rounded-3xl p-0 mb-3 border border-border"
            style={{
                shadowColor: 'rgba(15, 23, 42, 0.08)',
                shadowOpacity: 0.12,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 8 },
                elevation: 8,
                borderWidth: 1,
                borderColor: '#e2e8f0'
            }}
            activeOpacity={0.96}
        >
            {/* Top Section - Storage Header */}
            <View className="bg-primary-soft px-5 py-4 rounded-t-3xl border-b border-border">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <View className="bg-primary rounded-xl p-2.5 mr-3">
                            <Ionicons name="archive" size={18} color="white" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-text text-base font-bold mb-0.5" numberOfLines={1}>
                                {order.storage?.title || order.storage?.description || 'Storage Location'}
                            </Text>
                            <Text className="text-text-secondary text-sm font-medium" numberOfLines={2}>
                                Items: {order.packageDescription || 'Package stored'}
                            </Text>
                        </View>
                    </View>
                    <View className="bg-surface rounded-lg px-2 py-1">
                        <Text className="text-success text-xs font-bold uppercase">
                            ACTIVE
                        </Text>
                    </View>
                </View>
            </View>

            {/* Middle Section - Countdown */}
            <View className="px-5 py-6 items-center">
                <Text className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
                    STORAGE COUNTDOWN
                </Text>
                <CountdownDisplay countdown={countdown} />
                <Text className="text-text-secondary text-xs mt-4 text-center">
                    Started: {formatStartDate}
                </Text>
            </View>

            {/* Bottom Section - Cost & Action */}
            <View className="bg-surfaceVariant px-5 py-4 rounded-b-3xl flex-row items-center justify-between">
                <View>
                    <Text className="text-text-secondary text-xs font-semibold uppercase mb-1">
                        TOTAL COST
                    </Text>
                    <Text className="text-text font-extrabold text-lg">
                        {formatCurrency(displayAmount)} <Text className="text-xs text-text-secondary">VND</Text>
                    </Text>
                </View>
                <View 
                    className="bg-primary rounded-2xl px-4 py-2.5 flex-row items-center"
                    style={{
                        shadowColor: '#2563eb',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.4,
                        shadowRadius: 8,
                        elevation: 6,
                    }}
                >
                    <Ionicons name="chevron-forward" size={14} color="white" />
                    <Text className="text-white font-bold text-xs ml-1">
                        VIEW
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
});

ActiveStorageCard.displayName = 'ActiveStorageCard';
