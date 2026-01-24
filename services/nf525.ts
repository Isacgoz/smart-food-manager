/**
 * Service NF525 - Conformité certification fiscale française
 *
 * Ce service gère:
 * - Numérotation factures inaltérable (côté serveur)
 * - Archivage factures 6 ans
 * - Z de caisse journalier
 * - Audit trail
 */

import { supabase } from './storage';
import { Order, Product } from '../shared/types';
import { logger } from '../shared/services/logger';

// =====================================================
// TYPES
// =====================================================

export interface ArchivedInvoice {
  id: string;
  company_id: string;
  invoice_number: string;
  year: number;
  sequence: number;
  created_at: string;
  server_timestamp: string;
  order_id: string;
  customer_info?: {
    name?: string;
    address?: string;
    siret?: string;
  };
  lines: InvoiceLine[];
  subtotal_ht: number;
  total_vat: number;
  total_ttc: number;
  payment_method: 'CASH' | 'CARD';
  restaurant_info: RestaurantLegalInfo;
  content_hash: string;
  previous_hash?: string;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  vat_rate: number;
  vat_amount: number;
  total_ttc: number;
}

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

export interface DailyZReport {
  id: string;
  company_id: string;
  report_date: string;
  report_number: string;
  created_at: string;
  closed_at?: string;
  total_sales: number;
  total_cash: number;
  total_card: number;
  total_vat: number;
  orders_count: number;
  cancelled_count: number;
  cancelled_amount: number;
  opening_cash?: number;
  closing_cash?: number;
  cash_difference?: number;
  vat_breakdown: Record<number, number>;
  content_hash: string;
  closed_by?: string;
}

// =====================================================
// HASH CALCULATION (Intégrité)
// =====================================================

async function calculateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// =====================================================
// NUMÉROTATION FACTURES (Serveur)
// =====================================================

/**
 * Obtient le prochain numéro de facture (appel Supabase RPC)
 * Garantit unicité et séquence continue
 */
export async function getNextInvoiceNumber(companyId: string): Promise<string | null> {
  if (!supabase) {
    logger.error('Supabase non configuré - impossible de générer numéro facture');
    return null;
  }

  try {
    const { data, error } = await supabase.rpc('get_next_invoice_number', {
      p_company_id: companyId
    });

    if (error) {
      logger.error('Erreur génération numéro facture', error);
      return null;
    }

    return data;
  } catch (err) {
    logger.error('Exception génération numéro facture', err as Error);
    return null;
  }
}

// =====================================================
// ARCHIVAGE FACTURE
// =====================================================

/**
 * Archive une facture de manière immutable
 * Conforme NF525: horodatage serveur, hash intégrité
 */
export async function archiveInvoice(
  companyId: string,
  order: Order,
  products: Product[],
  restaurantInfo: RestaurantLegalInfo,
  previousHash?: string
): Promise<ArchivedInvoice | null> {
  if (!supabase) {
    logger.error('Supabase non configuré - archivage impossible');
    return null;
  }

  try {
    // 1. Obtenir numéro facture serveur
    const invoiceNumber = await getNextInvoiceNumber(companyId);
    if (!invoiceNumber) {
      throw new Error('Impossible de générer numéro facture');
    }

    // 2. Parser numéro pour année et séquence
    const [yearStr, seqStr] = invoiceNumber.split('-');
    const year = parseInt(yearStr, 10);
    const sequence = parseInt(seqStr, 10);

    // 3. Calculer lignes facture
    const lines: InvoiceLine[] = order.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      const vatRate = product?.vatRate || 10;
      const totalTTC = item.price * item.quantity;
      const totalHT = totalTTC / (1 + vatRate / 100);
      const vatAmount = totalTTC - totalHT;

      return {
        description: item.name || product?.name || item.productId,
        quantity: item.quantity,
        unit_price_ht: Number((item.price / (1 + vatRate / 100)).toFixed(2)),
        total_ht: Number(totalHT.toFixed(2)),
        vat_rate: vatRate,
        vat_amount: Number(vatAmount.toFixed(2)),
        total_ttc: Number(totalTTC.toFixed(2))
      };
    });

    // 4. Calculer totaux
    const subtotalHT = lines.reduce((sum, l) => sum + l.total_ht, 0);
    const totalVAT = lines.reduce((sum, l) => sum + l.vat_amount, 0);
    const totalTTC = lines.reduce((sum, l) => sum + l.total_ttc, 0);

    // 5. Calculer hash intégrité
    const hashContent = JSON.stringify({
      invoice_number: invoiceNumber,
      order_id: order.id,
      lines,
      subtotal_ht: subtotalHT,
      total_vat: totalVAT,
      total_ttc: totalTTC,
      payment_method: order.paymentMethod,
      previous_hash: previousHash
    });
    const contentHash = await calculateHash(hashContent);

    // 6. Insérer dans archived_invoices
    const invoiceData = {
      company_id: companyId,
      invoice_number: invoiceNumber,
      year,
      sequence,
      order_id: order.id,
      lines,
      subtotal_ht: Number(subtotalHT.toFixed(2)),
      total_vat: Number(totalVAT.toFixed(2)),
      total_ttc: Number(totalTTC.toFixed(2)),
      payment_method: order.paymentMethod || 'CASH',
      restaurant_info: restaurantInfo,
      content_hash: contentHash,
      previous_hash: previousHash
    };

    const { data, error } = await supabase
      .from('archived_invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (error) {
      logger.error('Erreur archivage facture', error);
      return null;
    }

    logger.audit('ARCHIVE', 'INVOICE', invoiceNumber);
    return data as ArchivedInvoice;

  } catch (err) {
    logger.error('Exception archivage facture', err as Error);
    return null;
  }
}

// =====================================================
// Z DE CAISSE
// =====================================================

/**
 * Génère le rapport Z de caisse journalier
 */
export async function generateZReport(
  companyId: string,
  reportDate: Date,
  orders: Order[],
  products: Product[],
  openingCash?: number,
  closingCash?: number,
  closedBy?: string,
  previousZHash?: string
): Promise<DailyZReport | null> {
  if (!supabase) {
    logger.error('Supabase non configuré - Z report impossible');
    return null;
  }

  try {
    const dateStr = reportDate.toISOString().split('T')[0];

    // Filtrer commandes du jour
    const dayOrders = orders.filter(o =>
      o.status === 'COMPLETED' &&
      o.date.startsWith(dateStr)
    );

    const cancelledOrders = orders.filter(o =>
      o.status === 'CANCELLED' &&
      o.date.startsWith(dateStr)
    );

    // Calculer totaux
    const totalSales = dayOrders.reduce((sum, o) => sum + o.total, 0);
    const totalCash = dayOrders
      .filter(o => o.paymentMethod === 'CASH')
      .reduce((sum, o) => sum + o.total, 0);
    const totalCard = dayOrders
      .filter(o => o.paymentMethod === 'CARD')
      .reduce((sum, o) => sum + o.total, 0);

    // Calculer TVA par taux
    const vatBreakdown: Record<number, number> = {};
    dayOrders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const vatRate = product?.vatRate || 10;
        const totalTTC = item.price * item.quantity;
        const totalHT = totalTTC / (1 + vatRate / 100);
        const vatAmount = totalTTC - totalHT;

        vatBreakdown[vatRate] = (vatBreakdown[vatRate] || 0) + vatAmount;
      });
    });

    const totalVAT = Object.values(vatBreakdown).reduce((sum, v) => sum + v, 0);

    // Numéro Z (format: Z-YYYY-MM-DD)
    const reportNumber = `Z-${dateStr}`;

    // Écart caisse
    const cashDifference = (closingCash !== undefined && openingCash !== undefined)
      ? closingCash - (openingCash + totalCash)
      : undefined;

    // Hash intégrité
    const hashContent = JSON.stringify({
      report_number: reportNumber,
      report_date: dateStr,
      total_sales: totalSales,
      total_cash: totalCash,
      total_card: totalCard,
      total_vat: totalVAT,
      orders_count: dayOrders.length,
      previous_z_hash: previousZHash
    });
    const contentHash = await calculateHash(hashContent);

    // Données rapport
    const reportData = {
      company_id: companyId,
      report_date: dateStr,
      report_number: reportNumber,
      closed_at: new Date().toISOString(),
      total_sales: Number(totalSales.toFixed(2)),
      total_cash: Number(totalCash.toFixed(2)),
      total_card: Number(totalCard.toFixed(2)),
      total_vat: Number(totalVAT.toFixed(2)),
      orders_count: dayOrders.length,
      cancelled_count: cancelledOrders.length,
      cancelled_amount: Number(cancelledOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)),
      opening_cash: openingCash,
      closing_cash: closingCash,
      cash_difference: cashDifference !== undefined ? Number(cashDifference.toFixed(2)) : null,
      vat_breakdown: vatBreakdown,
      content_hash: contentHash,
      previous_z_hash: previousZHash,
      closed_by: closedBy
    };

    // Upsert (un seul Z par jour)
    const { data, error } = await supabase
      .from('daily_z_reports')
      .upsert(reportData, { onConflict: 'company_id,report_date' })
      .select()
      .single();

    if (error) {
      logger.error('Erreur génération Z report', error);
      return null;
    }

    logger.audit('GENERATE', 'Z_REPORT', reportNumber);
    return data as DailyZReport;

  } catch (err) {
    logger.error('Exception génération Z report', err as Error);
    return null;
  }
}

// =====================================================
// AUDIT PRIX
// =====================================================

/**
 * Log une modification de prix (conformité NF525)
 */
export async function logPriceChange(
  companyId: string,
  entityType: 'PRODUCT' | 'INGREDIENT',
  entityId: string,
  entityName: string,
  oldPrice: number | null,
  newPrice: number,
  changedBy?: string,
  reason?: string
): Promise<boolean> {
  if (!supabase) {
    logger.warn('Supabase non configuré - audit prix local seulement');
    return false;
  }

  try {
    const { error } = await supabase
      .from('price_audit_log')
      .insert({
        company_id: companyId,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        old_price: oldPrice,
        new_price: newPrice,
        changed_by: changedBy,
        reason
      });

    if (error) {
      logger.error('Erreur log prix', error);
      return false;
    }

    logger.audit('PRICE_CHANGE', entityType, entityId);
    return true;

  } catch (err) {
    logger.error('Exception log prix', err as Error);
    return false;
  }
}

// =====================================================
// RÉCUPÉRATION DONNÉES
// =====================================================

/**
 * Récupère les factures archivées
 */
export async function getArchivedInvoices(
  companyId: string,
  startDate?: string,
  endDate?: string
): Promise<ArchivedInvoice[]> {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('archived_invoices')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Erreur récupération factures', error);
      return [];
    }

    return data as ArchivedInvoice[];

  } catch (err) {
    logger.error('Exception récupération factures', err as Error);
    return [];
  }
}

/**
 * Récupère le dernier hash facture (pour chaînage)
 */
export async function getLastInvoiceHash(companyId: string): Promise<string | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('archived_invoices')
      .select('content_hash')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data?.content_hash || null;

  } catch {
    return null;
  }
}

/**
 * Récupère les Z reports
 */
export async function getZReports(
  companyId: string,
  limit = 30
): Promise<DailyZReport[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('daily_z_reports')
      .select('*')
      .eq('company_id', companyId)
      .order('report_date', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Erreur récupération Z reports', error);
      return [];
    }

    return data as DailyZReport[];

  } catch (err) {
    logger.error('Exception récupération Z reports', err as Error);
    return [];
  }
}

/**
 * Vérifie l'intégrité de la chaîne de factures
 */
export async function verifyInvoiceChainIntegrity(
  companyId: string
): Promise<{ valid: boolean; errors: string[] }> {
  const invoices = await getArchivedInvoices(companyId);
  const errors: string[] = [];

  if (invoices.length === 0) {
    return { valid: true, errors: [] };
  }

  // Trier par date croissante
  const sorted = [...invoices].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Vérifier chaînage
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = sorted[i - 1];

    if (current.previous_hash !== previous.content_hash) {
      errors.push(`Chaînage rompu: ${current.invoice_number} ne référence pas ${previous.invoice_number}`);
    }
  }

  // Vérifier séquence
  const byYear: Record<number, typeof sorted> = {};
  sorted.forEach(inv => {
    if (!byYear[inv.year]) byYear[inv.year] = [];
    byYear[inv.year].push(inv);
  });

  Object.entries(byYear).forEach(([year, yearInvoices]) => {
    yearInvoices.sort((a, b) => a.sequence - b.sequence);
    yearInvoices.forEach((inv, idx) => {
      const expected = idx + 1;
      if (inv.sequence !== expected) {
        errors.push(`${year}: Séquence brisée - attendu ${expected}, trouvé ${inv.sequence}`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
