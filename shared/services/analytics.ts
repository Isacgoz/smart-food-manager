import { Order, Product, Ingredient } from '../types';

export interface PeriodComparison {
  currentPeriod: {
    start: string;
    end: string;
    totalSales: number;
    orderCount: number;
    averageTicket: number;
  };
  previousPeriod: {
    start: string;
    end: string;
    totalSales: number;
    orderCount: number;
    averageTicket: number;
  };
  evolution: {
    salesGrowth: number; // %
    orderGrowth: number; // %
    ticketGrowth: number; // %
  };
}

export interface ABCProduct {
  productId: string;
  productName: string;
  totalRevenue: number;
  totalQuantity: number;
  contribution: number; // % CA total
  cumulativeContribution: number; // % cumulé
  category: 'A' | 'B' | 'C'; // A=80%, B=15%, C=5%
}

export interface TimeAnalysis {
  hour: number;
  orderCount: number;
  totalSales: number;
  averageTicket: number;
  peakHour: boolean;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  averagePrice: number;
  margin: number;
  marginRate: number; // %
}

/**
 * Comparer deux périodes
 */
export const comparePeriods = (
  allOrders: Order[],
  currentStart: Date,
  currentEnd: Date
): PeriodComparison => {
  // Période actuelle
  const currentOrders = allOrders.filter(o =>
    o.status === 'COMPLETED' &&
    new Date(o.date) >= currentStart &&
    new Date(o.date) <= currentEnd
  );

  const currentSales = currentOrders.reduce((sum, o) => sum + o.total, 0);
  const currentAvg = currentOrders.length > 0 ? currentSales / currentOrders.length : 0;

  // Période précédente (même durée)
  const durationMs = currentEnd.getTime() - currentStart.getTime();
  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);

  const previousOrders = allOrders.filter(o =>
    o.status === 'COMPLETED' &&
    new Date(o.date) >= previousStart &&
    new Date(o.date) <= previousEnd
  );

  const previousSales = previousOrders.reduce((sum, o) => sum + o.total, 0);
  const previousAvg = previousOrders.length > 0 ? previousSales / previousOrders.length : 0;

  // Calcul évolutions
  const salesGrowth = previousSales > 0
    ? ((currentSales - previousSales) / previousSales) * 100
    : 0;

  const orderGrowth = previousOrders.length > 0
    ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100
    : 0;

  const ticketGrowth = previousAvg > 0
    ? ((currentAvg - previousAvg) / previousAvg) * 100
    : 0;

  return {
    currentPeriod: {
      start: currentStart.toISOString(),
      end: currentEnd.toISOString(),
      totalSales: currentSales,
      orderCount: currentOrders.length,
      averageTicket: currentAvg
    },
    previousPeriod: {
      start: previousStart.toISOString(),
      end: previousEnd.toISOString(),
      totalSales: previousSales,
      orderCount: previousOrders.length,
      averageTicket: previousAvg
    },
    evolution: {
      salesGrowth: Number(salesGrowth.toFixed(2)),
      orderGrowth: Number(orderGrowth.toFixed(2)),
      ticketGrowth: Number(ticketGrowth.toFixed(2))
    }
  };
};

/**
 * Analyse ABC (Pareto)
 */
export const analyzeABCProducts = (
  orders: Order[],
  products: Product[]
): ABCProduct[] => {
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');

  // Calculer CA par produit
  const productRevenue: Record<string, { revenue: number; quantity: number; name: string }> = {};

  completedOrders.forEach(order => {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;

      if (!productRevenue[item.productId]) {
        productRevenue[item.productId] = {
          revenue: 0,
          quantity: 0,
          name: product.name
        };
      }

      productRevenue[item.productId].revenue += item.price * item.quantity;
      productRevenue[item.productId].quantity += item.quantity;
    });
  });

  // Trier par CA décroissant
  const sorted = Object.entries(productRevenue)
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      totalRevenue: data.revenue,
      totalQuantity: data.quantity
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Calculer contributions
  const totalRevenue = sorted.reduce((sum, p) => sum + p.totalRevenue, 0);
  let cumulative = 0;

  const abcProducts: ABCProduct[] = sorted.map(product => {
    const contribution = totalRevenue > 0 ? (product.totalRevenue / totalRevenue) * 100 : 0;
    cumulative += contribution;

    let category: 'A' | 'B' | 'C';
    if (cumulative <= 80) {
      category = 'A';
    } else if (cumulative <= 95) {
      category = 'B';
    } else {
      category = 'C';
    }

    return {
      ...product,
      contribution: Number(contribution.toFixed(2)),
      cumulativeContribution: Number(cumulative.toFixed(2)),
      category
    };
  });

  return abcProducts;
};

/**
 * Analyse temporelle (CA par heure)
 */
export const analyzeByTimeOfDay = (orders: Order[]): TimeAnalysis[] => {
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');

  const hourlyData: Record<number, { count: number; sales: number }> = {};

  // Initialiser 24h
  for (let h = 0; h < 24; h++) {
    hourlyData[h] = { count: 0, sales: 0 };
  }

  // Agréger par heure
  completedOrders.forEach(order => {
    const hour = new Date(order.date).getHours();
    hourlyData[hour].count += 1;
    hourlyData[hour].sales += order.total;
  });

  // Trouver pic
  const maxSales = Math.max(...Object.values(hourlyData).map(d => d.sales));

  const analysis: TimeAnalysis[] = Object.entries(hourlyData).map(([hour, data]) => ({
    hour: Number(hour),
    orderCount: data.count,
    totalSales: data.sales,
    averageTicket: data.count > 0 ? data.sales / data.count : 0,
    peakHour: data.sales === maxSales && maxSales > 0
  }));

  return analysis.sort((a, b) => a.hour - b.hour);
};

/**
 * Performance produits avec marges
 */
export const analyzeProductPerformance = (
  orders: Order[],
  products: Product[],
  ingredients: Ingredient[]
): ProductPerformance[] => {
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');

  const productData: Record<string, {
    name: string;
    quantity: number;
    revenue: number;
    cost: number;
  }> = {};

  completedOrders.forEach(order => {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;

      if (!productData[item.productId]) {
        productData[item.productId] = {
          name: product.name,
          quantity: 0,
          revenue: 0,
          cost: 0
        };
      }

      // Calcul coût matière
      let itemCost = 0;
      if (product.recipe) {
        product.recipe.forEach(recipeItem => {
          const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId);
          if (ingredient) {
            itemCost += ingredient.averageCost * recipeItem.quantity;
          }
        });
      }

      productData[item.productId].quantity += item.quantity;
      productData[item.productId].revenue += item.price * item.quantity;
      productData[item.productId].cost += itemCost * item.quantity;
    });
  });

  const performance: ProductPerformance[] = Object.entries(productData).map(([productId, data]) => {
    const margin = data.revenue - data.cost;
    const marginRate = data.revenue > 0 ? (margin / data.revenue) * 100 : 0;

    return {
      productId,
      productName: data.name,
      quantitySold: data.quantity,
      revenue: Number(data.revenue.toFixed(2)),
      averagePrice: data.quantity > 0 ? data.revenue / data.quantity : 0,
      margin: Number(margin.toFixed(2)),
      marginRate: Number(marginRate.toFixed(2))
    };
  }).sort((a, b) => b.revenue - a.revenue);

  return performance;
};

/**
 * Tendances hebdomadaires
 */
export const analyzeWeeklyTrend = (orders: Order[]): {
  dayOfWeek: string;
  orderCount: number;
  totalSales: number;
  averageTicket: number;
}[] => {
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');

  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const weeklyData: Record<number, { count: number; sales: number }> = {};

  for (let d = 0; d < 7; d++) {
    weeklyData[d] = { count: 0, sales: 0 };
  }

  completedOrders.forEach(order => {
    const dayOfWeek = new Date(order.date).getDay();
    weeklyData[dayOfWeek].count += 1;
    weeklyData[dayOfWeek].sales += order.total;
  });

  return Object.entries(weeklyData).map(([day, data]) => ({
    dayOfWeek: dayNames[Number(day)],
    orderCount: data.count,
    totalSales: data.sales,
    averageTicket: data.count > 0 ? data.sales / data.count : 0
  }));
};

/**
 * Export données pour CSV
 */
export const exportAnalyticsCSV = (analytics: {
  comparison?: PeriodComparison;
  abc?: ABCProduct[];
  timeAnalysis?: TimeAnalysis[];
  performance?: ProductPerformance[];
}): string => {
  let csv = 'Smart Food Manager - Rapport Analytique\n\n';

  // Comparaison périodes
  if (analytics.comparison) {
    const c = analytics.comparison;
    csv += 'Comparaison Périodes\n';
    csv += `Période,Début,Fin,CA,Commandes,Ticket Moyen\n`;
    csv += `Actuelle,${c.currentPeriod.start},${c.currentPeriod.end},${c.currentPeriod.totalSales.toFixed(2)},${c.currentPeriod.orderCount},${c.currentPeriod.averageTicket.toFixed(2)}\n`;
    csv += `Précédente,${c.previousPeriod.start},${c.previousPeriod.end},${c.previousPeriod.totalSales.toFixed(2)},${c.previousPeriod.orderCount},${c.previousPeriod.averageTicket.toFixed(2)}\n`;
    csv += `\nÉvolution,CA: ${c.evolution.salesGrowth}%,Commandes: ${c.evolution.orderGrowth}%,Ticket: ${c.evolution.ticketGrowth}%\n\n`;
  }

  // ABC
  if (analytics.abc) {
    csv += 'Analyse ABC (Pareto)\n';
    csv += 'Produit,CA,Quantité,Contribution %,Cumulé %,Catégorie\n';
    analytics.abc.forEach(p => {
      csv += `${p.productName},${p.totalRevenue.toFixed(2)},${p.totalQuantity},${p.contribution},${p.cumulativeContribution},${p.category}\n`;
    });
    csv += '\n';
  }

  return csv;
};
