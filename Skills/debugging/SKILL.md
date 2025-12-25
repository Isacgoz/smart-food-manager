# SKILL: Debugging

## Objectif
Diagnostiquer et résoudre bugs rapidement avec méthodologie systématique.

## Règles de concision
- Diagnostic en 3 étapes max
- Solution proposée sous 5 lignes
- Pas d'explications théoriques

## Méthodologie

### 1. Reproduire (MANDATORY)
```
1. Lire description bug
2. Identifier steps to reproduce
3. Confirmer reproduction locale
```

**Si non reproductible** → Demander plus d'infos (env, données, screenshots)

### 2. Isoler (Binary Search)
```
Erreur → Quelle couche?
  → Frontend (UI)
    → Component render issue
    → State management issue
    → API call issue
  → Backend (API)
    → Route handler
    → Service layer
    → Database query
  → Data
    → Migration manquante
    → Données corrompues
    → Constraint violation
```

### 3. Analyser logs
```bash
# Browser console
- Erreurs React
- Network requests failed
- TypeScript errors

# Server logs (futur)
- API errors
- DB errors
- Stack traces
```

### 4. Fix minimal
- Corriger la cause racine
- Pas de refactoring autour
- Tester reproduction again

## Outils debugging

### Frontend
```javascript
// React DevTools
- Inspecter component tree
- Vérifier props/state

// Console
console.log('DEBUG:', { var1, var2 })
console.table(arrayData)
console.trace() // call stack

// Breakpoints
debugger; // pause execution
```

### Network
```bash
# Chrome DevTools > Network
- Status codes
- Request/Response payloads
- Timing
```

### State
```javascript
// Dans store.tsx
const { state } = useStore()
console.log('FULL STATE:', JSON.stringify(state, null, 2))
```

## Bugs courants Smart Food Manager

### 1. Stock négatif
**Symptôme:** Alerte stock négatif après vente

**Causes possibles:**
- Recette mal configurée (quantité excessive)
- Conversion unité incorrecte
- Double déstockage (bug)

**Debug:**
```typescript
// Dans handlePayment (Orders.tsx ou POS.tsx)
console.log('BEFORE DESTOCK:', ingredients.map(i => ({
  id: i.id,
  name: i.name,
  stock: i.stock
})))

// Après déstockage
console.log('AFTER DESTOCK:', ...)
```

**Fix type:** Vérifier formule déstockage, conversions unités

### 2. Calcul PMP incorrect
**Symptôme:** Coût matière aberrant

**Causes possibles:**
- Division par zéro (stock=0)
- Précision float (drift)
- Réception non prise en compte

**Debug:**
```typescript
// Dans fonction PMP
const old_stock = ingredient.stock
const old_pmp = ingredient.averageCost
const new_qty = reception.quantity
const new_price = reception.unitPrice

console.log('PMP CALC:', {
  old_stock, old_pmp, new_qty, new_price,
  formula: `(${old_stock} * ${old_pmp} + ${new_qty} * ${new_price}) / (${old_stock} + ${new_qty})`,
  result: calculated_pmp
})
```

**Fix type:** Vérifier formula, gérer cas stock=0, round final value

### 3. Multi-tenant leakage
**Symptôme:** Utilisateur voit données autre restaurant

**Causes possibles:**
- Oubli filtrage company_id
- LocalStorage key incorrecte
- Cache browser

**Debug:**
```typescript
// Vérifier isolation
console.log('CURRENT RESTAURANT:', restaurant.id)
console.log('LOADED DATA COMPANY IDS:', data.map(d => d.companyId || d.restaurantId))

// Vérifier LocalStorage
Object.keys(localStorage).forEach(key => {
  if(key.startsWith('smart_food')) {
    console.log(key, localStorage.getItem(key).substring(0, 100))
  }
})
```

**Fix type:** Ajouter WHERE company_id filter partout

### 4. État non persisté
**Symptôme:** Données perdues après refresh

**Causes possibles:**
- saveState non appelé
- LocalStorage full (quota)
- Erreur JSON.stringify

**Debug:**
```typescript
// Dans saveState (storage.ts)
console.log('SAVE STATE CALLED:', {
  restaurantId,
  stateSize: JSON.stringify(state).length,
  hasUsers: state.users?.length
})

// Vérifier quota
const estimate = await navigator.storage.estimate()
console.log('STORAGE:', {
  usage: estimate.usage,
  quota: estimate.quota,
  percent: (estimate.usage / estimate.quota * 100).toFixed(2)
})
```

**Fix type:** Vérifier appels saveState, gérer quota exceeded

### 5. Rendering loop
**Symptôme:** App freeze, CPU 100%

**Causes possibles:**
- setState dans render
- useEffect sans deps
- Référence instable

**Debug:**
```typescript
// Ajouter dans component
const renderCount = React.useRef(0)
renderCount.current++
console.log('RENDER COUNT:', renderCount.current)
if(renderCount.current > 100) {
  console.error('INFINITE LOOP DETECTED')
  debugger
}
```

**Fix type:** Fixer deps useEffect, memoize callbacks

## Format de sortie

### Diagnostic
```
Bug: [titre court]

Reproductible: ✓/✗
Steps: [1-3 steps]

Cause racine: [1 phrase]
Fichier: [path:line]

Fix: [description courte]
```

### Exemple
```
Bug: Stock négatif après vente burger

Reproductible: ✓
Steps:
1. Vendre 1 Burger Classique
2. Vérifier stock Pain
3. → Stock = -1

Cause racine: Quantité recette = 2 pains (devrait être 1)
Fichier: Menu.tsx:145 (recipe builder)

Fix: Corriger recette Burger Classique: pain quantity 2 → 1
```

## Checklist debugging

Avant de déclarer "résolu":
- [ ] Bug reproductible initialement?
- [ ] Cause racine identifiée?
- [ ] Fix appliqué
- [ ] Bug NON reproductible après fix
- [ ] Pas de régression introduite
- [ ] Test automatisé ajouté (si logique métier)
- [ ] Commit avec "fix(scope): msg"

## Anti-patterns

❌ Chercher solution avant comprendre cause
❌ Modifier plusieurs choses à la fois
❌ Assumer sans vérifier logs
❌ Refactoring pendant debugging
❌ Tester fix sans reproduire bug avant

## Patterns

✅ Reproduire d'abord
✅ Isoler par binary search
✅ Logs stratégiques
✅ Fix minimal
✅ Vérifier non-régression

## Notes spécifiques Smart Food Manager

### Points sensibles
1. **Calculs financiers** (PMP, marges)
   - Toujours vérifier précision Numeric vs Float
   - Round après calculs

2. **Multi-tenant**
   - Chaque requête doit filtrer company_id
   - Vérifier isolation LocalStorage

3. **Déstockage automatique**
   - Transaction atomique critique
   - Rollback si échec partiel

4. **Conversions unités**
   - kg ↔ g, L ↔ mL
   - Vérifier conversions bidirectionnelles

### Logs utiles
```typescript
// Performance
console.time('operation')
// ... code
console.timeEnd('operation')

// State changes
console.log('STATE DIFF:', {
  before: oldState,
  after: newState
})

// API calls (futur)
console.log('API CALL:', {
  endpoint,
  method,
  body,
  headers
})
```

## Escalation

Si bug non résolu après 30 min:
1. Documenter reproduction steps
2. Capturer logs complets
3. Screenshot/video si UI bug
4. Créer issue GitHub détaillée
5. Demander aide équipe

Format issue:
```markdown
## Bug: [titre]

**Environnement:**
- Browser: Chrome 120
- OS: macOS 14
- Version app: v0.1.0

**Reproduction:**
1. Step 1
2. Step 2
3. Step 3

**Comportement attendu:**
[description]

**Comportement actuel:**
[description + screenshot]

**Logs:**
```
[logs console]
```

**Tentatives de fix:**
- Essai 1: [résultat]
- Essai 2: [résultat]
```
