# Smart Food Manager - Plan d'Action Détaillé

**Généré le**: 2026-01-23
**Statut actuel**: 82% Production-Ready
**Branche**: stable-pre-sprint2

---

## Résumé Exécutif

L'application est fonctionnelle avec les modules core implémentés. Pour atteindre **100% production-ready**, les priorités sont:

1. **🔴 Certification NF525** - Obligatoire légal France
2. **🟠 Backups automatiques** - Critique pour production
3. **🟡 Tests E2E** - Qualité avant déploiement
4. **🟢 Optimisations UX** - Amélioration continue

---

## Sprint 2 - Certification & Compliance (Priorité Haute)

### Epic 2.1: Conformité NF525 (Bloquant)

**Contexte**: La certification NF525 est obligatoire en France pour tout logiciel de caisse depuis 2018. Non-conformité = amende 7500€.

| Story | Description | Effort | Priorité |
|-------|-------------|--------|----------|
| **2.1.1** | Numérotation factures inaltérable côté serveur | M | P0 |
| **2.1.2** | Archivage factures PostgreSQL (6 ans) | M | P0 |
| **2.1.3** | Horodatage certifié (serveur, pas client) | S | P0 |
| **2.1.4** | Audit trail modifications prix | S | P0 |
| **2.1.5** | Z de caisse journalier automatique | M | P0 |
| **2.1.6** | Export conformité pour audit | S | P1 |

**Fichiers à modifier**:
- [shared/services/invoicing.ts](../../shared/services/invoicing.ts) - Numérotation
- [supabase/migrations/](../../supabase/migrations/) - Tables archivage
- [services/accounting-fec.ts](../../services/accounting-fec.ts) - Export

**Critères d'acceptation**:
- [ ] Numéro facture généré côté Supabase (pas client)
- [ ] Séquence continue sans trous
- [ ] Table `archived_orders` avec retention 6 ans
- [ ] Timestamp serveur UTC sur chaque facture
- [ ] Log modifications prix avec before/after

---

### Epic 2.2: Sécurité Données

| Story | Description | Effort | Priorité |
|-------|-------------|--------|----------|
| **2.2.1** | Backup automatique quotidien Supabase | S | P0 |
| **2.2.2** | Export backup chiffré | M | P1 |
| **2.2.3** | Procédure restauration testée | S | P1 |
| **2.2.4** | Rotation logs sensibles | S | P2 |

**Fichiers à modifier**:
- [api/cron/backup.js](../../api/cron/backup.js) - Cron job
- [shared/services/backup.ts](../../shared/services/backup.ts) - Logique

---

### Epic 2.3: Audit Trail Complet

| Story | Description | Effort | Priorité |
|-------|-------------|--------|----------|
| **2.3.1** | Log connexions utilisateurs | S | P1 |
| **2.3.2** | Historique modifications produits | M | P1 |
| **2.3.3** | Traçabilité annulations commandes | S | P0 |
| **2.3.4** | Dashboard audit pour gérant | M | P2 |

**Fichiers existants**:
- [services/price-history.ts](../../services/price-history.ts) - Déjà implémenté
- [services/order-cancellation.ts](../../services/order-cancellation.ts) - Déjà implémenté

---

## Sprint 3 - Qualité & Tests (Priorité Moyenne)

### Epic 3.1: Tests End-to-End

| Story | Description | Effort | Priorité |
|-------|-------------|--------|----------|
| **3.1.1** | Setup Playwright | S | P1 |
| **3.1.2** | Test flux vente complet | M | P1 |
| **3.1.3** | Test flux achat → réception | M | P1 |
| **3.1.4** | Test rapprochement caisse | S | P1 |
| **3.1.5** | Test isolation multi-tenant | M | P0 |

**Structure proposée**:
```
tests/
├── e2e/
│   ├── sale-flow.spec.ts
│   ├── purchase-flow.spec.ts
│   ├── cash-reconciliation.spec.ts
│   └── multi-tenant.spec.ts
```

---

### Epic 3.2: Couverture Tests Unitaires

| Story | Description | Effort | Priorité |
|-------|-------------|--------|----------|
| **3.2.1** | Tests calcul TVA par ligne | S | P1 |
| **3.2.2** | Tests validation stock edge cases | S | P1 |
| **3.2.3** | Tests merge orders (conflits) | M | P2 |
| **3.2.4** | Tests permissions rôles | S | P1 |

**Tests existants** (167+):
- [tests/unit/business.test.ts](../../tests/unit/business.test.ts) ✅
- [tests/unit/invoicing.test.ts](../../tests/unit/invoicing.test.ts) ✅
- [tests/unit/expenses.test.ts](../../tests/unit/expenses.test.ts) ✅

---

## Sprint 4 - Mobile & Sync (Priorité Moyenne)

### Epic 4.1: Finalisation Mobile

| Story | Description | Effort | Priorité |
|-------|-------------|--------|----------|
| **4.1.1** | Sync bidirectionnelle complète | L | P1 |
| **4.1.2** | Offline queue robuste | M | P1 |
| **4.1.3** | Résolution conflits automatique | M | P2 |
| **4.1.4** | Tests mobile sur device réel | M | P1 |

**Fichiers**:
- [mobile/store.tsx](../../mobile/store.tsx) - State management
- [mobile/services/](../../mobile/services/) - Services mobile

---

### Epic 4.2: PWA Améliorations

| Story | Description | Effort | Priorité |
|-------|-------------|--------|----------|
| **4.2.1** | Cache API intelligent | M | P2 |
| **4.2.2** | Background sync orders | M | P1 |
| **4.2.3** | Push notifications commandes | M | P2 |
| **4.2.4** | Install prompt optimisé | S | P3 |

---

## Sprint 5 - Fonctionnalités Avancées (Priorité Basse)

### Epic 5.1: Intégrations Matériel

| Story | Description | Effort | Priorité |
|-------|-------------|--------|----------|
| **5.1.1** | Support imprimantes USB | M | P2 |
| **5.1.2** | Intégration TPE (Stripe Terminal) | L | P2 |
| **5.1.3** | KDS écran (remplacer tickets) | L | P3 |
| **5.1.4** | Scanner code-barres | S | P3 |

---

### Epic 5.2: Analytics Avancées

| Story | Description | Effort | Priorité |
|-------|-------------|--------|----------|
| **5.2.1** | Comparaison périodes (N vs N-1) | M | P2 |
| **5.2.2** | Analyse ABC produits | M | P2 |
| **5.2.3** | Prévision ventes (ML simple) | L | P3 |
| **5.2.4** | Export automatique comptable | M | P2 |

---

### Epic 5.3: Multi-sites

| Story | Description | Effort | Priorité |
|-------|-------------|--------|----------|
| **5.3.1** | Architecture multi-sites | L | P3 |
| **5.3.2** | Dashboard consolidé | L | P3 |
| **5.3.3** | Transfert stock inter-sites | M | P3 |

---

## Bugs Connus à Corriger

| ID | Description | Fichier | Priorité |
|----|-------------|---------|----------|
| BUG-001 | Route 'tables' manquante App.tsx | App.tsx:59 | P1 |
| BUG-002 | Reload brutal après import Users | Users.tsx | P2 |
| BUG-003 | TVA hardcodée 10% Dashboard | Dashboard.tsx:72 | P1 |
| BUG-004 | order.type undefined invoicing | invoicing.ts:108 | P1 |

---

## Dette Technique

| Item | Impact | Effort | Priorité |
|------|--------|--------|----------|
| Migrer vers Tailwind build-time | Perf | S | P2 |
| Supprimer dépendances RN du package.json web | Build | S | P1 |
| Remplacer `any` types restants | Qualité | M | P2 |
| Centraliser gestion erreurs | Maintenabilité | M | P2 |
| Ajouter i18n (react-i18next) | Scalabilité | L | P3 |

---

## Métriques de Succès

### Sprint 2 (Certification)
- [ ] Score NF525: 100% (actuellement 67%)
- [ ] Backups: Automatique quotidien
- [ ] Audit trail: 100% actions tracées

### Sprint 3 (Qualité)
- [ ] Couverture tests: >80%
- [ ] Tests E2E: 5 scénarios critiques
- [ ] Zero bugs P0 en production

### Sprint 4 (Mobile)
- [ ] Sync success rate: >99%
- [ ] Offline capability: 48h autonomie
- [ ] Performance mobile: <100ms actions

---

## Estimation Globale

| Sprint | Effort | Durée estimée |
|--------|--------|---------------|
| Sprint 2 - Certification | ~80h | 2 semaines |
| Sprint 3 - Qualité | ~60h | 1.5 semaines |
| Sprint 4 - Mobile | ~80h | 2 semaines |
| Sprint 5 - Avancées | ~120h | 3 semaines |

**Total pour 100% production**: ~340h (~8-9 semaines full-time)

---

## Prochaines Actions Immédiates

1. **Aujourd'hui**: Corriger BUG-001 (route tables)
2. **Cette semaine**: Epic 2.1.1 - Numérotation factures serveur
3. **Ce sprint**: Compléter Epic 2.1 (NF525)

---

## Questions Non Résolues

- Certification NF525 par organisme agréé (LNE) : budget et délai ?
- Stratégie mobile : Capacitor seul ou React Native séparé ?
- Multi-sites : priorisé pour V1 ou V2 ?
- Intégration comptable : quel logiciel cible (Sage, QuickBooks) ?
