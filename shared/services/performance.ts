/**
 * Performance Optimization Service
 * 
 * Optimisations critiques pour production:
 * 1. Indexation JSONB Supabase
 * 2. Pré-agrégation daily_stats
 * 3. Partitioning données par mois
 * 4. Cache queries fréquentes
 * 5. Lazy loading données volumineuses
 */

import type { AppState, Order, Expense, Product, Ingredient } from '../types';

/**
 * Configuration cache queries
 */
interface CacheConfig {
  ttl: number; // Time to live en ms
  maxSize: number; // Nombre max d'entrées
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

/**
 * Cache simple en mémoire pour queries fréquentes
 */
class QueryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig = { ttl: 5 * 60 * 1000, maxSize: 100 }) {
    this.config = config;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    // Éviction LRU si cache plein
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(pattern: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

export const queryCache = new QueryCache();

/**
 * Daily Stats - Pré-agrégation pour dashboard
 */
export interface DailyStats {
  date: string; // YYYY-MM-DD
  companyId: string;
  
  // Ventes
  totalSales: number;
  orderCount: number;
  averageTicket: number;
  salesByPaymentMethod: {
    cash: number;
    card: number;
    other: number;
  };
  salesByType: {
    dineIn: number;
    takeaway: number;
  };
  
  // Top produits
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  
  // Coûts
  materialCost: number;
  expenses: number;
  
  // Marges
  grossMargin: number;
  grossMarginRate: number;
  
  // Métadonnées
  calculatedAt: string;
  version: string;
}

/**
 * Calculer daily stats pour une date
 */
export const calculateDailyStats = (
  date: string,
  companyId: string,
  orders: Order[],
  expenses: Expense[],
  products: Product[],
  ingredients: Ingredient[]
): DailyStats => {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  // Filtrer commandes du jour
  const dayOrders = orders.filter(o => {
    const orderDate = new Date(o.date);
    return o.status === 'COMPLETED' && orderDate >= startDate && orderDate <= endDate;
  });

  // Calculer ventes
  const totalSales = dayOrders.reduce((sum, o) => sum + o.total, 0);
  const orderCount = dayOrders.length;
  const averageTicket = orderCount > 0 ? totalSales / orderCount : 0;

  // Ventes par moyen paiement
  const salesByPaymentMethod = {
    cash: dayOrders.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.total, 0),
    card: dayOrders.filter(o => o.paymentMethod === 'CARD').reduce((sum, o) => sum + o.total, 0),
    other: dayOrders.filter(o => o.paymentMethod === 'OTHER').reduce((sum, o) => sum + o.total, 0),
  };

  // Ventes par type
  const salesByType = {
    dineIn: dayOrders.filter(o => o.type === 'DINE_IN').reduce((sum, o) => sum + o.total, 0),
    takeaway: dayOrders.filter(o => o.type === 'TAKEAWAY').reduce((sum, o) => sum + o.total, 0),
  };

  // Top produits
  const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
  dayOrders.forEach(order => {
    order.items.forEach(item => {
      const existing = productSales.get(item.productId) || { name: item.name, quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.price * item.quantity;
      productSales.set(item.productId, existing);
    });
  });

  const topProducts = Array.from(productSales.entries())
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      quantity: data.quantity,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Calculer coût matière
  let materialCost = 0;
  dayOrders.forEach(order => {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product?.recipe) {
        product.recipe.forEach(recipeItem => {
          const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId);
          if (ingredient) {
            materialCost += ingredient.averageCost * recipeItem.quantity * item.quantity;
          }
        });
      }
    });
  });

  // Charges du jour
  const dayExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.date);
    return expenseDate >= startDate && expenseDate <= endDate;
  });
  const totalExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Marges
  const grossMargin = totalSales - materialCost;
  const grossMarginRate = totalSales > 0 ? (grossMargin / totalSales) * 100 : 0;

  return {
    date,
    companyId,
    totalSales,
    orderCount,
    averageTicket,
    salesByPaymentMethod,
    salesByType,
    topProducts,
    materialCost,
    expenses: totalExpenses,
    grossMargin,
    grossMarginRate,
    calculatedAt: new Date().toISOString(),
    version: '1.0',
  };
};

/**
 * Générer daily stats pour période
 */
export const generateDailyStatsForPeriod = (
  startDate: string,
  endDate: string,
  companyId: string,
  state: AppState
): DailyStats[] => {
  const stats: DailyStats[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayStat = calculateDailyStats(
      dateStr,
      companyId,
      state.orders,
      state.expenses,
      state.products,
      state.ingredients
    );
    stats.push(dayStat);
  }

  return stats;
};

/**
 * Partitioning - Séparer données par mois
 */
export interface MonthPartition {
  month: string; // YYYY-MM
  companyId: string;
  orders: Order[];
  expenses: Expense[];
  stats: DailyStats[];
}

/**
 * Créer partition mensuelle
 */
export const createMonthPartition = (
  month: string, // YYYY-MM
  companyId: string,
  state: AppState
): MonthPartition => {
  const [year, monthNum] = month.split('-').map(Number);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

  // Filtrer données du mois
  const monthOrders = state.orders.filter(o => {
    const orderDate = new Date(o.date);
    return orderDate >= startDate && orderDate <= endDate;
  });

  const monthExpenses = state.expenses.filter(e => {
    const expenseDate = new Date(e.date);
    return expenseDate >= startDate && expenseDate <= endDate;
  });

  // Générer daily stats
  const stats = generateDailyStatsForPeriod(
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0],
    companyId,
    state
  );

  return {
    month,
    companyId,
    orders: monthOrders,
    expenses: monthExpenses,
    stats,
  };
};

/**
 * Lazy loading - Charger données par chunks
 */
export interface DataChunk<T> {
  data: T[];
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/**
 * Charger chunk de données
 */
export const loadDataChunk = <T>(
  data: T[],
  offset: number,
  limit: number
): DataChunk<T> => {
  const chunk = data.slice(offset, offset + limit);
  return {
    data: chunk,
    offset,
    limit,
    total: data.length,
    hasMore: offset + limit < data.length,
  };
};

/**
 * Optimisation queries - Indexes recommandés pour Supabase
 */
export const RECOMMENDED_INDEXES = {
  // Index JSONB pour app_state
  orders_by_date: `
    CREATE INDEX IF NOT EXISTS idx_orders_date 
    ON app_state USING GIN ((data->'orders'));
  `,
  orders_by_status: `
    CREATE INDEX IF NOT EXISTS idx_orders_status 
    ON app_state USING GIN ((data->'orders'));
  `,
  expenses_by_date: `
    CREATE INDEX IF NOT EXISTS idx_expenses_date 
    ON app_state USING GIN ((data->'expenses'));
  `,
  products_by_category: `
    CREATE INDEX IF NOT EXISTS idx_products_category 
    ON app_state USING GIN ((data->'products'));
  `,
  
  // Index company_id pour multi-tenant
  company_id: `
    CREATE INDEX IF NOT EXISTS idx_company_id 
    ON app_state (company_id);
  `,
  
  // Index version pour optimistic locking
  version: `
    CREATE INDEX IF NOT EXISTS idx_version 
    ON app_state (version);
  `,
};

/**
 * Métriques performance
 */
export interface PerformanceMetrics {
  queryTime: number; // ms
  dataSize: number; // bytes
  cacheHit: boolean;
  timestamp: string;
}

const performanceMetrics: PerformanceMetrics[] = [];

/**
 * Mesurer performance query
 */
export const measureQueryPerformance = async <T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<{ result: T; metrics: PerformanceMetrics }> => {
  const startTime = performance.now();
  const cacheKey = `query_${queryName}`;
  
  // Vérifier cache
  const cached = queryCache.get<T>(cacheKey);
  if (cached) {
    const metrics: PerformanceMetrics = {
      queryTime: performance.now() - startTime,
      dataSize: JSON.stringify(cached).length,
      cacheHit: true,
      timestamp: new Date().toISOString(),
    };
    performanceMetrics.push(metrics);
    return { result: cached, metrics };
  }

  // Exécuter query
  const result = await queryFn();
  const endTime = performance.now();

  // Mettre en cache
  queryCache.set(cacheKey, result);

  const metrics: PerformanceMetrics = {
    queryTime: endTime - startTime,
    dataSize: JSON.stringify(result).length,
    cacheHit: false,
    timestamp: new Date().toISOString(),
  };
  performanceMetrics.push(metrics);

  return { result, metrics };
};

/**
 * Obtenir statistiques performance
 */
export const getPerformanceStats = (): {
  averageQueryTime: number;
  cacheHitRate: number;
  totalQueries: number;
} => {
  if (performanceMetrics.length === 0) {
    return { averageQueryTime: 0, cacheHitRate: 0, totalQueries: 0 };
  }

  const totalQueryTime = performanceMetrics.reduce((sum, m) => sum + m.queryTime, 0);
  const cacheHits = performanceMetrics.filter(m => m.cacheHit).length;

  return {
    averageQueryTime: totalQueryTime / performanceMetrics.length,
    cacheHitRate: (cacheHits / performanceMetrics.length) * 100,
    totalQueries: performanceMetrics.length,
  };
};

/**
 * Optimiser AppState pour performance
 */
export const optimizeAppState = (state: AppState): AppState => {
  // Trier par date décroissante (plus récent en premier)
  const sortedOrders = [...state.orders].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const sortedExpenses = [...state.expenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Limiter historique (garder 6 mois)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recentOrders = sortedOrders.filter(o => 
    new Date(o.date) >= sixMonthsAgo
  );

  const recentExpenses = sortedExpenses.filter(e => 
    new Date(e.date) >= sixMonthsAgo
  );

  return {
    ...state,
    orders: recentOrders,
    expenses: recentExpenses,
  };
};
