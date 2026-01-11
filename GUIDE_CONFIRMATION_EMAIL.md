# 📧 GUIDE CONFIGURATION EMAIL CONFIRMATION

**Compte:** testprod@demo.com
**Date:** 10 Janvier 2026, 14:30

---

## 🎯 OBJECTIF

Configurer Supabase pour envoyer automatiquement un email de confirmation lors de la création du compte `testprod@demo.com`.

---

## ÉTAPE 1: CONFIGURER SUPABASE EMAIL

### Option A: Email Supabase natif (Recommandé pour tests)

1. **Aller sur Supabase Dashboard**
   - https://supabase.com/dashboard
   - Sélectionner votre projet

2. **Settings → Authentication**
   - Scroll jusqu'à "Email Auth Settings"
   - **Activer** "Enable Email Confirmations"
   - **Activer** "Secure Email Change"

3. **Configurer URL de redirection**
   - Dans "Site URL": `https://smart-food-manager.vercel.app`
   - Dans "Redirect URLs": Ajouter
     ```
     https://smart-food-manager.vercel.app/auth/callback
     https://smart-food-manager.vercel.app
     http://localhost:5173/auth/callback
     http://localhost:5173
     ```

4. **Email Templates (optionnel)**
   - Settings → Authentication → Email Templates
   - Personnaliser template "Confirm Signup"

---

### Option B: SMTP Custom (Production recommandé)

Si vous voulez utiliser votre propre serveur email:

1. **Settings → Authentication → SMTP Settings**

2. **Configurer SMTP**
   ```
   SMTP Host: smtp.gmail.com (exemple Gmail)
   SMTP Port: 587
   SMTP User: votre-email@gmail.com
   SMTP Password: [App Password Gmail]
   Sender Email: noreply@votredomaine.com
   Sender Name: Smart Food Manager
   ```

3. **Gmail App Password** (si Gmail)
   - Aller sur https://myaccount.google.com/security
   - "2-Step Verification" → "App passwords"
   - Générer mot de passe pour "Mail"
   - Copier dans SMTP Password

4. **Test SMTP**
   - Bouton "Send Test Email" dans Dashboard

---

## ÉTAPE 2: CRÉER LE COMPTE AVEC CONFIRMATION

### Via SQL (Recommandé)

1. **Exécuter script SQL**
   - Ouvrir Supabase Dashboard → SQL Editor
   - Copier contenu de `fix-login-production.sql`
   - Exécuter

2. **Récupérer UUID**
   ```sql
   SELECT id, email, confirmation_token
   FROM auth.users
   WHERE email = 'testprod@demo.com';
   ```

3. **Remplacer USER_ID_ICI**
   - Dans la 2ème partie du script SQL
   - Remplacer `USER_ID_ICI` par l'UUID copié
   - Exécuter

---

### Via API Supabase (Alternative)

```javascript
// Dans Console navigateur (DevTools)
const { data, error } = await supabase.auth.signUp({
  email: 'testprod@demo.com',
  password: 'TestProd2026!',
  options: {
    data: {
      restaurant_name: 'Restaurant Demo Production',
      plan: 'BUSINESS'
    },
    emailRedirectTo: 'https://smart-food-manager.vercel.app/auth/callback'
  }
});

console.log('Signup result:', data, error);
```

---

## ÉTAPE 3: VÉRIFIER L'EMAIL DE CONFIRMATION

### Email reçu devrait contenir:

```
Sujet: Confirm Your Email Address

Bonjour,

Merci de vous être inscrit sur Smart Food Manager.

Pour activer votre compte, veuillez cliquer sur le lien ci-dessous:

[Confirmer mon email]

Ce lien expire dans 24 heures.

---
Smart Food Manager
```

---

## ÉTAPE 4: GÉRER LA REDIRECTION APRÈS CONFIRMATION

### Créer page callback

Créer [pages/AuthCallback.tsx](pages/AuthCallback.tsx):

```typescript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../shared/services/storage';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase gère automatiquement le token dans l'URL
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          setStatus('success');
          // Récupérer profil restaurant
          const profile = await loadRestaurantProfile(session.user.id);

          // Sauvegarder en localStorage
          localStorage.setItem('restaurant_profile', JSON.stringify(profile));

          // Rediriger vers dashboard
          setTimeout(() => navigate('/dashboard'), 2000);
        } else {
          throw new Error('No session found');
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Confirmation de votre email...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Email confirmé!</h1>
          <p className="text-gray-600">Redirection vers le dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
      <div className="text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Erreur de confirmation</h1>
        <p className="text-gray-600">Redirection vers la page de connexion...</p>
      </div>
    </div>
  );
}

async function loadRestaurantProfile(userId: string) {
  // Charger depuis Supabase app_state
  const { data, error } = await supabase
    .from('app_state')
    .select('data')
    .eq('id', userId)
    .single();

  if (error) throw error;

  return data.data.restaurant;
}
```

---

### Ajouter route dans App.tsx

```typescript
import AuthCallback from './pages/AuthCallback';

// Dans le router
<Route path="/auth/callback" element={<AuthCallback />} />
```

---

## ÉTAPE 5: TESTER LE FLOW COMPLET

### Test 1: Création compte

1. Exécuter `fix-login-production.sql` dans Supabase SQL Editor
2. Vérifier email reçu à `testprod@demo.com`

### Test 2: Confirmation email

1. Cliquer lien dans email
2. Vérifier redirection vers `/auth/callback`
3. Vérifier redirection finale vers `/dashboard`

### Test 3: Connexion après confirmation

1. Aller sur page login
2. Email: `testprod@demo.com`
3. Mot de passe: `TestProd2026!`
4. Devrait se connecter directement

---

## ÉTAPE 6: VÉRIFICATION MANUELLE (SI NÉCESSAIRE)

Si l'email n'est pas reçu ou pour tests rapides:

```sql
-- Confirmer email manuellement
UPDATE auth.users
SET
  email_confirmed_at = NOW(),
  confirmation_token = ''
WHERE email = 'testprod@demo.com';

-- Vérifier statut
SELECT
  id,
  email,
  email_confirmed_at,
  CASE
    WHEN email_confirmed_at IS NULL THEN '❌ NON confirmé'
    ELSE '✅ Confirmé'
  END as status
FROM auth.users
WHERE email = 'testprod@demo.com';
```

---

## DÉPANNAGE

### Email non reçu

1. **Vérifier spam/indésirables**
2. **Vérifier SMTP configuré**
   - Supabase Dashboard → Settings → Authentication → SMTP
3. **Vérifier logs Supabase**
   - Dashboard → Logs → Auth Logs
4. **Tester envoi manuel**
   ```sql
   -- Régénérer token et renvoyer email
   UPDATE auth.users
   SET
     confirmation_token = encode(gen_random_bytes(32), 'hex'),
     confirmation_sent_at = NOW()
   WHERE email = 'testprod@demo.com';
   ```

### Lien expiré

```sql
-- Réinitialiser expiration (valide 24h de plus)
UPDATE auth.users
SET confirmation_sent_at = NOW()
WHERE email = 'testprod@demo.com';
```

### Erreur callback

1. Vérifier URL redirection dans Supabase
2. Vérifier route `/auth/callback` existe dans App.tsx
3. Vérifier console navigateur pour erreurs

---

## CHECKLIST FINALE

Avant de considérer terminé:

- [ ] Supabase "Enable Email Confirmations" activé
- [ ] SMTP configuré (natif ou custom)
- [ ] URL redirection configurées dans Supabase
- [ ] Script SQL `fix-login-production.sql` exécuté
- [ ] UUID remplacé dans 2ème partie du script
- [ ] Page `AuthCallback.tsx` créée
- [ ] Route `/auth/callback` ajoutée dans App.tsx
- [ ] Email de confirmation reçu
- [ ] Lien cliqué et email confirmé
- [ ] Connexion testée avec testprod@demo.com

---

## RÉSUMÉ

**Identifiants:**
- Email: `testprod@demo.com`
- Mot de passe: `TestProd2026!`
- PIN Admin: `1234`

**Flow complet:**
1. Exécuter SQL → Compte créé (email NON confirmé)
2. Email envoyé automatiquement par Supabase
3. Clic lien → Redirection `/auth/callback`
4. Email confirmé → Redirection `/dashboard`
5. Connexion possible avec email/password

**Fichiers:**
- `fix-login-production.sql` (création compte)
- `pages/AuthCallback.tsx` (gestion redirection)
- `GUIDE_CONFIRMATION_EMAIL.md` (ce fichier)
