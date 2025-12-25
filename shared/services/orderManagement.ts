import { Order, OrderItem, Product, Ingredient } from '../types';
import { validateStockBeforeOrder, destockIngredients } from './business';
import { logger } from './logger';

export interface OrderModification {
  orderId: string;
  action: 'ADD_ITEM' | 'REMOVE_ITEM' | 'UPDATE_QUANTITY' | 'CANCEL_ITEM';
  itemIndex?: number;
  newItem?: OrderItem;
  newQuantity?: number;
  reason?: string;
  modifiedBy: string;
  modifiedAt: string;
}

/**
 * Ajouter article à commande existante
 */
export const addItemToOrder = (
  order: Order,
  newItem: OrderItem,
  products: Product[],
  ingredients: Ingredient[],
  userId: string
): { order: Order; movements: any[]; error?: string } => {
  // Validation stock
  const validation = validateStockBeforeOrder([newItem], products, ingredients);

  if (!validation.valid) {
    logger.warn('Ajout article impossible: stock insuffisant', {
      orderId: order.id,
      item: newItem,
      errors: validation.errors
    });

    return {
      order,
      movements: [],
      error: validation.errors.join(', ')
    };
  }

  // Déstockage
  const { updatedIngredients, movements } = destockIngredients(
    [newItem],
    products,
    ingredients,
    order.id
  );

  // Mise à jour commande
  const updatedOrder: Order = {
    ...order,
    items: [...order.items, newItem],
    total: order.total + (newItem.price * newItem.quantity),
    version: (order.version || 0) + 1,
    updatedAt: new Date().toISOString()
  };

  logger.audit('ADD_ITEM', 'ORDER', order.id, {
    item: newItem,
    newTotal: updatedOrder.total,
    modifiedBy: userId
  });

  return {
    order: updatedOrder,
    movements
  };
};

/**
 * Retirer article de commande existante
 */
export const removeItemFromOrder = (
  order: Order,
  itemIndex: number,
  reason: string,
  userId: string
): { order: Order; refundAmount: number } => {
  if (itemIndex < 0 || itemIndex >= order.items.length) {
    logger.error('Index article invalide', { orderId: order.id, itemIndex });
    throw new Error('Article non trouvé');
  }

  const removedItem = order.items[itemIndex];
  const refundAmount = removedItem.price * removedItem.quantity;

  const updatedOrder: Order = {
    ...order,
    items: order.items.filter((_, i) => i !== itemIndex),
    total: order.total - refundAmount,
    version: (order.version || 0) + 1,
    updatedAt: new Date().toISOString()
  };

  logger.audit('REMOVE_ITEM', 'ORDER', order.id, {
    removedItem,
    refundAmount,
    reason,
    modifiedBy: userId
  });

  return {
    order: updatedOrder,
    refundAmount
  };
};

/**
 * Modifier quantité article
 */
export const updateItemQuantity = (
  order: Order,
  itemIndex: number,
  newQuantity: number,
  products: Product[],
  ingredients: Ingredient[],
  userId: string
): { order: Order; movements: any[]; error?: string } => {
  if (itemIndex < 0 || itemIndex >= order.items.length) {
    return {
      order,
      movements: [],
      error: 'Article non trouvé'
    };
  }

  if (newQuantity <= 0) {
    // Si quantité = 0, retirer article
    const { order: updatedOrder } = removeItemFromOrder(order, itemIndex, 'Quantité = 0', userId);
    return { order: updatedOrder, movements: [] };
  }

  const currentItem = order.items[itemIndex];
  const quantityDiff = newQuantity - currentItem.quantity;

  // Si augmentation, vérifier stock
  if (quantityDiff > 0) {
    const itemToValidate: OrderItem = {
      ...currentItem,
      quantity: quantityDiff
    };

    const validation = validateStockBeforeOrder([itemToValidate], products, ingredients);

    if (!validation.valid) {
      return {
        order,
        movements: [],
        error: validation.errors.join(', ')
      };
    }
  }

  // Déstockage différentiel
  const movements: any[] = [];
  if (quantityDiff !== 0) {
    const itemForDestock: OrderItem = {
      ...currentItem,
      quantity: Math.abs(quantityDiff)
    };

    const { movements: newMovements } = destockIngredients(
      [itemForDestock],
      products,
      ingredients,
      order.id
    );

    movements.push(...newMovements.map(m => ({
      ...m,
      quantity: quantityDiff > 0 ? m.quantity : -m.quantity
    })));
  }

  const priceDiff = currentItem.price * quantityDiff;

  const updatedOrder: Order = {
    ...order,
    items: order.items.map((item, i) =>
      i === itemIndex ? { ...item, quantity: newQuantity } : item
    ),
    total: order.total + priceDiff,
    version: (order.version || 0) + 1,
    updatedAt: new Date().toISOString()
  };

  logger.audit('UPDATE_QUANTITY', 'ORDER', order.id, {
    itemIndex,
    oldQuantity: currentItem.quantity,
    newQuantity,
    priceDiff,
    modifiedBy: userId
  });

  return {
    order: updatedOrder,
    movements
  };
};

/**
 * Annuler commande complète
 */
export const cancelOrder = (
  order: Order,
  reason: string,
  userId: string
): Order => {
  if (order.status === 'COMPLETED') {
    logger.warn('Tentative annulation commande payée', {
      orderId: order.id,
      userId
    });
    throw new Error('Impossible d\'annuler une commande déjà payée');
  }

  const cancelledOrder: Order = {
    ...order,
    status: 'CANCELLED',
    version: (order.version || 0) + 1,
    updatedAt: new Date().toISOString()
  };

  logger.audit('CANCEL_ORDER', 'ORDER', order.id, {
    reason,
    previousStatus: order.status,
    total: order.total,
    modifiedBy: userId
  });

  return cancelledOrder;
};

/**
 * Annulation partielle (remboursement items spécifiques)
 */
export const partialRefund = (
  order: Order,
  itemIndices: number[],
  reason: string,
  userId: string
): { order: Order; refundAmount: number } => {
  if (order.status !== 'COMPLETED') {
    throw new Error('Annulation partielle uniquement sur commandes payées');
  }

  let totalRefund = 0;
  const updatedItems = order.items.map((item, index) => {
    if (itemIndices.includes(index)) {
      totalRefund += item.price * item.quantity;
      return { ...item, refunded: true };
    }
    return item;
  });

  const updatedOrder: Order = {
    ...order,
    items: updatedItems,
    total: order.total - totalRefund,
    version: (order.version || 0) + 1,
    updatedAt: new Date().toISOString()
  };

  logger.audit('PARTIAL_REFUND', 'ORDER', order.id, {
    itemIndices,
    refundAmount: totalRefund,
    reason,
    modifiedBy: userId
  });

  return {
    order: updatedOrder,
    refundAmount: totalRefund
  };
};

/**
 * Dupliquer commande (récommander même chose)
 */
export const duplicateOrder = (
  originalOrder: Order,
  userId: string
): Order => {
  const newOrder: Order = {
    ...originalOrder,
    id: `order-${Date.now()}`,
    status: 'PENDING',
    date: new Date().toISOString(),
    userId,
    createdAt: new Date().toISOString(),
    version: 1,
    updatedAt: new Date().toISOString()
  };

  logger.info('Commande dupliquée', {
    originalId: originalOrder.id,
    newId: newOrder.id,
    userId
  });

  return newOrder;
};
