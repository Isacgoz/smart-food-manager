# ✅ MODULE EBE & RENTABILITÉ - COMPLET

## Fonctionnalités implémentées

### 1. Module de Gestion des Charges
**Fichier**: `pages/Expenses.tsx`

**Fonctionnalités**:
- Ajout/modification/suppression de charges
- Classification: Fixes vs Variables
- Catégories: 15 types (Loyer, Salaires, Électricité, Eau, Gaz, Internet, Assurances, Maintenance, Marketing, Comptabilité, Frais bancaires, Gestion déchets, Nettoyage, Licences, Autres)
- Fréquences: Mensuelle, Trimestrielle, Annuelle, Ponctuelle
- Statut paiement: Payé/Impayé avec date de paiement
- Notes libres

**Stats affichées**:
- Total charges
- Charges fixes
- Charges variables
- Impayés

### 2. Service de Calcul EBE
**Fichier**: `shared/services/expenses.ts`

**Fonctions principales**:
```typescript
calculateEBE(orders, expenses, products, ingredients, startDate, endDate): EBECalculation
calculateMaterialCost(orders, products, ingredients): number
aggregateExpenses(expenses, startDate?, endDate?): AggregateData
calculateEmployeeRevenue(orders, startDate?, endDate?): EmployeeRevenue[]
calculatePaymentTypeBreakdown(orders, date): PaymentBreakdown
```

**Formule EBE**:
```
CA Total = Espèces + CB
Coût Matière = Σ(prix_ingredient × quantité_recette × quantité_vendue)
Marge Brute = CA - Coût Matière
EBE = Marge Brute - Charges Totales
```

### 3. Dashboard Enrichi
**Fichier**: `pages/Dashboard.tsx`

**Nouveaux indicateurs**:
1. **Marge Brute** (vert): Montant + % du CA
2. **EBE** (bleu si positif, rouge si négatif): Montant + % du CA
3. **Coût Matière** (violet): Montant + % du CA
4. **Charges** (orange): Montant + détail Fixes/Variables

**Sections ajoutées**:
- **CA par Employé**: Détail par serveur avec % contribution, espèces/CB
- **Détail Encaissements**: Espèces, CB, Total avec nombre transactions et % répartition

### 4. Types & Store
**Fichiers**: `shared/types.ts`, `store.tsx`

**Types ajoutés**:
```typescript
ExpenseType = 'FIXED' | 'VARIABLE'
ExpenseCategory (15 catégories)
interface Expense { ... }
interface EBECalculation { ... }
```

**Store enrichi**:
- `expenses: Expense[]`
- `addExpense(expense)`
- `updateExpense(id, updates)`
- `deleteExpense(id)`

### 5. Routing & Permissions
**Fichiers**: `App.tsx`, `components/Layout.tsx`

- Route `/expenses` accessible OWNER + MANAGER
- Protected par feature `hasERP`
- Menu "Charges (Fixes/Var)" dans sidebar

## Architecture

```
shared/
  types.ts            → Expense, EBECalculation
  services/
    expenses.ts       → Calculs EBE + CRUD
    analytics.ts      → Stats avancées (déjà existant)
    cashRegister.ts   → Gestion caisse (déjà existant)

pages/
  Dashboard.tsx       → Indicateurs EBE temps réel
  Expenses.tsx        → Gestion charges

store.tsx             → State global + expenses
App.tsx               → Route expenses
components/Layout.tsx → Menu expenses
```

## Utilisation

### Ajout d'une charge
1. Accéder menu "Charges (Fixes/Var)"
2. Cliquer "Nouvelle Charge"
3. Renseigner:
   - Catégorie (ex: RENT)
   - Type (Fixe/Variable)
   - Libellé (ex: "Loyer local commercial")
   - Montant (ex: 1500€)
   - Date
   - Fréquence (Mensuelle)
   - Payé/Impayé

### Consulter EBE
1. Dashboard → Section indicateurs en haut
2. Voir:
   - **Marge Brute**: CA - Coût Matière
   - **EBE**: Marge Brute - Charges
   - **% EBE/CA**: Rentabilité nette en %
   - Couleur bleue si profitable, rouge si perte

### Analyser performance employés
1. Dashboard → Section "CA par Employé"
2. Détail: CA total, % contribution, Espèces, CB

### Détail encaissements journée
1. Dashboard → Section "Détail Encaissements"
2. Voir: Espèces (montant, nb trans, %), CB (idem), Total + ticket moyen

## Formules métier

### Coût Matière Produit
```typescript
coût_produit = Σ (ingredient.averageCost × recette[ingredient].quantity)
```

### Coût Matière Total
```typescript
coût_total = Σ (coût_produit × quantité_vendue)
```

### Marge Brute
```typescript
marge_brute = CA_total - coût_matière
taux_marge_brute = (marge_brute / CA_total) × 100
```

### EBE
```typescript
charges_totales = Σ expenses.amount
EBE = marge_brute - charges_totales
taux_EBE = (EBE / CA_total) × 100
isProfitable = EBE > 0
```

## Exports

`shared/services/expenses.ts` expose:
```typescript
exportExpensesCSV(expenses: Expense[]): string
```

Format:
```csv
Date,Catégorie,Libellé,Montant,Type,Fréquence,Payé,Date Paiement,Notes
2025-01-15,RENT,Loyer local,1500.00,FIXED,MONTHLY,Oui,2025-01-15,
```

## Tests suggérés

1. **Ajouter charges fixes**:
   - Loyer: 1500€/mois
   - Salaires: 3000€/mois
   - Électricité: 200€/mois

2. **Ajouter charges variables**:
   - Maintenance: 150€ ponctuel
   - Marketing: 300€/trimestre

3. **Vérifier calculs**:
   - Créer commandes test
   - Vérifier coût matière cohérent
   - Vérifier EBE = CA - Coût Matière - Charges

4. **Tester permissions**:
   - OWNER: accès complet
   - MANAGER: accès complet
   - SERVER: pas d'accès expenses
   - COOK: pas d'accès expenses

5. **Tester plans**:
   - STARTER: pas d'accès (hasERP = false)
   - PRO/BUSINESS: accès complet

## Sécurité

- Filtrage multi-tenant: `restaurantId` sur Expense
- Audit trail: `createdBy` userId
- RLS Supabase: isolation par restaurant
- Permissions rôle strictes

## Performance

- Calculs mémorisés: `useMemo()` dans Dashboard
- Agrégations optimisées: filter + reduce
- Pas de requêtes DB frontend (LocalStorage + Supabase sync)

## Prochaines évolutions possibles

1. **Budget prévisionnel**: Comparer EBE réel vs objectif
2. **Graphiques EBE**: Évolution mensuelle
3. **Alertes seuils**: EBE < 0 pendant X jours
4. **Catégories custom**: Permettre ajout catégories métier
5. **Import CSV**: Importer charges depuis compta
6. **Récurrence auto**: Générer charges récurrentes automatiquement
7. **Analyse ABC charges**: Identifier charges optimisables
8. **Prévisions ML**: Prédire EBE futur

## Conformité

- Charges tracées pour audit fiscal
- Export CSV compatible logiciel compta
- Historique complet conservé
- Dates paiement documentées

---

**Status**: ✅ Module complet et fonctionnel
**Version**: 1.0.0
**Date**: 2025-01-25
