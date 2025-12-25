# SKILL: Performance Optimization

## Objectif
Identifier et résoudre problèmes performance (frontend + backend futur).

## Règles de concision
- Mesurer avant optimiser
- 1 optimisation à la fois
- Validation par benchmarks
- Pas d'optimisation prématurée

## Méthodologie

### 1. Mesurer (MANDATORY)
```
Avant optimisation:
- Identifier métrique (temps réponse, FPS, bundle size)
- Mesurer valeur actuelle
- Définir target acceptable

Après optimisation:
- Re-mesurer
- Calculer gain (%)
- Vérifier pas de régression autre métrique
```

### 2. Identifier bottleneck
```
Frontend:
  → Rendering (React)
  → Network (API calls)
  → Bundle size
  → Memory leaks

Backend (futur):
  → Query SQL (N+1, missing indexes)
  → CPU (calculs lourds)
  → Memory (caches, leaks)
```

### 3. Optimiser par priorité
```
Impact = (Fréquence × Gain potentiel)

High priority:
- Écrans utilisés souvent (POS, Orders)
- Opérations critiques (paiement, déstockage)

Low priority:
- Écrans admin rares (config)
- Opérations background
```

## Outils de mesure

### Frontend

#### React DevTools Profiler
```javascript
// Activer profiler
import { Profiler } from 'react'

<Profiler id="POS" onRender={(id, phase, actualDuration) => {
  console.log(`${id} took ${actualDuration}ms`)
}}>
  <POS />
</Profiler>
```

#### Chrome DevTools

**Performance tab:**
```
1. Ouvrir DevTools > Performance
2. Record (⏺️)
3. Effectuer action lente
4. Stop
5. Analyser flamegraph:
   - Jaune = JavaScript
   - Violet = Rendering
   - Vert = Painting
```

**Lighthouse:**
```bash
# Audit complet
npx lighthouse http://localhost:3000 --view

# Métriques clés:
- FCP (First Contentful Paint) < 1.8s
- LCP (Largest Contentful Paint) < 2.5s
- TTI (Time to Interactive) < 3.8s
- CLS (Cumulative Layout Shift) < 0.1
```

**Network tab:**
```
- Waterfall requests
- Payload sizes
- Cache headers
```

#### Bundle Analyzer
```bash
npm install --save-dev vite-plugin-bundle-analyzer

# vite.config.ts
import { visualizer } from 'vite-plugin-bundle-analyzer'
plugins: [react(), visualizer()]

npm run build
# Ouvre rapport HTML
```

### Backend (futur)

#### PostgreSQL
```sql
-- Slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Explain query
EXPLAIN ANALYZE
SELECT * FROM orders WHERE company_id = 'xxx';

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

## Optimisations Frontend

### 1. React rendering

#### Problème: Re-renders inutiles
```typescript
// ❌ AVANT (re-render à chaque parent update)
function ProductCard({ product }) {
  return <div>{product.name}</div>
}

// ✅ APRÈS (memoized)
const ProductCard = React.memo(({ product }) => {
  return <div>{product.name}</div>
})
```

#### Problème: Callback recréé
```typescript
// ❌ AVANT
function ProductList({ products }) {
  return products.map(p =>
    <ProductCard
      product={p}
      onClick={() => handleClick(p.id)}  // nouvelle fonction à chaque render!
    />
  )
}

// ✅ APRÈS
function ProductList({ products }) {
  const handleClick = useCallback((id) => {
    // logic
  }, [])

  return products.map(p =>
    <ProductCard product={p} onClick={handleClick} />
  )
}
```

#### Problème: Calcul coûteux répété
```typescript
// ❌ AVANT
function Dashboard() {
  const { orders } = useStore()

  // Recalculé à chaque render
  const totalRevenue = orders
    .filter(o => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.total, 0)

  return <div>{totalRevenue}€</div>
}

// ✅ APRÈS
function Dashboard() {
  const { orders } = useStore()

  const totalRevenue = useMemo(() =>
    orders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.total, 0),
    [orders]  // recalculé seulement si orders change
  )

  return <div>{totalRevenue}€</div>
}
```

### 2. Bundle size

#### Code splitting
```typescript
// ❌ AVANT (tout dans bundle principal)
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import POS from './pages/POS'

// ✅ APRÈS (lazy load par route)
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Inventory = lazy(() => import('./pages/Inventory'))
const POS = lazy(() => import('./pages/POS'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/pos" element={<POS />} />
      </Routes>
    </Suspense>
  )
}
```

#### Tree shaking
```typescript
// ❌ AVANT
import _ from 'lodash'  // tout lodash importé (>70KB)
_.debounce(fn, 300)

// ✅ APRÈS
import debounce from 'lodash/debounce'  // seulement debounce (~2KB)
debounce(fn, 300)
```

#### Image optimization
```typescript
// ❌ AVANT
<img src="product.jpg" />  // 2MB original

// ✅ APRÈS
// 1. Compress images (TinyPNG, ImageOptim)
// 2. Responsive images
<img
  src="product-small.webp"
  srcSet="product-small.webp 400w, product-medium.webp 800w"
  sizes="(max-width: 600px) 400px, 800px"
  loading="lazy"
/>
```

### 3. Network

#### Debounce recherche
```typescript
// ❌ AVANT (API call à chaque frappe)
function Search() {
  const [query, setQuery] = useState('')

  const handleChange = (e) => {
    setQuery(e.target.value)
    searchAPI(e.target.value)  // trop de calls!
  }

  return <input onChange={handleChange} />
}

// ✅ APRÈS
import { useDebouncedCallback } from 'use-debounce'

function Search() {
  const [query, setQuery] = useState('')

  const debouncedSearch = useDebouncedCallback(
    (value) => searchAPI(value),
    500  // attend 500ms après dernière frappe
  )

  const handleChange = (e) => {
    setQuery(e.target.value)
    debouncedSearch(e.target.value)
  }

  return <input onChange={handleChange} />
}
```

#### Virtualisation listes longues
```bash
npm install react-window
```

```typescript
// ❌ AVANT (1000 produits render = lag)
function ProductList({ products }) {
  return (
    <div>
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}

// ✅ APRÈS (render seulement visibles)
import { FixedSizeList } from 'react-window'

function ProductList({ products }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={products.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <ProductCard product={products[index]} />
        </div>
      )}
    </FixedSizeList>
  )
}
```

### 4. State management

#### Éviter state global pour UI local
```typescript
// ❌ AVANT (global state = re-render tous composants)
// store.tsx
const [isModalOpen, setIsModalOpen] = useState(false)

// ✅ APRÈS (state local)
function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  // Modal state isolé ici
}
```

#### Selector pattern (éviter re-renders)
```typescript
// ❌ AVANT
function Dashboard() {
  const state = useStore()  // re-render si N'IMPORTE QUOI change dans state
  return <div>{state.orders.length}</div>
}

// ✅ APRÈS
function Dashboard() {
  const ordersCount = useStore(state => state.orders.length)  // re-render seulement si orders.length change
  return <div>{ordersCount}</div>
}
```

## Optimisations Backend (futur)

### 1. Database queries

#### N+1 problem
```python
# ❌ AVANT (N+1 queries)
orders = session.query(Order).filter_by(company_id=company_id).all()
for order in orders:
    user = session.query(User).get(order.user_id)  # 1 query par order!
    print(user.name)

# ✅ APRÈS (1 query avec JOIN)
orders = session.query(Order).options(
    joinedload(Order.user)
).filter_by(company_id=company_id).all()

for order in orders:
    print(order.user.name)  # déjà chargé
```

#### Index manquants
```sql
-- Slow query identifiée
SELECT * FROM orders
WHERE company_id = 'xxx' AND status = 'PENDING';

-- EXPLAIN montre sequential scan

-- ✅ Créer index
CREATE INDEX ix_orders_company_status
ON orders(company_id, status);

-- Performance: 2000ms → 5ms
```

#### Pagination
```python
# ❌ AVANT (load tous les orders)
orders = session.query(Order).filter_by(company_id=company_id).all()
return orders  # peut être 100k rows!

# ✅ APRÈS
orders = session.query(Order).filter_by(company_id=company_id)\
    .limit(50).offset(page * 50).all()
return orders
```

### 2. Caching

#### Redis cache (futur)
```python
# ❌ AVANT (calcul dashboard à chaque request)
@app.get("/dashboard")
def get_dashboard(company_id: str):
    revenue = calculate_revenue(company_id)  # slow query
    margin = calculate_margin(company_id)    # slow query
    return {"revenue": revenue, "margin": margin}

# ✅ APRÈS
import redis
cache = redis.Redis()

@app.get("/dashboard")
def get_dashboard(company_id: str):
    cached = cache.get(f"dashboard:{company_id}")
    if cached:
        return json.loads(cached)

    revenue = calculate_revenue(company_id)
    margin = calculate_margin(company_id)
    result = {"revenue": revenue, "margin": margin}

    cache.setex(f"dashboard:{company_id}", 300, json.dumps(result))  # cache 5min
    return result
```

## Benchmarks & Targets

### Frontend (Smart Food Manager)

#### Page load
```
Target:
- FCP < 1.5s
- LCP < 2.0s
- TTI < 2.5s

Current (à mesurer):
- Login: ?
- POS: ?
- Dashboard: ?
```

#### Interactions
```
Target:
- Ajout produit panier: < 100ms
- Recherche produit: < 200ms
- Paiement commande: < 500ms
- Ouverture modal: < 50ms
```

#### Bundle size
```
Target:
- Initial bundle: < 200KB gzip
- Vendor bundle: < 300KB gzip
- Total: < 500KB gzip

Current (à mesurer avec vite build):
npm run build
du -sh dist/
```

### Backend (futur)

#### API response time
```
Target:
- GET simple: < 50ms (p95)
- GET avec JOIN: < 200ms (p95)
- POST/PUT: < 300ms (p95)
- Calculs (PMP, marges): < 500ms (p95)
```

#### Database
```
Target:
- Query time: < 10ms (p95)
- Index hit ratio: > 99%
- Connection pool: < 50% utilisé
```

## Checklist optimisation

Avant claim "optimisé":
- [ ] Métrique mesurée avant (baseline)
- [ ] Bottleneck identifié (profiling)
- [ ] Optimisation appliquée (1 seule)
- [ ] Métrique mesurée après
- [ ] Gain calculé (%)
- [ ] Pas de régression fonctionnelle
- [ ] Pas de régression autre métrique
- [ ] Code review (complexity acceptable)

## Anti-patterns

### ❌ NE JAMAIS
```typescript
// 1. Optimiser sans mesurer
"Je pense que c'est lent ici" → Profiler d'abord!

// 2. Over-engineering
const memoizedValue = useMemo(() => x + 1, [x])  // calcul trivial, inutile

// 3. Optimisation prématurée
// Optimiser composant utilisé 1 fois par jour → waste time

// 4. Sacrifier lisibilité
// Code obscur pour 2ms gain → pas worth it
```

### ✅ PATTERNS CORRECTS
```typescript
// 1. Mesure + baseline
console.time('operation')
expensiveOperation()
console.timeEnd('operation')  // 450ms

// Optimiser
console.time('operation')
optimizedOperation()
console.timeEnd('operation')  // 45ms → 10x faster!

// 2. Priorité impact
// POS écran = utilisé 100x/jour → optimiser
// Config écran = utilisé 1x/semaine → skip

// 3. Progressive enhancement
// V1: Fonctionnel
// V2: Optimisé si nécessaire
```

## Notes Smart Food Manager

### Pages critiques (optimiser en priorité)
1. **POS** (utilisé constamment)
   - Virtualiser liste produits (react-window)
   - Memoize ProductCard
   - Debounce recherche

2. **Orders** (utilisé fréquemment)
   - Pagination commandes
   - Lazy load détails
   - Cache calculs totaux

3. **Dashboard** (chargement lourd)
   - useMemo pour calculs stats
   - Code split Recharts (lourd)
   - Cache données (refresh manuel)

### Optimisations quick wins
```typescript
// 1. Lazy load icônes Lucide
import { lazy } from 'react'
const Icons = lazy(() => import('lucide-react'))

// 2. Tailwind build-time (vs CDN)
// Gain: 500KB → 50KB

// 3. Debounce save state
const debouncedSave = debounce(saveState, 1000)

// 4. Memoize calculs PMP
const averageCost = useMemo(() =>
  calculatePMP(stock, pmp, qty, price),
  [stock, pmp, qty, price]
)
```

### Monitoring production (futur)
```typescript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(console.log)
getFID(console.log)
getFCP(console.log)
getLCP(console.log)
getTTFB(console.log)

// Envoyer à analytics
```

## Commandes utiles

```bash
# Bundle analyze
npm run build
npx vite-bundle-visualizer

# Lighthouse audit
npx lighthouse http://localhost:3000 --view

# Performance budget
# package.json
"performance": {
  "maxSize": "500KB"
}

# Check bundle size
npm run build
du -sh dist/assets/*.js
```

## Ressources

- React DevTools Profiler
- Chrome DevTools Performance
- Lighthouse
- web.dev/vitals
- bundlephobia.com (check package sizes)
