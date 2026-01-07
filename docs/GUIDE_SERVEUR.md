# Guide Serveur - Smart Food Manager

## Table des matières

1. [Première connexion](#première-connexion)
2. [Gérer les tables](#gérer-les-tables)
3. [Prendre une commande](#prendre-une-commande)
4. [Modifier une commande](#modifier-une-commande)
5. [Encaisser un client](#encaisser-un-client)
6. [Clôturer sa caisse](#clôturer-sa-caisse)
7. [Situations courantes](#situations-courantes)

---

## Première connexion

### Se connecter avec son PIN

1. **Ouvrez l'application** sur tablette ou mobile
2. **Écran de connexion** affiche pavé numérique
3. **Entrez votre PIN** à 4 chiffres (fourni par le gérant)
4. **Appuyez sur ✓**

> **🔑 Important** : Chaque serveur a son propre PIN. Ne jamais utiliser le PIN d'un collègue.

### Interface principale

Après connexion, vous voyez 3 onglets :

**📋 TABLES** : Vue d'ensemble des tables
**🛒 COMMANDES** : Commandes en cours
**💰 CAISSE** : Encaissement et clôture

---

## Gérer les tables

### Vue d'ensemble

**Onglet TABLES** affiche plan de salle :

**Codes couleur** :
- 🟢 **Vert** : Table libre
- 🔴 **Rouge** : Table occupée
- 🟡 **Jaune** : Réservée
- ⚫ **Gris** : À nettoyer

**Infos sur chaque table** :
- Numéro table
- Capacité (nombre de couverts)
- Temps écoulé si occupée
- Montant en cours

### Ouvrir une table

1. **Touchez une table verte** (libre)
2. **Confirmer** "Ouvrir la table 5 ?"
3. **Table devient rouge** (occupée)
4. **Écran commande s'affiche**

### Libérer une table après paiement

1. **Après encaissement complet**
2. **Touchez la table rouge**
3. **Bouton "Libérer la table"** apparaît
4. **Confirmer**
5. **Table devient grise** (à nettoyer)

> **Note** : Le gérant ou collègue doit marquer table "nettoyée" pour qu'elle redevienne verte.

### Marquer table nettoyée

1. **Touchez table grise**
2. **Bouton "Table nettoyée"**
3. **Confirmer**
4. **Table devient verte** (disponible)

---

## Prendre une commande

### Démarrer commande

**Depuis une table ouverte** :
1. **Écran affiche catégories** : Plats, Boissons, Desserts, etc.
2. **Touchez une catégorie** (ex: Plats)
3. **Liste des produits** s'affiche avec photos

### Ajouter des produits

**Pour chaque produit** :
1. **Touchez le produit** (ex: "Burger Classique")
2. **Quantité par défaut** : 1
3. **Modifier quantité** : Boutons - / +
4. **Ajouter note** : Bouton "Note" (ex: "Sans oignon")
5. **Confirmer** : Bouton "Ajouter au panier"

**Produit ajouté** apparaît dans panier (bas d'écran) :
```
Burger Classique x2        24.00€
  - Sans oignon (x2)
Pizza Margherita x1        11.00€
Coca-Cola x3                9.00€
──────────────────────────────────
TOTAL                      44.00€
```

### Notes personnalisées

**Cas courants** :
- "Sans oignon"
- "Bien cuit"
- "Sauce à part"
- "Allergique gluten"

**Comment ajouter** :
1. **Après avoir sélectionné produit**
2. **Touchez "Note"**
3. **Saisissez texte** ou sélectionnez note rapide
4. **Valider**

**Note imprimée en gras sur ticket cuisine**.

### Envoyer en cuisine

Quand commande complète :

1. **Vérifier le panier** (bas d'écran)
2. **Toucher "ENVOYER EN CUISINE"**
3. **Confirmation** : "Imprimer ticket ?"
4. **Valider**

**🎯 Ce qui se passe** :
- ✅ Ticket imprimé en cuisine
- ✅ Commande enregistrée
- ✅ Stock déstocké automatiquement
- ✅ Table marquée "en préparation"

> **⚠️ Important** : Une fois envoyée, la commande est définitive. Pour modification, voir section [Modifier une commande](#modifier-une-commande).

---

## Modifier une commande

### Avant envoi en cuisine

**Facile** : Modifiez directement le panier
- Touchez un produit → Modifier quantité ou supprimer
- Ajoutez d'autres produits

### Après envoi en cuisine

**⚠️ Plus complexe** car ticket déjà imprimé.

**Ajouter des produits** :
1. **Touchez la table**
2. **Panier vide** s'affiche
3. **Ajoutez nouveaux produits**
4. **"ENVOYER EN CUISINE"**
5. **Nouveau ticket imprimé** avec mention "SUITE COMMANDE TABLE 5"

**Annuler un produit** :
1. **Touchez "Modifier commande"**
2. **Liste des produits** déjà envoyés
3. **Touchez le produit à annuler**
4. **"Annuler cet article"**
5. **Indiquez raison** : Erreur serveur, client a changé d'avis, etc.
6. **Valider**

**🎯 Ce qui se passe** :
- ✅ Stock re-crédité
- ✅ Montant table mis à jour
- ✅ Nouveau ticket imprimé "ANNULATION : Burger Classique x1"

> **💡 Astuce** : Prévenez la cuisine oralement pour éviter de préparer le produit annulé.

---

## Encaisser un client

### Consulter l'addition

1. **Touchez la table rouge** (occupée)
2. **Bouton "Voir addition"**
3. **Détail affiché** :
```
═══════════════════════════════════
           TABLE 5
       08/01/2025 - 14:35
═══════════════════════════════════

Burger Classique x2        24.00€
  - Sans oignon
Pizza Margherita x1        11.00€
Coca-Cola x3                9.00€

───────────────────────────────────
Total HT                   40.00€
TVA 10%                     4.00€
───────────────────────────────────
TOTAL TTC                  44.00€
═══════════════════════════════════
```

### Encaissement en une fois

**Méthode la plus simple** :

1. **Bouton "ENCAISSER"**
2. **Écran paiement** s'affiche
3. **Montant à payer** : 44.00€

**Choisir moyen de paiement** :
- **💵 ESPÈCES** : Touchez ce bouton
- **💳 CARTE** : Touchez ce bouton

#### Paiement ESPÈCES

1. **Touchez "ESPÈCES"**
2. **"Montant remis ?"** : Saisissez (ex: 50€)
3. **Système calcule rendu** : 6.00€
4. **Confirmer**
5. **Ticket imprimé** avec "Espèces : 50.00€ | Rendu : 6.00€"

#### Paiement CARTE

1. **Touchez "CARTE"**
2. **"Présentez la carte au TPE"**
3. **Attendre validation TPE**
4. **Confirmer** : "Paiement validé"
5. **Ticket imprimé** avec "Carte bancaire : 44.00€"

### Encaissement séparé (split)

**Quand clients veulent payer séparément** :

1. **Bouton "PAYER SÉPARÉMENT"**
2. **Cocher les articles** pour client 1 :
   - ✅ Burger x1
   - ✅ Coca x1
   - Total client 1 : 15.00€
3. **"ENCAISSER SÉLECTION"**
4. **Choisir moyen paiement** (Espèces ou Carte)
5. **Répéter pour client 2** avec articles restants

**Écran affiche** :
```
Total addition  : 44.00€
Déjà payé       : 15.00€
Reste à payer   : 29.00€
```

### Pourboire

**Si client laisse pourboire** :

1. **Après encaissement**
2. **Bouton "Ajouter pourboire"** apparaît
3. **Saisir montant** : 5.00€
4. **Sélectionner bénéficiaire** :
   - Moi (votre nom)
   - Équipe (réparti)
5. **Valider**

**Pourboire enregistré** mais ne compte pas dans CA (séparé comptabilité).

---

## Clôturer sa caisse

À la fin de votre service, vous devez clôturer votre caisse.

### Processus de clôture

1. **Menu** → **CAISSE** → **"CLÔTURER MA CAISSE"**
2. **Système affiche résumé** :
```
═══════════════════════════════════
      CLÔTURE CAISSE
      Marie Dupont
  08/01/2025 - Service Midi
═══════════════════════════════════

CA THÉORIQUE
───────────────────────────────────
Total TTC              : 856.00€
  - Espèces            : 245.00€
  - Carte bancaire     : 611.00€

Nombre de commandes    : 23
Ticket moyen           : 37.22€
```

3. **Compter vos espèces** physiquement

**Aide au comptage** :
```
Billets 50€  : [__] = ____€
Billets 20€  : [__] = ____€
Billets 10€  : [__] = ____€
Billets  5€  : [__] = ____€
Pièces  2€   : [__] = ____€
Pièces  1€   : [__] = ____€
Pièces 0.50€ : [__] = ____€
───────────────────────────────
TOTAL RÉEL ESPÈCES : [______]€
```

4. **Saisir total espèces réel** : 248.50€

5. **Vérifier TPE carte bancaire** : 611.00€ (doit correspondre)

6. **Écart calculé automatiquement** :
```
Espèces théorique   : 245.00€
Espèces réelles     : 248.50€
Écart               : +3.50€ ✅
```

7. **Si écart, ajouter commentaire** (optionnel) :
   - "Pourboire non saisi"
   - "Client a laissé la monnaie"
   - "Erreur de rendu corrigée"

8. **Valider la clôture**

### Reçu de clôture

Ticket imprimé automatiquement :
```
═══════════════════════════════════
        CLÔTURE CAISSE
        Marie Dupont
        08/01/2025 - 14:30
═══════════════════════════════════
CA Théorique TTC    :     856.00€
  - Espèces         :     245.00€
  - Carte bancaire  :     611.00€

───────────────────────────────────
COMPTAGE RÉEL
───────────────────────────────────
Espèces réelles     :     248.50€
CB réelles          :     611.00€
Total réel          :     859.50€

───────────────────────────────────
ÉCARTS
───────────────────────────────────
Espèces             :      +3.50€ ✅
CB                  :       0.00€ ✅
Total écart         :      +3.50€

Commentaire : Pourboire non saisi

Signature serveur : ___________________
Signature gérant  : ___________________
═══════════════════════════════════
```

**Conserver ce ticket** pour archivage.

### Que faire si gros écart ?

**Si écart > 20€** :

1. **Recompter physiquement** les espèces
2. **Vérifier le TPE** : Total CB correct ?
3. **Chercher erreurs** :
   - Commande non saisie (ticket papier oublié)
   - Remboursement non enregistré
   - Erreur rendu monnaie
4. **Appeler le gérant** avant de valider
5. **Expliquer la situation** dans commentaire

**🔴 Écart anormal = alerte automatique gérant**.

---

## Situations courantes

### Client veut annuler après commande envoyée

1. **Touchez la table**
2. **"Modifier commande"**
3. **Sélectionnez produit** à annuler
4. **"Annuler cet article"**
5. **Raison** : "Client a changé d'avis"
6. **Prévenez la cuisine** immédiatement

> **Note** : Si plat déjà préparé, demandez au gérant (possible refacturation ou perte).

### Client demande addition avant tout le monde

**Addition intermédiaire** (sans encaisser) :

1. **Touchez table**
2. **"Voir addition"**
3. **Bouton "Imprimer sans encaisser"**
4. **Ticket imprimé** avec mention "ADDITION - Non payée"

Client peut consulter mais table reste ouverte.

### Client conteste un prix

1. **Rester calme**
2. **Montrer détail addition** sur tablette
3. **Si prix différent carte papier** :
   - Appeler gérant
   - Gérant peut ajuster prix manuellement
4. **Si client insiste** :
   - Proposer geste commercial (café offert)
   - Gérant décide remise si nécessaire

**Ne jamais modifier un prix sans autorisation gérant**.

### Produit en rupture de stock

**Système bloque automatiquement** :
```
❌ Impossible d'ajouter "Burger Classique"
   Stock insuffisant pour :
   - Steak haché
```

**Actions** :
1. **Informer le client** : "Plus disponible aujourd'hui"
2. **Proposer alternative** : "Burger végétarien disponible ?"
3. **Signaler au gérant** pour réassort

### Client part sans payer

**⚠️ Situation délicate** :

1. **NE PAS poursuivre** le client (sécurité)
2. **Informer gérant immédiatement**
3. **Noter détails** :
   - Heure
   - Description physique
   - Montant impayé
   - Numéro table
4. **Gérant enregistre perte** :
   - Commande marquée "Impayée"
   - Votre caisse ajustée (non responsable)

**Montant déduit du CA mais pas de votre caisse personnelle**.

### Erreur de table (commande saisie mauvaise table)

1. **Touchez table incorrecte**
2. **"Modifier commande"**
3. **"Transférer vers autre table"**
4. **Sélectionnez bonne table**
5. **Confirmer**

**Commande déplacée** vers la bonne table.

### Client demande facture (pas ticket)

1. **Après encaissement**
2. **"Imprimer facture"** (au lieu de ticket)
3. **Demander infos facturation** :
   - Raison sociale
   - SIREN
   - Adresse
4. **Valider**
5. **Facture imprimée** avec mentions légales complètes

**Différence ticket/facture** :
- **Ticket** : Simple reçu
- **Facture** : Document comptable numéroté, TVA détaillée

### Tablette freeze ou bug

1. **Rester calme**
2. **Essayer de fermer/rouvrir application**
3. **Si persiste** :
   - Noter commande sur papier
   - Utiliser tablette de secours
   - Appeler gérant
   - Saisir commande plus tard si système récupère

**Données sauvegardées** régulièrement (peu de risque perte).

### Nouveau produit non trouvé

**Si produit manquant dans liste** :

1. **Vérifier bonne catégorie** (Plats, Boissons, etc.)
2. **Utiliser recherche** (loupe en haut)
3. **Si vraiment absent** :
   - Gérant doit activer le produit
   - Ou créer le produit d'abord

**En attendant** : Noter sur papier, saisir après activation.

---

## Bonnes pratiques

### ✅ À FAIRE

- **Sourire au client** même si système lent
- **Vérifier panier** avant d'envoyer en cuisine
- **Relire notes** au client ("Bien cuit, c'est ça ?")
- **Compter espèces avec client** (transparence)
- **Clôturer caisse en fin de service** (jamais oublier)
- **Prévenir cuisine** si annulation

### ❌ À ÉVITER

- **Utiliser PIN d'un collègue** (traçabilité)
- **Modifier prix** sans autorisation
- **Oublier de clôturer** sa caisse
- **Envoyer commande incomplète** (vérifier avec client)
- **Donner rendu monnaie** avant de saisir dans système
- **Laisser tablette sans surveillance** (vol données)

---

## Raccourcis clavier (si tablette avec clavier)

| Touche | Action |
|--------|--------|
| `F1` | Ouvrir TABLES |
| `F2` | Ouvrir COMMANDES |
| `F3` | Ouvrir CAISSE |
| `Ctrl + N` | Nouvelle commande |
| `Ctrl + P` | Imprimer addition |
| `Ctrl + E` | Encaisser |
| `Échap` | Annuler action en cours |

---

## FAQ rapide

**Q : J'ai oublié mon PIN, que faire ?**
R : Demander au gérant de le réinitialiser. Impossible de le retrouver (sécurité).

**Q : Puis-je offrir un café à un client ?**
R : Seulement si autorisé par le gérant. Sinon, saisir commande normalement.

**Q : Client veut payer moitié espèces, moitié carte ?**
R : Possible ! Encaissez d'abord espèces (ex: 20€), puis carte pour le reste (ex: 24€).

**Q : Ticket cuisine non imprimé, que faire ?**
R : Vérifier imprimante (papier, connexion). Réimprimer depuis "Commandes en cours" → Toucher commande → "Réimprimer".

**Q : Client conteste TVA sur addition ?**
R : TVA obligatoire par loi. 10% consommation sur place, 5.5% à emporter. Appeler gérant si contestation persiste.

---

## Support

**Problème technique urgent** :
- Appeler gérant
- Téléphone support : 01 XX XX XX XX

**Formations** :
- Vidéos courtes (2-3 min) : Menu → Aide → Tutoriels
- Formation présentielle : Demander au gérant

---

**Version du guide** : 1.0.0 (Janvier 2025)
**Dernière mise à jour** : 08/01/2025
