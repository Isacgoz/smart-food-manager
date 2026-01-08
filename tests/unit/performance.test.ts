/**
 * Tests Performance Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  queryCache,
  calculateDailyStats,
  generateDailyStatsForPeriod,
  createMonthPartition,
  loadDataChunk,
  measureQueryPerformance,
  getPerformanceStats,
  optimizeAppState,
  type DailyStats,
  type MonthPartition,
  type DataChunk,
} from '../../shared/services/performance';
import type { AppState, Order, Expense, Product, Ingredient } from '../../shared/types';

// Mock data
const mockIngredients: Ingredient[] = [
  {
    id: 'ing1',
    name: 'Pain burger',
    unit: 'pièce',
    stock: 50,
    minStock: 10,
    averageCost: 0.35,
    supplier: 'Boulangerie',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'ing2',
    name: 'Steak haché',
    unit: 'kg',
    stock: 5,
    minStock: 2,
    averageCost: 8.50,
    supplier: 'Boucherie',
    lastUpdated: new Date().toISOString(),
  },
];

const mockProducts: Product[] = [
  {
    id: 'prod1',
    name: 'Burger Classique',
    category: 'Burgers',
    price: 9.90,
    vatRate: 10,
    recipe: [
      { ingredientId: 'ing1', quantity: 1 },
      { ingredientId: 'ing2', quantity: 0.150 },
    ],
  },
  {
    id: 'prod2',
    name: 'Frites',
    category: 'Accompagnements',
    price: 3.50,
    vatRate: 10,
    recipe: [],
  },
];

const mockOrders: Order[] = [
  {
    id: 'order1',
    date: '2026-01-08T12:00:00Z',
    status: 'COMPLETED',
    type: 'DINE_IN',
    paymentMethod: 'CASH',
    total: 13.40,
    items: [
      { productId: 'prod1', name: 'Burger Classique', quantity: 1, price: 9.90 },
      { productId: 'prod2', name: 'Frites', quantity: 1, price: 3.50 },
    ],
    userId: 'user1',
    tableNumber: 5,
  },
  {
    id: 'order2',
    date: '2026-01-08T14:30:00Z',
    status: 'COMPLETED',
    type: 'TAKEAWAY',
    paymentMethod: 'CARD',
    total: 9.90,
    items: [
      { productId: 'prod1', name: 'Burger Classique', quantity: 1, price: 9.90 },
    ],
    userId: 'user1',
  },
];

const mockExpenses: Expense[] = [
  {
    id: 'exp1',
    date: '2026-01-08T10:00:00Z',
    category: 'RENT',
    amount: 1500,
    description: 'Loyer janvier',
    supplier: 'Propriétaire',
    isPaid: true,
    isRecurring: true,
  },
];

const mockState: AppState = {
  users: [],
  ingredients: mockIngredients,
  products: mockProducts,
  orders: mockOrders,
  expenses: mockExpenses,
  tables: [],
  suppliers: [],
  _lastUpdatedAt: Date.now(),
  _version: 1,
};

describe('Performance - Query Cache', () => {
  beforeEach(() => {
    queryCache.clear();
  });

  it('devrait stocker et récupérer données du cache', () => {
    const testData = { value: 'test' };
    queryCache.set('test-key', testData);

    const cached = queryCache.get('test-key');
    expect(cached).toEqual(testData);
  });

  it('devrait retourner null si clé inexistante', () => {
    const cached = queryCache.get('non-existent');
    expect(cached).toBeNull();
  });

  it('devrait expirer données après TTL', () => {
    const cache = new (queryCache.constructor as any)({ ttl: 100, maxSize: 10 });
    cache.set('test', { value: 'test' });

    // Immédiatement disponible
    expect(cache.get('test')).toBeTruthy();

    // Après TTL
    vi.useFakeTimers();
    vi.advanceTimersByTime(150);
    expect(cache.get('test')).toBeNull();
    vi.useRealTimers();
  });

  it('devrait invalider cache par pattern', () => {
    queryCache.set('orders_2026-01', []);
    queryCache.set('orders_2026-02', []);
    queryCache.set('expenses_2026-01', []);

    queryCache.invalidate('orders');

    expect(queryCache.get('orders_2026-01')).toBeNull();
    expect(queryCache.get('orders_2026-02')).toBeNull();
    expect(queryCache.get('expenses_2026-01')).toBeTruthy();
  });

  it('devrait éviter dépassement maxSize (LRU)', () => {
    const cache = new (queryCache.constructor as any)({ ttl: 60000, maxSize: 3 });
    
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4'); // Doit évincer key1

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeTruthy();
    expect(cache.get('key3')).toBeTruthy();
    expect(cache.get('key4')).toBeTruthy();
  });
});

describe('Performance - Daily Stats', () => {
  it('devrait calculer daily stats correctement', () => {
    const stats = calculateDailyStats(
      '2026-01-08',
      'company1',
      mockOrders,
      mockExpenses,
      mockProducts,
      mockIngredients
    );

    expect(stats.date).toBe('2026-01-08');
    expect(stats.companyId).toBe('company1');
    expect(stats.totalSales).toBe(23.30); // 13.40 + 9.90
    expect(stats.orderCount).toBe(2);
    expect(stats.averageTicket).toBeCloseTo(11.65, 2);
  });

  it('devrait calculer ventes par moyen paiement', () => {
    const stats = calculateDailyStats(
      '2026-01-08',
      'company1',
      mockOrders,
      mockExpenses,
      mockProducts,
      mockIngredients
    );

    expect(stats.salesByPaymentMethod.cash).toBe(13.40);
    expect(stats.salesByPaymentMethod.card).toBe(9.90);
    expect(stats.salesByPaymentMethod.other).toBe(0);
  });

  it('devrait calculer ventes par type', () => {
    const stats = calculateDailyStats(
      '2026-01-08',
      'company1',
      mockOrders,
      mockExpenses,
      mockProducts,
      mockIngredients
    );

    expect(stats.salesByType.dineIn).toBe(13.40);
    expect(stats.salesByType.takeaway).toBe(9.90);
  });

  it('devrait identifier top produits', () => {
    const stats = calculateDailyStats(
      '2026-01-08',
      'company1',
      mockOrders,
      mockExpenses,
      mockProducts,
      mockIngredients
    );

    expect(stats.topProducts).toHaveLength(2);
    expect(stats.topProducts[0].productName).toBe('Burger Classique');
    expect(stats.topProducts[0].quantity).toBe(2);
    expect(stats.topProducts[0].revenue).toBe(19.80);
  });

  it('devrait calculer coût matière', () => {
    const stats = calculateDailyStats(
      '2026-01-08',
      'company1',
      mockOrders,
      mockExpenses,
      mockProducts,
      mockIngredients
    );

    // 2 burgers: 2 × (0.35 + 0.150 × 8.50) = 2 × 1.625 = 3.25
    expect(stats.materialCost).toBeCloseTo(3.25, 2);
  });

  it('devrait calculer marge brute', () => {
    const stats = calculateDailyStats(
      '2026-01-08',
      'company1',
      mockOrders,
      mockExpenses,
      mockProducts,
      mockIngredients
    );

    // Marge = 23.30 - 3.25 = 20.05
    expect(stats.grossMargin).toBeCloseTo(20.05, 2);
    expect(stats.grossMarginRate).toBeCloseTo(86.05, 1);
  });

  it('devrait retourner 0 si aucune commande', () => {
    const stats = calculateDailyStats(
      '2026-01-09',
      'company1',
      mockOrders,
      mockExpenses,
      mockProducts,
      mockIngredients
    );

    expect(stats.totalSales).toBe(0);
    expect(stats.orderCount).toBe(0);
    expect(stats.averageTicket).toBe(0);
  });
});

describe('Performance - Period Stats', () => {
  it('devrait générer stats pour période', () => {
    const stats = generateDailyStatsForPeriod(
      '2026-01-08',
      '2026-01-10',
      'company1',
      mockState
    );

    expect(stats).toHaveLength(3); // 8, 9, 10 janvier
    expect(stats[0].date).toBe('2026-01-08');
    expect(stats[1].date).toBe('2026-01-09');
    expect(stats[2].date).toBe('2026-01-10');
  });

  it('devrait gérer période 1 jour', () => {
    const stats = generateDailyStatsForPeriod(
      '2026-01-08',
      '2026-01-08',
      'company1',
      mockState
    );

    expect(stats).toHaveLength(1);
  });
});

describe('Performance - Month Partition', () => {
  it('devrait créer partition mensuelle', () => {
    const partition = createMonthPartition('2026-01', 'company1', mockState);

    expect(partition.month).toBe('2026-01');
    expect(partition.companyId).toBe('company1');
    expect(partition.orders).toHaveLength(2);
    expect(partition.expenses).toHaveLength(1);
    expect(partition.stats.length).toBeGreaterThan(0);
  });

  it('devrait filtrer données hors mois', () => {
    const ordersWithOldData: Order[] = [
      ...mockOrders,
      {
        id: 'old-order',
        date: '2025-12-15T12:00:00Z',
        status: 'COMPLETED',
        type: 'DINE_IN',
        paymentMethod: 'CASH',
        total: 10,
        items: [],
        userId: 'user1',
      },
    ];

    const stateWithOldData = { ...mockState, orders: ordersWithOldData };
    const partition = createMonthPartition('2026-01', 'company1', stateWithOldData);

    expect(partition.orders).toHaveLength(2); // Seulement janvier 2026
  });
});

describe('Performance - Data Chunking', () => {
  it('devrait charger chunk de données', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const chunk = loadDataChunk(data, 0, 20);

    expect(chunk.data).toHaveLength(20);
    expect(chunk.offset).toBe(0);
    expect(chunk.limit).toBe(20);
    expect(chunk.total).toBe(100);
    expect(chunk.hasMore).toBe(true);
  });

  it('devrait indiquer hasMore=false sur dernier chunk', () => {
    const data = Array.from({ length: 25 }, (_, i) => ({ id: i }));
    const chunk = loadDataChunk(data, 20, 10);

    expect(chunk.data).toHaveLength(5);
    expect(chunk.hasMore).toBe(false);
  });

  it('devrait gérer offset > total', () => {
    const data = Array.from({ length: 10 }, (_, i) => ({ id: i }));
    const chunk = loadDataChunk(data, 20, 10);

    expect(chunk.data).toHaveLength(0);
    expect(chunk.hasMore).toBe(false);
  });
});

describe('Performance - Query Measurement', () => {
  beforeEach(() => {
    queryCache.clear();
  });

  it('devrait mesurer temps query', async () => {
    const queryFn = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { data: 'test' };
    };

    const { result, metrics } = await measureQueryPerformance('test-query', queryFn);

    expect(result.data).toBe('test');
    expect(metrics.queryTime).toBeGreaterThan(0);
    expect(metrics.cacheHit).toBe(false);
  });

  it('devrait utiliser cache sur 2ème appel', async () => {
    const queryFn = async () => ({ data: 'test' });

    // Premier appel
    const first = await measureQueryPerformance('cached-query', queryFn);
    expect(first.metrics.cacheHit).toBe(false);

    // Deuxième appel
    const second = await measureQueryPerformance('cached-query', queryFn);
    expect(second.metrics.cacheHit).toBe(true);
    expect(second.metrics.queryTime).toBeLessThan(first.metrics.queryTime);
  });

  it('devrait calculer stats performance', async () => {
    const queryFn = async () => ({ data: 'test' });

    await measureQueryPerformance('q1', queryFn);
    await measureQueryPerformance('q1', queryFn); // Cache hit
    await measureQueryPerformance('q2', queryFn);

    const stats = getPerformanceStats();

    expect(stats.totalQueries).toBeGreaterThanOrEqual(3);
    expect(stats.cacheHitRate).toBeGreaterThan(0);
    expect(stats.averageQueryTime).toBeGreaterThan(0);
  });
});

describe('Performance - AppState Optimization', () => {
  it('devrait trier orders par date décroissante', () => {
    const unsortedOrders: Order[] = [
      { ...mockOrders[0], date: '2026-01-05T12:00:00Z' },
      { ...mockOrders[1], date: '2026-01-10T12:00:00Z' },
      { ...mockOrders[0], date: '2026-01-01T12:00:00Z' },
    ];

    const state = { ...mockState, orders: unsortedOrders };
    const optimized = optimizeAppState(state);

    expect(optimized.orders[0].date).toBe('2026-01-10T12:00:00Z');
    expect(optimized.orders[1].date).toBe('2026-01-05T12:00:00Z');
    expect(optimized.orders[2].date).toBe('2026-01-01T12:00:00Z');
  });

  it('devrait limiter historique à 6 mois', () => {
    const now = new Date();
    const sevenMonthsAgo = new Date(now);
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

    const oldOrders: Order[] = [
      { ...mockOrders[0], date: sevenMonthsAgo.toISOString() },
      { ...mockOrders[1], date: now.toISOString() },
    ];

    const state = { ...mockState, orders: oldOrders };
    const optimized = optimizeAppState(state);

    expect(optimized.orders).toHaveLength(1);
    expect(optimized.orders[0].date).toBe(now.toISOString());
  });

  it('devrait optimiser expenses également', () => {
    const now = new Date();
    const eightMonthsAgo = new Date(now);
    eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);

    const oldExpenses: Expense[] = [
      { ...mockExpenses[0], date: eightMonthsAgo.toISOString() },
      { ...mockExpenses[0], date: now.toISOString() },
    ];

    const state = { ...mockState, expenses: oldExpenses };
    const optimized = optimizeAppState(state);

    expect(optimized.expenses).toHaveLength(1);
  });
});
