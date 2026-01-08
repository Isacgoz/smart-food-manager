/**
 * Error Handling & Edge Cases Service
 * 
 * Gestion centralisée des erreurs et cas limites:
 * - Stock négatif policy
 * - Annulation avec restock
 * - Modification prix avec historique
 * - Validation données entrée
 * - Messages erreur utilisateur
 */

import type {
  Order,
  Product,
  Ingredient,
  StockMovement,
  User,
  OrderItem
} from '../types';
import { businessAlerts } from './monitoring';

/**
 * Types d'erreurs métier
 */
export enum ErrorType {
  STOCK_NEGATIVE = 'STOCK_NEGATIVE',
  STOCK_INSUFFICIENT = 'STOCK_INSUFFICIENT',
  INVALID_QUANTITY = 'INVALID_QUANTITY',
  INVALID_PRICE = 'INVALID_PRICE',
  INVALID_DATE = 'INVALID_DATE',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  MISSING_RECIPE = 'MISSING_RECIPE',
  INVALID_USER = 'INVALID_USER',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ORDER_ALREADY_CANCELLED = 'ORDER_ALREADY_CANCELLED',
  ORDER_CANNOT_CANCEL = 'ORDER_CANNOT_CANCEL',
  PRICE_HISTORY_CONFLICT = 'PRICE_HISTORY_CONFLICT',
}

/**
 * Erreur métier avec contexte
 */
export class BusinessError extends Error {
  type: ErrorType;
  context: Record<string, any>;
  userMessage: string;
  recoverable: boolean;

  constructor(
    type: ErrorType,
    message: string,
    userMessage: string,
    context: Record<string, any> = {},
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'BusinessError';
    this.type = type;
    this.context = context;
    this.userMessage = userMessage;
    this.recoverable = recoverable;
  }
}

/**
 * Politique de gestion du stock négatif
 */
export enum StockNegativePolicy {
  BLOCK = 'BLOCK',           // Bloquer la vente
  ALLOW = 'ALLOW',           // Autoriser (stock négatif temporaire)
  ALERT = 'ALERT',           // Autoriser mais alerter
}

/**
 * Configuration gestion erreurs
 */
export interface ErrorHandlingConfig {
  stockNegativePolicy: StockNegativePolicy;
  allowPartialOrders: boolean;        // Autoriser commandes partielles si stock insuffisant
  maxCancellationDelay: number;       // Délai max annulation (minutes)
  requireCancellationReason: boolean; // Raison obligatoire pour annulation
  priceHistoryRetention: number;      // Rétention historique prix (jours)
}

/**
 * Configuration par défaut
 */
export const DEFAULT_ERROR_CONFIG: ErrorHandlingConfig = {
  stockNegativePolicy: StockNegativePolicy.ALERT,
  allowPartialOrders: false,
  maxCancellationDelay: 60, // 1 heure
  requireCancellationReason: true,
  priceHistoryRetention: 365, // 1 an
};

/**
 * Résultat validation stock
 */
export interface StockValidationResult {
  valid: boolean;
  errors: BusinessError[];
  warnings: BusinessError[];
  canProceed: boolean;
  missingIngredients: Array<{
    ingredientId: string;
    ingredientName: string;
    required: number;
    available: number;
    missing: number;
  }>;
}

/**
 * Valider stock avant commande avec politique
 */
export const validateStockWithPolicy = (
  orderItems: OrderItem[],
  products: Product[],
  ingredients: Ingredient[],
  user: User,
  config: ErrorHandlingConfig = DEFAULT_ERROR_CONFIG
): StockValidationResult => {
  const errors: BusinessError[] = [];
  const warnings: BusinessError[] = [];
  const missingIngredients: StockValidationResult['missingIngredients'] = [];

  // Calculer besoins totaux par ingrédient
  const ingredientNeeds = new Map<string, number>();

  orderItems.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      errors.push(new BusinessError(
        ErrorType.MISSING_RECIPE,
        `Product ${item.productId} not found`,
        `Produit "${item.name}" introuvable`,
        { productId: item.productId }
      ));
      return;
    }

    if (!product.recipe || product.recipe.length === 0) {
      warnings.push(new BusinessError(
        ErrorType.MISSING_RECIPE,
        `Product ${product.id} has no recipe`,
        `Le produit "${product.name}" n'a pas de recette définie`,
        { productId: product.id, productName: product.name }
      ));
      return;
    }

    product.recipe.forEach(recipeItem => {
      const current = ingredientNeeds.get(recipeItem.ingredientId) || 0;
      ingredientNeeds.set(
        recipeItem.ingredientId,
        current + (recipeItem.quantity * item.quantity)
      );
    });
  });

  // Vérifier disponibilité pour chaque ingrédient
  ingredientNeeds.forEach((required, ingredientId) => {
    const ingredient = ingredients.find(i => i.id === ingredientId);
    if (!ingredient) {
      errors.push(new BusinessError(
        ErrorType.STOCK_INSUFFICIENT,
        `Ingredient ${ingredientId} not found`,
        `Ingrédient introuvable`,
        { ingredientId }
      ));
      return;
    }

    const available = ingredient.quantity;
    const missing = required - available;

    if (missing > 0) {
      missingIngredients.push({
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        required,
        available,
        missing,
      });

      // Appliquer politique stock négatif
      switch (config.stockNegativePolicy) {
        case StockNegativePolicy.BLOCK:
          errors.push(new BusinessError(
            ErrorType.STOCK_INSUFFICIENT,
            `Insufficient stock for ${ingredient.name}`,
            `Stock insuffisant pour "${ingredient.name}". Disponible: ${available.toFixed(2)} ${ingredient.unit}, Requis: ${required.toFixed(2)} ${ingredient.unit}`,
            { ingredientId, ingredientName: ingredient.name, required, available, missing }
          ));
          break;

        case StockNegativePolicy.ALERT:
          warnings.push(new BusinessError(
            ErrorType.STOCK_NEGATIVE,
            `Stock will be negative for ${ingredient.name}`,
            `⚠️ Stock négatif après vente: "${ingredient.name}" (${missing.toFixed(2)} ${ingredient.unit} manquant)`,
            { ingredientId, ingredientName: ingredient.name, required, available, missing }
          ));
          // Alerte Sentry stock négatif
          businessAlerts.stockNegative(ingredient, available - required, user);
          break;

        case StockNegativePolicy.ALLOW:
          // Autoriser silencieusement
          break;
      }
    }
  });

  const canProceed = errors.length === 0 && (
    config.stockNegativePolicy !== StockNegativePolicy.BLOCK ||
    missingIngredients.length === 0
  );

  // Alerte Sentry si stock insuffisant (commande bloquée)
  if (missingIngredients.length > 0 && !canProceed) {
    const orderStub: Order = {
      id: 'pending',
      number: 0,
      items: orderItems,
      total: 0,
      status: 'PENDING',
      kitchenStatus: 'PENDING',
      date: new Date().toISOString(),
      userId: user.id,
    } as Order;

    businessAlerts.insufficientStock(orderStub, missingIngredients.map(mi => ({
      name: mi.ingredientName,
      required: mi.required,
      available: mi.available,
    })));
  }

  return {
    valid: errors.length === 0 && warnings.length === 0,
    errors,
    warnings,
    canProceed,
    missingIngredients,
  };
};

/**
 * Résultat annulation commande
 */
export interface CancellationResult {
  success: boolean;
  error?: BusinessError;
  restockedIngredients: Array<{
    ingredientId: string;
    ingredientName: string;
    quantity: number;
  }>;
  movements: StockMovement[];
}

/**
 * Annuler commande avec restock automatique
 */
export const cancelOrderWithRestock = (
  order: Order,
  reason: string,
  user: User,
  products: Product[],
  ingredients: Ingredient[],
  config: ErrorHandlingConfig = DEFAULT_ERROR_CONFIG
): CancellationResult => {
  // Vérifier si commande déjà annulée
  if (order.status === 'CANCELLED') {
    return {
      success: false,
      error: new BusinessError(
        ErrorType.ORDER_ALREADY_CANCELLED,
        `Order ${order.id} already cancelled`,
        `Cette commande est déjà annulée`,
        { orderId: order.id }
      ),
      restockedIngredients: [],
      movements: [],
    };
  }

  // Vérifier si commande peut être annulée (délai)
  const orderDate = new Date(order.date);
  const now = new Date();
  const minutesSinceOrder = (now.getTime() - orderDate.getTime()) / (1000 * 60);

  if (minutesSinceOrder > config.maxCancellationDelay) {
    return {
      success: false,
      error: new BusinessError(
        ErrorType.ORDER_CANNOT_CANCEL,
        `Order ${order.id} too old to cancel`,
        `Impossible d'annuler cette commande (délai dépassé: ${Math.floor(minutesSinceOrder)} minutes)`,
        { orderId: order.id, minutesSinceOrder, maxDelay: config.maxCancellationDelay }
      ),
      restockedIngredients: [],
      movements: [],
    };
  }

  // Vérifier raison obligatoire
  if (config.requireCancellationReason && !reason.trim()) {
    return {
      success: false,
      error: new BusinessError(
        ErrorType.INVALID_DATE,
        'Cancellation reason required',
        'Veuillez indiquer la raison de l\'annulation',
        { orderId: order.id }
      ),
      restockedIngredients: [],
      movements: [],
    };
  }

  // Calculer ingrédients à restocker
  const restockedIngredients: CancellationResult['restockedIngredients'] = [];
  const movements: StockMovement[] = [];

  order.items.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product || !product.recipe) return;

    product.recipe.forEach(recipeItem => {
      const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId);
      if (!ingredient) return;

      const quantityToRestock = recipeItem.quantity * item.quantity;

      // Créer mouvement de stock RESTOCK
      const movement: StockMovement = {
        id: `restock-${order.id}-${ingredient.id}-${Date.now()}`,
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        type: 'RESTOCK',
        quantity: quantityToRestock,
        date: new Date().toISOString(),
        userId: user.id,
        userName: user.name,
        reason: `Annulation commande ${order.id}: ${reason}`,
        orderId: order.id,
      };

      movements.push(movement);

      restockedIngredients.push({
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        quantity: quantityToRestock,
      });
    });
  });

  return {
    success: true,
    restockedIngredients,
    movements,
  };
};

/**
 * Historique prix produit
 */
export interface PriceHistory {
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  changedAt: string;
  changedBy: string;
  reason?: string;
}

/**
 * Résultat modification prix
 */
export interface PriceChangeResult {
  success: boolean;
  error?: BusinessError;
  warning?: BusinessError;
  history: PriceHistory;
  impactedOrders: number;
}

/**
 * Modifier prix produit avec historique
 */
export const changePriceWithHistory = (
  product: Product,
  newPrice: number,
  user: User,
  reason: string = '',
  priceHistory: PriceHistory[],
  config: ErrorHandlingConfig = DEFAULT_ERROR_CONFIG
): PriceChangeResult => {
  // Valider nouveau prix
  if (newPrice <= 0) {
    return {
      success: false,
      error: new BusinessError(
        ErrorType.INVALID_PRICE,
        `Invalid price ${newPrice}`,
        `Le prix doit être supérieur à 0€`,
        { productId: product.id, newPrice }
      ),
      history: {
        productId: product.id,
        productName: product.name,
        oldPrice: product.price,
        newPrice,
        changedAt: new Date().toISOString(),
        changedBy: user.name,
        reason,
      },
      impactedOrders: 0,
    };
  }

  // Vérifier variation importante (>50%)
  const priceChange = Math.abs(newPrice - product.price);
  const priceChangePercent = (priceChange / product.price) * 100;

  let warning: BusinessError | undefined;
  if (priceChangePercent > 50) {
    warning = new BusinessError(
      ErrorType.PRICE_HISTORY_CONFLICT,
      `Large price change for ${product.name}`,
      `⚠️ Variation importante du prix: ${priceChangePercent.toFixed(1)}% (${product.price.toFixed(2)}€ → ${newPrice.toFixed(2)}€)`,
      { productId: product.id, oldPrice: product.price, newPrice, changePercent: priceChangePercent }
    );
  }

  // Créer entrée historique
  const history: PriceHistory = {
    productId: product.id,
    productName: product.name,
    oldPrice: product.price,
    newPrice,
    changedAt: new Date().toISOString(),
    changedBy: user.name,
    reason,
  };

  // Nettoyer ancien historique (rétention)
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() - config.priceHistoryRetention);

  return {
    success: true,
    warning,
    history,
    impactedOrders: 0, // À calculer si besoin
  };
};

/**
 * Valider quantité
 */
export const validateQuantity = (
  quantity: number,
  unit: string,
  context: string
): BusinessError | null => {
  if (isNaN(quantity) || !isFinite(quantity)) {
    return new BusinessError(
      ErrorType.INVALID_QUANTITY,
      `Invalid quantity: ${quantity}`,
      `Quantité invalide pour ${context}`,
      { quantity, unit, context }
    );
  }

  if (quantity < 0) {
    return new BusinessError(
      ErrorType.INVALID_QUANTITY,
      `Negative quantity: ${quantity}`,
      `La quantité ne peut pas être négative pour ${context}`,
      { quantity, unit, context }
    );
  }

  if (quantity === 0) {
    return new BusinessError(
      ErrorType.INVALID_QUANTITY,
      `Zero quantity: ${quantity}`,
      `La quantité doit être supérieure à 0 pour ${context}`,
      { quantity, unit, context }
    );
  }

  return null;
};

/**
 * Valider prix
 */
export const validatePrice = (
  price: number,
  context: string
): BusinessError | null => {
  if (isNaN(price) || !isFinite(price)) {
    return new BusinessError(
      ErrorType.INVALID_PRICE,
      `Invalid price: ${price}`,
      `Prix invalide pour ${context}`,
      { price, context }
    );
  }

  if (price < 0) {
    return new BusinessError(
      ErrorType.INVALID_PRICE,
      `Negative price: ${price}`,
      `Le prix ne peut pas être négatif pour ${context}`,
      { price, context }
    );
  }

  if (price === 0) {
    return new BusinessError(
      ErrorType.INVALID_PRICE,
      `Zero price: ${price}`,
      `Le prix doit être supérieur à 0€ pour ${context}`,
      { price, context }
    );
  }

  return null;
};

/**
 * Valider date
 */
export const validateDate = (
  date: string | Date,
  context: string,
  allowFuture: boolean = false
): BusinessError | null => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return new BusinessError(
      ErrorType.INVALID_DATE,
      `Invalid date: ${date}`,
      `Date invalide pour ${context}`,
      { date, context }
    );
  }

  if (!allowFuture && dateObj > new Date()) {
    return new BusinessError(
      ErrorType.INVALID_DATE,
      `Future date not allowed: ${date}`,
      `La date ne peut pas être dans le futur pour ${context}`,
      { date, context }
    );
  }

  return null;
};

/**
 * Formater message erreur pour utilisateur
 */
export const formatErrorMessage = (error: BusinessError): string => {
  return error.userMessage;
};

/**
 * Formater messages multiples
 */
export const formatErrorMessages = (errors: BusinessError[]): string => {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0].userMessage;
  
  return errors.map((e, i) => `${i + 1}. ${e.userMessage}`).join('\n');
};

/**
 * Logger erreur avec monitoring
 */
export const logBusinessError = (
  error: BusinessError,
  user?: User
): void => {
  console.error('[BusinessError]', {
    type: error.type,
    message: error.message,
    userMessage: error.userMessage,
    context: error.context,
    recoverable: error.recoverable,
    user: user?.name,
  });

  // Envoyer alerte si critique
  // Note: intégration monitoring déportée pour éviter dépendance circulaire
  if (!error.recoverable && user) {
    console.warn('[CRITICAL_ERROR] Erreur non récupérable détectée', {
      errorType: error.type,
      userId: user.id,
      userName: user.name,
    });
  }
};
