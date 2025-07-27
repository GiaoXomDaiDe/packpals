import Constants from 'expo-constants';

/**
 * Utility functions for detecting app environment
 */

/**
 * Check if the app is running in Expo Go
 * Expo Go has limitations with push notifications from SDK 53+
 */
export const isExpoGo = (): boolean => {
  return Constants.appOwnership === 'expo';
};

/**
 * Check if the app is a development build
 * Development builds support full notification functionality
 */
export const isDevelopmentBuild = (): boolean => {
  return Constants.appOwnership !== 'expo' && __DEV__;
};

/**
 * Check if the app is a production build
 */
export const isProductionBuild = (): boolean => {
  return Constants.appOwnership !== 'expo' && !__DEV__;
};

/**
 * Get a user-friendly environment description
 */
export const getEnvironmentInfo = (): {
  type: 'expo-go' | 'development' | 'production';
  supportsFullNotifications: boolean;
  description: string;
} => {
  if (isExpoGo()) {
    return {
      type: 'expo-go',
      supportsFullNotifications: false,
      description: 'Expo Go (local notifications only)'
    };
  } else if (isDevelopmentBuild()) {
    return {
      type: 'development',
      supportsFullNotifications: true,
      description: 'Development build (full notifications)'
    };
  } else {
    return {
      type: 'production',
      supportsFullNotifications: true,
      description: 'Production build (full notifications)'
    };
  }
};
