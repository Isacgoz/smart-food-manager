/**
 * Service de Monitoring Production
 * 
 * Fonctionnalités:
 * - Intégration Sentry (erreurs + performance)
 * - Web Vitals tracking (LCP, FID, CLS, FCP, TTFB)
 * - Alertes business critiques
 * - Métriques personnalisées
 */

import type { User, Ingredient, Order } from '../types';

// Types pour éviter dépendance Sentry en dev
interface SentryConfig {
  dsn?: string;
  environment: string;
  tracesSampleRate: number;
  enabled: boolean;
}

interface ErrorContext {
  user?: { id: string; email: string; role: string };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

interface MetricData {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
}

// Configuration Sentry
const sentryConfig: SentryConfig = {
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV || 'development',
  tracesSampleRate: import.meta.env.VITE_APP_ENV === 'production' ? 0.1 : 1.0,
  enabled: import.meta.env.VITE_APP_ENV === 'production'
};

/**
 * Initialise Sentry (à appeler au démarrage app)
 */
export const initMonitoring = async (): Promise<void> => {
  if (!sentryConfig.enabled || !sentryConfig.dsn) {
    console.info('[MONITORING] Désactivé en développement');
    return;
  }

  try {
    // Import dynamique Sentry (évite bundle en dev)
    const Sentry = await import('@sentry/react');

    Sentry.init({
      dsn: sentryConfig.dsn,
      environment: sentryConfig.environment,
      tracesSampleRate: sentryConfig.tracesSampleRate,
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true
        })
      ],
      // Capture 10% sessions en production
      replaysSessionSampleRate: 0.1,
      // Capture 100% sessions avec erreurs
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event, hint) {
        // Filtrer erreurs non critiques
        if (event.exception) {
          const error = hint.originalException as Error;
          if (error?.message?.includes('ResizeObserver')) {
            return null; // Ignorer erreurs ResizeObserver
          }
        }
        return event;
      }
    });

    console.info('[MONITORING] Sentry initialisé', {
      environment: sentryConfig.environment,
      tracesSampleRate: sentryConfig.tracesSampleRate
    });
  } catch (error) {
    console.error('[MONITORING] Erreur init Sentry:', error);
  }
};

/**
 * Capture erreur business logic
 */
export const captureBusinessError = (
  error: Error,
  context: ErrorContext = {}
): void => {
  console.error('[BUSINESS_ERROR]', error, context);

  if (!sentryConfig.enabled) return;

  import('@sentry/react').then(Sentry => {
    Sentry.captureException(error, {
      tags: {
        type: 'business_logic',
        ...context.tags
      },
      extra: context.extra,
      user: context.user
    });
  });
};

/**
 * Capture erreur technique
 */
export const captureTechnicalError = (
  error: Error,
  context: ErrorContext = {}
): void => {
  console.error('[TECHNICAL_ERROR]', error, context);

  if (!sentryConfig.enabled) return;

  import('@sentry/react').then(Sentry => {
    Sentry.captureException(error, {
      tags: {
        type: 'technical',
        ...context.tags
      },
      extra: context.extra
    });
  });
};

/**
 * Track métrique personnalisée
 */
export const trackMetric = (metric: MetricData): void => {
  console.info('[METRIC]', metric);

  if (!sentryConfig.enabled) return;

  import('@sentry/react').then(Sentry => {
    Sentry.metrics.distribution(metric.name, metric.value, {
      unit: metric.unit || 'none',
      tags: metric.tags
    });
  });
};

/**
 * Web Vitals tracking
 */
export const initWebVitals = async (): Promise<void> => {
  try {
    const { onCLS, onFID, onFCP, onLCP, onTTFB } = await import('web-vitals');

    const sendToAnalytics = (metric: any) => {
      console.info('[WEB_VITAL]', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating
      });

      trackMetric({
        name: `web_vital_${metric.name.toLowerCase()}`,
        value: metric.value,
        unit: 'millisecond',
        tags: {
          rating: metric.rating
        }
      });
    };

    onCLS(sendToAnalytics);
    onFID(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);

    console.info('[MONITORING] Web Vitals tracking activé');
  } catch (error) {
    console.error('[MONITORING] Erreur init Web Vitals:', error);
  }
};

/**
 * Alertes business critiques
 */
export const businessAlerts = {
  /**
   * Alerte stock négatif
   */
  stockNegative: (ingredient: Ingredient, quantity: number, user: User) => {
    const message = `Stock négatif: ${ingredient.name} (${quantity}${ingredient.unit})`;
    
    console.error('[ALERT_CRITICAL]', message, {
      ingredientId: ingredient.id,
      quantity,
      userId: user.id
    });

    captureBusinessError(new Error(message), {
      tags: {
        alert_type: 'stock_negative',
        severity: 'critical'
      },
      extra: {
        ingredient: {
          id: ingredient.id,
          name: ingredient.name,
          stock: ingredient.stock,
          unit: ingredient.unit
        },
        quantity,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      }
    });

    // TODO: Envoyer email/SMS au gérant
  },

  /**
   * Alerte écart caisse important
   */
  cashDiscrepancy: (
    expected: number,
    actual: number,
    diff: number,
    user: User
  ) => {
    if (Math.abs(diff) < 50) return; // Ignorer écarts <50€

    const message = `Écart caisse important: ${diff.toFixed(2)}€ (théo: ${expected.toFixed(2)}€, réel: ${actual.toFixed(2)}€)`;
    
    console.error('[ALERT_HIGH]', message, {
      expected,
      actual,
      diff,
      userId: user.id
    });

    captureBusinessError(new Error(message), {
      tags: {
        alert_type: 'cash_discrepancy',
        severity: 'high'
      },
      extra: {
        expected,
        actual,
        diff,
        percentage: ((diff / expected) * 100).toFixed(2),
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      }
    });

    // TODO: Envoyer notification manager
  },

  /**
   * Alerte échec sync DB
   */
  dbSyncFailed: (error: Error, companyId: string, retryCount: number) => {
    const message = `Sync DB échouée: ${error.message}`;
    
    console.error('[ALERT_CRITICAL]', message, {
      companyId,
      retryCount,
      error: error.stack
    });

    captureTechnicalError(error, {
      tags: {
        alert_type: 'db_sync_failed',
        severity: 'critical',
        retry_count: retryCount.toString()
      },
      extra: {
        companyId,
        retryCount
      }
    });

    // TODO: Envoyer alerte équipe technique
  },

  /**
   * Alerte commande sans stock suffisant
   */
  insufficientStock: (
    order: Order,
    missingIngredients: Array<{ name: string; required: number; available: number }>
  ) => {
    const message = `Commande bloquée: stock insuffisant pour ${missingIngredients.length} ingrédient(s)`;
    
    console.warn('[ALERT_MEDIUM]', message, {
      orderId: order.id,
      missingIngredients
    });

    captureBusinessError(new Error(message), {
      tags: {
        alert_type: 'insufficient_stock',
        severity: 'medium'
      },
      extra: {
        order: {
          id: order.id,
          number: order.number,
          total: order.total
        },
        missingIngredients
      }
    });
  },

  /**
   * Alerte marge produit trop faible
   */
  lowMargin: (
    productName: string,
    price: number,
    cost: number,
    marginRate: number
  ) => {
    if (marginRate > 30) return; // Ignorer si marge >30%

    const message = `Marge faible: ${productName} (${marginRate.toFixed(1)}%)`;
    
    console.warn('[ALERT_LOW]', message, {
      productName,
      price,
      cost,
      marginRate
    });

    captureBusinessError(new Error(message), {
      tags: {
        alert_type: 'low_margin',
        severity: 'low'
      },
      extra: {
        productName,
        price,
        cost,
        margin: price - cost,
        marginRate
      }
    });
  }
};

/**
 * Track événement utilisateur
 */
export const trackEvent = (
  eventName: string,
  properties: Record<string, any> = {}
): void => {
  console.info('[EVENT]', eventName, properties);

  if (!sentryConfig.enabled) return;

  import('@sentry/react').then(Sentry => {
    Sentry.addBreadcrumb({
      category: 'user_action',
      message: eventName,
      level: 'info',
      data: properties
    });
  });
};

/**
 * Set contexte utilisateur
 */
export const setUserContext = (user: User | null): void => {
  if (!sentryConfig.enabled) return;

  import('@sentry/react').then(Sentry => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.name,
        role: user.role
      });
    } else {
      Sentry.setUser(null);
    }
  });
};
