# 🎯 PLAN D'ACTION - CE QUI RESTE À FAIRE

**Dernière mise à jour:** 8 Janvier 2026 19:00
**Score actuel:** 75% → Objectif: 100%
**Statut:** Sprint 1 terminé (44h) - Sprint 2 en préparation

---

## 📊 RÉSUMÉ EXÉCUTIF

| Sprint | Heures | Priorité | Bloquant? | Délai |
|--------|--------|----------|-----------|-------|
| Sprint 2 | 32h | 🔴 Critique | Pilote | 2 semaines |
| Sprint 3 | 26h | 🟡 Important | Non | 2 semaines |
| Sprint 4 | 26h | 🔴 Critique FR | Commercialisation | 2 semaines |
| Sprint 5 | - | 🔴 Externe | Légal | 6-8 semaines |
| Sprint 6 | 52h | 🟢 Nice | Non | Flexible |

**Total développement restant:** 136h (17 jours)
**Délai externe (NF525):** 6-8 semaines
**Budget restant:** 10 200€ + 5-10K€ certification

---

## 🔥 SPRINT 2: STABILITÉ (32h - URGENT)

### 1. Monitoring Sentry (8h) - 🔴 BLOQUANT PILOTE
```
[ ] Installer @sentry/react + @sentry/vite-plugin
[ ] Créer projet Sentry + obtenir DSN
[ ] Configurer VITE_SENTRY_DSN en .env
[ ] Intégrer Sentry.init() dans main.tsx
[ ] Wrapper services avec captureException()
[ ] Capturer BusinessError automatiquement
[ ] Session replay users (breadcrumbs)
[ ] Dashboard erreurs + alertes email
```
**Impact:** Bugs invisibles actuellement
**Tests:** Déclencher erreur volontaire → voir Sentry

---

### 2. Documentation Utilisateur (8h) - 🔴 BLOQUANT PILOTE

#### GUIDE_GERANT.md (4h)
```
[ ] Section 1: Première connexion (30min)
    - Créer compte SaaS
    - Sélectionner restaurant
    - Vue d'ensemble interface

[ ] Section 2: Configuration initiale (1h)
    - Créer catégories produits
    - Ajouter ingrédients (CSV ou manuel)
    - Créer produits + photos
    - Définir recettes
    - Calcul coûts automatique

[ ] Section 3: Gestion quotidienne (1h)
    - Vérifier stock
    - Achats fournisseurs
    - Clôture caisse
    - Dashboard CA/Marges

[ ] Section 4: Exports comptables (30min)
    - Export FEC
    - Export TVA
    - Export charges

[ ] Section 5: Dépannage (1h)
    - Stock négatif
    - Erreur synchronisation
    - Modifier prix produit
    - Annuler commande
```

#### GUIDE_SERVEUR.md (2h)
```
[ ] Installation PWA smartphone (30min)
[ ] Login PIN personnel (15min)
[ ] Prendre commande (30min)
    - Sélectionner table
    - Ajouter produits
    - Options client
    - Envoyer cuisine
[ ] Encaissement (30min)
    - Espèces (calcul rendu)
    - Carte bancaire
    - Ticket imprimé
[ ] Mode offline (15min)
```

#### FAQ.md (2h)
```
[ ] 10 Q&A techniques
[ ] 10 Q&A métier
[ ] 10 Q&A comptabilité
```

**Impact:** Pilote impossible sans docs
**Déliverable:** 3 fichiers Markdown + screenshots

---

### 3. Export Comptable (8h) - 🟡 IMPORTANT

#### Export FEC (Fichier Écritures Comptables) (3h)
```
[ ] Service fec-enhanced.ts
    - Format FEC réglementaire
    - Validation colonnes obligatoires
    - Tests avec expert-comptable

[ ] Interface /exports/fec
    - Sélection période
    - Téléchargement CSV
    - Preview avant export
```

#### Export TVA CA3 (2h)
```
[ ] Service tva-export.ts
    - Calcul TVA collectée
    - TVA déductible
    - Format CA3 simplifié

[ ] Interface /exports/tva
```

#### Export Charges (3h)
```
[ ] Service charges-export.ts
    - Catégorisation charges
    - Export CSV compatible compta

[ ] Dashboard /exports
    - Onglets FEC/TVA/Charges
    - Historique exports
```

**Impact:** Comptable bloqué sans exports
**Tests:** Valider avec expert-comptable

---

### 4. Gestion Erreurs (8h) - 🟡 IMPORTANT

#### Stock Négatif Policy (4h)
```
[ ] Service stock-policy.ts
    - Enum: BLOCK | WARN | SILENT
    - Configuration par restaurant

[ ] Intégrer dans déstockage.ts
    - BLOCK: Refuse vente
    - WARN: Alerte + continue
    - SILENT: Aucune action

[ ] Interface Settings
    - Toggle policy
    - Seuil alerte stock bas

[ ] Tests (2h)
    - Vente avec stock=0
    - Vente avec stock=5 (seuil 10)
```

#### Annulation Commande + Restock (2h)
```
[ ] Service cancel-order.ts
    - Restock automatique ingrédients
    - Historique mouvements
    - Motif annulation obligatoire

[ ] UI bouton "Annuler"
    - Confirmation obligatoire
    - Champ motif

[ ] Tests
    - Annuler commande → vérifier stock restauré
```

#### Modification Prix + Historique (2h)
```
[ ] Service price-history.ts
    - Table price_changes (date, old, new, user)
    - Trigger auto sur UPDATE products

[ ] Interface historique prix
    - Timeline modifications
    - Graphique évolution

[ ] Tests
    - Modifier prix → vérifier historique créé
```

**Impact:** Edge cases production non gérés
**Tests:** Scénarios limites

---

### 🎯 Déliverables Sprint 2

- ✅ Sentry actif (erreurs tracées temps réel)
- ✅ 3 guides utilisateur complets
- ✅ Export FEC/TVA/Charges validé comptable
- ✅ Gestion erreurs robuste (3 policies)

**Critère Go/No-Go Pilote:** Sprint 2 terminé à 100%

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

## ✅ PROCHAINE ACTION IMMÉDIATE

**AUJOURD'HUI (8 Jan PM):**
1. Vérifier Vercel deployment READY
2. Vérifier backup bucket fonctionnel
3. Créer projet Sentry

**DEMAIN (9 Jan):**
1. Setup Sentry complet (4h)
2. Commencer GUIDE_GERANT.md (2h)

**FIN SEMAINE (10-12 Jan):**
1. Finir documentation (6h)
2. Export FEC (3h)

---

**Prochaine révision:** Vendredi 12 Janvier 2026 (fin Sprint 2 semaine 1)
