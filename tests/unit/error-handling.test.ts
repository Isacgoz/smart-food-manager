/**
 * Tests unitaires - Error Handling Service
 * Validation gestion erreurs et cas limites
 */

import { describe, it, expect } from 'vitest';
import {
  validateStockWithPolicy,
  cancelOrderWithRestock,
  changePriceWithHistory,
  validateQuantity,
  validatePrice,
  validateDate,
  formatErrorMessage,
  formatErrorMessages,
  StockNegativePolicy,
  ErrorType,
  BusinessError,
  DEFAULT_ERROR_CONFIG,
} from '../../shared/services/error-handling';
import type { Order, Product, Ingredient, User, OrderItem } from '../../shared/types';

describe('Error Handling - Validation Stock', () => {
  const mockIngredients: Ingredient[] = [
    {
      id: 'i1',
      name: 'Pain',
      quantity: 50,
      unit: 'pièce',
      averageCost: 0.35,
      supplier: 'Boulangerie',
      category: 'Boulangerie',
    },
    {
      id: 'i2',
      name: 'Steak',
      quantity: 2.5,
      unit: 'kg',
      averageCost: 8.50,
      supplier: 'Boucherie',
      category: 'Viande',
    },
  ] as Ingredient[];

  const mockProducts: Product[] = [
    {
      id: 'p1',
      name: 'Burger',
      price: 9.90,
      category: 'Burgers',
      recipe: [
        { ingredientId: 'i1', quantity: 1 },
        { ingredientId: 'i2', quantity: 0.150 },
      ],
    },
  ] as Product[];

  it('devrait valider stock suffisant avec policy BLOCK', () => {
    const orderItems: OrderItem[] = [
      { productId: 'p1', name: 'Burger', quantity: 10, price: 9.90 },
    ];

    const result = validateStockWithPolicy(
      orderItems,
      mockProducts,
      mockIngredients,
      { ...DEFAULT_ERROR_CONFIG, stockNegativePolicy: StockNegativePolicy.BLOCK }
    );

    expect(result.valid).toBe(true);
    expect(result.canProceed).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.missingIngredients).toHaveLength(0);
  });

  it('devrait bloquer si stock insuffisant avec policy BLOCK', () => {
    const orderItems: OrderItem[] = [
      { productId: 'p1', name: 'Burger', quantity: 60, price: 9.90 }, // 60 pains + 9kg steak requis
    ];

    const result = validateStockWithPolicy(
      orderItems,
      mockProducts,
      mockIngredients,
      { ...DEFAULT_ERROR_CONFIG, stockNegativePolicy: StockNegativePolicy.BLOCK }
    );

    expect(result.valid).toBe(false);
    expect(result.canProceed).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].type).toBe(ErrorType.STOCK_INSUFFICIENT);
    expect(result.missingIngredients.length).toBeGreaterThanOrEqual(1);

    // Vérifier qu'au moins Pain est manquant
    const painMissing = result.missingIngredients.find(m => m.ingredientName === 'Pain');
    expect(painMissing).toBeDefined();
    expect(painMissing!.missing).toBe(10);
  });

  it('devrait alerter mais autoriser avec policy ALERT', () => {
    const orderItems: OrderItem[] = [
      { productId: 'p1', name: 'Burger', quantity: 60, price: 9.90 },
    ];

    const result = validateStockWithPolicy(
      orderItems,
      mockProducts,
      mockIngredients,
      { ...DEFAULT_ERROR_CONFIG, stockNegativePolicy: StockNegativePolicy.ALERT }
    );

    expect(result.valid).toBe(false); // Warnings présents
    expect(result.canProceed).toBe(true); // Mais peut continuer
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].type).toBe(ErrorType.STOCK_NEGATIVE);
  });

  it('devrait autoriser silencieusement avec policy ALLOW', () => {
    const orderItems: OrderItem[] = [
      { productId: 'p1', name: 'Burger', quantity: 60, price: 9.90 },
    ];

    const result = validateStockWithPolicy(
      orderItems,
      mockProducts,
      mockIngredients,
      { ...DEFAULT_ERROR_CONFIG, stockNegativePolicy: StockNegativePolicy.ALLOW }
    );

    expect(result.valid).toBe(true);
    expect(result.canProceed).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('devrait détecter produit sans recette', () => {
    const productNoRecipe: Product = {
      id: 'p2',
      name: 'Produit sans recette',
      price: 5.00,
      category: 'Autre',
      recipe: [],
    } as Product;

    const orderItems: OrderItem[] = [
      { productId: 'p2', name: 'Produit sans recette', quantity: 1, price: 5.00 },
    ];

    const result = validateStockWithPolicy(
      orderItems,
      [productNoRecipe],
      mockIngredients,
      DEFAULT_ERROR_CONFIG
    );

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].type).toBe(ErrorType.MISSING_RECIPE);
  });

  it('devrait cumuler besoins pour plusieurs produits', () => {
    const orderItems: OrderItem[] = [
      { productId: 'p1', name: 'Burger', quantity: 10, price: 9.90 },
      { productId: 'p1', name: 'Burger', quantity: 5, price: 9.90 },
    ];

    const result = validateStockWithPolicy(
      orderItems,
      mockProducts,
      mockIngredients,
      { ...DEFAULT_ERROR_CONFIG, stockNegativePolicy: StockNegativePolicy.BLOCK }
    );

    // 15 burgers = 15 pains (OK) + 2.25kg steak (OK: 2.5kg dispo)
    expect(result.valid).toBe(true);
    expect(result.canProceed).toBe(true);
  });
});

describe('Error Handling - Annulation Commande', () => {
  const mockUser: User = {
    id: 'u1',
    name: 'Gérant',
    email: 'gerant@test.fr',
    role: 'OWNER',
    pin: '1234',
  } as User;

  const mockIngredients: Ingredient[] = [
    { id: 'i1', name: 'Pain', quantity: 50, unit: 'pièce', averageCost: 0.35 },
  ] as Ingredient[];

  const mockProducts: Product[] = [
    {
      id: 'p1',
      name: 'Burger',
      price: 9.90,
      category: 'Burgers',
      recipe: [{ ingredientId: 'i1', quantity: 1 }],
    },
  ] as Product[];

  it('devrait annuler commande et restocker', () => {
    const order: Order = {
      id: 'order1',
      items: [{ productId: 'p1', name: 'Burger', quantity: 5, price: 9.90 }],
      total: 49.50,
      status: 'COMPLETED',
      type: 'DINE_IN',
      paymentMethod: 'CASH',
      date: new Date().toISOString(),
      userId: 'u1',
    } as Order;

    const result = cancelOrderWithRestock(
      order,
      'Erreur de commande',
      mockUser,
      mockProducts,
      mockIngredients,
      DEFAULT_ERROR_CONFIG
    );

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.restockedIngredients).toHaveLength(1);
    expect(result.restockedIngredients[0].ingredientName).toBe('Pain');
    expect(result.restockedIngredients[0].quantity).toBe(5);
    expect(result.movements).toHaveLength(1);
    expect(result.movements[0].type).toBe('RESTOCK');
  });

  it('devrait refuser annulation si déjà annulée', () => {
    const order: Order = {
      id: 'order1',
      items: [{ productId: 'p1', name: 'Burger', quantity: 5, price: 9.90 }],
      total: 49.50,
      status: 'CANCELLED',
      type: 'DINE_IN',
      paymentMethod: 'CASH',
      date: new Date().toISOString(),
      userId: 'u1',
    } as Order;

    const result = cancelOrderWithRestock(
      order,
      'Test',
      mockUser,
      mockProducts,
      mockIngredients,
      DEFAULT_ERROR_CONFIG
    );

    expect(result.success).toBe(false);
    expect(result.error?.type).toBe(ErrorType.ORDER_ALREADY_CANCELLED);
    expect(result.restockedIngredients).toHaveLength(0);
  });

  it('devrait refuser annulation si délai dépassé', () => {
    const oldDate = new Date();
    oldDate.setHours(oldDate.getHours() - 2); // 2 heures avant

    const order: Order = {
      id: 'order1',
      items: [{ productId: 'p1', name: 'Burger', quantity: 5, price: 9.90 }],
      total: 49.50,
      status: 'COMPLETED',
      type: 'DINE_IN',
      paymentMethod: 'CASH',
      date: oldDate.toISOString(),
      userId: 'u1',
    } as Order;

    const result = cancelOrderWithRestock(
      order,
      'Test',
      mockUser,
      mockProducts,
      mockIngredients,
      { ...DEFAULT_ERROR_CONFIG, maxCancellationDelay: 60 } // 1 heure max
    );

    expect(result.success).toBe(false);
    expect(result.error?.type).toBe(ErrorType.ORDER_CANNOT_CANCEL);
  });

  it('devrait exiger raison si configuré', () => {
    const order: Order = {
      id: 'order1',
      items: [{ productId: 'p1', name: 'Burger', quantity: 5, price: 9.90 }],
      total: 49.50,
      status: 'COMPLETED',
      type: 'DINE_IN',
      paymentMethod: 'CASH',
      date: new Date().toISOString(),
      userId: 'u1',
    } as Order;

    const result = cancelOrderWithRestock(
      order,
      '', // Raison vide
      mockUser,
      mockProducts,
      mockIngredients,
      { ...DEFAULT_ERROR_CONFIG, requireCancellationReason: true }
    );

    expect(result.success).toBe(false);
    expect(result.error?.userMessage).toContain('raison');
  });

  it('devrait créer mouvements pour chaque ingrédient', () => {
    const productMultiIngredients: Product = {
      id: 'p2',
      name: 'Burger Complet',
      price: 12.90,
      category: 'Burgers',
      recipe: [
        { ingredientId: 'i1', quantity: 1 },
        { ingredientId: 'i2', quantity: 0.150 },
        { ingredientId: 'i3', quantity: 1 },
      ],
    } as Product;

    const ingredients: Ingredient[] = [
      { id: 'i1', name: 'Pain', quantity: 50, unit: 'pièce', averageCost: 0.35 },
      { id: 'i2', name: 'Steak', quantity: 5, unit: 'kg', averageCost: 8.50 },
      { id: 'i3', name: 'Fromage', quantity: 30, unit: 'tranche', averageCost: 0.42 },
    ] as Ingredient[];

    const order: Order = {
      id: 'order1',
      items: [{ productId: 'p2', name: 'Burger Complet', quantity: 3, price: 12.90 }],
      total: 38.70,
      status: 'COMPLETED',
      type: 'DINE_IN',
      paymentMethod: 'CASH',
      date: new Date().toISOString(),
      userId: 'u1',
    } as Order;

    const result = cancelOrderWithRestock(
      order,
      'Test',
      mockUser,
      [productMultiIngredients],
      ingredients,
      DEFAULT_ERROR_CONFIG
    );

    expect(result.success).toBe(true);
    expect(result.restockedIngredients).toHaveLength(3);
    expect(result.movements).toHaveLength(3);
  });
});

describe('Error Handling - Modification Prix', () => {
  const mockUser: User = {
    id: 'u1',
    name: 'Gérant',
    email: 'gerant@test.fr',
    role: 'OWNER',
  } as User;

  const mockProduct: Product = {
    id: 'p1',
    name: 'Burger',
    price: 9.90,
    category: 'Burgers',
  } as Product;

  it('devrait modifier prix avec historique', () => {
    const result = changePriceWithHistory(
      mockProduct,
      10.50,
      mockUser,
      'Ajustement inflation',
      [],
      DEFAULT_ERROR_CONFIG
    );

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.history.oldPrice).toBe(9.90);
    expect(result.history.newPrice).toBe(10.50);
    expect(result.history.changedBy).toBe('Gérant');
    expect(result.history.reason).toBe('Ajustement inflation');
  });

  it('devrait refuser prix négatif', () => {
    const result = changePriceWithHistory(
      mockProduct,
      -5.00,
      mockUser,
      'Test',
      [],
      DEFAULT_ERROR_CONFIG
    );

    expect(result.success).toBe(false);
    expect(result.error?.type).toBe(ErrorType.INVALID_PRICE);
  });

  it('devrait refuser prix zéro', () => {
    const result = changePriceWithHistory(
      mockProduct,
      0,
      mockUser,
      'Test',
      [],
      DEFAULT_ERROR_CONFIG
    );

    expect(result.success).toBe(false);
    expect(result.error?.type).toBe(ErrorType.INVALID_PRICE);
  });

  it('devrait alerter si variation >50%', () => {
    const result = changePriceWithHistory(
      mockProduct,
      20.00, // +102% variation
      mockUser,
      'Changement majeur',
      [],
      DEFAULT_ERROR_CONFIG
    );

    expect(result.success).toBe(true);
    expect(result.warning).toBeDefined();
    expect(result.warning?.userMessage).toContain('Variation importante');
  });

  it('ne devrait pas alerter si variation <50%', () => {
    const result = changePriceWithHistory(
      mockProduct,
      11.00, // +11% variation
      mockUser,
      'Ajustement mineur',
      [],
      DEFAULT_ERROR_CONFIG
    );

    expect(result.success).toBe(true);
    expect(result.warning).toBeUndefined();
  });
});

describe('Error Handling - Validations', () => {
  it('validateQuantity - devrait accepter quantité valide', () => {
    const error = validateQuantity(5, 'kg', 'Steak');
    expect(error).toBeNull();
  });

  it('validateQuantity - devrait refuser quantité négative', () => {
    const error = validateQuantity(-5, 'kg', 'Steak');
    expect(error).not.toBeNull();
    expect(error?.type).toBe(ErrorType.INVALID_QUANTITY);
  });

  it('validateQuantity - devrait refuser quantité zéro', () => {
    const error = validateQuantity(0, 'kg', 'Steak');
    expect(error).not.toBeNull();
    expect(error?.type).toBe(ErrorType.INVALID_QUANTITY);
  });

  it('validateQuantity - devrait refuser NaN', () => {
    const error = validateQuantity(NaN, 'kg', 'Steak');
    expect(error).not.toBeNull();
    expect(error?.type).toBe(ErrorType.INVALID_QUANTITY);
  });

  it('validatePrice - devrait accepter prix valide', () => {
    const error = validatePrice(9.90, 'Burger');
    expect(error).toBeNull();
  });

  it('validatePrice - devrait refuser prix négatif', () => {
    const error = validatePrice(-9.90, 'Burger');
    expect(error).not.toBeNull();
    expect(error?.type).toBe(ErrorType.INVALID_PRICE);
  });

  it('validatePrice - devrait refuser prix zéro', () => {
    const error = validatePrice(0, 'Burger');
    expect(error).not.toBeNull();
  });

  it('validateDate - devrait accepter date passée', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const error = validateDate(yesterday, 'Commande', false);
    expect(error).toBeNull();
  });

  it('validateDate - devrait refuser date future si non autorisée', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const error = validateDate(tomorrow, 'Commande', false);
    expect(error).not.toBeNull();
    expect(error?.type).toBe(ErrorType.INVALID_DATE);
  });

  it('validateDate - devrait accepter date future si autorisée', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const error = validateDate(tomorrow, 'Réservation', true);
    expect(error).toBeNull();
  });

  it('validateDate - devrait refuser date invalide', () => {
    const error = validateDate('invalid-date', 'Test', false);
    expect(error).not.toBeNull();
    expect(error?.type).toBe(ErrorType.INVALID_DATE);
  });
});

describe('Error Handling - Formatage Messages', () => {
  it('formatErrorMessage - devrait retourner message utilisateur', () => {
    const error = new BusinessError(
      ErrorType.STOCK_INSUFFICIENT,
      'Technical message',
      'Message pour utilisateur',
      {}
    );

    const message = formatErrorMessage(error);
    expect(message).toBe('Message pour utilisateur');
  });

  it('formatErrorMessages - devrait formater message unique', () => {
    const errors = [
      new BusinessError(
        ErrorType.STOCK_INSUFFICIENT,
        'Tech',
        'Stock insuffisant',
        {}
      ),
    ];

    const message = formatErrorMessages(errors);
    expect(message).toBe('Stock insuffisant');
  });

  it('formatErrorMessages - devrait formater messages multiples', () => {
    const errors = [
      new BusinessError(ErrorType.STOCK_INSUFFICIENT, 'Tech', 'Erreur 1', {}),
      new BusinessError(ErrorType.INVALID_PRICE, 'Tech', 'Erreur 2', {}),
    ];

    const message = formatErrorMessages(errors);
    expect(message).toContain('1. Erreur 1');
    expect(message).toContain('2. Erreur 2');
  });

  it('formatErrorMessages - devrait retourner vide si aucune erreur', () => {
    const message = formatErrorMessages([]);
    expect(message).toBe('');
  });
});
