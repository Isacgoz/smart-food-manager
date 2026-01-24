# Smart Food Manager - Vue d'Ensemble du Projet

**Généré le**: 2026-01-23
**Version**: v0.0.0 (Pre-Sprint 2)
**Statut**: 82% Production-Ready

---

## Résumé Exécutif

Smart Food Manager est un **système de gestion SaaS multi-tenant** pour la restauration légère (food trucks, snacks, restaurants indépendants). L'application permet aux restaurateurs de :

- **Gérer les ventes** via un POS tactile
- **Contrôler les stocks** avec déstockage automatique basé sur les recettes
- **Suivre la rentabilité** via un dashboard EBE (Excédent Brut d'Exploitation)
- **Générer des factures** conformes à la législation française

---

## Informations Techniques

| Attribut | Valeur |
|----------|--------|
| **Type de Repository** | Monorepo (web + mobile + api) |
| **Langage Principal** | TypeScript |
| **Framework Frontend** | React 19.2.3 |
| **Build Tool** | Vite 6.2.0 |
| **Styling** | Tailwind CSS 4.1.18 |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime) |
| **Tests** | Vitest 4.0.16 + React Testing Library |
| **Monitoring** | Sentry |
| **Déploiement** | Vercel (web) + Capacitor (mobile) |

---

## Architecture du Repository

```
smart-food-manager/
├── Web App (racine)     → Application React principale
├── mobile/              → Application React Native (partielle)
├── api/                 → Vercel Serverless Functions
├── supabase/            → Schéma DB + Migrations
├── tests/               → Tests unitaires et intégration
└── docs/                → Documentation utilisateur
```

---

## Modules Fonctionnels Implémentés

### 1. POS / Ventes ✅
- Prise de commande par catégories
- Panier avec gestion quantités
- Paiement espèces / carte
- Notes client (allergies, cuisson, etc.)
- Impression tickets (ESC/POS)

### 2. Kitchen Display System (KDS) ✅
- File d'attente commandes
- Workflow: QUEUED → PREPARING → READY → SERVED
- Sync temps réel Salle ↔ Cuisine

### 3. Gestion Stock ✅
- Stock théorique par ingrédient
- **Déstockage automatique** sur vente (lecture recette)
- Alertes stock minimum
- Mouvements tracés (SALE, PURCHASE, ADJUSTMENT, WASTE)

### 4. Recettes & Produits ✅
- Fiches techniques avec ingrédients
- Calcul automatique coût matière
- Marge brute et taux de marge
- Gestion des catégories

### 5. Achats Fournisseurs ✅
- Commandes fournisseur
- Bons de réception
- **Calcul PMP** automatique à chaque réception
- Mise à jour stock sur réception

### 6. Dashboard Financier ✅
- CA journalier (TTC / HT)
- EBE (Excédent Brut d'Exploitation)
- Marge brute et coût matière
- TVA collectée
- CA par employé
- Rapprochement caisse (théorique vs réel)

### 7. Gestion Charges ✅
- Charges fixes (loyer, salaires, etc.)
- Charges variables
- Catégorisation (15 types)
- Impact sur EBE

### 8. Export Comptable ✅
- Export CSV/Excel
- Export FEC (Fichier des Écritures Comptables)
- CA3 (déclaration TVA)

### 9. Multi-tenant SaaS ✅
- Isolation par company_id (RLS Supabase)
- Plans: STARTER, PRO, BUSINESS
- Gestion des limites par plan

### 10. PWA & Offline ✅
- Service Worker installé
- LocalStorage + Supabase sync
- Mode offline-first

---

## Rôles Utilisateurs

| Rôle | Accès |
|------|-------|
| **OWNER** | Tout (Dashboard, Users, Settings, etc.) |
| **MANAGER** | Dashboard, Menu, Stock, Achats, Charges |
| **SERVER** | POS, Tables, Kitchen, Orders |
| **COOK** | Kitchen uniquement |

---

## Stack Technologique Détaillée

### Frontend
- **React 19.2.3** - Framework UI
- **Vite 6.2.0** - Build tool avec HMR
- **TypeScript** - Typage strict
- **Tailwind CSS 4.1.18** - Styling utility-first
- **Lucide React** - Icônes
- **Recharts** - Graphiques
- **React Hot Toast** - Notifications

### Backend (Supabase)
- **PostgreSQL** - Base de données
- **Row Level Security** - Isolation multi-tenant
- **Realtime** - Sync WebSocket
- **Auth** - JWT + Email/Password

### Mobile
- **React Native** - App mobile (partiel)
- **Capacitor 8.0.0** - Wrapper natif

### Qualité
- **Vitest** - Tests unitaires
- **React Testing Library** - Tests composants
- **Sentry** - Error tracking
- **Web Vitals** - Performance monitoring

---

## Points Forts du Projet

1. **Déstockage Automatique** - Principe métier clé respecté
2. **Calcul PMP** - Prix Moyen Pondéré sur chaque réception
3. **EBE en temps réel** - Vision rentabilité immédiate
4. **Multi-tenant robuste** - Isolation RLS Supabase
5. **Offline-first** - LocalStorage + sync cloud
6. **167+ tests** - Couverture logique métier
7. **Documentation riche** - 74 fichiers markdown

---

## Gaps Identifiés

### Critique (Bloquant Production)
- [ ] Certification NF525 incomplète (67%)
- [ ] Archivage factures 6 ans (PostgreSQL)
- [ ] Numérotation factures inaltérable (serveur)

### Important
- [ ] Backups automatiques non configurés
- [ ] Mobile sync incomplète
- [ ] Tests E2E manquants

### Amélioration
- [ ] KDS écran (remplacer tickets papier)
- [ ] Mode multi-sites
- [ ] Intégration TPE

---

## Métriques Qualité

| Métrique | Valeur |
|----------|--------|
| **Tests** | 167+ (12 fichiers) |
| **Bundle gzip** | ~450 KB |
| **Lighthouse** | 92/100 |
| **Fichiers source** | 50+ |
| **Documentation** | 74 fichiers .md |

---

## Liens Documentation

- [Architecture](./architecture.md)
- [Data Models](./data-models.md)
- [Source Tree](./source-tree.md)
- [Development Guide](./development-guide.md)
- [Plan d'Action](./action-plan.md)
