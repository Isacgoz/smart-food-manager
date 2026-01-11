# 🎯 SPRINT 2 - ACTIONS UTILISATEUR REQUISES

**Date:** 8 Janvier 2026, 23:09
**Status:** Code déployé ✅ | Tests en attente ⏳

---

## ✅ CE QUI A ÉTÉ FAIT

### Code Complété et Déployé (91%)
- ✅ **20 fichiers** créés/modifiés
- ✅ **~2,500 lignes** de code ajoutées
- ✅ **Commit** créé et poussé vers GitHub
- ✅ **Déploiement** Vercel en cours (automatique)

### Fonctionnalités Implémentées

#### Phase 1: Monitoring (87%)
- ✅ Sentry error tracking intégré
- ✅ ErrorBoundary component
- ✅ Guide de configuration complet
- ✅ Session replay configuré

#### Phase 2: Documentation (100%)
- ✅ GUIDE_SERVEUR.md (250 lignes)
- ✅ FAQ.md (30 Q&A)
- ✅ GUIDE_GERANT.md (déjà existant)

#### Phase 3: Exports Comptables (92%)
- ✅ Export FEC (norme française)
- ✅ Export CA3 (déclaration TVA)
- ✅ Export des charges
- ✅ Page /exports avec sélecteur de dates

#### Phase 4: Gestion Erreurs (86%)
- ✅ Politique de stock (BLOCK/WARN/SILENT)
- ✅ Annulation commande + restock auto
- ✅ Historique des prix (NF525)
- ✅ Page /settings pour configuration

---

## 🚨 ACTIONS REQUISES (5 tâches)

### 1️⃣ CONFIGURER SENTRY (15 minutes) - URGENT

**Pourquoi:** Actuellement, les erreurs en production sont invisibles. Sentry permettra de les capturer et de recevoir des alertes.

**Étapes:**

1. **Créer un compte Sentry**
   - Aller sur https://sentry.io
   - Cliquer sur "Sign Up"
   - Utiliser votre email professionnel

2. **Créer un projet React**
   - Cliquer sur "Create Project"
   - Sélectionner "React"
   - Nommer le projet: "Smart Food Manager"
   - Cliquer sur "Create Project"

3. **Copier le DSN**
   - Après création, Sentry affiche le DSN
   - Format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
   - **COPIER CE DSN** (vous en aurez besoin)

4. **Ajouter le DSN à Vercel**
   - Aller sur https://vercel.com/dashboard
   - Sélectionner votre projet "smart-food-manager"
   - Aller dans "Settings" → "Environment Variables"
   - Cliquer sur "Add New"
   - Name: `VITE_SENTRY_DSN`
   - Value: `[COLLER LE DSN COPIÉ]`
   - Environments: Cocher "Production", "Preview", "Development"
   - Cliquer sur "Save"

5. **Redéployer**
   - Aller dans "Deployments"
   - Cliquer sur les 3 points du dernier déploiement
   - Cliquer sur "Redeploy"
   - Attendre 2-3 minutes

6. **Vérifier**
   - Ouvrir votre application en production
   - Aller dans Sentry → Issues
   - Vous devriez voir les erreurs s'afficher en temps réel

**Documentation:** Voir `docs/SENTRY_SETUP.md` pour plus de détails

---

### 2️⃣ TESTER LES EXPORTS COMPTABLES (30 minutes)

**Pourquoi:** Les exports doivent être validés avec de vraies données avant de les envoyer à votre expert-comptable.

**Étapes:**

1. **Accéder à la page Exports**
   - Se connecter en tant que OWNER ou MANAGER
   - Cliquer sur "Exports" dans le menu de navigation
   - Vous verrez 3 cartes: FEC, CA3, Charges

2. **Sélectionner une période**
   - Utiliser le sélecteur de dates
   - Ou cliquer sur un raccourci (Mois actuel, Mois dernier, Année)
   - Vérifier les statistiques affichées

3. **Tester l'export FEC**
   - Cliquer sur "Télécharger FEC (CSV)"
   - Ouvrir le fichier téléchargé
   - Vérifier que les colonnes sont correctes:
     * JournalCode, JournalLib, EcritureNum, EcritureDate
     * CompteNum, CompteLib, CompAuxNum, CompAuxLib
     * PieceRef, PieceDate, EcritureLib
     * Debit, Credit, EcritureLet, DateLet
     * ValidDate, Montantdevise, Idevise

4. **Tester l'export CA3**
   - Cliquer sur "Télécharger CA3 (CSV)"
   - Vérifier les montants de TVA par taux (5.5%, 10%, 20%)
   - Vérifier le calcul: TVA collectée - TVA déductible = TVA nette due

5. **Tester l'export Charges**
   - Cliquer sur "Télécharger Charges (CSV)"
   - Vérifier que toutes les catégories sont présentes
   - Vérifier les totaux

6. **Envoyer à votre expert-comptable**
   - Demander validation du format
   - Ajuster si nécessaire

**Formats supportés:** CSV, JSON

---

### 3️⃣ TESTER LA POLITIQUE DE STOCK (20 minutes)

**Pourquoi:** La politique de stock détermine comment l'application gère les stocks négatifs.

**Étapes:**

1. **Accéder aux Paramètres**
   - Se connecter en tant que OWNER ou MANAGER
   - Cliquer sur "Paramètres" dans le menu
   - Section "Politique de Stock"

2. **Tester le mode BLOCK (recommandé)**
   - Sélectionner "BLOCK - Bloquer la vente"
   - Cliquer sur "Enregistrer"
   - Aller au POS
   - Essayer de vendre un produit avec stock insuffisant
   - **Résultat attendu:** Message d'erreur, vente bloquée

3. **Tester le mode WARN**
   - Retourner aux Paramètres
   - Sélectionner "WARN - Avertir mais autoriser"
   - Cliquer sur "Enregistrer"
   - Aller au POS
   - Essayer de vendre un produit avec stock insuffisant
   - **Résultat attendu:** Avertissement affiché, vente autorisée

4. **Tester le mode SILENT**
   - Retourner aux Paramètres
   - Sélectionner "SILENT - Autoriser stock négatif"
   - Cliquer sur "Enregistrer"
   - Aller au POS
   - Essayer de vendre un produit avec stock insuffisant
   - **Résultat attendu:** Aucun message, vente autorisée, stock devient négatif

5. **Choisir votre politique**
   - **BLOCK:** Recommandé pour éviter les ruptures de stock
   - **WARN:** Pour les restaurants avec approvisionnement flexible
   - **SILENT:** Pour les services (pas de stock physique)

---

### 4️⃣ TESTER L'ANNULATION DE COMMANDE (15 minutes)

**Pourquoi:** L'annulation doit restaurer automatiquement le stock des ingrédients.

**Étapes:**

1. **Créer une commande test**
   - Aller au POS
   - Créer une commande avec plusieurs produits
   - Noter les quantités en stock avant la commande
   - Valider la commande

2. **Vérifier la déduction de stock**
   - Aller dans "Stocks"
   - Vérifier que les quantités ont diminué

3. **Annuler la commande**
   - Aller dans "Commandes"
   - Trouver la commande créée
   - Cliquer sur le bouton "Annuler" (icône X rouge)
   - Sélectionner une raison (ex: "Erreur de cuisine")
   - Confirmer l'annulation

4. **Vérifier le restock automatique**
   - Retourner dans "Stocks"
   - Vérifier que les quantités sont revenues à leur niveau initial
   - **Résultat attendu:** Stock restauré automatiquement

5. **Vérifier les limitations**
   - Essayer d'annuler une commande de plus de 24h
   - **Résultat attendu:** Message d'erreur, annulation bloquée
   - Essayer d'annuler une commande déjà annulée
   - **Résultat attendu:** Message d'erreur, annulation bloquée

**Note:** L'annulation est limitée à 24h pour éviter les abus et maintenir l'intégrité des données.

---

### 5️⃣ TESTER L'HISTORIQUE DES PRIX (10 minutes)

**Pourquoi:** L'historique des prix est requis pour la conformité NF525 et empêche les modifications rétroactives.

**Étapes:**

1. **Modifier le prix d'un produit**
   - Aller dans "Menu"
   - Sélectionner un produit
   - Cliquer sur "Modifier"
   - Changer le prix (ex: 10€ → 12€)
   - Cliquer sur "Enregistrer"

2. **Vérifier l'historique**
   - Dans le formulaire de modification du produit
   - Section "Historique des prix" devrait afficher:
     * Date du changement
     * Ancien prix
     * Nouveau prix
     * Utilisateur qui a fait le changement

3. **Tester la protection rétroactive**
   - Créer une commande avec le nouveau prix
   - Essayer de modifier le prix à nouveau
   - Si des commandes récentes existent (< 7 jours)
   - **Résultat attendu:** Avertissement ou blocage (selon NF525)

4. **Exporter l'historique**
   - L'historique est automatiquement inclus dans l'export FEC
   - Vérifier dans le fichier FEC téléchargé

**Conformité NF525:** Les modifications de prix rétroactives sont interdites par la loi française pour les systèmes de caisse.

---

## 📊 RÉSUMÉ DES TESTS

| Test | Durée | Priorité | Status |
|------|-------|----------|--------|
| Configurer Sentry | 15 min | 🔴 URGENT | ⏳ À faire |
| Tester exports comptables | 30 min | 🔴 URGENT | ⏳ À faire |
| Tester politique de stock | 20 min | 🟡 Important | ⏳ À faire |
| Tester annulation commande | 15 min | 🟡 Important | ⏳ À faire |
| Tester historique des prix | 10 min | 🟡 Important | ⏳ À faire |

**Temps total estimé:** 1h30

---

## 🎯 APRÈS LES TESTS

### Si tout fonctionne ✅
1. Marquer Sprint 2 comme 100% complété
2. Mettre à jour AVANCEMENT.md
3. Commencer Sprint 3 (Performance & UX)

### Si des problèmes sont détectés ❌
1. Noter les problèmes dans BUGS_PRODUCTION.md
2. Créer des issues GitHub
3. Prioriser les corrections
4. Me contacter pour assistance

---

## 📞 SUPPORT

**Documentation:**
- `docs/SENTRY_SETUP.md` - Configuration Sentry
- `docs/GUIDE_GERANT.md` - Guide du gérant
- `docs/GUIDE_SERVEUR.md` - Guide du serveur
- `docs/FAQ.md` - Questions fréquentes

**Fichiers de suivi:**
- `AVANCEMENT.md` - Progression globale
- `TODO.md` - Tâches restantes
- `BUGS_PRODUCTION.md` - Bugs connus

**Contact:**
- GitHub Issues: Pour les bugs techniques
- Email: Pour les questions urgentes

---

## 🚀 PROCHAINES ÉTAPES (Sprint 3)

Une fois Sprint 2 validé à 100%, nous passerons à Sprint 3:

### Sprint 3: Performance & UX (26h)
- Optimisation base de données (8h)
- Internationalisation FR/EN/ES (12h)
- Mode offline 100% (4h)
- Web Vitals tracking (2h)

**Objectif:** 88% de complétion globale

---

**Dernière mise à jour:** 8 Janvier 2026, 23:09
**Déploiement:** En cours sur Vercel
**Prochain jalon:** Production Pilote (21 Janvier 2026)
