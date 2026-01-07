/**
 * Service de Backup Automatique
 * 
 * Fonctionnalités:
 * - Export app_state vers Supabase Storage bucket 'backups'
 * - Format: {company_id}/{timestamp}.json
 * - Politique rétention 30 jours
 * - Fonction de restauration
 */

import { supabase } from './storage';
import type { AppState } from '../types';

export interface BackupMetadata {
  id: string;
  companyId: string;
  timestamp: string;
  size: number;
  path: string;
}

/**
 * Crée un backup de l'état complet d'un restaurant
 */
export const createBackup = async (
  companyId: string,
  state: AppState
): Promise<BackupMetadata | null> => {
  try {
    if (!supabase) {
      console.warn('[BACKUP] Supabase non configuré, backup ignoré');
      return null;
    }

    const timestamp = Date.now();
    const filename = `${timestamp}.json`;
    const path = `${companyId}/${filename}`;

    const backup = {
      companyId,
      timestamp: new Date().toISOString(),
      data: state,
      version: '1.0',
      _metadata: {
        createdAt: new Date().toISOString(),
        appVersion: '1.0.0'
      }
    };

    const backupJSON = JSON.stringify(backup, null, 2);
    const blob = new Blob([backupJSON], { type: 'application/json' });

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from('backups')
      .upload(path, blob, {
        contentType: 'application/json',
        upsert: false
      });

    if (error) {
      console.error('[BACKUP] Erreur upload:', error);
      return null;
    }

    console.info('[BACKUP] Backup créé avec succès', {
      companyId,
      path,
      size: backupJSON.length
    });

    return {
      id: data.path,
      companyId,
      timestamp: new Date().toISOString(),
      size: backupJSON.length,
      path: data.path
    };
  } catch (error) {
    console.error('[BACKUP] Erreur création backup:', error);
    return null;
  }
};

/**
 * Liste tous les backups d'un restaurant
 */
export const listBackups = async (
  companyId: string
): Promise<BackupMetadata[]> => {
  try {
    if (!supabase) {
      console.warn('[BACKUP] Supabase non configuré');
      return [];
    }

    const { data, error } = await supabase.storage
      .from('backups')
      .list(companyId, {
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('[BACKUP] Erreur liste backups:', error);
      return [];
    }

    return data.map(file => ({
      id: file.name,
      companyId,
      timestamp: file.created_at,
      size: file.metadata?.size || 0,
      path: `${companyId}/${file.name}`
    }));
  } catch (error) {
    console.error('[BACKUP] Erreur liste backups:', error);
    return [];
  }
};

/**
 * Restaure un backup spécifique
 */
export const restoreBackup = async (
  companyId: string,
  backupId: string
): Promise<AppState | null> => {
  try {
    if (!supabase) {
      console.warn('[BACKUP] Supabase non configuré');
      return null;
    }

    const path = `${companyId}/${backupId}`;

    const { data, error } = await supabase.storage
      .from('backups')
      .download(path);

    if (error) {
      console.error('[BACKUP] Erreur téléchargement backup:', error);
      return null;
    }

    const text = await data.text();
    const backup = JSON.parse(text);

    console.info('[BACKUP] Backup restauré avec succès', {
      companyId,
      backupId,
      timestamp: backup.timestamp
    });

    return backup.data;
  } catch (error) {
    console.error('[BACKUP] Erreur restauration backup:', error);
    return null;
  }
};

/**
 * Supprime les backups de plus de 30 jours
 */
export const cleanOldBackups = async (
  companyId: string,
  retentionDays: number = 30
): Promise<number> => {
  try {
    if (!supabase) {
      console.warn('[BACKUP] Supabase non configuré');
      return 0;
    }

    const backups = await listBackups(companyId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let deletedCount = 0;

    for (const backup of backups) {
      const backupDate = new Date(backup.timestamp);
      
      if (backupDate < cutoffDate) {
        const { error } = await supabase.storage
          .from('backups')
          .remove([backup.path]);

        if (!error) {
          deletedCount++;
          console.info('[BACKUP] Backup supprimé (ancien)', {
            path: backup.path,
            age: Math.floor((Date.now() - backupDate.getTime()) / (1000 * 60 * 60 * 24))
          });
        }
      }
    }

    console.info('[BACKUP] Nettoyage terminé', {
      companyId,
      deletedCount,
      retentionDays
    });

    return deletedCount;
  } catch (error) {
    console.error('[BACKUP] Erreur nettoyage backups:', error);
    return 0;
  }
};

/**
 * Backup automatique quotidien (à appeler via cron/scheduler)
 */
export const scheduledBackup = async (
  companyId: string,
  state: AppState
): Promise<void> => {
  console.info('[BACKUP] Démarrage backup automatique', { companyId });

  // 1. Créer backup
  const backup = await createBackup(companyId, state);

  if (!backup) {
    console.error('[BACKUP] Échec création backup automatique');
    return;
  }

  // 2. Nettoyer anciens backups (>30 jours)
  const deletedCount = await cleanOldBackups(companyId, 30);

  console.info('[BACKUP] Backup automatique terminé', {
    companyId,
    backupSize: backup.size,
    deletedOldBackups: deletedCount
  });
};

/**
 * Vérifie l'intégrité d'un backup
 */
export const verifyBackup = async (
  companyId: string,
  backupId: string
): Promise<{ valid: boolean; errors: string[] }> => {
  try {
    const state = await restoreBackup(companyId, backupId);

    if (!state) {
      return { valid: false, errors: ['Impossible de charger le backup'] };
    }

    const errors: string[] = [];

    // Vérifications structure
    if (!state.users || !Array.isArray(state.users)) {
      errors.push('Structure users invalide');
    }

    if (!state.ingredients || !Array.isArray(state.ingredients)) {
      errors.push('Structure ingredients invalide');
    }

    if (!state.products || !Array.isArray(state.products)) {
      errors.push('Structure products invalide');
    }

    if (!state.orders || !Array.isArray(state.orders)) {
      errors.push('Structure orders invalide');
    }

    if (!state._lastUpdatedAt || typeof state._lastUpdatedAt !== 'number') {
      errors.push('Timestamp invalide');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Erreur vérification: ${error}`]
    };
  }
};
