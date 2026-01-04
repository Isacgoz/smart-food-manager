# 📋 TODO Liste - Mise en Production Pilote Restaurant

**Date création:** 02 Janvier 2026
**Objectif:** App prête pour premier restaurant pilote
**Durée estimée:** 2-3 heures
**Statut:** ⏳ À faire de ton côté

---

## 🔴 PHASE 1 : Configuration Légale (30 min)

### ✅ Task 1.1 : Récupérer Informations Légales Restaurant

**Avant de commencer, rassemble ces informations :**

- [ ] Raison sociale exacte (ex: "SARL La Bonne Bouffe")
- [ ] Nom commercial (ex: "Restaurant La Bonne Bouffe")
- [ ] SIREN (9 chiffres) : `___________`
- [ ] SIRET (14 chiffres) : `______________`
- [ ] Numéro TVA intracommunautaire : `FR____________`
- [ ] Adresse complète : `_________________________`
- [ ] Code postal : `_____`
- [ ] Ville : `_____________`
- [ ] Téléphone : `__ __ __ __ __`
- [ ] Email contact : `_____________________`

---

### ✅ Task 1.2 : Mettre à Jour Base de Données Supabase

**Étapes :**

1. [ ] Ouvrir https://supabase.com/dashboard
2. [ ] Sélectionner projet `qtbdtnerpdclyqwhkcjz`
3. [ ] Menu **SQL Editor** → **New query**
4. [ ] Copier-coller ce SQL (REMPLACER les valeurs `XXX` par tes vraies données) :

```sql
-- Mettre à jour avec VRAIES données légales
UPDATE companies
SET
  legal_name = 'XXX - Ta raison sociale',
  siren = 'XXX - Ton SIREN 9 chiffres',
  siret = 'XXX - Ton SIRET 14 chiffres',
  vat_number = 'XXX - Ton numéro TVA',
  address = 'XXX - Ton adresse complète',
  postal_code = 'XXX - Code postal',
  city = 'XXX - Ville',
  phone = 'XXX - Téléphone',
  email = 'XXX - Email contact'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Vérifier mise à jour
SELECT name, siren, siret, address FROM companies;
```

5. [ ] Cliquer **Run**
6. [ ] Vérifier résultat : tu dois voir tes nouvelles données

**✅ Validation :** SIREN/SIRET corrects affichés dans résultat SQL

---

## 🟠 PHASE 2 : Création Catalogue Produits (1-2h)

### ✅ Task 2.1 : Créer Ingrédients de Base (30 min)

**Ouvrir l'app web :** https://smart-food-manager-alpha.vercel.app

**Login admin :**
- Email : `testprod@demo.com`
- Password : `Test1234!`

**Menu → Gestion Stocks → Ajouter Ingrédients**

**Liste minimum 15-20 ingrédients :**

#### Viandes & Protéines
- [ ] Steak haché (kg) - Stock: 10kg - Prix moyen: 12.00€/kg
- [ ] Poulet blanc (kg) - Stock: 8kg - Prix moyen: 8.50€/kg
- [ ] Merguez (piece) - Stock: 50 - Prix moyen: 0.80€/piece
- [ ] Œufs (piece) - Stock: 60 - Prix moyen: 0.25€/piece
- [ ] Bacon (kg) - Stock: 2kg - Prix moyen: 15.00€/kg

#### Pain & Féculents
- [ ] Pain burger (piece) - Stock: 100 - Prix moyen: 0.40€/piece
- [ ] Pain baguette (piece) - Stock: 30 - Prix moyen: 1.20€/piece
- [ ] Frites surgelées (kg) - Stock: 20kg - Prix moyen: 2.50€/kg
- [ ] Pâtes (kg) - Stock: 5kg - Prix moyen: 1.80€/kg

#### Fromages & Laitages
- [ ] Fromage burger (piece) - Stock: 80 - Prix moyen: 0.30€/piece
- [ ] Mozzarella (kg) - Stock: 3kg - Prix moyen: 12.00€/kg
- [ ] Crème fraîche (L) - Stock: 2L - Prix moyen: 3.50€/L

#### Légumes & Sauces
- [ ] Tomates (kg) - Stock: 5kg - Prix moyen: 3.00€/kg
- [ ] Salade (piece) - Stock: 10 - Prix moyen: 1.50€/piece
- [ ] Oignons (kg) - Stock: 3kg - Prix moyen: 2.00€/kg
- [ ] Sauce tomate (L) - Stock: 4L - Prix moyen: 2.50€/L
- [ ] Mayonnaise (L) - Stock: 2L - Prix moyen: 4.00€/L
- [ ] Ketchup (L) - Stock: 2L - Prix moyen: 3.50€/L

#### Boissons
- [ ] Coca-Cola 33cl (piece) - Stock: 100 - Prix moyen: 0.50€/piece
- [ ] Eau 50cl (piece) - Stock: 80 - Prix moyen: 0.30€/piece

**✅ Validation :** Minimum 15 ingrédients créés avec stock > 0

---

### ✅ Task 2.2 : Créer Produits avec Recettes (45 min)

**Menu → Produits & Recettes → Ajouter Produit**

**Liste minimum 10-15 produits :**

#### 🍔 Burgers (Catégorie: Burgers)

**Produit 1 : Burger Classic**
- [ ] Nom : Burger Classic
- [ ] Catégorie : Burgers
- [ ] Prix vente TTC : 8.50€
- [ ] TVA : 10%
- [ ] Recette :
  - Pain burger : 1 piece
  - Steak haché : 0.150 kg (150g)
  - Fromage burger : 1 piece
  - Tomates : 0.050 kg (50g)
  - Salade : 0.1 piece
  - Sauce (au choix) : 0.020 L (20ml)

**Produit 2 : Burger Bacon**
- [ ] Nom : Burger Bacon
- [ ] Prix : 9.50€
- [ ] TVA : 10%
- [ ] Recette :
  - Pain burger : 1
  - Steak haché : 0.150 kg
  - Fromage : 2 pieces
  - Bacon : 0.050 kg
  - Tomates : 0.050 kg
  - Sauce : 0.020 L

**Produit 3 : Burger Poulet**
- [ ] Nom : Burger Poulet
- [ ] Prix : 8.00€
- [ ] Recette : (même structure, adapter ingrédients)

#### 🍟 Accompagnements (Catégorie: Accompagnements)

**Produit 4 : Frites**
- [ ] Nom : Frites
- [ ] Prix : 3.50€
- [ ] TVA : 10%
- [ ] Recette :
  - Frites surgelées : 0.200 kg (200g)

**Produit 5 : Salade**
- [ ] Nom : Salade verte
- [ ] Prix : 4.00€
- [ ] Recette : (composer avec légumes dispo)

#### 🥤 Boissons (Catégorie: Boissons)

**Produit 6 : Coca-Cola**
- [ ] Nom : Coca-Cola 33cl
- [ ] Prix : 2.50€
- [ ] TVA : 10%
- [ ] Recette :
  - Coca-Cola 33cl : 1 piece

**Produit 7 : Eau**
- [ ] Nom : Eau 50cl
- [ ] Prix : 1.50€
- [ ] Recette :
  - Eau 50cl : 1 piece

#### 🍕 Plats (Catégorie: Plats)

**Produit 8 : Pizza Margherita** (si tu fais pizzas)
- [ ] Nom : Pizza Margherita
- [ ] Prix : 10.00€
- [ ] Recette : (adapter selon ingrédients)

**Produits 9-15 :** Ajouter selon ton menu réel
- [ ] Produit 9 : ______________
- [ ] Produit 10 : ______________
- [ ] Produit 11 : ______________
- [ ] Produit 12 : ______________
- [ ] Produit 13 : ______________
- [ ] Produit 14 : ______________
- [ ] Produit 15 : ______________

**✅ Validation :** Minimum 10 produits avec recettes complètes

---

### ✅ Task 2.3 : Upload Images Produits (30 min)

**Pour chaque produit créé :**

#### Méthode 1 : Prendre Photos (Recommandé)
1. [ ] Prendre photo produit réel avec smartphone
2. [ ] Transférer sur ordinateur
3. [ ] Menu → Produits → Modifier produit → Upload image

#### Méthode 2 : Images Stock (Temporaire)
1. [ ] Télécharger images gratuites sur https://unsplash.com
2. [ ] Rechercher : "burger", "fries", "pizza", etc.
3. [ ] Télécharger résolution moyenne (800x800px suffisant)
4. [ ] Upload dans app

**Images à uploader :**
- [ ] Image Burger Classic
- [ ] Image Burger Bacon
- [ ] Image Burger Poulet
- [ ] Image Frites
- [ ] Image Salade
- [ ] Image Coca-Cola
- [ ] Image Eau
- [ ] Image Pizza (si applicable)
- [ ] Images autres produits

**✅ Validation :** Toutes les photos visibles dans menu POS

---

## 🟢 PHASE 3 : Création Utilisateurs Serveurs (15 min)

### ✅ Task 3.1 : Créer Comptes Serveurs

**Menu → Équipe → Ajouter Utilisateur**

**Serveur 1 :**
- [ ] Nom : `_______________` (Prénom Nom serveur 1)
- [ ] Rôle : SERVER
- [ ] PIN : `____` (4 chiffres faciles à retenir, ex: 1111)
- [ ] Email : Laisser vide
- [ ] Password : Laisser vide

**Serveur 2 :**
- [ ] Nom : `_______________` (Prénom Nom serveur 2)
- [ ] Rôle : SERVER
- [ ] PIN : `____` (ex: 2222)

**Serveur 3 :** (optionnel)
- [ ] Nom : `_______________`
- [ ] Rôle : SERVER
- [ ] PIN : `____` (ex: 3333)

**Manager :** (si tu veux un gérant)
- [ ] Nom : `_______________`
- [ ] Rôle : MANAGER
- [ ] Email : `_______________@restaurant.fr`
- [ ] Password : (choisir fort)
- [ ] PIN : `____` (ex: 9999)

**✅ Validation :** Minimum 2 serveurs créés avec PIN différents

---

### ✅ Task 3.2 : Tester Login Serveurs

**Sur ton ordinateur :**

1. [ ] Ouvrir https://smart-food-manager-alpha.vercel.app
2. [ ] Login avec PIN Serveur 1
3. [ ] Vérifier accès modules : POS, Cuisine, Tables uniquement
4. [ ] Logout
5. [ ] Login avec PIN Serveur 2
6. [ ] Vérifier accès identique

**✅ Validation :** Login PIN fonctionne pour tous les serveurs

---

## 🔵 PHASE 4 : Installation Mobile Serveurs (10 min)

### ✅ Task 4.1 : Installer PWA sur Téléphones

**Sur chaque téléphone serveur (Android) :**

1. [ ] Ouvrir **Google Chrome**
2. [ ] Aller sur : `https://smart-food-manager-alpha.vercel.app`
3. [ ] Menu Chrome (3 points en haut à droite)
4. [ ] Cliquer **"Ajouter à l'écran d'accueil"**
5. [ ] Nommer : "Smart Food"
6. [ ] Confirmer
7. [ ] Vérifier icône apparue sur écran d'accueil
8. [ ] Ouvrir l'app depuis icône
9. [ ] Tester login avec PIN serveur

**Sur iPhone (si applicable) :**

1. [ ] Ouvrir **Safari** (PAS Chrome)
2. [ ] Aller sur URL production
3. [ ] Bouton Partage (carré avec flèche)
4. [ ] **"Sur l'écran d'accueil"**
5. [ ] Nommer "Smart Food"
6. [ ] Confirmer

**Téléphones à installer :**
- [ ] Téléphone Serveur 1 : `_______________` (nom/modèle)
- [ ] Téléphone Serveur 2 : `_______________`
- [ ] Téléphone Serveur 3 : `_______________` (optionnel)

**✅ Validation :** App installée sur minimum 2 téléphones

---

## 🟣 PHASE 5 : Tests Workflow Complet (30 min)

### ✅ Task 5.1 : Test Commande Complète

**Sur mobile serveur :**

1. [ ] Ouvrir app "Smart Food"
2. [ ] Login PIN serveur
3. [ ] Module **POS** (Caisse)
4. [ ] Créer nouvelle commande
5. [ ] Ajouter produits :
   - [ ] 1x Burger Classic
   - [ ] 1x Frites
   - [ ] 1x Coca-Cola
6. [ ] Ajouter note : "Sans oignon"
7. [ ] Sélectionner Table : "Table 1"
8. [ ] **Valider commande**
9. [ ] Vérifier total : ~14.50€
10. [ ] **Payer** → Espèces
11. [ ] Confirmer paiement

**✅ Validation :** Commande apparaît dans historique factures

---

### ✅ Task 5.2 : Vérifier Déstockage Automatique

**Sur ordinateur admin :**

1. [ ] Login admin : `testprod@demo.com`
2. [ ] Module **Gestion Stocks**
3. [ ] Vérifier ingrédients utilisés ont diminué :
   - [ ] Pain burger : -1 piece
   - [ ] Steak haché : -0.150 kg
   - [ ] Frites : -0.200 kg
   - [ ] Coca : -1 piece
4. [ ] Module **Dashboard**
5. [ ] Vérifier chiffre affaires : 14.50€
6. [ ] Vérifier coût matière calculé automatiquement

**✅ Validation :** Stock diminue automatiquement après vente

---

### ✅ Task 5.3 : Test Clôture Caisse (Z)

**Sur ordinateur admin :**

1. [ ] Module **Clôture de Caisse**
2. [ ] Cliquer **Ouvrir Session**
3. [ ] Fonds caisse initial : `50.00€`
4. [ ] Confirmer ouverture
5. [ ] Faire 2-3 commandes test depuis mobile
6. [ ] Retour module Clôture Caisse
7. [ ] Cliquer **Clôturer Session**
8. [ ] Compter espèces : (fonds initial + ventes)
9. [ ] Saisir montant réel
10. [ ] Cliquer **Clôturer & Imprimer Z**
11. [ ] Vérifier rapport affiché :
    - [ ] CA total
    - [ ] Espèces vs CB
    - [ ] Écart caisse

**✅ Validation :** Rapport Z généré avec CA correct

---

### ✅ Task 5.4 : Test Ticket Cuisine (Optionnel)

**Si tu as imprimante thermique réseau :**

1. [ ] Trouver adresse IP imprimante : `_______________`
2. [ ] Vercel Dashboard → Settings → Environment Variables
3. [ ] Ajouter : `VITE_PRINTER_IP = 192.168.X.X`
4. [ ] Redéployer app
5. [ ] Créer commande test
6. [ ] Vérifier ticket imprimé automatiquement

**Si pas d'imprimante :**
- [ ] Vérifier fallback navigateur fonctionne (window.print)
- [ ] Ticket s'affiche dans nouvelle fenêtre

**✅ Validation :** Ticket lisible (imprimé ou écran)

---

## 🎯 PHASE 6 : Formation Équipe (30 min)

### ✅ Task 6.1 : Former Serveurs

**Montrer à chaque serveur :**

- [ ] Comment ouvrir l'app (icône écran accueil)
- [ ] Comment se connecter (PIN 4 chiffres)
- [ ] Comment créer commande :
  - Sélectionner produits
  - Ajouter quantité
  - Ajouter note client
  - Choisir table
  - Valider commande
- [ ] Comment encaisser :
  - Espèces
  - Carte bancaire
- [ ] Comment voir historique commandes
- [ ] Comment se déconnecter (auto après 2 min inactivité)

**Document aide-mémoire serveurs :**
- [ ] Créer fiche A4 plastifiée :
  ```
  SMART FOOD - SERVEURS

  1. Login : PIN 4 chiffres
  2. POS → Nouvelle commande
  3. Ajouter produits
  4. Note client (optionnel)
  5. Choisir table
  6. VALIDER
  7. Encaisser → Espèces ou CB
  8. Confirmer

  Support : [Ton numéro]
  ```

**✅ Validation :** Chaque serveur a fait 1 commande test seul

---

### ✅ Task 6.2 : Former Gérant/Manager

**Modules à montrer :**

- [ ] Dashboard (chiffres clés)
- [ ] Historique factures (export CSV)
- [ ] Gestion stocks (alertes, inventaire)
- [ ] Achats fournisseurs (bon réception, PMP)
- [ ] Clôture caisse quotidienne (Z)
- [ ] Gestion équipe (ajouter/supprimer serveurs)
- [ ] Modifier produits/prix

**✅ Validation :** Manager autonome sur opérations quotidiennes

---

## 📊 CHECKLIST FINALE - Validation Production

### Technique
- [ ] ✅ App web accessible : https://smart-food-manager-alpha.vercel.app
- [ ] ✅ App mobile installée sur minimum 2 téléphones
- [ ] ✅ Login admin fonctionne
- [ ] ✅ Login PIN serveurs fonctionne
- [ ] ✅ Variables env Vercel configurées (4/4)
- [ ] ✅ Supabase RLS actif multi-tenant

### Données Métier
- [ ] ✅ SIREN/SIRET restaurant renseignés
- [ ] ✅ Minimum 15 ingrédients créés avec stock
- [ ] ✅ Minimum 10 produits avec recettes
- [ ] ✅ Images produits uploadées
- [ ] ✅ Minimum 2 serveurs créés avec PIN
- [ ] ✅ TVA configurée (10% par défaut)

### Tests Fonctionnels
- [ ] ✅ Commande POS → déstockage auto vérifié
- [ ] ✅ Stock négatif alerte fonctionnelle
- [ ] ✅ Calcul marges automatique
- [ ] ✅ Clôture caisse Z testée
- [ ] ✅ Ticket cuisine imprimé (ou fallback)
- [ ] ✅ Facture NF525 complète (SIREN visible)

### Formation
- [ ] ✅ Serveurs formés (minimum 1 commande test chacun)
- [ ] ✅ Gérant formé modules principaux
- [ ] ✅ Fiche aide-mémoire créée

### Backup & Sécurité
- [ ] ✅ JWT_SECRET changé pour production
- [ ] ✅ Backup manuel Supabase (Export SQL initial)
- [ ] ✅ Numéro support renseigné

---

## 🚀 LANCEMENT PILOTE

**Quand toutes les cases sont cochées ✅ ci-dessus :**

### Jour J-1 (Veille lancement)
- [ ] Vérifier stocks ingrédients suffisants
- [ ] Charger téléphones serveurs 100%
- [ ] Tester connexion WiFi restaurant
- [ ] Backup final base données

### Jour J (Premier service)
- [ ] Ouvrir session caisse (fonds initial)
- [ ] Briefing équipe 10 min
- [ ] Première commande test admin
- [ ] Lancer service réel

### Jour J+1 (Lendemain)
- [ ] Vérifier clôture Z correcte
- [ ] Analyser écarts caisse
- [ ] Vérifier stocks cohérents
- [ ] Recueillir feedback serveurs

---

## 📞 Support & Contacts

**En cas de problème technique :**
- Supabase Dashboard : https://supabase.com/dashboard
- Vercel Dashboard : https://vercel.com/dashboard
- Documentation : Voir `PRODUCTION_READY.md`

**Contact développeur :**
- Email : `_______________`
- Téléphone : `_______________`
- Disponibilité : `_______________`

---

## 📈 Métriques Succès Pilote (30 jours)

**Objectifs mesurables :**
- [ ] 500+ commandes traitées
- [ ] <5% écarts caisse quotidiens
- [ ] 0 perte de données
- [ ] Temps moyen commande <2 min
- [ ] Satisfaction serveurs >7/10
- [ ] Marges calculées précises ±2%

**Si atteint → Passage production complète + autres restaurants**

---

**BONNE CHANCE POUR TON PILOTE ! 🎉**

*Dernière mise à jour : 02 Janvier 2026*
