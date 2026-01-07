# 🔐 Identifiants de Connexion - Smart Food Manager

**Date:** 04 Janvier 2026
**Restaurant:** Restaurant La Bonne Bouffe
**URL App:** https://smart-food-manager-alpha.vercel.app

---

## 👨‍💼 Connexion Admin (Web)

### Interface Web - Gérant/Propriétaire

**URL:** https://smart-food-manager-alpha.vercel.app

**Identifiants:**
- **Email:** `testprod@demo.com`
- **Mot de passe:** `Test1234!`
- **Rôle:** OWNER (Propriétaire)

**Accès:**
- ✅ Dashboard complet
- ✅ Gestion produits/ingrédients
- ✅ Configuration restaurant
- ✅ Gestion utilisateurs
- ✅ Rapports financiers
- ✅ Clôture de caisse
- ✅ Toutes fonctionnalités admin

---

## 📱 Connexion Serveurs (Mobile/Tablette)

### Interface Mobile - Prise de Commande

**URL:** https://smart-food-manager-alpha.vercel.app (même URL, interface adaptée)

**Mode de connexion:** Code PIN (4 chiffres)

### Serveur 1 - Marie
- **Nom:** Marie Serveur
- **Code PIN:** `1111`
- **Rôle:** SERVER (Serveur)

### Serveur 2 - Pierre
- **Nom:** Pierre Serveur
- **Code PIN:** `2222`
- **Rôle:** SERVER (Serveur)

### Serveur 3 - Sophie
- **Nom:** Sophie Serveur
- **Code PIN:** `3333`
- **Rôle:** SERVER (Serveur)

**Accès Serveurs:**
- ✅ Prise de commande (POS)
- ✅ Gestion tables
- ✅ Encaissement
- ✅ Impression tickets
- ❌ Pas d'accès configuration
- ❌ Pas d'accès rapports financiers

---

## 🔍 Vérification des Données

### Pour vérifier dans Supabase

1. **Ouvrir SQL Editor:**
   ```
   https://supabase.com/dashboard/project/qtbdtnerpdclyqwhkcjz/sql
   ```

2. **Copier-coller le fichier:**
   ```
   VERIFICATION_DONNEES.sql
   ```

3. **Cliquer RUN**

**Tu verras:**
- Liste complète companies, users, ingredients, products
- Identifiants email + PINs
- Nombre d'éléments par catégorie
- Warnings (produits sans recette, stock faible)

---

## 📊 État Actuel des Données

### Base de Données Supabase

**Projet:** qtbdtnerpdclyqwhkcjz
**URL:** https://qtbdtnerpdclyqwhkcjz.supabase.co

#### Tables Peuplées (via SQL direct)

✅ **companies** (1 ligne)
```
ID: <UUID généré par Supabase>
Name: Restaurant La Bonne Bouffe
SIREN: 123456789
SIRET: 12345678900001
```

✅ **users** (4 lignes)
```
1. Admin - testprod@demo.com - OWNER - PIN: 1234
2. Marie Serveur - SERVER - PIN: 1111
3. Pierre Serveur - SERVER - PIN: 2222
4. Sophie Serveur - SERVER - PIN: 3333
```

✅ **ingredients** (20 lignes)
```
Viandes: Steak haché, Poulet, Merguez, Œufs, Bacon
Pain: Pain burger, Baguette, Frites, Pâtes
Fromages: Fromage burger, Mozzarella, Crème fraîche
Légumes: Tomates, Salade, Oignons, Sauce tomate, Mayo, Ketchup
Boissons: Coca-Cola, Eau
```

✅ **products** (10 lignes)
```
Burgers: Classic (8.50€), Bacon (9.50€), Poulet (8.00€)
Accompagnements: Frites (3.50€), Salade verte (4.00€)
Boissons: Coca-Cola (2.50€), Eau (1.50€)
Plats: Pizza Margherita (10.00€), Pâtes Carbonara (9.00€), Merguez Frites (7.50€)
```

#### Table Manquante (Bloquant)

❌ **app_state** (0 ligne)
```
Cette table n'existe pas encore.
C'est pourquoi l'app ne voit pas tes données.
Solution: Exécuter migrations 002 + 003
```

---

## ⚠️ État Application Web

### Ce Qui Fonctionne

✅ **Login admin:** testprod@demo.com / Test1234!
✅ **Navigation:** Toutes pages accessibles
✅ **Interface:** Design complet

### Ce Qui Ne Fonctionne PAS (Temporaire)

❌ **Produits:** Liste vide dans l'app (données en DB mais pas dans app_state)
❌ **Ingrédients:** Liste vide dans l'app
❌ **Serveurs:** Seul Admin visible (3 serveurs en DB mais pas synchro)

**Raison:** Table `app_state` manquante

**Fix:** Exécuter [IMPORT_DONNEES.md](./IMPORT_DONNEES.md) (10 min)

---

## 🚀 Prochaine Action

### Avant de pouvoir utiliser l'app

**OBLIGATOIRE - Exécuter Import Données:**

1. Ouvrir Supabase SQL Editor
2. Exécuter `002_app_state_table.sql`
3. Exécuter `003_import_data_to_app_state.sql`
4. Vider cache navigateur (`localStorage.clear()`)
5. Recharger app

**Après ça:**
- ✅ Login testprod@demo.com → Voir 10 produits, 20 ingrédients, 4 users
- ✅ Login serveur PIN 1111/2222/3333 → Prendre commandes
- ✅ Données persistées Supabase (plus de perte)

---

## 📞 Support

### Fichiers de Référence

- **[IMPORT_DONNEES.md](./IMPORT_DONNEES.md)** - Guide import urgent
- **[FIX_PERSISTENCE.md](./FIX_PERSISTENCE.md)** - Diagnostic problème
- **[TODO_PILOTE.md](./TODO_PILOTE.md)** - Checklist complète
- **[VERIFICATION_DONNEES.sql](./VERIFICATION_DONNEES.sql)** - Script vérification

### Commandes Utiles

```sql
-- Voir company_id de ton restaurant
SELECT id, name, siren FROM companies;

-- Voir tous les users avec leurs PINs
SELECT name, email, pin, role FROM users;

-- Compter données
SELECT
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM ingredients) as ingredients,
  (SELECT COUNT(*) FROM products) as products;
```

---

## 🔒 Sécurité

### ⚠️ Données de Test

**IMPORTANT:** Ces identifiants sont pour le **PILOTE UNIQUEMENT**.

**Avant production réelle:**
- [ ] Changer email admin (pas testprod@demo.com)
- [ ] Changer password (pas Test1234!)
- [ ] Générer nouveaux PINs serveurs
- [ ] Activer authentification bcrypt
- [ ] Configurer JWT_SECRET unique (pas sfm-prod-secret-2025)
- [ ] Activer RLS Supabase

**Pour l'instant (phase test):** Ces identifiants OK pour pilote.

---

## 📋 Récapitulatif

**Login Web Admin:**
```
URL: https://smart-food-manager-alpha.vercel.app
Email: testprod@demo.com
Password: Test1234!
```

**Login Mobile Serveurs:**
```
Marie: PIN 1111
Pierre: PIN 2222
Sophie: PIN 3333
```

**État:** ⚠️ Données en DB mais pas visibles dans app
**Fix:** Import app_state (10 min)
**Guide:** IMPORT_DONNEES.md
