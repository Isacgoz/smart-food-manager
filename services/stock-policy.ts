/**
 * Service de gestion des politiques de stock
 * Gère les comportements en cas de stock négatif
 * 
 * Modes disponibles:
 * - BLOCK: Empêche la vente si stock insuffisant
 * - WARN: Affiche un avertissement mais autorise la vente
 * - SILENT: Autorise les stocks négatifs sans avertissement
 */

import { StockPolicy, Ingredient, Product, RecipeItem } from '../shared/types';
import { BusinessError } from '../shared/services/monitoring';

// Configuration par défaut
const DEFAULT_STOCK_POLICY: StockPolicy = 'WARN';

/**
 * Vérifie si un produit peut être vendu selon la politique de stock
 */
export function canSellProduct(
  product: Product,
  ingredients: Ingredient[],
  quantity: number = 1,
  stockPolicy: StockPolicy = DEFAULT_STOCK_POLICY
): { canSell: boolean; message?: string; insufficientIngredients?: string[] } {
  
  // Si pas de recette, on peut toujours vendre
  if (!product.recipe || product.recipe.length === 0) {
    return { canSell: true };
  }

  // Vérifier chaque ingrédient de la recette
  const insufficientIngredients: string[] = [];
  
  for (const recipeItem of product.recipe) {
    const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId);
    
    if (!ingredient) {
      console.warn(`Ingredient ${recipeItem.ingredientId} not found in recipe`);
      continue;
    }

    const requiredQuantity = recipeItem.quantity * quantity;
    const availableStock = ingredient.stock;

    if (availableStock < requiredQuantity) {
      insufficientIngredients.push(ingredient.name);
    }
  }

  // Pas de problème de stock
  if (insufficientIngredients.length === 0) {
    return { canSell: true };
  }

  // Gérer selon la politique
  switch (stockPolicy) {
    case 'BLOCK':
      return {
        canSell: false,
        message: `Stock insuffisant pour: ${insufficientIngredients.join(', ')}. Vente bloquée.`,
        insufficientIngredients
      };

    case 'WARN':
      return {
        canSell: true,
        message: `⚠️ Attention: Stock faible pour ${insufficientIngredients.join(', ')}`,
        insufficientIngredients
      };

    case 'SILENT':
      return {
        canSell: true,
        insufficientIngredients
      };

    default:
      return { canSell: true };
  }
}

/**
 * Vérifie le stock disponible pour un produit
 */
export function getAvailableQuantity(
  product: Product,
  ingredients: Ingredient[]
): number {
  // Si pas de recette, quantité illimitée
  if (!product.recipe || product.recipe.length === 0) {
    return Infinity;
  }

  let minQuantity = Infinity;

  for (const recipeItem of product.recipe) {
    const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId);
    
    if (!ingredient) {
      continue;
    }

    const possibleQuantity = Math.floor(ingredient.stock / recipeItem.quantity);
    minQuantity = Math.min(minQuantity, possibleQuantity);
  }

  return minQuantity === Infinity ? 0 : Math.max(0, minQuantity);
}

/**
 * Calcule l'impact sur le stock d'une vente
 */
export function calculateStockImpact(
  product: Product,
  quantity: number,
  ingredients: Ingredient[]
): Map<string, { ingredientId: string; name: string; currentStock: number; newStock: number; quantity: number }> {
  const impact = new Map();

  if (!product.recipe || product.recipe.length === 0) {
    return impact;
  }

  for (const recipeItem of product.recipe) {
    const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId);
    
    if (!ingredient) {
      continue;
    }

    const usedQuantity = recipeItem.quantity * quantity;
    const newStock = ingredient.stock - usedQuantity;

    impact.set(ingredient.id, {
      ingredientId: ingredient.id,
      name: ingredient.name,
      currentStock: ingredient.stock,
      newStock,
      quantity: usedQuantity
    });
  }

  return impact;
}

/**
 * Valide une commande selon la politique de stock
 * Lance une BusinessError si la vente est bloquée
 */
export function validateOrderStock(
  products: Array<{ product: Product; quantity: number }>,
  ingredients: Ingredient[],
  stockPolicy: StockPolicy = DEFAULT_STOCK_POLICY
): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const { product, quantity } of products) {
    const result = canSellProduct(product, ingredients, quantity, stockPolicy);

    if (!result.canSell) {
      errors.push(`${product.name}: ${result.message}`);
    } else if (result.message) {
      warnings.push(`${product.name}: ${result.message}`);
    }
  }

  if (errors.length > 0) {
    throw new BusinessError(
      'STOCK_INSUFFICIENT',
      `Impossible de valider la commande:\n${errors.join('\n')}`,
      { errors, stockPolicy }
    );
  }

  if (warnings.length > 0 && stockPolicy === 'WARN') {
    console.warn('Stock warnings:', warnings);
  }
}

/**
 * Obtient la description de la politique de stock
 */
export function getStockPolicyDescription(policy: StockPolicy): string {
  switch (policy) {
    case 'BLOCK':
      return 'Bloque les ventes si le stock est insuffisant (recommandé pour éviter les ruptures)';
    case 'WARN':
      return 'Affiche un avertissement mais autorise la vente (par défaut)';
    case 'SILENT':
      return 'Autorise les stocks négatifs sans avertissement (non recommandé)';
    default:
      return 'Politique inconnue';
  }
}

/**
 * Obtient l'icône de la politique de stock
 */
export function getStockPolicyIcon(policy: StockPolicy): string {
  switch (policy) {
    case 'BLOCK':
      return '🚫';
    case 'WARN':
      return '⚠️';
    case 'SILENT':
      return '🔕';
    default:
      return '❓';
  }
}
