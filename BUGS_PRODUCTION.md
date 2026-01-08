# 🐛 Bugs Production - Smart Food Manager

**Dernière mise à jour:** 8 Janvier 2026 14:35

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

**Status**: ✅ Corrigé - Build passe maintenant

---

## 🔴 EN COURS: Lien "S'inscrire" ne répond pas

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

---

**Prochaines actions**:
1. Appliquer fix `type="button"`
2. Redéployer Vercel
3. Tester registration en prod
4. Valider email Supabase (ou config SMTP)
