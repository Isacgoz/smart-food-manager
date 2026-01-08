# 📊 Monitoring & Error Tracking - Sentry

> **Guide complet** pour monitoring production avec Sentry (erreurs, performance, alertes business)

---

## 🎯 Vue d'ensemble

Smart Food Manager intègre **Sentry** pour:
- ✅ **Capture erreurs runtime** automatique (exceptions non gérées)
- ✅ **Erreurs business** critiques (stock négatif, écarts caisse)
- ✅ **Performance monitoring** (transactions, requêtes lentes)
- ✅ **Session Replay** (débogage visuel sessions avec erreurs)
- ✅ **Web Vitals** tracking (LCP, FID, CLS, FCP, TTFB)

---

## 🚀 Configuration Rapide

### 1. Créer projet Sentry

```bash
# 1. Compte Sentry (gratuit)
https://sentry.io/signup/

# 2. Create Project → React
# 3. Copier DSN (Settings → Client Keys)
```

### 2. Configurer DSN

```bash
# .env (développement)
VITE_SENTRY_DSN=https://xxxxx@o000000.ingest.us.sentry.io/0000000

# Vercel Environment Variables (production)
# Ajouter VITE_SENTRY_DSN + VITE_APP_ENV=production
```

### 3. Vérifier activation

```bash
npm run dev
# → Console: [MONITORING] Sentry initialisé

npm run build
vercel --prod
# → Dashboard Sentry: Nouveau release détecté
```

---

## 📦 Fonctionnalités Activées

### ✅ Erreurs Runtime (auto)

**Capture automatique** toutes exceptions JavaScript non gérées:

```typescript
// Exemple: Division par zéro
const result = 100 / 0; // ∞ → capturé si throw

// Exemple: Property undefined
const user = null;
console.log(user.name); // Cannot read property 'name' → capturé
```

**Filtres actifs** (bruits supprimés):
- ❌ `ResizeObserver` errors (ignorés)

### ✅ Erreurs Business

**Alertes critiques** métier intégrées:

#### 1. Stock Négatif
```typescript
// shared/services/error-handling.ts:205
businessAlerts.stockNegative(ingredient, quantity, user);

// Déclenché par: validateStockWithPolicy()
// Contexte Sentry:
// - tag: alert_type=stock_negative, severity=critical
// - extra: ingredient{id,name,stock}, quantity, user{id,email,role}
```

#### 2. Stock Insuffisant (commande bloquée)
```typescript
// shared/services/error-handling.ts:233
businessAlerts.insufficientStock(order, missingIngredients);

// Déclenché par: validateStockWithPolicy() → canProceed=false
// Contexte: order{id,number,total}, missingIngredients[]
```

#### 3. Écart Caisse Important
```typescript
// shared/services/monitoring.ts:231
businessAlerts.cashDiscrepancy(expected, actual, diff, user);

// Seuil: |diff| > 50€
// Contexte: expected, actual, diff, percentage, user
```

#### 4. Sync DB Échouée
```typescript
// shared/services/monitoring.ts:272
businessAlerts.dbSyncFailed(error, companyId, retryCount);

// Déclenché par: échec sync Supabase
// Contexte: companyId, retryCount, stack trace
```

#### 5. Marge Faible
```typescript
// shared/services/monitoring.ts:329
businessAlerts.lowMargin(productName, price, cost, marginRate);

// Seuil: marginRate < 30%
// Contexte: productName, price, cost, margin, marginRate
```

### ✅ Performance Monitoring

**Sample rate 10%** production (100% dev):

```typescript
// App.tsx:188 → monitoring.ts:55-58
tracesSampleRate: import.meta.env.VITE_APP_ENV === 'production' ? 0.1 : 1.0

// Transactions trackées auto:
// - Page loads
// - Navigation
// - Interactions
```

**Métriques personnalisées**:
```typescript
import { trackMetric } from '../shared/services/monitoring';

trackMetric({
  name: 'order_processing_time',
  value: 250, // ms
  unit: 'millisecond',
  tags: { orderType: 'DINE_IN' }
});
```

### ✅ Session Replay

**Replay vidéo** sessions avec erreurs:

```typescript
// monitoring.ts:61-64
new Sentry.Replay({
  maskAllText: true,       // Masquer texte (RGPD)
  blockAllMedia: true      // Bloquer images (perf)
})

// Sample rates:
replaysSessionSampleRate: 0.1,     // 10% sessions normales
replaysOnErrorSampleRate: 1.0,     // 100% sessions avec erreur
```

**Privacy**: Tout masqué (RGPD compliant)

### ✅ Web Vitals

**Métriques Google** performance:

```typescript
// App.tsx:189 → monitoring.ts:155-186
initWebVitals();

// Métriques trackées:
// - LCP (Largest Contentful Paint) < 2.5s = good
// - FID (First Input Delay) < 100ms = good
// - CLS (Cumulative Layout Shift) < 0.1 = good
// - FCP (First Contentful Paint) < 1.8s = good
// - TTFB (Time to First Byte) < 800ms = good
```

---

## 🧪 Tester en Local

### 1. Déclencher erreur runtime

```typescript
// Console navigateur
throw new Error('Test Sentry error tracking');
```

### 2. Déclencher alerte stock négatif

```typescript
// Créer commande produit avec stock insuffisant + policy ALERT
// → Console: [ALERT_CRITICAL] Stock négatif...
// → Sentry: Nouveau event avec tag=stock_negative
```

### 3. Vérifier Web Vitals

```bash
npm run dev
# Ouvrir DevTools → Performance tab
# Recharger page
# → Console: [WEB_VITAL] { name: 'LCP', value: 1234, rating: 'good' }
```

---

## 📊 Dashboard Sentry

### Issues (Erreurs)

```
1. Accéder: https://sentry.io/organizations/YOUR_ORG/issues/
2. Filtrer: environment:production
3. Priorité: severity:critical tag:alert_type
```

**Colonnes importantes**:
- **Events**: Nombre occurrences
- **Users**: Nombre utilisateurs impactés
- **Last Seen**: Dernière occurrence
- **Assign**: Assigner développeur

### Performance

```
1. Accéder: Insights → Web Vitals
2. Vérifier: LCP, FID, CLS < seuils
3. Identifier: Pages lentes (P95 > 3s)
```

### Releases

```
# Créer release automatique (CI/CD futur)
sentry-cli releases new "smart-food-manager@1.2.3"
sentry-cli releases set-commits "smart-food-manager@1.2.3" --auto
sentry-cli releases finalize "smart-food-manager@1.2.3"
```

---

## 🔔 Alertes Email/Slack

### Configurer alertes critiques

```
1. Settings → Alerts
2. Create Alert → Issues
3. Conditions:
   - tag.alert_type equals stock_negative
   - severity equals critical
4. Actions:
   - Send email to: manager@restaurant.com
   - Send Slack notification to: #incidents
```

**Recommandation alertes**:
- ✅ `stock_negative` → Email gérant immédiat
- ✅ `cash_discrepancy` → Slack #finance (>100€)
- ✅ `db_sync_failed` → Email tech team
- ⚠️ `low_margin` → Digest quotidien (pas critique)

---

## 📈 Métriques Clés

### Taux d'erreurs acceptable

| Métrique | Cible Production |
|----------|------------------|
| **Error Rate** | < 0.1% sessions |
| **Crash-Free Sessions** | > 99.9% |
| **Apdex Score** | > 0.95 |
| **LCP (Web Vital)** | < 2.5s (P75) |
| **FID (Web Vital)** | < 100ms (P75) |

### Dashboard hebdo recommandé

```
1. Total errors: tendance ↓
2. Top 5 errors: fix prioritaire
3. Business alerts:
   - stock_negative: actions correctives?
   - cash_discrepancy: fraude potentielle?
4. Performance:
   - Pages lentes: optimisation?
   - Transactions slow: requêtes DB?
```

---

## 🛠️ API Monitoring

### Capture erreur manuelle

```typescript
import { captureBusinessError, captureTechnicalError } from '../shared/services/monitoring';

try {
  // Logique métier
} catch (error) {
  captureBusinessError(error as Error, {
    tags: { feature: 'orders' },
    extra: { orderId: '123', userId: 'user-456' },
    user: { id: currentUser.id, email: currentUser.email }
  });
}

// Erreur technique (DB, API externe)
captureTechnicalError(new Error('Supabase timeout'), {
  tags: { service: 'supabase', operation: 'sync' },
  extra: { companyId: 'comp-789', retryAttempt: 3 }
});
```

### Track événement utilisateur

```typescript
import { trackEvent } from '../shared/services/monitoring';

trackEvent('order_completed', {
  orderId: 'order-123',
  total: 45.90,
  paymentMethod: 'CARD',
  processingTime: 250 // ms
});
```

### Set contexte utilisateur

```typescript
import { setUserContext } from '../shared/services/monitoring';

// Login
setUserContext(user); // { id, email, name, role }

// Logout
setUserContext(null);
```

---

## 🔒 Sécurité & Privacy

### Données sensibles masquées

```typescript
// monitoring.ts:61-64
maskAllText: true,     // Tous textes masqués
blockAllMedia: true,   // Images/vidéos bloquées

// Cookies/localStorage JAMAIS capturés
```

### Filtres PII (Personal Identifiable Information)

```typescript
// Ajouter dans monitoring.ts:70-79 (beforeSend)
beforeSend(event, hint) {
  // Filtrer emails, téléphones, IBAN
  if (event.message) {
    event.message = event.message.replace(/[\w.+-]+@[\w.-]+\.\w+/g, '[EMAIL]');
  }

  // Supprimer headers sensibles
  if (event.request?.headers) {
    delete event.request.headers['Authorization'];
    delete event.request.headers['Cookie'];
  }

  return event;
}
```

---

## 🧪 Tests Monitoring

### Tests unitaires

```bash
# Tests mocks déjà configurés
# tests/setup.ts:38-53

npm test -- tests/unit/error-handling.test.ts
# → businessAlerts.stockNegative() mocké (pas d'appel Sentry réel)
```

### Tests intégration (Sentry staging)

```bash
# .env.test
VITE_SENTRY_DSN=https://staging-dsn@sentry.io/xxxxx
VITE_APP_ENV=staging

npm run dev
# → Tester erreurs → Vérifier dashboard Sentry staging
```

---

## ❓ FAQ

### Q: Monitoring désactivé en dev?
**R**: Oui. Sentry actif uniquement si `VITE_APP_ENV=production` ET `VITE_SENTRY_DSN` configuré.

```typescript
// monitoring.ts:46-48
if (!sentryConfig.enabled || !sentryConfig.dsn) {
  console.info('[MONITORING] Désactivé en développement');
  return;
}
```

### Q: Impact performance?
**R**: Minimal. Sample rate 10% + lazy loading `@sentry/react` (import dynamique).

### Q: Coût Sentry?
**R**:
- **Free tier**: 5000 events/mois, 1 user, 30 jours rétention
- **Team**: $26/mois, 50k events, 90 jours rétention (recommandé)
- **Business**: $80/mois, 100k events, 90 jours rétention

### Q: Alternatives Sentry?
**R**:
- Rollbar (similaire, pricing proche)
- LogRocket (focus Session Replay)
- Datadog RUM (enterprise, cher)
- Self-hosted: Glitchtip (open-source Sentry clone)

---

## 📚 Ressources

- **[Sentry React Docs](https://docs.sentry.io/platforms/javascript/guides/react/)**
- **[Web Vitals Guide](https://web.dev/vitals/)**
- **[Session Replay Privacy](https://docs.sentry.io/platforms/javascript/session-replay/privacy/)**
- **[Error Handling Best Practices](https://kentcdodds.com/blog/use-react-error-boundary)**

---

## 🚀 Next Steps

- [ ] Configurer Slack notifications (alertes critiques)
- [ ] Créer dashboard custom Sentry (KPIs métier)
- [ ] Automatiser releases (CI/CD + sentry-cli)
- [ ] Ajouter Source Maps upload (débogage prod)
- [ ] Budget errors quotidien (limiter bruit)

---

**Fait avec ❤️ pour monitorer la prod sans stress**
