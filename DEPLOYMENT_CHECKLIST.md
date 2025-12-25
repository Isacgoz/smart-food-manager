# 🚀 CHECKLIST DÉPLOIEMENT - Smart Food Manager

## ⚠️ BLOQUANTS CRITIQUES (À corriger AVANT déploiement)

### 1. Configuration Supabase ❌ MANQUANT
**Status**: Non configuré
**Impact**: App non fonctionnelle sans base de données

**Actions**:
```bash
# Créer fichier .env à la racine
cat > .env << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
EOF

# Créer fichier .env.example (pour repo)
cat > .env.example << EOF
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
EOF

# Ajouter au .gitignore
echo ".env" >> .gitignore
```

**Supabase Setup**:
1. Créer compte sur https://supabase.com
2. Créer nouveau projet
3. SQL Editor → Exécuter:
```sql
CREATE TABLE app_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_app_state_updated_at ON app_state(updated_at);

-- Enable Row Level Security
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

-- Policy: Chaque restaurant accède uniquement à ses données
CREATE POLICY "Users can access their own restaurant data"
ON app_state
FOR ALL
USING (true);  -- V1: Pas d'auth stricte, V2: Filtrer par user_id
```
4. Copier URL + Anon Key depuis Settings → API

**Fichiers concernés**:
- [services/storage.ts:7-8](services/storage.ts#L7-L8)
- [mobile/services/storage.ts:6-7](mobile/services/storage.ts#L6-L7)

---

### 2. Sécurité Auth ❌ CRITIQUE
**Status**: Mots de passe en clair
**Impact**: Violation RGPD, faille sécurité majeure

**Problème**:
```typescript
// SaaSLogin.tsx:83
const handleLogin = async (e: React.FormEvent) => {
  // Compare passwords en clair !
  if (email === 'admin@smartfood.com' && password === 'admin123') {
    // ...
  }
}
```

**Solution V1 (rapide)**: Supabase Auth
```bash
npm install @supabase/auth-helpers-react
```

Modifier `SaaSLogin.tsx`:
```typescript
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert('Erreur: ' + error.message);
    return;
  }

  // Charger profil restaurant
  const { data: profile } = await supabase
    .from('restaurants')
    .select('*')
    .eq('user_id', data.user.id)
    .single();

  if (profile) {
    onLogin(profile);
  }
};
```

**Fichiers concernés**:
- [pages/SaaSLogin.tsx:83](pages/SaaSLogin.tsx#L83)
- [shared/services/auth.ts:6-28](shared/services/auth.ts#L6-L28)

---

### 3. Validation Côté Serveur ❌ CRITIQUE
**Status**: Validation uniquement côté client
**Impact**: Données manipulables via DevTools

**Actions**:
1. Créer Supabase Edge Functions pour mutations critiques
2. Ou utiliser Row Level Security (RLS) + Triggers PostgreSQL

**Exemple Edge Function** (`supabase/functions/create-order/index.ts`):
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { restaurantId, order, updatedIngredients, movements } = await req.json();

  // Validation serveur
  if (!order || !order.items || order.items.length === 0) {
    return new Response(JSON.stringify({ error: 'Invalid order' }), {
      status: 400
    });
  }

  // Vérifier stock côté serveur
  // ...

  // Enregistrer dans Supabase
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data, error } = await supabase
    .from('app_state')
    .update({ data: newState })
    .eq('id', restaurantId);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

**Alternative Rapide**: RLS Policies
```sql
-- Seulement users authentifiés peuvent modifier
CREATE POLICY "Authenticated users can update"
ON app_state
FOR UPDATE
USING (auth.uid() IS NOT NULL);
```

---

### 4. Icônes PWA ⚠️ RECOMMANDÉ
**Status**: Références mais fichiers manquants
**Impact**: Installation PWA non fonctionnelle

**Actions**:
```bash
# Créer dossier
mkdir -p public/icons

# Générer icônes (option 1: online)
# https://realfavicongenerator.net/

# Ou générer via script (option 2)
npm install sharp --save-dev
```

Script `scripts/generate-icons.js`:
```javascript
const sharp = require('sharp');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  sharp('assets/logo.png')
    .resize(size, size)
    .toFile(`public/icons/icon-${size}x${size}.png`)
    .then(() => console.log(`✓ ${size}x${size}`));
});
```

**Fichiers concernés**:
- [public/manifest.json:12-20](public/manifest.json#L12-L20)
- [index.html:23-25](index.html#L23-L25)

---

## 🟡 RECOMMANDATIONS (Améliorer avant prod)

### 5. Console.log en Production 🟡
**Status**: 1458 occurrences détectées
**Impact**: Performance + sécurité

**Actions**:
```typescript
// shared/services/logger.ts - Déjà créé, utiliser partout
import { logger } from './shared/services/logger';

// AVANT
console.log('[MOBILE] Syncing orders');

// APRÈS
logger.info('Syncing orders', { source: 'mobile' });
```

**Build Config** (vite.config.ts):
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer console.log en prod
        drop_debugger: true
      }
    }
  }
});
```

---

### 6. Variables d'Environnement 🟡
**Status**: Fichier .env manquant
**Impact**: Configuration manuelle par environnement

**Actions**:
```bash
# .env.development
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=dev-key
VITE_APP_ENV=development

# .env.production
VITE_SUPABASE_URL=https://prod.supabase.co
VITE_SUPABASE_ANON_KEY=prod-key
VITE_APP_ENV=production

# .env.local (ignoré par Git)
VITE_SUPABASE_URL=https://staging.supabase.co
VITE_SUPABASE_ANON_KEY=staging-key
```

**package.json**:
```json
{
  "scripts": {
    "dev": "vite --mode development",
    "build": "vite build --mode production",
    "build:staging": "vite build --mode staging"
  }
}
```

---

### 7. Tests Automatisés 🟡
**Status**: Infrastructure Vitest créée, 0 tests écrits
**Impact**: Régressions non détectées

**Tests Prioritaires**:
```bash
# Créer tests critiques
touch shared/services/__tests__/expenses.test.ts
touch shared/services/__tests__/business.test.ts
```

**Exemple** (`expenses.test.ts`):
```typescript
import { describe, it, expect } from 'vitest';
import { calculateEBE } from '../expenses';

describe('calculateEBE', () => {
  it('calcule EBE correctement', () => {
    const orders = [{ total: 1000, items: [...] }];
    const expenses = [{ amount: 200, type: 'FIXED' }];
    const result = calculateEBE(orders, expenses, products, ingredients, start, end);

    expect(result.ebe).toBe(500); // 1000 - 300 matière - 200 charges
    expect(result.isProfitable).toBe(true);
  });

  it('détecte perte si charges > marge brute', () => {
    // ...
  });
});
```

**CI/CD** (GitHub Actions):
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
```

---

### 8. Monitoring & Error Tracking 🟡
**Status**: Aucun monitoring
**Impact**: Bugs production non détectés

**Actions**:
```bash
npm install @sentry/react @sentry/vite-plugin
```

**Sentry Setup** (`main.tsx`):
```typescript
import * as Sentry from '@sentry/react';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_APP_ENV,
    tracesSampleRate: 0.1,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration()
    ]
  });
}
```

**Alternatives**:
- LogRocket (session replay)
- Rollbar
- Bugsnag

---

### 9. Optimisation Build 🟡
**Status**: Build fonctionnel, non optimisé
**Impact**: Performance chargement

**vite.config.ts**:
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-recharts': ['recharts']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  esbuild: {
    drop: ['console', 'debugger'] // Production uniquement
  }
});
```

**Lazy Loading Routes**:
```typescript
// App.tsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
const POS = lazy(() => import('./pages/POS'));

<Suspense fallback={<Loader />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/pos" element={<POS />} />
  </Routes>
</Suspense>
```

---

### 10. PWA Service Worker 🟡
**Status**: Service Worker créé, non enregistré
**Impact**: Offline mode non actif

**Vérifier Enregistrement** ([App.tsx:280](App.tsx#L280)):
```typescript
import { registerServiceWorker } from './shared/hooks/usePWA';

useEffect(() => {
  if ('serviceWorker' in navigator) {
    registerServiceWorker()
      .then(() => console.log('✓ SW registered'))
      .catch(err => console.error('✗ SW failed', err));
  }
}, []);
```

**Fichier manquant ?** Vérifier:
```bash
ls -la public/service-worker.js
# Si manquant, copier depuis PHASE_5_PWA_COMPLETE.md
```

---

## 🟢 MOBILE - Checklist Séparée

### 11. Dépendances React Native ⚠️
**Status**: Dépendances dans package.json web
**Impact**: Confusion build, erreurs imports

**Problème**:
```json
// package.json (WEB)
"dependencies": {
  "@react-native-async-storage/async-storage": "^2.2.0",
  "react-native": "^0.83.0"  // ← Pas nécessaire pour web !
}
```

**Solutions**:

**Option A: Supprimer du Web** (Recommandé V1)
```bash
npm uninstall react-native @react-native-async-storage/async-storage
```

**Option B: Monorepo** (V2)
```
smart-food-manager/
├── packages/
│   ├── web/          # React + Vite
│   ├── mobile/       # React Native
│   └── shared/       # Code partagé
└── package.json      # Root config
```

---

### 12. Mobile - Variables d'Environnement ⚠️
**Status**: Non configuré
**Impact**: App mobile non fonctionnelle

**Actions**:
```bash
# mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Expo Config** (`app.json` ou `app.config.js`):
```json
{
  "expo": {
    "name": "Smart Food Manager",
    "slug": "smart-food-manager",
    "version": "1.0.0",
    "extra": {
      "supabaseUrl": process.env.EXPO_PUBLIC_SUPABASE_URL,
      "supabaseKey": process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
  }
}
```

---

### 13. Mobile - Intégrer NetworkBadge ⚠️
**Status**: Composant créé, non utilisé
**Impact**: Utilisateur ne voit pas statut connexion

**Actions**:
Ajouter dans `mobile/App.tsx` (ou équivalent):
```typescript
import { NetworkBadge } from './components/NetworkBadge';

export default function App() {
  return (
    <MobileProvider>
      <NetworkBadge />  {/* ← Ajouter ici */}
      <NavigationContainer>
        {/* ... */}
      </NavigationContainer>
    </MobileProvider>
  );
}
```

---

### 14. Mobile - Build & Distribution ⚠️
**Status**: Non configuré
**Impact**: App non installable

**iOS (TestFlight)**:
```bash
# Installer EAS CLI
npm install -g eas-cli

# Login Expo
eas login

# Build iOS
eas build --platform ios --profile production

# Submit TestFlight
eas submit --platform ios
```

**Android (Play Store)**:
```bash
# Build APK/AAB
eas build --platform android --profile production

# Submit Play Store
eas submit --platform android
```

**app.json Config**:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.smartfood.manager",
      "buildNumber": "1.0.0"
    },
    "android": {
      "package": "com.smartfood.manager",
      "versionCode": 1
    }
  }
}
```

---

## 📋 CHECKLIST GLOBALE

### Avant Déploiement Web
- [ ] ✅ Configurer Supabase (.env + table app_state)
- [ ] ✅ Remplacer auth plaintext par Supabase Auth
- [ ] ✅ Générer icônes PWA (8 tailles)
- [ ] ✅ Tester Service Worker enregistré
- [ ] ⚠️ Supprimer dépendances React Native du web
- [ ] ⚠️ Ajouter monitoring (Sentry)
- [ ] ⚠️ Écrire 5-10 tests critiques
- [ ] ⚠️ Configurer variables env (.env.production)
- [ ] ⚠️ Optimiser build (code splitting)
- [ ] ⚠️ Supprimer console.log via Terser

### Avant Déploiement Mobile
- [ ] ✅ Configurer Supabase mobile (.env)
- [ ] ✅ Intégrer NetworkBadge dans App.tsx
- [ ] ✅ Installer NetInfo + AsyncStorage
- [ ] ⚠️ Tester queue offline (mode avion)
- [ ] ⚠️ Configurer EAS Build (Expo)
- [ ] ⚠️ Générer certificats iOS/Android
- [ ] ⚠️ Build production (eas build)
- [ ] ⚠️ Tester sur devices réels
- [ ] ⚠️ Submit stores (TestFlight + Play Console)

### Documentation
- [ ] ✅ README.md avec installation
- [ ] ✅ Documentation API (si applicable)
- [ ] ⚠️ Guide utilisateur PDF
- [ ] ⚠️ Video demo YouTube

---

## 🚀 DÉPLOIEMENT

### Web (Vercel - Recommandé)
```bash
# Installer Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Variables env via UI
# https://vercel.com/dashboard → Settings → Environment Variables
```

**vercel.json**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/service-worker.js",
      "headers": [
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    }
  ]
}
```

### Alternatives Web
- **Netlify**: Similaire Vercel
- **Firebase Hosting**: Gratuit, CDN global
- **Cloudflare Pages**: Gratuit illimité

### Mobile (Expo EAS)
```bash
# Production builds
eas build --platform all --profile production

# Submit stores
eas submit --platform ios
eas submit --platform android
```

---

## ⏱️ ESTIMATION TEMPS

### Bloquants Critiques (AVANT prod)
- Config Supabase: **2-4h**
- Auth sécurisée: **4-6h**
- Génération icônes: **1h**
- Tests E2E basiques: **4h**
**TOTAL**: **11-15h**

### Recommandations (Améliorer)
- Monitoring Sentry: **2h**
- Optimisation build: **2h**
- Tests unitaires: **8-12h**
- Documentation: **4h**
**TOTAL**: **16-20h**

### Mobile Spécifique
- Config EAS: **2h**
- Tests devices: **4h**
- Soumission stores: **2h** (+ délai review 1-7j)
**TOTAL**: **8h + délai review**

---

## 🎯 PRIORITÉS

### 🔴 URGENT (J+0 à J+2)
1. Configurer Supabase
2. Sécuriser auth (Supabase Auth)
3. Générer icônes PWA
4. Supprimer RN du package.json web

### 🟡 IMPORTANT (J+3 à J+7)
5. Ajouter monitoring Sentry
6. Écrire tests critiques (EBE, stock)
7. Optimiser build Vite
8. Configurer env prod

### 🟢 AMÉLIORATION (J+7+)
9. Tests E2E Playwright
10. Documentation complète
11. CI/CD GitHub Actions
12. Performance audit Lighthouse

---

**Status Global**: ⚠️ 60% production-ready
**Bloquants**: 4 critiques à corriger
**ETA prod-ready**: 2-3 jours (si focus bloquants)
