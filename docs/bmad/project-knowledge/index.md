# Smart Food Manager - Documentation Projet

**Générée par**: BMAD Workflow (Exhaustive Scan)
**Date**: 2026-01-23
**Version**: 1.0.0

---

## Résumé du Projet

**Smart Food Manager** est un système de gestion SaaS pour la restauration légère, conçu pour les food trucks, snacks et restaurants indépendants.

| Métrique | Valeur |
|----------|--------|
| **Statut** | 82% Production-Ready |
| **Stack** | React 19 + Vite + TypeScript + Supabase |
| **Tests** | 167+ (12 fichiers) |
| **Pages** | 18 |
| **Services** | 32+ |

---

## Documents Générés

### Architecture & Vue d'Ensemble

| Document | Description |
|----------|-------------|
| [project-overview.md](./project-overview.md) | Vue d'ensemble complète du projet |
| [architecture.md](./architecture.md) | Architecture technique détaillée |
| [data-models.md](./data-models.md) | Modèles de données et relations |

### Planification

| Document | Description |
|----------|-------------|
| [action-plan.md](./action-plan.md) | **Plan d'action détaillé avec sprints** |

---

## État des Lieux Rapide

### Modules Fonctionnels ✅

- POS / Ventes
- Kitchen Display System
- Gestion Stock (déstockage auto)
- Recettes & Produits
- Achats Fournisseurs (PMP)
- Dashboard EBE
- Gestion Charges
- Export Comptable (FEC, CA3)
- Multi-tenant SaaS
- PWA Offline

### Gaps Critiques 🔴

1. **Certification NF525** - 67% (objectif 100%)
2. **Backups automatiques** - Non configurés
3. **Tests E2E** - Manquants
4. **Mobile sync** - Partielle

---

## Prochaines Étapes

### Immédiat (Sprint 2)

```
1. Corriger route 'tables' manquante
2. Numérotation factures côté serveur
3. Archivage PostgreSQL 6 ans
4. Z de caisse automatique
```

### Court terme

```
1. Tests E2E Playwright
2. Backup quotidien automatique
3. Mobile sync complète
```

---

## Structure Fichiers Clés

```
/
├── App.tsx              # Routing principal
├── store.tsx            # State management (Context API)
├── types.ts             # Types partagés
│
├── pages/               # 18 pages UI
│   ├── POS.tsx          # Point of Sale
│   ├── Dashboard.tsx    # KPIs financiers
│   ├── Kitchen.tsx      # KDS
│   └── ...
│
├── services/            # 15 services
│   ├── storage.ts       # Persistence
│   ├── auth.ts          # Authentication
│   └── ...
│
├── shared/services/     # 17 services métier
│   ├── business.ts      # Stock, PMP, destock
│   ├── invoicing.ts     # Facturation NF525
│   ├── expenses.ts      # Calcul EBE
│   └── ...
│
├── supabase/            # DB setup
│   ├── SETUP_COMPLET.sql
│   └── migrations/
│
└── tests/               # 12 fichiers tests
    ├── unit/
    └── integration/
```

---

## Commandes Utiles

```bash
# Développement
npm run dev          # Serveur dev (port 3000)
npm run build        # Build production
npm test             # Tests Vitest

# Base de données
# Exécuter supabase/SETUP_COMPLET.sql dans Supabase Dashboard

# Déploiement
vercel --prod        # Deploy Vercel
```

---

## Liens Rapides

- [CLAUDE.md](../../../CLAUDE.md) - Instructions développeur
- [README.md](../../../README.md) - Getting started
- [CERTIFICATION_NF525_STATUS.md](../../../CERTIFICATION_NF525_STATUS.md) - État certification

---

## Contact & Support

Pour toute question sur cette documentation, consulter le fichier [action-plan.md](./action-plan.md) qui contient les questions non résolues et les prochaines étapes.
