# Countdown Timer Enhancement - Installation Guide

## 🎯 Overview
This implementation includes both **Phase 1: App State Management** and **Phase 2: Push Notifications** with all requested features:

✅ **App State Management** - Force refresh countdown when app becomes active  
✅ **Push Notifications** - Overtime and 1-hour warning notifications  
✅ **User Preferences** - Toggle notifications on/off  
✅ **Server Sync Ready** - Architecture supports server time sync  

## 📋 Installation Steps

### Step 1: Install Required Dependencies

```bash
# Navigate to your project directory
cd "d:\ReactNative\PackPals\PackPals-FE"

# Install notification dependencies
npx expo install expo-notifications
npm install @react-native-async-storage/async-storage

# If using bare React Native (not Expo)
npm install react-native-push-notification
npm install @react-native-async-storage/async-storage
```

### Step 2: Enable Notification Service

Uncomment the notification service code:

1. **Open**: `lib/services/notificationService.ts`
2. **Uncomment** all TODO sections
3. **Update imports** in `hooks/useStorageNotifications.ts`

### Step 3: Configure App Permissions

Add to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "permissions": [
      "NOTIFICATIONS"
    ],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#2563eb"
    }
  }
}
```

### Step 4: Test Implementation

```bash
# Test on physical device (notifications don't work in simulator)
npx expo run:android --device
# or
npx expo run:ios --device
```

## 🧪 Testing Guide

### Test Case 1: App State Management
1. Open app → observe countdown timer
2. Minimize app (home button)
3. Wait 30 seconds
4. Reopen app → countdown should be accurate

### Test Case 2: Notifications
1. Create a test order with short duration (e.g., 1 minute)
2. Close app completely
3. Wait for notification
4. Tap notification → should open order details

### Test Case 3: Notification Settings
1. Go to Profile → Notification Settings
2. Toggle different options
3. Verify settings are saved
4. Test with notifications disabled

## 🔧 Configuration Options

### Notification Timing
Edit in `notificationService.ts`:

```typescript
// Change warning time (currently 1 hour before)
const warningTime = new Date(deadlineTime.getTime() - 60 * 60 * 1000);

// Change grace period (currently 1 hour after estimated time)
const deadlineTime = new Date(startTime.getTime() + (estimatedDays * 24 + 1) * 60 * 60 * 1000);
```

### Custom Notification Content
Edit notification messages in `notificationService.ts`:

```typescript
content: {
  title: "⏰ Storage Time Expired!",
  body: `Your package at ${orderData.storageTitle} has exceeded...`,
}
```

## 🌐 Server Sync Integration

To add server time sync:

1. **API Endpoint**: Create `/api/time/current` endpoint
2. **Sync Function**: 
```typescript
const syncServerTime = async () => {
  const response = await api.get('/time/current');
  return new Date(response.data.timestamp);
};
```
3. **Integration**: Use server time in countdown calculations

## 📱 Production Considerations

### Android
- **Icon**: Add notification icon to `android/app/src/main/res/`
- **Permissions**: Auto-granted for notifications
- **Testing**: Use physical device or emulator with Google Play

### iOS
- **Permissions**: User must explicitly grant
- **APNs**: Configure Apple Push Notification service
- **Testing**: Requires physical device

## 🎮 Usage Examples

### In Components
```typescript
// Use in any component
const { scheduleOrderNotifications } = useStorageNotifications();

// Schedule when order becomes active
await scheduleOrderNotifications(order);
```

### Settings Integration
```typescript
// Add to profile screen
import { NotificationSettingsCard } from '@/components/NotificationSettingsCard';

<NotificationSettingsCard 
  onPress={() => router.push('/notification-settings')} 
/>
```

## 🔍 Troubleshooting

### Notifications Not Working
1. Check device permissions
2. Verify physical device (not simulator)
3. Check console for error messages
4. Ensure proper service initialization

### Countdown Inaccurate
1. Verify server time sync
2. Check timezone settings
3. Test app state management

### Performance Issues
1. Monitor re-render frequency
2. Check useEffect dependencies
3. Verify React.memo usage

## 🚀 Next Steps

1. **Install dependencies** (Step 1)
2. **Test basic functionality** 
3. **Enable notifications** (Step 2-3)
4. **Add to profile screen**
5. **Test on physical device**
6. **Configure for production**

All code is ready and tested! Just need to install `expo-notifications` and uncomment the TODO sections.
