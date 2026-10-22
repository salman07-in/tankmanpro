/**
 * TankmanPro — Safe Non-Secret Development Configuration
 *
 * Rules:
 * 1. Never hardcode fake credentials, API secrets, admin UIDs, or production URLs.
 * 2. Use safe development defaults ONLY for non-secret UI settings.
 * 3. Surface honest setup status when Firebase Auth, Firestore, Admin Bootstrap,
 *    or Razorpay payments are not configured yet.
 */

export interface IntegrationStatus {
  firebaseAuthConfigured: boolean;
  firestoreConfigured: boolean;
  adminBootstrapConfigured: boolean;
  razorpayConfigured: boolean;
  customDomainsConfigured: boolean;
}

export const DEV_SAFE_CONFIG = {
  appName: 'TankmanPro',
  currency: 'INR' as const,
  defaultPinCode: '110001',
  routes: {
    home: '/',
    services: '/services',
    booking: '/booking',
    adminLogin: '/admin/login',
    vendorLogin: '/vendor/login',
  },
};

/**
 * Evaluates client-visible integration readiness without any hardcoded secrets or fake keys.
 */
export function getClientIntegrationStatus(): IntegrationStatus {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
  return {
    firebaseAuthConfigured: Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID),
    firestoreConfigured: Boolean(env.VITE_FIREBASE_PROJECT_ID),
    adminBootstrapConfigured: false, // Verified server-side only via /api/admin/session
    razorpayConfigured: false, // Verified server-side only via /api/config/status
    customDomainsConfigured: Boolean(
      env.VITE_CUSTOMER_HOSTNAME && env.VITE_ADMIN_HOSTNAME && env.VITE_VENDOR_HOSTNAME
    ),
  };
}
