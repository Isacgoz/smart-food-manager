# 🔧 Fix Connexion Après Inscription - Supabase

## Problème

Après création de compte sur Supabase, impossible de se connecter immédiatement.

**Cause:** Supabase nécessite une vérification email par défaut.

---

## Solution 1: Désactiver Vérification Email (DEV uniquement)

### Via Dashboard Supabase

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. **Authentication** → **Settings** → **Email Auth**
4. Décocher **"Enable email confirmations"**
5. Sauvegarder

**✅ Connexion immédiate après inscription**

---

## Solution 2: Auto-Confirm via SQL (Alternative)

Si vous voulez garder la vérification email mais auto-confirmer certains comptes:

```sql
-- Créer fonction pour auto-confirm nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirmer uniquement en environnement dev
  IF current_setting('app.environment', true) = 'development' THEN
    NEW.email_confirmed_at = NOW();
    NEW.confirmed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur création utilisateur
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_user();
```

**Configurer variable environnement:**
```sql
ALTER DATABASE postgres SET app.environment = 'development';
```

---

## Solution 3: Template Email Custom (PROD)

Pour production, configurer un vrai email de confirmation:

1. **Authentication** → **Email Templates**
2. Modifier template "Confirm signup"
3. URL de confirmation: `{{ .ConfirmationURL }}`

**Exemple template:**
```html
<h2>Bienvenue sur Smart Food Manager!</h2>
<p>Cliquez pour activer votre compte:</p>
<a href="{{ .ConfirmationURL }}">ACTIVER MON COMPTE</a>
```

---

## Code Modifié (SaaSLogin.tsx)

### Changements Appliqués

**1. Ajout compte Admin par défaut (PIN 1234)**
```typescript
const initialState = {
  restaurant: profile,
  users: [{
    id: '1',
    name: 'Admin',
    pin: '1234',
    pinHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    role: 'OWNER'
  }],
  // ... reste des données
};
```

**2. Utilisation upsert au lieu de insert**
```typescript
const { error: insertError } = await supabase
  .from('app_state')
  .upsert({ id: data.user.id, data: initialState }, { onConflict: 'id' });
```

**Pourquoi:** Évite erreurs si le compte existe déjà (re-tentatives)

**3. Sauvegarde locale fallback**
```typescript
localStorage.setItem(SAAS_DB_KEY, JSON.stringify(updatedAccounts));
```

**Pourquoi:** Permet connexion même si Supabase inaccessible

---

## Vérifier Configuration Actuelle

### Via SQL Editor Supabase

```sql
-- Voir config auth
SELECT
  key,
  value
FROM auth.config
WHERE key IN ('enable_signup', 'enable_email_autoconfirm');
```

**Résultat attendu (DEV):**
```
enable_signup              | true
enable_email_autoconfirm   | true  ← Important!
```

---

## Tester Inscription Complète

### Étape 1: Créer Compte
```
Email: test@demo.com
Mot de passe: Demo1234!
Nom restaurant: Restaurant Test
```

### Étape 2: Vérifier Logs Console
```javascript
// Devrait afficher
[REGISTER] User created: {id: "xxx", email: "test@demo.com"}
[REGISTER] Profile saved successfully
```

### Étape 3: Login Immédiat
- Pas besoin de vérifier email
- Login direct avec test@demo.com / Demo1234!
- Puis login PIN: Admin / 1234

---

## Erreurs Courantes

### "Email not confirmed"
**Fix:** Désactiver email confirmations (Solution 1)

### "duplicate key value violates unique constraint"
**Fix:** Code utilise maintenant `upsert` au lieu de `insert`

### "Failed to create profile"
**Vérifier:**
1. Table `app_state` existe
2. RLS activées correctement
3. User a les permissions insert

```sql
-- Vérifier permissions
SELECT * FROM pg_policies WHERE tablename = 'app_state';
```

---

## Mode Production

**⚠️ IMPORTANT:** En production, TOUJOURS activer:

1. ✅ Email confirmations
2. ✅ Password strength (min 8 chars)
3. ✅ Rate limiting (max 5 tentatives/minute)
4. ✅ CAPTCHA sur inscription

**Configuration recommandée:**
```
Authentication → Settings:
- Enable email confirmations: ✓
- Minimum password length: 8
- Enable CAPTCHA: ✓ (Cloudflare Turnstile)
- Enable email rate limiting: ✓
```

---

## Commandes Utiles

### Réinitialiser utilisateur test
```sql
-- Supprimer utilisateur Supabase
DELETE FROM auth.users WHERE email = 'test@demo.com';

-- Supprimer données app
DELETE FROM app_state WHERE id = 'xxx-user-id';
```

### Confirmer manuellement un compte
```sql
UPDATE auth.users
SET
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email = 'test@demo.com';
```

---

## Résumé Modifications

✅ **Module Backup supprimé** (pas utile avec Supabase)
✅ **Auto-login après inscription** (même en dev)
✅ **Compte Admin PIN 1234** créé automatiquement
✅ **Fallback localStorage** si Supabase down
✅ **Upsert** au lieu insert (évite erreurs duplicata)

**Résultat:** Inscription → Connexion immédiate → Login PIN 1234 → App prête! 🎉
