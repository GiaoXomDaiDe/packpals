import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface NotificationSettingsCardProps {
  onPress: () => void;
}

const palette = {
  surface: '#ffffff',
  primary: '#2563eb',
  primarySoft: '#dbeafe',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  shadow: 'rgba(15, 23, 42, 0.08)'
};

export const NotificationSettingsCard: React.FC<NotificationSettingsCardProps> = ({ onPress }) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      style={{ 
        backgroundColor: palette.surface, 
        borderRadius: 16, 
        padding: 20, 
        marginVertical: 8,
        shadowColor: palette.shadow,
        shadowOpacity: 0.08,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: palette.border
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{ 
            backgroundColor: palette.primarySoft, 
            borderRadius: 12, 
            padding: 12, 
            marginRight: 16 
          }}>
            <Ionicons name="notifications" size={24} color={palette.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: palette.text,
              marginBottom: 4
            }}>
              Notification Settings
            </Text>
            <Text style={{ 
              fontSize: 13, 
              color: palette.textSecondary,
              lineHeight: 18
            }}>
              Manage alerts for storage deadlines and overtime notifications
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={palette.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};
