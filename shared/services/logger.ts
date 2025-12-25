// Logger structuré pour production
// Remplace console.log/error par logs traçables

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  userId?: string;
  restaurantId?: string;
  stack?: string;
}

class Logger {
  private isDevelopment: boolean;
  private restaurantId?: string;
  private userId?: string;

  constructor() {
    // Détection environnement
    this.isDevelopment =
      typeof process !== 'undefined' && process.env.NODE_ENV === 'development' ||
      typeof import.meta !== 'undefined' && import.meta.env?.DEV;
  }

  setContext(restaurantId?: string, userId?: string) {
    this.restaurantId = restaurantId;
    this.userId = userId;
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      restaurantId: this.restaurantId,
      userId: this.userId,
      stack: error?.stack
    };
  }

  private formatForConsole(entry: LogEntry): string {
    const parts = [
      `[${entry.level.toUpperCase()}]`,
      `[${entry.timestamp}]`,
      entry.restaurantId ? `[Restaurant:${entry.restaurantId}]` : '',
      entry.userId ? `[User:${entry.userId}]` : '',
      entry.message
    ].filter(Boolean);

    return parts.join(' ');
  }

  private async sendToRemote(entry: LogEntry) {
    // En production: envoyer vers service externe (Sentry, Datadog, etc.)
    if (this.isDevelopment) return;

    try {
      // Exemple: Sentry
      // if (window.Sentry) {
      //   window.Sentry.captureMessage(entry.message, {
      //     level: entry.level,
      //     extra: entry.context
      //   });
      // }

      // Exemple: Endpoint custom
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // });
    } catch (err) {
      // Éviter boucle infinie si logging échoue
      console.error('[LOGGER] Failed to send log:', err);
    }
  }

  debug(message: string, context?: Record<string, any>) {
    if (!this.isDevelopment) return; // Debug uniquement en dev

    const entry = this.createEntry('debug', message, context);
    console.debug(this.formatForConsole(entry), context || '');
  }

  info(message: string, context?: Record<string, any>) {
    const entry = this.createEntry('info', message, context);
    console.info(this.formatForConsole(entry), context || '');
    this.sendToRemote(entry);
  }

  warn(message: string, context?: Record<string, any>) {
    const entry = this.createEntry('warn', message, context);
    console.warn(this.formatForConsole(entry), context || '');
    this.sendToRemote(entry);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    const entry = this.createEntry('error', message, context, error);
    console.error(this.formatForConsole(entry), error || '', context || '');
    this.sendToRemote(entry);
  }

  critical(message: string, error?: Error, context?: Record<string, any>) {
    const entry = this.createEntry('critical', message, context, error);
    console.error('🚨 CRITICAL:', this.formatForConsole(entry), error || '', context || '');
    this.sendToRemote(entry);

    // En production: notifier équipe immédiatement
    if (!this.isDevelopment) {
      // Exemple: Webhook Slack, PagerDuty, etc.
    }
  }

  // Helper pour tracer actions utilisateur (audit trail)
  audit(action: string, entityType: string, entityId?: string, changes?: Record<string, any>) {
    const entry = this.createEntry('info', `AUDIT: ${action}`, {
      action,
      entityType,
      entityId,
      changes
    });

    console.log(this.formatForConsole(entry));
    this.sendToRemote(entry);

    // Envoyer aussi vers audit_logs Supabase si nécessaire
    // (intégration via API ou trigger)
  }
}

// Instance singleton
export const logger = new Logger();

// Helpers pour usage rapide
export const logDebug = (msg: string, ctx?: Record<string, any>) => logger.debug(msg, ctx);
export const logInfo = (msg: string, ctx?: Record<string, any>) => logger.info(msg, ctx);
export const logWarn = (msg: string, ctx?: Record<string, any>) => logger.warn(msg, ctx);
export const logError = (msg: string, err?: Error, ctx?: Record<string, any>) => logger.error(msg, err, ctx);
export const logCritical = (msg: string, err?: Error, ctx?: Record<string, any>) => logger.critical(msg, err, ctx);
export const logAudit = (action: string, type: string, id?: string, changes?: Record<string, any>) =>
  logger.audit(action, type, id, changes);
