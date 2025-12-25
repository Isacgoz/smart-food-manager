# Smart Food Manager - Guide Développeur Claude

## Règles de travail

**Communication et commits** :
- Être extrêmement concis dans toutes les interactions
- Sacrifier la grammaire pour la concision
- Commits : format ultra-court, direct, sans verbe conjugué si possible
  - ✅ `feat(recipes): ingredient conversion`
  - ✅ `fix(stock): negative values`
  - ❌ `feat(recipes): Added the ingredient conversion logic`

**Planification** :
- À la fin de chaque plan, lister les questions non résolues
- Format : `## Questions non résolues` avec liste à puces

**Tests** :
- Ne pas écrire de tests sauf demande explicite
- Assumer que les tests seront ajoutés plus tard si nécessaire

**Serveur de développement** :
- Ne jamais lancer le serveur dev
- Assumer qu'il tourne déjà en arrière-plan

**Commentaires de code** :
- Commenter avec parcimonie
- Focus sur le POURQUOI, jamais le QUOI
- Éviter les commentaires évidents
  - ✅ `// PMP recalc needed: stock valuation changes with each reception`
  - ❌ `// Loop through ingredients`

**Interactions GitHub** :
- Toujours utiliser GitHub CLI (`gh`)
- Jamais d'interface web manuellement
- Exemples :
  ```bash
  gh pr create --title "feat: recipes module" --body "..."
  gh issue create --title "bug: stock calc" --body "..."
  gh pr merge 123
  ```

---

## Vue d'ensemble du projet

Smart Food Manager est un **système de gestion intelligente pour la restauration légère** (food trucks, snacks, restaurants indépendants).

**Problème résolu** : Digitaliser la gestion manuelle (papier, Excel) pour donner une vision claire et automatique de la rentabilité.

**Cible principale** : Food trucks, snacks rapides, restaurants indépendants

**Valeur ajoutée** : Connexion automatique entre recettes, ingrédients, achats, ventes, stocks et indicateurs financiers.

---

## Architecture technique

### Stack technologique

**Backend (API centrale)**
- Langage : Python
- Framework : FastAPI
- ORM : SQLAlchemy
- Migrations : Alembic
- Base de données : PostgreSQL
- Temps réel : WebSockets (FastAPI native ou Socket.IO)

**Frontend Web (Gérant/Admin)**
- Langage : TypeScript
- Framework : React.js (avec Vite ou Next.js)
- State management : Redux Toolkit ou Zustand
- UI : MUI, Ant Design ou Chakra UI
- Auth : JWT (HttpOnly cookies)

**Application Mobile (Serveurs)**
- Framework : React Native
- Déploiement : Expo ou React Native CLI
- Fonctions : Prise de commande, gestion tables, encaissement, login PIN

**Infrastructure**
- Backend : Docker (AWS/GCP/Scaleway)
- Base de données : PostgreSQL managé
- Frontend Web : Vercel/Netlify
- Impression : ESC/POS (imprimantes thermiques réseau)

### Organisation des dépôts Git

Trois dépôts séparés :
- `backend-api` : API centrale
- `frontend-web` : Interface web administrateur
- `frontend-mobile` : Application serveurs

**Convention de branches** (Git Flow simplifié) :
- `main` : Branche stable production
- `develop` : Intégration continue
- `feature/nom-feature` : Nouvelles fonctionnalités
- `fix/nom-bug` : Corrections de bugs
- `hotfix/nom-urgent` : Corrections critiques production

---

## Principes métiers fondamentaux

### Principe n°1 : Stock d'ingrédients (pas de produits finis)
Le gérant ne gère **pas un stock de produits vendus**, mais un **stock d'ingrédients**.

**Exemple** : 
- Produit vendu : "Burger Classique"
- Ingrédients consommés automatiquement : 1 pain, 150g steak, 1 fromage, 20g oignons, 50g tomate

### Principe n°2 : Déstockage automatique
Chaque vente déclenche automatiquement :
1. Enregistrement de la vente
2. Lecture de la recette associée
3. Déstockage précis des ingrédients
4. Mise à jour du stock théorique

**Le gérant n'intervient jamais manuellement dans le déstockage.**

### Principe n°3 : Gestion des unités et conversions
Le système gère automatiquement les conversions entre :
- Unités d'achat (ex : sac 10kg)
- Unités de stockage (ex : kg)
- Unités de consommation (ex : grammes dans recette)

### Principe n°4 : Stock théorique vs inventaire
- **Stock théorique** : calculé automatiquement via achats et ventes
- **Inventaire** : comptage réel déclaré par le gérant
- **Ajustement** : correction des écarts entre théorie et réalité

---

## Processus métier détaillés

### Process Équipe Salle (Serveurs)

**Outil** : Application mobile avec login PIN personnel

**Workflow** :
1. Ouvrir une table ou commande
2. Sélectionner produits (catégories + photos)
3. Ajouter options client (sans oignon, cuisson, sauce à part)
4. Valider avec "ENVOYER"
5. → Ticket imprimé automatiquement en cuisine
6. Fin de service : compter la caisse
7. → Système compare théorique vs réel, trace les écarts

### Process Équipe Cuisine (Cuisiniers)

**Outil** : Ticket papier standardisé (pas d'écran tactile)

**Workflow** :
1. Réception ticket imprimé
2. Modifications importantes en gras
3. Préparation sans interaction logiciel
4. **Objectif** : réduire erreurs et retours

### Process Gérant (Configuration)

#### A. Création des recettes (fiches techniques)
Avant toute vente, définir les compositions :
- Liste des ingrédients
- Quantités précises
- Unités de mesure

**Le système calcule automatiquement** :
- Coût matière
- Marge brute
- Taux de coût matière

#### B. Achats et entrée en stock
1. Créer commande fournisseur
2. Valider bon de réception à la livraison
3. → Stock mis à jour automatiquement
4. → Prix moyen pondéré (PMP) recalculé

#### C. Inventaires
1. Effectuer comptage réel
2. Déclarer écarts (perte/gain)
3. → Stock théorique ajusté
4. → Indicateurs mis à jour

---

## Gestion des tables

### États d'une table (workflow)
```
FREE → OCCUPIED → DIRTY → FREE
          ↓
      RESERVED (optionnel)
```

### Tables de base de données

**Table `tables`** :
- `id` (UUID, PK)
- `company_id` (FK)
- `name` (ex : "Table 1", "Terrasse 3")
- `capacity` (nombre couverts)
- `location` (salle, terrasse, bar)
- `status` (ENUM : FREE, OCCUPIED, RESERVED, DIRTY)

**Table `table_sessions`** :
- `id` (UUID, PK)
- `table_id` (FK)
- `client_order_id` (FK)
- `opened_at`
- `closed_at`
- `status` (ENUM : OPEN, CLOSED)

**Lien avec commandes** :
- Une commande peut être liée à une table (`table_id` nullable)
- Une table peut avoir plusieurs commandes successives
- Une table n'a qu'une session ouverte à la fois

---

## Modules fonctionnels V1

### Module 1 : Produits et Recettes
- Création produits
- Fiches techniques
- Calcul automatique coût matière
- Calcul marge brute
- Taux de coût matière

### Module 2 : POS / Ventes
- Prise de commande
- Encaissement espèces et carte
- Impression tickets
- Gestion remboursements
- Lien TPE

### Module 3 : Ingrédients et Achats
- Gestion fournisseurs
- Prix d'achat
- Quantité par conditionnement
- Mise à jour stock et PMP

### Module 4 : Stock Théorique
- Calcul basé sur achats, ventes, inventaires
- Seuils stock minimum
- Alertes de rupture

### Module 5 : Inventaire
- Déclaration pertes et gains
- Ajustement stock
- Historique mouvements

### Module 6 : Dashboard
- Chiffre d'affaires
- Coût matière consommé
- Marge brute
- Top ventes
- Consommation matières premières
- Export données (CSV/Excel)

---

## Critères de succès V1

La V1 est validée si :
- ✅ Recettes correctement configurées
- ✅ Ventes déclenchent déstockage automatique
- ✅ Marges fiables et précises
- ✅ Stock compréhensible et juste
- ✅ Dashboard permet décisions rapides
- ✅ Données exportables
- ✅ Web et mobile partagent même base de données

---

## Roadmap de développement

### PHASE 1 - SÉCURITÉ (1-2 semaines) 🔴 BLOQUANT
**État actuel:** CRITIQUE - Non production-ready

#### Tâches obligatoires
- [ ] Implémenter authentification sécurisée (Supabase Auth + bcrypt)
  - Remplacer stockage mots de passe en clair (SaaSLogin.tsx:83)
  - Conformité RGPD requise
- [ ] Configurer base de données PostgreSQL
  - Renseigner SUPABASE_URL et SUPABASE_KEY (storage.ts:6-7)
  - Créer table `app_state` avec schéma multi-tenant
- [ ] Créer API backend pour validation
  - API Node.js/Express ou Supabase Edge Functions
  - Valider mutations côté serveur (anti-manipulation DevTools)
  - Implémenter JWT pour auth
- [ ] Nettoyer dépendances incompatibles
  - Supprimer react-native et @react-native-async-storage du package.json web
  - OU créer monorepo séparé web/mobile
- [ ] Corriger routing manquant
  - Ajouter route 'tables' dans App.tsx:59

#### Critères de validation
- ✅ Mots de passe hashés (bcrypt/argon2)
- ✅ DB PostgreSQL fonctionnelle
- ✅ API backend valide les données
- ✅ Pas d'erreurs dépendances
- ✅ Toutes les pages accessibles

---

### PHASE 2 - STABILITÉ (2-3 semaines) 🟠 RECOMMANDÉ
**État actuel:** Prototype fonctionnel mais fragile

#### Optimisation build & performance
- [ ] Migrer Tailwind en build-time
  - Supprimer CDN, installer via npm
  - Configurer purge CSS avec Vite
- [ ] Optimiser imports React
  - Remplacer ESM CDN par imports npm
  - Activer code splitting et tree-shaking
- [ ] Ajouter monitoring production
  - Intégrer Sentry pour erreurs
  - Remplacer console.log par logger structuré
  - Web Vitals tracking

#### Amélioration UX/DX
- [ ] Système de notifications élégant
  - Remplacer alert() natifs par react-hot-toast
  - Toasts pour succès/erreurs/warnings
- [ ] Upload images produits
  - Intégrer Cloudinary, S3 ou Supabase Storage
  - Remplacer URL string par vrai upload
- [ ] Corriger reload brutal
  - Users.tsx: recharger state uniquement (pas window.location.reload)

#### Tests critiques
- [ ] Tests unitaires calculs métier
  - Calcul PMP (Prix Moyen Pondéré)
  - Déstockage automatique
  - Calcul marges et coûts matière
- [ ] Tests intégration
  - Flux complet vente → déstockage
  - Flux achat → mise à jour stock
- [ ] Setup Vitest + React Testing Library

#### Critères de validation
- ✅ Bundle optimisé (<500KB gzip)
- ✅ Monitoring actif
- ✅ Upload images fonctionnel
- ✅ Tests critiques passent (>80% coverage logique métier)

---

### PHASE 3 - CONFORMITÉ LÉGALE (3-4 semaines) 🔴 OBLIGATOIRE FR
**État actuel:** Non conforme législation française

#### Conformité fiscale
- [ ] Numérotation factures certifiée
  - Séquence continue inaltérable
  - Horodatage sécurisé
- [ ] Mentions légales obligatoires
  - SIREN/SIRET restaurant
  - TVA détaillée par ligne (pas seulement total)
  - Adresse complète
- [ ] Certification NF525 (anti-fraude TVA)
  - Si usage commercial en France
  - Logiciel de caisse certifié
  - Archivage sécurisé 6 ans
- [ ] Rapports de Z de caisse
  - Clôture journalière
  - Récapitulatif CA, moyens paiement
  - Export comptable

#### Audit trail
- [ ] Historique complet actions
  - Qui a fait quoi, quand
  - Modifications prix (historique)
  - Logs connexions utilisateurs
- [ ] Traçabilité modifications
  - Version control des recettes
  - Changements de configuration

#### Critères de validation
- ✅ Factures conformes législation FR
- ✅ Certification NF525 (si applicable)
- ✅ Audit trail complet sur 6 mois
- ✅ Export comptable validé par expert-comptable

---

### PHASE 4 - FONCTIONNALITÉS AVANCÉES (4-6 semaines) 🟢 COMPÉTITIVITÉ
**État actuel:** MVP fonctionnel, features manquantes

#### Temps réel & sync
- [ ] Synchronisation temps réel (WebSocket)
  - Commandes cuisine instantanées
  - Mise à jour état tables live
  - Notifications serveurs
- [ ] Support multi-terminaux
  - Éviter conflits données
  - Lock optimiste sur commandes

#### Gestion trésorerie
- [ ] Fonds de caisse
  - Ouverture/clôture session
  - Fonds initial déclaré
- [ ] Calcul rendu monnaie
  - Interface paiement espèces améliorée
- [ ] Tiroir-caisse virtuel
  - Suivi espèces vs CB
  - Écarts caisse tracés

#### Commandes flexibles
- [ ] Modification commande en cours
  - Ajout/suppression articles
  - Changement quantités
- [ ] Annulation partielle
  - Remboursement ligne spécifique
- [ ] Notes et customisations
  - Déjà implémenté, améliorer UX

#### Réservations
- [ ] Interface prise de réservation
  - Calendrier + horaires
  - Statut table RESERVED utilisé
- [ ] Notifications réservations
  - Rappel serveur
  - Confirmation client (SMS/email futur)

#### Promotions
- [ ] Système de remises
  - Pourcentage ou montant fixe
  - Remise globale ou par article
- [ ] Happy hour
  - Tarifs horaires
  - Catégories produits ciblées
- [ ] Formules/menus composés
  - Entrée + Plat + Dessert
  - Prix forfaitaire

#### Statistiques avancées
- [ ] Comparaison périodes
  - Mois N vs N-1
  - Évolution YoY
- [ ] Analyse ABC produits
  - Top sellers
  - Marges contributives
- [ ] Statistiques temporelles
  - CA par heure/jour semaine
  - Prévisions ventes (ML futur)

#### Critères de validation
- ✅ WebSocket fonctionnel (latence <100ms)
- ✅ Z de caisse complet
- ✅ Modifications commandes testées
- ✅ Statistiques exploitables

---

### PHASE 5 - OPTIMISATION & SCALE (2-3 semaines) 🟡 CROISSANCE
**État actuel:** Architecture scalable, optimisations possibles

#### Progressive Web App
- [ ] Mode offline complet
  - Service Worker
  - Cache API pour données essentielles
  - Sync en différé à reconnexion
- [ ] Installation PWA
  - Manifest.json
  - Icônes toutes résolutions
  - Splash screens

#### Mobile natif
- [ ] Unifier web/mobile
  - Option A: Capacitor (web → native)
  - Option B: React Native partagé
  - Option C: PWA uniquement
- [ ] Sync bidirectionnelle
  - Données web ↔ mobile
  - Stores unifiés

#### Internationalisation
- [ ] Support multi-langues
  - react-i18next
  - FR/EN/ES minimum
- [ ] Formats locaux
  - Dates, monnaies
  - Unités métriques/impériales

#### Intégrations matériel
- [ ] Imprimante thermique ESC/POS
  - Protocole standard
  - Tickets 80mm et 58mm
- [ ] Écran cuisine (KDS)
  - Kitchen Display System
  - Alternative tickets papier
- [ ] TPE (Terminal Paiement Électronique)
  - Intégration Stripe Terminal ou équivalent

#### Accessibilité
- [ ] Conformité WCAG 2.1 AA
  - Attributs ARIA complets
  - Navigation clavier totale
  - Mode contraste élevé
- [ ] Support lecteurs d'écran
  - Tester NVDA/JAWS

#### Critères de validation
- ✅ PWA installable et offline
- ✅ Impression thermique testée
- ✅ i18n 3 langues minimum
- ✅ Score Lighthouse >90

---

### ANCIENNES PHASES (Référence architecture initiale)

#### Phase 0 : Socle technique
API centrale + Base PostgreSQL + Auth + Multi-tenant

#### Phase 1 : Catalogue & Recettes
Units + Ingrédients + Fournisseurs + Produits + Recettes + Calcul coûts

#### Phase 2 : Achats & Entrée en stock
Commandes fournisseurs + Réceptions + Mise à jour stock + PMP

#### Phase 3 : POS / Ventes
Login PIN + Sessions caisse + Commandes + Encaissements + Impression

#### Phase 4 : Déstockage automatique & Stock théorique
Lecture recettes + Déstockage auto + Mouvements + Alertes

#### Phase 5 : Tables & Service sur place
Création tables + Statuts + Commandes liées + Sessions + Paiement

#### Phase 6 : Inventaires & Ajustements
Création inventaires + Comptage + Ajustements + Historique

#### Phase 7 : Dashboard & Exports
CA + Coût matière + Marge + Top ventes + Exports CSV/Excel

#### Phase 8 : Stabilisation & Pré-production
Tests + Corrections + UX + Sécurité + Monitoring + Sauvegardes

---

## Estimation efforts totaux

### Production-ready minimum (Phases 1-3)
- Phase 1 Sécurité: 40-80h
- Phase 2 Stabilité: 60-100h
- Phase 3 Conformité: 80-120h
- Tests QA: 40h
- Documentation: 20h

**TOTAL:** 240-360 heures (~6-9 semaines full-time)

### Version compétitive (+ Phases 4-5)
**TOTAL CUMULÉ:** 400-600 heures (~10-15 semaines full-time)

---

## Conventions de code

### Commits (format recommandé)
```
type(scope): description courte

Exemples :
feat(recipes): add ingredient conversion logic
fix(stock): prevent negative stock
refactor(api): clean stock movement service
chore(ci): update pipeline config
```

### Versioning
Sémantique : `v1.0.0`, `v1.0.1`, `v1.1.0`

### Qualité
- Code review obligatoire
- Tests unitaires sur logique métier critique
- Linting automatique
- Typage strict (TypeScript, Pydantic)

### Migrations base de données
- Une migration par fonctionnalité
- Versionnées avec Alembic
- Testées avant merge
- Aucune modification manuelle en production

---

## Sécurité et multi-tenant

### Isolation des données
- Chaque requête liée à `company_id`
- Isolation stricte par entreprise

### Rôles utilisateurs
- `OWNER` : Propriétaire
- `MANAGER` : Gérant
- `SERVER` : Serveur
- `COOK` : Cuisinier

### Authentification
- JWT pour Web (HttpOnly cookies)
- PIN personnel pour Mobile (serveurs)

---

## Modèle économique

**Plan SOLO** : 29€/mois (1 utilisateur, sans multi-serveurs)
**Plan TEAM** : 79€/mois (5 utilisateurs, gestion rôles + écran cuisine)
**Plan BUSINESS** : 149€/mois (illimité, API, support prioritaire)

---

## Points d'attention techniques

### Conversion d'unités
Système critique pour la précision des coûts et du stock.
Gérer soigneusement les conversions kg → g, L → mL, etc.

### Prix moyen pondéré (PMP)
Recalculé à chaque réception fournisseur.
Formule : `PMP = (stock_actuel * PMP_ancien + qté_reçue * prix_unitaire) / (stock_actuel + qté_reçue)`

### Gestion des écarts de caisse
Tracer tous les écarts entre théorique et réel.
Associer chaque écart à un serveur et une session.

### Impression cuisine
Utiliser protocole ESC/POS standard.
Prévoir serveur d'impression local si nécessaire.

### Temps réel (WebSockets)
Essentiel pour :
- Commandes envoyées en cuisine
- Mise à jour état tables
- Suivi commandes temps réel

---

## Évolutions futures (post-V1)

- KDS écran (sans papier)
- Mode offline
- Multi-sites
- API partenaires
- Certification fiscale POS
- Modules RH et prévision
- Synchronisation cloud avancée

---

## Ressources et documentation

### Documentation API
OpenAPI auto-générée par FastAPI : `/docs`

### Schéma base de données
Maintenir diagramme à jour (ERD)

### README par dépôt
Chaque dépôt contient :
- Installation
- Configuration
- Commandes de développement
- Tests

### Diagrammes de flux
Documenter flux métier critiques :
- Flux de vente → déstockage
- Flux d'achat → mise à jour stock
- Calcul PMP

---

## Commandes utiles

### Backend (FastAPI)
```bash
# Installation
pip install -r requirements.txt

# Lancer serveur dev
uvicorn main:app --reload

# Migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Tests
pytest
```

### Frontend Web (React)
```bash
# Installation
npm install

# Développement
npm run dev

# Build production
npm run build

# Tests
npm test
```

### Frontend Mobile (React Native)
```bash
# Installation
npm install

# Lancer iOS
npm run ios

# Lancer Android
npm run android

# Tests
npm test
```

---

## Notes importantes pour Claude

### Logique de déstockage
**TOUJOURS** respecter le principe :
1. Vente enregistrée
2. Recette lue
3. Ingrédients déstockés
4. Stock théorique mis à jour

**JAMAIS** de déstockage manuel par le gérant lors d'une vente.

### Gestion des erreurs critiques
- Stock négatif → bloquer et alerter
- Écart inventaire > 10% → signaler
- Erreur conversion unité → transaction rollback

### Performance
- Indexer `company_id` sur toutes les tables
- Optimiser calculs coûts matière (requêtes JOIN)
- Cache Redis pour dashboard si besoin

### Tests prioritaires
- Calcul coût matière
- Déstockage automatique
- Conversion d'unités
- Calcul PMP
- Isolation multi-tenant

---

## Chemins critiques (Critical Paths)

### 1. Flux Stock Management
**Impact:** Coeur métier - Précision stock = précision marges
```
Achat fournisseur
  → Réception (Bon de Réception)
    → Mise à jour stock ingrédient
      → Recalcul PMP
        → Mise à jour coût recettes
          → Mise à jour marges produits
```

**Points de vigilance:**
- PMP: formule `(stock_actuel * PMP_ancien + qté_reçue * prix_unitaire) / stock_total`
- Précision: Numeric(10,3) requis (pas Float)
- Isolation: Toujours filtrer par `company_id`

### 2. Flux Multi-tenant
**Impact:** Sécurité - Isolation données clients
```
Login SaaS
  → Sélection restaurant (restaurant_id)
    → Chargement state LocalStorage (key: smart_food_db_{restaurant_id})
      → Toutes requêtes filtrées par company_id
        → Sauvegarde isolée par tenant
```

**Points de vigilance:**
- CRITIQUE: Jamais de query sans `WHERE company_id = ?`
- Vérifier permissions au niveau service ET route
- Tests: Vérifier non-leakage entre tenants

### 3. Flux Vente → Déstockage
**Impact:** Automatisation - Ne jamais casser cette chaîne
```
Commande POS
  → Validation disponibilité stock
    → Paiement confirmé
      → Pour chaque produit:
        - Lire recette (recipe)
        - Pour chaque ingrédient:
          * Calculer quantité à déduire
          * Créer mouvement SALE
          * Déduire stock
      → Mise à jour stock théorique
```

**Points de vigilance:**
- Transaction atomique (rollback si 1 ingredient fail)
- Alertes stock bas affichées AVANT validation
- Blocage partiel si stock insuffisant (configurable)

---

## Problèmes connus & Contraintes

### Issues actuels (à corriger prioritairement)

#### 1. Sécurité
- **[CRITICAL]** Mots de passe en clair (SaaSLogin.tsx:83)
  - Impact: Violation RGPD, faille sécurité
  - Fix: Supabase Auth ou bcrypt

- **[CRITICAL]** Validation côté client uniquement
  - Impact: Données manipulables DevTools
  - Fix: API backend obligatoire

- **[HIGH]** Supabase non configuré (storage.ts:6-7)
  - Impact: Perte données si LocalStorage vidé
  - Fix: Configurer projet Supabase

#### 2. Architecture
- **[MEDIUM]** Dépendances React Native dans package.json web
  - Impact: Erreurs build, confusion
  - Fix: Supprimer ou monorepo

- **[MEDIUM]** Page Tables non routée (App.tsx:59)
  - Impact: Fonctionnalité inaccessible
  - Fix: Ajouter `case 'tables': return <Tables />;`

- **[LOW]** Reload brutal après import (Users.tsx)
  - Impact: UX dégradée
  - Fix: Recharger state seulement

#### 3. Performance
- **[MEDIUM]** Tailwind CDN (non optimisé)
  - Impact: Bundle lourd, latence
  - Fix: Tailwind build-time

- **[LOW]** Console.log en production
  - Impact: Pollution console, perf
  - Fix: Logger conditionnel

### Contraintes techniques

#### Frontend
- React 19.2.3 (ESM imports CDN)
- Vite 6.2.0 dev server port 3000
- TypeScript strict mode souhaité
- Pas de tests existants (à créer)

#### Backend (futur)
- PostgreSQL requis (Supabase recommandé)
- Multi-tenant isolation stricte
- WebSocket pour temps réel

#### Mobile
- React Native séparé (actuellement non sync)
- Décision à prendre: Capacitor vs RN vs PWA

---

## Objectifs de performance

### Temps de réponse
- **POS:** Ajout produit panier <100ms
- **Déstockage:** Transaction complète <500ms
- **Dashboard:** Chargement initial <2s
- **Recherche:** Résultats <200ms

### Volumétrie cible V1
- **Restaurants:** 100 tenants simultanés
- **Produits/restaurant:** Jusqu'à 500
- **Commandes/jour/restaurant:** Jusqu'à 300
- **Ingrédients/restaurant:** Jusqu'à 200

### Disponibilité
- **Uptime:** 99.5% (objectif V1)
- **Uptime:** 99.9% (objectif V2)
- **RTO:** 4h (Recovery Time Objective)
- **RPO:** 1h (Recovery Point Objective)

---

## Pièges courants (Common Pitfalls)

### ❌ NE JAMAIS
1. **Modifier stock manuellement lors d'une vente**
   - Toujours passer par le système de recettes

2. **Oublier le filtrage company_id**
   - Leak de données entre restaurants = CRITIQUE

3. **Utiliser Float pour prix/quantités**
   - Drift cumulatif = erreurs financières
   - Toujours: Numeric(10,3) ou Decimal

4. **Hasher côté client uniquement**
   - Hash client = pas de sécurité (visible network)

5. **Déployer sans migrations testées**
   - Rollback DB = cauchemar production

6. **Ignorer les conversions d'unités**
   - kg → g, L → mL : erreurs = ruptures stock fantômes

### ✅ TOUJOURS
1. **Tester isolation multi-tenant**
   - Créer 2 restaurants, vérifier étanchéité

2. **Valider calculs PMP**
   - Vérifier avec cas limites (stock=0, réception massive)

3. **Rollback transactionnel**
   - Déstockage partiel = rollback total

4. **Logs structurés**
   - Format JSON pour parsing automatique

5. **Versionner migrations DB**
   - Alembic: toujours nommer clairement

---

## Connaissance domaine restauration

### Vocabulaire métier
- **PMP (Prix Moyen Pondéré):** Coût moyen ingrédient calculé après chaque achat
- **Coût matière (COGS):** Cost of Goods Sold, somme coûts ingrédients recette
- **Marge brute:** Prix vente - Coût matière
- **Taux de coût matière:** (Coût matière / Prix vente HT) × 100
- **Z de caisse:** Rapport clôture journalière (CA, moyens paiement)
- **Bon de Réception (BR):** Document validation livraison fournisseur
- **KDS:** Kitchen Display System, écran cuisine (vs tickets papier)
- **ESC/POS:** Protocole standard imprimantes thermiques

### Unités courantes
```
Poids: kg, g, mg
Volume: L, mL, cL
Comptage: pièce (piece), unité
```

### Taux TVA France restauration
- **5.5%:** Vente à emporter, produits alimentaires base
- **10%:** Consommation sur place
- **20%:** Alcools, produits luxe

### Calculs clés
```python
# PMP après réception
new_pmp = (stock_actuel * pmp_actuel + qté_reçue * prix_unitaire) / (stock_actuel + qté_reçue)

# Coût matière produit
cout_matiere = sum(ingredient.pmp * recette[ingredient].quantite for ingredient in recette)

# Marge brute
marge_brute = prix_vente_ht - cout_matiere

# Taux coût matière (objectif <30% pour rentabilité)
taux_cm = (cout_matiere / prix_vente_ht) * 100
```

---

## Definition of Done (DoD)

### Pour une feature
- [ ] Code écrit et testé localement
- [ ] Tests unitaires écrits (si logique métier)
- [ ] Tests intégration passent
- [ ] Pas de console.log/console.error
- [ ] Commentaires POURQUOI (pas QUOI)
- [ ] TypeScript strict (pas de `any` non justifié)
- [ ] Code review approuvé (si applicable)
- [ ] Migration DB testée (si applicable)
- [ ] Documentation mise à jour (si API publique)
- [ ] Commit respecte convention
- [ ] Branch mergée dans develop

### Pour une release
- [ ] Toutes features DoD validées
- [ ] Tests E2E passent
- [ ] Performance targets atteints
- [ ] Pas de régression identifiée
- [ ] Documentation utilisateur à jour
- [ ] Changelog généré
- [ ] Tag version créé (semver)
- [ ] Déploiement staging validé
- [ ] Rollback testé
- [ ] Monitoring configuré
- [ ] Alertes actives

---

## Commands & Workflows

### Development Workflow

#### 1. Nouvelle feature
```bash
# Créer branche
git checkout develop
git pull origin develop
git checkout -b feature/nom-feature

# Développer
[écrire code]

# Tester
npm test
npm run build  # vérifier build OK

# Commit
git add .
git commit -m "feat(scope): description courte"

# Push + PR
git push -u origin feature/nom-feature
gh pr create --title "feat: titre" --body "Description\n\nCloses #issue"
```

#### 2. Hotfix production
```bash
# Depuis main
git checkout main
git pull origin main
git checkout -b hotfix/description-courte

# Fix rapide
[corriger bug]

# Test
npm test

# Commit
git commit -m "fix(scope): description"

# PR vers main ET develop
git push -u origin hotfix/description-courte
gh pr create --base main --title "hotfix: titre"
gh pr create --base develop --title "hotfix: titre"
```

#### 3. Code review
```bash
# Reviewer checkout PR
gh pr checkout 123

# Tester localement
npm install
npm run dev
npm test

# Commenter
gh pr review 123 --comment -b "Feedback..."

# Approuver
gh pr review 123 --approve

# Merger (squash)
gh pr merge 123 --squash --delete-branch
```

### Database Workflow (futur backend)

#### Migration
```bash
# Créer migration
alembic revision --autogenerate -m "add_table_reservations"

# Vérifier SQL généré
cat alembic/versions/xxxx_add_table_reservations.py

# Appliquer
alembic upgrade head

# Rollback si problème
alembic downgrade -1
```

### Testing Workflow

#### Tests unitaires
```bash
# Run all
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Specific file
npm test -- Menu.test.tsx
```

#### Tests E2E (futur)
```bash
# Playwright
npx playwright test

# Mode UI
npx playwright test --ui

# Specific browser
npx playwright test --project=chromium
```
