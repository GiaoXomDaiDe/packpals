# Bulk Order Countdown Integration Guide

## Overview
This guide explains how to implement bulk countdown functionality using the `/api/order/countdown/bulk` endpoint with automatic sync every 10 minutes and real-time client-side updates.

## Architecture

### Server-Side (Backend)
- **Endpoint**: `POST /api/order/countdown/bulk`
- **Batch Size**: Maximum 50 orders per request
- **Response**: Array of `OrderCountdownData` objects

### Client-Side (Frontend)
- **Hook**: `useBulkOrderCountdown`
- **Server Sync**: Every 10 minutes (configurable)
- **Client Updates**: Every 1 second for real-time UI
- **Hybrid Approach**: Server accuracy + client-side performance

## Implementation Steps

### 1. Backend API Setup (Already Completed)

```csharp
// OrderController.cs
[HttpPost("countdown/bulk")]
public async Task<IActionResult> GetMultipleOrderCountdownAsync([FromBody] List<Guid> orderIds)
{
    var countdowns = await _orderService.GetMultipleOrderCountdownAsync(orderIds);
    return Ok(new { data = countdowns });
}
```

### 2. Frontend Hook Usage

```typescript
import { useBulkOrderCountdown } from '@/lib/hooks/useBulkOrderCountdown';

// Extract order IDs
const activeOrderIds = useMemo(() => {
    return activeOrders.map(order => order.id).filter(Boolean);
}, [activeOrders]);

// Use bulk countdown hook
const {
    countdowns,
    loading,
    error,
    lastSyncTime,
    getCountdownForOrder,
    refreshFromServer,
    getExpiredOrders,
    getActiveOrders
} = useBulkOrderCountdown(activeOrderIds, 10 * 60 * 1000); // 10 minutes
```

### 3. Component Integration

```typescript
// In your component
{activeOrders.map((order) => {
    const countdown = getCountdownForOrder(order.id);
    return (
        <ActiveStorageCard
            key={order.id}
            order={order}
            countdown={countdown}
            loading={loading && !countdown}
        />
    );
})}
```

## Hook Features

### Data Management
- **Automatic Sync**: Fetches fresh data from server every 10 minutes
- **Real-time Updates**: Client-side calculation updates every second
- **Error Handling**: Graceful error handling with retry capability
- **Loading States**: Proper loading indicators during sync

### Helper Functions
- `getCountdownForOrder(orderId)`: Get countdown for specific order
- `getAllCountdowns()`: Get all countdown data
- `getExpiredOrders()`: Get only expired orders
- `getActiveOrders()`: Get only active orders
- `refreshFromServer()`: Manual refresh trigger

### Performance Optimizations
- **Chunking**: Automatically splits large requests into 50-order chunks
- **Memoization**: Prevents unnecessary re-renders
- **Cleanup**: Proper interval cleanup on unmount

## UI Enhancements

### Sync Status Indicator
```typescript
{lastSyncTime && (
    <Text style={{ color: palette.primary, fontSize: 11 }}>
        Synced {Math.floor((new Date().getTime() - lastSyncTime.getTime()) / 60000)}m ago
    </Text>
)}
```

### Manual Refresh Button
```typescript
<TouchableOpacity onPress={refreshFromServer}>
    <Ionicons name="refresh" size={14} color={palette.primary} />
</TouchableOpacity>
```

### Error State Display
```typescript
{error && (
    <View style={{ backgroundColor: palette.errorSoft }}>
        <Text>Failed to sync: {error}</Text>
        <TouchableOpacity onPress={refreshFromServer}>
            <Text>Retry</Text>
        </TouchableOpacity>
    </View>
)}
```

## Data Flow

### 1. Initial Load
```
User opens home screen → Extract order IDs → Fetch bulk countdown → Display UI
```

### 2. Server Sync (Every 10 minutes)
```
Timer triggers → API call to /countdown/bulk → Update countdown data → UI reflects changes
```

### 3. Client Updates (Every 1 second)
```
Timer triggers → Calculate client-side countdown → Update UI in real-time
```

## Benefits

### Performance
- **Reduced API Calls**: Bulk requests instead of individual calls
- **Real-time UI**: Smooth countdown updates without constant server requests
- **Optimized Rendering**: Memoized components prevent unnecessary re-renders

### User Experience
- **Accurate Data**: Server-provided countdown ensures accuracy
- **Smooth Animations**: Client-side updates provide smooth countdown
- **Offline Tolerance**: Continues working between sync intervals
- **Visual Feedback**: Clear loading states and sync indicators

### Developer Experience
- **Easy Integration**: Simple hook interface
- **Error Handling**: Built-in error states and retry mechanisms
- **Debugging**: Comprehensive logging for troubleshooting
- **Flexibility**: Configurable sync intervals

## Configuration Options

```typescript
const {
    // ... other returns
} = useBulkOrderCountdown(
    orderIds,           // Array of order IDs
    10 * 60 * 1000,    // Server sync interval (10 minutes)
);
```

## Error Scenarios

### Network Errors
- Hook continues with last known data
- Error state displayed to user
- Manual retry available

### API Rate Limits
- Automatic chunking prevents hitting limits
- Exponential backoff for retries (can be added)

### Invalid Data
- Graceful fallback to local calculation
- Error logging for debugging

## Testing

### Unit Tests
- Test hook behavior with mock data
- Test error handling scenarios
- Test cleanup functionality

### Integration Tests
- Test with real API endpoints
- Test network failure scenarios
- Test large dataset performance

## Future Enhancements

### Possible Improvements
1. **Smart Sync**: Sync more frequently for near-expiry orders
2. **Push Notifications**: Real-time updates via WebSocket
3. **Offline Cache**: Persist data for offline usage
4. **Analytics**: Track sync performance and user engagement

## Troubleshooting

### Common Issues
1. **Hook not updating**: Check orderIds dependency array
2. **Memory leaks**: Verify interval cleanup in useEffect
3. **Stale data**: Check server sync interval configuration
4. **Performance issues**: Monitor API response times and chunk sizes

### Debug Logging
The hook provides comprehensive console logging:
- `📊 Bulk countdown data synced from server`
- `🔄 Syncing countdown data with server...`
- `❌ Failed to fetch bulk countdown`
- `🕒 Last countdown sync: [timestamp]`
