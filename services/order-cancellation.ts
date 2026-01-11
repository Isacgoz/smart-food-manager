/**
 * Service de gestion des annulations de commandes
 * Gère l'annulation des commandes et le restockage automatique
 */

import { Order, Ingredient, Product } from '../shared/types';
import { BusinessError } from '../shared/services/monitoring';

export interface CancellationReason {
  code: 'CUSTOMER_REQUEST' | 'KITCHEN_ERROR' | 'PAYMENT_ISSUE' | 'OUT_OF_STOCK' | 'OTHER';
  description: string;
}

export interface CancellationResult {
  success: boolean;
  orderId: string;
  restockedIngredients: Array<{
    ingredientId: string;
    name: string;
    quantityRestored: number;
    newStock: number;
  }>;
  reason: CancellationReason;
  cancelledAt: string;
  cancelledBy: string;
}

/**
 * Annule une commande et restaure le stock
 */
export async function cancelOrder(
  order: Order,
  products: Product[],
  ingredients: Ingredient[],
  reason: CancellationReason,
  userId: string
): Promise<CancellationResult> {
  
  // Vérifier que la commande peut être annulée
  if (order.status === 'CANCELLED') {
    throw new BusinessError(
      'ORDER_ALREADY_CANCELLED',
      'Cette commande a déjà été annulée',
      { orderId: order.id }
    );
  }

  // Ne pas annuler les commandes trop anciennes (> 24h)
  const orderDate = new Date(order.date);
  const now = new Date();
  const hoursSinceOrder = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceOrder > 24) {
    throw new BusinessError(
      'ORDER_TOO_OLD',
      'Impossible d\'annuler une commande de plus de 24h. Contactez le support.',
      { orderId: order.id, hoursSinceOrder }
    );
  }

  // Calculer les ingrédients à restocker
  const restockedIngredients = calculateRestockQuantities(order, products, ingredients);

  const result: CancellationResult = {
    success: true,
    orderId: order.id,
    restockedIngredients,
    reason,
    cancelledAt: new Date().toISOString(),
    cancelledBy: userId
  };

  return result;
}

/**
 * Calcule les quantités à restocker pour une commande annulée
 */
export function calculateRestockQuantities(
  order: Order,
  products: Product[],
  ingredients: Ingredient[]
): Array<{
  ingredientId: string;
  name: string;
  quantityRestored: number;
  newStock: number;
}> {
  const restockMap = new Map<string, number>();

  // Pour chaque item de la commande
  for (const orderItem of order.items) {
    const product = products.find(p => p.id === orderItem.productId);
    
    if (!product || !product.recipe || product.recipe.length === 0) {
      continue;
    }

    // Pour chaque ingrédient de la recette
    for (const recipeItem of product.recipe) {
      const quantityUsed = recipeItem.quantity * orderItem.quantity;
      const currentRestock = restockMap.get(recipeItem.ingredientId) || 0;
      restockMap.set(recipeItem.ingredientId, currentRestock + quantityUsed);
    }
  }

  // Convertir en tableau avec les informations complètes
  const result: Array<{
    ingredientId: string;
    name: string;
    quantityRestored: number;
    newStock: number;
  }> = [];

  for (const [ingredientId, quantityRestored] of restockMap.entries()) {
    const ingredient = ingredients.find(i => i.id === ingredientId);
    
    if (ingredient) {
      result.push({
        ingredientId,
        name: ingredient.name,
        quantityRestored,
        newStock: ingredient.stock + quantityRestored
      });
    }
  }

  return result;
}

/**
 * Applique le restockage des ingrédients
 */
export function applyRestock(
  ingredients: Ingredient[],
  restockData: Array<{ ingredientId: string; quantityRestored: number }>
): Ingredient[] {
  return ingredients.map(ingredient => {
    const restock = restockData.find(r => r.ingredientId === ingredient.id);
    
    if (restock) {
      return {
        ...ingredient,
        stock: ingredient.stock + restock.quantityRestored
      };
    }
    
    return ingredient;
  });
}

/**
 * Vérifie si une commande peut être annulée
 */
export function canCancelOrder(order: Order): { canCancel: boolean; reason?: string } {
  if (order.status === 'CANCELLED') {
    return {
      canCancel: false,
      reason: 'La commande est déjà annulée'
    };
  }

  const orderDate = new Date(order.date);
  const now = new Date();
  const hoursSinceOrder = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceOrder > 24) {
    return {
      canCancel: false,
      reason: 'La commande date de plus de 24h'
    };
  }

  return { canCancel: true };
}

/**
 * Obtient la description d'un code de raison d'annulation
 */
export function getCancellationReasonLabel(code: CancellationReason['code']): string {
  switch (code) {
    case 'CUSTOMER_REQUEST':
      return 'Demande du client';
    case 'KITCHEN_ERROR':
      return 'Erreur de cuisine';
    case 'PAYMENT_ISSUE':
      return 'Problème de paiement';
    case 'OUT_OF_STOCK':
      return 'Rupture de stock';
    case 'OTHER':
      return 'Autre raison';
    default:
      return 'Raison inconnue';
  }
}

/**
 * Crée un historique d'annulation pour l'audit
 */
export interface CancellationAuditEntry {
  orderId: string;
  orderNumber: number;
  orderTotal: number;
  cancelledAt: string;
  cancelledBy: string;
  reason: CancellationReason;
  restockedIngredients: Array<{
    ingredientId: string;
    name: string;
    quantityRestored: number;
  }>;
}

export function createCancellationAuditEntry(
  order: Order,
  result: CancellationResult
): CancellationAuditEntry {
  return {
    orderId: order.id,
    orderNumber: order.number,
    orderTotal: order.total,
    cancelledAt: result.cancelledAt,
    cancelledBy: result.cancelledBy,
    reason: result.reason,
    restockedIngredients: result.restockedIngredients.map(r => ({
      ingredientId: r.ingredientId,
      name: r.name,
      quantityRestored: r.quantityRestored
    }))
  };
}
