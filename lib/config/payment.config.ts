/**
 * Development Configuration for PayOS Payment Flow
 * Simplified approach using Expo Auth Session (no ngrok needed for deep linking)
 */

export const DEVELOPMENT_CONFIG = {
  // Ngrok configuration (only needed for webhook, not deep linking)
  ngrok: {
    baseUrl: 'https://a169fb8b36f3.ngrok-free.app',
    webhookEndpoint: '/api/payment/OS/webhook',
    get webhookUrl() {
      return `${this.baseUrl}${this.webhookEndpoint}`
    }
  },

  // Payment flow uses Expo Auth Session - no manual URL configuration needed
  expoAuthSession: {
    scheme: 'packpals',
    path: 'payment-result',
    description: 'PayOS payment redirect handled automatically by Expo Auth Session'
  },

  // Production configuration
  production: {
    scheme: 'packpals',
    baseUrl: 'packpals://payment-result',
    webhookUrl: 'https://your-production-api.com/api/payment/OS/webhook'
  }
}

/**
 * Environment-aware URL generator
 * Note: With Expo Auth Session, URLs are generated automatically
 */
export const getEnvironmentUrls = (orderId: string, orderCode?: string) => {
  return {
    // URLs are now handled automatically by Expo Auth Session
    webhookUrl: DEVELOPMENT_CONFIG.ngrok.webhookUrl,
    scheme: DEVELOPMENT_CONFIG.expoAuthSession.scheme,
    path: DEVELOPMENT_CONFIG.expoAuthSession.path
  }
}

/**
 * Log current development configuration
 */
export const logPaymentConfig = () => {
  console.log('💳 Payment Development Configuration:')
  console.log('📡 Ngrok Webhook URL:', DEVELOPMENT_CONFIG.ngrok.webhookUrl)
  console.log('📱 App Scheme:', DEVELOPMENT_CONFIG.expoAuthSession.scheme)
  console.log('🔗 Redirect Path:', DEVELOPMENT_CONFIG.expoAuthSession.path)
  console.log('ℹ️  Deep linking handled automatically by Expo Auth Session')
}

export default DEVELOPMENT_CONFIG
