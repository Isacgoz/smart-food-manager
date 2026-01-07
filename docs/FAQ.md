# FAQ - Smart Food Manager

## Questions Fréquentes

### 📋 Table des matières
- [Général](#général)
- [Compte et Connexion](#compte-et-connexion)
- [Produits et Recettes](#produits-et-recettes)
- [Stock et Ingrédients](#stock-et-ingrédients)
- [Ventes et Encaissement](#ventes-et-encaissement)
- [Comptabilité et Exports](#comptabilité-et-exports)
- [Technique](#technique)
- [Tarifs et Abonnement](#tarifs-et-abonnement)

---

## Général

### Qu'est-ce que Smart Food Manager ?

Smart Food Manager est un **système de gestion complet pour restauration légère** (food trucks, snacks, restaurants indépendants). Il connecte automatiquement vos recettes, stock, ventes et indicateurs financiers pour vous donner une vision claire de votre rentabilité.

**Principales fonctionnalités** :
- Point de Vente (POS) tactile
- Gestion stock avec déstockage automatique
- Fiches techniques (recettes) avec calcul coûts
- Dashboard financier temps réel
- Multi-utilisateurs avec rôles
- Conformité fiscale française

### Pour qui est fait Smart Food Manager ?

**Cibles principales** :
- Food trucks
- Snacks rapides
- Restaurants indépendants (< 50 couverts)
- Boulangeries avec restauration
- Traiteurs

**Non adapté pour** :
- Grandes chaînes de restaurants (> 10 sites)
- Hôtellerie complexe
- Restauration collective institutionnelle

### Quelle est la différence avec un simple logiciel de caisse ?

**Logiciel de caisse classique** :
- Enregistre seulement les ventes
- Vous devez gérer le stock manuellement à côté
- Pas de lien entre ventes et consommation matières

**Smart Food Manager** :
- Chaque vente déclenche **déstockage automatique** des ingrédients
- Calcul **coût matière en temps réel**
- Vision précise de vos **marges par produit**
- Alertes stock bas automatiques
- Connexion achats ↔ stock ↔ ventes ↔ comptabilité

**Résultat** : Vous savez exactement combien vous gagnez sur chaque produit vendu.

### Puis-je utiliser Smart Food Manager sur plusieurs sites ?

**Oui**, avec le plan BUSINESS (149€/mois).

**Fonctionnement** :
- 1 compte multi-sites
- Données isolées par site
- Dashboard consolidé (vue globale)
- Gestion centralisée des recettes (si menus identiques)

**Limite plan TEAM** : 1 seul site.

---

## Compte et Connexion

### Comment créer mon compte ?

1. **Allez sur** [smartfoodmanager.fr](https://smartfoodmanager.fr)
2. **Cliquez "Essai gratuit 14 jours"**
3. **Remplissez le formulaire** :
   - Nom du restaurant
   - Votre nom et prénom
   - Email professionnel
   - Mot de passe (min 8 caractères)
4. **Validez votre email** (lien envoyé par mail)
5. **Connectez-vous** et configurez votre restaurant

**Aucune carte bancaire requise** pendant l'essai.

### J'ai oublié mon mot de passe, que faire ?

1. **Page de connexion** → Cliquez "Mot de passe oublié ?"
2. **Entrez votre email**
3. **Recevez lien de réinitialisation** (valide 1h)
4. **Cliquez sur le lien** dans l'email
5. **Choisissez nouveau mot de passe**

**Pas reçu l'email ?** Vérifiez vos spams ou contactez support@smartfoodmanager.fr.

### Comment ajouter un serveur ?

**Accès gérant** : Menu → **Équipe** → **+ Ajouter utilisateur**

**Formulaire** :
- Nom : "Jean Dupont"
- Email : jean.dupont@restaurant.fr
- Rôle : **Serveur**
- PIN : 1234 (4 chiffres)

**Le serveur peut** :
- Se connecter sur tablette avec son PIN
- Prendre commandes
- Encaisser
- Clôturer sa caisse

**Le serveur ne peut PAS** :
- Modifier prix
- Voir statistiques financières
- Gérer stock
- Supprimer produits

### Combien d'utilisateurs puis-je créer ?

**Plan SOLO** : 1 utilisateur (vous uniquement)
**Plan TEAM** : 5 utilisateurs
**Plan BUSINESS** : Illimité

**Types d'utilisateurs** : Gérant, Serveur, Cuisinier (futur).

### Comment désactiver un ancien employé ?

1. **Menu** → **Équipe**
2. **Cliquez sur l'utilisateur**
3. **Bouton "Désactiver"**

**Effet** :
- Ne peut plus se connecter
- Historique conservé (traçabilité)
- Peut être réactivé plus tard

**⚠️ Ne jamais supprimer** un utilisateur ayant fait des ventes (perd traçabilité).

---

## Produits et Recettes

### Comment créer un produit ?

**Voir** : [Guide Gérant - Créer des produits](GUIDE_GERANT.md#créer-des-produits-et-recettes)

**Résumé** :
1. Menu → **Carte** → **Produits** → **+ Ajouter**
2. Nom, catégorie, prix TTC, TVA, photo
3. **Suivant : Recette**
4. Ajouter ingrédients avec quantités
5. Système calcule coût matière automatiquement

### Dois-je créer une recette pour TOUS mes produits ?

**Recommandation** :
- ✅ **Produits composés** (burgers, pizzas, salades) : **Obligatoire**
- ✅ **Produits transformés** (gâteaux maison, sauces) : **Recommandé**
- ⚠️ **Boissons en bouteille** : Optionnel (peut être géré comme "1 bouteille = 1 ingrédient")
- ❌ **Produits revendus tels quels** (chips industrielles) : Pas nécessaire

**Astuce boissons** :
- Créer ingrédient "Coca-Cola 33cl" avec prix d'achat unitaire
- Recette produit "Coca-Cola" = 1 pièce de cet ingrédient

### Puis-je modifier une recette après avoir vendu des produits ?

**Oui**, mais avec précautions :

**Ce qui change** :
- ✅ Coûts futurs calculés avec nouvelle recette
- ✅ Stock déstocké selon nouvelle recette

**Ce qui NE change PAS** :
- ❌ Historique ventes passées (coûts figés)
- ❌ Statistiques anciennes

**Bonnes pratiques** :
- **Changement permanent** : Modifier directement
- **Test temporaire** : Créer nouveau produit "Burger V2"
- **Changement saisonnier** : Désactiver ancien, activer nouveau

### Comment calculer le bon prix de vente ?

**Méthode du coefficient multiplicateur** :

1. **Système calcule coût matière** : Ex. 4.50€
2. **Choisir coefficient** selon votre positionnement :
   - Restauration rapide : **×3** (coût matière ~33%)
   - Restauration classique : **×3.5** (coût matière ~28%)
   - Gastronomique : **×4 à 5** (coût matière 20-25%)
3. **Prix HT** = Coût matière × Coefficient = 4.50€ × 3 = **13.50€ HT**
4. **Prix TTC** = Prix HT × 1.10 (TVA 10%) = **14.85€** → Arrondir à **14.90€**

**Vérification** :
- Taux de coût matière : (4.50 / 13.50) × 100 = **33%** ✅

**Si taux > 40%** : Prix trop bas OU portions trop généreuses.

### Comment gérer les formules/menus ?

**Deux méthodes** :

**Méthode 1 : Produit unique "Formule"**
- Créer produit "Menu Burger + Frites + Boisson"
- Prix : 15€ (vs 18€ à la carte)
- Recette combine tous les ingrédients

**Méthode 2 : Remise sur commande** (futur)
- Client commande 3 produits séparés
- Système applique remise -15% automatiquement

**Recommandation actuelle** : Méthode 1 (plus simple).

### Puis-je avoir plusieurs variantes d'un même produit ?

**Oui**, deux approches :

**Approche 1 : Produits séparés**
- "Pizza Margherita Petite" (26cm) : 9€
- "Pizza Margherita Grande" (33cm) : 12€
- Recettes différentes (quantités ajustées)

**Approche 2 : Produit unique + options** (futur)
- Produit "Pizza Margherita" : 9€
- Option "Grande taille" : +3€
- Système ajuste recette automatiquement

**Recommandation actuelle** : Approche 1.

---

## Stock et Ingrédients

### Comment fonctionne le déstockage automatique ?

**Principe** : Chaque vente déclenche déduction automatique des ingrédients.

**Exemple** :
1. Client commande 1 Burger Classique
2. **Système lit la recette** :
   - Pain : 1 pièce
   - Steak : 0.150 kg
   - Fromage : 0.030 kg
   - etc.
3. **Déstocke automatiquement** :
   - Stock pain : 50 → **49 pièces**
   - Stock steak : 25 → **24.85 kg**
   - Stock fromage : 3 → **2.97 kg**
4. **Crée mouvement de stock** (traçabilité)

**Vous n'avez RIEN à faire manuellement**.

### Que se passe-t-il si le stock devient négatif ?

**🔴 Blocage automatique** :

**Si stock théorique ≤ 0** :
- Impossible d'ajouter produit au panier
- Message serveur : "Stock insuffisant pour [ingrédient]"
- Notification gérant : Alerte critique

**Actions** :
1. **Vérifier stock réel** : Reste-t-il vraiment 0 ?
2. **Si stock physique existe** : Faire inventaire (corriger écart)
3. **Si vraiment rupture** : Réapprovisionner ou désactiver produit

**Pourquoi bloquer ?** Éviter ventes impossibles à honorer + alerte rupture.

### Comment gérer les pertes et casses ?

**Méthode recommandée : Inventaire régulier**

1. **Faire inventaire** (hebdomadaire ou mensuel)
2. **Saisir stock réel** (après comptage physique)
3. **Écart calculé automatiquement** :
   - Théorique : 10 kg
   - Réel : 9.5 kg
   - Perte : -0.5 kg
4. **Indiquer motif** : "Casse", "Périmé", "Vol", etc.
5. **Stock ajusté** : 9.5 kg devient nouvelle référence

**Valorisation perte** : Quantité × PMP (Prix Moyen Pondéré).

**Statistiques** : Taux de perte par catégorie affiché dans dashboard.

### Comment fonctionne le PMP (Prix Moyen Pondéré) ?

**Définition** : Prix moyen de vos achats, recalculé à chaque réception.

**Exemple concret** :

**Situation initiale** :
- Stock : 10 kg de farine
- PMP actuel : 1.20€/kg
- Valeur stock : 12€

**Nouvelle réception** :
- Achat : 25 kg à 1.10€/kg = 27.50€

**Calcul nouveau PMP** :
```
Valeur totale = (10 × 1.20) + (25 × 1.10) = 12 + 27.50 = 39.50€
Stock total   = 10 + 25 = 35 kg
Nouveau PMP   = 39.50 / 35 = 1.13€/kg
```

**Pourquoi important ?**
- Coût matière calculé avec PMP
- Si fournisseur augmente prix → PMP augmente → marges baissent
- Permet détecter dérive coûts

### Puis-je gérer des stocks sur plusieurs sites ?

**Oui**, avec plan BUSINESS :
- Stock isolé par site
- Dashboard consolidé affiche total groupe
- Transferts inter-sites traçables

**Non disponible** plan TEAM/SOLO.

### Comment paramétrer des alertes stock bas ?

**Par ingrédient** :

1. **Stock** → **Ingrédients** → Cliquez sur ingrédient
2. **Champ "Stock minimum"** : Ex. 5 kg
3. **Enregistrer**

**Effet** :
- Si stock passe sous 5 kg → **🔴 Pastille rouge** sur ingrédient
- Notification dashboard
- Email gérant (si configuré)

**Recommandations seuils** :
- **Denrées périssables** (viandes, légumes) : 2 jours de consommation
- **Épicerie sèche** : 1 semaine de consommation
- **Produits longs délais** : 2 semaines

### Qu'est-ce qu'une conversion d'unité ?

**Problème** : Vous achetez en sac de 25kg, stockez en kg, utilisez en grammes.

**Solution Smart Food Manager** : Gère conversions automatiquement.

**Exemple** :

**Ingrédient "Farine"** :
- Unité de stockage : **kg**

**Article fournisseur** :
- Conditionnement : Sac de 25 kg
- Quantité : 25
- Unité : kg
- → Système comprend : 1 sac = 25 kg

**Recette "Pain"** :
- Farine : 0.250 kg (= 250g)
- → Système convertit automatiquement

**Après vente 1 Pain** :
- Stock farine : 100 kg → **99.75 kg**

**Aucune conversion manuelle requise**.

---

## Ventes et Encaissement

### Comment annuler une commande déjà encaissée ?

**Remboursement total** :

1. **Ventes** → **Historique**
2. **Rechercher la commande** (n°, date, client)
3. **Cliquez sur commande** → **"Rembourser"**
4. **Sélectionnez mode** :
   - Espèces : Rendre argent au client
   - Carte : Remboursement différé (via TPE)
5. **Raison** : "Client mécontent", "Erreur serveur", etc.
6. **Valider**

**🎯 Ce qui se passe** :
- ✅ Stock re-crédité (ingrédients retournés virtuellement)
- ✅ CA ajusté (vente annulée)
- ✅ Caisse serveur ajustée
- ✅ Document "Avoir" émis (traçabilité fiscale)

**⚠️ Limite** : Possible uniquement jour même (sauf autorisation gérant).

### Comment faire un avoir partiel ?

**Cas** : Client veut remboursement 1 produit sur 3.

1. **Historique** → Commande → **"Modifier"**
2. **Décocher produit à rembourser** : Ex. Dessert 6€
3. **"Créer avoir partiel"**
4. **Mode remboursement** : Espèces ou Carte
5. **Valider**

**Résultat** :
- Commande initiale : 24€
- Avoir : -6€
- Net : **18€**
- Dessert re-crédité en stock

### Comment gérer les pourboires ?

**Actuellement** : Enregistrement manuel.

1. **Après encaissement**
2. **"Ajouter pourboire"**
3. **Montant** : 5€
4. **Bénéficiaire** : Serveur X ou "Équipe"

**Comptabilité** :
- Pourboire séparé du CA
- Non soumis à TVA
- Déclaré séparément (charges sociales si redistribué)

**Futur** : Pourboire sur paiement CB direct (si TPE compatible).

### Comment imprimer un duplicata de ticket ?

1. **Ventes** → **Historique**
2. **Cliquez sur commande**
3. **Bouton "Réimprimer ticket"**

**Mentions** : "DUPLICATA - Ne vaut pas facture".

### Puis-je émettre une facture au lieu d'un ticket ?

**Oui**, si client professionnel demande facture.

**Différence** :
- **Ticket** : Reçu simple, pas de numéro unique, mentions minimales
- **Facture** : Document comptable, numéroté, TVA détaillée, mentions légales complètes

**Procédure** :
1. **Après encaissement** → **"Éditer facture"**
2. **Saisir infos client** :
   - Raison sociale
   - SIREN/SIRET
   - Adresse complète
3. **Valider**
4. **Facture imprimée** avec numéro unique (ex: FACT-2025-00123)

**Conservation** : Obligatoire 10 ans (archivage automatique).

### Comment gérer les paiements mixtes (espèces + carte) ?

**Procédure** :

1. **Total à payer** : 45€
2. **Client paie 20€ en espèces**
3. **Sélectionner "Espèces"** → Montant : 20€
4. **Reste à payer** : 25€
5. **Sélectionner "Carte"** → Montant : 25€
6. **Valider TPE**
7. **Commande encaissée** : 20€ ESP + 25€ CB

**Ticket affiche** :
```
Total TTC    : 45.00€
Espèces      : 20.00€
Carte        : 25.00€
```

### Comment gérer les chèques ?

**Actuellement** : Non géré nativement (peu fréquent restauration rapide).

**Workaround** :
1. **Encaisser en "Espèces"** dans système
2. **Noter "Chèque n°XXXXX"** en commentaire
3. **Ajuster caisse manuellement** lors clôture

**Futur** : Mode paiement "Chèque" dédié.

---

## Comptabilité et Exports

### Quels exports sont disponibles ?

**Exports standards** :

1. **CSV Ventes** : Liste toutes les ventes (date, produits, montants, TVA)
2. **CSV Achats** : Réceptions fournisseurs
3. **CSV Inventaires** : Écarts et ajustements
4. **FEC** : Fichier Écritures Comptables (norme DGFiP)
5. **Rapports TVA** : CA3 mensuel/trimestriel

**Exports personnalisés** (plan BUSINESS) :
- API REST pour intégration ERP
- Webhooks temps réel

### Qu'est-ce que le FEC et pourquoi l'exporter ?

**FEC** = Fichier des Écritures Comptables

**Obligation légale** :
- Toute entreprise tenant comptabilité informatisée
- Administration fiscale peut demander lors contrôle
- Format normalisé (norme DGFiP)

**Contenu** :
- Toutes écritures comptables (ventes, achats, paiements)
- Format texte pipe-separated
- Colonnes normalisées (JournalCode, CompteNum, Debit, Credit, etc.)

**Utilisation** :
1. Exporter FEC annuel (ex: 2025)
2. Transmettre à expert-comptable
3. Archiver (conservation 6 ans minimum)

**Smart Food Manager génère FEC conforme automatiquement**.

### Comment transmettre mes données à mon comptable ?

**Recommandation** :

**Mensuel** :
1. Exporter **CSV Ventes** du mois
2. Exporter **CSV Achats** du mois
3. Exporter **Rapport TVA** (CA3)
4. Envoyer par email à comptable

**Annuel** :
1. Exporter **FEC complet** de l'exercice
2. Transmettre sur clé USB ou cloud sécurisé

**Alternative (plan BUSINESS)** :
- Accès lecture seule pour votre comptable
- Consultation temps réel sans export manuel

### La TVA est-elle gérée automatiquement ?

**Oui**, totalement automatique :

**À la vente** :
- Produit configuré avec taux TVA (5.5%, 10%, 20%)
- Système calcule TVA sur chaque ligne
- Total TTC = HT + TVA

**Rapports** :
- CA par taux de TVA
- TVA collectée (à reverser)
- TVA déductible (sur achats si applicable)
- Déclaration CA3 pré-remplie

**Vous devez** : Reverser TVA selon périodicité (mensuelle/trimestrielle).

### Comment savoir si je suis rentable ?

**Dashboard Gérant** affiche indicateurs clés :

**1. Marge brute** :
```
CA HT           : 15000€
Coût matière    :  4200€ (28%)
Marge brute     : 10800€ (72%)
```
✅ **Objectif** : Marge > 70% (coût matière < 30%)

**2. Taux de coût matière** :
- **< 25%** : Excellent (haute gastronomie)
- **25-30%** : Très bon (restauration classique)
- **30-35%** : Correct (restauration rapide)
- **35-40%** : Limite acceptable
- **> 40%** : ❌ Problème (revoir prix ou recettes)

**3. Point mort** (futur) :
- Charges fixes mensuelles : 8000€
- Marge brute unitaire : 72%
- CA minimum requis : 11111€/mois

**Outil simulation** : Testez impact changement prix/portions.

---

## Technique

### Sur quels appareils fonctionne Smart Food Manager ?

**Interface Web (Gérant)** :
- ✅ Ordinateur (Windows, Mac, Linux)
- ✅ Tablette (iPad, Android)
- ✅ Navigateurs : Chrome, Safari, Firefox, Edge (versions récentes)
- ❌ Internet Explorer (non supporté)

**Application Mobile (Serveurs)** :
- ✅ iPad / iPhone (iOS 13+)
- ✅ Tablettes Android (Android 8+)
- ✅ Smartphones (utilisable mais moins confortable)

**Imprimantes** :
- ✅ Thermiques ESC/POS (Epson, Star, etc.)
- ✅ Connexion USB ou réseau (Ethernet/WiFi)

### Ai-je besoin d'une connexion internet ?

**Actuellement** : **Oui**, connexion requise.

**Fonctionnement** :
- Données stockées localement (localStorage navigateur)
- Synchronisation cloud si configurée (Supabase)
- Perte connexion temporaire = données perdues si navigateur fermé

**Futur (mode offline)** :
- ✅ Prise commande sans internet
- ✅ Synchronisation automatique à reconnexion
- ✅ PWA (Progressive Web App) installable

**Recommandation actuelle** :
- WiFi stable au restaurant
- 4G/5G de secours si coupure
- Box internet fiable

### Mes données sont-elles sauvegardées ?

**Oui**, plusieurs niveaux :

**1. Sauvegarde locale** :
- Données stockées dans navigateur (localStorage)
- Persistantes tant que navigateur pas vidé

**2. Sauvegarde cloud** (si Supabase configuré) :
- Synchronisation automatique toutes les 5 min
- Données chiffrées
- Hébergement Europe (RGPD conforme)

**3. Backups automatiques** :
- 1 backup quotidien (si cloud activé)
- Rétention 30 jours
- Restauration possible en cas de problème

**⚠️ IMPORTANT** :
- **Ne jamais vider cache navigateur** (perte données locales)
- **Activer synchronisation cloud** (production recommandée)
- **Export CSV hebdomadaire** (sécurité supplémentaire)

### Comment restaurer des données perdues ?

**Si cloud activé** :

1. **Contactez support** : support@smartfoodmanager.fr
2. **Indiquez** :
   - Date/heure perte
   - Restaurant concerné
   - Dernière action connue
3. **Support restaure backup** le plus récent

**Délai** : 2-4h ouvrées.

**Si pas de cloud** :
- ❌ Impossible de restaurer (données locales seulement)
- → **Activation cloud fortement recommandée**

### Puis-je personnaliser l'interface ?

**Actuellement** : Personnalisation limitée.

**Options disponibles** :
- Logo restaurant (affiché tickets)
- Couleurs catégories produits
- Ordre affichage catégories

**Non personnalisable** :
- Layout général
- Textes interface
- Workflow process

**Futur** : Thèmes prédéfinis (mode sombre, contraste élevé).

### Comment imprimer sur imprimante thermique ?

**Prérequis** :
- Imprimante thermique ESC/POS (80mm ou 58mm)
- Connexion USB ou réseau

**Configuration** :

1. **Connecter imprimante** physiquement
2. **Installer pilote constructeur** (Epson, Star, etc.)
3. **Smart Food Manager** → **Paramètres** → **Imprimante**
4. **Type** : Thermique ESC/POS
5. **Port** : USB001 ou adresse IP (ex: 192.168.1.50)
6. **Tester** : Imprimer ticket test

**Formats supportés** :
- Largeur 80mm (standard restaurant)
- Largeur 58mm (food truck, compact)

**Contenu ticket** :
- Logo restaurant
- Nom produits
- Quantités
- Notes (en gras)
- Total
- Informations légales (pied de page)

### Smart Food Manager est-il conforme RGPD ?

**Oui**, plusieurs mesures :

**1. Minimisation données** :
- Collecte uniquement nécessaire (nom, email, PIN)
- Pas de données sensibles inutiles

**2. Sécurité** :
- Mots de passe hashés (bcrypt)
- Connexion HTTPS (chiffrement transit)
- Isolation multi-tenant stricte

**3. Droits utilisateurs** :
- Droit d'accès (export données personnelles)
- Droit rectification (modifier profil)
- Droit suppression (fermeture compte)
- Droit portabilité (export CSV complet)

**4. Hébergement** :
- Serveurs UE (Supabase Europe)
- Conformité RGPD hébergeur

**5. Conservation** :
- Données actives : illimité (besoin métier)
- Données après fermeture compte : 3 ans (obligations fiscales)

**Registre CNIL** : Déclaration effectuée.

### Puis-je intégrer Smart Food Manager à mon site web ?

**Plan BUSINESS uniquement** :

**Options** :
1. **API REST** : Intégration personnalisée
2. **iFrame** : Affichage menu live sur site
3. **Webhooks** : Notifications temps réel (nouvelle commande, etc.)

**Cas d'usage** :
- Commande en ligne (click & collect)
- Affichage carte dynamique
- Synchronisation ERP existant

**Documentation** : API docs disponibles sur demande.

---

## Tarifs et Abonnement

### Quels sont les tarifs ?

**Plan SOLO** : **29€/mois HT** (34.80€ TTC)
- 1 utilisateur
- 1 site
- POS + Stock + Dashboard
- Support email

**Plan TEAM** : **79€/mois HT** (94.80€ TTC)
- 5 utilisateurs
- 1 site
- Fonctionnalités SOLO +
- Gestion rôles
- Écran cuisine (KDS)
- Support téléphone

**Plan BUSINESS** : **149€/mois HT** (178.80€ TTC)
- Utilisateurs illimités
- Multi-sites
- Fonctionnalités TEAM +
- API REST
- Webhooks
- Support prioritaire
- Formation sur site (option)

**Engagement** : Mensuel sans engagement (annulation possible à tout moment).

### Y a-t-il un essai gratuit ?

**Oui, 14 jours** sans engagement.

**Inclus** :
- Toutes fonctionnalités plan TEAM
- 5 utilisateurs test
- Support complet
- Aucune carte bancaire requise

**Après essai** :
- Passage automatique plan SOLO (29€/mois)
- Ou upgrade TEAM/BUSINESS
- Ou annulation sans frais

### Comment annuler mon abonnement ?

1. **Connectez-vous** à votre compte
2. **Paramètres** → **Abonnement**
3. **"Annuler mon abonnement"**
4. **Confirmer** (demande raison optionnelle)

**Effet** :
- Arrêt facturation fin période en cours
- Accès maintenu jusqu'à fin mois payé
- Export données disponible 30 jours
- Suppression définitive après 90 jours

**⚠️ Aucun remboursement** période en cours (prorata non applicable).

### Puis-je changer de plan ?

**Oui, à tout moment** :

**Upgrade (SOLO → TEAM → BUSINESS)** :
- Effet immédiat
- Facturation prorata mois en cours
- Nouvelles fonctionnalités activées instantanément

**Downgrade (BUSINESS → TEAM → SOLO)** :
- Prise effet fin mois en cours
- Fonctionnalités limitées progressivement
- Vérifier compatibilité (ex: >5 users si passage TEAM)

**Exemple upgrade** :
- 15/01 : Plan SOLO (29€/mois)
- 20/01 : Upgrade TEAM (79€/mois)
- Facturation 20/01 : (79-29) × 11/31 = **17.74€** (prorata 11 jours restants)
- Facturation 01/02 : 79€ (mois complet)

### Les mises à jour sont-elles incluses ?

**Oui, toutes incluses** :

**Mises à jour automatiques** :
- Corrections bugs (hebdomadaires)
- Nouvelles fonctionnalités (mensuelles)
- Améliorations sécurité (immédiates si critiques)

**Aucun coût supplémentaire**, tous plans confondus.

**Notifications** :
- Changelog affiché après connexion
- Email résumé mensuel
- Webinaires démonstration nouvelles features

### Y a-t-il des frais cachés ?

**Non, tarif all-inclusive** :

**Inclus** :
- ✅ Hébergement cloud
- ✅ Sauvegardes automatiques
- ✅ Mises à jour
- ✅ Support
- ✅ Stockage données illimité
- ✅ Nombre de produits illimité
- ✅ Nombre de ventes illimité

**Non inclus** :
- ❌ Matériel (tablette, imprimante, TPE)
- ❌ Formation sur site (option BUSINESS, sur devis)
- ❌ Développements spécifiques (API custom)

**Engagement** : Aucun (mensuel sans engagement).

### Acceptez-vous les paiements annuels ?

**Oui**, avec **-15% de réduction** :

**Plan SOLO** :
- Mensuel : 29€/mois = 348€/an
- Annuel : **296€/an** (économie 52€)

**Plan TEAM** :
- Mensuel : 79€/mois = 948€/an
- Annuel : **806€/an** (économie 142€)

**Plan BUSINESS** :
- Mensuel : 149€/mois = 1788€/an
- Annuel : **1520€/an** (économie 268€)

**Facturation** : 1 facture annuelle, engagement 12 mois.

### Proposez-vous des tarifs pour associations/écoles ?

**Oui**, tarif solidaire **-30%** sur justificatif :

**Éligibilité** :
- Associations loi 1901
- Établissements scolaires (cantines, cafétérias)
- Structures d'insertion (restaurants solidaires)

**Justificatifs requis** :
- Statuts association + récépissé
- OU certificat scolarité
- OU attestation structure insertion

**Contact** : commercial@smartfoodmanager.fr

---

## Support

**Questions non résolues ?**

**Documentation** :
- [Guide Gérant](GUIDE_GERANT.md)
- [Guide Serveur](GUIDE_SERVEUR.md)
- [Dépannage](TROUBLESHOOTING.md)

**Contact Support** :
- Email : support@smartfoodmanager.fr (réponse <24h)
- Téléphone : 01 XX XX XX XX (Lun-Ven 9h-18h, plans TEAM/BUSINESS)
- Chat : Application → Menu → Support (temps réel 9h-18h)

**Communauté** :
- Forum : community.smartfoodmanager.fr
- Webinaires mensuels : smartfoodmanager.fr/webinars

---

**Version de la FAQ** : 1.0.0 (Janvier 2025)
**Dernière mise à jour** : 08/01/2025
