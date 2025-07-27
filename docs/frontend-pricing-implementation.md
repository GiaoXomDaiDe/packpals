/**
 * Frontend Pricing System Implementation Guide
 * 
 * This document outlines how to implement the pricing calculation system
 * on the frontend to complement the verified backend logic.
 */

## 1. API Integration ✅
- **API Endpoint**: GET /Order/{id}/calculate-fee
- **Method Added**: `calculateFinalAmount(orderId: string)` in `order.api.ts`
- **React Query Hook**: `useCalculateFinalAmount` in `useOrderQueries.ts`
- **Auto-refresh**: Every 30 seconds for real-time pricing updates

## 2. Backend Pricing Logic ✅ Verified
- **Base Amount**: Size.Price × EstimatedDays
- **Overtime Calculation**: Current time - StartKeepTime - EstimatedDays - 1 hour grace period
- **Penalty Fee**: 500 VND per hour for overtime
- **Final Amount**: BaseAmount + OvertimeFees

## 3. Frontend Implementation Approaches

### Approach 1: Real-time Pricing Component
```tsx
// Usage in order collection/pickup screens
<OrderPricingCard 
  orderId={orderId}
  baseAmount={order.totalAmount}
  estimatedDays={order.estimatedDays}
  onProceedPayment={(finalAmount) => handlePayment(finalAmount)}
/>
```

**Features:**
- Live pricing updates every 30 seconds
- Breakdown of base amount vs overtime fees
- Integrated payment button
- Error handling with retry functionality

### Approach 2: Pricing Hook Integration
```tsx
const PricingScreen = ({ orderId }) => {
  const { data: pricingData, isLoading } = useCalculateFinalAmount(orderId);
  
  // Use pricingData.data.finalAmount for payment flow
  const handlePayment = () => {
    paymentAPI.createPayment({
      orderId,
      amount: pricingData.data.finalAmount
    });
  };
};
```

### Approach 3: Payment Flow Integration
```tsx
// In PayOSPaymentModal.tsx
const PaymentModal = ({ orderId, visible, onClose }) => {
  const { data: finalAmountData } = useCalculateFinalAmount(orderId, {
    refetchInterval: 30000,
    enabled: visible
  });

  useEffect(() => {
    if (finalAmountData?.data?.finalAmount) {
      // Update payment amount in real-time
      setPaymentAmount(finalAmountData.data.finalAmount);
    }
  }, [finalAmountData]);
};
```

## 4. Usage Scenarios

### Scenario 1: Order Collection Page
- Display real-time final amount
- Show overtime breakdown if applicable  
- Allow payment with updated amount

### Scenario 2: Keeper Dashboard
- Show pending pickup orders with calculated fees
- Real-time updates for overtime tracking
- Payment collection interface

### Scenario 3: Notification System
- Alert when overtime fees start accruing
- Daily/hourly updates on accumulated fees
- Payment reminders with current amount

## 5. Technical Implementation Details

### API Response Structure
```typescript
interface OrderFinalAmountResponse {
  data: {
    finalAmount: number
  }
  message: string
  statusCode: number
  code: string
}
```

### Query Configuration
```typescript
const pricingQuery = useCalculateFinalAmount(orderId, {
  enabled: !!orderId && orderStatus === 'IN_STORAGE',
  refetchInterval: 30000, // 30 seconds
  refetchIntervalInBackground: false,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Error Handling
- Network errors: Show retry button
- Invalid order: Fallback to original amount  
- Loading states: Show skeleton/spinner
- Real-time updates: Visual indicators

## 6. Next Steps

1. **Complete Component Integration** ✅ 
   - OrderPricingCard component created
   - Type definitions added
   - Hook implementation completed

2. **Screen Integration**
   - Add to order collection screens
   - Integrate with payment flow
   - Update notification system

3. **Testing**
   - Test overtime calculation accuracy
   - Verify real-time updates
   - Test error scenarios

4. **Optimization**
   - Conditional fetching based on order status
   - Background sync optimization
   - Cache invalidation strategies

## 7. File Changes Made

### ✅ API Layer
- `lib/api/order.api.ts`: Added `calculateFinalAmount` method
- `lib/types/type.ts`: Added `OrderFinalAmountResponse` type

### ✅ Query Layer  
- `lib/query/client.ts`: Added `orderFinalAmount` query key
- `lib/query/hooks/useOrderQueries.ts`: Added `useCalculateFinalAmount` hook

### ✅ UI Components
- `components/OrderPricingCard.tsx`: Real-time pricing display component

### 🔄 Pending Integration
- Order collection screens
- Payment modal updates
- Notification system
- Keeper dashboard

## 8. Usage Examples

### Basic Usage
```tsx
import { useCalculateFinalAmount } from '@/lib/query/hooks/useOrderQueries';

const OrderScreen = ({ orderId }) => {
  const { data, isLoading } = useCalculateFinalAmount(orderId);
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <Text>Final Amount: {data?.data?.finalAmount} VND</Text>
  );
};
```

### Advanced Usage with Real-time Updates
```tsx
const AdvancedPricingScreen = ({ orderId }) => {
  const { 
    data: pricingData, 
    isLoading, 
    error,
    refetch 
  } = useCalculateFinalAmount(orderId, {
    refetchInterval: 30000,
    onSuccess: (data) => {
      // Trigger notifications if amount changed significantly
      checkForPriceChanges(data.data.finalAmount);
    }
  });

  return <OrderPricingCard orderId={orderId} />;
};
```

The frontend pricing system is now ready for integration with real-time capabilities and proper error handling!
