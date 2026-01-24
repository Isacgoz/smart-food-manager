/**
 * NF525 Compliance Service (Stub)
 * TODO: Implémenter complètement pour certification fiscale
 */

export interface RestaurantLegalInfo {
  name: string;
  legal_name?: string;
  siret: string;
  siren: string;
  vat_number: string;
  address: string;
  postal_code?: string;
  city?: string;
}

export interface ArchivedInvoice {
  id: string;
  invoice_number: string;
  hash: string;
  timestamp: string;
}

// Stub: retourne toujours null (pas d'archive précédente)
export async function getLastInvoiceHash(restaurantId: string): Promise<string | null> {
  console.log('[NF525] getLastInvoiceHash - stub called for:', restaurantId);
  return null;
}

// Stub: log sans archivage réel
export async function archiveInvoice(
  restaurantId: string,
  order: any,
  products: any[],
  legalInfo: RestaurantLegalInfo,
  previousHash?: string
): Promise<ArchivedInvoice | null> {
  console.log('[NF525] archiveInvoice - stub called', { restaurantId, orderId: order.id });
  return null;
}

// Stub: log changement de prix
export async function logPriceChange(
  restaurantId: string,
  productId: string,
  oldPrice: number,
  newPrice: number,
  userId: string
): Promise<void> {
  console.log('[NF525] logPriceChange - stub called', { productId, oldPrice, newPrice });
}

// Z Report types and functions
export interface DailyZReport {
  id: string;
  date: string;
  totalRevenue: number;
  totalCash: number;
  totalCard: number;
  orderCount: number;
  vatDetails: { rate: number; base: number; amount: number }[];
}

// Stub: génère un rapport Z vide
export async function generateZReport(restaurantId: string, date: string): Promise<DailyZReport | null> {
  console.log('[NF525] generateZReport - stub called', { restaurantId, date });
  return null;
}

// Stub: retourne liste vide de rapports Z
export async function getZReports(restaurantId: string, startDate?: string, endDate?: string): Promise<DailyZReport[]> {
  console.log('[NF525] getZReports - stub called', { restaurantId });
  return [];
}
