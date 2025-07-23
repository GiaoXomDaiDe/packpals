export default function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  console.log('🔗 Native intent received:', { path, initial });

  try {
    // Handle PayOS payment deeplinks
    if (path.includes('payment/success')) {
      const url = new URL(`packpals://${path}`);
      const orderId = url.searchParams.get('orderId');
      const status = url.searchParams.get('status');
      const orderCode = url.searchParams.get('orderCode');

      console.log('✅ Payment success deeplink parsed:', { orderId, status, orderCode });

      // Redirect to payment result screen with parameters
      return `/(root)/payment-result?orderId=${orderId}&status=success&orderCode=${orderCode}`;
    }

    if (path.includes('payment/cancel')) {
      const url = new URL(`packpals://${path}`);
      const orderId = url.searchParams.get('orderId');
      const status = url.searchParams.get('status');
      const orderCode = url.searchParams.get('orderCode');

      console.log('❌ Payment cancel deeplink parsed:', { orderId, status, orderCode });

      // Redirect to payment result screen with cancelled status
      return `/(root)/payment-result?orderId=${orderId}&status=cancelled&orderCode=${orderCode}`;
    }

    // Handle direct payment-result deeplinks
    if (path.includes('payment-result')) {
      console.log('📊 Direct payment result deeplink');
      return path.startsWith('/') ? path : `/${path}`;
    }

    // Default: return the original path
    console.log('🔄 Using original path:', path);
    return path;

  } catch (error) {
    console.error('❌ Error processing native intent:', error);
    // Fallback to home page if URL parsing fails
    return '/(root)/(tabs)/home';
  }
}