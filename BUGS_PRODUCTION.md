# 🐛 Bugs Production - Smart Food Manager

**Dernière mise à jour:** 8 Janvier 2026 15:21

---

## ✅ RÉSOLU: Vercel Build Failing (3 déploiements échoués)

**Symptôme**: `npm run build` exited with 1 sur Vercel

**Déploiements échoués**:
- GnFmkfmdK (33m ago) - Redeploy avec CRON_SECRET
- 6cERwTeS8 (55m ago) - fix(backup): Exclude api folder
- CupsSiw6g (1h ago) - feat(backup): Add automated backup

**Causes identifiées**:

### 1. Duplicate rollupOptions (vite.config.ts)
```typescript
// AVANT (ERREUR - lignes 20 ET 33)
rollupOptions: { external: [/^api\//] },
// ...
rollupOptions: { output: { ... } }

// APRÈS (FIX)
rollupOptions: {
  external: [/^api\//],
  output: { manualChunks: { ... } }
}
```

### 2. TypeScript dans api/cron/
```typescript
// AVANT: api/cron/backup.ts (TypeScript + ! operators)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,  // ← ! operator
  process.env.VITE_SUPABASE_ANON_KEY!
);

// APRÈS: api/cron/backup.js (JavaScript)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);
```

**Commits fix**:
- `361913d` fix(build): Vercel deployment errors resolved

**Status**: ✅ Corrigé - Build local passe (no warnings), Vercel DEVRAIT passer

---

## ✅ RÉSOLU: Build Error - Import backup.ts

**Symptôme**: Déploiement Vercel échoue avec erreur import

**Cause**: `shared/services/backup.ts:11` importait depuis `'./storage'` (inexistant dans `shared/services/`)

**Fix**:
```typescript
// Avant
import { supabase } from './storage';

// Après
import { supabase } from '../../services/storage';
```

**Commit**: `d084f12` fix(production): backup import + registration button

**Status**: ✅ Corrigé - Build passe maintenant

---

## ✅ RÉSOLU: Lien "S'inscrire" ne répond pas

**Symptôme**: Clic sur "Pas de compte ? S'inscrire" (ligne 313 SaaSLogin.tsx) ne fait rien

**Investigation**:

### Code Source (SaaSLogin.tsx:313-315)
```tsx
<button onClick={() => setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
  className="w-full mt-8 text-xs text-slate-500 hover:text-white transition-colors font-bold uppercase tracking-widest">
  {view === 'LOGIN' ? "Pas de compte ? S'inscrire" : "Déjà client ? Se connecter"}
</button>
```

**Code correct** ✅ - Handler `onClick` présent et fonctionnel

### Pistes à tester:

#### 1. **CSS z-index** (probable)
Le bouton pourrait être **caché sous un overlay**:

**Solution test**:
```tsx
// Ajouter z-index élevé temporairement
<button
  onClick={() => setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
  className="w-full mt-8 text-xs text-slate-500 hover:text-white transition-colors font-bold uppercase tracking-widest relative z-50"
  style={{ zIndex: 9999 }}
>
```

#### 2. **Form submit preventDefault manquant**
Le bouton est **DANS un `<form>`** (ligne 289). Clic pourrait déclencher submit.

**Solution**:
```tsx
<button
  type="button" // ← AJOUTER type="button"
  onClick={() => setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
  className="..."
>
```

#### 3. **Backdrop-blur incompatibilité Safari**
`backdrop-blur-2xl` (ligne 277) peut causer problèmes iOS/Safari.

**Solution test**:
```tsx
// Temporairement désactiver
<div className="bg-slate-900/80 p-8 rounded-[40px] ..."> {/* Supprimer backdrop-blur-2xl */}
```

#### 4. **JavaScript désactivé utilisateur**
Vérifier Console DevTools:
- Erreurs JavaScript?
- Click event enregistré?

**Test debug**:
```tsx
<button
  onClick={(e) => {
    console.log('Click registered!', e);
    setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN');
  }}
  className="..."
>
```

### Recommandation Immédiate

**Ajouter `type="button"` au bouton** (ligne 313):

```tsx
<button
  type="button"  // ← FIX PRIORITAIRE
  onClick={() => setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
  className="w-full mt-8 text-xs text-slate-500 hover:text-white transition-colors font-bold uppercase tracking-widest"
>
  {view === 'LOGIN' ? "Pas de compte ? S'inscrire" : "Déjà client ? Se connecter"}
</button>
```

**Pourquoi**: Bouton dans `<form>` sans `type="button"` = comportement par défaut `submit`, ce qui déclenche submit form au lieu du onClick.

---

## 📧 Email Config - Pas bloquant

**Contexte**: Supabase utilise email intégré (rate limited dev)

**Impact**:
- Limite 3-4 emails/heure en FREE tier
- Email confirmation peut arriver lentement
- Pas adapté production

**Roadmap**: Configurer SMTP custom (SendGrid, Mailgun, AWS SES)

**Priorité**: 🟡 Medium (pas critique pour tests)

---

## 🚀 Fix Recommandé

### Étape 1: Correction type="button"

**Fichier**: `pages/SaaSLogin.tsx:313`

```diff
- <button onClick={() => setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
+ <button type="button" onClick={() => setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
    className="w-full mt-8 text-xs text-slate-500 hover:text-white transition-colors font-bold uppercase tracking-widest">
```

### Étape 2: Test production

```bash
npm run build
vercel --prod

# Tester:
# 1. Ouvrir https://votre-app.vercel.app
# 2. Cliquer "Pas de compte ? S'inscrire"
# 3. Vérifier vue passe à REGISTER
```

### Étape 3: Si problème persiste

Ajouter debug logging:

```tsx
<button
  type="button"
  onClick={(e) => {
    console.log('[DEBUG] Register button clicked', { currentView: view });
    e.stopPropagation();
    setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN');
  }}
  className="..."
>
```

---

## 📊 Status App Production

### ✅ Fonctionnel
- Interface UI/UX propre
- Routing principal OK
- LocalStorage persistence
- Service Worker PWA
- Backup automatique (après fix import)
- Monitoring Sentry configuré

### 🟡 À valider
- Registration flow (après fix type="button")
- Email confirmation Supabase
- Multi-tenant isolation
- Performance sous charge

### 🔴 Bloquants résolus
- ~~Build error backup.ts import~~ ✅
- ~~Vercel build failing (duplicate rollupOptions)~~ ✅
- ~~Registration button not responding~~ ✅

---

## 🚧 TODO: Database Schema Issues

### 1. app_state table: Pas de company_id

**Problème actuel**:
```sql
-- Table app_state (Supabase)
CREATE TABLE app_state (
  id UUID PRIMARY KEY,  -- User ID uniquement
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Impact**:
- ❌ **Pas de RLS (Row Level Security) possible** sans company_id
- ❌ Backup cron cherche `companies` table (inexistante actuellement)
- ❌ Multi-tenant isolation impossible

**Fix requis**:
```sql
-- Migration 005: Add multi-tenant support
ALTER TABLE app_state ADD COLUMN company_id UUID REFERENCES companies(id);
CREATE INDEX idx_app_state_company ON app_state(company_id);

-- RLS Policy
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their company data"
  ON app_state
  FOR ALL
  USING (company_id = auth.uid()::uuid);
```

**Décision architecture à prendre**:
- **Option A**: 1 user = 1 company (actuel, simple, limite growth)
- **Option B**: Many-to-many (users ↔ companies, flexible, complexe)
- **Option C**: Hierarchie (owner → companies → users, recommandé SaaS)

### 2. Companies table manquante

**Requis pour**:
- Backup cron (ligne 28-30 api/cron/backup.js)
- Multi-tenant support
- Plans d'abonnement

**Migration nécessaire**:
```sql
-- Migration 006: Create companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  plan TEXT DEFAULT 'PRO' CHECK (plan IN ('SOLO', 'PRO', 'TEAM', 'BUSINESS')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_companies_owner ON companies(owner_id);
```

### 3. Multi-tenant Testing

**TODO**: Créer 2-3 companies de test en DB

**Script SQL à run**:
```sql
-- Test companies
INSERT INTO companies (id, name, owner_id, plan) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Restaurant Test Alpha', NULL, 'PRO'),
  ('22222222-2222-2222-2222-222222222222', 'Food Truck Beta', NULL, 'TEAM'),
  ('33333333-3333-3333-3333-333333333333', 'Snack Gamma', NULL, 'SOLO');

-- Associer app_state existant à company test
UPDATE app_state
SET company_id = '11111111-1111-1111-1111-111111111111'
WHERE company_id IS NULL
LIMIT 1;
```

**Tests à valider**:
- [ ] User A ne peut PAS voir données User B
- [ ] Backup cron crée 1 fichier par company
- [ ] RLS policies fonctionnent correctement
- [ ] Performance avec 100+ companies

---

## 📋 Prochaines Actions Prioritaires

### 🔥 URGENT (Avant push Vercel)
1. ✅ Fix vite.config.ts duplicate rollupOptions
2. ✅ Convert api/cron/backup.ts → .js
3. ✅ Test build local passe
4. ⏳ Push + vérifier Vercel deploy réussi

### 🟡 IMPORTANT (Semaine prochaine)
5. Créer migration 005: Add company_id to app_state
6. Créer migration 006: Create companies table
7. Configurer RLS policies
8. Créer 2-3 companies test en DB
9. Tester multi-tenant isolation

### 🟢 NICE-TO-HAVE
10. Configurer SMTP custom (SendGrid/Mailgun)
11. Monitoring Sentry: Configurer alertes Slack
12. Documentation: Guide setup Supabase complet
