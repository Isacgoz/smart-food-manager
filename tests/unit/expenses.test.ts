import { describe, it, expect } from 'vitest';
import {
  calculateMaterialCost,
  aggregateExpenses,
  calculateEBE,
  getExpensesByPeriod,
  calculateEmployeeRevenue,
  calculatePaymentTypeBreakdown,
  calculateMonthlyExpenses
} from '../../shared/services/expenses';
import type { Order, Product, Ingredient, Expense } from '../../shared/types';

describe('Expenses - Calcul EBE', () => {
  // Fixtures communes
  const products: Product[] = [
    {
      id: 'p1',
      name: 'Burger',
      price: 10,
      category: 'Plats',
      recipe: [
        { ingredientId: 'i1', quantity: 1 },
        { ingredientId: 'i2', quantity: 0.150 }
      ]
    },
    {
      id: 'p2',
      name: 'Frites',
      price: 3,
      category: 'Accompagnements',
      recipe: [
        { ingredientId: 'i3', quantity: 0.200 }
      ]
    }
  ];

  const ingredients: Ingredient[] = [
    { id: 'i1', name: 'Pain', stock: 100, unit: 'pièce', category: 'Boulangerie', averageCost: 0.35 },
    { id: 'i2', name: 'Steak', stock: 10, unit: 'kg', category: 'Viande', averageCost: 8.50 },
    { id: 'i3', name: 'Pommes', stock: 20, unit: 'kg', category: 'Légumes', averageCost: 2.00 }
  ];

  describe('calculateMaterialCost', () => {
    it('devrait calculer coût matière total des commandes', () => {
      const orders: Order[] = [
        {
          id: 'o1',
          items: [
            { productId: 'p1', quantity: 2, price: 10 }, // 2 burgers
            { productId: 'p2', quantity: 1, price: 3 }   // 1 frites
          ],
          total: 23,
          status: 'COMPLETED',
          type: 'DINE_IN',
          date: '2026-01-07',
          createdAt: '2026-01-07T12:00:00Z'
        }
      ];

      const cost = calculateMaterialCost(orders, products, ingredients);

      // Burger: (0.35 + 0.150 × 8.50) × 2 = (0.35 + 1.275) × 2 = 3.25
      // Frites: 0.200 × 2.00 = 0.40
      // Total: 3.25 + 0.40 = 3.65
      expect(cost).toBeCloseTo(3.65, 2);
    });

    it('devrait ignorer commandes non complétées', () => {
      const orders: Order[] = [
        {
          id: 'o1',
          items: [{ productId: 'p1', quantity: 1, price: 10 }],
          total: 10,
          status: 'PENDING', // Non complétée
          type: 'DINE_IN',
          date: '2026-01-07',
          createdAt: '2026-01-07T12:00:00Z'
        },
        {
          id: 'o2',
          items: [{ productId: 'p1', quantity: 1, price: 10 }],
          total: 10,
          status: 'COMPLETED',
          type: 'DINE_IN',
          date: '2026-01-07',
          createdAt: '2026-01-07T12:05:00Z'
        }
      ];

      const cost = calculateMaterialCost(orders, products, ingredients);

      // Seulement o2 : 1 burger = 1.625
      expect(cost).toBeCloseTo(1.625, 3);
    });
  });

  describe('aggregateExpenses', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        label: 'Loyer',
        amount: 1200,
        type: 'FIXED',
        category: 'RENT',
        date: '2026-01-01',
        frequency: 'MONTHLY',
        isPaid: true,
        createdAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'e2',
        label: 'Électricité',
        amount: 180,
        type: 'VARIABLE',
        category: 'ELECTRICITY',
        date: '2026-01-05',
        frequency: 'MONTHLY',
        isPaid: true,
        createdAt: '2026-01-05T00:00:00Z'
      },
      {
        id: 'e3',
        label: 'Salaires',
        amount: 2500,
        type: 'FIXED',
        category: 'SALARIES',
        date: '2026-01-31',
        frequency: 'MONTHLY',
        isPaid: false,
        createdAt: '2026-01-31T00:00:00Z'
      }
    ];

    it('devrait agréger toutes les dépenses', () => {
      const agg = aggregateExpenses(expenses);

      expect(agg.totalExpenses).toBe(3880); // 1200 + 180 + 2500
      expect(agg.fixed).toBe(3700); // 1200 + 2500
      expect(agg.variable).toBe(180);
      expect(agg.byCategory.RENT).toBe(1200);
      expect(agg.byCategory.ELECTRICITY).toBe(180);
      expect(agg.byCategory.SALARIES).toBe(2500);
    });

    it('devrait filtrer par période', () => {
      const agg = aggregateExpenses(expenses, '2026-01-01', '2026-01-10');

      expect(agg.totalExpenses).toBe(1380); // Seulement e1 + e2
      expect(agg.fixed).toBe(1200);
      expect(agg.variable).toBe(180);
    });

    it('devrait initialiser toutes catégories à 0', () => {
      const agg = aggregateExpenses([]);

      expect(agg.totalExpenses).toBe(0);
      expect(agg.fixed).toBe(0);
      expect(agg.variable).toBe(0);
      expect(agg.byCategory.RENT).toBe(0);
      expect(agg.byCategory.MARKETING).toBe(0);
      expect(agg.byCategory.OTHER).toBe(0);
    });
  });

  describe('calculateEBE', () => {
    it('devrait calculer EBE complet pour période', () => {
      const orders: Order[] = [
        {
          id: 'o1',
          items: [{ productId: 'p1', quantity: 10, price: 10 }],
          total: 100,
          status: 'COMPLETED',
          type: 'DINE_IN',
          paymentMethod: 'CASH',
          date: '2026-01-10',
          createdAt: '2026-01-10T12:00:00Z'
        },
        {
          id: 'o2',
          items: [{ productId: 'p1', quantity: 5, price: 10 }],
          total: 50,
          status: 'COMPLETED',
          type: 'TAKEAWAY',
          paymentMethod: 'CARD',
          date: '2026-01-15',
          createdAt: '2026-01-15T14:00:00Z'
        }
      ];

      const expenses: Expense[] = [
        {
          id: 'e1',
          label: 'Loyer',
          amount: 1200,
          type: 'FIXED',
          category: 'RENT',
          date: '2026-01-01',
          frequency: 'MONTHLY',
          isPaid: true,
          createdAt: '2026-01-01T00:00:00Z'
        }
      ];

      const ebe = calculateEBE(
        orders,
        expenses,
        products,
        ingredients,
        '2026-01-01',
        '2026-01-31'
      );

      // CA : 100 + 50 = 150€
      expect(ebe.revenue.totalSales).toBe(150);
      expect(ebe.revenue.cash).toBe(100);
      expect(ebe.revenue.card).toBe(50);

      // Coût matière : 15 burgers × 1.625 = 24.375€
      expect(ebe.materialCost).toBeCloseTo(24.375, 2);

      // Marge brute : 150 - 24.375 = 125.625€
      expect(ebe.grossMargin).toBeCloseTo(125.625, 2);
      expect(ebe.grossMarginRate).toBeCloseTo(83.75, 1); // (125.625 / 150) × 100

      // Charges : 1200€
      expect(ebe.expenses.totalExpenses).toBe(1200);
      expect(ebe.expenses.fixed).toBe(1200);
      expect(ebe.expenses.variable).toBe(0);

      // EBE : 125.625 - 1200 = -1074.375€ (déficitaire)
      expect(ebe.ebe).toBeCloseTo(-1074.375, 2);
      expect(ebe.ebeRate).toBeCloseTo(-716.25, 1);
      expect(ebe.isProfitable).toBe(false);
    });

    it('devrait retourner EBE positif si rentable', () => {
      const orders: Order[] = [
        {
          id: 'o1',
          items: [{ productId: 'p1', quantity: 100, price: 10 }],
          total: 1000,
          status: 'COMPLETED',
          type: 'DINE_IN',
          paymentMethod: 'CARD',
          date: '2026-01-10',
          createdAt: '2026-01-10T12:00:00Z'
        }
      ];

      const expenses: Expense[] = [
        {
          id: 'e1',
          label: 'Loyer',
          amount: 200,
          type: 'FIXED',
          category: 'RENT',
          date: '2026-01-01',
          frequency: 'MONTHLY',
          isPaid: true,
          createdAt: '2026-01-01T00:00:00Z'
        }
      ];

      const ebe = calculateEBE(
        orders,
        expenses,
        products,
        ingredients,
        '2026-01-01',
        '2026-01-31'
      );

      // CA : 1000€
      // Coût matière : 100 × 1.625 = 162.5€
      // Marge : 1000 - 162.5 = 837.5€
      // EBE : 837.5 - 200 = 637.5€
      expect(ebe.ebe).toBeCloseTo(637.5, 1);
      expect(ebe.isProfitable).toBe(true);
    });

    it('devrait filtrer commandes hors période', () => {
      const orders: Order[] = [
        {
          id: 'o1',
          items: [{ productId: 'p1', quantity: 10, price: 10 }],
          total: 100,
          status: 'COMPLETED',
          type: 'DINE_IN',
          paymentMethod: 'CASH',
          date: '2025-12-31', // Hors période
          createdAt: '2025-12-31T12:00:00Z'
        },
        {
          id: 'o2',
          items: [{ productId: 'p1', quantity: 5, price: 10 }],
          total: 50,
          status: 'COMPLETED',
          type: 'DINE_IN',
          paymentMethod: 'CASH',
          date: '2026-01-10', // Dans période
          createdAt: '2026-01-10T12:00:00Z'
        }
      ];

      const ebe = calculateEBE(
        orders,
        [],
        products,
        ingredients,
        '2026-01-01',
        '2026-01-31'
      );

      expect(ebe.revenue.totalSales).toBe(50); // Seulement o2
    });
  });

  describe('calculateEmployeeRevenue', () => {
    it('devrait calculer CA par employé', () => {
      const orders: Order[] = [
        {
          id: 'o1',
          items: [],
          total: 100,
          status: 'COMPLETED',
          type: 'DINE_IN',
          userId: 'user1',
          paidByUserId: 'user1',
          date: '2026-01-10',
          createdAt: '2026-01-10T12:00:00Z'
        },
        {
          id: 'o2',
          items: [],
          total: 50,
          status: 'COMPLETED',
          type: 'DINE_IN',
          userId: 'user1',
          paidByUserId: 'user1',
          date: '2026-01-11',
          createdAt: '2026-01-11T12:00:00Z'
        },
        {
          id: 'o3',
          items: [],
          total: 75,
          status: 'COMPLETED',
          type: 'DINE_IN',
          userId: 'user2',
          paidByUserId: 'user2',
          date: '2026-01-12',
          createdAt: '2026-01-12T12:00:00Z'
        }
      ];

      const stats = calculateEmployeeRevenue(orders);

      expect(stats).toHaveLength(2);
      expect(stats[0].userId).toBe('user1');
      expect(stats[0].revenue).toBe(150); // 100 + 50
      expect(stats[0].orderCount).toBe(2);
      expect(stats[1].userId).toBe('user2');
      expect(stats[1].revenue).toBe(75);
      expect(stats[1].orderCount).toBe(1);
    });
  });

  describe('calculatePaymentTypeBreakdown', () => {
    it('devrait répartir paiements par type pour journée', () => {
      const orders: Order[] = [
        {
          id: 'o1',
          items: [],
          total: 100,
          status: 'COMPLETED',
          type: 'DINE_IN',
          paymentMethod: 'CASH',
          date: '2026-01-07T10:00:00Z',
          createdAt: '2026-01-07T10:00:00Z'
        },
        {
          id: 'o2',
          items: [],
          total: 50,
          status: 'COMPLETED',
          type: 'DINE_IN',
          paymentMethod: 'CASH',
          date: '2026-01-07T12:00:00Z',
          createdAt: '2026-01-07T12:00:00Z'
        },
        {
          id: 'o3',
          items: [],
          total: 75,
          status: 'COMPLETED',
          type: 'DINE_IN',
          paymentMethod: 'CARD',
          date: '2026-01-07T14:00:00Z',
          createdAt: '2026-01-07T14:00:00Z'
        }
      ];

      const breakdown = calculatePaymentTypeBreakdown(orders, '2026-01-07');

      expect(breakdown.date).toBe('2026-01-07');
      expect(breakdown.cash.count).toBe(2);
      expect(breakdown.cash.amount).toBe(150);
      expect(breakdown.card.count).toBe(1);
      expect(breakdown.card.amount).toBe(75);
      expect(breakdown.total.count).toBe(3);
      expect(breakdown.total.amount).toBe(225);
    });
  });

  describe('calculateMonthlyExpenses', () => {
    it('devrait calculer dépenses mensuelles récurrentes', () => {
      const expenses: Expense[] = [
        {
          id: 'e1',
          label: 'Loyer',
          amount: 1200,
          type: 'FIXED',
          category: 'RENT',
          date: '2026-01-01',
          frequency: 'MONTHLY',
          isPaid: true,
          createdAt: '2026-01-01T00:00:00Z'
        },
        {
          id: 'e2',
          label: 'Assurance',
          amount: 1200,
          type: 'FIXED',
          category: 'INSURANCE',
          date: '2026-01-01',
          frequency: 'YEARLY', // 1200 / 12 = 100/mois
          isPaid: true,
          createdAt: '2026-01-01T00:00:00Z'
        },
        {
          id: 'e3',
          label: 'Révision',
          amount: 900,
          type: 'VARIABLE',
          category: 'MAINTENANCE',
          date: '2026-01-01',
          frequency: 'QUARTERLY', // 900 / 3 = 300/mois
          isPaid: true,
          createdAt: '2026-01-01T00:00:00Z'
        },
        {
          id: 'e4',
          label: 'Réparation ponctuelle',
          amount: 500,
          type: 'VARIABLE',
          category: 'MAINTENANCE',
          date: '2026-01-01',
          frequency: 'ONE_TIME', // Pas compté
          isPaid: true,
          createdAt: '2026-01-01T00:00:00Z'
        }
      ];

      const monthly = calculateMonthlyExpenses(expenses);

      // 1200 + 100 + 300 = 1600
      expect(monthly).toBe(1600);
    });
  });
});
