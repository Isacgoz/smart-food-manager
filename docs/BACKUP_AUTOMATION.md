# Backup Automation - Documentation

## Vue d'ensemble

Le système de backup automatique utilise **Vercel Cron Jobs** pour créer des sauvegardes quotidiennes de toutes les données des entreprises dans Supabase Storage.

## Architecture

### Composants

1. **Service de backup** (`shared/services/backup.ts`)
   - `createBackup()`: Crée une sauvegarde manuelle
   - `listBackups()`: Liste les sauvegardes disponibles
   - `restoreBackup()`: Restaure une sauvegarde
   - `cleanOldBackups()`: Supprime les sauvegardes > 30 jours

2. **Endpoint Cron** (`api/cron/backup.ts`)
   - Appelé automatiquement par Vercel
   - Sauvegarde toutes les entreprises
   - Nettoie les anciennes sauvegardes
   - Logs détaillés pour monitoring

3. **Configuration Vercel** (`vercel.json`)
   - Cron schedule: `0 3 * * *` (3h00 UTC tous les jours)
   - Path: `/api/cron/backup`

## Configuration

### 1. Générer le secret de sécurité

```bash
# Générer un secret aléatoire
openssl rand -base64 32
```

### 2. Configurer Vercel

1. Aller sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet `smart-food-manager`
3. Settings → Environment Variables
4. Ajouter la variable:
   - **Name:** `CRON_SECRET`
   - **Value:** Le secret généré à l'étape 1
   - **Environment:** Production

5. Ajouter les variables Supabase (si pas déjà fait):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### 3. Déployer

```bash
# Commit et push
git add .
git commit -m "feat(backup): Add automated daily backup cron job"
git push origin main

# Vercel déploiera automatiquement
```

## Fonctionnement

### Schedule

- **Fréquence:** Quotidienne
- **Heure:** 3h00 UTC (4h00 CET / 5h00 CEST)
- **Format cron:** `0 3 * * *`

### Processus de backup

1. **Authentification**
   - Vérifie le header `Authorization: Bearer ${CRON_SECRET}`
   - Rejette les requêtes non autorisées (401)

2. **Récupération des entreprises**
   - Query Supabase: `SELECT id, name FROM companies`
   - Si aucune entreprise: retourne succès (0 backups)

3. **Backup par entreprise**
   - Récupère les données `app_state`
   - Crée un objet JSON avec:
     - `company_id`
     - `company_name`
     - `timestamp`
     - `data` (app_state)
   - Upload vers `backups/{company_id}/backup-{company_id}-{timestamp}.json`

4. **Nettoyage automatique**
   - Liste les backups de l'entreprise
   - Supprime ceux > 30 jours
   - Logs chaque suppression

5. **Rapport**
   - Retourne un JSON avec:
     - Nombre total d'entreprises
     - Backups réussis
     - Backups échoués
     - Détails par entreprise

### Exemple de réponse

```json
{
  "message": "Backup cron job completed",
  "timestamp": "2026-01-08T03:00:00.000Z",
  "total_companies": 3,
  "successful_backups": 3,
  "failed_backups": 0,
  "results": [
    {
      "company_id": "11111111-1111-1111-1111-111111111111",
      "company_name": "Restaurant La Bonne Bouffe",
      "status": "success",
      "path": "11111111-1111-1111-1111-111111111111/backup-11111111-1111-1111-1111-111111111111-2026-01-08T03-00-00-000Z.json"
    }
  ]
}
```

## Monitoring

### Logs Vercel

1. Aller sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet
3. Deployments → Cliquer sur le dernier déploiement
4. Functions → `/api/cron/backup`
5. Voir les logs d'exécution

### Logs dans le code

Le cron job log les événements suivants:

```
[CRON BACKUP] Starting backup for company: {name} ({id})
[CRON BACKUP] ✅ Backup created: {path}
[CRON BACKUP] 🗑️  Deleted old backup: {name}
[CRON BACKUP] ❌ Error backing up company {name}: {error}
[CRON BACKUP] Fatal error: {error}
```

### Alertes recommandées

Configurer des alertes Sentry/monitoring pour:
- Échecs de backup (status 500)
- Taux d'échec > 10%
- Durée d'exécution > 5 minutes

## Sécurité

### Protection de l'endpoint

1. **Secret partagé**
   - Vercel envoie automatiquement le header `Authorization: Bearer ${CRON_SECRET}`
   - L'endpoint vérifie ce secret
   - Rejette toute requête sans le bon secret

2. **Pas d'exposition publique**
   - L'endpoint n'est pas accessible publiquement
   - Seul Vercel peut l'appeler avec le bon secret

3. **Permissions Supabase**
   - Utilise `VITE_SUPABASE_ANON_KEY` (lecture seule)
   - RLS policies appliquées
   - Pas de clé service (pas nécessaire)

## Restauration manuelle

### Via l'interface

```typescript
import { restoreBackup } from '@/shared/services/backup';

// Lister les backups
const backups = await listBackups(companyId);

// Restaurer un backup
await restoreBackup(companyId, backups[0].path);
```

### Via Supabase Storage

1. Aller sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Storage → backups
3. Naviguer vers `{company_id}/`
4. Télécharger le fichier JSON
5. Restaurer manuellement via SQL ou interface

## Tests

### Test local

```bash
# Installer les dépendances Vercel
npm install -g vercel

# Tester l'endpoint localement
curl -X GET http://localhost:3000/api/cron/backup \
  -H "Authorization: Bearer your-test-secret"
```

### Test en production

```bash
# Appeler manuellement le cron (avec le vrai secret)
curl -X GET https://smart-food-manager-alpha.vercel.app/api/cron/backup \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

⚠️ **Attention:** Ne pas abuser des tests manuels pour éviter de créer trop de backups.

## Limitations

### Vercel Free Tier

- **Durée max:** 10 secondes par exécution
- **Fréquence:** 1 cron job gratuit
- **Logs:** Conservés 24h

### Supabase Free Tier (NANO)

- **Storage:** 1 GB total
- **Bandwidth:** 2 GB/mois
- **Pas de backups automatiques** (nécessite Pro)

### Recommandations

- Surveiller l'utilisation du storage
- Ajuster la rétention si nécessaire (actuellement 30 jours)
- Considérer compression des backups si volume important

## Dépannage

### Le cron ne s'exécute pas

1. Vérifier que `vercel.json` contient la config cron
2. Vérifier que le déploiement est réussi
3. Vérifier les logs Vercel
4. Vérifier que `CRON_SECRET` est configuré

### Erreur 401 Unauthorized

- Le `CRON_SECRET` n'est pas configuré ou incorrect
- Vérifier dans Vercel → Settings → Environment Variables

### Erreur 500 lors du backup

- Vérifier les logs Vercel pour le détail
- Vérifier que Supabase est accessible
- Vérifier que les variables `VITE_SUPABASE_*` sont configurées
- Vérifier les permissions RLS

### Backups non créés

- Vérifier que le bucket `backups` existe
- Vérifier les policies du bucket (INSERT, SELECT)
- Vérifier les logs pour les erreurs

## Évolutions futures

### Court terme

- [ ] Ajouter compression gzip des backups
- [ ] Notifier par email en cas d'échec
- [ ] Dashboard de monitoring des backups

### Moyen terme

- [ ] Backup incrémental (seulement les changements)
- [ ] Backup multi-région (redondance)
- [ ] Restauration automatique en cas de corruption

### Long terme

- [ ] Backup vers S3/GCS (alternative à Supabase Storage)
- [ ] Chiffrement des backups
- [ ] Backup de la base de données complète (pas seulement app_state)

## Support

Pour toute question ou problème:

1. Consulter les logs Vercel
2. Consulter les logs Supabase
3. Vérifier la documentation Vercel Cron: https://vercel.com/docs/cron-jobs
4. Contacter l'équipe de développement

---

**Dernière mise à jour:** 8 janvier 2026
**Version:** 1.0.0
**Auteur:** Smart Food Manager Team
