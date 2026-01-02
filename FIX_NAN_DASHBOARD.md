# 🔧 Fix Dashboard NaN - Guide Rapide

## 🐛 Problème

Dashboard affiche:
```
Marge Brute: NaN €
Coût Matière: NaN €
EBE: NaN €
```

## 🎯 Cause

**Produits créés sans recette** = Système ne peut pas calculer coût matière.

**Formule:**
```
Coût Matière = Somme(Prix ingrédient × Quantité)
Marge Brute = Prix Vente - Coût Matière
EBE = CA - Coût Matière - Charges
```

Si `Coût Matière = undefined` → tout devient `NaN`

---

## ✅ Solution Rapide (5 min)

### Étape 1: Créer Ingrédients

**Menu → Stock → + Nouvel Ingrédient**

**Exemple Burger:**
```
Nom: Pain burger
Unité: pièce
Stock initial: 50
Prix moyen (PMP): 0.50 €
Sauvegarder

Nom: Steak haché
Unité: kg
Stock initial: 5
Prix moyen (PMP): 8.50 €
Sauvegarder

Nom: Fromage
Unité: tranche
Stock initial: 100
Prix moyen (PMP): 0.30 €
Sauvegarder
```

**Exemple Pizza:**
```
Nom: Pâte pizza
Unité: pièce
Stock initial: 30
Prix moyen (PMP): 1.20 €

Nom: Sauce tomate
Unité: kg
Stock initial: 3
Prix moyen (PMP): 3.50 €

Nom: Mozzarella
Unité: kg
Stock initial: 2
Prix moyen (PMP): 12.00 €
```

---

### Étape 2: Ajouter Recettes aux Produits

**Menu → Produits & Recettes**

**Cliquer sur "Burger Classic" → Modifier**

**Section "Recette":**
```
+ Ajouter ingrédient:
  - Pain burger: 1 pièce
  - Steak haché: 0.150 kg (150g)
  - Fromage: 1 tranche

Sauvegarder
```

**Le système calcule automatiquement:**
```
Coût Matière = 0.50 + (8.50 × 0.15) + 0.30
             = 0.50 + 1.275 + 0.30
             = 2.075 €

Marge Brute = 5.00 - 2.075 = 2.925 €
Taux Coût Matière = (2.075 / 5.00) × 100 = 41.5%
```

---

**Cliquer sur "Pizza Margherita" → Modifier**

**Section "Recette":**
```
+ Ajouter ingrédient:
  - Pâte pizza: 1 pièce
  - Sauce tomate: 0.100 kg (100g)
  - Mozzarella: 0.150 kg (150g)

Sauvegarder
```

**Calcul automatique:**
```
Coût Matière = 1.20 + (3.50 × 0.10) + (12.00 × 0.15)
             = 1.20 + 0.35 + 1.80
             = 3.35 €

Marge Brute = 10.00 - 3.35 = 6.65 €
Taux Coût Matière = (3.35 / 10.00) × 100 = 33.5%
```

---

### Étape 3: Vérifier Dashboard

**Menu → Dashboard**

**Tu devrais maintenant voir:**
```
✅ Chiffre d'Affaires: 15.00 € (5 + 10)
✅ Coût Matière: 5.425 € (2.075 + 3.35)
✅ Marge Brute: 9.575 €
✅ Taux Coût Matière: 36.2%

Si tu as des charges:
✅ EBE = CA - Coût Matière - Charges
```

---

## 🎯 Workflow Correct

**TOUJOURS créer dans cet ordre:**

```
1. Ingrédients (Stock)
   ↓
2. Recettes (Produits)
   ↓
3. Ventes (POS)
   ↓
4. Dashboard (Automatique)
```

**❌ JAMAIS:**
- Créer produits sans recette
- Vendre avant définir recette
- Modifier prix ingrédient sans recalculer

---

## 📊 Exemples Recettes Complètes

### Fast Food

**Burger Classique (5.00 €)**
```
Pain: 1 pièce (0.50 €)
Steak: 150g (1.28 €)
Fromage: 1 tranche (0.30 €)
Salade: 20g (0.05 €)
Sauce: 30g (0.10 €)
→ Coût: 2.23 € | Marge: 2.77 € (55%)
```

**Frites (3.00 €)**
```
Pommes de terre: 200g (0.40 €)
Huile: 50g (0.15 €)
Sel: 2g (0.01 €)
→ Coût: 0.56 € | Marge: 2.44 € (81%)
```

**Coca 33cl (2.50 €)**
```
Coca canette: 1 pièce (0.80 €)
→ Coût: 0.80 € | Marge: 1.70 € (68%)
```

---

### Restaurant Italien

**Pizza Margherita (10.00 €)**
```
Pâte: 1 pièce (1.20 €)
Sauce tomate: 100g (0.35 €)
Mozzarella: 150g (1.80 €)
Basilic: 5g (0.10 €)
Huile d'olive: 10g (0.20 €)
→ Coût: 3.65 € | Marge: 6.35 € (63%)
```

**Pâtes Carbonara (12.00 €)**
```
Pâtes: 200g (0.60 €)
Lardons: 80g (1.20 €)
Crème: 100ml (0.40 €)
Parmesan: 30g (0.90 €)
Œufs: 2 pièces (0.50 €)
→ Coût: 3.60 € | Marge: 8.40 € (70%)
```

---

## 🐛 Troubleshooting

### "Ingrédient pas dans la liste"
→ Créer l'ingrédient d'abord (Menu → Stock)

### "Coût matière toujours NaN"
→ Vérifier que TOUS les ingrédients de la recette ont un PMP > 0

### "Dashboard vide après ventes"
→ Recharger page (F5) ou vérifier stock ingrédients suffisant

### "Stock négatif après vente"
→ Normal si stock insuffisant, alerte s'affiche

---

## ✅ Validation

**Dashboard correct si tu vois:**
```
Chiffre d'Affaires: X.XX € (pas NaN)
Coût Matière: X.XX € (pas NaN)
Marge Brute: X.XX € (pas NaN)
Taux Coût Matière: XX.X% (entre 25-40% idéalement)
```

**Si toujours NaN:**
1. Vérifier recettes complètes (tous ingrédients)
2. Vérifier PMP > 0 pour tous ingrédients
3. Recharger page
4. Vérifier console navigateur (F12) pour erreurs

---

## 🎓 Bonnes Pratiques

### Taux Coût Matière Recommandés

| Type Produit | Taux Idéal | Exemple |
|--------------|------------|---------|
| Burgers | 25-35% | 30% |
| Pizzas | 25-30% | 28% |
| Pâtes | 20-25% | 22% |
| Boissons | 15-25% | 20% |
| Desserts | 20-30% | 25% |

**Formule marge:**
```
Prix Vente = Coût Matière ÷ Taux Cible

Exemple:
Coût Matière = 3.00 €
Taux Cible = 30%
Prix Vente = 3.00 ÷ 0.30 = 10.00 €
```

---

**⏱️ Temps total fix: 5 minutes**
**Après ça → Dashboard parfait! 📊✅**
