import { describe, it, expect } from 'vitest';
import {
  validateStockBeforeOrder,
  destockIngredients,
  calculatePMP,
  mergeOrders
} from '../shared/services/business';
import type { Product, Ingredient, OrderItem, Order } from '../shared/types';

describe('Business Logic - Stock Management', () => {
  describe('validateStockBeforeOrder', () => {
    it('devrait valider stock suffisant', () => {
      const products: Product[] = [{
        id: 'p1',
        name: 'Burger',
        price: 10,
        category: 'Plats',
        recipe: [{ ingredientId: 'i1', quantity: 150 }]
      }];

      const ingredients: Ingredient[] = [{
        id: 'i1',
        name: 'Steak',
        stock: 1000,
        unit: 'g',
        category: 'Viande',
        averageCost: 2
      }];

      const items: OrderItem[] = [{
        productId: 'p1',
        quantity: 2,
        price: 10
      }];

      const result = validateStockBeforeOrder(items, products, ingredients);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait détecter stock insuffisant', () => {
      const products: Product[] = [{
        id: 'p1',
        name: 'Burger',
        price: 10,
        category: 'Plats',
        recipe: [{ ingredientId: 'i1', quantity: 150 }]
      }];

      const ingredients: Ingredient[] = [{
        id: 'i1',
        name: 'Steak',
        stock: 100, // Insuffisant pour 2 burgers (2 × 150g = 300g requis)
        unit: 'g',
        category: 'Viande',
        averageCost: 2
      }];

      const items: OrderItem[] = [{
        productId: 'p1',
        quantity: 2,
        price: 10
      }];

      const result = validateStockBeforeOrder(items, products, ingredients);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Steak');
    });
  });

  describe('destockIngredients', () => {
    it('devrait déduire stock correctement', () => {
      const products: Product[] = [{
        id: 'p1',
        name: 'Burger',
        price: 10,
        category: 'Plats',
        recipe: [{ ingredientId: 'i1', quantity: 150 }]
      }];

      const ingredients: Ingredient[] = [{
        id: 'i1',
        name: 'Steak',
        stock: 1000,
        unit: 'g',
        category: 'Viande',
        averageCost: 2
      }];

      const items: OrderItem[] = [{
        productId: 'p1',
        quantity: 2,
        price: 10
      }];

      const result = destockIngredients(items, products, ingredients, 'order123');

      expect(result.updatedIngredients[0].stock).toBe(700); // 1000 - (2 × 150)
      expect(result.movements).toHaveLength(1);
      expect(result.movements[0].type).toBe('SALE');
      expect(result.movements[0].quantity).toBe(-300);
    });
  });

  describe('calculatePMP', () => {
    it('devrait calculer PMP correctement (stock existant)', () => {
      const currentStock = 100;
      const currentPMP = 5;
      const quantityReceived = 50;
      const unitCost = 6;

      const newPMP = calculatePMP(currentStock, currentPMP, quantityReceived, unitCost);

      // (100 × 5 + 50 × 6) / (100 + 50) = (500 + 300) / 150 = 5.33...
      expect(newPMP).toBeCloseTo(5.333, 2);
    });

    it('devrait retourner unitCost si stock = 0', () => {
      const newPMP = calculatePMP(0, 0, 100, 7);
      expect(newPMP).toBe(7);
    });
  });

  describe('mergeOrders', () => {
    it('devrait garder version locale si plus récente', () => {
      const localOrders: Order[] = [{
        id: 'o1',
        items: [],
        total: 10,
        status: 'PENDING',
        type: 'DINE_IN',
        createdAt: '2025-01-01T12:00:00Z',
        version: 2,
        updatedAt: '2025-01-01T12:05:00Z'
      }];

      const remoteOrders: Order[] = [{
        id: 'o1',
        items: [],
        total: 10,
        status: 'PREPARING',
        type: 'DINE_IN',
        createdAt: '2025-01-01T12:00:00Z',
        version: 1,
        updatedAt: '2025-01-01T12:03:00Z'
      }];

      const merged = mergeOrders(localOrders, remoteOrders);

      expect(merged[0].version).toBe(2);
      expect(merged[0].status).toBe('PENDING'); // Garde version locale
    });

    it('devrait prendre version remote si plus récente', () => {
      const localOrders: Order[] = [{
        id: 'o1',
        items: [],
        total: 10,
        status: 'PENDING',
        type: 'DINE_IN',
        createdAt: '2025-01-01T12:00:00Z',
        version: 1,
        updatedAt: '2025-01-01T12:03:00Z'
      }];

      const remoteOrders: Order[] = [{
        id: 'o1',
        items: [],
        total: 10,
        status: 'PREPARING',
        type: 'DINE_IN',
        createdAt: '2025-01-01T12:00:00Z',
        version: 2,
        updatedAt: '2025-01-01T12:05:00Z'
      }];

      const merged = mergeOrders(localOrders, remoteOrders);

      expect(merged[0].version).toBe(2);
      expect(merged[0].status).toBe('PREPARING'); // Prend version remote
    });

    it('devrait ajouter nouvelles commandes remote', () => {
      const localOrders: Order[] = [{
        id: 'o1',
        items: [],
        total: 10,
        status: 'PENDING',
        type: 'DINE_IN',
        createdAt: '2025-01-01T12:00:00Z'
      }];

      const remoteOrders: Order[] = [
        {
          id: 'o1',
          items: [],
          total: 10,
          status: 'PENDING',
          type: 'DINE_IN',
          createdAt: '2025-01-01T12:00:00Z'
        },
        {
          id: 'o2',
          items: [],
          total: 15,
          status: 'PENDING',
          type: 'TAKEAWAY',
          createdAt: '2025-01-01T12:10:00Z'
        }
      ];

      const merged = mergeOrders(localOrders, remoteOrders);

      expect(merged).toHaveLength(2);
      expect(merged.find(o => o.id === 'o2')).toBeDefined();
    });
  });
});
