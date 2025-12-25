import { describe, it, expect } from 'vitest';
import { calculateEBE, aggregateExpenses, calculateEmployeeRevenue } from '../expenses';
import type { Order, Expense, Product, Ingredient } from '../../types';

describe('Expenses Service - Calcul EBE', () => {
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
    }
  ];

  const mockIngredients: Ingredient[] = [
    {
      id: 'ing1',
      name: 'Viande',
      unit: 'g',
      stock: 10000,
      pmp: 0.02, // 2 centimes/gramme = 3€ pour 150g
      minStock: 1000,
      category: 'Viandes'
    },
    {
      id: 'ing2',
      name: 'Pain',
      unit: 'g',
      stock: 5000,
      pmp: 0.01, // 1 centime/gramme = 0.5€ pour 50g
      minStock: 500,
      category: 'Boulangerie'
    }
  ];

  const mockOrders: Order[] = [
    {
      id: 'order1',
      number: 1,
      items: [
        {
          productId: 'prod1',
          name: 'Burger',
          quantity: 2,
          price: 10
        }
      ],
      total: 20,
      status: 'COMPLETED',
      kitchenStatus: 'SERVED',
      date: '2025-01-25T10:00:00Z',
      userId: 'user1',
      paymentMethod: 'CASH',
      version: 1,
      updatedAt: '2025-01-25T10:00:00Z'
    },
    {
      id: 'order2',
      number: 2,
      items: [
        {
          productId: 'prod1',
          name: 'Burger',
          quantity: 1,
          price: 10
        }
      ],
      total: 10,
      status: 'COMPLETED',
      kitchenStatus: 'SERVED',
      date: '2025-01-25T11:00:00Z',
      userId: 'user2',
      paymentMethod: 'CARD',
      version: 1,
      updatedAt: '2025-01-25T11:00:00Z'
    }
  ];

  const mockExpenses: Expense[] = [
    {
      id: 'exp1',
      restaurantId: 'rest1',
      category: 'RENT',
      label: 'Loyer Janvier',
      amount: 500,
      type: 'FIXED',
      frequency: 'MONTHLY',
      date: '2025-01-01T00:00:00Z',
      createdAt: '2025-01-01T00:00:00Z',
      createdBy: 'user1',
      isPaid: true,
      paymentDate: '2025-01-01T00:00:00Z'
    },
    {
      id: 'exp2',
      restaurantId: 'rest1',
      category: 'ELECTRICITY',
      label: 'EDF Janvier',
      amount: 150,
      type: 'VARIABLE',
      frequency: 'MONTHLY',
      date: '2025-01-15T00:00:00Z',
      createdAt: '2025-01-15T00:00:00Z',
      createdBy: 'user1',
      isPaid: true
    }
  ];

  describe('calculateEBE', () => {
    it('calcule EBE correctement avec CA, coût matière et charges', () => {
      const result = calculateEBE(
        mockOrders,
        mockExpenses,
        mockProducts,
        mockIngredients,
        '2025-01-25T00:00:00Z',
        '2025-01-25T23:59:59Z'
      );

      // CA total: 20 + 10 = 30€
      expect(result.revenue.totalSales).toBe(30);

      // Coût matière par burger: 150g * 0.02 + 50g * 0.01 = 3 + 0.5 = 3.5€
      // Total: 3 burgers * 3.5 = 10.5€
      expect(result.materialCost).toBe(10.5);

      // Marge brute: 30 - 10.5 = 19.5€
      expect(result.grossMargin).toBe(19.5);

      // Charges totales: 500 + 150 = 650€
      expect(result.expenses.totalExpenses).toBe(650);

      // EBE: 19.5 - 650 = -630.5€ (perte)
      expect(result.ebe).toBe(-630.5);
      expect(result.isProfitable).toBe(false);
    });

    it('détecte rentabilité quand EBE positif', () => {
      const lowExpenses: Expense[] = [
        {
          id: 'exp1',
          restaurantId: 'rest1',
          category: 'ELECTRICITY',
          label: 'EDF',
          amount: 5,
          type: 'VARIABLE',
          frequency: 'MONTHLY',
          date: '2025-01-25T00:00:00Z',
          createdAt: '2025-01-25T00:00:00Z',
          createdBy: 'user1',
          isPaid: true
        }
      ];

      const result = calculateEBE(
        mockOrders,
        lowExpenses,
        mockProducts,
        mockIngredients,
        '2025-01-25T00:00:00Z',
        '2025-01-25T23:59:59Z'
      );

      // Marge brute: 19.5€
      // Charges: 5€
      // EBE: 19.5 - 5 = 14.5€
      expect(result.ebe).toBe(14.5);
      expect(result.isProfitable).toBe(true);
    });

    it('calcule taux de marge brute correctement', () => {
      const result = calculateEBE(
        mockOrders,
        mockExpenses,
        mockProducts,
        mockIngredients,
        '2025-01-25T00:00:00Z',
        '2025-01-25T23:59:59Z'
      );

      // Taux marge brute: (19.5 / 30) * 100 = 65%
      expect(result.grossMarginRate).toBe(65);
    });

    it('sépare charges fixes et variables', () => {
      const result = calculateEBE(
        mockOrders,
        mockExpenses,
        mockProducts,
        mockIngredients,
        '2025-01-25T00:00:00Z',
        '2025-01-25T23:59:59Z'
      );

      expect(result.expenses.fixed).toBe(500);
      expect(result.expenses.variable).toBe(150);
    });

    it('agrège charges par catégorie', () => {
      const result = calculateEBE(
        mockOrders,
        mockExpenses,
        mockProducts,
        mockIngredients,
        '2025-01-25T00:00:00Z',
        '2025-01-25T23:59:59Z'
      );

      expect(result.expenses.byCategory['RENT']).toBe(500);
      expect(result.expenses.byCategory['ELECTRICITY']).toBe(150);
    });

    it('calcule CA par moyen de paiement', () => {
      const result = calculateEBE(
        mockOrders,
        mockExpenses,
        mockProducts,
        mockIngredients,
        '2025-01-25T00:00:00Z',
        '2025-01-25T23:59:59Z'
      );

      expect(result.revenue.cash).toBe(20);
      expect(result.revenue.card).toBe(10);
    });

    it('retourne 0 si aucune commande dans période', () => {
      const result = calculateEBE(
        mockOrders,
        mockExpenses,
        mockProducts,
        mockIngredients,
        '2025-01-26T00:00:00Z',
        '2025-01-26T23:59:59Z'
      );

      expect(result.revenue.totalSales).toBe(0);
      expect(result.materialCost).toBe(0);
      expect(result.grossMargin).toBe(0);
      expect(result.ebe).toBe(-650); // Uniquement les charges
      expect(result.isProfitable).toBe(false);
    });
  });

  describe('aggregateExpenses', () => {
    it('agrège dépenses par catégorie', () => {
      const result = aggregateExpenses(
        mockExpenses,
        '2025-01-01T00:00:00Z',
        '2025-01-31T23:59:59Z'
      );

      expect(result.totalExpenses).toBe(650);
      expect(result.fixed).toBe(500);
      expect(result.variable).toBe(150);
      expect(result.byCategory['RENT']).toBe(500);
      expect(result.byCategory['ELECTRICITY']).toBe(150);
    });

    it('filtre dépenses hors période', () => {
      const result = aggregateExpenses(
        mockExpenses,
        '2025-02-01T00:00:00Z',
        '2025-02-28T23:59:59Z'
      );

      expect(result.totalExpenses).toBe(0);
      expect(result.fixed).toBe(0);
      expect(result.variable).toBe(0);
    });
  });

  describe('calculateEmployeeRevenue', () => {
    it('calcule CA par employé', () => {
      const result = calculateEmployeeRevenue(
        mockOrders,
        '2025-01-25T00:00:00Z',
        '2025-01-25T23:59:59Z'
      );

      expect(result).toHaveLength(2);

      const user1 = result.find(r => r.userId === 'user1');
      expect(user1?.revenue).toBe(20);
      expect(user1?.orderCount).toBe(1);

      const user2 = result.find(r => r.userId === 'user2');
      expect(user2?.revenue).toBe(10);
      expect(user2?.orderCount).toBe(1);
    });

    it('retourne tableau vide si aucune commande', () => {
      const result = calculateEmployeeRevenue(
        [],
        '2025-01-25T00:00:00Z',
        '2025-01-25T23:59:59Z'
      );

      expect(result).toHaveLength(0);
    });
  });
});
