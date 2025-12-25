import { describe, it, expect } from 'vitest';
import {
  validateStockBeforeOrder,
  destockIngredients,
  calculatePMP,
  mergeOrders
} from '../business';
import type { OrderItem, Product, Ingredient, Order } from '../../types';

describe('Business Service - Logique Métier', () => {
  const mockProducts: Product[] = [
    {
      id: 'prod1',
      name: 'Burger',
      category: 'Plats',
      price: 10,
      stock: 100,
      image: '',
      recipe: [
        { ingredientId: 'ing1', quantity: 150, unit: 'g' },
        { ingredientId: 'ing2', quantity: 50, unit: 'g' }
      ]
    },
    {
      id: 'prod2',
      name: 'Frites',
      category: 'Accompagnements',
      price: 3,
      stock: 50,
      image: '',
      recipe: [
        { ingredientId: 'ing3', quantity: 200, unit: 'g' }
      ]
    }
  ];

  const mockIngredients: Ingredient[] = [
    {
      id: 'ing1',
      name: 'Viande',
      unit: 'g',
      stock: 3000,
      pmp: 0.02,
      minStock: 1000,
      category: 'Viandes'
    },
    {
      id: 'ing2',
      name: 'Pain',
      unit: 'g',
      stock: 1000,
      pmp: 0.01,
      minStock: 500,
      category: 'Boulangerie'
    },
    {
      id: 'ing3',
      name: 'Pommes de terre',
      unit: 'g',
      stock: 5000,
      pmp: 0.005,
      minStock: 1000,
      category: 'Légumes'
    }
  ];

  describe('validateStockBeforeOrder', () => {
    it('valide commande si stock suffisant', () => {
      const items: OrderItem[] = [
        { productId: 'prod1', name: 'Burger', quantity: 2, price: 10 }
      ];

      const result = validateStockBeforeOrder(items, mockProducts, mockIngredients);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('détecte stock insuffisant', () => {
      const items: OrderItem[] = [
        { productId: 'prod1', name: 'Burger', quantity: 30, price: 10 }
      ];

      const result = validateStockBeforeOrder(items, mockProducts, mockIngredients);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('Viande'))).toBe(true);
    });

    it('cumule quantités pour produit commandé plusieurs fois', () => {
      const items: OrderItem[] = [
        { productId: 'prod1', name: 'Burger', quantity: 5, price: 10 },
        { productId: 'prod1', name: 'Burger', quantity: 5, price: 10 }
      ];

      const result = validateStockBeforeOrder(items, mockProducts, mockIngredients);

      // 10 burgers = 10 * 150g = 1500g viande (stock: 3000g) ✓
      // 10 burgers = 10 * 50g = 500g pain (stock: 1000g) ✓
      expect(result.valid).toBe(true);
    });

    it('retourne erreur si produit sans recette', () => {
      const productNoRecipe: Product = {
        id: 'prod3',
        name: 'Boisson',
        category: 'Boissons',
        price: 2,
        stock: 10,
        image: ''
      };

      const items: OrderItem[] = [
        { productId: 'prod3', name: 'Boisson', quantity: 1, price: 2 }
      ];

      const result = validateStockBeforeOrder(items, [...mockProducts, productNoRecipe], mockIngredients);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Pas de recette'))).toBe(true);
    });
  });

  describe('destockIngredients', () => {
    it('déduit correctement stock ingrédients', () => {
      const items: OrderItem[] = [
        { productId: 'prod1', name: 'Burger', quantity: 2, price: 10 }
      ];

      const result = destockIngredients(items, mockProducts, mockIngredients, 'order123');

      const viande = result.updatedIngredients.find(i => i.id === 'ing1');
      const pain = result.updatedIngredients.find(i => i.id === 'ing2');

      // 2 burgers * 150g = 300g viande déduits
      expect(viande?.stock).toBe(3000 - 300);

      // 2 burgers * 50g = 100g pain déduits
      expect(pain?.stock).toBe(1000 - 100);
    });

    it('crée mouvements de stock SALE', () => {
      const items: OrderItem[] = [
        { productId: 'prod1', name: 'Burger', quantity: 1, price: 10 }
      ];

      const result = destockIngredients(items, mockProducts, mockIngredients, 'order123');

      expect(result.movements).toHaveLength(2); // Viande + Pain

      const viandeMovement = result.movements.find(m => m.ingredientId === 'ing1');
      expect(viandeMovement?.type).toBe('SALE');
      expect(viandeMovement?.quantity).toBe(-150);
      expect(viandeMovement?.reference).toBe('order123');
    });

    it('cumule quantités pour ingrédients communs', () => {
      const items: OrderItem[] = [
        { productId: 'prod1', name: 'Burger', quantity: 2, price: 10 },
        { productId: 'prod2', name: 'Frites', quantity: 1, price: 3 }
      ];

      const result = destockIngredients(items, mockProducts, mockIngredients, 'order123');

      const viande = result.updatedIngredients.find(i => i.id === 'ing1');
      const pain = result.updatedIngredients.find(i => i.id === 'ing2');
      const pommes = result.updatedIngredients.find(i => i.id === 'ing3');

      expect(viande?.stock).toBe(3000 - 300); // 2 burgers * 150g
      expect(pain?.stock).toBe(1000 - 100);   // 2 burgers * 50g
      expect(pommes?.stock).toBe(5000 - 200); // 1 frites * 200g
    });

    it('ignore produits sans recette', () => {
      const productNoRecipe: Product = {
        id: 'prod3',
        name: 'Boisson',
        category: 'Boissons',
        price: 2,
        stock: 10,
        image: ''
      };

      const items: OrderItem[] = [
        { productId: 'prod3', name: 'Boisson', quantity: 5, price: 2 }
      ];

      const result = destockIngredients(items, [...mockProducts, productNoRecipe], mockIngredients, 'order123');

      // Aucun mouvement créé
      expect(result.movements).toHaveLength(0);

      // Stock ingrédients inchangé
      expect(result.updatedIngredients).toEqual(mockIngredients);
    });
  });

  describe('calculatePMP', () => {
    it('calcule PMP avec réception', () => {
      const currentStock = 1000;
      const currentPMP = 0.02;
      const receivedQuantity = 500;
      const receivedPrice = 0.015;

      const newPMP = calculatePMP(currentStock, currentPMP, receivedQuantity, receivedPrice);

      // (1000 * 0.02 + 500 * 0.015) / (1000 + 500)
      // (20 + 7.5) / 1500 = 27.5 / 1500 = 0.0183...
      expect(newPMP).toBeCloseTo(0.0183, 4);
    });

    it('retourne prix réception si stock à zéro', () => {
      const newPMP = calculatePMP(0, 0, 1000, 0.025);

      expect(newPMP).toBe(0.025);
    });

    it('retourne PMP actuel si réception zéro', () => {
      const newPMP = calculatePMP(1000, 0.02, 0, 0.015);

      expect(newPMP).toBe(0.02);
    });

    it('gère prix négatif (correction erreur)', () => {
      const newPMP = calculatePMP(1000, 0.02, 500, -0.01);

      // Ne devrait pas retourner négatif
      expect(newPMP).toBeGreaterThanOrEqual(0);
    });
  });

  describe('mergeOrders', () => {
    const localOrders: Order[] = [
      {
        id: 'order1',
        number: 1,
        items: [],
        total: 100,
        status: 'COMPLETED',
        kitchenStatus: 'SERVED',
        date: '2025-01-25T10:00:00Z',
        userId: 'user1',
        version: 2,
        updatedAt: '2025-01-25T10:05:00Z'
      }
    ];

    const remoteOrders: Order[] = [
      {
        id: 'order1',
        number: 1,
        items: [],
        total: 100,
        status: 'COMPLETED',
        kitchenStatus: 'SERVED',
        date: '2025-01-25T10:00:00Z',
        userId: 'user1',
        version: 1,
        updatedAt: '2025-01-25T10:02:00Z'
      },
      {
        id: 'order2',
        number: 2,
        items: [],
        total: 50,
        status: 'PENDING',
        kitchenStatus: 'QUEUED',
        date: '2025-01-25T11:00:00Z',
        userId: 'user2',
        version: 1,
        updatedAt: '2025-01-25T11:00:00Z'
      }
    ];

    it('garde version locale si plus récente', () => {
      const merged = mergeOrders(localOrders, remoteOrders);

      const order1 = merged.find(o => o.id === 'order1');
      expect(order1?.version).toBe(2);
      expect(order1?.updatedAt).toBe('2025-01-25T10:05:00Z');
    });

    it('ajoute commandes distantes absentes localement', () => {
      const merged = mergeOrders(localOrders, remoteOrders);

      expect(merged).toHaveLength(2);
      expect(merged.some(o => o.id === 'order2')).toBe(true);
    });

    it('garde commandes locales absentes distantes', () => {
      const localOnly: Order[] = [
        {
          id: 'order3',
          number: 3,
          items: [],
          total: 75,
          status: 'PENDING',
          kitchenStatus: 'QUEUED',
          date: '2025-01-25T12:00:00Z',
          userId: 'user3',
          version: 1,
          updatedAt: '2025-01-25T12:00:00Z'
        }
      ];

      const merged = mergeOrders([...localOrders, ...localOnly], remoteOrders);

      expect(merged).toHaveLength(3);
      expect(merged.some(o => o.id === 'order3')).toBe(true);
    });

    it('gère tableaux vides', () => {
      const merged1 = mergeOrders([], remoteOrders);
      expect(merged1).toHaveLength(2);

      const merged2 = mergeOrders(localOrders, []);
      expect(merged2).toHaveLength(1);

      const merged3 = mergeOrders([], []);
      expect(merged3).toHaveLength(0);
    });
  });
});
