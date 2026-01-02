import { OrderItem, Product, Ingredient, StockMovement } from '../types';

/**
 * Validation stock AVANT création commande
 * CRITIQUE: Empêche ventes sans stock
 */
export const validateStockBeforeOrder = (
  items: OrderItem[],
  products: Product[],
  ingredients: Ingredient[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const missingIngredients: string[] = [];
  const insufficientStock: { name: string; required: number; available: number }[] = [];

  items.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product || !product.recipe) return;

    product.recipe.forEach(recipeItem => {
      const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId);
      if (!ingredient) {
        missingIngredients.push(recipeItem.ingredientId);
        return;
      }

      const required = recipeItem.quantity * item.quantity;
      if (ingredient.stock < required) {
        insufficientStock.push({
          name: ingredient.name,
          required,
          available: ingredient.stock
        });
      }
    });
  });

  if (missingIngredients.length > 0) {
    errors.push('Ingrédients manquants dans la recette');
  }

  if (insufficientStock.length > 0) {
    const details = insufficientStock.map(i =>
      `${i.name} (besoin: ${i.required}, dispo: ${i.available})`
    ).join(', ');
    errors.push(`Stock insuffisant: ${details}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Déstockage automatique (Principe métier n°2)
 * RETOURNE nouveaux ingrédients + mouvements (immutable)
 */
export const destockIngredients = (
  items: OrderItem[],
  products: Product[],
  ingredients: Ingredient[],
  orderId: string
): { updatedIngredients: Ingredient[]; movements: StockMovement[] } => {
  const movements: StockMovement[] = [];
  const updatedIngredients = [...ingredients];

  items.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product || !product.recipe) return;

    product.recipe.forEach(recipeItem => {
      const ingredientIndex = updatedIngredients.findIndex(i => i.id === recipeItem.ingredientId);
      if (ingredientIndex === -1) return;

      const quantityToDeduct = recipeItem.quantity * item.quantity;

      // Déstockage
      updatedIngredients[ingredientIndex] = {
        ...updatedIngredients[ingredientIndex],
        stock: updatedIngredients[ingredientIndex].stock - quantityToDeduct
      };

      // Mouvement tracé
      movements.push({
        id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ingredientId: recipeItem.ingredientId,
        type: 'SALE',
        quantity: -quantityToDeduct,
        date: new Date().toISOString(),
        documentRef: orderId
      });
    });
  });

  return { updatedIngredients, movements };
};

/**
 * Calcul coût matière d'un produit
 * Somme des coûts ingrédients de la recette
 * Si pas de recette: retourner 0 (produit revendu, pas de coût matière)
 */
export const calculateProductCost = (
  product: Product,
  ingredients: Ingredient[]
): number => {
  if (!product.recipe || product.recipe.length === 0) {
    return 0;
  }

  return product.recipe.reduce((total, recipeItem) => {
    const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId);
    if (!ingredient) return total;

    return total + (ingredient.averageCost * recipeItem.quantity);
  }, 0);
};

/**
 * Calcul Prix Moyen Pondéré
 * Formule: (stock × PMP_ancien + qté_reçue × prix_unit) / (stock + qté_reçue)
 */
export const calculatePMP = (
  currentStock: number,
  currentPMP: number,
  quantityReceived: number,
  unitCost: number
): number => {
  if (currentStock === 0) {
    return unitCost;
  }

  return ((currentStock * currentPMP) + (quantityReceived * unitCost)) / (currentStock + quantityReceived);
};

/**
 * Génération ID unique
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

/**
 * Merge intelligent commandes (gestion conflits)
 */
export const mergeOrders = <T extends { id: string; version?: number; updatedAt?: string }>(
  localOrders: T[],
  remoteOrders: T[]
): T[] => {
  const merged = [...localOrders];

  remoteOrders.forEach(remoteOrder => {
    const localIndex = merged.findIndex(o => o.id === remoteOrder.id);

    if (localIndex === -1) {
      // Nouvelle commande distante
      merged.push(remoteOrder);
    } else {
      const local = merged[localIndex];
      const localVersion = local.version || 0;
      const remoteVersion = remoteOrder.version || 0;

      // Garder version la plus récente
      if (remoteVersion > localVersion) {
        merged[localIndex] = remoteOrder;
      } else if (remoteVersion === localVersion && remoteOrder.updatedAt && local.updatedAt) {
        // Si même version, comparer timestamps
        if (new Date(remoteOrder.updatedAt) > new Date(local.updatedAt)) {
          merged[localIndex] = remoteOrder;
        }
      }
    }
  });

  return merged;
};
