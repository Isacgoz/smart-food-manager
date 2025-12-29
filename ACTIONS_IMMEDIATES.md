# ⚡ ACTIONS IMMÉDIATES - À Faire Maintenant

## 🎯 Objectif
Débloquer l'application en **15 minutes** pour qu'elle soit utilisable en production.

---

## ✅ ÉTAPE 1: Supabase Setup (10 min)

### A. Créer Projet
```
1. Aller sur: https://supabase.com/dashboard
2. Cliquer "New Project"
3. Remplir:
   - Name: smart-food-manager
   - Password: [GÉNÉRER ET SAUVEGARDER]
   - Region: West Europe
4. Créer
5. Attendre 2-3 min
```

### B. Exécuter SQL
```
1. Menu "SQL Editor"
2. "New query"
3. Copier TOUT le fichier: supabase-setup.sql
4. Coller et "Run"
5. Vérifier: "Success"
```

### C. Récupérer Clés
```
Settings → API → Copier:

📋 Project URL: https://xxxxx.supabase.co
📋 anon public: eyJhbGciOi... (longue clé)
```

### D. Désactiver Email Verification
```
Authentication → Providers → Email
→ DÉCOCHER "Confirm email"
→ Save
```

---

## ✅ ÉTAPE 2: Vercel Config (3 min)

```
1. https://vercel.com/dashboard
2. Projet: smart-food-manager
3. Settings → Environment Variables
4. Ajouter:
   - VITE_SUPABASE_URL = [coller URL]
   - VITE_SUPABASE_ANON_KEY = [coller clé]
5. Deployments → Redeploy
```

---

## ✅ ÉTAPE 3: Test (2 min)

```
1. https://smart-food-manager-alpha.vercel.app
2. Créer compte:
   - Email: test@demo.com
   - Password: Test1234!
3. Login PIN: Admin / 1234
4. ✅ Si tu arrives sur POS → C'EST BON!
```

---

## 🚨 Si Bloqué

### "Email not confirmed"
→ Retour Étape 1.D (désactiver email)

### "PIN incorrect"
→ Vider cache: Ctrl+Shift+Delete
→ Recréer compte

### "Failed to load"
→ Vérifier variables Vercel bien collées
→ Redeploy

---

## 📞 Contact

Si bloqué >5 min sur une étape: me montrer screenshot erreur

---

## ⏱️ Temps Total: 15 minutes

**Après ça → L'app est prête à être utilisée! 🎉**
