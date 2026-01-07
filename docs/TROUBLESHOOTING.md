# Dépannage - Smart Food Manager

Guide de résolution des problèmes courants.

## 📋 Table des matières

- [Problèmes de connexion](#problèmes-de-connexion)
- [Problèmes d'affichage](#problèmes-daffichage)
- [Problèmes de stock](#problèmes-de-stock)
- [Problèmes d'encaissement](#problèmes-dencaissement)
- [Problèmes d'impression](#problèmes-dimpression)
- [Problèmes de synchronisation](#problèmes-de-synchronisation)
- [Problèmes de performance](#problèmes-de-performance)
- [Messages d'erreur courants](#messages-derreur-courants)

---

## Problèmes de connexion

### 🔴 "Email ou mot de passe incorrect"

**Symptôme** : Impossible de se connecter, message d'erreur rouge.

**Causes possibles** :
1. Mot de passe incorrect (casse sensible)
2. Email mal saisi (espaces, typo)
3. Compte non activé (email validation)
4. Compte suspendu (impayé)

**Solutions** :

**Étape 1** : Vérifier l'email
- Pas d'espaces avant/après
- Vérifier orthographe
- Tester copier-coller depuis email d'inscription

**Étape 2** : Vérifier mot de passe
- Majuscules/minuscules respectées ?
- Caractères spéciaux corrects ?
- Essayer afficher mot de passe (icône œil)

**Étape 3** : Réinitialiser mot de passe
1. Cliquez "Mot de passe oublié ?"
2. Entrez votre email
3. Vérifiez boîte mail (+ spam)
4. Cliquez lien dans email (valide 1h)
5. Choisissez nouveau mot de passe

**Étape 4** : Vérifier activation compte
- Email "Confirmez votre compte" reçu ?
- Cliquez lien d'activation dans email
- Si pas reçu : Demander renvoi (bouton page connexion)

**Étape 5** : Contacter support
- Email : support@smartfoodmanager.fr
- Indiquer : email utilisé, date inscription

---

### 🔴 "PIN incorrect" (serveurs)

**Symptôme** : Serveur ne peut pas se connecter sur tablette.

**Causes** :
1. PIN mal saisi (pavé numérique)
2. PIN modifié par gérant
3. Compte désactivé

**Solutions** :

1. **Revérifier PIN** : 4 chiffres uniquement
2. **Demander au gérant** :
   - Menu → Équipe → Utilisateurs
   - Vérifier PIN du serveur
   - Régénérer PIN si nécessaire
3. **Vérifier statut compte** :
   - Compte actif (✅) ?
   - Si désactivé, réactiver

---

### 🔴 "Session expirée, reconnectez-vous"

**Symptôme** : Déconnexion automatique après inactivité.

**Cause** : Session expirée après 4h inactivité (sécurité).

**Solutions** :

1. **Se reconnecter** avec identifiants habituels
2. **Données préservées** (localStorage)
3. **Pour éviter** : Garder onglet actif

**⚠️ Si données perdues après reconnexion** :
- Vérifier synchronisation cloud activée
- Restaurer backup (contacter support)

---

## Problèmes d'affichage

### 🟡 Page blanche au chargement

**Symptôme** : Écran blanc, rien ne s'affiche.

**Causes** :
1. Cache navigateur corrompu
2. Erreur JavaScript
3. Extension navigateur bloquante
4. Version navigateur obsolète

**Solutions** :

**Étape 1** : Vider cache navigateur

**Chrome** :
1. Ctrl+Shift+Delete (Cmd+Shift+Delete sur Mac)
2. Période : "Dernière heure"
3. Cocher "Images et fichiers en cache"
4. Cliquer "Effacer les données"
5. Recharger page (F5)

**Safari** :
1. Safari → Préférences → Avancées
2. Cocher "Afficher menu Développement"
3. Développement → Vider les caches
4. Recharger page (Cmd+R)

**Étape 2** : Désactiver extensions
1. Mode navigation privée (Ctrl+Shift+N)
2. Ouvrir Smart Food Manager
3. Si fonctionne → Extension en cause

**Étape 3** : Mettre à jour navigateur
- Chrome : Menu → Aide → À propos de Google Chrome
- Firefox : Menu → Aide → À propos de Firefox
- Safari : App Store → Mises à jour

**Étape 4** : Tester autre navigateur
- Chrome, Firefox, Safari, Edge
- Si fonctionne ailleurs → Problème navigateur d'origine

---

### 🟡 Images produits ne s'affichent pas

**Symptôme** : Carrés gris à la place des photos.

**Causes** :
1. Images non uploadées
2. URL image invalide
3. Connexion internet lente
4. Format image non supporté

**Solutions** :

**Vérifier upload** :
1. Carte → Produits → Modifier produit
2. Section "Photo" : Image présente ?
3. Si vide : Uploader nouvelle image

**Formats supportés** :
- ✅ JPG, JPEG, PNG, WebP
- ✅ Taille max : 5 MB
- ✅ Résolution recommandée : 800×800 px
- ❌ GIF animés, TIFF, BMP

**Connexion lente** :
- Attendre chargement complet (icône rotation)
- Vérifier débit internet (speedtest.net)

**Si persiste** :
- Télécharger image localement
- Re-uploader depuis ordinateur

---

### 🟡 Texte trop petit / trop grand

**Symptôme** : Interface illisible.

**Causes** :
1. Zoom navigateur modifié
2. Résolution écran inadaptée
3. Taille police système modifiée

**Solutions** :

**Réinitialiser zoom** :
- Chrome/Firefox : Ctrl+0 (Cmd+0 sur Mac)
- Affiche niveau zoom actuel (barre URL) : 100% = normal

**Ajuster zoom** :
- Zoom in : Ctrl++ (Cmd++)
- Zoom out : Ctrl+- (Cmd+-)
- Recommandé : 100% pour desktop, 125% pour tablette

**Résolution écran** :
- Minimum supporté : 1024×768
- Recommandé : 1920×1080 (desktop), 1280×800 (tablette)

---

## Problèmes de stock

### 🔴 "Stock négatif détecté"

**Symptôme** : Impossible de valider commande, message stock insuffisant.

**Causes** :
1. Stock théorique épuisé
2. Inventaire non fait depuis longtemps
3. Recette mal configurée (quantités excessives)
4. Réception fournisseur oubliée

**Solutions** :

**Étape 1** : Vérifier stock actuel
1. Stock → Ingrédients
2. Rechercher ingrédient bloquant
3. Noter stock affiché (ex: 0 kg)

**Étape 2** : Vérifier stock réel physique
- Reste-t-il vraiment 0 en cuisine ?
- Si oui → Rupture réelle, réapprovisionner
- Si non → Écart théorique/réel

**Étape 3** : Corriger via inventaire
1. Stock → Inventaires → + Nouvel inventaire
2. Type : "Partiel" (juste cet ingrédient)
3. Stock théorique : 0 kg (affiché automatiquement)
4. Stock réel : Saisir quantité comptée (ex: 5 kg)
5. Motif écart : "Réception non saisie" ou "Erreur saisie"
6. Valider

**Stock ajusté** : Peut maintenant vendre produit.

**Étape 4** : Identifier cause écart
- Réception oubliée ? → Former équipe à saisir immédiatement
- Recette incorrecte ? → Vérifier quantités (ex: 1.5 kg au lieu de 0.15 kg)
- Inventaire jamais fait ? → Programmer inventaire hebdomadaire

**Prévention** :
- ✅ Inventaire hebdomadaire
- ✅ Alertes stock bas activées
- ✅ Réceptions saisies jour même
- ✅ Vérifier recettes après création

---

### 🟡 Stock théorique incohérent

**Symptôme** : Stock affiché 150 kg de tomates (impossible physiquement).

**Causes** :
1. Réception saisie avec mauvaise unité (kg au lieu de g)
2. Inventaire avec erreur de saisie
3. Double saisie réception

**Solutions** :

**Étape 1** : Consulter mouvements de stock
1. Stock → Ingrédients → Cliquez sur ingrédient
2. Onglet "Mouvements"
3. Trier par date décroissante

**Exemple affichage** :
```
Date       | Type       | Quantité | Après | Motif
─────────────────────────────────────────────────────
08/01 14h  | RÉCEPTION  | +100 kg  | 150kg | Bon réception #45
08/01 10h  | VENTE      | -0.5 kg  |  50kg | Vente Salade #123
07/01 18h  | INVENTAIRE | +30 kg   |  50kg | Inventaire hebdo
```

**Étape 2** : Identifier mouvement anormal
- Réception +100 kg en 1 fois ? Suspect si produit frais
- Vérifier bon de réception réel (papier fournisseur)

**Étape 3** : Annuler mouvement incorrect
1. Cliquez sur mouvement erroné
2. Bouton "Annuler ce mouvement" (si <7 jours)
3. Motif : "Erreur saisie unité"
4. Valider

**Si mouvement >7 jours** :
- Faire inventaire avec stock réel compté
- Système ajuste automatiquement

**Étape 4** : Ressaisir correctement
- Ex: Réception 10 kg (pas 100 kg)
- Vérifier unité conditionnement fournisseur

---

### 🟡 "Alerte stock bas" constante

**Symptôme** : Notifications stock bas même après réapprovisionnement.

**Causes** :
1. Seuil stock minimum trop élevé
2. Consommation très élevée (recette gourmande)
3. Stock théorique pas mis à jour (réception oubliée)

**Solutions** :

**Vérifier seuil** :
1. Stock → Ingrédients → Modifier ingrédient
2. "Stock minimum" : Ex. 20 kg
3. Stock actuel : Ex. 15 kg → Alerte normale
4. Ajuster seuil selon consommation réelle :
   - Consommation jour : 5 kg
   - Délai réapprovisionnement : 3 jours
   - Seuil recommandé : 5×3 = **15 kg**

**Vérifier réceptions** :
- Dernière réception enregistrée ?
- Si livraison reçue mais non saisie → Créer réception

**Désactiver alerte temporairement** :
- Stock minimum = 0 (désactive alerte)
- À réactiver après stabilisation

---

## Problèmes d'encaissement

### 🔴 "Paiement refusé" (carte bancaire)

**Symptôme** : TPE affiche "Transaction refusée".

**Causes** :
1. Carte expirée / bloquée
2. Plafond dépassé
3. Solde insuffisant
4. Connexion TPE défaillante

**Solutions** :

**Côté client** :
1. Vérifier date expiration carte
2. Essayer autre carte
3. Appeler banque (plafond ?)

**Côté TPE** :
1. Vérifier connexion internet/3G
2. Relancer transaction
3. Si persiste : Mode dégradé (empreinte + signature)

**Alternative** :
- Proposer paiement espèces
- Virement / Lydia (si accepté)

**⚠️ Ne jamais forcer transaction refusée**.

---

### 🟡 Écart de caisse important

**Symptôme** : Clôture caisse avec -75€ d'écart.

**Causes** :
1. Erreur rendu monnaie
2. Commande non saisie (ticket papier oublié)
3. Remboursement non enregistré
4. Vol (rare)

**Solutions** :

**Étape 1** : Recompter physiquement
1. Vider caisse complètement
2. Trier billets/pièces
3. Compter 2 fois (ou à 2 personnes)
4. Noter total réel

**Étape 2** : Vérifier TPE
1. Ticket récapitulatif TPE (Z de caisse)
2. Total CB TPE = Total CB système ?
3. Si différence → Transaction manquante ou double

**Étape 3** : Chercher commandes manquantes
1. Comparer tickets papier vs système
2. Filtrer commandes du jour (Ventes → Historique)
3. Nombre commandes papier = Nombre système ?

**Étape 4** : Vérifier remboursements
1. Remboursements enregistrés ?
2. Vérifier journal (Ventes → Remboursements)

**Étape 5** : Documenter
1. Prendre photo caisse
2. Noter heure, montant, circonstances
3. Interroger serveur
4. Remplir fiche incident

**Clôturer avec écart** :
1. Saisir montant réel
2. Commentaire détaillé obligatoire
3. Gérant notifié automatiquement

**Seuil alerte** : >50€ → Investigation approfondie.

---

### 🟡 Impossible d'annuler une commande

**Symptôme** : Bouton "Annuler" grisé.

**Causes** :
1. Commande déjà encaissée (besoin remboursement)
2. Commande >24h (verrouillage sécurité)
3. Droits insuffisants (serveur ne peut annuler)

**Solutions** :

**Si commande encaissée** :
- Utiliser "Rembourser" (pas "Annuler")
- Créer avoir

**Si commande ancienne** :
- Délai dépassé (24h)
- Seul gérant peut annuler
- Contactez gérant

**Si droits insuffisants** :
- Connectez-vous en tant que gérant
- Ou demandez au gérant

---

## Problèmes d'impression

### 🔴 Rien ne s'imprime

**Symptôme** : Clic sur "Imprimer", rien ne se passe.

**Causes** :
1. Imprimante éteinte / déconnectée
2. Bourrage papier
3. Pilote non installé
4. Mauvais port sélectionné

**Solutions** :

**Étape 1** : Vérifier imprimante
- ✅ Allumée ? (voyant vert)
- ✅ Câble USB connecté ? (ou WiFi)
- ✅ Papier présent ?
- ✅ Pas de voyant erreur rouge ?

**Étape 2** : Test impression matériel
1. Bouton sur imprimante (selon modèle)
2. Imprime ticket test ?
3. Si oui → Problème logiciel
4. Si non → Problème matériel (bourrage, panne)

**Étape 3** : Vérifier configuration Smart Food Manager
1. Paramètres → Imprimante
2. Type : "Thermique ESC/POS" sélectionné ?
3. Port : USB001 (ou adresse IP si réseau)
4. Bouton "Tester impression"

**Étape 4** : Vérifier pilote Windows/Mac
1. Panneau configuration → Imprimantes
2. Imprimante listée ? État "Prête" ?
3. Si manquante : Installer pilote constructeur (Epson, Star)

**Étape 5** : Redémarrer
1. Éteindre imprimante
2. Débrancher USB
3. Attendre 30s
4. Rebrancher + rallumer
5. Retester

**Si persiste** :
- Essayer autre port USB
- Essayer autre câble USB
- Contacter SAV constructeur

---

### 🟡 Impression décalée / illisible

**Symptôme** : Ticket imprimé mais texte coupé, décalé ou illisible.

**Causes** :
1. Largeur papier incorrecte (80mm vs 58mm)
2. Réglages imprimante inadaptés
3. Firmware imprimante obsolète

**Solutions** :

**Vérifier largeur papier** :
1. Paramètres → Imprimante
2. Largeur : 80mm (standard) ou 58mm (compact) ?
3. Doit correspondre au rouleau physique

**Ajuster densité impression** :
- Trop clair : Augmenter densité (boutons imprimante)
- Trop foncé : Réduire densité

**Nettoyer tête impression** :
1. Ouvrir capot imprimante
2. Passer lingette alcool sur tête thermique
3. Laisser sécher
4. Retester

**Mise à jour firmware** :
- Site constructeur → Support → Téléchargements
- Télécharger dernière version firmware
- Suivre instructions mise à jour

---

### 🟡 Impression en double

**Symptôme** : 2 tickets identiques imprimés.

**Causes** :
1. Double clic bouton "Imprimer"
2. Bug logiciel
3. File d'attente imprimante bloquée

**Solutions** :

**Prévention** :
- Cliquer 1 seule fois sur "Imprimer"
- Attendre confirmation (popup "Ticket imprimé ✓")

**Si récurrent** :
1. Vider file d'attente imprimante :
   - Windows : Panneau config → Imprimantes → Clic droit → "Annuler tous les documents"
   - Mac : Préférences système → Imprimantes → Ouvrir file → Supprimer travaux
2. Redémarrer imprimante
3. Signaler bug : support@smartfoodmanager.fr

---

## Problèmes de synchronisation

### 🟡 "Erreur de synchronisation"

**Symptôme** : Notification "Impossible de synchroniser avec le cloud".

**Causes** :
1. Connexion internet coupée
2. Serveur Supabase indisponible (rare)
3. Credentials expirés

**Solutions** :

**Vérifier connexion** :
1. Ouvrir speedtest.net
2. Test débit : >1 Mbps requis
3. Si coupé : Redémarrer box internet

**Forcer synchronisation manuelle** :
1. Paramètres → Synchronisation
2. Bouton "Synchroniser maintenant"
3. Attendre (peut prendre 30s-2min si gros volume)

**Reconnexion** :
1. Se déconnecter
2. Se reconnecter
3. Sync automatique relancée

**Si persiste** :
- Vérifier statut serveurs : status.smartfoodmanager.fr
- Contacter support si incident global

---

### 🟡 Données différentes entre web et mobile

**Symptôme** : Nouveau produit créé sur web invisible sur tablette serveur.

**Causes** :
1. Synchronisation non configurée
2. Cache navigateur/app
3. Délai propagation (normal <1 min)

**Solutions** :

**Sur tablette mobile** :
1. Fermer application complètement
2. Rouvrir
3. Force refresh (pull down sur accueil)

**Vider cache mobile** :
- iOS : Réglages → Safari → Effacer historique et données
- Android : Paramètres → Apps → Smart Food Manager → Stockage → Vider cache

**Vérifier sync activée** :
1. Paramètres → Synchronisation
2. Statut : "Connecté" ✅ (vert)
3. Dernière sync : <5 min

**Activer sync temps réel** (si disponible) :
- Paramètres → Synchronisation → WebSocket : Activé

**Délai normal** :
- Sans WebSocket : Jusqu'à 5 min
- Avec WebSocket : Instantané (<5s)

**Créer produits à l'avance** :
- Best practice : 30 min avant service
- Laisser temps propagation

---

## Problèmes de performance

### 🟡 Application lente

**Symptôme** : Clics lents, menus qui lag, transitions saccadées.

**Causes** :
1. Trop d'onglets ouverts
2. RAM saturée
3. Historique très volumineux
4. Navigateur obsolète

**Solutions** :

**Fermer onglets inutiles** :
- Garder uniquement Smart Food Manager
- Fermer autres sites web

**Vider cache** :
- Chrome : Ctrl+Shift+Delete
- Période : "Dernières 24 heures"
- Cocher "Images et fichiers en cache"

**Redémarrer navigateur** :
1. Fermer complètement (vérifier pas de process en arrière-plan)
2. Rouvrir
3. Uniquement Smart Food Manager

**Redémarrer ordinateur** :
- Si lag persiste après étapes précédentes
- Libère RAM

**Archiver ancien historique** :
1. Ventes → Historique
2. Filtrer ventes >6 mois
3. Exporter CSV
4. Supprimer de l'application

**Mettre à jour navigateur** :
- Chrome : Menu → Aide → À propos
- Installer dernière version

**Hardware minimal requis** :
- RAM : 4 GB minimum, 8 GB recommandé
- CPU : Intel Core i3 ou équivalent
- Si specs insuffisantes → Upgrade matériel

---

### 🟡 Recherche produit lente

**Symptôme** : Saisie dans barre recherche, résultats après 2-3 secondes.

**Causes** :
1. Catalogue très volumineux (>500 produits)
2. Photos haute résolution
3. Filtres complexes

**Solutions** :

**Optimiser photos** :
1. Télécharger photos localement
2. Redimensionner 800×800 px (vs 4000×3000 actuelles)
3. Compresser (TinyPNG.com)
4. Re-uploader

**Désactiver produits obsolètes** :
1. Carte → Produits
2. Filtrer "Inactifs"
3. Produits saison passée → Décocher "Disponible"
4. Réduit charge recherche

**Utiliser catégories** :
- Au lieu de chercher "Pizza", naviguer : Catégorie "Pizzas" → Liste
- Plus rapide si >50 produits

**Futur** :
- Index recherche optimisé (feuille de route)

---

## Messages d'erreur courants

### ❌ "Erreur 403 : Accès refusé"

**Signification** : Vous n'avez pas les droits pour cette action.

**Causes** :
1. Connecté en tant que serveur (droits limités)
2. Fonction réservée gérant/plan supérieur

**Solution** :
- Se connecter avec compte gérant
- Ou demander au gérant d'effectuer action

---

### ❌ "Erreur 404 : Ressource introuvable"

**Signification** : Élément demandé n'existe plus.

**Causes** :
1. Produit/ingrédient supprimé
2. Lien obsolète (favoris)
3. URL incorrecte

**Solution** :
- Retourner accueil (clic logo)
- Vider cache navigateur
- Si persiste : Signaler bug

---

### ❌ "Erreur 500 : Erreur serveur"

**Signification** : Problème technique serveur.

**Causes** :
1. Bug serveur
2. Maintenance en cours
3. Charge serveur élevée

**Solutions** :
1. Attendre 5 min, réessayer
2. Vérifier status.smartfoodmanager.fr
3. Si persiste : Contacter support (urgence)

---

### ⚠️ "Votre session va expirer dans 5 min"

**Signification** : Inactivité détectée, déconnexion imminente.

**Solution** :
- Cliquer "Prolonger session"
- Ou terminer action en cours
- Ou sauvegarder et se reconnecter après

---

### ⚠️ "Modifications non sauvegardées"

**Signification** : Vous quittez page avec changements non enregistrés.

**Solution** :
- Cliquer "Rester sur page"
- Enregistrer modifications (bouton "Sauvegarder")
- Puis quitter

---

## Diagnostics avancés

### Activer mode debug

**Utile pour** : Envoyer logs détaillés au support.

**Procédure** :

1. **Ouvrir console navigateur** :
   - Chrome/Firefox : F12 ou Ctrl+Shift+J
   - Safari : Cmd+Option+C

2. **Onglet "Console"**

3. **Reproduire problème**

4. **Copier logs** :
   - Clic droit dans console → "Tout sélectionner"
   - Copier (Ctrl+C)
   - Coller dans email support

**Informations utiles** :
- Messages rouges (erreurs)
- Ligne "Failed to..." (échecs)
- Timestamps

---

### Tester connexion Supabase

**Si problèmes sync** :

1. **Console navigateur** (F12)
2. **Taper** :
```javascript
console.log(supabase)
```
3. **Résultat attendu** :
   - Object avec propriétés (auth, storage, etc.)
   - Si `null` ou `undefined` → Supabase non configuré

4. **Envoyer résultat** au support

---

### Export logs pour support

**Procédure complète** :

1. Reproduire problème
2. Ouvrir console (F12)
3. Copier logs console
4. Paramètres → Synchronisation → Copier "Dernière erreur"
5. Email support avec :
   - Description problème
   - Étapes reproduction
   - Logs console
   - Dernière erreur sync
   - Navigateur + version
   - Système d'exploitation

---

## Quand contacter le support ?

**Contactez immédiatement** si :
- 🔴 Impossible de se connecter (bloquant total)
- 🔴 Perte de données importante (>1 jour)
- 🔴 Caisse bloquée pendant service (urgence)
- 🔴 Synchronisation en échec >1h

**Contactez rapidement** si :
- 🟠 Bug récurrent après tentatives résolution
- 🟠 Performance dégradée persistante
- 🟠 Impression impossible

**Contactez quand possible** si :
- 🟡 Question fonctionnelle
- 🟡 Demande nouvelle fonctionnalité
- 🟡 Optimisation workflow

---

## Informations à fournir au support

**Checklist** :

**Obligatoire** :
- ✅ Email compte
- ✅ Restaurant concerné
- ✅ Description problème
- ✅ Date/heure problème
- ✅ Navigateur + version

**Utile** :
- ✅ Étapes reproduction
- ✅ Captures écran
- ✅ Logs console (si technique)
- ✅ Tentatives résolution déjà faites

**Exemple email bien structuré** :
```
Objet : [URGENT] Caisse bloquée - Impossible encaisser

Bonjour,

Restaurant : Le Petit Snack
Email compte : gerant@petitsnack.fr
Date/heure : 08/01/2025 à 12h30 (heure de pointe)
Navigateur : Google Chrome 121.0.6167.85

PROBLÈME :
Impossible de valider encaissement clients.
Bouton "ENCAISSER" ne réagit pas au clic.

REPRODUCTION :
1. Commande client créée normalement
2. Clic "ENCAISSER"
3. Rien ne se passe (bouton ne fait rien)

TENTATIVES :
- Rechargé page (F5) : Pas d'amélioration
- Vidé cache : Idem
- Testé autre commande : Même problème

5 clients en attente, besoin aide urgente SVP.

Cordialement,
Jean Dupont
Tel : 06 XX XX XX XX

[Capture écran en pièce jointe]
```

---

## Contact Support

**Email** : support@smartfoodmanager.fr
- Réponse <24h (jours ouvrés)
- Réponse <2h si urgence signalée (plans TEAM/BUSINESS)

**Téléphone** : 01 XX XX XX XX
- Lun-Ven 9h-18h
- Plans TEAM/BUSINESS uniquement

**Chat** :
- Application → Menu → Support
- Temps réel 9h-18h

**Statut serveurs** : status.smartfoodmanager.fr

---

**Version du guide** : 1.0.0 (Janvier 2025)
**Dernière mise à jour** : 08/01/2025
