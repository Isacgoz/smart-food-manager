# 🤖 BRIEFING AGENT IA - Version Courte

**Prompt complet:** [PROMPT_AGENT_IA.md](PROMPT_AGENT_IA.md) (13,000 mots)

---

## 🎯 OBJECTIFS

### 1. Tests Application (2h)
- Exécuter migrations Supabase 005 & 006
- Créer 2 restaurants test (Alpha, Beta)
- Valider isolation multi-tenant
- Tester email confirmation (testprod@demo.com)
- Valider exports comptables

### 2. Intégration Caisse NF525 (8-12h)
- Choisir API (Zelty/Sunday/Lightspeed)
- Créer `shared/services/pos-integration.ts`
- Intégrer dans `pages/POS.tsx`
- Migration 007 `fiscal_records` table
- **Maintenir 100% tests passants**

### 3. Préparation Pilote (4h)
- Guide restaurant pilote
- Guide formation
- Script création compte pilote
- Checklist finale

---

## 📂 FICHIERS CRITIQUES

**Lire en PREMIER:**
1. `CLAUDE.md` - Règles + Architecture
2. `AUDIT_COMPLET_ACTIONS.md` - État + Plan
3. `CONNEXION_PRODUCTION_GUIDE.md` - Tests connexion

**Code principal:**
- `pages/POS.tsx` - Intégration caisse ICI
- `services/storage.ts` - Supabase config
- `App.tsx` - Entry point

**Migrations:**
- `docs/migrations/005_multi_tenant_support.sql`
- `docs/migrations/006_test_companies.sql`

---

## ⚡ QUICK START

```bash
# 1. Lire docs (1h)
cat CLAUDE.md
cat AUDIT_COMPLET_ACTIONS.md

# 2. Tests actuels
npm test
# Doit afficher: 221 tests passed ✅

# 3. Supabase Dashboard
# → SQL Editor
# → Exécuter migration 005
# → Exécuter migration 006

# 4. Créer 2 comptes test
# → Suivre PROMPT_AGENT_IA.md Mission 1.B

# 5. Tester isolation
# → Login Alpha: voir uniquement données Alpha
# → Login Beta: voir uniquement données Beta

# 6. Intégration caisse
# → Créer pos-integration.ts
# → Modifier POS.tsx
# → Tests passent toujours ✅
```

---

## ⚠️ RÈGLES CRITIQUES

1. **Tests:** JAMAIS commit si tests échouent
2. **Commits:** Format ultra-court (`feat(pos): caisse API`)
3. **Multi-tenant:** Toujours vérifier `company_id`
4. **Documentation:** Commenter POURQUOI, pas QUOI
5. **Dev server:** NE PAS lancer `npm run dev` (déjà actif)

---

## 📊 RÉSULTAT ATTENDU

**Rapport final:** `RAPPORT_FINALISATION_AGENT.md`

**Métriques:**
- Tests: 221+ passants ✅
- Production-ready: 82% → 95%+
- Intégration caisse: Fonctionnelle + certifiée NF525
- Isolation multi-tenant: Validée
- Application: Prête pour 1er restaurant pilote

---

## 🚀 TIMELINE

| Jour | Mission | Durée |
|------|---------|-------|
| 1 | Tests app + multi-tenant | 3h |
| 2 | Recherche + intégration caisse | 4h |
| 3 | Tests intégration | 3h |
| 4 | Documentation pilote | 2h |
| 5 | Checklist finale + rapport | 1h |

**TOTAL: 13h sur 5 jours**

---

## 📄 DOCUMENTS

**Prompt complet (13K mots):**
- [PROMPT_AGENT_IA.md](PROMPT_AGENT_IA.md)

**Guides existants:**
- [CLAUDE.md](CLAUDE.md) - Règles projet
- [AUDIT_COMPLET_ACTIONS.md](AUDIT_COMPLET_ACTIONS.md) - Plan détaillé
- [CONNEXION_PRODUCTION_GUIDE.md](CONNEXION_PRODUCTION_GUIDE.md) - Tests
- [GUIDE_CONFIRMATION_EMAIL.md](GUIDE_CONFIRMATION_EMAIL.md) - Email setup

---

**Créé:** 11 Janvier 2026, 16:00
**Durée lecture:** 5 min (vs 60 min version complète)
