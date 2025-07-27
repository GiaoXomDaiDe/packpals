# PayOS Payment Flow Setup with Expo Auth Session

## Overview
This guide configures PayOS payment integration using **Expo Auth Session** for seamless deep linking in both development and production environments. No manual URL configuration needed!

## Current Configuration

### 1. Ngrok Setup (Only for Webhook)
- **URL**: `https://a169fb8b36f3.ngrok-free.app`
- **Webhook Endpoint**: `/api/payment/OS/webhook`
- **Full Webhook URL**: `https://a169fb8b36f3.ngrok-free.app/api/payment/OS/webhook`

### 2. Expo Auth Session Deep Linking
- **App Scheme**: `packpals` (configured in app.json)
- **Redirect Path**: `payment-result`
- **Automatic Handling**: Expo Auth Session manages URLs automatically
- **Development**: Works in Expo Go without manual configuration
- **Production**: Works with compiled app using app scheme

## Setup Instructions

### Step 1: Start Backend Server
```bash
# Start backend on all interfaces (required for ngrok)
cd PackPals-BE/PackPal-BE/Packpal
dotnet run --urls="http://0.0.0.0:5000"
```

### Step 2: Start Ngrok Tunnel
```bash
# In a new terminal, start ngrok tunnel
ngrok http 5000

# Update the ngrok URL in:
# - lib/config/network.config.ts (baseURL)
# - lib/config/payment.config.ts (ngrok.baseUrl)
# - lib/api/payos.api.ts (confirmWebhook default URL)
```

### Step 3: Start Expo Development Server
```bash
cd PackPals-FE
expo start

# No URL configuration needed - Expo Auth Session handles everything automatically!
```

### Step 4: Test Payment Flow
1. Use the payment test screen: `/payment-test`
2. Or integrate payment into your order flow:

```typescript
import { usePaymentFlow } from '@/lib/hooks/usePaymentFlow'

// In your component
const { initiatePayment, isLoading } = usePaymentFlow()

const handlePayment = async () => {
  await initiatePayment({
    orderId: 'ORDER_123',
    amount: 50000, // VND
    description: 'Storage payment',
    buyerEmail: 'user@example.com'
  })
  // Payment will open in WebView and automatically redirect back to app!
}
```

## Payment Flow Process

1. **Payment Initiation**:
   - User clicks pay button
   - App calls `initiatePayment()`
   - PayOS payment link created with Expo Auth Session redirect URI
   - Payment opens in WebView using `expo-web-browser`

2. **Payment Completion**:
   - User completes payment in WebView
   - PayOS redirects back to app automatically via Expo Auth Session
   - App receives result and navigates to `/payment-result` screen
   - Payment status verified and order updated

3. **Webhook Notification** (Parallel):
   - PayOS sends webhook to ngrok URL
   - Backend processes payment notification
   - Database updated with payment status

## Advantages of Expo Auth Session Approach

✅ **No manual URL configuration** - Works automatically in dev and production
✅ **No IP address updates** - No need to update development machine IP
✅ **Seamless user experience** - Payment opens in WebView, closes automatically
✅ **Cross-platform compatibility** - Works on iOS, Android, and Expo Go
✅ **Production ready** - Same code works for development and production builds

## Troubleshooting

### Common Issues:

1. **Network Error trong Expo Go**:
   - **Cause**: Metro cache hoặc Expo Go network issues
   - **Solution**: 
     ```bash
     npx expo start --clear
     ```
   - **Alternative**: Reload app trong Expo Go (shake device → reload)

2. **API calls timeout**:
   - Check ngrok tunnel status: `http://127.0.0.1:4040`
   - Test manual API call: `/network-debug` screen
   - Verify backend running: `dotnet run --urls="http://0.0.0.0:5000"`

3. **Webhook not received**:
   - Verify ngrok URL is accessible
   - Check backend webhook endpoint
   - Test webhook with PayOS dashboard

4. **Payment WebView not opening**:
   - Check `expo-web-browser` installation
   - Verify PayOS response format
   - Check console logs for errors

### Debug Tools:

**Network Debug Screen**: Navigate to `/network-debug` to:
- Test individual API endpoints
- Check network configuration
- Measure response times
- Diagnose connectivity issues

### Development URLs to Update:

When your ngrok URL changes, update these files:
- `lib/config/network.config.ts` - baseURL
- `lib/config/payment.config.ts` - ngrok.baseUrl  
- `lib/api/payos.api.ts` - webhook default URL

When your Expo tunnel changes, update:
- `lib/api/payos.api.ts` - getPaymentUrls() IP address
- `lib/config/payment.config.ts` - expoGo.tunnelUrl

## Production Configuration

For production builds, the system will automatically use:
- **Scheme**: `packpals://`
- **Return URL**: `packpals://app/payment-result`
- **Webhook**: Your production server webhook endpoint

## Testing

Use the payment test screen at `/payment-test` to:
- Test payment flow end-to-end
- Verify webhook setup
- Test deep linking
- Debug configuration issues
