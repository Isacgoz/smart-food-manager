# 🚀 Guide Déploiement Vercel

## Méthode 1: Via Dashboard Vercel (Recommandé)

### Étape 1: Connecter GitHub
1. Aller sur https://vercel.com/new
2. Se connecter avec GitHub
3. Importer projet: `Isacgoz/smart-food-manager`

### Étape 2: Configuration Build
Vercel détecte automatiquement Vite:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Étape 3: Variables d'Environnement
Ajouter dans Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_APP_ENV=production
```

**IMPORTANT**: Remplacer par vos vraies clés Supabase

### Étape 4: Déployer
Cliquer **Deploy** → Attendre 2-3 min

---

## Méthode 2: Via CLI Vercel

### Installation
```bash
npm install -g vercel
# OU
npx vercel
```

### Login
```bash
vercel login
```

### Déployer
```bash
cd "/Users/isacelgozmir/Downloads/smart-food-manager (6)"

# Preview deployment
vercel

# Production deployment
vercel --prod
```

---

## Configuration Supabase (Obligatoire)

### Créer projet Supabase
1. https://supabase.com/dashboard
2. New Project
3. Nom: `smart-food-manager`
4. Region: `West Europe (Frankfurt)`

### Exécuter SQL Setup
1. SQL Editor → New Query
2. Copier contenu de `supabase-setup.sql`
3. Run

### Récupérer clés
1. Settings → API
2. Copier:
   - **URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGciOi...`

### Ajouter dans Vercel
Settings → Environment Variables:
- `VITE_SUPABASE_URL` = URL copiée
- `VITE_SUPABASE_ANON_KEY` = anon key copiée

---

## Vérifications Post-Déploiement

### 1. Build réussi
✅ Bundle: ~87KB gzippé
✅ Chunks: 6 fichiers séparés

### 2. App accessible
- Tester URL production
- Vérifier PWA installable
- Tester mode offline

### 3. Auth fonctionnelle
- Créer compte restaurant
- Login/Logout
- Vérifier isolation données

### 4. Performance
```bash
# Lighthouse audit
npx lighthouse https://votre-app.vercel.app --view
```

**Objectifs:**
- Performance: >90
- PWA: 100
- Accessibility: >95

---

## Domaine Custom (Optionnel)

### Ajouter domaine
1. Vercel Dashboard → Settings → Domains
2. Add Domain: `smart-food.fr`
3. Configurer DNS:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

---

## Troubleshooting

### Build échoue
```bash
# Tester localement
npm run build
npm run preview
```

### Variables env non chargées
- Vérifier préfixe `VITE_`
- Redéployer après modif env

### Supabase connection failed
- Vérifier SUPABASE_URL correct
- Vérifier ANON_KEY valide
- Tester SQL setup exécuté

---

## Monitoring (Recommandé)

### Sentry (Erreurs)
```bash
npm install @sentry/react
```

Configurer dans `main.tsx`:
```typescript
import * as Sentry from '@sentry/react';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: 'https://xxx@sentry.io/xxx',
    environment: 'production',
    tracesSampleRate: 0.1
  });
}
```

### Analytics (Optionnel)
- Vercel Analytics (intégré)
- PostHog
- Google Analytics

---

## URLs Utiles

- **GitHub Repo**: https://github.com/Isacgoz/smart-food-manager
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Docs Vercel**: https://vercel.com/docs

---

**Status**: Production-ready ✓
**Bundle**: 87KB gzippé
**Build time**: ~5s
