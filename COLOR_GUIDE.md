# 🎨 Guide des Couleurs - Smart Food Manager

## Palette Principale

### Couleurs Fonctionnelles
```css
Primary (Vert)    → bg-emerald-600   → Actions principales, boutons CTA
Success (Vert)    → bg-green-600     → Validations, succès
Warning (Orange)  → bg-orange-500    → Alertes stock, avertissements
Danger (Rouge)    → bg-red-600       → Suppressions, erreurs critiques
Info (Bleu)       → bg-blue-600      → Informations, stats
```

### Couleurs Catégories Produits
```css
Entrées     → bg-purple-100 border-purple-300 text-purple-700
Plats       → bg-orange-100 border-orange-300 text-orange-700
Desserts    → bg-pink-100 border-pink-300 text-pink-700
Boissons    → bg-blue-100 border-blue-300 text-blue-700
Snacks      → bg-yellow-100 border-yellow-300 text-yellow-700
```

### Statuts Tables
```css
FREE      → bg-emerald-100 border-emerald-400 text-emerald-700
OCCUPIED  → bg-red-100 border-red-400 text-red-700
RESERVED  → bg-blue-100 border-blue-400 text-blue-700
DIRTY     → bg-orange-100 border-orange-400 text-orange-700
```

### Dashboard / Stats
```css
CA (Chiffre d'Affaires)     → bg-gradient-to-br from-blue-500 to-blue-600
Charges                     → bg-gradient-to-br from-red-500 to-red-600
EBE (Rentabilité)          → bg-gradient-to-br from-emerald-500 to-emerald-600
Marge                       → bg-gradient-to-br from-purple-500 to-purple-600
```

## Composants Clés

### Boutons
```tsx
// Principal
className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"

// Secondaire
className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 px-6 py-3 rounded-lg font-semibold"

// Danger
className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
```

### Cards
```tsx
// Standard
className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6 hover:shadow-2xl transition-shadow"

// Accent
className="bg-gradient-to-br from-emerald-50 to-white rounded-xl shadow-lg border-2 border-emerald-200 p-6"
```

### Badges
```tsx
// Success
className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold"

// Warning
className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold"
```

## Exemples Appliqués

### Page POS
- Catégories produits: Couleurs vives différenciées
- Panier: Fond blanc avec bordure verte
- Boutons paiement: Vert emerald pour valider, Gris pour annuler

### Page Stock
- Stock bon (>seuil): Texte vert
- Stock bas (<seuil): Texte orange + icône warning
- Stock épuisé: Texte rouge + fond rouge clair

### Dashboard
- Cartes métriques: Gradients colorés selon métrique
- Graphiques: Palette cohérente (bleu, vert, orange, rouge)
- Tendances positives: Flèche verte ↑
- Tendances négatives: Flèche rouge ↓

## Règles UX

1. **Contraste**: Toujours >4.5:1 (WCAG AA)
2. **Cohérence**: Même couleur = même fonction
3. **Hiérarchie visuelle**:
   - Actions primaires: Couleurs vives
   - Actions secondaires: Couleurs neutres
4. **États interactifs**:
   - Hover: Assombrir de 10%
   - Active: Assombrir de 20%
   - Disabled: Opacité 50%

## Migration Rapide

Pour rendre l'app plus colorée, chercher et remplacer:

```bash
# Boutons gris → Boutons verts
bg-gray-600 → bg-emerald-600
hover:bg-gray-700 → hover:bg-emerald-700

# Textes ternes → Textes contrastés
text-gray-600 → text-slate-700
text-gray-500 → text-slate-600

# Backgrounds plats → Backgrounds avec depth
bg-white → bg-gradient-to-br from-white to-gray-50
```
