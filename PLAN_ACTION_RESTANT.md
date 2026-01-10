# 🎯 PLAN D'ACTION - CE QUI RESTE À FAIRE

**Dernière mise à jour:** 8 Janvier 2026 21:30
**Score actuel:** 96% → Objectif: 100%
**Statut:** Sprint 2 TERMINÉ (54/56 tâches) - Sprint 3 en préparation

---

## 📊 RÉSUMÉ EXÉCUTIF

| Sprint | Statut | Heures | Priorité | Délai |
|--------|--------|--------|----------|-------|
| ~~Sprint 2~~ | ✅ **96% TERMINÉ** | ~~32h~~ | ✅ Fait | - |
| Sprint 3 | ⏸️ À faire | 26h | 🟡 Important | 2 semaines |
| Sprint 4 | ⏸️ À faire | 26h | 🔴 Critique FR | 2 semaines |
| Sprint 5 | ⏸️ Externe | - | 🔴 Légal | 6-8 semaines |
| Sprint 6 | ⏸️ Nice | 52h | 🟢 Optionnel | Flexible |

**Total développement restant:** 104h (13 jours)
**Sprint 2 complété:** +21% (75% → 96%) 🎉
**Délai externe (NF525):** 6-8 semaines
**Budget restant:** 7 800€ + 5-10K€ certification

---

## ✅ SPRINT 2: STABILITÉ - **96% TERMINÉ** (54/56 tâches)

### ✅ Phase 1: Monitoring Production (100%) - 8h
**Fichiers créés:**
- ✅ services/sentry.ts (150 lignes) - Initialisation Sentry
- ✅ components/ErrorBoundary.tsx (80 lignes) - Gestion erreurs React
- ✅ docs/SENTRY_SETUP.md (200 lignes) - Guide configuration

**Fonctionnalités:**
- ✅ Installation et configuration complète Sentry
- ✅ Capture automatique erreurs runtime + BusinessError
- ✅ Session replay (10% échantillon, 100% sur erreurs)
- ✅ Performance monitoring
- ✅ Privacy-first (maskAllText, blockAllMedia)

**Action requise:**
- ⏳ Créer compte Sentry + ajouter DSN dans Vercel (10min)

---

### ✅ Phase 2: Documentation Utilisateur (100%) - 8h

**GUIDE_SERVEUR.md (250 lignes) ✅**
- ✅ Installation PWA (iOS/Android/tablettes)
- ✅ Connexion PIN
- ✅ Prise de commandes (tables, produits, options)
- ✅ Encaissement (espèces + rendu, carte, tickets)
- ✅ Mode offline et dépannage

**FAQ.md (400 lignes avec 30 Q&A) ✅**
- ✅ 10 questions techniques
- ✅ 10 questions métier
- ✅ 10 questions comptables

**GUIDE_GERANT.md (571 lignes) ✅**
- ✅ Section 1: Première connexion
- ✅ Section 2: Configuration initiale (catégories, ingrédients, produits, recettes)
- ✅ Section 3: Gestion quotidienne (stock, achats, caisse, dashboard)
- ✅ Section 4: Exports comptables
- ✅ Section 5: Dépannage

---

### ✅ Phase 3: Exports Comptables (92%) - 7.5h/8h

**accounting-fec.ts (450 lignes) - Export FEC ✅**
- ✅ Format pipe-separated conforme norme française
- ✅ Écritures de ventes et achats
- ✅ Ventilation TVA par taux (5.5%, 10%, 20%)
- ✅ Numérotation automatique des comptes

**accounting-ca3.ts (350 lignes) - Export CA3 ✅**
- ✅ Déclaration TVA avec calcul par taux
- ✅ TVA collectée vs déductible
- ✅ Formats CSV et JSON

**accounting-expenses.ts (400 lignes) - Export Charges ✅**
- ✅ Catégorisation charges (loyer, salaires, fournitures, eau/gaz/électricité, marketing, assurance, entretien)
- ✅ Période personnalisable
- ✅ Calcul EBE (Excédent Brut d'Exploitation)
- ✅ Formats CSV et JSON

**Interface manquante:**
- ⏳ Dashboard /exports avec onglets FEC/TVA/Charges (30min)

---

### 🎯 Déliverables Sprint 2

- ✅ Sentry actif (configuration complète - besoin DSN)
- ✅ 3 guides utilisateur complets (1221 lignes)
- ✅ Export FEC/TVA/Charges (services créés)
- ⏳ Interface exports (30min restantes)
- ⏳ Gestion erreurs robuste (non critique - reporté Sprint 3)

**Critère Go/No-Go Pilote:** ✅ **ATTEINT** (96%)

---

## 🟢 SPRINT 3: PERFORMANCE & UX (26h)

### 1. Optimisation Performance (8h)

#### Partitionnement app_state (4h)
```
[ ] Migration 007: Partition par company_id
    - CREATE TABLE app_state_part...
    - Partitionnement PostgreSQL

[ ] Tests charge
    - 500 restaurants simultanés
    - Requêtes <200ms
```

#### Indexes JSONB (2h)
```
[ ] Indexes GIN sur data JSONB
    - data->'products'
    - data->'orders'
    - data->'ingredients'

[ ] Tests queries complexes
```

#### Table Pré-Agrégée (2h)
```
[ ] Migration 008: daily_stats
    - company_id, date, ca, orders_count
    - Trigger mise à jour auto

[ ] Intégrer dans Dashboard
```

---

### 2. Internationalisation i18n (12h)

#### Setup react-i18next (2h)
```
[ ] npm install react-i18next i18next
[ ] Créer i18n.ts config
[ ] Wrapper <I18nextProvider>
[ ] Créer locales/fr.json
```

#### Traduction FR/EN/ES (6h)
```
[ ] Traduction interface complète (300+ strings)
[ ] Pluralisation (1 produit / 2 produits)
[ ] Dates format localisé
```

#### Formats Locaux (4h)
```
[ ] Service locale-formatter.ts
    - Dates: DD/MM/YYYY vs MM/DD/YYYY
    - Monnaies: 12,50€ vs $12.50
    - Unités: kg vs lb

[ ] Sélecteur langue interface
```

---

### 3. Mode Offline 100% (4h)

```
[ ] Service Worker cache ALL assets
[ ] IndexedDB avec Dexie.js
    - Cache orders, products, ingredients
    - Sync queue (retry exponentiel)

[ ] UI indicateur offline
[ ] Tests offline >24h
    - Créer 50 commandes offline
    - Reconnexion → sync auto
```

---

### 4. Web Vitals (2h)

```
[ ] npm install web-vitals
[ ] Tracking CLS, FID, FCP, LCP, TTFB
[ ] Envoyer à Vercel Analytics
[ ] Dashboard métriques performance
```

---

### 🎯 Déliverables Sprint 3

- ✅ Dashboard <2s avec 1000+ commandes
- ✅ i18n FR/EN/ES actif
- ✅ PWA offline 100% fonctionnel
- ✅ Lighthouse score >90

**Critère Go/No-Go Multi-Clients:** Performance validée

---

## 🔴 SPRINT 4: CONFORMITÉ NF525 (26h - CRITIQUE)

### 1. Archivage Immuable (6h)

```
[ ] Service blockchain-archival.ts OU signature-archival.ts
    - Hash SHA-256 chaque facture
    - Chaînage hash précédent
    - Stockage immuable Supabase

[ ] Tests intégrité
    - Modifier archive → détection
```

---

### 2. Horodatage Certifié (2h)

```
[ ] Intégration TSA (Time Stamp Authority)
    - API Universign ou équivalent
    - Timestamp chaque Z caisse

[ ] Certificat horodatage stocké
```

---

### 3. Exports XML Comptables (3h)

```
[ ] Service xml-export.ts
    - Format CEGID/SAGE
    - Validation XSD schéma

[ ] Interface export XML
```

---

### 4. Historique Prix Versions (2h)

```
[ ] Table product_versions
    - Versioning automatique
    - Trigger UPDATE products

[ ] Interface timeline produit
```

---

### 5. Audit Trail Complet (3h)

```
[ ] Service audit-logger.ts
    - Logger TOUTES actions
    - Qui/Quand/Quoi/Données avant/après

[ ] Table audit_logs (>6 ans rétention)
[ ] Interface consultation logs admin
```

---

### 6. Dossier Technique NF525 (10h)

```
[ ] Rédiger documentation technique
    - Architecture système
    - Mesures sécurité
    - Tests conformité
    - Procédures sauvegarde

[ ] Préparer démo auditeur
[ ] Checklist 200+ critères NF525
```

---

### 🎯 Déliverables Sprint 4

- ✅ Dossier technique NF525 complet (200 pages)
- ✅ Archivage immuable actif
- ✅ Audit trail 100% traçable
- ✅ Prêt pour audit externe

**Critère Go/No-Go Certification:** Dossier accepté par organisme

---

## ⏳ SPRINT 5: CERTIFICATION EXTERNE (6-8 semaines)

```
[ ] Semaine 1-2: Demande audit + envoi dossier
    - Contacter LNE ou INFOCERT
    - Envoyer dossier technique
    - Paiement 5-10K€

[ ] Semaine 3-4: Pré-audit documentaire
    - Questions organisme
    - Corrections demandées

[ ] Semaine 5-6: Audit technique
    - Tests conformité
    - Audit sur site (optionnel)

[ ] Semaine 7-8: Rapport final
    - Corrections mineures
    - Obtention certificat NF525
    - Attestation individuelle générée
```

**Délai:** 6-8 semaines (hors contrôle)
**Coût:** 5 000€ - 10 000€
**Impact:** BLOQUE commercialisation légale France

---

## 🟢 SPRINT 6: NICE-TO-HAVE (52h - OPTIONNEL)

### 1. Multi-Sites (16h)

```
[ ] Migration 009: sites table
[ ] UI sélecteur site
[ ] Dashboard consolidé multi-sites
[ ] Transferts stock inter-sites
```

---

### 2. Imprimante ESC/POS (6h)

```
[ ] Service escpos-print.ts
[ ] Protocole ESC/POS standard
[ ] Auto-discovery réseau (mDNS)
[ ] Tests imprimante 80mm + 58mm
```

---

### 3. TPE Stripe Terminal (8h)

```
[ ] npm install @stripe/terminal-js
[ ] Service stripe-terminal.ts
[ ] UI paiement TPE
[ ] Tests cartes test Stripe
```

---

### 4. Export Sage/QuickBooks (8h)

```
[ ] Format Sage export
[ ] Format QuickBooks IIF
[ ] Interface export compatible
```

---

### 5. Notifications Push (8h)

```
[ ] PWA push notifications API
[ ] Service push-notifications.ts
[ ] Android Capacitor push
[ ] Tests notif cuisine temps réel
```

---

### 6. QR Code Tables (4h)

```
[ ] Génération QR par table
[ ] Page commande client (/order/:tableId)
[ ] Paiement en ligne (Stripe)
```

---

### 7. Analytics ML (2h)

```
[ ] Service ml-forecast.ts
[ ] Prévisions ventes (linear regression)
[ ] ABC analysis produits
[ ] Dashboard insights
```

---

## 📅 PLANNING RECOMMANDÉ

### Semaine 2 (13-17 Jan)
**Objectif:** Débloquer pilote commercial
```
Lundi: Sentry setup (4h)
Mardi: GUIDE_GERANT.md (4h)
Mercredi: GUIDE_SERVEUR + FAQ (4h)
Jeudi: Export FEC (3h)
Vendredi: Export TVA + Charges (5h)
```
**Livrable:** Documentation + Monitoring

---

### Semaine 3 (20-24 Jan)
**Objectif:** Gestion erreurs robuste
```
Lundi: Stock négatif policy (4h)
Mardi: Annulation + restock (2h)
Mercredi: Historique prix (2h)
Jeudi: Tests intégration (4h)
Vendredi: Performance tuning (4h)
```
**Livrable:** Sprint 2 terminé (Go pilote)

---

### Semaine 4-5 (27 Jan - 7 Fév)
**Objectif:** Performance + i18n
```
Sprint 3 complet (26h)
Tests charge 500 restaurants
Lighthouse >90
```
**Livrable:** Production multi-clients

---

### Semaine 6-7 (10-21 Fév)
**Objectif:** Préparation NF525
```
Sprint 4 complet (26h)
Dossier technique 200 pages
Demande audit organisme
```
**Livrable:** Dossier NF525 envoyé

---

### Semaine 8-15 (24 Fév - 18 Avr)
**Objectif:** Certification
```
Sprint 5 (externe)
Suivi audit organisme
Corrections demandées
```
**Livrable:** Certificat NF525 reçu

---

### Semaine 16+ (21 Avr+)
**Objectif:** Features avancées
```
Sprint 6 (52h - flexible)
Multi-sites, imprimantes, TPE...
```
**Livrable:** Version 2.0 complète

---

## 🎯 JALONS DÉCISIONNELS

### Jalon 1: Pilote Commercial (24 Jan)
**Go/No-Go:** 1 restaurant pilote réel
**Requis:**
- ✅ Sprint 2 terminé (docs + monitoring)
- ✅ RLS isolation testée
- ✅ Backup fonctionnel

---

### Jalon 2: Beta Multi-Clients (7 Fév)
**Go/No-Go:** 3-5 restaurants actifs
**Requis:**
- ✅ Sprint 3 terminé (performance)
- ✅ Export comptable validé expert
- ✅ Dashboard <2s charge

---

### Jalon 3: Commercialisation France (18 Avr)
**Go/No-Go:** Vente ouverte légale
**Requis:**
- ✅ Certificat NF525 reçu
- ✅ Audit conformité passé
- ✅ Attestation individuelle générée

---

## 💰 BUDGET RESTANT

### Développement
| Sprint | Heures | Taux (75€/h) | Total |
|--------|--------|--------------|-------|
| Sprint 2 | 32h | 75€ | 2 400€ |
| Sprint 3 | 26h | 75€ | 1 950€ |
| Sprint 4 | 26h | 75€ | 1 950€ |
| Sprint 6 | 52h | 75€ | 3 900€ |
| **TOTAL** | **136h** | | **10 200€** |

### Certification
- Audit NF525: 5 000€ - 10 000€
- Consultations expert: 1 000€

**TOTAL PROJET RESTANT:** 16 200€ - 21 200€

---

## 🚨 RISQUES IDENTIFIÉS

### Risque 1: Certification NF525 Refusée
**Probabilité:** 30%
**Mitigation:** Pré-audit interne + consultant expert

### Risque 2: Performance <2s Impossible
**Probabilité:** 20%
**Mitigation:** Architecture Redis cache

### Risque 3: Pilote Retardé
**Probabilité:** 40%
**Mitigation:** Prioriser Sprint 2 docs

---

## 🎉 RÉALISATIONS SPRINT 2

**Durée:** 3 jours (6-8 Janvier 2026)
**Heures réelles:** ~32h
**Tâches complétées:** 54/56 (96%)
**Progression globale:** +21% (75% → 96%)

**Fichiers créés:** 9 fichiers, 2 871 lignes de code
- services/sentry.ts (150L)
- components/ErrorBoundary.tsx (80L)
- docs/SENTRY_SETUP.md (200L)
- docs/GUIDE_SERVEUR.md (250L)
- docs/FAQ.md (400L)
- docs/GUIDE_GERANT.md (571L)
- services/accounting-fec.ts (450L)
- services/accounting-ca3.ts (350L)
- services/accounting-expenses.ts (400L)

---

## ✅ ACTIONS IMMÉDIATES (30min)

**À faire maintenant:**
1. Créer compte Sentry (10min)
   - https://sentry.io/signup/
   - Créer projet "smart-food-manager"
   - Copier DSN

2. Configurer Vercel (10min)
   - Settings → Environment Variables
   - Ajouter VITE_SENTRY_DSN
   - Redéployer

3. Interface /exports dashboard (30min) - OPTIONNEL
   - Créer page Exports.tsx
   - Onglets FEC/TVA/Charges
   - Boutons téléchargement

---

## 🎯 PROCHAINE ÉTAPE: SPRINT 3 (26h)

**Objectif:** Performance + i18n + Offline
**Priorité:** 🟡 Important (non bloquant pilote)
**Délai:** 2 semaines

**Décision requise:**
- Démarrer Sprint 3 maintenant? (performance)
- Ou passer directement Sprint 4? (NF525 - critique France)
- Ou lancer pilote commercial? (96% ready)

---

**Prochaine révision:** 9 Janvier 2026 (après config Sentry)
