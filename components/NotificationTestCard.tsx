import { useStorageNotifications } from '@/hooks/useStorageNotifications';
import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const palette = {
  background: '#fafafa',
  surface: '#ffffff',
  primary: '#2563eb',
  primarySoft: '#dbeafe',
  text: '#1e293b',
  textSecondary: '#64748b',
  success: '#059669',
  successSoft: '#d1fae5',
  warning: '#d97706',
  warningSoft: '#fed7aa',
  border: '#e2e8f0',
};

export const NotificationTestCard = () => {
  const {
    scheduleOrderNotifications,
    cancelOrderNotifications,
    getNotificationPreferences,
    updateNotificationPreferences,
    sendTestNotification,
  } = useStorageNotifications();

  const [preferences, setPreferences] = useState({
    enabled: true,
    overtime: true,
    oneHourWarning: true,
  });

  // Test order data
  const testOrder = {
    id: 'test-order-123',
    startKeepTime: new Date().toISOString(),
    estimatedDays: 1, // 1 day for quick testing
    storage: {
      title: 'Test Storage Location',
      description: 'This is a test storage for notification testing'
    },
    packageDescription: 'Test Package'
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      Alert.alert('Success', 'Test notification sent!');
    } catch (error: any) {
      console.error('Test notification error:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleScheduleNotifications = async () => {
    try {
      const result = await scheduleOrderNotifications(testOrder);
      Alert.alert('Success', `Notifications scheduled: ${JSON.stringify(result)}`);
    } catch (error: any) {
      console.error('Schedule notification error:', error);
      Alert.alert('Error', 'Failed to schedule notifications');
    }
  };

  const handleCancelNotifications = async () => {
    try {
      await cancelOrderNotifications(testOrder.id);
      Alert.alert('Success', 'Notifications cancelled!');
    } catch (error: any) {
      console.error('Cancel notification error:', error);
      Alert.alert('Error', 'Failed to cancel notifications');
    }
  };

  const handleGetPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
      Alert.alert('Preferences', JSON.stringify(prefs, null, 2));
    } catch (error: any) {
      console.error('Get preferences error:', error);
      Alert.alert('Error', 'Failed to get preferences');
    }
  };

  const handleCheckPermissions = async () => {
    try {
      const notificationService = (await import('@/lib/services/notificationService')).default;
      const permissions = await notificationService.checkPermissions();
      Alert.alert('Permissions', JSON.stringify(permissions, null, 2));
    } catch (error: any) {
      console.error('Check permissions error:', error);
      Alert.alert('Error', 'Failed to check permissions');
    }
  };

  const handleRequestPermissions = async () => {
    try {
      const notificationService = (await import('@/lib/services/notificationService')).default;
      const permissions = await notificationService.requestPermissions();
      Alert.alert('Requested Permissions', JSON.stringify(permissions, null, 2));
    } catch (error: any) {
      console.error('Request permissions error:', error);
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      const success = await updateNotificationPreferences(preferences);
      Alert.alert('Success', success ? 'Preferences updated!' : 'Failed to update preferences');
    } catch (error: any) {
      console.error('Update preferences error:', error);
      Alert.alert('Error', 'Failed to update preferences');
    }
  };

  return (
    <ScrollView style={{ 
      backgroundColor: palette.surface, 
      borderRadius: 16, 
      padding: 16, 
      margin: 16 
    }}>
      <Text style={{ 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: palette.text, 
        marginBottom: 16,
        textAlign: 'center'
      }}>
        🔔 Notification Test Panel
      </Text>

      {/* Test Buttons */}
      <View style={{ gap: 12 }}>
        <TouchableOpacity
          onPress={handleTestNotification}
          style={{
            backgroundColor: palette.primary,
            padding: 12,
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>
            Send Test Notification
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleScheduleNotifications}
          style={{
            backgroundColor: palette.success,
            padding: 12,
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>
            Schedule Order Notifications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCancelNotifications}
          style={{
            backgroundColor: palette.warning,
            padding: 12,
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>
            Cancel Notifications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCheckPermissions}
          style={{
            backgroundColor: '#6366f1',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>
            Check Permissions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRequestPermissions}
          style={{
            backgroundColor: '#8b5cf6',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>
            Request Permissions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGetPreferences}
          style={{
            backgroundColor: palette.primarySoft,
            padding: 12,
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: palette.primary, fontWeight: '600' }}>
            Get Preferences
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleUpdatePreferences}
          style={{
            backgroundColor: palette.successSoft,
            padding: 12,
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: palette.success, fontWeight: '600' }}>
            Update Preferences
          </Text>
        </TouchableOpacity>
      </View>

      {/* Preferences Toggle */}
      <View style={{ marginTop: 20, padding: 16, backgroundColor: palette.background, borderRadius: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: palette.text, marginBottom: 12 }}>
          Notification Preferences
        </Text>
        
        {Object.entries(preferences).map(([key, value]) => (
          <TouchableOpacity
            key={key}
            onPress={() => setPreferences(prev => ({ ...prev, [key]: !value }))}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: palette.border
            }}
          >
            <Text style={{ color: palette.text, fontSize: 14 }}>
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            </Text>
            <View style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: value ? palette.success : palette.border,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {value && <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Test Order Info */}
      <View style={{ marginTop: 16, padding: 12, backgroundColor: palette.warningSoft, borderRadius: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: palette.warning, marginBottom: 8 }}>
          Test Order Details:
        </Text>
        <Text style={{ fontSize: 12, color: palette.textSecondary }}>
          ID: {testOrder.id}
        </Text>
        <Text style={{ fontSize: 12, color: palette.textSecondary }}>
          Duration: {testOrder.estimatedDays} day(s)
        </Text>
        <Text style={{ fontSize: 12, color: palette.textSecondary }}>
          Storage: {testOrder.storage.title}
        </Text>
      </View>
    </ScrollView>
  );
};
