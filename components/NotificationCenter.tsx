// import * as Notifications from 'expo-notifications';
// import { useRouter } from 'expo-router';
// import { useEffect } from 'react';

// Component to handle notification center logic across the app
// DISABLED due to Expo SDK 53 warnings about expo-notifications being removed from Expo Go
export const NotificationCenter = () => {
  // All notification handling disabled
  console.log('NotificationCenter: Notification handling disabled');
  return null;
};

// Utility functions for sending notifications from anywhere in the app
// DISABLED - All functions return safe defaults
export const NotificationUtils = {
  // Send notification when order status changes
  sendOrderStatusChange: async (orderId: string, newStatus: string, orderData: {
    storageTitle?: string;
  }) => {
    console.log('NotificationUtils: sendOrderStatusChange disabled');
  },

  // Send notification when order is completed
  sendOrderCompletion: async (orderId: string, orderData: {
    storageTitle?: string;
    totalAmount?: number;
    actualDays?: number;
  }) => {
    console.log('NotificationUtils: sendOrderCompletion disabled');
  },

  // Cancel all notifications for an order
  cancelOrderNotifications: async (orderId: string) => {
    console.log('NotificationUtils: cancelOrderNotifications disabled');
  },

  // Schedule notifications for an active order
  scheduleOrderNotifications: async (orderId: string, orderData: {
    startKeepTime: string;
    estimatedDays: number;
    storageTitle?: string;
  }) => {
    console.log('NotificationUtils: scheduleOrderNotifications disabled');
    return { overtime: null, warning: null };
  }
};
