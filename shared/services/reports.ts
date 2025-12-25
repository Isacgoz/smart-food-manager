import { Order, Product, CashDeclaration, User } from '../types';

export interface VATBreakdown {
  rate: number;
  base: number; // HT
  vat: number;
  total: number; // TTC
}

export interface StaffBreakdown {
  userId: string;
  name: string;
  cash: number;
  card: number;
  total: number;
}

export interface ZReport {
  id: string;
  restaurantId: string;
  restaurantName: string;
  date: string;
  openingCash: number;
  closingCash: number;
  theoreticalCash: number;
  variance: number;
  totalCash: number;
  totalCard: number;
  totalSales: number;
  orderCount: number;
  cancelledOrders: number;
  vatBreakdown: VATBreakdown[];
  staffBreakdown: StaffBreakdown[];
  generatedBy: string;
  generatedAt: string;
  // NF525 compliance
  sequenceNumber: number; // Numéro séquentiel Z
  previousZHash?: string; // Hash Z précédent (chaînage)
  currentHash?: string; // Hash Z actuel (SHA-256)
  isArchived: boolean;
  archivedAt?: string;
}

/**
 * Calcul TVA par taux
 */
export const calculateVATBreakdown = (
  orders: Order[],
  products: Product[]
): VATBreakdown[] => {
  const vatMap: Record<number, VATBreakdown> = {};

  orders.forEach(order => {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;

      const rate = product.vatRate;
      const priceTTC = item.price * item.quantity;
      const priceHT = priceTTC / (1 + rate);
      const vatAmount = priceTTC - priceHT;

      if (!vatMap[rate]) {
        vatMap[rate] = { rate, base: 0, vat: 0, total: 0 };
      }

      vatMap[rate].base += priceHT;
      vatMap[rate].vat += vatAmount;
      vatMap[rate].total += priceTTC;
    });
  });

  return Object.values(vatMap).sort((a, b) => a.rate - b.rate);
};

/**
 * Génération Z-Report complet
 */
export const generateZReport = async (
  restaurantId: string,
  restaurantName: string,
  orders: Order[],
  products: Product[],
  cashDeclarations: CashDeclaration[],
  users: User[],
  currentUserId: string,
  closingCash: number,
  previousZ?: ZReport
): Promise<ZReport> => {
  const today = new Date().toISOString().split('T')[0];

  // Filtre commandes du jour
  const completedToday = orders.filter(
    o => o.status === 'COMPLETED' && o.date.startsWith(today)
  );

  const cancelledToday = orders.filter(
    o => o.status === 'CANCELLED' && o.date.startsWith(today)
  ).length;

  // Totaux
  const cashTotal = completedToday
    .filter(o => o.paymentMethod === 'CASH')
    .reduce((sum, o) => sum + o.total, 0);

  const cardTotal = completedToday
    .filter(o => o.paymentMethod === 'CARD')
    .reduce((sum, o) => sum + o.total, 0);

  // Fond de caisse ouverture
  const openingDecl = cashDeclarations.find(
    d => d.date.startsWith(today) && d.type === 'OPENING'
  );
  const openingCash = openingDecl ? openingDecl.amount : 0;

  const theoreticalCash = openingCash + cashTotal;
  const variance = closingCash - theoreticalCash;

  // TVA Breakdown
  const vatBreakdown = calculateVATBreakdown(completedToday, products);

  // Staff Breakdown
  const staffMap: Record<string, StaffBreakdown> = {};
  completedToday.forEach(o => {
    const userId = o.paidByUserId || o.userId;
    const user = users.find(u => u.id === userId);
    const userName = user?.name || 'Inconnu';

    if (!staffMap[userId]) {
      staffMap[userId] = { userId, name: userName, cash: 0, card: 0, total: 0 };
    }

    if (o.paymentMethod === 'CASH') {
      staffMap[userId].cash += o.total;
    } else {
      staffMap[userId].card += o.total;
    }
    staffMap[userId].total += o.total;
  });

  // NF525 compliance: numérotation séquentielle
  const sequenceNumber = previousZ ? previousZ.sequenceNumber + 1 : 1;

  // Chaînage cryptographique (hash SHA-256)
  const zData = {
    id: `z-${Date.now()}`,
    restaurantId,
    restaurantName,
    date: today,
    openingCash,
    closingCash,
    theoreticalCash,
    variance,
    totalCash: cashTotal,
    totalCard: cardTotal,
    totalSales: cashTotal + cardTotal,
    orderCount: completedToday.length,
    cancelledOrders: cancelledToday,
    vatBreakdown,
    staffBreakdown: Object.values(staffMap),
    generatedBy: currentUserId,
    generatedAt: new Date().toISOString(),
    sequenceNumber,
    previousZHash: previousZ?.currentHash,
    isArchived: false
  };

  // Calculer hash actuel (async)
  const currentHash = await hashZReport(zData);

  return {
    ...zData,
    currentHash
  };
};

// Hash cryptographique Z-Report (NF525)
const hashZReport = async (zData: Omit<ZReport, 'currentHash'>): Promise<string> => {
  const dataString = JSON.stringify({
    sequence: zData.sequenceNumber,
    date: zData.date,
    totalSales: zData.totalSales,
    previousHash: zData.previousZHash
  });

  // SHA-256 via Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Export CSV TVA
 */
export const exportVATCSV = (vatBreakdown: VATBreakdown[]): string => {
  let csv = 'Taux TVA (%),Base HT (€),Montant TVA (€),Total TTC (€)\n';

  vatBreakdown.forEach(vat => {
    csv += `${(vat.rate * 100).toFixed(1)},${vat.base.toFixed(2)},${vat.vat.toFixed(2)},${vat.total.toFixed(2)}\n`;
  });

  return csv;
};

/**
 * Export CSV Z-Report complet
 */
export const exportZReportCSV = (report: ZReport): string => {
  let csv = `Rapport de Clôture - ${report.restaurantName}\n`;
  csv += `Date,${report.date}\n`;
  csv += `Généré le,${new Date(report.generatedAt).toLocaleString('fr-FR')}\n\n`;

  csv += `Catégorie,Montant (€)\n`;
  csv += `Fond ouverture,${report.openingCash.toFixed(2)}\n`;
  csv += `Espèces encaissées,${report.totalCash.toFixed(2)}\n`;
  csv += `CB encaissées,${report.totalCard.toFixed(2)}\n`;
  csv += `Total ventes,${report.totalSales.toFixed(2)}\n`;
  csv += `Théorique caisse,${report.theoreticalCash.toFixed(2)}\n`;
  csv += `Compté réel,${report.closingCash.toFixed(2)}\n`;
  csv += `Écart,${report.variance.toFixed(2)}\n\n`;

  csv += `Détail TVA\n`;
  csv += `Taux,Base HT,TVA,Total TTC\n`;
  report.vatBreakdown.forEach(vat => {
    csv += `${(vat.rate * 100).toFixed(1)}%,${vat.base.toFixed(2)},${vat.vat.toFixed(2)},${vat.total.toFixed(2)}\n`;
  });

  csv += `\nDétail par Staff\n`;
  csv += `Nom,Espèces,Carte,Total\n`;
  report.staffBreakdown.forEach(staff => {
    csv += `${staff.name},${staff.cash.toFixed(2)},${staff.card.toFixed(2)},${staff.total.toFixed(2)}\n`;
  });

  return csv;
};

/**
 * Télécharger fichier
 */
export const downloadFile = (content: string, filename: string, mimeType: string = 'text/csv') => {
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
