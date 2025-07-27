import { useEffect, useState } from 'react';

export interface CountdownData {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isOvertime: boolean;
  overtimeHours: number;
  totalRemainingMs: number;
}

/**
 * Hook tính toán thời gian thực dựa trên startKeepTime và estimatedDays
 * Không cần lưu state, tính toán lại mỗi lần render
 */
export const useRealTimeCountdown = (startKeepTime: string, estimatedDays: number): CountdownData => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Cập nhật thời gian mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Tính toán thời gian thực
  const calculateCountdown = (): CountdownData => {
    if (!startKeepTime || !estimatedDays) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: false,
        isOvertime: false,
        overtimeHours: 0,
        totalRemainingMs: 0,
      };
    }

    // Thời điểm bắt đầu
    const startTime = new Date(startKeepTime).getTime();
    
    // Thời điểm hết hạn dự kiến (startTime + estimatedDays * 24h)
    const expectedEndTime = startTime + (estimatedDays * 24 * 60 * 60 * 1000);
    
    // Thời gian còn lại (có thể âm nếu quá hạn)
    const remainingMs = expectedEndTime - currentTime;
    
    // Nếu còn thời gian
    if (remainingMs > 0) {
      const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
      const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

      return {
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
        isOvertime: false,
        overtimeHours: 0,
        totalRemainingMs: remainingMs,
      };
    } 
    // Nếu đã quá hạn
    else {
      const overtimeMs = Math.abs(remainingMs);
      const overtimeHours = overtimeMs / (60 * 60 * 1000);
      
      // Hiển thị thời gian quá hạn
      const days = Math.floor(overtimeMs / (24 * 60 * 60 * 1000));
      const hours = Math.floor((overtimeMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((overtimeMs % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((overtimeMs % (60 * 1000)) / 1000);

      return {
        days,
        hours,
        minutes,
        seconds,
        isExpired: true,
        isOvertime: true,
        overtimeHours,
        totalRemainingMs: remainingMs, // Số âm
      };
    }
  };

  return calculateCountdown();
};
