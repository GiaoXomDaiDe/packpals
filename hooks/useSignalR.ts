import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { NotificationMessage, PendingCountUpdate, signalRService } from '../lib/signalr/signalRService';

export interface UseSignalROptions {
  baseUrl?: string;
  keeperId?: string;
  autoConnect?: boolean;
}

export interface SignalRState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  pendingCount: number;
}

export interface UseSignalRReturn extends SignalRState {
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  joinGroup: (userId: string, userType?: 'keeper' | 'renter') => Promise<boolean>;
  leaveGroup: (userType?: 'keeper' | 'renter') => Promise<boolean>;
  // Event handlers
  onNewOrder: (handler: (message: NotificationMessage) => void) => () => void;
  onOrderStatusChange: (handler: (message: NotificationMessage) => void) => () => void;
  onPendingCountUpdate: (handler: (data: PendingCountUpdate) => void) => () => void;
}

export const useSignalR = (options: UseSignalROptions = {}): UseSignalRReturn => {
  const {
    baseUrl = 'http://192.168.43.112:5000',
    keeperId,
    autoConnect = true
  } = options;

  const [state, setState] = useState<SignalRState>({
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    pendingCount: 0
  });

  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlersRef = useRef<(() => void)[]>([]);

  // Connect to SignalR
  const connect = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isConnecting: true, connectionError: null }));

    try {
      const success = await signalRService.initialize(baseUrl);
      
      setState(prev => ({
        ...prev,
        isConnected: success,
        isConnecting: false,
        connectionError: success ? null : 'Failed to connect'
      }));

      if (success && keeperId) {
        await joinGroup(keeperId);
      }

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        connectionError: errorMessage
      }));
      return false;
    }
  }, [baseUrl, keeperId]);

  // Disconnect from SignalR
  const disconnect = async (): Promise<void> => {
    try {
      await signalRService.disconnect();
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionError: null
      }));
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  // Join user group (keeper or renter)
  const joinGroup = async (userId: string, userType: 'keeper' | 'renter' = 'keeper'): Promise<boolean> => {
    try {
      let success = false;
      if (userType === 'keeper') {
        success = await signalRService.joinKeeperGroup(userId);
      } else {
        success = await signalRService.joinRenterGroup(userId);
      }
      return success;
    } catch (error) {
      console.error('Join group error:', error);
      return false;
    }
  };

  // Leave user group  
  const leaveGroup = async (userType: 'keeper' | 'renter' = 'keeper'): Promise<boolean> => {
    try {
      let success = false;
      if (userType === 'keeper') {
        success = await signalRService.leaveKeeperGroup();
      } else {
        success = await signalRService.leaveRenterGroup();
      }
      return success;
    } catch (error) {
      console.error('Leave group error:', error);
      return false;
    }
  };

  // Event handler methods
  const onNewOrder = (handler: (message: NotificationMessage) => void) => {
    return signalRService.onNewOrder(handler);
  };

  const onOrderStatusChange = (handler: (message: NotificationMessage) => void) => {
    return signalRService.onOrderStatusChange(handler);
  };

  const onPendingCountUpdate = (handler: (data: PendingCountUpdate) => void) => {
    const unsubscribe = signalRService.onPendingCountUpdate((data: PendingCountUpdate) => {
      setState(prev => ({ ...prev, pendingCount: data.pendingCount }));
      handler(data);
    });
    return unsubscribe;
  };

  // Handle app state changes
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && !signalRService.isConnected && autoConnect) {
      // Reconnect when app becomes active
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 1000);
    } else if (nextAppState === 'background') {
      // Clear reconnect timeout when app goes to background
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    }
  }, [autoConnect, connect]);

  // Setup effects
  useEffect(() => {
    // Auto-connect on mount if enabled
    if (autoConnect) {
      connect();
    }

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup
    return () => {
      subscription?.remove();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Cleanup all handlers
      handlersRef.current.forEach(cleanup => cleanup());
      handlersRef.current = [];
    };
  }, [autoConnect, connect, handleAppStateChange]);

  // Update connection state when service state changes
  useEffect(() => {
    const interval = setInterval(() => {
      const connected = signalRService.isConnected;
      setState(prev => {
        if (prev.isConnected !== connected) {
          return { ...prev, isConnected: connected };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    joinGroup,
    leaveGroup,
    onNewOrder,
    onOrderStatusChange,
    onPendingCountUpdate
  };
};
