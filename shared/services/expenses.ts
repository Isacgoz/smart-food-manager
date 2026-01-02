import { Expense, ExpenseCategory, Order, Product, Ingredient, EBECalculation } from '../types';
import { calculateProductCost } from './business';
import { logger } from './logger';

/**
 * Calculer coût matière total pour une période
 */
export const calculateMaterialCost = (
  orders: Order[],
  products: Product[],
  ingredients: Ingredient[]
): number => {
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');

  let totalMaterialCost = 0;

  completedOrders.forEach(order => {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;

      const cost = calculateProductCost(product, ingredients);
      totalMaterialCost += cost * item.quantity;
    });
  });

  return totalMaterialCost;
};

/**
 * Agréger dépenses par catégorie/type pour période
 */
export const aggregateExpenses = (
  expenses: Expense[],
  startDate?: string,
  endDate?: string
): {
  totalExpenses: number;
  fixed: number;
  variable: number;
  byCategory: Record<ExpenseCategory, number>;
} => {
  const filtered = getExpensesByPeriod(expenses, startDate, endDate);

  const aggregation = {
    totalExpenses: 0,
    fixed: 0,
    variable: 0,
    byCategory: {} as Record<ExpenseCategory, number>
  };

  // Initialiser catégories à 0
  const categories: ExpenseCategory[] = [
    'RENT', 'SALARIES', 'ELECTRICITY', 'WATER', 'GAS', 'INTERNET',
    'INSURANCE', 'MAINTENANCE', 'MARKETING', 'ACCOUNTING', 'BANK_FEES',
    'WASTE_MANAGEMENT', 'CLEANING', 'LICENSES', 'OTHER'
  ];
  categories.forEach(cat => aggregation.byCategory[cat] = 0);

  filtered.forEach(expense => {
    aggregation.totalExpenses += expense.amount;

    if (expense.type === 'FIXED') {
      aggregation.fixed += expense.amount;
    } else {
      aggregation.variable += expense.amount;
    }

    aggregation.byCategory[expense.category] += expense.amount;
  });

  return aggregation;
};

/**
 * Calculer EBE pour période donnée
 */
export const calculateEBE = (
  orders: Order[],
  expenses: Expense[],
  products: Product[],
  ingredients: Ingredient[],
  startDate: string,
  endDate: string
): EBECalculation => {
  // Filtrer commandes période
  const periodOrders = orders.filter(o =>
    o.status === 'COMPLETED' &&
    o.date >= startDate &&
    o.date <= endDate
  );

  // CA total et détail paiement
  const totalSales = periodOrders.reduce((sum, o) => sum + o.total, 0);
  const cashSales = periodOrders
    .filter(o => o.paymentMethod === 'CASH')
    .reduce((sum, o) => sum + o.total, 0);
  const cardSales = periodOrders
    .filter(o => o.paymentMethod === 'CARD')
    .reduce((sum, o) => sum + o.total, 0);

  // Coût matière
  const materialCost = calculateMaterialCost(periodOrders, products, ingredients);

  // Charges
  const expenseAgg = aggregateExpenses(expenses, startDate, endDate);

  // Calculs
  const grossMargin = totalSales - materialCost;
  const grossMarginRate = totalSales > 0 ? (grossMargin / totalSales) * 100 : 0;
  const ebe = grossMargin - expenseAgg.totalExpenses;
  const ebeRate = totalSales > 0 ? (ebe / totalSales) * 100 : 0;

  logger.info('Calcul EBE effectué', {
    period: { startDate, endDate },
    totalSales,
    materialCost,
    expenses: expenseAgg.totalExpenses,
    ebe
  });

  return {
    period: {
      start: startDate,
      end: endDate
    },
    revenue: {
      totalSales,
      cash: cashSales,
      card: cardSales
    },
    expenses: {
      totalExpenses: expenseAgg.totalExpenses,
      fixed: expenseAgg.fixed,
      variable: expenseAgg.variable,
      byCategory: expenseAgg.byCategory
    },
    materialCost,
    grossMargin,
    grossMarginRate: Number(grossMarginRate.toFixed(2)),
    ebe,
    ebeRate: Number(ebeRate.toFixed(2)),
    isProfitable: ebe > 0
  };
};

/**
 * Filtrer dépenses par période
 */
export const getExpensesByPeriod = (
  expenses: Expense[],
  startDate?: string,
  endDate?: string
): Expense[] => {
  return expenses.filter(expense => {
    if (startDate && expense.date < startDate) return false;
    if (endDate && expense.date > endDate) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));
};

/**
 * Ajouter nouvelle dépense
 */
export const addExpense = (
  expenses: Expense[],
  expense: Omit<Expense, 'id' | 'createdAt'>
): Expense[] => {
  const newExpense: Expense = {
    ...expense,
    id: `expense-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  logger.audit('ADD_EXPENSE', 'EXPENSE', newExpense.id, {
    category: expense.category,
    amount: expense.amount,
    type: expense.type
  });

  return [...expenses, newExpense];
};

/**
 * Modifier dépense existante
 */
export const updateExpense = (
  expenses: Expense[],
  expenseId: string,
  updates: Partial<Expense>
): Expense[] => {
  const updated = expenses.map(exp =>
    exp.id === expenseId ? { ...exp, ...updates } : exp
  );

  logger.audit('UPDATE_EXPENSE', 'EXPENSE', expenseId, { updates });

  return updated;
};

/**
 * Supprimer dépense
 */
export const deleteExpense = (
  expenses: Expense[],
  expenseId: string
): Expense[] => {
  const expense = expenses.find(e => e.id === expenseId);

  logger.audit('DELETE_EXPENSE', 'EXPENSE', expenseId, {
    deletedExpense: expense
  });

  return expenses.filter(exp => exp.id !== expenseId);
};

/**
 * Calculer CA par employé pour période
 */
export const calculateEmployeeRevenue = (
  orders: Order[],
  startDate?: string,
  endDate?: string
): { userId: string; revenue: number; orderCount: number }[] => {
  const filtered = orders.filter(o => {
    if (o.status !== 'COMPLETED') return false;
    if (startDate && o.date < startDate) return false;
    if (endDate && o.date > endDate) return false;
    return true;
  });

  const employeeMap = new Map<string, { revenue: number; orderCount: number }>();

  filtered.forEach(order => {
    // Utiliser paidByUserId si existe, sinon userId
    const employeeId = order.paidByUserId || order.userId;

    if (!employeeMap.has(employeeId)) {
      employeeMap.set(employeeId, { revenue: 0, orderCount: 0 });
    }

    const data = employeeMap.get(employeeId)!;
    data.revenue += order.total;
    data.orderCount += 1;
  });

  return Array.from(employeeMap.entries()).map(([userId, data]) => ({
    userId,
    revenue: data.revenue,
    orderCount: data.orderCount
  })).sort((a, b) => b.revenue - a.revenue);
};

/**
 * Calculer répartition paiements par jour
 */
export const calculatePaymentTypeBreakdown = (
  orders: Order[],
  date: string
): {
  date: string;
  cash: { count: number; amount: number };
  card: { count: number; amount: number };
  total: { count: number; amount: number };
} => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const dayOrders = orders.filter(o =>
    o.status === 'COMPLETED' &&
    new Date(o.date) >= dayStart &&
    new Date(o.date) <= dayEnd
  );

  const cashOrders = dayOrders.filter(o => o.paymentMethod === 'CASH');
  const cardOrders = dayOrders.filter(o => o.paymentMethod === 'CARD');

  const cashAmount = cashOrders.reduce((sum, o) => sum + o.total, 0);
  const cardAmount = cardOrders.reduce((sum, o) => sum + o.total, 0);

  return {
    date,
    cash: {
      count: cashOrders.length,
      amount: cashAmount
    },
    card: {
      count: cardOrders.length,
      amount: cardAmount
    },
    total: {
      count: dayOrders.length,
      amount: cashAmount + cardAmount
    }
  };
};

/**
 * Calculer dépenses mensuelles prévues (pour budget)
 */
export const calculateMonthlyExpenses = (expenses: Expense[]): number => {
  let monthlyTotal = 0;

  expenses.forEach(expense => {
    switch (expense.frequency) {
      case 'MONTHLY':
        monthlyTotal += expense.amount;
        break;
      case 'QUARTERLY':
        monthlyTotal += expense.amount / 3;
        break;
      case 'YEARLY':
        monthlyTotal += expense.amount / 12;
        break;
      case 'ONE_TIME':
        // Pas de récurrence
        break;
    }
  });

  return monthlyTotal;
};

/**
 * Export CSV dépenses
 */
export const exportExpensesCSV = (expenses: Expense[]): string => {
  let csv = 'Smart Food Manager - Export Dépenses\n\n';
  csv += 'Date,Catégorie,Libellé,Montant,Type,Fréquence,Payé,Date Paiement,Notes\n';

  expenses.forEach(exp => {
    csv += `${exp.date},${exp.category},${exp.label},${exp.amount},${exp.type},${exp.frequency},${exp.isPaid ? 'Oui' : 'Non'},${exp.paymentDate || ''},${exp.notes || ''}\n`;
  });

  return csv;
};
