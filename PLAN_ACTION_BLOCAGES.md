# 🚨 PLAN D'ACTION - RÉSOLUTION BLOCAGES
**Date:** 8 Janvier 2026
**Temps total estimé:** ~3h30
**Référence:** Session Smart Food Manager - Blocages rencontrés

---

## ✅ RÉSOLU CÔTÉ CODE (Par Claude)

### Blocages 1-3: Build & Registration ✅
- ✅ Vercel Build Failures (duplicate rollupOptions)
- ✅ Registration Button Non Cliquable (type="button")
- ✅ Import Path Incorrect dans backup.ts

**Status:** Corrigé, commits pushés, build local passe
**Tu n'as rien à faire** - Vercel devrait déployer automatiquement

---

## 🔥 BLOCAGE CRITIQUE #1: Supabase Database Pas Configurée

### 📋 Contexte
**Problème:** Tables `companies` et `app_state.company_id` n'existent pas en DB
**Impact:** RLS inactif, isolation données impossible, backup cron échoue
**Durée:** 15 minutes

---

### 🎯 PLAN D'ACTION DÉTAILLÉ

#### Étape 1: Connexion Supabase Dashboard (2 min)
1. Ouvre https://supabase.com
2. Login avec ton compte
3. Sélectionne ton projet **Smart Food Manager**
4. Note le **Project URL** et **API Keys** pour plus tard

**Vérification:** Tu vois le dashboard avec "Table Editor", "SQL Editor", "Authentication"

---

#### Étape 2: Exécuter Migration 005 (5 min)

**Navigation:**
```
Dashboard → SQL Editor (menu gauche) → New Query
```

**Actions:**
1. Ouvre le fichier local: `supabase/migrations/005_multi_tenant_support.sql`
2. **Copie TOUT le contenu** (177 lignes)
3. Colle dans SQL Editor Supabase
4. Clique **"RUN"** (bouton en bas à droite)

**Résultat attendu:**
```
Success. Rows updated: 0
```

**Vérification - Exécute cette query:**
```sql
-- Vérifier que tables existent
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('companies', 'app_state');
```

**Résultat attendu:** 2 lignes
- companies
- app_state

**Vérification RLS - Exécute:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('companies', 'app_state');
```

**Résultat attendu:**
| tablename | rowsecurity |
|-----------|-------------|
| companies | t (true) |
| app_state | t (true) |

---

#### Étape 3: Exécuter Migration 006 - Test Companies (3 min)

**⚠️ IMPORTANT:** Uniquement si environnement DEV/STAGING (pas production client)

**Actions:**
1. Nouvelle query dans SQL Editor
2. Ouvre `supabase/migrations/006_test_companies.sql`
3. Copie tout le contenu (165 lignes)
4. Colle et **RUN**

**Résultat attendu:**
```
Success. 3 rows inserted.
```

**Vérification - Exécute:**
```sql
SELECT id, name, plan, settings->>'test' as is_test
FROM companies
WHERE settings->>'test' = 'true'
ORDER BY name;
```

**Résultat attendu:** 3 companies
- Food Truck Beta (TEAM)
- Restaurant Test Alpha (PRO)
- Snack Gamma (SOLO)

---

#### Étape 4: Vérifier app_state lié aux companies (2 min)

**Query de vérification:**
```sql
SELECT
  c.name as restaurant,
  a.id as app_state_id,
  a.company_id,
  a.data->'restaurant'->>'name' as data_name
FROM companies c
LEFT JOIN app_state a ON a.company_id = c.id
WHERE c.settings->>'test' = 'true';
```

**Résultat attendu:** 3 lignes avec `company_id` non NULL

**Si app_state vide (aucune ligne):** C'est normal si première installation

**Si erreur "column company_id does not exist":**
❌ Migration 005 pas bien exécutée - **Recommence Étape 2**

---

#### Étape 5: Tester Isolation RLS (3 min) ⚠️ CRITIQUE

**Créer User Test A:**
```
Dashboard → Authentication → Users → Add User
Email: test-a@example.com
Password: TestPassword123!
```

**Note le User ID** (ex: `a1b2c3d4-e5f6-7890-abcd-1234567890ab`)

**Créer Company pour User A:**
```sql
INSERT INTO companies (id, name, owner_id, plan)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-1234567890ab',  -- Remplace par User ID
  'Restaurant User A',
  'a1b2c3d4-e5f6-7890-abcd-1234567890ab',  -- Même User ID
  'PRO'
);
```

**Créer app_state pour User A:**
```sql
INSERT INTO app_state (id, company_id, data)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
  'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
  '{"restaurant": {"name": "Restaurant A", "plan": "PRO"}, "users": [], "products": []}'::jsonb
);
```

**Test Isolation (SANS auth):**
```sql
-- Essaie de lire toutes les companies
SELECT * FROM companies;
```

**Résultat attendu:** ❌ **0 rows** (RLS bloque car pas authentifié)

**Si tu vois des rows:** ⚠️ RLS pas activé correctement - Contacte-moi

---

### ✅ Checklist Migration DB

- [ ] Migration 005 exécutée (companies + RLS)
- [ ] Migration 006 exécutée (test companies)
- [ ] Vérification: 3 test companies existent
- [ ] Vérification: RLS activé (rowsecurity = true)
- [ ] User test créé + company associée
- [ ] Test isolation: SELECT sans auth retourne 0 rows

**Temps total:** ~15 minutes

---

## 🔥 BLOCAGE CRITIQUE #2: Variables d'Environnement Manquantes

### 📋 Contexte
**Problème:** Vercel ne peut pas se connecter à Supabase
**Impact:** Backend non fonctionnel, backup cron échoue
**Durée:** 10 minutes

---

### 🎯 PLAN D'ACTION DÉTAILLÉ

#### Étape 1: Récupérer API Keys Supabase (3 min)

**Navigation:**
```
Supabase Dashboard → Settings (menu gauche) → API
```

**Copie ces 3 valeurs:**

1. **Project URL**
   ```
   https://xxxxxxxxxxxxxxxx.supabase.co
   ```

2. **anon public key** (commence par `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - Section "Project API keys"
   - Clique "Copy" sur `anon` `public`

3. **service_role key** (commence par `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - ⚠️ **SECRET - Ne jamais exposer publiquement**
   - Clique "Reveal" puis "Copy" sur `service_role` `secret`

---

#### Étape 2: Générer CRON_SECRET (1 min)

**Option A - Terminal:**
```bash
openssl rand -hex 32
```

**Option B - Node:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option C - Online:**
https://www.random.org/strings/?num=1&len=32&digits=on&loweralpha=on&unique=on&format=plain

**Copie le résultat** (ex: `a1b2c3d4e5f67890abcdef1234567890...`)

---

#### Étape 3: Configurer Vercel Environment Variables (6 min)

**Navigation:**
```
Vercel Dashboard → Ton Projet → Settings → Environment Variables
```

**Ajoute 4 variables:**

---

**Variable 1:**
```
Name: VITE_SUPABASE_URL
Value: https://xxxxxxxxxxxxxxxx.supabase.co
Environment: Production, Preview, Development (cocher les 3)
```
Clique **"Save"**

---

**Variable 2:**
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environment: Production, Preview, Development (cocher les 3)
```
Clique **"Save"**

---

**Variable 3:**
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role)
Environment: Production UNIQUEMENT (cocher SEULEMENT Production)
```
⚠️ **NE PAS cocher Preview/Development** - Clé sensible
Clique **"Save"**

---

**Variable 4:**
```
Name: CRON_SECRET
Value: a1b2c3d4e5f67890abcdef1234567890...
Environment: Production UNIQUEMENT
```
Clique **"Save"**

---

#### Étape 4: Redéployer Vercel (facultatif - auto)

**Option A - Attendre:**
Vercel redéploie automatiquement quand tu changes les env vars

**Option B - Forcer:**
```
Vercel Dashboard → Deployments → Latest → "..." menu → Redeploy
```

---

#### Étape 5: Créer fichier .env local (2 min)

**Créer `.env` à la racine du projet:**
```bash
# Supabase Config
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (pour backup cron)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cron Secret (pour sécuriser endpoint)
CRON_SECRET=a1b2c3d4e5f67890abcdef1234567890...
```

**⚠️ IMPORTANT:** `.env` est déjà dans `.gitignore` - **NE PAS commit**

---

### ✅ Checklist Variables Env

- [ ] Project URL copié depuis Supabase
- [ ] anon key copié
- [ ] service_role key copié (secret)
- [ ] CRON_SECRET généré (32 chars)
- [ ] 4 variables ajoutées sur Vercel
- [ ] Fichier .env local créé
- [ ] .env dans .gitignore (vérifier)

**Temps total:** ~10 minutes

---

## 🔥 BLOCAGE CRITIQUE #3: Bucket Backup Manquant

### 📋 Contexte
**Problème:** Bucket Supabase Storage `backups` n'existe pas
**Impact:** Backup cron échoue avec 404
**Durée:** 5 minutes

---

### 🎯 PLAN D'ACTION DÉTAILLÉ

#### Étape 1: Créer Bucket (2 min)

**Navigation:**
```
Supabase Dashboard → Storage (menu gauche) → New Bucket
```

**Configuration:**
```
Name: backups
Public: NO (laisser décoché - Private)
File size limit: 50MB (default OK)
Allowed MIME types: application/json (ou laisser vide)
```

Clique **"Create Bucket"**

---

#### Étape 2: Configurer RLS Policy Storage (3 min)

**Navigation:**
```
Storage → backups bucket → Policies → New Policy
```

**Option A - Via UI:**
```
Policy Name: Service role can manage backups
Allowed Operations: SELECT, INSERT, UPDATE, DELETE (cocher tout)
Target Roles: service_role
Policy Definition: bucket_id = 'backups'
```

**Option B - Via SQL (recommandé):**
```sql
-- Dashboard → SQL Editor → New Query
CREATE POLICY "Service role can manage backups"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'backups')
WITH CHECK (bucket_id = 'backups');
```

Clique **"RUN"**

---

#### Étape 3: Vérifier Bucket (1 min)

**Query vérification:**
```sql
SELECT * FROM storage.buckets WHERE name = 'backups';
```

**Résultat attendu:** 1 ligne
```
id | name    | public
---|---------|-------
xxx| backups | false
```

---

### ✅ Checklist Storage Backup

- [ ] Bucket `backups` créé (private)
- [ ] Policy RLS configurée (service_role)
- [ ] Vérification SQL: bucket existe

**Temps total:** ~5 minutes

---

## 🧪 BLOCAGE #4: Tester Backup Cron

### 📋 Contexte
**Problème:** Backup jamais testé manuellement
**Impact:** Risque erreur silencieuse production
**Durée:** 10 minutes

---

### 🎯 PLAN D'ACTION DÉTAILLÉ

#### Étape 1: Lancer Serveur Dev Local (1 min)

**Terminal:**
```bash
cd /Users/isacelgozmir/Downloads/smart-food-manager\ \(6\)
npm run dev
```

**Vérification:** Serveur démarre sur http://localhost:3000

---

#### Étape 2: Tester Endpoint Backup (2 min)

**Nouveau terminal:**
```bash
curl "http://localhost:3000/api/cron/backup?secret=TON_CRON_SECRET"
```

**Remplace `TON_CRON_SECRET`** par la valeur de ton `.env`

**Résultat attendu (SUCCESS):**
```json
{
  "success": true,
  "backups_created": 3,
  "companies": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "name": "Restaurant Test Alpha",
      "backup_path": "backups/backup_11111111_2026-01-08.json"
    },
    {
      "id": "22222222-2222-2222-2222-222222222222",
      "name": "Food Truck Beta",
      "backup_path": "backups/backup_22222222_2026-01-08.json"
    },
    {
      "id": "33333333-3333-3333-3333-333333333333",
      "name": "Snack Gamma",
      "backup_path": "backups/backup_33333333_2026-01-08.json"
    }
  ],
  "timestamp": "2026-01-08T16:30:00Z"
}
```

**Si erreur 403:** CRON_SECRET incorrect
**Si erreur 404 bucket:** Bucket `backups` pas créé (Blocage #3)
**Si erreur 500:** Vérifier logs console serveur dev

---

#### Étape 3: Vérifier Fichiers Créés Supabase (3 min)

**Navigation:**
```
Supabase Dashboard → Storage → backups bucket
```

**Vérification:** Tu dois voir **3 fichiers**
```
backup_11111111-1111-1111-1111-111111111111_2026-01-08.json (XX KB)
backup_22222222-2222-2222-2222-222222222222_2026-01-08.json (XX KB)
backup_33333333-3333-3333-3333-333333333333_2026-01-08.json (XX KB)
```

**Clique sur 1 fichier → Download → Ouvre avec éditeur texte**

**Contenu attendu:**
```json
{
  "restaurant": {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Restaurant Test Alpha",
    "plan": "PRO"
  },
  "users": [...],
  "products": [...],
  "ingredients": [...],
  "_lastUpdatedAt": 1704729600000
}
```

**Si JSON invalide ou vide:** ❌ Problème backup - Contacte-moi

---

#### Étape 4: Tester Erreur Mauvais Secret (2 min)

**Test sécurité:**
```bash
curl "http://localhost:3000/api/cron/backup?secret=WRONG_SECRET"
```

**Résultat attendu (ERREUR):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid CRON_SECRET"
}
```

**Si SUCCESS:** ❌ Sécurité compromise - Secret pas vérifié

---

#### Étape 5: Vérifier Cron Vercel Configuration (2 min)

**Fichier `vercel.json` devrait contenir:**
```json
{
  "crons": [{
    "path": "/api/cron/backup",
    "schedule": "0 3 * * *"
  }]
}
```

**Vérification:**
```bash
cat vercel.json
```

**Schedule "0 3 * * *"** = Tous les jours à 3h00 UTC (4h00 Paris hiver, 5h00 été)

**Si fichier manquant ou schedule différent:** Contacte-moi

---

### ✅ Checklist Test Backup

- [ ] Serveur dev lancé (npm run dev)
- [ ] Curl backup avec bon secret → SUCCESS
- [ ] 3 fichiers créés dans Storage Supabase
- [ ] Fichier téléchargé = JSON valide
- [ ] Test mauvais secret → ERREUR
- [ ] vercel.json contient cron config

**Temps total:** ~10 minutes

---

## 🧪 BLOCAGE #5: Vérifier Vercel Deployment

### 📋 Contexte
**Problème:** 3 déploiements échoués, dernier fix pas vérifié
**Impact:** Production potentiellement cassée
**Durée:** 5 minutes

---

### 🎯 PLAN D'ACTION DÉTAILLÉ

#### Étape 1: Vérifier Dernier Deployment (2 min)

**Navigation:**
```
Vercel Dashboard → Ton Projet → Deployments
```

**Vérification - Dernier deployment devrait être:**
- Status: **Ready** ✅ (vert)
- Commit: `c502f3f` ou plus récent
- Message: "docs(avancement): maj score 75%..." ou "fix(build)..."
- Durée build: ~2-3 minutes

**Si Status = Failed:** ❌ Voir Étape 2
**Si Status = Ready:** ✅ Passer Étape 3

---

#### Étape 2: Si Deployment Failed - Logs (3 min)

**Clique sur le deployment Failed → View Function Logs**

**Cherche erreurs:**
```
ERROR: Duplicate object key "rollupOptions"
ERROR: Cannot find module './storage'
ERROR: Unexpected token '!'
```

**Si ces erreurs:** ❌ Mes fixes pas pris en compte - **Pull latest main**
```bash
git pull origin main
```

**Si autre erreur:** Screenshot + contacte-moi

---

#### Étape 3: Tester App Production (2 min)

**URL Production:** https://ton-app.vercel.app

**Vérifications:**
1. Page charge (pas d'erreur 500)
2. Clique "Pas de compte ? S'inscrire"
   - ✅ Vue change vers REGISTER
   - ❌ Si rien ne se passe: Problème pas résolu
3. Ouvre Console DevTools (F12)
   - Pas d'erreurs rouges critiques

---

### ✅ Checklist Vercel

- [ ] Dernier deployment = Ready ✅
- [ ] Commit récent (c502f3f ou plus)
- [ ] App charge sans erreur 500
- [ ] Registration button fonctionne
- [ ] Console sans erreurs critiques

**Temps total:** ~5 minutes

---

## 📊 RÉCAPITULATIF TEMPS TOTAL

| Blocage | Durée | Critique |
|---------|-------|----------|
| #1 - Migration DB Supabase | 15 min | ⚠️ OUI |
| #2 - Variables Env Vercel | 10 min | ⚠️ OUI |
| #3 - Bucket Storage | 5 min | ⚠️ OUI |
| #4 - Test Backup Cron | 10 min | 🟡 Important |
| #5 - Vérif Deployment | 5 min | 🟡 Important |
| **TOTAL** | **45 min** | |

---

## 🎯 ORDRE RECOMMANDÉ D'EXÉCUTION

### Phase 1 - Setup DB (20 min) ⚠️ URGENT
1. Blocage #1 - Migration DB (15 min)
2. Blocage #3 - Bucket Storage (5 min)

**Pourquoi d'abord:** Backend ne peut pas fonctionner sans DB

---

### Phase 2 - Setup Env (10 min) ⚠️ URGENT
3. Blocage #2 - Variables Env (10 min)

**Pourquoi après:** Besoin des tables DB créées pour que env vars soient utiles

---

### Phase 3 - Tests (15 min) 🟡
4. Blocage #4 - Test Backup (10 min)
5. Blocage #5 - Vérif Deployment (5 min)

**Pourquoi en dernier:** Validation que tout fonctionne

---

## 🆘 SUPPORT EN CAS DE PROBLÈME

### Erreur Migration SQL
**Symptôme:** "ERROR: column already exists" ou "relation exists"

**Solution:** Rollback puis re-run
```sql
-- Rollback migration 005
DROP TABLE IF EXISTS companies CASCADE;
ALTER TABLE app_state DROP COLUMN IF EXISTS company_id;

-- Re-run migration 005 complète
```

---

### Erreur RLS Bloque Tout
**Symptôme:** Queries retournent 0 rows même authentifié

**Solution:** Vérifier auth token
```sql
-- Vérifier user connecté
SELECT auth.uid();
-- Si NULL → pas authentifié
```

---

### Backup 403 Forbidden
**Symptôme:** Backup échoue avec 403

**Causes:**
1. SUPABASE_SERVICE_ROLE_KEY incorrect
2. Bucket policy RLS manquante
3. Bucket `backups` n'existe pas

**Solution:** Reprendre Blocage #2 et #3

---

### Vercel Build Toujours Failed
**Symptôme:** Deployment échoue malgré fixes

**Solution:**
1. Pull latest: `git pull origin main`
2. Build local: `npm run build` (doit passer)
3. Si local passe mais Vercel échoue: Clear cache Vercel
   - Deployments → ... → Clear Cache and Redeploy

---

## 📞 CONTACT

**Si bloqué >30 min sur une étape:** Screenshot erreur + contacte-moi

**Fichiers référence:**
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Guide détaillé setup DB
- [BUGS_PRODUCTION.md](./BUGS_PRODUCTION.md) - Tracker bugs
- [AVANCEMENT.md](./AVANCEMENT.md) - Progression globale

---

**Dernière mise à jour:** 8 Janvier 2026 18:00
**Prochaine révision:** Après exécution des 5 blocages
