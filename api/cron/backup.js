/**
 * Vercel Cron Job - Automated Daily Backup
 * 
 * Schedule: Daily at 3:00 AM UTC
 * Retention: 30 days (handled by cleanOldBackups)
 * 
 * This endpoint is called by Vercel Cron to automatically backup
 * all company data to Supabase Storage.
 */
export default async function handler(req, res) {
  // Verify this is a cron request (security check)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Dynamic import to avoid build issues
  const { createClient } = await import('@supabase/supabase-js');

  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    // Get all companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name');

    if (companiesError) {
      console.error('[CRON BACKUP] Error fetching companies:', companiesError);
      return res.status(500).json({ 
        error: 'Failed to fetch companies',
        details: companiesError.message 
      });
    }

    if (!companies || companies.length === 0) {
      console.log('[CRON BACKUP] No companies found');
      return res.status(200).json({ 
        message: 'No companies to backup',
        backups: 0 
      });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Create backup for each company
    for (const company of companies) {
      try {
        console.log(`[CRON BACKUP] Starting backup for company: ${company.name} (${company.id})`);

        // Fetch all app_state data for this company
        // Note: app_state currently doesn't have company_id, so we backup all data
        const { data: appState, error: appStateError } = await supabase
          .from('app_state')
          .select('*');

        if (appStateError) {
          throw new Error(`Failed to fetch app_state: ${appStateError.message}`);
        }

        // Create backup object
        const backupData = {
          company_id: company.id,
          company_name: company.name,
          timestamp: new Date().toISOString(),
          data: appState || []
        };

        // Generate backup filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${company.id}-${timestamp}.json`;
        const path = `${company.id}/${filename}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('backups')
          .upload(path, JSON.stringify(backupData, null, 2), {
            contentType: 'application/json',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Failed to upload backup: ${uploadError.message}`);
        }

        console.log(`[CRON BACKUP] ✅ Backup created: ${path}`);
        successCount++;
        results.push({
          company_id: company.id,
          company_name: company.name,
          status: 'success',
          path
        });

        // Clean old backups (older than 30 days)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);

        const { data: oldBackups, error: listError } = await supabase.storage
          .from('backups')
          .list(company.id);

        if (!listError && oldBackups) {
          for (const backup of oldBackups) {
            const backupDate = new Date(backup.created_at);
            if (backupDate < cutoffDate) {
              const { error: deleteError } = await supabase.storage
                .from('backups')
                .remove([`${company.id}/${backup.name}`]);

              if (!deleteError) {
                console.log(`[CRON BACKUP] 🗑️  Deleted old backup: ${backup.name}`);
              }
            }
          }
        }

      } catch (error: any) {
        console.error(`[CRON BACKUP] ❌ Error backing up company ${company.name}:`, error);
        errorCount++;
        results.push({
          company_id: company.id,
          company_name: company.name,
          status: 'error',
          error: error.message
        });
      }
    }

    // Return summary
    return res.status(200).json({
      message: 'Backup cron job completed',
      timestamp: new Date().toISOString(),
      total_companies: companies.length,
      successful_backups: successCount,
      failed_backups: errorCount,
      results
    });

  } catch (error: any) {
    console.error('[CRON BACKUP] Fatal error:', error);
    return res.status(500).json({
      error: 'Backup cron job failed',
      message: error.message
    });
  }
}
