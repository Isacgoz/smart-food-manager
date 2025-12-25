
# 🚀 Instructions de Configuration - Smart Food Manager

## ✅ Corrections Appliquées

Tous les **bloquants critiques** ont été corrigés :

1. ✅ **Fichiers .env créés** (.env + .env.example)
2. ✅ **Script SQL Supabase** (supabase-setup.sql)
3. ✅ **Auth sécurisée** (Supabase Auth intégrée dans SaaSLogin.tsx)
4. ✅ **Dépendances RN supprimées** (250 packages retirés du web)
5. ✅ **Icônes PWA générées** (8 tailles en SVG)

---

## 📝 ÉTAPES OBLIGATOIRES (15-20 minutes)

### 1. Configurer Supabase (CRITIQUE)

#### A. Créer Projet Supabase
```bash
# 1. Aller sur https://supabase.com
# 2. Cliquer "New Project"
# 3. Remplir:
#    - Name: smart-food-manager
#    - Database Password: [généré automatiquement]
#    - Region: Europe West (France/Allemagne)
# 4. Attendre ~2min (création DB)
```

#### B. Exécuter Script SQL
```bash
# 1. Supabase Dashboard → SQL Editor → New Query
# 2. Copier contenu de: supabase-setup.sql
# 3. Coller et cliquer "Run"
# 4. Vérifier: "Table app_state created" ✓
```

#### C. Récupérer Clés API
```bash
# Settings → API

# Copier:
# - Project URL: https://abcdefgh.supabase.co
# - anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### D. Configurer .env
```bash
# Ouvrir: .env
# Remplacer:

VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_ENV=development
```

**IMPORTANT**: Ne jamais commit .env (déjà dans .gitignore)

---

### 2. Installer Dépendances
```bash
npm install
```

---

### 3. Lancer Serveur Dev
```bash
npm run dev
```

**Résultat attendu**:
```
  VITE v6.2.0  ready in 432 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### 4. Tester Application

#### A. Inscription
```
1. Ouvrir http://localhost:5173
2. Cliquer "Pas de compte ? S'inscrire"
3. Remplir:
   - Nom enseigne: Mon Restaurant Test
   - Email: test@restaurant.com
   - Mot de passe: Test123!
4. Cliquer "CRÉER MON COMPTE"
```

**Ce qui se passe en coulisses**:
- ✅ Supabase Auth crée utilisateur
- ✅ Table app_state insère profil restaurant
- ✅ LocalStorage sync activé
- ✅ WebSocket temps réel connecté

#### B. Vérifier Supabase
```bash
# Dashboard Supabase → Authentication → Users
# → Vous devez voir: test@restaurant.com

# Table Editor → app_state
# → Vous devez voir: 1 ligne avec vos données JSON
```

#### C. Tester Mode Offline (PWA)
```bash
# 1. Chrome DevTools (F12) → Application → Service Workers
# 2. Vérifier: "service-worker.js" - Status: activated

# 3. Network tab → Throttling → "Offline"
# 4. Recharger page
# 5. → Page offline.html s'affiche ✓

# 6. Désactiver offline → Badge "🟢 Connexion rétablie"
```

---

## 🔐 Fonctionnement Auth Sécurisée

### Mode Supabase (Production)
```typescript
// SaaSLogin.tsx:52-94
const handleLogin = async () => {
  // 1. Auth Supabase (hashing bcrypt côté serveur)
  const { data } = await supabase.auth.signInWithPassword({
    email, password
  });

  // 2. Charger profil depuis app_state
  const profile = await supabase.from('app_state')...

  // 3. Login app
  onLogin(profile);
}
```

**Sécurité**:
- ✅ Mots de passe hashés bcrypt (Supabase)
- ✅ JWT HttpOnly cookies
- ✅ Row Level Security (RLS)
- ✅ HTTPS obligatoire (upgrade-insecure-requests)

### Mode Fallback Local (Dev sans Supabase)
```typescript
if (!supabase) {
  // Fallback localStorage simple
  // UNIQUEMENT pour dev, PAS production
}
```

**Usage**: Si .env vide, app fonctionne en mode local (comme avant)

---

## 📱 Mobile - Configuration Séparée

### Prérequis
```bash
# Installer React Native CLI
npm install -g react-native-cli

# Ou Expo CLI (recommandé)
npm install -g eas-cli
```

### Config Mobile .env
```bash
# Créer: mobile/.env

EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Installer Dépendances Mobile
```bash
cd mobile/
npm install

# iOS
cd ios && pod install && cd ..

# Lancer
npm run ios      # iOS Simulator
npm run android  # Android Emulator
```

### Tester Queue Offline
```bash
# 1. Activer mode avion (simulator)
# 2. Créer commande POS
# 3. Vérifier badge 🔴 Hors-ligne (1 en attente)
# 4. Désactiver mode avion
# 5. Notification "1 commande(s) synchronisée(s)" ✓
```

---

## 🎨 Icônes PWA Professionnelles (Optionnel)

### Option 1: Générateur en Ligne (Recommandé)
```bash
# 1. Créer logo 1024x1024 (Figma/Photoshop)
# 2. Aller sur https://realfavicongenerator.net/
# 3. Upload logo
# 4. Download package complet
# 5. Extraire dans public/icons/ (remplacer SVG)
```

### Option 2: Générer PNG avec Sharp
```bash
npm install sharp --save-dev
node scripts/generate-pwa-icons.cjs
```

**Résultat**: Icônes PNG au lieu de SVG

---

## 🧪 Tests

### Tests Unitaires
```bash
npm test
```

**Status actuel**: Infrastructure Vitest installée, 0 tests écrits

**Créer premier test**:
```bash
# shared/services/__tests__/expenses.test.ts
npm test -- expenses.test.ts
```

### Tests E2E (Futur)
```bash
npm install -D @playwright/test
npx playwright test
```

---

## 🚀 Déploiement Production

### Web - Vercel (Gratuit)
```bash
# 1. Installer CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Variables env via UI
# https://vercel.com/dashboard → Settings → Environment Variables
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_APP_ENV=production
```

**URL Résultat**: `https://smart-food-manager.vercel.app`

### Mobile - Expo EAS
```bash
# 1. Config projet
eas build:configure

# 2. Build
eas build --platform all --profile production

# 3. Submit stores
eas submit --platform ios       # TestFlight
eas submit --platform android   # Play Console
```

**Délai review**: 1-7 jours

---

## 🐛 Troubleshooting

### Erreur "Supabase not configured"
```bash
# Vérifier .env:
cat .env

# Si vide, copier depuis .env.example et remplir
```

### Service Worker non enregistré
```bash
# Vérifier console navigateur:
# → "✓ SW registered" doit s'afficher

# Si erreur 404 service-worker.js:
# Vérifier: public/service-worker.js existe
```

### Build erreurs
```bash
# Nettoyer cache
rm -rf node_modules dist .vite
npm install
npm run build
```

### Mobile - Metro bundler crash
```bash
# Reset cache
npx react-native start --reset-cache
```

---

## 📊 Checklist Validation

### Web
- [ ] ✅ .env configuré avec clés Supabase
- [ ] ✅ `npm run dev` démarre sans erreur
- [ ] ✅ Inscription fonctionne (test@restaurant.com)
- [ ] ✅ Données apparaissent dans Supabase app_state
- [ ] ✅ Service Worker activé (DevTools → Application)
- [ ] ✅ Mode offline fonctionne (page offline.html)
- [ ] ✅ Badge NetworkStatus visible
- [ ] ✅ Build production: `npm run build` OK

### Mobile
- [ ] ⚠️ mobile/.env configuré
- [ ] ⚠️ NetworkBadge intégré dans App.tsx
- [ ] ⚠️ Queue offline testée (mode avion)
- [ ] ⚠️ Build iOS/Android réussi

---

## 📚 Documentation Complète

- **Architecture**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **PWA**: [PHASE_5_PWA_COMPLETE.md](PHASE_5_PWA_COMPLETE.md)
- **Mobile Offline**: [MOBILE_OFFLINE_QUEUE_COMPLETE.md](MOBILE_OFFLINE_QUEUE_COMPLETE.md)
- **EBE Module**: [PHASE_EBE_COMPLETE.md](PHASE_EBE_COMPLETE.md)
- **Supabase Setup**: [supabase-setup.sql](supabase-setup.sql)

---

## 🆘 Support

**Issues Github**: Si problème bloquant, créer issue avec:
- Message erreur complet
- Commande exécutée
- Environnement (OS, Node version)

```bash
# Infos système
node -v
npm -v
cat .env.example  # PAS .env (secrets)
```

---

**Status**: ✅ Prêt pour configuration Supabase
**Temps estimé setup**: 15-20 minutes
**Next Step**: Configurer Supabase (étape 1)
