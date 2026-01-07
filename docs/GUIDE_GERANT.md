# Guide Gérant - Smart Food Manager

## Table des matières

1. [Première connexion](#première-connexion)
2. [Configurer votre restaurant](#configurer-votre-restaurant)
3. [Gérer les ingrédients](#gérer-les-ingrédients)
4. [Créer des produits et recettes](#créer-des-produits-et-recettes)
5. [Gérer les fournisseurs](#gérer-les-fournisseurs)
6. [Réceptionner les commandes](#réceptionner-les-commandes)
7. [Faire un inventaire](#faire-un-inventaire)
8. [Comprendre le dashboard](#comprendre-le-dashboard)
9. [Exporter pour la comptabilité](#exporter-pour-la-comptabilité)
10. [Gérer votre équipe](#gérer-votre-équipe)
11. [Clôturer la caisse](#clôturer-la-caisse)
12. [Résoudre les problèmes courants](#résoudre-les-problèmes-courants)

---

## Première connexion

### Connexion initiale

1. **Ouvrez l'application** dans votre navigateur
2. **Page de connexion SaaS** s'affiche
3. **Entrez vos identifiants** :
   - Email : fourni lors de l'inscription
   - Mot de passe : défini lors de l'inscription
4. **Cliquez sur "Se connecter"**

### Sélection du restaurant

Si vous gérez plusieurs restaurants :
1. **Liste des restaurants** s'affiche
2. **Cliquez sur le restaurant** à gérer
3. **Application se charge** avec les données de ce restaurant

> **Note** : Les données sont isolées par restaurant. Impossible de voir les données d'un autre établissement.

---

## Configurer votre restaurant

### Informations légales

**Accédez à la configuration** :
1. Menu principal → **Paramètres**
2. Onglet **Informations légales**

**Remplissez les champs obligatoires** :
- **Nom commercial** : Nom affiché sur les tickets
- **SIREN/SIRET** : 14 chiffres (obligatoire facturation)
- **Adresse complète** : Rue, CP, Ville
- **Numéro TVA intracommunautaire** : FR + SIREN
- **Capital social** : Si société
- **Forme juridique** : SARL, SAS, EURL, etc.

> **⚠️ IMPORTANT** : Ces informations apparaîtront sur tous les tickets et factures. Vérifiez leur exactitude pour conformité fiscale.

### Configuration caisse

**Paramètres caisse** :
1. **Fonds de caisse initial** : Montant en espèces au démarrage (ex: 200€)
2. **Seuil alerte écart** : Alerte si écart > X€ (recommandé : 50€)
3. **Numérotation factures** : Préfixe (ex: "REST-2025-")

---

## Gérer les ingrédients

Les ingrédients sont la **base du système**. Chaque produit vendu consomme automatiquement des ingrédients.

### Créer un ingrédient

**Accès** : Menu → **Stock** → **Ingrédients** → Bouton **+ Ajouter**

**Formulaire** :
1. **Nom** : Ex. "Tomate fraîche"
2. **Catégorie** : Légumes, Viandes, Épicerie, etc.
3. **Unité de mesure** : kg, L, pièce
4. **Stock actuel** : Quantité en stock (calculé automatiquement après 1er achat)
5. **Stock minimum** : Seuil d'alerte (ex: 5 kg)
6. **Prix moyen (PMP)** : Calculé automatiquement après achats

**Cliquez sur "Enregistrer"**

> **💡 Astuce** : Le PMP (Prix Moyen Pondéré) est recalculé automatiquement à chaque réception fournisseur. Ne le modifiez jamais manuellement.

### Conversions d'unités

Le système gère automatiquement les conversions :
- **Achat** : sac de 25 kg
- **Stockage** : kg
- **Recette** : 150 g

**Exemple** :
- Vous achetez 1 sac de 25 kg de farine
- Stock affiché : 25 kg
- Recette Pizza utilise 0.25 kg (250g)
- Après 10 pizzas vendues : stock = 22.5 kg

### Alertes stock bas

Quand le stock passe sous le seuil minimum :
- **🔴 Pastille rouge** sur l'ingrédient
- **Notification** sur le dashboard
- **Email automatique** (si configuré)

---

## Créer des produits et recettes

Les produits sont ce que vos clients achètent. Chaque produit a une **fiche technique** (recette) qui liste les ingrédients consommés.

### Créer un produit

**Accès** : Menu → **Carte** → **Produits** → **+ Ajouter**

**Informations générales** :
1. **Nom** : "Burger Classique"
2. **Catégorie** : Plats, Boissons, Desserts
3. **Prix de vente TTC** : 12.00 €
4. **TVA** : 10% (restauration sur place) ou 5.5% (à emporter)
5. **Photo** : Cliquez pour uploader (recommandé pour serveurs)
6. **Disponible** : Coché si en vente

**Cliquez sur "Suivant : Recette"**

### Définir la recette (fiche technique)

**Cette étape est CRITIQUE** : elle détermine le déstockage automatique et le calcul des coûts.

**Ajoutez les ingrédients** :
1. **Cliquez sur "+ Ajouter un ingrédient"**
2. **Sélectionnez** l'ingrédient dans la liste
3. **Quantité** : Ex. 0.150 (pour 150g)
4. **Unité** : Doit correspondre à l'unité de stockage (kg, L, pièce)

**Exemple Burger Classique** :
```
Pain burger       : 1 pièce
Steak haché       : 0.150 kg (150g)
Fromage cheddar   : 0.030 kg (30g)
Tomate            : 0.050 kg (50g)
Salade            : 0.020 kg (20g)
Sauce burger      : 0.015 L (15ml)
```

**Le système calcule automatiquement** :
- **Coût matière** : Somme (quantité × PMP) de chaque ingrédient
- **Marge brute** : Prix vente HT - Coût matière
- **Taux de coût matière** : (Coût / Prix HT) × 100

**Indicateurs affichés** :
- ✅ **Taux < 30%** : Marge excellente
- ⚠️ **Taux 30-40%** : Marge correcte
- ❌ **Taux > 40%** : Marge insuffisante, ajuster prix ou recette

**Cliquez sur "Enregistrer"**

### Modifier une recette existante

**⚠️ ATTENTION** : Modifier une recette change les coûts futurs mais pas l'historique.

**Accès** : **Carte** → **Produits** → Cliquez sur le produit → **Modifier**

**Bon usage** :
- Changement permanent (nouveau fournisseur, nouvelle recette) : Modifier directement
- Test temporaire : Créer un nouveau produit "Burger Classique V2"

---

## Gérer les fournisseurs

### Créer un fournisseur

**Accès** : **Achats** → **Fournisseurs** → **+ Ajouter**

**Informations** :
1. **Nom** : "Boucherie Martin"
2. **Catégorie** : Viandes, Légumes, Épicerie
3. **Adresse** (optionnel)
4. **Contact** : Téléphone, email
5. **Conditions paiement** : 30 jours, comptant, etc.
6. **Notes** : Jours livraison, horaires, etc.

### Créer un article fournisseur

Les articles fournisseurs lient un **ingrédient** à un **fournisseur** avec un **prix d'achat**.

**Accès** : **Achats** → **Fournisseurs** → Cliquez sur fournisseur → Onglet **Articles**

**Formulaire** :
1. **Ingrédient** : Sélectionnez (ex: "Steak haché")
2. **Référence fournisseur** : Code produit fournisseur (optionnel)
3. **Conditionnement** : "Carton de 10 kg"
4. **Quantité par conditionnement** : 10
5. **Unité** : kg
6. **Prix d'achat HT** : 85.00 €
7. **Prix unitaire calculé** : 8.50 €/kg (automatique)

**Cliquez sur "Enregistrer"**

> **💡 Astuce** : Créez des articles fournisseurs pour tous vos ingrédients courants. Cela accélère la réception des commandes.

---

## Réceptionner les commandes

Quand vous recevez une livraison fournisseur, vous devez l'enregistrer pour **mettre à jour le stock** et **recalculer le PMP**.

### Créer une commande fournisseur (optionnel)

**Accès** : **Achats** → **Commandes** → **+ Nouvelle commande**

1. **Sélectionnez le fournisseur**
2. **Ajoutez des lignes** : Article + Quantité
3. **Statut** : "EN_ATTENTE"
4. **Enregistrez**

> **Note** : Cette étape est optionnelle. Vous pouvez créer directement une réception sans commande préalable.

### Réceptionner une livraison

**Accès** : **Achats** → **Réceptions** → **+ Nouvelle réception**

**Formulaire** :
1. **Fournisseur** : "Boucherie Martin"
2. **Date de livraison** : Aujourd'hui (par défaut)
3. **N° bon de livraison** : Numéro du BL fournisseur

**Ajoutez les articles reçus** :
1. **Cliquez "+ Ajouter ligne"**
2. **Sélectionnez l'article fournisseur** : Ex. "Steak haché (carton 10kg)"
3. **Quantité reçue** : 3 (= 3 cartons)
4. **Prix unitaire** : Pré-rempli, modifiable si prix changé
5. **Total ligne** : Calculé automatiquement

**Répétez** pour chaque ligne du bon de livraison

**Validez la réception** :
1. **Vérifiez le total HT**
2. **Cliquez "Valider la réception"**

**🎯 Ce qui se passe automatiquement** :
1. **Stock mis à jour** : Steak haché +30 kg
2. **PMP recalculé** :
   ```
   Stock avant   : 15 kg à 8.20 €/kg = 123 €
   Réception     : 30 kg à 8.50 €/kg = 255 €
   ───────────────────────────────────────────
   Stock après   : 45 kg
   Nouveau PMP   : (123 + 255) / 45 = 8.40 €/kg
   ```
3. **Coûts produits recalculés** : Tous les produits utilisant du steak haché voient leur coût matière mis à jour
4. **Mouvement de stock créé** : Traçabilité complète

---

## Faire un inventaire

L'inventaire permet de **corriger les écarts** entre le stock théorique (calculé) et le stock réel (compté).

### Quand faire un inventaire ?

**Recommandations** :
- **Minimum** : 1 fois par mois
- **Idéal** : 1 fois par semaine
- **Obligatoire** : Avant clôture comptable mensuelle

### Processus complet

**1. Créer l'inventaire**

**Accès** : **Stock** → **Inventaires** → **+ Nouvel inventaire**

**Formulaire** :
1. **Date** : Aujourd'hui
2. **Responsable** : Votre nom
3. **Type** : Complet (tous ingrédients) ou Partiel (catégorie)
4. **Cliquez "Créer"**

**2. Compter physiquement**

Prenez votre liste d'ingrédients (exportable en PDF) et comptez :
- **Pesez** les ingrédients en vrac (farine, sucre)
- **Comptez** les pièces (œufs, bouteilles)
- **Mesurez** les liquides si nécessaire

**3. Saisir les quantités réelles**

Pour chaque ingrédient :
1. **Stock théorique** : Affiché automatiquement
2. **Stock réel** : Saisissez ce que vous avez compté
3. **Écart** : Calculé automatiquement (rouge si perte, vert si gain)
4. **Motif** (si écart significatif) : Casse, vol, erreur saisie, etc.

**Exemple** :
```
Ingrédient      | Théorique | Réel  | Écart  | Motif
─────────────────────────────────────────────────────
Farine 25kg     | 47.5 kg   | 45 kg | -2.5kg | Perte normale
Tomates         | 12 kg     | 10 kg | -2 kg  | Périmées (poubelle)
Œufs            | 60 pcs    | 75 pcs| +15    | Erreur saisie réception
```

**4. Valider l'inventaire**

**Cliquez "Valider l'inventaire"**

**🎯 Ce qui se passe** :
1. **Stock ajusté** : Stock théorique = Stock réel
2. **Mouvements créés** : Type "INVENTAIRE_GAIN" ou "INVENTAIRE_LOSS"
3. **Statistiques mises à jour** : Taux de perte calculé
4. **Alertes** : Si écart > 10%, notification gérant

### Analyser les écarts

**Accès** : **Stock** → **Inventaires** → Cliquez sur un inventaire

**Indicateurs clés** :
- **Taux de perte global** : % du stock perdu
- **Valeur des pertes** : Montant en € (quantité × PMP)
- **Catégories les plus impactées** : Graphique

**Seuils d'alerte** :
- ✅ **< 2%** : Normal (perte acceptable)
- ⚠️ **2-5%** : Surveiller (améliorer process)
- ❌ **> 5%** : Problème (vol, gaspillage, erreurs)

---

## Comprendre le dashboard

Le dashboard vous donne une **vision temps réel** de votre activité.

**Accès** : Page d'accueil après connexion

### Indicateurs principaux (KPIs)

**Période sélectionnable** : Aujourd'hui, Semaine, Mois, Année

**1. Chiffre d'affaires (CA)**
- **CA HT** : Hors taxes
- **CA TTC** : Total encaissé
- **Évolution** : % vs période précédente

**2. Coût matière consommé**
- **Total** : Somme des coûts ingrédients vendus
- **Par catégorie** : Répartition (viandes, légumes, etc.)

**3. Marge brute**
- **Formule** : CA HT - Coût matière
- **Taux de marge** : (Marge / CA HT) × 100
- **Objectif** : > 70% (coût matière < 30%)

**4. Nombre de commandes**
- **Total** : Commandes validées
- **Ticket moyen** : CA TTC / Nb commandes
- **Évolution** : Graphique temporel

### Graphiques

**CA par jour** : Courbe des 30 derniers jours

**Répartition CA par catégorie** : Camembert
- Plats : 60%
- Boissons : 25%
- Desserts : 15%

**Top 10 ventes** : Tableau
```
Produit              | Quantité | CA    | Marge
──────────────────────────────────────────────
Burger Classique     | 145      | 1740€ | 68%
Pizza Margherita     | 98       | 1078€ | 71%
Salade César         | 67       | 670€  | 65%
```

**Consommation matières premières** : Top ingrédients utilisés
```
Ingrédient      | Quantité | Valeur | % CA
────────────────────────────────────────────
Steak haché     | 45 kg    | 378€   | 12%
Farine          | 38 kg    | 57€    | 2%
Tomates         | 22 kg    | 66€    | 2%
```

### Alertes

**Notifications temps réel** :
- 🔴 **Stock négatif** : Bloquant (impossible de vendre)
- 🟠 **Stock bas** : Ingrédient sous seuil minimum
- 🟡 **Écart caisse** : Différence théorique/réel
- 🔵 **Commande fournisseur en retard**

---

## Exporter pour la comptabilité

### Export CSV mensuel

**Accès** : **Comptabilité** → **Exports** → **Export CSV**

**Formulaire** :
1. **Période** : Mois de janvier 2025
2. **Type de données** :
   - ✅ Ventes (factures)
   - ✅ Achats (réceptions)
   - ✅ Inventaires
3. **Format** : CSV Excel (séparateur point-virgule)

**Cliquez "Télécharger"**

**Fichiers générés** :
- `ventes_janvier_2025.csv`
- `achats_janvier_2025.csv`
- `inventaires_janvier_2025.csv`

### Export FEC (Fichier des Écritures Comptables)

**⚠️ Obligatoire** pour contrôle fiscal (administration peut demander).

**Accès** : **Comptabilité** → **Exports** → **Export FEC**

**Formulaire** :
1. **Exercice comptable** : 2025
2. **Format** : FEC (norme DGFiP)

**Cliquez "Générer FEC"**

**Fichier** : `123456789FEC20250101_20251231.txt`
- Format : Texte pipe-separated
- Colonnes : JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise

**Transmettre à votre expert-comptable**.

### Rapports TVA

**Accès** : **Comptabilité** → **TVA**

**Déclaration CA3** (mensuelle ou trimestrielle) :
- **Base HT par taux** : 5.5%, 10%, 20%
- **TVA collectée** : Total à reverser
- **TVA déductible** : Sur achats
- **TVA à payer** : Collectée - Déductible

**Export PDF** : Synthèse imprimable pour comptable.

---

## Gérer votre équipe

### Ajouter un serveur

**Accès** : **Équipe** → **Utilisateurs** → **+ Ajouter**

**Formulaire** :
1. **Nom** : "Marie Dupont"
2. **Email** : marie.dupont@restaurant.fr
3. **Rôle** : Serveur
4. **PIN personnel** : 1234 (4 chiffres, modifiable par le serveur)
5. **Actif** : ✅

**Cliquez "Enregistrer"**

**🔑 Connexion serveur** :
- Sur l'application mobile ou tablette
- **PIN uniquement** (pas de mot de passe)
- Accès limité : POS, Tables, Clôture caisse

### Rôles et permissions

**Serveur** :
- ✅ Prendre commandes
- ✅ Encaisser
- ✅ Gérer tables
- ✅ Clôturer sa caisse
- ❌ Modifier prix
- ❌ Voir dashboard financier

**Gérant** (vous) :
- ✅ Tout accès
- ✅ Configuration
- ✅ Statistiques
- ✅ Gestion équipe

**Cuisinier** (futur) :
- ✅ Voir commandes cuisine
- ❌ Encaissement
- ❌ Stock

### Désactiver un utilisateur

**Accès** : **Équipe** → Cliquez sur l'utilisateur → **Désactiver**

- L'utilisateur ne peut plus se connecter
- Historique conservé (traçabilité)
- Réactivable à tout moment

---

## Clôturer la caisse

À la fin de chaque service, chaque serveur doit clôturer sa caisse.

### Processus serveur (interface simplifiée)

**Sur tablette/mobile** :
1. **Menu** → **Clôturer ma caisse**
2. **Système affiche** :
   - CA théorique : 1245.50 €
   - Espèces théorique : 320.00 €
   - CB théorique : 925.50 €
3. **Compter les espèces** :
   - Billets 50€ : 4 = 200 €
   - Billets 20€ : 5 = 100 €
   - Billets 10€ : 2 = 20 €
   - Pièces 2€ : 10 = 20 €
   - Total réel : **340 €**
4. **Écart espèces** : +20 € (surplus)
5. **Saisir montant CB** (vérifier TPE) : 925.50 €
6. **Commentaire** (si écart) : "Client a dit de garder la monnaie"
7. **Valider la clôture**

**📊 Serveur reçoit reçu** :
```
═══════════════════════════════════════
        CLÔTURE CAISSE
        Marie Dupont
        08/01/2025 - 22:30
═══════════════════════════════════════
CA Théorique TTC    :    1245.50 €
  - Espèces         :     320.00 €
  - Carte bancaire  :     925.50 €

───────────────────────────────────────
COMPTAGE RÉEL
───────────────────────────────────────
Espèces réelles     :     340.00 €
CB réelles          :     925.50 €
Total réel          :    1265.50 €

───────────────────────────────────────
ÉCARTS
───────────────────────────────────────
Espèces             :     +20.00 € ⚠️
CB                  :       0.00 € ✅
Total écart         :     +20.00 €

Commentaire : Client a dit de garder la monnaie

Signature serveur : ___________________
```

### Vue gérant (suivi global)

**Accès** : **Caisse** → **Historique clôtures**

**Tableau récapitulatif** :
```
Date       | Serveur      | CA Théo | CA Réel | Écart  | Statut
─────────────────────────────────────────────────────────────────
08/01 Midi | Marie        | 856€    | 856€    | 0€     | ✅ OK
08/01 Soir | Marie        | 1245€   | 1265€   | +20€   | ⚠️ Écart
07/01 Midi | Jean         | 720€    | 715€    | -5€    | ✅ OK
07/01 Soir | Jean         | 1120€   | 1050€   | -70€   | ❌ Alerte
```

**⚠️ Alertes automatiques** :
- Écart > 50 € → Email gérant
- Écart > 100 € → Notification critique + alerte Sentry

**Actions possibles** :
- **Voir détail** : Liste des commandes de la session
- **Exporter PDF** : Archive papier
- **Commenter** : Justification écart

---

## Résoudre les problèmes courants

### 1. "Stock négatif détecté"

**Symptôme** : Impossible de valider une commande, message "Stock insuffisant pour Tomate".

**Causes** :
- Recette mal configurée (quantités trop élevées)
- Réception fournisseur oubliée
- Inventaire non fait depuis longtemps

**Solutions** :
1. **Vérifier le stock** : **Stock** → **Ingrédients** → Rechercher "Tomate"
2. **Si stock = 0** :
   - Réceptionner livraison si reçue physiquement
   - Ou faire inventaire avec stock réel
3. **Si stock théorique faux** : Faire inventaire complet
4. **Si recette incorrecte** : Vérifier quantités dans fiche produit

**🛡️ Prévention** :
- Inventaires hebdomadaires
- Alertes stock bas activées
- Réceptionner livraisons le jour même

### 2. "Écart de caisse important"

**Symptôme** : Clôture caisse avec -85 € d'écart.

**Causes** :
- Erreur de rendu monnaie
- Oubli d'enregistrer une commande
- Remboursement non saisi
- Vol (rare)

**Solutions** :
1. **Recompter les espèces** physiquement
2. **Vérifier le TPE** : Total CB doit correspondre
3. **Rechercher commandes manquantes** :
   - Comparer tickets papier vs système
   - Vérifier commandes "en attente" non payées
4. **Vérifier remboursements** : Ont-ils été saisis ?
5. **Si écart persistant** : Documenter, prendre photo de la caisse, interroger serveur

**🛡️ Prévention** :
- Formation serveurs sur saisie correcte
- Vérification intermédiaire en milieu de service
- Double comptage si écart > 20 €

### 3. "Marges trop faibles"

**Symptôme** : Dashboard affiche taux de coût matière 45% (objectif < 30%).

**Causes** :
- Prix de vente trop bas
- Portions trop généreuses (recettes mal calibrées)
- Fournisseurs trop chers
- Gaspillage important

**Solutions** :
1. **Analyser produit par produit** :
   - **Carte** → **Produits** → Trier par "Taux coût matière décroissant"
   - Identifier produits > 40%
2. **Pour chaque produit problématique** :
   - **Option A** : Augmenter prix de vente (+10% = impact direct marge)
   - **Option B** : Réduire portions (ajuster recette)
   - **Option C** : Changer fournisseur (comparer prix)
   - **Option D** : Retirer produit de la carte si non rentable
3. **Vérifier gaspillage** :
   - Inventaires : taux de perte > 5% ?
   - Formation cuisine sur portions standards

**🎯 Exemple concret** :
```
Burger Classique :
  Prix vente HT  : 10.91 € (12€ TTC)
  Coût matière   : 4.85 €
  Taux           : 44% ❌ Trop élevé

Actions :
  1. Augmenter prix à 13€ TTC (11.82€ HT)
     → Nouveau taux : 41% (mieux mais insuffisant)
  2. Réduire steak de 150g à 120g (-0.30€)
     → Coût matière : 4.55€
     → Taux : 38% (acceptable)
  3. OU combiner : 12.50€ TTC + steak 130g
     → Taux : 34% ✅ Objectif atteint
```

### 4. "Données perdues après fermeture navigateur"

**Symptôme** : Toutes les données disparaissent après redémarrage.

**Cause** : Mode navigation privée OU nettoyage automatique localStorage.

**Solutions** :
1. **Vérifier mode navigation** : Ne JAMAIS utiliser mode privé/incognito
2. **Paramètres navigateur** :
   - Chrome : Paramètres → Confidentialité → Cookies : Autoriser tous les cookies
   - Safari : Préférences → Confidentialité : Décocher "Bloquer tous les cookies"
3. **Vérifier Supabase** : Si configuré, données synchronisées automatiquement

**🛡️ Prévention** :
- Utiliser navigateur dédié à l'application
- Créer raccourci bureau (PWA)
- Activer synchronisation Supabase (recommandé production)

### 5. "Impossible d'imprimer les tickets"

**Symptôme** : Bouton "Imprimer" ne fait rien.

**Causes** :
- Imprimante non connectée
- Pilote non installé
- Mauvais protocole ESC/POS

**Solutions** :
1. **Vérifier connexion physique** : USB ou réseau
2. **Tester impression test** : Bouton sur l'imprimante
3. **Installer pilote constructeur** : Epson, Star, etc.
4. **Configuration application** :
   - **Paramètres** → **Imprimante**
   - Type : Thermique ESC/POS
   - Port : USB001 ou IP réseau
   - Tester impression

**🛡️ Alternative** :
- Export PDF puis impression classique
- Impression depuis mobile via AirPrint/Google Cloud Print

### 6. "Produits désynchronisés entre web et mobile"

**Symptôme** : Nouveau produit créé sur web invisible sur tablette serveur.

**Cause** : Synchronisation Supabase non configurée OU cache navigateur.

**Solutions** :
1. **Sur tablette** : Fermer et rouvrir application (force refresh)
2. **Vider cache** : Paramètres → Stockage → Vider cache
3. **Vérifier Supabase** :
   - **Paramètres** → **Synchronisation**
   - Statut : "Connecté" ✅
   - Dernière sync : < 5 min
4. **Si Supabase non configuré** : Activation requise (voir admin système)

**🛡️ Prévention** :
- Activer sync temps réel (WebSocket)
- Créer produits 30 min avant service (temps propagation)

---

## Astuces & Best Practices

### 📅 Routine quotidienne recommandée

**Matin (avant service)** :
1. Vérifier alertes stock bas
2. Réceptionner livraisons du jour
3. Activer produits du jour (plats spéciaux)

**Soir (après service)** :
1. Clôturer caisses serveurs
2. Vérifier écarts
3. Désactiver produits épuisés
4. Noter anomalies pour inventaire

### 📊 Routine hebdomadaire

**Lundi matin** :
1. Inventaire complet
2. Analyser écarts semaine précédente
3. Ajuster seuils stock minimum
4. Passer commandes fournisseurs

### 📈 Routine mensuelle

**1er du mois** :
1. Export comptable mois écoulé
2. Analyser marges par produit
3. Ajuster prix si besoin
4. Réviser recettes produits faible marge
5. Backup manuel des données

### 🎯 Objectifs de performance

**Indicateurs à surveiller** :
- **Taux de coût matière** : < 30%
- **Ticket moyen** : Croissance continue
- **Taux de perte inventaire** : < 2%
- **Écarts de caisse** : < 1% du CA

### 🔒 Sécurité

- **Changer les PINs** régulièrement (tous les 3 mois)
- **Backup données** hebdomadaire (automatique si Supabase)
- **Vérifier accès utilisateurs** : Désactiver anciens employés
- **Ne JAMAIS partager** votre mot de passe gérant

---

## Support & Contact

### Obtenir de l'aide

**Documentation** :
- [Guide Serveur](GUIDE_SERVEUR.md)
- [FAQ](FAQ.md)
- [Dépannage](TROUBLESHOOTING.md)

**Support technique** :
- Email : support@smartfoodmanager.fr
- Téléphone : 01 XX XX XX XX (Lun-Ven 9h-18h)
- Chat en ligne : Application → Menu → Support

**Formation** :
- Webinaires mensuels gratuits
- Formation sur site (option BUSINESS)
- Vidéos tutorielles : [YouTube](https://youtube.com/smartfoodmanager)

---

**Version du guide** : 1.0.0 (Janvier 2025)
**Dernière mise à jour** : 08/01/2025
