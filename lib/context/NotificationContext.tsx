import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useSignalR } from '../../hooks/useSignalR';
import { NotificationMessage, PendingCountUpdate } from '../signalr/signalRService';

interface NotificationContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  pendingCount: number;
  
  // Connection control
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  joinGroup: (userId: string, userType?: 'keeper' | 'renter') => Promise<boolean>;
  leaveGroup: () => Promise<boolean>;
  
  // Notification history
  recentNotifications: NotificationMessage[];
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export interface NotificationProviderProps {
  children: ReactNode;
  userId?: string;
  userType?: 'keeper' | 'renter';
  baseUrl?: string;
  autoConnect?: boolean;
  showAlerts?: boolean;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  userId,
  userType = 'keeper',
  baseUrl = 'http://192.168.1.43:5000', // Updated to correct IPv4 address for physical device
  autoConnect = true,
  showAlerts = true
}) => {
  const signalR = useSignalR({ baseUrl, keeperId: userType === 'keeper' ? userId : undefined, autoConnect });
  const [recentNotifications, setRecentNotifications] = useState<NotificationMessage[]>([]);

  // Handle new order notifications (for keepers)
  useEffect(() => {
    if (userType !== 'keeper') return;
    
    const unsubscribe = signalR.onNewOrder((message: NotificationMessage) => {
      setRecentNotifications(prev => [message, ...prev.slice(0, 9)]); // Keep last 10
      
      if (showAlerts) {
        Alert.alert(
          '🆕 New Order!',
          `New order from ${message.customerName || 'Customer'}\nItems: ${message.itemCount || 0}\nAmount: ${message.totalAmount || 0} VND`,
          [{ text: 'OK' }]
        );
      }
    });

    return unsubscribe;
  }, [signalR, showAlerts, userType]);

  // Handle order status change notifications (for both keeper and renter)
  useEffect(() => {
    const unsubscribe = signalR.onOrderStatusChange((message: NotificationMessage) => {
      console.log('🔄 Received order status change notification:', message);
      setRecentNotifications(prev => [message, ...prev.slice(0, 9)]); // Keep last 10
      
      if (showAlerts) {
        const title = userType === 'keeper' ? '🔄 Order Updated!' : '� Order Status Changed!';
        const body = userType === 'keeper' 
          ? `Order status changed to: ${message.newStatus || 'Unknown'}\nCustomer: ${message.customerName || 'Customer'}`
          : `Your order status has been updated to: ${message.newStatus || 'Unknown'}\nBy: ${message.keeperName || 'Storage Keeper'}`;
          
        Alert.alert(title, body, [{ text: 'OK' }]);
      }
    });

    return unsubscribe;
  }, [signalR, showAlerts, userType]);

  // Handle pending count updates
  useEffect(() => {
    const unsubscribe = signalR.onPendingCountUpdate((data: PendingCountUpdate) => {
      console.log(`📊 Pending orders count: ${data.pendingCount}`);
    });

    return unsubscribe;
  }, [signalR]);

  const clearNotifications = () => {
    setRecentNotifications([]);
  };

  const contextValue: NotificationContextType = {
    // Connection state
    isConnected: signalR.isConnected,
    isConnecting: signalR.isConnecting,
    connectionError: signalR.connectionError,
    pendingCount: signalR.pendingCount,
    
    // Connection control
    connect: signalR.connect,
    disconnect: signalR.disconnect,
    joinGroup: (userId: string, userType?: 'keeper' | 'renter') => signalR.joinGroup(userId, userType || 'keeper'),
    leaveGroup: () => signalR.leaveGroup(userType),
    
    // Notification history
    recentNotifications,
    clearNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
