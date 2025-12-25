# SKILL: Code Review

## Objectif
Review code rapidement et efficacement, focus qualité + sécurité + maintenabilité.

## Règles de concision
- Feedback en bullet points
- Max 3 commentaires par catégorie
- Pas de prose, direct au but
- Bloquer si CRITICAL, sinon suggestions

## Checklist de review

### 1. Sécurité (BLOQUANT si échec)
- [ ] **Multi-tenant isolation:** Toutes queries filtrent `company_id`
- [ ] **Validation input:** Pas de données user non validées
- [ ] **Authentification:** Routes protégées vérifient auth
- [ ] **Pas de secrets:** Pas d'API keys, tokens en dur
- [ ] **SQL injection:** Pas de string concat dans queries (futur backend)
- [ ] **XSS:** Pas de `dangerouslySetInnerHTML` non sanitized

### 2. Logique métier (IMPORTANT)
- [ ] **PMP correct:** Formule `(stock * pmp + qty * price) / total`
- [ ] **Déstockage atomique:** Transaction rollback si échec
- [ ] **Conversions unités:** Correctes et cohérentes
- [ ] **Calculs financiers:** Precision Numeric, pas Float
- [ ] **Edge cases:** Géré (stock=0, division par zéro, etc.)

### 3. Code quality (RECOMMANDÉ)
- [ ] **TypeScript strict:** Pas de `any` non justifié
- [ ] **Naming:** Variables/fonctions explicites
- [ ] **DRY:** Pas de duplication excessive (>3 fois)
- [ ] **Simplicité:** Pas de over-engineering
- [ ] **Comments:** POURQUOI, pas QUOI

### 4. Tests (si applicable)
- [ ] **Tests unitaires:** Logique métier critique couverte
- [ ] **Tests passent:** `npm test` OK
- [ ] **Edge cases testés:** Valeurs limites, erreurs

### 5. Performance (si concerns)
- [ ] **Pas de N+1 queries** (futur backend)
- [ ] **Pas de rendering loops:** useEffect deps correctes
- [ ] **Memoization:** Si calculs coûteux répétés
- [ ] **Bundle size:** Pas d'imports massifs inutiles

## Format feedback

### Structure commentaire
```markdown
**[CATEGORY]:** Description courte

Fichier: path/to/file.ts:42

Problème:
[1-2 lignes]

Suggestion:
```typescript
// Code suggéré
```

Raison: [1 phrase]
```

### Catégories
- `[CRITICAL]` → Bloquer merge, sécurité/data corruption
- `[IMPORTANT]` → Corriger avant merge, logique métier
- `[MINOR]` → Suggestion, peut merger après
- `[NITPICK]` → Style/préférence, optionnel

## Exemples feedback

### ✅ BON feedback
```markdown
**[CRITICAL]:** Multi-tenant leakage

Fichier: services/orders.ts:24

Problème:
Query ne filtre pas par company_id, leak data entre restaurants

Suggestion:
```typescript
const orders = data.orders.filter(o =>
  o.status === 'PENDING' && o.companyId === restaurantId
)
```

Raison: Isolation multi-tenant = sécurité critique
```

### ❌ MAUVAIS feedback
```
Je pense qu'il serait peut-être mieux de filtrer par companyId
car sinon on risque d'avoir des problèmes de données qui se
mélangent entre les différents restaurants...
```

## Review rapide (5-10 min)

### Scan visuel
1. **Diff GitHub:** Lignes vertes/rouges
2. **Fichiers modifiés:** Pertinents pour feature?
3. **Tests ajoutés:** Si logique métier?

### Checks automatiques
```bash
# Checkout PR
gh pr checkout 123

# Install + Build
npm install
npm run build  # doit passer

# Tests
npm test  # doivent passer

# Typage
npx tsc --noEmit  # pas d'erreurs TS
```

### Lecture code
Focus sur:
- Logique métier (calculs, flux critiques)
- Security (auth, multi-tenant, input validation)
- Edge cases handling

Skipper:
- Style mineur (linter s'en charge)
- Refactoring non demandé (scope creep)
- Typos dans comments

## Patterns à approuver

### ✅ BON code
```typescript
// Clear naming
const calculateAverageCost = (
  currentStock: number,
  currentPmp: number,
  receivedQty: number,
  unitPrice: number
): number => {
  if (currentStock + receivedQty === 0) return 0 // edge case

  // PMP formula: weighted average
  return (
    (currentStock * currentPmp + receivedQty * unitPrice) /
    (currentStock + receivedQty)
  )
}

// Usage
ingredient.averageCost = calculateAverageCost(
  ingredient.stock,
  ingredient.averageCost,
  reception.quantity,
  reception.unitPrice
)
```

### ❌ MAUVAIS code
```typescript
// Vague naming, no edge case, magic formula
const calc = (s: number, p: number, q: number, pr: number) => {
  return (s * p + q * pr) / (s + q) // division by zero possible
}

ingredient.averageCost = calc(
  ingredient.stock,
  ingredient.averageCost,
  reception.quantity,
  reception.unitPrice
)
```

## Red flags (bloquer merge)

### 1. Security issues
```typescript
// ❌ No company_id filter
const orders = data.orders.filter(o => o.status === 'PENDING')

// ❌ Password not hashed
user.password = inputPassword

// ❌ Direct SQL concat (futur backend)
query = `SELECT * FROM users WHERE name = '${userName}'`
```

### 2. Data corruption risks
```typescript
// ❌ Float pour prix (drift)
price: number  // devrait être string ou Decimal

// ❌ Pas de rollback si échec partiel
items.forEach(item => {
  deductStock(item)  // si 1 fail, autres déjà déduites
})

// ❌ Conversion unité incorrecte
stockInKg = stockInGrams * 1000  // devrait être / 1000
```

### 3. Infinite loops
```typescript
// ❌ setState dans render
function Component() {
  const [count, setCount] = useState(0)
  setCount(count + 1)  // loop!
  return <div>{count}</div>
}

// ❌ useEffect sans deps
useEffect(() => {
  setData(fetchData())  // re-render → re-fetch → loop
})
```

## Approbation conditionnelle

```markdown
**Approve avec conditions:**

Excellent travail sur [feature]. Quelques ajustements avant merge:

**CRITICAL (blocker):**
- [ ] Ajouter filtrage company_id (orders.ts:24)
- [ ] Hasher password (SaaSLogin.tsx:83)

**IMPORTANT (recommandé):**
- [ ] Tester edge case stock=0 (calculs.ts:15)
- [ ] Ajouter test unitaire PMP

**MINOR (optionnel):**
- Typo: "recieve" → "receive" (comment line 42)

Ping moi après corrections, merge rapide.
```

## Auto-approval (skip review)

OK pour auto-merge si:
- Typos/style uniquement
- Documentation seule
- Tests ajoutés (pas de code modifié)
- Hotfix urgent validé vocalement
- Dependency version bump (patch seulement)

## Format final review

```markdown
## Review Summary

**Status:** ✅ Approved / ⚠️ Changes requested / ❌ Rejected

**Checklist:**
- [x] Security OK
- [x] Logic OK
- [ ] Tests needed (PMP calculation)
- [x] Performance OK
- [x] Code quality good

**Feedback:**

### CRITICAL
[items bloquants]

### IMPORTANT
[items à corriger]

### MINOR
[suggestions]

**Overall:** [1-2 phrases de feedback général]
```

## Notes Smart Food Manager

### Critical paths à vérifier
1. **Multi-tenant isolation**
   - Chaque query filtre company_id
   - LocalStorage keys isolées

2. **Calculs financiers**
   - PMP formula correcte
   - Precision Numeric
   - Round après calculs

3. **Déstockage automatique**
   - Transaction atomique
   - Rollback si échec
   - Vérif stock avant vente

4. **Conversions unités**
   - kg ↔ g, L ↔ mL
   - Bidirectionnelles cohérentes

### Files sensibles (review approfondi)
- `services/storage.ts` (multi-tenant)
- `pages/SaaSLogin.tsx` (auth)
- `pages/Inventory.tsx` (PMP calculs)
- `pages/Orders.tsx` (déstockage)
- `pages/Menu.tsx` (recettes)
- `store.tsx` (state management)

### Auto-checks recommandés

```bash
# TypeScript strict
npx tsc --noEmit --strict

# Find console.log (cleanup)
grep -r "console.log" src/ | grep -v "// DEBUG"

# Find any types
grep -r ": any" src/

# Find missing company_id filters (futur backend)
grep -r "SELECT.*FROM.*WHERE" | grep -v "company_id"
```

## Escalation

Si désaccord sur review:
1. Expliquer raison technique (pas préférence)
2. Référencer doc/standard
3. Proposer alternative
4. Si blocage: Demander 2e avis (autre reviewer)

Pas d'ego. Focus: Quality > Speed.
