/**
 * Service d'export CA3 (Déclaration de TVA)
 * Format pour la déclaration de TVA française
 */

import { Order, Expense } from '../types';

export interface CA3Data {
  period: {
    startDate: Date;
    endDate: Date;
    month: number;
    year: number;
  };
  sales: {
    vat055: { ht: number; tva: number; ttc: number };
    vat100: { ht: number; tva: number; ttc: number };
    vat200: { ht: number; tva: number; ttc: number };
    total: { ht: number; tva: number; ttc: number };
  };
  purchases: {
    vat055: { ht: number; tva: number; ttc: number };
    vat100: { ht: number; tva: number; ttc: number };
    vat200: { ht: number; tva: number; ttc: number };
    total: { ht: number; tva: number; ttc: number };
  };
  vatDue: number;           // TVA à payer (collectée - déductible)
  vatCollected: number;     // TVA collectée totale
  vatDeductible: number;    // TVA déductible totale
}

export interface CA3ExportOptions {
  startDate: Date;
  endDate: Date;
  restaurantId: string;
  restaurantName: string;
  siret?: string;
}

/**
 * Calcule les données CA3 à partir des commandes et dépenses
 */
export const calculateCA3Data = (
  orders: Order[],
  expenses: Expense[],
  options: CA3ExportOptions
): CA3Data => {
  // Initialiser les totaux
  const sales = {
    vat055: { ht: 0, tva: 0, ttc: 0 },
    vat100: { ht: 0, tva: 0, ttc: 0 },
    vat200: { ht: 0, tva: 0, ttc: 0 },
    total: { ht: 0, tva: 0, ttc: 0 }
  };

  const purchases = {
    vat055: { ht: 0, tva: 0, ttc: 0 },
    vat100: { ht: 0, tva: 0, ttc: 0 },
    vat200: { ht: 0, tva: 0, ttc: 0 },
    total: { ht: 0, tva: 0, ttc: 0 }
  };

  // Filtrer les commandes par période
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= options.startDate && orderDate <= options.endDate;
  });

  // Calculer les ventes par taux de TVA
  filteredOrders.forEach(order => {
    order.items.forEach(item => {
      const vatRate = item.vatRate || 20;
      const ttc = item.price * item.quantity;
      const ht = ttc / (1 + vatRate / 100);
      const tva = ttc - ht;

      // Arrondir à 2 décimales
      const htRounded = Math.round(ht * 100) / 100;
      const tvaRounded = Math.round(tva * 100) / 100;
      const ttcRounded = Math.round(ttc * 100) / 100;

      if (vatRate === 5.5) {
        sales.vat055.ht += htRounded;
        sales.vat055.tva += tvaRounded;
        sales.vat055.ttc += ttcRounded;
      } else if (vatRate === 10) {
        sales.vat100.ht += htRounded;
        sales.vat100.tva += tvaRounded;
        sales.vat100.ttc += ttcRounded;
      } else if (vatRate === 20) {
        sales.vat200.ht += htRounded;
        sales.vat200.tva += tvaRounded;
        sales.vat200.ttc += ttcRounded;
      }

      sales.total.ht += htRounded;
      sales.total.tva += tvaRounded;
      sales.total.ttc += ttcRounded;
    });
  });

  // Filtrer les dépenses par période
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= options.startDate && expenseDate <= options.endDate;
  });

  // Calculer les achats par taux de TVA
  filteredExpenses.forEach(expense => {
    const vatRate = expense.vatRate || 20;
    const ttc = expense.amount;
    const ht = ttc / (1 + vatRate / 100);
    const tva = ttc - ht;

    // Arrondir à 2 décimales
    const htRounded = Math.round(ht * 100) / 100;
    const tvaRounded = Math.round(tva * 100) / 100;
    const ttcRounded = Math.round(ttc * 100) / 100;

    if (vatRate === 5.5) {
      purchases.vat055.ht += htRounded;
      purchases.vat055.tva += tvaRounded;
      purchases.vat055.ttc += ttcRounded;
    } else if (vatRate === 10) {
      purchases.vat100.ht += htRounded;
      purchases.vat100.tva += tvaRounded;
      purchases.vat100.ttc += ttcRounded;
    } else if (vatRate === 20) {
      purchases.vat200.ht += htRounded;
      purchases.vat200.tva += tvaRounded;
      purchases.vat200.ttc += ttcRounded;
    }

    purchases.total.ht += htRounded;
    purchases.total.tva += tvaRounded;
    purchases.total.ttc += ttcRounded;
  });

  // Arrondir les totaux finaux
  sales.total.ht = Math.round(sales.total.ht * 100) / 100;
  sales.total.tva = Math.round(sales.total.tva * 100) / 100;
  sales.total.ttc = Math.round(sales.total.ttc * 100) / 100;

  purchases.total.ht = Math.round(purchases.total.ht * 100) / 100;
  purchases.total.tva = Math.round(purchases.total.tva * 100) / 100;
  purchases.total.ttc = Math.round(purchases.total.ttc * 100) / 100;

  const vatCollected = sales.total.tva;
  const vatDeductible = purchases.total.tva;
  const vatDue = Math.round((vatCollected - vatDeductible) * 100) / 100;

  return {
    period: {
      startDate: options.startDate,
      endDate: options.endDate,
      month: options.startDate.getMonth() + 1,
      year: options.startDate.getFullYear()
    },
    sales,
    purchases,
    vatDue,
    vatCollected,
    vatDeductible
  };
};

/**
 * Génère un export CSV pour la CA3
 */
export const generateCA3CSV = (data: CA3Data, options: CA3ExportOptions): string => {
  const lines: string[] = [];

  // En-tête
  lines.push('DÉCLARATION DE TVA CA3');
  lines.push('');
  lines.push(`Établissement: ${options.restaurantName}`);
  if (options.siret) {
    lines.push(`SIRET: ${options.siret}`);
  }
  lines.push(`Période: ${formatDate(data.period.startDate)} au ${formatDate(data.period.endDate)}`);
  lines.push(`Mois: ${data.period.month}/${data.period.year}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // VENTES (TVA collectée)
  lines.push('VENTES - TVA COLLECTÉE');
  lines.push('');
  lines.push('Taux;Base HT;TVA;Total TTC');
  lines.push(`5,5%;${formatAmount(data.sales.vat055.ht)};${formatAmount(data.sales.vat055.tva)};${formatAmount(data.sales.vat055.ttc)}`);
  lines.push(`10%;${formatAmount(data.sales.vat100.ht)};${formatAmount(data.sales.vat100.tva)};${formatAmount(data.sales.vat100.ttc)}`);
  lines.push(`20%;${formatAmount(data.sales.vat200.ht)};${formatAmount(data.sales.vat200.tva)};${formatAmount(data.sales.vat200.ttc)}`);
  lines.push(`TOTAL;${formatAmount(data.sales.total.ht)};${formatAmount(data.sales.total.tva)};${formatAmount(data.sales.total.ttc)}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // ACHATS (TVA déductible)
  lines.push('ACHATS - TVA DÉDUCTIBLE');
  lines.push('');
  lines.push('Taux;Base HT;TVA;Total TTC');
  lines.push(`5,5%;${formatAmount(data.purchases.vat055.ht)};${formatAmount(data.purchases.vat055.tva)};${formatAmount(data.purchases.vat055.ttc)}`);
  lines.push(`10%;${formatAmount(data.purchases.vat100.ht)};${formatAmount(data.purchases.vat100.tva)};${formatAmount(data.purchases.vat100.ttc)}`);
  lines.push(`20%;${formatAmount(data.purchases.vat200.ht)};${formatAmount(data.purchases.vat200.tva)};${formatAmount(data.purchases.vat200.ttc)}`);
  lines.push(`TOTAL;${formatAmount(data.purchases.total.ht)};${formatAmount(data.purchases.total.tva)};${formatAmount(data.purchases.total.ttc)}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // RÉCAPITULATIF
  lines.push('RÉCAPITULATIF TVA');
  lines.push('');
  lines.push(`TVA collectée (ventes);${formatAmount(data.vatCollected)}`);
  lines.push(`TVA déductible (achats);${formatAmount(data.vatDeductible)}`);
  lines.push(`TVA à payer;${formatAmount(data.vatDue)}`);
  lines.push('');

  if (data.vatDue < 0) {
    lines.push(`Note: Crédit de TVA de ${formatAmount(Math.abs(data.vatDue))} €`);
  }

  return lines.join('\n');
};

/**
 * Génère un export JSON pour la CA3
 */
export const generateCA3JSON = (data: CA3Data, options: CA3ExportOptions): string => {
  const exportData = {
    restaurant: {
      name: options.restaurantName,
      siret: options.siret || 'N/A',
      restaurantId: options.restaurantId
    },
    period: {
      startDate: data.period.startDate.toISOString(),
      endDate: data.period.endDate.toISOString(),
      month: data.period.month,
      year: data.period.year
    },
    sales: data.sales,
    purchases: data.purchases,
    summary: {
      vatCollected: data.vatCollected,
      vatDeductible: data.vatDeductible,
      vatDue: data.vatDue
    },
    generatedAt: new Date().toISOString()
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Formate un montant pour l'affichage
 */
const formatAmount = (amount: number): string => {
  return amount.toFixed(2).replace('.', ',');
};

/**
 * Formate une date pour l'affichage
 */
const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Télécharge le fichier CA3 CSV
 */
export const downloadCA3CSV = (csv: string, options: CA3ExportOptions): void => {
  const month = String(options.startDate.getMonth() + 1).padStart(2, '0');
  const year = options.startDate.getFullYear();
  const filename = `CA3_${year}${month}_${options.restaurantName.replace(/\s+/g, '_')}.csv`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Télécharge le fichier CA3 JSON
 */
export const downloadCA3JSON = (json: string, options: CA3ExportOptions): void => {
  const month = String(options.startDate.getMonth() + 1).padStart(2, '0');
  const year = options.startDate.getFullYear();
  const filename = `CA3_${year}${month}_${options.restaurantName.replace(/\s+/g, '_')}.json`;

  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Génère un export CA3 complet
 */
export const generateCA3Export = async (
  orders: Order[],
  expenses: Expense[],
  options: CA3ExportOptions,
  format: 'csv' | 'json' = 'csv'
): Promise<string> => {
  const data = calculateCA3Data(orders, expenses, options);
  
  if (format === 'json') {
    return generateCA3JSON(data, options);
  }
  
  return generateCA3CSV(data, options);
};
