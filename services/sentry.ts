/**
 * Sentry Monitoring Configuration
 * 
 * Captures:
 * - Runtime errors (unhandled exceptions)
 * - Business errors (stock issues, cash discrepancies)
 * - Performance metrics (10% sample rate)
 * - Session replays (10% sessions, 100% with errors)
 * - Web Vitals (LCP, FID, CLS, FCP, TTFB)
 */

import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry monitoring
 * Only active in production if VITE_SENTRY_DSN is configured
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_APP_ENV || 'development';
  
  // Skip initialization in development or if DSN not configured
  if (environment === 'development' || !dsn) {
    console.log('[Sentry] Monitoring disabled in development mode');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    
    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Session Replay configuration
        maskAllText: true, // Privacy: mask all text content
        blockAllMedia: true, // Privacy: block images/videos
      }),
    ],
    
    // Performance monitoring sample rate (10% of transactions)
    tracesSampleRate: 0.1,
    
    // Session Replay sample rates
    replaysSessionSampleRate: 0.1, // 10% of normal sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Release tracking
    release: `smart-food-manager@${import.meta.env.VITE_APP_VERSION || 'unknown'}`,
    
    // Filter out known non-critical errors
    beforeSend(event, hint) {
      const error = hint.originalException;
      
      // Ignore network errors (handled by app)
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message).toLowerCase();
        if (message.includes('network') || message.includes('fetch')) {
          return null;
        }
      }
      
      return event;
    },
  });

  console.log('[Sentry] Monitoring initialized for', environment);
}

/**
 * Capture a business error (stock issues, cash discrepancies, etc.)
 */
export function captureBusinessError(
  message: string,
  context: Record<string, any> = {},
  level: 'warning' | 'error' = 'error'
) {
  if (import.meta.env.VITE_APP_ENV === 'development') {
    console.error('[Business Error]', message, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    tags: {
      type: 'business_error',
    },
    extra: context,
  });
}

/**
 * Capture an exception with context
 */
export function captureException(
  error: Error,
  context: Record<string, any> = {}
) {
  if (import.meta.env.VITE_APP_ENV === 'development') {
    console.error('[Exception]', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  restaurantName?: string;
  plan?: string;
}) {
  if (import.meta.env.VITE_APP_ENV === 'development') {
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.restaurantName,
    plan: user.plan,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  if (import.meta.env.VITE_APP_ENV === 'development') {
    return;
  }

  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  if (import.meta.env.VITE_APP_ENV === 'development') {
    console.log('[Breadcrumb]', category, message, data);
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}
