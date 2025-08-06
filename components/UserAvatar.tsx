import React from 'react';
import { Text, View } from 'react-native';

interface UserAvatarProps {
  username?: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
  showOnlineStatus?: boolean;
  onlineStatusColor?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  username = 'User', 
  size = 48, 
  backgroundColor = '#2563eb',
  textColor = '#ffffff',
  showOnlineStatus = true,
  onlineStatusColor = '#10b981'
}) => {
  // Get initials from username
  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
  };

  // Generate a consistent color based on username
  const generateColor = (str: string): string => {
    const colors = [
      '#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', 
      '#db2777', '#0891b2', '#65a30d', '#ea580c', '#9333ea'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const initials = getInitials(username);
  const avatarColor = generateColor(username);
  const fontSize = size * 0.4; // Dynamic font size based on avatar size
  
  // Calculate online indicator size and position
  const indicatorSize = Math.max(size * 0.25, 8); // Minimum 8px, scales with avatar
  const indicatorPosition = size * 0.08; // Distance from edge

  return (
    <View style={{ position: 'relative' }}>
      {/* Avatar Container */}
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: avatarColor,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <Text style={{
          color: textColor,
          fontSize: fontSize,
          fontWeight: '700',
          textAlign: 'center',
        }}>
          {initials}
        </Text>
      </View>
      
      {/* Online Status Indicator */}
      {showOnlineStatus ? (
        <View style={{
          position: 'absolute',
          bottom: indicatorPosition,
          right: indicatorPosition,
          width: indicatorSize,
          height: indicatorSize,
          borderRadius: indicatorSize / 2,
          backgroundColor: onlineStatusColor,
          borderWidth: 2,
          borderColor: '#ffffff',
          shadowColor: 'rgba(0, 0, 0, 0.2)',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
          elevation: 4,
        }} />
      ) : null}
    </View>
  );
};
