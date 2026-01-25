import { supabase } from './storage';

export type AuditEventType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_SUCCESS'
  | 'EMAIL_VERIFICATION'
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_LOCKED'
  | 'DATA_EXPORT'
  | 'SETTINGS_CHANGED'
  | 'USER_CREATED'
  | 'USER_DELETED';

interface AuditLogEntry {
  company_id: string;
  user_id?: string;
  auth_user_id?: string;
  event_type: AuditEventType;
  event_data?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Enregistre un événement dans l'audit log
 */
export const logAuditEvent = async (entry: AuditLogEntry): Promise<void> => {
  if (!supabase) {
    console.warn('[AUDIT] Supabase not configured, logging locally');
    console.log('[AUDIT]', entry);
    return;
  }

  try {
    const { error } = await supabase
      .from('audit_log')
      .insert({
        ...entry,
        ip_address: entry.ip_address || await getClientIP(),
        user_agent: entry.user_agent || navigator.userAgent
      });

    if (error) {
      console.error('[AUDIT] Failed to log event:', error);
    }
  } catch (err) {
    console.error('[AUDIT] Exception:', err);
  }
};

/**
 * Récupère l'IP client (best effort)
 */
const getClientIP = async (): Promise<string | undefined> => {
  try {
    // En production, utiliser un service comme ipify ou CloudFlare
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(2000)
    });
    const data = await response.json();
    return data.ip;
  } catch {
    return undefined;
  }
};

/**
 * Récupère les logs d'audit pour une company
 */
export const getAuditLogs = async (
  companyId: string,
  limit: number = 100,
  eventType?: AuditEventType
): Promise<any[]> => {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('audit_log')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[AUDIT] Failed to fetch logs:', err);
    return [];
  }
};

/**
 * Compte les tentatives de login échouées récentes
 */
export const getFailedLoginAttempts = async (
  companyId: string,
  email: string,
  sinceMinutes: number = 30
): Promise<number> => {
  if (!supabase) return 0;

  try {
    const since = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('event_type', 'LOGIN_FAILED')
      .gte('created_at', since)
      .contains('event_data', { email });

    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('[AUDIT] Failed to count failed logins:', err);
    return 0;
  }
};
