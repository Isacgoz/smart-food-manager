/**
 * FEC Export Service - Fichier des Écritures Comptables
 * 
 * Norme FEC (Article A47 A-1 du Livre des procédures fiscales)
 * Format: TXT pipe-delimited (|)
 * Encodage: UTF-8
 * 
 * Colonnes obligatoires (18):
 * JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|
 * CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|
 * EcritureLettre|DateLettre|ValidDate|Montantdevise|Idevise
 */

import type { Order, Expense, Invoice, AppState } from '../types';

export interface FECLine {
  JournalCode: string;        // Code journal (VE=Ventes, AC=Achats, BQ=Banque, CA=Caisse)
  JournalLib: string;          // Libellé journal
  EcritureNum: string;         // Numéro écriture unique
  EcritureDate: string;        // Date écriture (YYYYMMDD)
  CompteNum: string;           // Numéro compte (PCG)
  CompteLib: string;           // Libellé compte
  CompAuxNum: string;          // Compte auxiliaire (client/fournisseur)
  CompAuxLib: string;          // Libellé auxiliaire
  PieceRef: string;            // Référence pièce (facture, ticket)
  PieceDate: string;           // Date pièce (YYYYMMDD)
  EcritureLib: string;         // Libellé écriture
  Debit: string;               // Montant débit (format: 1234.56)
  Credit: string;              // Montant crédit (format: 1234.56)
  EcritureLettre: string;      // Lettrage (vide si non lettré)
  DateLettre: string;          // Date lettrage (vide si non lettré)
  ValidDate: string;           // Date validation (YYYYMMDD)
  Montantdevise: string;       // Montant devise (vide si EUR)
  Idevise: string;             // Code devise (vide si EUR)
}

export interface FECExportOptions {
  startDate: string;           // YYYY-MM-DD
  endDate: string;             // YYYY-MM-DD
  companyName: string;
  siret: string;
  exerciceStart: string;       // YYYY-MM-DD (début exercice fiscal)
  exerciceEnd: string;         // YYYY-MM-DD (fin exercice fiscal)
}

/**
 * Plan Comptable Général (PCG) - Comptes utilisés
 */
export const PCG_ACCOUNTS = {
  // Classe 4 - Comptes de tiers
  CLIENT_DIVERS: '411000',           // Clients divers
  FOURNISSEUR_DIVERS: '401000',      // Fournisseurs divers
  TVA_COLLECTEE_10: '445711',        // TVA collectée 10%
  TVA_COLLECTEE_5_5: '445712',       // TVA collectée 5.5%
  TVA_COLLECTEE_20: '445713',        // TVA collectée 20%
  TVA_DEDUCTIBLE: '445660',          // TVA déductible sur achats
  
  // Classe 5 - Comptes financiers
  CAISSE: '530000',                  // Caisse
  BANQUE: '512000',                  // Banque
  
  // Classe 6 - Comptes de charges
  ACHAT_MARCHANDISES: '607000',      // Achats marchandises
  CHARGES_PERSONNEL: '641000',       // Rémunérations personnel
  CHARGES_SOCIALES: '645000',        // Charges sociales
  LOYER: '613000',                   // Locations
  ELECTRICITE: '606100',             // Fournitures non stockables (eau, énergie)
  ASSURANCE: '616000',               // Primes d'assurance
  HONORAIRES: '622600',              // Honoraires
  PUBLICITE: '623000',               // Publicité
  ENTRETIEN: '615000',               // Entretien et réparations
  FOURNITURES: '606400',             // Fournitures administratives
  
  // Classe 7 - Comptes de produits
  VENTE_MARCHANDISES: '707000',      // Ventes marchandises
};

/**
 * Codes journaux FEC
 */
export const JOURNAL_CODES = {
  VENTES: 'VE',
  ACHATS: 'AC',
  BANQUE: 'BQ',
  CAISSE: 'CA',
  OPERATIONS_DIVERSES: 'OD',
};

/**
 * Formater date au format FEC (YYYYMMDD)
 */
const formatFECDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * Formater montant au format FEC (1234.56)
 */
const formatFECAmount = (amount: number): string => {
  return amount.toFixed(2);
};

/**
 * Générer numéro d'écriture unique
 */
const generateEcritureNum = (journalCode: string, date: string, sequence: number): string => {
  const dateStr = formatFECDate(date);
  return `${journalCode}${dateStr}${String(sequence).padStart(4, '0')}`;
};

/**
 * Convertir ligne FEC en string pipe-delimited
 */
const fecLineToString = (line: FECLine): string => {
  return [
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
    line.EcritureLettre,
    line.DateLettre,
    line.ValidDate,
    line.Montantdevise,
    line.Idevise,
  ].join('|');
};

/**
 * Générer écritures FEC pour une vente
 */
const generateSaleEntries = (
  order: Order,
  invoice: Invoice | undefined,
  sequence: number,
  options: FECExportOptions
): FECLine[] => {
  const lines: FECLine[] = [];
  const ecritureNum = generateEcritureNum(JOURNAL_CODES.VENTES, order.date, sequence);
  const ecritureDate = formatFECDate(order.date);
  const pieceRef = invoice?.number.formatted || order.id;
  
  // Ligne 1: Débit Client (ou Caisse/Banque si encaissé)
  const compteEncaissement = order.paymentMethod === 'CASH' ? PCG_ACCOUNTS.CAISSE : PCG_ACCOUNTS.BANQUE;
  const compteEncaissementLib = order.paymentMethod === 'CASH' ? 'Caisse' : 'Banque';
  
  lines.push({
    JournalCode: JOURNAL_CODES.VENTES,
    JournalLib: 'Journal des ventes',
    EcritureNum: ecritureNum,
    EcritureDate: ecritureDate,
    CompteNum: compteEncaissement,
    CompteLib: compteEncaissementLib,
    CompAuxNum: '',
    CompAuxLib: '',
    PieceRef: pieceRef,
    PieceDate: ecritureDate,
    EcritureLib: `Vente ${order.type === 'DINE_IN' ? 'sur place' : 'à emporter'} - ${order.items.length} article(s)`,
    Debit: formatFECAmount(order.total),
    Credit: '0.00',
    EcritureLettre: '',
    DateLettre: '',
    ValidDate: ecritureDate,
    Montantdevise: '',
    Idevise: '',
  });
  
  // Calculer TVA par taux
  const tvaRate = order.type === 'DINE_IN' ? 0.10 : 0.055;
  const totalHT = order.total / (1 + tvaRate);
  const totalTVA = order.total - totalHT;
  
  // Ligne 2: Crédit Ventes HT
  lines.push({
    JournalCode: JOURNAL_CODES.VENTES,
    JournalLib: 'Journal des ventes',
    EcritureNum: ecritureNum,
    EcritureDate: ecritureDate,
    CompteNum: PCG_ACCOUNTS.VENTE_MARCHANDISES,
    CompteLib: 'Ventes de marchandises',
    CompAuxNum: '',
    CompAuxLib: '',
    PieceRef: pieceRef,
    PieceDate: ecritureDate,
    EcritureLib: `Vente ${order.type === 'DINE_IN' ? 'sur place' : 'à emporter'} - ${order.items.length} article(s)`,
    Debit: '0.00',
    Credit: formatFECAmount(totalHT),
    EcritureLettre: '',
    DateLettre: '',
    ValidDate: ecritureDate,
    Montantdevise: '',
    Idevise: '',
  });
  
  // Ligne 3: Crédit TVA collectée
  const tvaAccount = order.type === 'DINE_IN' ? PCG_ACCOUNTS.TVA_COLLECTEE_10 : PCG_ACCOUNTS.TVA_COLLECTEE_5_5;
  const tvaLib = order.type === 'DINE_IN' ? 'TVA collectée 10%' : 'TVA collectée 5.5%';
  
  lines.push({
    JournalCode: JOURNAL_CODES.VENTES,
    JournalLib: 'Journal des ventes',
    EcritureNum: ecritureNum,
    EcritureDate: ecritureDate,
    CompteNum: tvaAccount,
    CompteLib: tvaLib,
    CompAuxNum: '',
    CompAuxLib: '',
    PieceRef: pieceRef,
    PieceDate: ecritureDate,
    EcritureLib: `TVA ${tvaRate * 100}% sur vente`,
    Debit: '0.00',
    Credit: formatFECAmount(totalTVA),
    EcritureLettre: '',
    DateLettre: '',
    ValidDate: ecritureDate,
    Montantdevise: '',
    Idevise: '',
  });
  
  return lines;
};

/**
 * Générer écritures FEC pour une charge
 */
const generateExpenseEntries = (
  expense: Expense,
  sequence: number,
  options: FECExportOptions
): FECLine[] => {
  const lines: FECLine[] = [];
  const ecritureNum = generateEcritureNum(JOURNAL_CODES.ACHATS, expense.date, sequence);
  const ecritureDate = formatFECDate(expense.date);
  const pieceRef = expense.invoiceNumber || expense.id;
  
  // Déterminer compte de charge selon catégorie
  let compteCharge = PCG_ACCOUNTS.ACHAT_MARCHANDISES;
  let compteChargeLib = 'Achats de marchandises';
  
  switch (expense.category) {
    case 'SALARY':
      compteCharge = PCG_ACCOUNTS.CHARGES_PERSONNEL;
      compteChargeLib = 'Rémunérations du personnel';
      break;
    case 'RENT':
      compteCharge = PCG_ACCOUNTS.LOYER;
      compteChargeLib = 'Locations';
      break;
    case 'ELECTRICITY':
      compteCharge = PCG_ACCOUNTS.ELECTRICITE;
      compteChargeLib = 'Fournitures non stockables (eau, énergie)';
      break;
    case 'INSURANCE':
      compteCharge = PCG_ACCOUNTS.ASSURANCE;
      compteChargeLib = 'Primes d\'assurance';
      break;
    case 'MARKETING':
      compteCharge = PCG_ACCOUNTS.PUBLICITE;
      compteChargeLib = 'Publicité, publications';
      break;
    case 'MAINTENANCE':
      compteCharge = PCG_ACCOUNTS.ENTRETIEN;
      compteChargeLib = 'Entretien et réparations';
      break;
    case 'SUPPLIES':
      compteCharge = PCG_ACCOUNTS.FOURNITURES;
      compteChargeLib = 'Fournitures administratives';
      break;
    case 'OTHER':
      compteCharge = PCG_ACCOUNTS.ACHAT_MARCHANDISES;
      compteChargeLib = 'Achats divers';
      break;
  }
  
  // Calculer HT et TVA (TVA 20% par défaut sur charges)
  const tvaRate = 0.20;
  const amountHT = expense.amount / (1 + tvaRate);
  const amountTVA = expense.amount - amountHT;
  
  // Ligne 1: Débit Charge HT
  lines.push({
    JournalCode: JOURNAL_CODES.ACHATS,
    JournalLib: 'Journal des achats',
    EcritureNum: ecritureNum,
    EcritureDate: ecritureDate,
    CompteNum: compteCharge,
    CompteLib: compteChargeLib,
    CompAuxNum: expense.supplier || '',
    CompAuxLib: expense.supplier || '',
    PieceRef: pieceRef,
    PieceDate: ecritureDate,
    EcritureLib: expense.description,
    Debit: formatFECAmount(amountHT),
    Credit: '0.00',
    EcritureLettre: '',
    DateLettre: '',
    ValidDate: ecritureDate,
    Montantdevise: '',
    Idevise: '',
  });
  
  // Ligne 2: Débit TVA déductible
  lines.push({
    JournalCode: JOURNAL_CODES.ACHATS,
    JournalLib: 'Journal des achats',
    EcritureNum: ecritureNum,
    EcritureDate: ecritureDate,
    CompteNum: PCG_ACCOUNTS.TVA_DEDUCTIBLE,
    CompteLib: 'TVA déductible sur achats',
    CompAuxNum: '',
    CompAuxLib: '',
    PieceRef: pieceRef,
    PieceDate: ecritureDate,
    EcritureLib: `TVA 20% sur ${expense.description}`,
    Debit: formatFECAmount(amountTVA),
    Credit: '0.00',
    EcritureLettre: '',
    DateLettre: '',
    ValidDate: ecritureDate,
    Montantdevise: '',
    Idevise: '',
  });
  
  // Ligne 3: Crédit Fournisseur (ou Banque si payé)
  const comptePaiement = expense.isPaid ? PCG_ACCOUNTS.BANQUE : PCG_ACCOUNTS.FOURNISSEUR_DIVERS;
  const comptePaiementLib = expense.isPaid ? 'Banque' : 'Fournisseurs divers';
  
  lines.push({
    JournalCode: JOURNAL_CODES.ACHATS,
    JournalLib: 'Journal des achats',
    EcritureNum: ecritureNum,
    EcritureDate: ecritureDate,
    CompteNum: comptePaiement,
    CompteLib: comptePaiementLib,
    CompAuxNum: expense.supplier || '',
    CompAuxLib: expense.supplier || '',
    PieceRef: pieceRef,
    PieceDate: ecritureDate,
    EcritureLib: expense.description,
    Debit: '0.00',
    Credit: formatFECAmount(expense.amount),
    EcritureLettre: '',
    DateLettre: '',
    ValidDate: ecritureDate,
    Montantdevise: '',
    Idevise: '',
  });
  
  return lines;
};

/**
 * Générer fichier FEC complet
 */
export const generateFEC = (
  state: AppState,
  options: FECExportOptions
): string => {
  const lines: FECLine[] = [];
  let sequence = 1;
  
  // Filtrer données par période
  const startDate = new Date(options.startDate);
  const endDate = new Date(options.endDate);
  
  // Générer écritures ventes
  const salesInPeriod = state.orders.filter(order => {
    const orderDate = new Date(order.date);
    return order.status === 'COMPLETED' && orderDate >= startDate && orderDate <= endDate;
  });
  
  salesInPeriod.forEach(order => {
    const invoice = state.invoices?.find(inv => inv.orderId === order.id);
    const saleLines = generateSaleEntries(order, invoice, sequence, options);
    lines.push(...saleLines);
    sequence++;
  });
  
  // Générer écritures charges
  const expensesInPeriod = state.expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= startDate && expenseDate <= endDate;
  });
  
  expensesInPeriod.forEach(expense => {
    const expenseLines = generateExpenseEntries(expense, sequence, options);
    lines.push(...expenseLines);
    sequence++;
  });
  
  // Générer header FEC
  const header = [
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
    'EcritureLettre',
    'DateLettre',
    'ValidDate',
    'Montantdevise',
    'Idevise',
  ].join('|');
  
  // Assembler fichier
  const fecContent = [
    header,
    ...lines.map(fecLineToString),
  ].join('\n');
  
  return fecContent;
};

/**
 * Générer nom fichier FEC selon norme
 * Format: SIREN + FEC + Date clôture (YYYYMMDD) + .txt
 * Exemple: 123456789FEC20261231.txt
 */
export const generateFECFilename = (siret: string, exerciceEnd: string): string => {
  const siren = siret.substring(0, 9); // 9 premiers chiffres du SIRET
  const dateClotureStr = formatFECDate(exerciceEnd);
  return `${siren}FEC${dateClotureStr}.txt`;
};

/**
 * Télécharger fichier FEC
 */
export const downloadFEC = (
  state: AppState,
  options: FECExportOptions
): void => {
  const fecContent = generateFEC(state, options);
  const filename = generateFECFilename(options.siret, options.exerciceEnd);
  
  // Créer blob UTF-8
  const blob = new Blob([fecContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  // Télécharger
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Valider fichier FEC (contrôles basiques)
 */
export const validateFEC = (fecContent: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const lines = fecContent.split('\n');
  
  // Vérifier header
  if (lines.length < 2) {
    errors.push('Fichier FEC vide ou incomplet');
    return { valid: false, errors };
  }
  
  const header = lines[0].split('|');
  const expectedColumns = 18;
  
  if (header.length !== expectedColumns) {
    errors.push(`Header doit contenir ${expectedColumns} colonnes, trouvé ${header.length}`);
  }
  
  // Vérifier équilibre débit/crédit
  let totalDebit = 0;
  let totalCredit = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const columns = line.split('|');
    if (columns.length !== expectedColumns) {
      errors.push(`Ligne ${i + 1}: nombre colonnes incorrect (${columns.length} au lieu de ${expectedColumns})`);
      continue;
    }
    
    const debit = parseFloat(columns[11]) || 0;
    const credit = parseFloat(columns[12]) || 0;
    
    totalDebit += debit;
    totalCredit += credit;
  }
  
  // Vérifier équilibre (tolérance 0.01€ pour arrondis)
  const diff = Math.abs(totalDebit - totalCredit);
  if (diff > 0.01) {
    errors.push(`Déséquilibre comptable: Débit ${totalDebit.toFixed(2)}€ ≠ Crédit ${totalCredit.toFixed(2)}€ (diff: ${diff.toFixed(2)}€)`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};
