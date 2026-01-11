/**
 * Service d'export des charges/dépenses
 * Format compatible avec les logiciels comptables (Sage, QuickBooks, etc.)
 */

import { Expense } from '../types';

export interface ExpenseExportOptions {
  startDate: Date;
  endDate: Date;
  restaurantId: string;
  restaurantName: string;
  categories?: string[];
  format?: 'csv' | 'json' | 'excel';
}

export interface ExpenseSummary {
  category: string;
  count: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  averageAmount: number;
}

/**
 * Filtre les dépenses selon les options
 */
export const filterExpenses = (
  expenses: Expense[],
  options: ExpenseExportOptions
): Expense[] => {
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const inDateRange = expenseDate >= options.startDate && expenseDate <= options.endDate;
    const inCategories = !options.categories || options.categories.length === 0 || 
                         options.categories.includes(expense.category);
    return inDateRange && inCategories;
  });
};

/**
 * Calcule le résumé des dépenses par catégorie
 */
export const calculateExpenseSummary = (expenses: Expense[]): ExpenseSummary[] => {
  const summaryMap = new Map<string, ExpenseSummary>();

  expenses.forEach(expense => {
    const category = expense.category || 'other';
    
    if (!summaryMap.has(category)) {
      summaryMap.set(category, {
        category,
        count: 0,
        totalHT: 0,
        totalTVA: 0,
        totalTTC: 0,
        averageAmount: 0
      });
    }

    const summary = summaryMap.get(category)!;
    const vatRate = expense.vatRate || 20;
    const ttc = expense.amount;
    const ht = ttc / (1 + vatRate / 100);
    const tva = ttc - ht;

    summary.count++;
    summary.totalHT += ht;
    summary.totalTVA += tva;
    summary.totalTTC += ttc;
  });

  // Calculer les moyennes et arrondir
  summaryMap.forEach(summary => {
    summary.totalHT = Math.round(summary.totalHT * 100) / 100;
    summary.totalTVA = Math.round(summary.totalTVA * 100) / 100;
    summary.totalTTC = Math.round(summary.totalTTC * 100) / 100;
    summary.averageAmount = Math.round((summary.totalTTC / summary.count) * 100) / 100;
  });

  return Array.from(summaryMap.values()).sort((a, b) => b.totalTTC - a.totalTTC);
};

/**
 * Génère un export CSV détaillé des dépenses
 */
export const generateExpensesCSV = (
  expenses: Expense[],
  options: ExpenseExportOptions
): string => {
  const lines: string[] = [];

  // En-tête
  lines.push('EXPORT DES CHARGES');
  lines.push('');
  lines.push(`Établissement: ${options.restaurantName}`);
  lines.push(`Période: ${formatDate(options.startDate)} au ${formatDate(options.endDate)}`);
  lines.push(`Nombre de dépenses: ${expenses.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Détail des dépenses
  lines.push('Date;Catégorie;Description;Fournisseur;N° Facture;Montant HT;Taux TVA;Montant TVA;Montant TTC;Mode paiement');
  
  expenses.forEach(expense => {
    const vatRate = expense.vatRate || 20;
    const ttc = expense.amount;
    const ht = ttc / (1 + vatRate / 100);
    const tva = ttc - ht;

    const row = [
      formatDate(new Date(expense.date)),
      getCategoryLabel(expense.category),
      expense.description.replace(/;/g, ','),
      expense.supplier || 'N/A',
      expense.invoiceNumber || 'N/A',
      formatAmount(ht),
      `${vatRate}%`,
      formatAmount(tva),
      formatAmount(ttc),
      expense.paymentMethod || 'N/A'
    ];
    lines.push(row.join(';'));
  });

  lines.push('');
  lines.push('---');
  lines.push('');

  // Résumé par catégorie
  lines.push('RÉSUMÉ PAR CATÉGORIE');
  lines.push('');
  lines.push('Catégorie;Nombre;Total HT;Total TVA;Total TTC;Moyenne');
  
  const summary = calculateExpenseSummary(expenses);
  summary.forEach(item => {
    const row = [
      getCategoryLabel(item.category),
      item.count.toString(),
      formatAmount(item.totalHT),
      formatAmount(item.totalTVA),
      formatAmount(item.totalTTC),
      formatAmount(item.averageAmount)
    ];
    lines.push(row.join(';'));
  });

  // Total général
  const totalHT = summary.reduce((sum, item) => sum + item.totalHT, 0);
  const totalTVA = summary.reduce((sum, item) => sum + item.totalTVA, 0);
  const totalTTC = summary.reduce((sum, item) => sum + item.totalTTC, 0);
  
  lines.push('');
  lines.push(`TOTAL GÉNÉRAL;${expenses.length};${formatAmount(totalHT)};${formatAmount(totalTVA)};${formatAmount(totalTTC)};${formatAmount(totalTTC / expenses.length)}`);

  return lines.join('\n');
};

/**
 * Génère un export JSON des dépenses
 */
export const generateExpensesJSON = (
  expenses: Expense[],
  options: ExpenseExportOptions
): string => {
  const summary = calculateExpenseSummary(expenses);
  
  const totalHT = summary.reduce((sum, item) => sum + item.totalHT, 0);
  const totalTVA = summary.reduce((sum, item) => sum + item.totalTVA, 0);
  const totalTTC = summary.reduce((sum, item) => sum + item.totalTTC, 0);

  const exportData = {
    restaurant: {
      name: options.restaurantName,
      restaurantId: options.restaurantId
    },
    period: {
      startDate: options.startDate.toISOString(),
      endDate: options.endDate.toISOString()
    },
    expenses: expenses.map(expense => {
      const vatRate = expense.vatRate || 20;
      const ttc = expense.amount;
      const ht = ttc / (1 + vatRate / 100);
      const tva = ttc - ht;

      return {
        id: expense.id,
        date: expense.date,
        category: expense.category,
        categoryLabel: getCategoryLabel(expense.category),
        description: expense.description,
        supplier: expense.supplier,
        invoiceNumber: expense.invoiceNumber,
        paymentMethod: expense.paymentMethod,
        amounts: {
          ht: Math.round(ht * 100) / 100,
          tva: Math.round(tva * 100) / 100,
          ttc: Math.round(ttc * 100) / 100
        },
        vatRate
      };
    }),
    summary: {
      byCategory: summary,
      total: {
        count: expenses.length,
        ht: Math.round(totalHT * 100) / 100,
        tva: Math.round(totalTVA * 100) / 100,
        ttc: Math.round(totalTTC * 100) / 100,
        average: Math.round((totalTTC / expenses.length) * 100) / 100
      }
    },
    generatedAt: new Date().toISOString()
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Génère un export au format Sage (format spécifique)
 */
export const generateSageFormat = (
  expenses: Expense[],
  options: ExpenseExportOptions
): string => {
  const lines: string[] = [];
  
  // Format Sage: Journal;Date;Compte;Libellé;Débit;Crédit;Pièce
  lines.push('Journal;Date;Compte;Libellé;Débit;Crédit;Pièce');
  
  expenses.forEach(expense => {
    const date = formatDateSage(new Date(expense.date));
    const vatRate = expense.vatRate || 20;
    const ttc = expense.amount;
    const ht = ttc / (1 + vatRate / 100);
    const tva = ttc - ht;
    const pieceRef = expense.invoiceNumber || `EXP${date.replace(/\//g, '')}`;

    // Ligne fournisseur (crédit)
    lines.push(`AC;${date};401000;${expense.supplier || 'Fournisseur'};0,00;${formatAmount(ttc)};${pieceRef}`);
    
    // Ligne charge (débit)
    const compteCharge = getExpenseAccountNumber(expense.category);
    lines.push(`AC;${date};${compteCharge};${expense.description.replace(/;/g, ',')};${formatAmount(ht)};0,00;${pieceRef}`);
    
    // Ligne TVA (débit)
    lines.push(`AC;${date};4456${String(vatRate).replace('.', '')};TVA déductible ${vatRate}%;${formatAmount(tva)};0,00;${pieceRef}`);
  });

  return lines.join('\n');
};

/**
 * Retourne le libellé de la catégorie
 */
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    'ingredients': 'Ingrédients',
    'supplies': 'Fournitures',
    'rent': 'Loyer',
    'utilities': 'Charges (eau, électricité, gaz)',
    'salaries': 'Salaires',
    'insurance': 'Assurances',
    'maintenance': 'Entretien et réparations',
    'marketing': 'Marketing et publicité',
    'other': 'Autres charges'
  };
  return labels[category] || category;
};

/**
 * Retourne le numéro de compte comptable
 */
const getExpenseAccountNumber = (category: string): string => {
  const mapping: Record<string, string> = {
    'ingredients': '607000',
    'supplies': '606000',
    'rent': '613000',
    'utilities': '606100',
    'salaries': '641000',
    'insurance': '616000',
    'maintenance': '615000',
    'marketing': '623000',
    'other': '628000'
  };
  return mapping[category] || '628000';
};

/**
 * Formate un montant
 */
const formatAmount = (amount: number): string => {
  return amount.toFixed(2).replace('.', ',');
};

/**
 * Formate une date (DD/MM/YYYY)
 */
const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formate une date pour Sage (DD/MM/YY)
 */
const formatDateSage = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

/**
 * Télécharge le fichier d'export
 */
export const downloadExpensesFile = (
  content: string,
  options: ExpenseExportOptions,
  format: 'csv' | 'json' | 'sage' = 'csv'
): void => {
  const startDate = options.startDate.toISOString().split('T')[0].replace(/-/g, '');
  const endDate = options.endDate.toISOString().split('T')[0].replace(/-/g, '');
  const restaurantName = options.restaurantName.replace(/\s+/g, '_');
  
  let filename: string;
  let mimeType: string;
  
  switch (format) {
    case 'json':
      filename = `Charges_${restaurantName}_${startDate}_${endDate}.json`;
      mimeType = 'application/json;charset=utf-8';
      break;
    case 'sage':
      filename = `Charges_Sage_${restaurantName}_${startDate}_${endDate}.csv`;
      mimeType = 'text/csv;charset=utf-8';
      break;
    default:
      filename = `Charges_${restaurantName}_${startDate}_${endDate}.csv`;
      mimeType = 'text/csv;charset=utf-8';
  }

  const blob = new Blob([content], { type: mimeType });
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
 * Génère un export complet des dépenses
 */
export const generateExpensesExport = async (
  expenses: Expense[],
  options: ExpenseExportOptions
): Promise<string> => {
  const filteredExpenses = filterExpenses(expenses, options);
  const format = options.format || 'csv';

  switch (format) {
    case 'json':
      return generateExpensesJSON(filteredExpenses, options);
    case 'excel':
      // Pour Excel, on utilise le format CSV qui peut être ouvert dans Excel
      return generateExpensesCSV(filteredExpenses, options);
    default:
      return generateExpensesCSV(filteredExpenses, options);
  }
};
