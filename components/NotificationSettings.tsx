import { useStorageNotifications } from '@/hooks/useStorageNotifications';
import React, { useEffect, useState } from 'react';
import { Alert, Switch, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface NotificationSettingsProps {
  onClose?: () => void;
}

const palette = {
  background: '#fafafa',
  surface: '#ffffff',
  primary: '#2563eb',
  primarySoft: '#dbeafe',
  success: '#059669',
  successSoft: '#d1fae5',
  warning: '#d97706',
  warningSoft: '#fed7aa',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  shadow: 'rgba(15, 23, 42, 0.08)'
};

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const { getNotificationPreferences, updateNotificationPreferences } = useStorageNotifications();
  
  const [preferences, setPreferences] = useState({
    enabled: true,
    overtime: true,
    oneHourWarning: true,
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof typeof preferences) => {
    const newPreferences = { ...preferences, [key]: !preferences[key] };
    
    // If disabling main notifications, disable all sub-options
    if (key === 'enabled' && !newPreferences.enabled) {
      newPreferences.overtime = false;
      newPreferences.oneHourWarning = false;
    }
    
    setPreferences(newPreferences);
    
    const success = await updateNotificationPreferences(newPreferences);
    if (!success) {
      // Revert on failure
      setPreferences(preferences);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.background }}>
        <Text style={{ color: palette.textSecondary }}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 24, 
        paddingTop: 24,
        paddingBottom: 16,
        backgroundColor: palette.surface,
        borderBottomWidth: 1,
        borderBottomColor: palette.border
      }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: palette.text }}>
          Notification Settings
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={palette.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Settings List */}
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>
        
        {/* Main Toggle */}
        <View style={{ 
          backgroundColor: palette.surface, 
          borderRadius: 16, 
          padding: 20, 
          marginBottom: 16,
          shadowColor: palette.shadow,
          shadowOpacity: 0.08,
          shadowRadius: 8
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ 
              backgroundColor: palette.primarySoft, 
              borderRadius: 8, 
              padding: 8, 
              marginRight: 12 
            }}>
              <Ionicons name="notifications" size={20} color={palette.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: palette.text }}>
                Enable Notifications
              </Text>
              <Text style={{ fontSize: 13, color: palette.textSecondary, marginTop: 2 }}>
                Receive alerts about your storage orders
              </Text>
            </View>
            <Switch
              value={preferences.enabled}
              onValueChange={() => handleToggle('enabled')}
              trackColor={{ false: palette.border, true: palette.primarySoft }}
              thumbColor={preferences.enabled ? palette.primary : palette.textSecondary}
            />
          </View>
        </View>

        {/* Sub-options (only show if main is enabled) */}
        {preferences.enabled && (
          <>
            {/* Overtime Notifications */}
            <View style={{ 
              backgroundColor: palette.surface, 
              borderRadius: 16, 
              padding: 20, 
              marginBottom: 16,
              shadowColor: palette.shadow,
              shadowOpacity: 0.08,
              shadowRadius: 8
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ 
                  backgroundColor: palette.warningSoft, 
                  borderRadius: 8, 
                  padding: 8, 
                  marginRight: 12 
                }}>
                  <Ionicons name="time" size={20} color={palette.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: palette.text }}>
                    Overtime Alerts
                  </Text>
                  <Text style={{ fontSize: 13, color: palette.textSecondary, marginTop: 2 }}>
                    Get notified when storage time expires
                  </Text>
                </View>
                <Switch
                  value={preferences.overtime}
                  onValueChange={() => handleToggle('overtime')}
                  trackColor={{ false: palette.border, true: palette.warningSoft }}
                  thumbColor={preferences.overtime ? palette.warning : palette.textSecondary}
                />
              </View>
            </View>

            {/* One Hour Warning */}
            <View style={{ 
              backgroundColor: palette.surface, 
              borderRadius: 16, 
              padding: 20, 
              marginBottom: 16,
              shadowColor: palette.shadow,
              shadowOpacity: 0.08,
              shadowRadius: 8
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ 
                  backgroundColor: palette.successSoft, 
                  borderRadius: 8, 
                  padding: 8, 
                  marginRight: 12 
                }}>
                  <Ionicons name="alarm" size={20} color={palette.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: palette.text }}>
                    1-Hour Warning
                  </Text>
                  <Text style={{ fontSize: 13, color: palette.textSecondary, marginTop: 2 }}>
                    Get reminded 1 hour before overtime
                  </Text>
                </View>
                <Switch
                  value={preferences.oneHourWarning}
                  onValueChange={() => handleToggle('oneHourWarning')}
                  trackColor={{ false: palette.border, true: palette.successSoft }}
                  thumbColor={preferences.oneHourWarning ? palette.success : palette.textSecondary}
                />
              </View>
            </View>
          </>
        )}

        {/* Info Card */}
        <View style={{ 
          backgroundColor: palette.primarySoft, 
          borderRadius: 16, 
          padding: 16, 
          marginTop: 24,
          borderLeftWidth: 4,
          borderLeftColor: palette.primary
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="information-circle" size={20} color={palette.primary} />
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              color: palette.primary, 
              marginLeft: 8 
            }}>
              How it works
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: palette.primary, lineHeight: 18 }}>
            • Notifications work even when the app is closed{'\n'}
            • Get reminders before your storage time expires{'\n'}
            • Tap notifications to view order details{'\n'}
            • You can change these settings anytime
          </Text>
        </View>
      </View>
    </View>
  );
};
