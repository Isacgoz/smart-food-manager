# 🚀 GUIDE CONNEXION PRODUCTION - testprod@demo.com

**Date:** 10 Janvier 2026, 14:50
**Objectif:** Configurer et tester compte production avec confirmation email

---

## ✅ FICHIERS CRÉÉS

- ✅ [fix-login-production.sql](fix-login-production.sql) - Script SQL création compte
- ✅ [pages/AuthCallback.tsx](pages/AuthCallback.tsx) - Page callback confirmation
- ✅ [GUIDE_CONFIRMATION_EMAIL.md](GUIDE_CONFIRMATION_EMAIL.md) - Documentation complète
- ✅ [App.tsx](App.tsx) - Route `/auth/callback` ajoutée
- ✅ Corrections TypeScript appliquées

---

## 📋 ACTIONS UTILISATEUR (30 min)

### ÉTAPE 1: Configurer Supabase Email (5 min)

1. **Supabase Dashboard**
   ```
   https://supabase.com/dashboard → Votre projet
   ```

2. **Settings → Authentication**
   - ✅ Activer "Enable Email Confirmations"
   - ✅ Activer "Secure Email Change"

3. **Redirect URLs** (ajouter les 4):
   ```
   https://smart-food-manager.vercel.app/auth/callback
   https://smart-food-manager.vercel.app
   http://localhost:5173/auth/callback
   http://localhost:5173
   ```

---

### ÉTAPE 2: Exécuter SQL (3 min)

1. **SQL Editor** → New query

2. **Partie 1** (lignes 1-42):
   - Copier depuis [fix-login-production.sql](fix-login-production.sql)
   - Run
   - **COPIER L'UUID retourné**

3. **Partie 2** (lignes 48-102):
   - Remplacer `USER_ID_ICI` par UUID (3 occurrences)
   - Run

4. **Vérifier:**
   ```sql
   SELECT id, email, email_confirmed_at
   FROM auth.users
   WHERE email = 'testprod@demo.com';
   ```

---

### ÉTAPE 3: Commit & Deploy (2 min)

```bash
git add App.tsx pages/AuthCallback.tsx fix-login-production.sql GUIDE_CONFIRMATION_EMAIL.md CONNEXION_PRODUCTION_GUIDE.md
git commit -m "feat(auth): email confirmation + production account

- AuthCallback page for Supabase verification
- /auth/callback route in App.tsx
- Fix backup localStorage loading
- Production SQL script (testprod@demo.com)"
git push origin main
```

**Attendre Vercel deploy** (~2 min)

---

### ÉTAPE 4: Tester Email Confirmation (1 min)

1. **Email reçu** → Cliquer lien

2. **Redirection vers:**
   ```
   https://smart-food-manager.vercel.app/auth/callback?token=...
   ```

3. **Page affiche:**
   - Spinner "Confirmation..."
   - ✅ "Email confirmé!"
   - Redirection dashboard

---

### ÉTAPE 5: Login (30 sec)

```
Email: testprod@demo.com
Mot de passe: TestProd2026!
```

✅ Dashboard accessible

---

## 🚨 DÉPANNAGE EXPRESS

### Email non reçu?
```sql
-- Renvoyer email
UPDATE auth.users
SET confirmation_token = encode(gen_random_bytes(32), 'hex'),
    confirmation_sent_at = NOW()
WHERE email = 'testprod@demo.com';
```

### Token expiré?
```sql
-- Confirmer manuellement (TESTS)
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmation_token = ''
WHERE email = 'testprod@demo.com';
```

### Page blanche callback?
- F12 → Console → Copier erreurs
- Vérifier Supabase Redirect URLs configurées

---

## 📊 CHECKLIST

- [ ] Supabase Email Confirmations activé
- [ ] 4 Redirect URLs configurées
- [ ] SQL exécuté (UUID remplacé)
- [ ] Fichiers commités et pushés
- [ ] Vercel deploy SUCCESS
- [ ] Email confirmé (clic lien)
- [ ] Login testprod@demo.com fonctionne
- [ ] Dashboard accessible

---

## 📞 RÉFÉRENCE

**Identifiants:**
- Email: `testprod@demo.com`
- Password: `TestProd2026!`
- PIN: `1234`

**Documentation complète:**
- [GUIDE_CONFIRMATION_EMAIL.md](GUIDE_CONFIRMATION_EMAIL.md)

**Fichiers:**
- [fix-login-production.sql](fix-login-production.sql)
- [pages/AuthCallback.tsx](pages/AuthCallback.tsx)
- [App.tsx](App.tsx)

---

**Dernière mise à jour:** 10 Janvier 2026, 14:50
**Status:** ✅ Prêt pour test
