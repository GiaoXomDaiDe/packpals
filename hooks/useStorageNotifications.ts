import notificationService from '@/lib/services/notificationService';
import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';

// Notification hook for managing storage countdown notifications
// Note: Notifications are disabled for Expo Go compatibility
export const useStorageNotifications = () => {
  const router = useRouter();

  // Initialize notification service
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        console.log('App running in Expo Go - push notifications are not available. Local notifications will work.');

        // Check permissions first
        const permissions = await notificationService.checkPermissions();
        console.log('Current permissions:', permissions);
        
        // Request permissions if needed (this works for local notifications)
        if (!permissions.granted) {
          console.log('Requesting notification permissions...');
          const newPermissions = await notificationService.requestPermissions();
          console.log('Permission result:', newPermissions);
        }

        const success = await notificationService.initialize();
        if (success) {
          console.log('Notifications initialized successfully (Expo Go compatibility mode)');
          
          // Set up notification tap handler
          notificationService.setNotificationTapHandler((orderId: string, type: string) => {
            console.log(`Notification tapped: ${type} for order ${orderId}`);
            router.push(`/(root)/orderdetails/${orderId}` as any);
          });
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        // Don't throw error, just log it - app should continue working
      }
    };

    initializeNotifications();
  }, [router]);

  // Schedule notifications for an order (disabled for Expo Go)
  const scheduleOrderNotifications = useCallback(async (order: any) => {
    try {
      if (!order.id || !order.startKeepTime || !order.estimatedDays) {
        console.warn('Invalid order data for scheduling notifications');
        return null;
      }

      // Notifications are disabled for Expo Go compatibility
      console.log(`Would schedule notifications for order ${order.id} (disabled in Expo Go)`);
      return null;
    } catch (error) {
      console.error('Failed to schedule order notifications:', error);
      return null;
    }
  }, []);

  // Cancel notifications for an order (disabled for Expo Go)
  const cancelOrderNotifications = useCallback(async (orderId: string) => {
    try {
      console.log(`Would cancel notifications for order ${orderId} (disabled in Expo Go)`);
    } catch (error) {
      console.error('Failed to cancel order notifications:', error);
    }
  }, []);

  // Get notification preferences
  const getNotificationPreferences = useCallback(async () => {
    try {
      return await notificationService.getPreferences();
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return {
        enabled: false,
        overtime: false,
        oneHourWarning: false,
      };
    }
  }, []);

  // Update notification preferences
  const updateNotificationPreferences = useCallback(async (preferences: {
    enabled: boolean;
    overtime: boolean;
    oneHourWarning: boolean;
  }) => {
    try {
      await notificationService.updatePreferences(preferences);
      console.log('Updated notification preferences:', preferences);
      return true;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      return false;
    }
  }, []);

  // Send test notification (for debugging - disabled for Expo Go)
  const sendTestNotification = useCallback(async () => {
    try {
      console.log('Test notification would be sent (disabled in Expo Go)');
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }, []);

  // Send order completion notification (disabled for Expo Go)
  const sendOrderCompletionNotification = useCallback(async (orderId: string, orderData: {
    storageTitle?: string;
    totalAmount?: number;
    actualDays?: number;
  }) => {
    try {
      console.log(`Would send completion notification for order ${orderId} (disabled in Expo Go)`);
    } catch (error) {
      console.error('Failed to send completion notification:', error);
    }
  }, []);

  // Send order status change notification (disabled for Expo Go)
  const sendOrderStatusNotification = useCallback(async (orderId: string, status: string, orderData: {
    storageTitle?: string;
  }) => {
    try {
      console.log(`Would send status notification for order ${orderId}: ${status} (disabled in Expo Go)`);
    } catch (error) {
      console.error('Failed to send status notification:', error);
    }
  }, []);

  return {
    scheduleOrderNotifications,
    cancelOrderNotifications,
    getNotificationPreferences,
    updateNotificationPreferences,
    sendTestNotification,
    sendOrderCompletionNotification,
    sendOrderStatusNotification,
  };
};
