# 🚀 Supabase Setup Guide - Smart Food Manager

**Temps estimé**: 10 minutes  
**Dernière mise à jour**: 8 Janvier 2026

---

## ✅ Prérequis

- Compte Supabase créé sur [supabase.com](https://supabase.com)
- Projet Supabase créé (note `Project URL` et `anon public key`)
- Accès SQL Editor dans Supabase Dashboard

---

## 📋 Étape 1: Variables d'Environnement

### Fichier `.env` (local)
```bash
VITE_SUPABASE_URL=https://ton-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI... # Pour backup cron
CRON_SECRET=secret-aleatoire-32-chars
```

### Vercel Environment Variables
Dashboard → Settings → Environment Variables:

| Variable | Scope |
|----------|-------|
| VITE_SUPABASE_URL | Production, Preview, Development |
| VITE_SUPABASE_ANON_KEY | Production, Preview, Development |
| SUPABASE_SERVICE_ROLE_KEY | Production only |
| CRON_SECRET | Production only |

---

## 📦 Étape 2: Exécuter Migrations

### Migration 005: Multi-Tenant Support ⭐ CRITIQUE
Supabase Dashboard → SQL Editor → Run `supabase/migrations/005_multi_tenant_support.sql`

**Fait**:
- Crée table `companies`
- Ajoute `company_id` à `app_state`
- Migre données (1 user = 1 company)
- Active RLS + 8 policies

**Vérification**:
```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('app_state', 'companies');
```

Résultat: rowsecurity = true pour les 2

### Migration 006: Test Companies (STAGING uniquement)
Run `supabase/migrations/006_test_companies.sql`

Crée 3 companies test:
- Alpha: `11111111-1111-1111-1111-111111111111` (PRO)
- Beta: `22222222-2222-2222-2222-222222222222` (TEAM)
- Gamma: `33333333-3333-3333-3333-333333333333` (SOLO)

---

## 🔒 Étape 3: Tester RLS

### Créer user + company test
```sql
INSERT INTO companies (id, name, owner_id, plan)
VALUES (
  'test-uuid-ici',
  'Restaurant Test',
  'user-uuid-ici',
  'PRO'
);
```

### Vérifier isolation (CRITIQUE)
Connecte user A → essaie lire company B → devrait retourner 0 rows

---

## 📂 Étape 4: Storage Backup

Supabase Dashboard → Storage → New Bucket `backups` (Private)

**RLS Policy**:
```sql
CREATE POLICY "Service role backups"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'backups');
```

---

## ⏰ Étape 5: Tester Cron

```bash
curl "http://localhost:3000/api/cron/backup?secret=ton-CRON_SECRET"
```

Résultat: 3 fichiers dans Storage backups/

---

## 🐛 Troubleshooting

**"relation 'companies' does not exist"**: Run migration 005

**RLS bloque tout**: Vérifier `auth.uid()` non NULL

**Backup 403**: Vérifier SUPABASE_SERVICE_ROLE_KEY

---

## ✅ Checklist Production

- [ ] Migration 005 exécutée
- [ ] RLS activé (8 policies)
- [ ] Storage bucket créé
- [ ] Vercel env vars (4)
- [ ] Backup cron testé
- [ ] Test isolation multi-tenant
