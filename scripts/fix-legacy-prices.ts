/**
 * Script de migration pour corriger les prix créés avant le fix des décimales
 *
 * Problème: Les produits créés avec "0.50" avant le fix ont été sauvegardés comme "50.00"
 * Solution: Diviser par 100 les prix suspects (>10€ alors que coût matière < 1€)
 *
 * Usage:
 *   npm run fix-prices
 */

interface Product {
  id: string;
  name: string;
  price: number;
  recipe: RecipeItem[];
}

interface RecipeItem {
  ingredientId: string;
  quantity: number;
}

interface Ingredient {
  id: string;
  averageCost: number;
}

/**
 * Détecte si un prix est probablement erroné (bug ×100)
 */
function isPriceSuspicious(product: Product, ingredients: Ingredient[]): boolean {
  const costMatiere = product.recipe.reduce((total, item) => {
    const ing = ingredients.find(i => i.id === item.ingredientId);
    return total + (ing ? ing.averageCost * item.quantity : 0);
  }, 0);

  // Si le prix est > 10€ mais le coût matière < 1€ → Suspect (probable ×100)
  if (product.price > 10 && costMatiere < 1) {
    return true;
  }

  // Si le prix finit par .00 et est un multiple de 100 des prix courants (0.50, 0.24)
  const priceStr = product.price.toFixed(2);
  if (priceStr.endsWith('.00')) {
    const possibleOriginal = product.price / 100;
    // Prix courants restauration : 0.20 à 2.00€
    if (possibleOriginal >= 0.20 && possibleOriginal <= 2.00) {
      return true;
    }
  }

  return false;
}

/**
 * Corrige les prix erronés dans localStorage
 */
export function fixLegacyPrices() {
  const restaurantProfile = localStorage.getItem('restaurant_profile');
  if (!restaurantProfile) {
    console.log('❌ Aucun profil restaurant trouvé');
    return;
  }

  const profile = JSON.parse(restaurantProfile);
  const dbKey = `smart_food_db_${profile.id}`;
  const dbData = localStorage.getItem(dbKey);

  if (!dbData) {
    console.log('❌ Aucune base de données trouvée');
    return;
  }

  const db = JSON.parse(dbData);
  const products: Product[] = db.products || [];
  const ingredients: Ingredient[] = db.ingredients || [];

  console.log(`📦 ${products.length} produits à analyser...`);

  let fixedCount = 0;
  const fixes: Array<{ name: string; oldPrice: number; newPrice: number }> = [];

  products.forEach(product => {
    if (isPriceSuspicious(product, ingredients)) {
      const oldPrice = product.price;
      const newPrice = oldPrice / 100;

      product.price = newPrice;
      fixes.push({ name: product.name, oldPrice, newPrice });
      fixedCount++;
    }
  });

  if (fixedCount > 0) {
    // Sauvegarder les corrections
    db.products = products;
    localStorage.setItem(dbKey, JSON.stringify(db));

    console.log(`\n✅ ${fixedCount} prix corrigés :\n`);
    fixes.forEach(fix => {
      console.log(`  - "${fix.name}"`);
      console.log(`    Avant: ${fix.oldPrice.toFixed(2)} €`);
      console.log(`    Après: ${fix.newPrice.toFixed(2)} €\n`);
    });
  } else {
    console.log('✅ Aucun prix suspect détecté. Tous les produits sont OK!');
  }

  return { fixedCount, fixes };
}

// Auto-exécution si appelé directement
if (typeof window !== 'undefined') {
  console.log('🔧 Script de correction des prix lancé...\n');
  fixLegacyPrices();
}
