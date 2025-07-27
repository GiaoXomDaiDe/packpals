// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Notifications from 'expo-notifications';
// import { Platform } from 'react-native';

// Configure notification behavior - DISABLED due to Expo SDK 53 warnings
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowBanner: true,
//     shouldShowList: true,
//     shouldPlaySound: true,
//     shouldSetBadge: false,
//   }),
// });

interface NotificationPreferences {
  enabled: boolean;
  overtime: boolean;
  oneHourWarning: boolean;
}

interface ScheduledNotificationData {
  orderId: string;
  type: 'overtime' | 'warning';
  notificationId: string;
  scheduledTime: number;
}

// NOTIFICATION SERVICE DISABLED - All methods return default values or no-ops
// This is to fix Expo SDK 53 warnings about expo-notifications being removed from Expo Go
class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // All methods below are disabled and return safe defaults
  setNotificationTapHandler(handler: (orderId: string, type: string) => void) {
    console.log('NotificationService: setNotificationTapHandler disabled');
  }

  async initialize(): Promise<boolean> {
    console.log('NotificationService: initialize disabled - returning true');
    return true;
  }

  async getPreferences(): Promise<NotificationPreferences> {
    return {
      enabled: false,
      overtime: false,
      oneHourWarning: false,
    };
  }

  async updatePreferences(preferences: NotificationPreferences): Promise<void> {
    console.log('NotificationService: updatePreferences disabled');
  }

  async scheduleOvertimeNotification(orderId: string, orderData: any): Promise<string | null> {
    console.log('NotificationService: scheduleOvertimeNotification disabled');
    return null;
  }

  async scheduleOneHourWarning(orderId: string, orderData: any): Promise<string | null> {
    console.log('NotificationService: scheduleOneHourWarning disabled');
    return null;
  }

  async scheduleOrderNotifications(orderId: string, orderData: any): Promise<{ overtime: string | null; warning: string | null }> {
    console.log('NotificationService: scheduleOrderNotifications disabled');
    return { overtime: null, warning: null };
  }

  async sendOrderCompletionNotification(orderId: string, orderData: any): Promise<void> {
    console.log('NotificationService: sendOrderCompletionNotification disabled');
  }

  async sendOrderStatusNotification(orderId: string, status: string, orderData: any): Promise<void> {
    console.log('NotificationService: sendOrderStatusNotification disabled');
  }

  async cancelOrderNotifications(orderId: string): Promise<void> {
    console.log('NotificationService: cancelOrderNotifications disabled');
  }

  async getScheduledNotifications(): Promise<ScheduledNotificationData[]> {
    return [];
  }

  async checkPermissions(): Promise<any> {
    console.log('NotificationService: checkPermissions disabled');
    return { status: 'undetermined' };
  }

  async requestPermissions(): Promise<any> {
    console.log('NotificationService: requestPermissions disabled');
    return { status: 'denied' };
  }

  async clearAllNotifications(): Promise<void> {
    console.log('NotificationService: clearAllNotifications disabled');
  }

  async sendTestNotification(): Promise<void> {
    console.log('NotificationService: sendTestNotification disabled');
  }
}

export default NotificationService.getInstance();
