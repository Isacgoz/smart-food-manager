/**
 * Service d'export FEC (Fichier des Écritures Comptables)
 * Norme française pour les exports comptables
 * Format: CSV avec séparateur pipe (|)
 */

import { Order, Expense } from '../types';

export interface FECLine {
  JournalCode: string;        // Code journal
  JournalLib: string;         // Libellé journal
  EcritureNum: string;        // Numéro d'écriture
  EcritureDate: string;       // Date d'écriture (YYYYMMDD)
  CompteNum: string;          // Numéro de compte
  CompteLib: string;          // Libellé du compte
  CompAuxNum: string;         // Compte auxiliaire
  CompAuxLib: string;         // Libellé compte auxiliaire
  PieceRef: string;           // Référence pièce
  PieceDate: string;          // Date pièce (YYYYMMDD)
  EcritureLib: string;        // Libellé écriture
  Debit: string;              // Montant débit
  Credit: string;             // Montant crédit
  EcritureLet: string;        // Lettrage
  DateLet: string;            // Date lettrage
  ValidDate: string;          // Date validation
  Montantdevise: string;      // Montant devise
  Idevise: string;            // Identifiant devise
}

export interface FECExportOptions {
  startDate: Date;
  endDate: Date;
  restaurantId: string;
  restaurantName: string;
  siret?: string;
}

/**
 * Génère les lignes FEC pour les ventes
 */
export const generateSalesFECLines = (
  orders: Order[],
  options: FECExportOptions
): FECLine[] => {
  const lines: FECLine[] = [];
  let ecritureNum = 1;

  // Grouper les ventes par jour
  const salesByDay = new Map<string, Order[]>();
  orders.forEach(order => {
    const date = new Date(order.createdAt || order.date).toISOString().split('T')[0];
    if (!salesByDay.has(date)) {
      salesByDay.set(date, []);
    }
    salesByDay.get(date)!.push(order);
  });

  // Générer les écritures pour chaque jour
  salesByDay.forEach((dayOrders, date) => {
    const dateFormatted = date.replace(/-/g, '');
    const ecritureNumStr = `VE${dateFormatted}${String(ecritureNum).padStart(4, '0')}`;

    // Calculer les totaux par taux de TVA
    const vatTotals = new Map<number, { ht: number; tva: number; ttc: number }>();
    
    dayOrders.forEach(order => {
      order.items.forEach(item => {
        const vatRate = item.vatRate || 20;
        if (!vatTotals.has(vatRate)) {
          vatTotals.set(vatRate, { ht: 0, tva: 0, ttc: 0 });
        }
        const totals = vatTotals.get(vatRate)!;
        const itemTotal = item.price * item.quantity;
        const ht = itemTotal / (1 + vatRate / 100);
        const tva = itemTotal - ht;
        
        totals.ht += ht;
        totals.tva += tva;
        totals.ttc += itemTotal;
      });
    });

    // Ligne de débit client (411)
    const totalTTC = Array.from(vatTotals.values()).reduce((sum, v) => sum + v.ttc, 0);
    lines.push({
      JournalCode: 'VE',
      JournalLib: 'Ventes',
      EcritureNum: ecritureNumStr,
      EcritureDate: dateFormatted,
      CompteNum: '411000',
      CompteLib: 'Clients',
      CompAuxNum: '',
      CompAuxLib: '',
      PieceRef: `VE${dateFormatted}`,
      PieceDate: dateFormatted,
      EcritureLib: `Ventes du ${date}`,
      Debit: totalTTC.toFixed(2),
      Credit: '0.00',
      EcritureLet: '',
      DateLet: '',
      ValidDate: dateFormatted,
      Montantdevise: '',
      Idevise: 'EUR'
    });

    // Lignes de crédit ventes par taux de TVA (707xxx)
    vatTotals.forEach((totals, rate) => {
      lines.push({
        JournalCode: 'VE',
        JournalLib: 'Ventes',
        EcritureNum: ecritureNumStr,
        EcritureDate: dateFormatted,
        CompteNum: `707${String(rate).padStart(3, '0')}`,
        CompteLib: `Ventes marchandises TVA ${rate}%`,
        CompAuxNum: '',
        CompAuxLib: '',
        PieceRef: `VE${dateFormatted}`,
        PieceDate: dateFormatted,
        EcritureLib: `Ventes TVA ${rate}% du ${date}`,
        Debit: '0.00',
        Credit: totals.ht.toFixed(2),
        EcritureLet: '',
        DateLet: '',
        ValidDate: dateFormatted,
        Montantdevise: '',
        Idevise: 'EUR'
      });

      // Ligne TVA collectée (4457xx)
      lines.push({
        JournalCode: 'VE',
        JournalLib: 'Ventes',
        EcritureNum: ecritureNumStr,
        EcritureDate: dateFormatted,
        CompteNum: `4457${String(rate).padStart(2, '0')}`,
        CompteLib: `TVA collectée ${rate}%`,
        CompAuxNum: '',
        CompAuxLib: '',
        PieceRef: `VE${dateFormatted}`,
        PieceDate: dateFormatted,
        EcritureLib: `TVA collectée ${rate}% du ${date}`,
        Debit: '0.00',
        Credit: totals.tva.toFixed(2),
        EcritureLet: '',
        DateLet: '',
        ValidDate: dateFormatted,
        Montantdevise: '',
        Idevise: 'EUR'
      });
    });

    ecritureNum++;
  });

  return lines;
};

/**
 * Génère les lignes FEC pour les achats/dépenses
 */
export const generateExpensesFECLines = (
  expenses: Expense[],
  options: FECExportOptions
): FECLine[] => {
  const lines: FECLine[] = [];
  let ecritureNum = 1;

  expenses.forEach(expense => {
    const date = new Date(expense.date).toISOString().split('T')[0];
    const dateFormatted = date.replace(/-/g, '');
    const ecritureNumStr = `AC${dateFormatted}${String(ecritureNum).padStart(4, '0')}`;

    const vatRate = expense.vatRate || 20;
    const ttc = expense.amount;
    const ht = ttc / (1 + vatRate / 100);
    const tva = ttc - ht;

    // Ligne de crédit fournisseur (401)
    lines.push({
      JournalCode: 'AC',
      JournalLib: 'Achats',
      EcritureNum: ecritureNumStr,
      EcritureDate: dateFormatted,
      CompteNum: '401000',
      CompteLib: 'Fournisseurs',
      CompAuxNum: expense.supplier || '',
      CompAuxLib: expense.supplier || '',
      PieceRef: expense.invoiceNumber || `AC${dateFormatted}`,
      PieceDate: dateFormatted,
      EcritureLib: expense.description,
      Debit: '0.00',
      Credit: ttc.toFixed(2),
      EcritureLet: '',
      DateLet: '',
      ValidDate: dateFormatted,
      Montantdevise: '',
      Idevise: 'EUR'
    });

    // Ligne de débit charge (6xxx)
    const compteCharge = getExpenseAccountNumber(expense.category);
    lines.push({
      JournalCode: 'AC',
      JournalLib: 'Achats',
      EcritureNum: ecritureNumStr,
      EcritureDate: dateFormatted,
      CompteNum: compteCharge,
      CompteLib: getExpenseAccountLabel(expense.category),
      CompAuxNum: '',
      CompAuxLib: '',
      PieceRef: expense.invoiceNumber || `AC${dateFormatted}`,
      PieceDate: dateFormatted,
      EcritureLib: expense.description,
      Debit: ht.toFixed(2),
      Credit: '0.00',
      EcritureLet: '',
      DateLet: '',
      ValidDate: dateFormatted,
      Montantdevise: '',
      Idevise: 'EUR'
    });

    // Ligne TVA déductible (4456xx)
    lines.push({
      JournalCode: 'AC',
      JournalLib: 'Achats',
      EcritureNum: ecritureNumStr,
      EcritureDate: dateFormatted,
      CompteNum: `4456${String(vatRate).padStart(2, '0')}`,
      CompteLib: `TVA déductible ${vatRate}%`,
      CompAuxNum: '',
      CompAuxLib: '',
      PieceRef: expense.invoiceNumber || `AC${dateFormatted}`,
      PieceDate: dateFormatted,
      EcritureLib: `TVA déductible ${vatRate}%`,
      Debit: tva.toFixed(2),
      Credit: '0.00',
      EcritureLet: '',
      DateLet: '',
      ValidDate: dateFormatted,
      Montantdevise: '',
      Idevise: 'EUR'
    });

    ecritureNum++;
  });

  return lines;
};

/**
 * Détermine le numéro de compte selon la catégorie de dépense
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
 * Retourne le libellé du compte selon la catégorie
 */
const getExpenseAccountLabel = (category: string): string => {
  const mapping: Record<string, string> = {
    'ingredients': 'Achats de marchandises',
    'supplies': 'Achats non stockés',
    'rent': 'Locations',
    'utilities': 'Fournitures non stockables',
    'salaries': 'Rémunérations du personnel',
    'insurance': 'Primes d\'assurance',
    'maintenance': 'Entretien et réparations',
    'marketing': 'Publicité',
    'other': 'Divers'
  };
  return mapping[category] || 'Charges diverses';
};

/**
 * Convertit les lignes FEC en format CSV
 */
export const convertFECToCSV = (lines: FECLine[]): string => {
  const headers = [
    'JournalCode',
    'JournalLib',
    'EcritureNum',
    'EcritureDate',
    'CompteNum',
    'CompteLib',
    'CompAuxNum',
    'CompAuxLib',
    'PieceRef',
    'PieceDate',
    'EcritureLib',
    'Debit',
    'Credit',
    'EcritureLet',
    'DateLet',
    'ValidDate',
    'Montantdevise',
    'Idevise'
  ];

  const csvLines = [headers.join('|')];
  
  lines.forEach(line => {
    const values = [
      line.JournalCode,
      line.JournalLib,
      line.EcritureNum,
      line.EcritureDate,
      line.CompteNum,
      line.CompteLib,
      line.CompAuxNum,
      line.CompAuxLib,
      line.PieceRef,
      line.PieceDate,
      line.EcritureLib,
      line.Debit,
      line.Credit,
      line.EcritureLet,
      line.DateLet,
      line.ValidDate,
      line.Montantdevise,
      line.Idevise
    ];
    csvLines.push(values.join('|'));
  });

  return csvLines.join('\n');
};

/**
 * Génère un export FEC complet (ventes + achats)
 */
export const generateFECExport = async (
  orders: Order[],
  expenses: Expense[],
  options: FECExportOptions
): Promise<string> => {
  // Filtrer par date
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt || order.date);
    return orderDate >= options.startDate && orderDate <= options.endDate;
  });

  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= options.startDate && expenseDate <= options.endDate;
  });

  // Générer les lignes
  const salesLines = generateSalesFECLines(filteredOrders, options);
  const expensesLines = generateExpensesFECLines(filteredExpenses, options);

  // Combiner et trier par date
  const allLines = [...salesLines, ...expensesLines].sort((a, b) => 
    a.EcritureDate.localeCompare(b.EcritureDate)
  );

  // Convertir en CSV
  return convertFECToCSV(allLines);
};

/**
 * Télécharge le fichier FEC
 */
export const downloadFECFile = (csv: string, options: FECExportOptions): void => {
  const startDate = options.startDate.toISOString().split('T')[0].replace(/-/g, '');
  const endDate = options.endDate.toISOString().split('T')[0].replace(/-/g, '');
  const siret = options.siret || 'XXXXXXXXX';
  const filename = `${siret}FEC${startDate}_${endDate}.txt`;

  const blob = new Blob([csv], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
