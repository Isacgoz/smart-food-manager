import { Order, RestaurantProfile } from '../types';
import { logger } from './logger';

export interface InvoiceNumber {
  year: number;
  sequence: number;
  formatted: string; // Ex: "2025-00042"
}

export interface LegalMentions {
  companyName: string;
  siret: string;
  siren: string;
  vatNumber: string;
  address: string;
  capital?: string;
  rcs?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPriceHT: number;
  totalHT: number;
  vatRate: number;
  vatAmount: number;
  totalTTC: number;
}

export interface Invoice {
  id: string;
  number: InvoiceNumber;
  date: string;
  restaurant: LegalMentions;
  customer?: {
    name: string;
    address?: string;
    siret?: string;
  };
  lines: InvoiceLineItem[];
  subtotalHT: number;
  totalVAT: number;
  totalTTC: number;
  paymentMethod: 'CASH' | 'CARD';
  orderId: string;
  isArchived: boolean;
  archivedAt?: string;
}

// Numérotation séquentielle inaltérable
export const generateInvoiceNumber = (
  lastInvoiceNumber: InvoiceNumber | null
): InvoiceNumber => {
  const currentYear = new Date().getFullYear();

  if (!lastInvoiceNumber || lastInvoiceNumber.year !== currentYear) {
    // Nouvelle année = reset séquence
    return {
      year: currentYear,
      sequence: 1,
      formatted: `${currentYear}-00001`
    };
  }

  // Incrémenter séquence
  const newSequence = lastInvoiceNumber.sequence + 1;
  return {
    year: currentYear,
    sequence: newSequence,
    formatted: `${currentYear}-${String(newSequence).padStart(5, '0')}`
  };
};

// Calcul TVA par ligne (France restauration)
export const calculateVATLine = (
  priceHT: number,
  quantity: number,
  vatRate: number
): InvoiceLineItem => {
  const totalHT = priceHT * quantity;
  const vatAmount = totalHT * (vatRate / 100);
  const totalTTC = totalHT + vatAmount;

  return {
    description: '',
    quantity,
    unitPriceHT: priceHT,
    totalHT: Number(totalHT.toFixed(2)),
    vatRate,
    vatAmount: Number(vatAmount.toFixed(2)),
    totalTTC: Number(totalTTC.toFixed(2))
  };
};

// Générer facture depuis commande
export const generateInvoice = (
  order: Order,
  restaurant: RestaurantProfile,
  legalMentions: LegalMentions,
  lastInvoiceNumber: InvoiceNumber | null
): Invoice => {
  const invoiceNumber = generateInvoiceNumber(lastInvoiceNumber);

  // Déterminer taux TVA (simplifié pour MVP)
  // TODO: Gérer TVA par produit (5.5%, 10%, 20%)
  const defaultVATRate = order.type === 'TAKEAWAY' ? 5.5 : 10;

  const lines: InvoiceLineItem[] = order.items.map(item => ({
    ...calculateVATLine(item.price, item.quantity, defaultVATRate),
    description: item.productId // TODO: Nom produit réel
  }));

  const subtotalHT = lines.reduce((sum, line) => sum + line.totalHT, 0);
  const totalVAT = lines.reduce((sum, line) => sum + line.vatAmount, 0);
  const totalTTC = lines.reduce((sum, line) => sum + line.totalTTC, 0);

  logger.info('Facture générée', {
    invoiceNumber: invoiceNumber.formatted,
    totalTTC,
    orderId: order.id
  });

  return {
    id: `INV-${invoiceNumber.formatted}`,
    number: invoiceNumber,
    date: new Date().toISOString(),
    restaurant: legalMentions,
    lines,
    subtotalHT: Number(subtotalHT.toFixed(2)),
    totalVAT: Number(totalVAT.toFixed(2)),
    totalTTC: Number(totalTTC.toFixed(2)),
    paymentMethod: order.paymentMethod || 'CASH',
    orderId: order.id,
    isArchived: false
  };
};

// Vérifier validité numérotation (anti-fraude)
export const validateInvoiceSequence = (
  invoices: Invoice[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (invoices.length === 0) {
    return { valid: true, errors: [] };
  }

  // Trier par date
  const sorted = [...invoices].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Vérifier séquence continue par année
  const byYear = sorted.reduce((acc, inv) => {
    const year = inv.number.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(inv);
    return acc;
  }, {} as Record<number, Invoice[]>);

  Object.entries(byYear).forEach(([year, yearInvoices]) => {
    yearInvoices.forEach((inv, index) => {
      const expectedSequence = index + 1;
      if (inv.number.sequence !== expectedSequence) {
        errors.push(
          `${year}: Séquence brisée - attendu ${expectedSequence}, trouvé ${inv.number.sequence}`
        );
      }
    });
  });

  // Vérifier pas de duplicatas
  const numbers = invoices.map(inv => inv.number.formatted);
  const duplicates = numbers.filter((n, i) => numbers.indexOf(n) !== i);
  if (duplicates.length > 0) {
    errors.push(`Numéros en double: ${duplicates.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Export PDF (simplifi é - texte formaté)
export const formatInvoicePDF = (invoice: Invoice): string => {
  const lines = [
    '═══════════════════════════════════════════════════',
    '              FACTURE',
    '═══════════════════════════════════════════════════',
    '',
    `Facture N°: ${invoice.number.formatted}`,
    `Date: ${new Date(invoice.date).toLocaleDateString('fr-FR')}`,
    '',
    '───────────────────────────────────────────────────',
    'ÉMETTEUR',
    '───────────────────────────────────────────────────',
    invoice.restaurant.companyName,
    `SIRET: ${invoice.restaurant.siret}`,
    `N° TVA: ${invoice.restaurant.vatNumber}`,
    invoice.restaurant.address,
    invoice.restaurant.rcs ? `RCS: ${invoice.restaurant.rcs}` : '',
    invoice.restaurant.capital ? `Capital: ${invoice.restaurant.capital}` : '',
    '',
    '───────────────────────────────────────────────────',
    'DÉTAIL',
    '───────────────────────────────────────────────────',
    ''
  ];

  // Lignes facture
  invoice.lines.forEach(line => {
    lines.push(
      `${line.description} x ${line.quantity}`,
      `  ${line.unitPriceHT.toFixed(2)}€ HT × ${line.quantity} = ${line.totalHT.toFixed(2)}€ HT`,
      `  TVA ${line.vatRate}%: ${line.vatAmount.toFixed(2)}€`,
      `  Total TTC: ${line.totalTTC.toFixed(2)}€`,
      ''
    );
  });

  lines.push(
    '───────────────────────────────────────────────────',
    `Total HT:        ${invoice.subtotalHT.toFixed(2)} €`,
    `TVA:             ${invoice.totalVAT.toFixed(2)} €`,
    `Total TTC:       ${invoice.totalTTC.toFixed(2)} €`,
    '',
    `Mode paiement: ${invoice.paymentMethod === 'CASH' ? 'Espèces' : 'Carte Bancaire'}`,
    '',
    '═══════════════════════════════════════════════════',
    'Mentions légales obligatoires:',
    'TVA non applicable, art. 293 B du CGI (si micro-entreprise)',
    'ou',
    'TVA collectée selon régime réel',
    '═══════════════════════════════════════════════════'
  );

  return lines.filter(Boolean).join('\n');
};

// Archive facture (conformité 6 ans)
export const archiveInvoice = (invoice: Invoice): Invoice => {
  logger.audit('ARCHIVE', 'INVOICE', invoice.id);

  return {
    ...invoice,
    isArchived: true,
    archivedAt: new Date().toISOString()
  };
};
