import { useCallback, useEffect, useRef, useState } from 'react';

interface CountdownTime {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOvertime: boolean;
}

interface CountdownTimerResult extends CountdownTime {
    forceRefresh: () => void;
}

export const useCountdownTimer = (startKeepTime: string, estimatedDays: number): CountdownTimerResult => {
    const [timeLeft, setTimeLeft] = useState<CountdownTime>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isOvertime: false
    });
    
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const calculateTimeLeft = useCallback((): CountdownTime => {
        if (!startKeepTime || !estimatedDays || estimatedDays <= 0) {
            return {
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                isOvertime: false
            };
        }

        const now = new Date();
        const startTime = new Date(startKeepTime);
        const deadlineTime = new Date(startTime.getTime() + (estimatedDays * 24 + 1) * 60 * 60 * 1000);
        
        const diffMs = deadlineTime.getTime() - now.getTime();
        const isOvertime = diffMs < 0;
        const absDiffMs = Math.abs(diffMs);
        
        const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((absDiffMs % (1000 * 60)) / 1000);
        
        return { days, hours, minutes, seconds, isOvertime };
    }, [startKeepTime, estimatedDays]);

    // Force refresh function for app state changes
    const forceRefresh = useCallback(() => {
        const newTimeLeft = calculateTimeLeft();
        if (mountedRef.current) {
            setTimeLeft(newTimeLeft);
        }
    }, [calculateTimeLeft]);

    useEffect(() => {
        // Clear existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Validate inputs
        if (!startKeepTime || !estimatedDays || estimatedDays <= 0) {
            if (mountedRef.current) {
                setTimeLeft({
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    isOvertime: false
                });
            }
            return;
        }

        const calculateAndSetTime = () => {
            const newTimeLeft = calculateTimeLeft();
            if (mountedRef.current) {
                setTimeLeft(newTimeLeft);
            }
        };

        // Calculate immediately
        calculateAndSetTime();

        // Set up interval
        intervalRef.current = setInterval(calculateAndSetTime, 1000) as unknown as NodeJS.Timeout;

        // Cleanup function
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [startKeepTime, estimatedDays, calculateTimeLeft]);

    return { ...timeLeft, forceRefresh };
};
