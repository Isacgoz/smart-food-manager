# 📋 Certification NF525 - État d'Avancement

## ❌ Tests NON Conformes (Bloquants Production)

### 1. Numérotation Factures Inaltérable
**Status:** ❌ Non conforme
**Requis:** Séquence continue, inaltérable, sans trou
**Actuel:** Pas de numérotation séquentielle

**À implémenter:**
```typescript
// orders: "2026-001", "2026-002", "2026-003"...
// JAMAIS de trou, modification impossible
```

### 2. Horodatage Sécurisé
**Status:** ❌ Non conforme
**Requis:** Timestamp certifié, inaltérable
**Actuel:** Date JavaScript modifiable côté client

**À implémenter:**
- Timestamp serveur PostgreSQL
- Protection contre modification rétroactive

### 3. Archivage Sécurisé 6 ans
**Status:** ❌ Non conforme
**Requis:** Données immuables, archivées 6 ans minimum
**Actuel:** LocalStorage (effaçable)

**À implémenter:**
- Table `archived_orders` en PostgreSQL
- Trigger empêchant DELETE/UPDATE
- Export annuel pour autorités fiscales

### 4. Audit Trail Complet
**Status:** 🟡 Partiel
**Requis:** Historique TOUTES modifications
**Actuel:** Historique prix partiellement implémenté

**À implémenter:**
- Logs modifications prix (✅ fait)
- Logs modifications recettes (❌ manquant)
- Logs annulations (✅ fait)
- Logs modifications utilisateurs (❌ manquant)

### 5. Mentions Légales Factures
**Status:** 🟡 Partiel
**Requis:** SIREN, SIRET, TVA détaillée, adresse complète
**Actuel:** Basique

**À vérifier:**
- [ ] Numéro facture séquentiel
- [ ] Date et heure exacte
- [ ] SIREN/SIRET restaurant
- [ ] Adresse complète
- [ ] TVA ligne par ligne (pas seulement total)
- [ ] Numéro TVA intracommunautaire

### 6. Rapports de Clôture (Z de Caisse)
**Status:** 🟡 Partiel
**Requis:** Z quotidien, inaltérable, archivé
**Actuel:** Dashboard affiche clôtures mais pas archivage strict

**À implémenter:**
- Table `daily_z_reports`
- Champs: date, CA, moyens paiement, user_id
- Trigger empêchant modification

### 7. Traçabilité Moyens de Paiement
**Status:** ✅ Conforme
**Requis:** Détail espèces vs CB
**Actuel:** Implémenté dans Dashboard

### 8. Certification Organisme Agréé
**Status:** ❌ Non fait
**Requis:** Certificat NF525 par LNE ou équivalent
**Actuel:** Aucune certification

**Coût:** 2000-5000€
**Délai:** 3-6 mois

---

## ✅ Fonctionnalités Conformes

- ✅ TVA affichée (CA TTC, CA HT, TVA à reverser)
- ✅ Historique prix produits (price-history.ts)
- ✅ Gestion annulations commandes (order-cancellation.ts)
- ✅ Écarts caisse tracés par utilisateur
- ✅ Clôture journalière (Dashboard)

---

## 🔴 Bloqueurs Production France

| Item | Obligatoire | Implémenté | Effort |
|------|-------------|------------|--------|
| Numérotation séquentielle | OUI | ❌ | 4h |
| Horodatage sécurisé | OUI | ❌ | 2h |
| Archivage 6 ans | OUI | ❌ | 6h |
| Audit trail complet | OUI | 🟡 | 8h |
| Mentions légales factures | OUI | 🟡 | 3h |
| Z de caisse archivé | OUI | 🟡 | 4h |
| Certification organisme | OUI | ❌ | 3-6 mois + 5k€ |

**Total estimation:** 27h développement + 3-6 mois certification

---

## 📋 Plan d'Action Certification

### Phase 1: Conformité Technique (3-4 semaines)

#### Semaine 1: Numérotation + Horodatage
- [ ] Créer table `invoice_sequence`
- [ ] Trigger auto-increment sans trou
- [ ] Fonction PostgreSQL timestamp sécurisé
- [ ] Migration existantes commandes vers séquence

#### Semaine 2: Archivage + Audit Trail
- [ ] Table `archived_orders` immuable
- [ ] Trigger auto-archive après 24h
- [ ] Table `audit_logs` (modifications système)
- [ ] Export fiscal annuel

#### Semaine 3: Mentions Légales + Z Caisse
- [ ] Formulaire Settings: SIREN, SIRET, adresse
- [ ] Template facture conforme
- [ ] Table `daily_z_reports` immuable
- [ ] Export Z quotidien PDF

#### Semaine 4: Tests + Documentation
- [ ] Tests conformité
- [ ] Documentation technique
- [ ] Guide utilisateur
- [ ] Dossier certification

### Phase 2: Certification Organisme (3-6 mois)

1. **Choisir organisme:** LNE, AFNOR, Bureau Veritas
2. **Déposer dossier:** Code source + docs + tests
3. **Audit technique:** 2-4 semaines
4. **Corrections éventuelles:** 1-2 semaines
5. **Obtention certificat:** 2-4 semaines
6. **Renouvellement:** Tous les 3 ans

---

## 🎯 Recommandations

### Pour Pilote (sans certification)
Tu peux lancer un pilote restaurant **SANS certification** si:
- Restaurant n'est pas en France
- Restaurant accepte risque fiscal (TVA)
- Usage interne uniquement (pas de factures clients)

### Pour Production France
**OBLIGATOIRE:**
1. Implémenter toutes conformités techniques (27h)
2. Obtenir certification NF525 (5k€ + 6 mois)
3. Sinon: Amende 7500€ par caisse + pénalités TVA

### Alternative: API Caisse Certifiée
Au lieu de certifier ton app, intègre une API déjà certifiée:
- **Zelty POS API** (certifié NF525)
- **Sunday POS API** (certifié NF525)
- **Lightspeed API** (certifié NF525)

Ton app devient "frontend" d'une caisse certifiée.

**Avantage:** Pas besoin de ta propre certification
**Inconvénient:** Dépendance + frais API (~50€/mois)

---

## 📊 Résumé Status

```
Conformité Technique:  30% ████░░░░░░░░░░░░░░░░
Conformité Légale:     10% ██░░░░░░░░░░░░░░░░░░
Certification:          0% ░░░░░░░░░░░░░░░░░░░░

Production Ready:      ❌ NON (Hors France: 🟡 OUI avec disclaimer)
```

---

## 🚀 Next Steps

1. **Immédiat:** Finir configuration Supabase
2. **Court terme (1 semaine):** Tester multi-tenant isolation
3. **Moyen terme (1 mois):** Implémenter conformités techniques
4. **Long terme (6 mois):** Obtenir certification NF525

**OU**

1. **Alternative rapide:** Intégrer Zelty/Sunday API (voir PROMPT_AGENT_IA.md)
2. **Avantage:** Production-ready en 2 semaines au lieu de 6 mois

---

**Date:** 2026-01-17
**Branche:** stable-pre-sprint2
