// lib/api/orderCountdown.ts - Order Countdown API Integration
import { API_BASE_URL } from '../config';

export interface OrderCountdownData {
  orderId: string;
  startKeepTime: string;
  estimatedDays: number;
  estimatedEndTime: string;
  timeRemainingInMilliseconds: number;
  isExpired: boolean;
  formattedTimeRemaining: string;
  percentageComplete: number;
}

/**
 * Get countdown information for a single order
 */
export const getOrderCountdown = async (orderId: string): Promise<OrderCountdownData | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/order/${orderId}/countdown`);
    const data = await response.json();
    
    if (data.statusCode === 200) {
      return data.data;
    }
    
    console.warn(`Failed to get countdown for order ${orderId}:`, data.message);
    return null;
  } catch (error) {
    console.error('Error fetching order countdown:', error);
    return null;
  }
};

/**
 * Get countdown information for multiple orders (bulk operation)
 */
export const getMultipleOrderCountdown = async (orderIds: string[]): Promise<OrderCountdownData[]> => {
  try {
    if (orderIds.length === 0) return [];
    
    // Split into chunks of 50 to respect API limit
    const chunks = [];
    for (let i = 0; i < orderIds.length; i += 50) {
      chunks.push(orderIds.slice(i, i + 50));
    }
    
    const allResults: OrderCountdownData[] = [];
    
    for (const chunk of chunks) {
      const response = await fetch(`${API_BASE_URL}/api/order/countdown/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk)
      });
      
      const data = await response.json();
      
      if (data.statusCode === 200) {
        allResults.push(...data.data);
      } else {
        console.warn('Failed to get countdown for batch:', data.message);
      }
    }
    
    return allResults;
  } catch (error) {
    console.error('Error fetching multiple order countdown:', error);
    return [];
  }
};

/**
 * Hook for using order countdown with real-time updates
 */
export const useOrderCountdown = (orderId: string, updateInterval: number = 60000) => {
  const [countdown, setCountdown] = useState<OrderCountdownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchCountdown = async () => {
      try {
        setError(null);
        const countdownData = await getOrderCountdown(orderId);
        setCountdown(countdownData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchCountdown();
    
    // Update at specified interval
    const interval = setInterval(fetchCountdown, updateInterval);
    return () => clearInterval(interval);
  }, [orderId, updateInterval]);

  return { countdown, loading, error };
};

/**
 * Hook for using multiple order countdowns
 */
export const useMultipleOrderCountdown = (orderIds: string[], updateInterval: number = 300000) => {
  const [countdowns, setCountdowns] = useState<OrderCountdownData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderIds.length) {
      setCountdowns([]);
      setLoading(false);
      return;
    }

    const fetchCountdowns = async () => {
      try {
        setError(null);
        const countdownData = await getMultipleOrderCountdown(orderIds);
        setCountdowns(countdownData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchCountdowns();
    
    // Update every 5 minutes for bulk operations
    const interval = setInterval(fetchCountdowns, updateInterval);
    return () => clearInterval(interval);
  }, [orderIds.join(','), updateInterval]);

  return { countdowns, loading, error };
};

/**
 * Client-side countdown calculator for real-time updates between API calls
 */
export const calculateClientSideCountdown = (serverCountdown: OrderCountdownData): OrderCountdownData => {
  const now = new Date().getTime();
  const serverTime = new Date(serverCountdown.estimatedEndTime).getTime();
  const startTime = new Date(serverCountdown.startKeepTime).getTime();
  
  const timeRemainingInMilliseconds = serverTime - now;
  const isExpired = timeRemainingInMilliseconds <= 0;
  
  // Calculate percentage complete
  const totalDuration = serverTime - startTime;
  const elapsedTime = now - startTime;
  const percentageComplete = Math.max(0, Math.min(100, (elapsedTime / totalDuration) * 100));
  
  // Format time remaining
  const formatTimeRemaining = (ms: number): string => {
    const absMs = Math.abs(ms);
    const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absMs % (1000 * 60)) / 1000);

    if (days >= 1) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours >= 1) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m ${seconds}s`;
    }
  };

  let formattedTimeRemaining;
  if (isExpired) {
    formattedTimeRemaining = `Overdue by ${formatTimeRemaining(-timeRemainingInMilliseconds)}`;
  } else {
    formattedTimeRemaining = formatTimeRemaining(timeRemainingInMilliseconds);
  }

  return {
    ...serverCountdown,
    timeRemainingInMilliseconds,
    isExpired,
    formattedTimeRemaining,
    percentageComplete
  };
};
