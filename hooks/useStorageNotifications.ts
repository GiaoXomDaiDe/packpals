import notificationService from '@/lib/services/notificationService';
import { getEnvironmentInfo } from '@/lib/utils/environment';
import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';

// Notification hook for managing storage countdown notifications
export const useStorageNotifications = () => {
  const router = useRouter();

  // Initialize notification service
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Check environment info
        const envInfo = getEnvironmentInfo();
        console.log(`App environment: ${envInfo.description}`);
        
        if (!envInfo.supportsFullNotifications) {
          console.warn('Running in Expo Go - push notifications are not available. Local notifications will work.');
        }

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
          console.log(`Notifications initialized successfully (${envInfo.description})`);
          
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

  // Remove the old effect that handled notification responses

  // Schedule notifications for an order
  const scheduleOrderNotifications = useCallback(async (order: any) => {
    try {
      if (!order.id || !order.startKeepTime || !order.estimatedDays) {
        console.warn('Invalid order data for scheduling notifications');
        return null;
      }

      const result = await notificationService.scheduleOrderNotifications(order.id, {
        startKeepTime: order.startKeepTime,
        estimatedDays: order.estimatedDays,
        storageTitle: order.storage?.title || order.storage?.description
      });

      console.log(`Scheduled notifications for order ${order.id}:`, result);
      return result;
    } catch (error) {
      console.error('Failed to schedule order notifications:', error);
      // In Expo Go, this might fail but app should continue
      if (error instanceof Error && error.message.includes('Expo Go')) {
        console.log('Push notifications not available in Expo Go - use development build for full functionality');
      }
      return null;
    }
  }, []);

  // Cancel notifications for an order
  const cancelOrderNotifications = useCallback(async (orderId: string) => {
    try {
      await notificationService.cancelOrderNotifications(orderId);
      console.log(`Cancelled notifications for order ${orderId}`);
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

  // Send test notification (for debugging)
  const sendTestNotification = useCallback(async () => {
    try {
      await notificationService.sendTestNotification();
      console.log('Test notification sent (local notification in Expo Go)');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      if (error instanceof Error && error.message.includes('Expo Go')) {
        console.log('Test notification failed in Expo Go - this is expected behavior');
      }
    }
  }, []);

  // Send order completion notification
  const sendOrderCompletionNotification = useCallback(async (orderId: string, orderData: {
    storageTitle?: string;
    totalAmount?: number;
    actualDays?: number;
  }) => {
    try {
      await notificationService.sendOrderCompletionNotification(orderId, orderData);
      console.log(`Sent completion notification for order ${orderId}`);
    } catch (error) {
      console.error('Failed to send completion notification:', error);
    }
  }, []);

  // Send order status change notification
  const sendOrderStatusNotification = useCallback(async (orderId: string, status: string, orderData: {
    storageTitle?: string;
  }) => {
    try {
      await notificationService.sendOrderStatusNotification(orderId, status, orderData);
      console.log(`Sent status notification for order ${orderId}: ${status}`);
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
