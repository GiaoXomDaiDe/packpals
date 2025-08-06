import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNotifications } from '../context/NotificationContext';

export interface NotificationBadgeProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  textColor?: string;
  showZero?: boolean;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  size = 'medium',
  color = '#ef4444',
  textColor = '#ffffff',
  showZero = false
}) => {
  const { pendingCount } = useNotifications();

  if (!showZero && pendingCount === 0) {
    return null;
  }

  const sizeStyles = {
    small: { width: 14, height: 14, fontSize: 9 },
    medium: { width: 18, height: 18, fontSize: 11 },
    large: { width: 22, height: 22, fontSize: 13 }
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          width: currentSize.width,
          height: currentSize.height,
          backgroundColor: color,
        }
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color: textColor,
            fontSize: currentSize.fontSize,
          }
        ]}
      >
        {pendingCount > 99 ? '99+' : pendingCount.toString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 14,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  badgeText: {
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default NotificationBadge;
