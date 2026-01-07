import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateInvoiceNumber,
  calculateVATLine,
  generateInvoice,
  validateInvoiceSequence,
  formatInvoicePDF,
  archiveInvoice,
  type InvoiceNumber,
  type LegalMentions,
  type Invoice
} from '../../shared/services/invoicing';
import type { Order } from '../../shared/types';

describe('Invoicing - Conformité NF525', () => {
  const legalMentions: LegalMentions = {
    companyName: 'Restaurant Test SARL',
    siret: '12345678901234',
    siren: '123456789',
    vatNumber: 'FR12345678901',
    address: '123 Rue de la Paix, 75001 Paris',
    capital: '10 000 EUR',
    rcs: 'Paris B 123 456 789'
  };

  describe('generateInvoiceNumber', () => {
    it('devrait générer première facture année en cours', () => {
      const currentYear = new Date().getFullYear();
      const invoiceNum = generateInvoiceNumber(null);

      expect(invoiceNum.year).toBe(currentYear);
      expect(invoiceNum.sequence).toBe(1);
      expect(invoiceNum.formatted).toBe(`${currentYear}-00001`);
    });

    it('devrait incrémenter séquence', () => {
      const lastInvoice: InvoiceNumber = {
        year: 2026,
        sequence: 42,
        formatted: '2026-00042'
      };

      const newInvoice = generateInvoiceNumber(lastInvoice);

      expect(newInvoice.year).toBe(2026);
      expect(newInvoice.sequence).toBe(43);
      expect(newInvoice.formatted).toBe('2026-00043');
    });

    it('devrait reset séquence à nouvelle année', () => {
      const lastInvoice: InvoiceNumber = {
        year: 2025,
        sequence: 999,
        formatted: '2025-00999'
      };

      // Mock année courante 2026
      const currentYear = new Date().getFullYear();
      if (currentYear > 2025) {
        const newInvoice = generateInvoiceNumber(lastInvoice);

        expect(newInvoice.year).toBe(currentYear);
        expect(newInvoice.sequence).toBe(1);
        expect(newInvoice.formatted).toBe(`${currentYear}-00001`);
      }
    });

    it('devrait formatter avec padding 5 chiffres', () => {
      const tests = [
        { seq: 1, expected: '00001' },
        { seq: 42, expected: '00042' },
        { seq: 999, expected: '00999' },
        { seq: 10000, expected: '10000' }
      ];

      tests.forEach(({ seq, expected }) => {
        const lastInvoice: InvoiceNumber = {
          year: 2026,
          sequence: seq - 1,
          formatted: `2026-${String(seq - 1).padStart(5, '0')}`
        };

        const newInvoice = generateInvoiceNumber(lastInvoice);
        const formatted = newInvoice.formatted.split('-')[1];

        expect(formatted).toBe(expected);
      });
    });
  });

  describe('calculateVATLine', () => {
    it('devrait calculer TVA 10% (consommation sur place)', () => {
      // Prix TTC = 11€, TVA 10%
      const line = calculateVATLine(11, 2, 10);

      expect(line.quantity).toBe(2);
      expect(line.unitPriceHT).toBe(10); // 11 / 1.10 = 10
      expect(line.totalHT).toBe(20); // 10 × 2
      expect(line.vatRate).toBe(10);
      expect(line.vatAmount).toBe(2); // 20 × 10%
      expect(line.totalTTC).toBe(22); // 20 + 2
    });

    it('devrait calculer TVA 5.5% (à emporter)', () => {
      // Prix TTC = 10.55€, TVA 5.5%
      const line = calculateVATLine(10.55, 1, 5.5);

      expect(line.unitPriceHT).toBe(10.00); // 10.55 / 1.055 ≈ 10
      expect(line.totalHT).toBe(10.00);
      expect(line.vatAmount).toBeCloseTo(0.55, 2); // 10 × 5.5%
      expect(line.totalTTC).toBeCloseTo(10.55, 2);
    });

    it('devrait calculer TVA 20% (alcools)', () => {
      // Prix TTC = 6€, TVA 20%
      const line = calculateVATLine(6, 3, 20);

      expect(line.unitPriceHT).toBe(5); // 6 / 1.20 = 5
      expect(line.totalHT).toBe(15); // 5 × 3
      expect(line.vatAmount).toBe(3); // 15 × 20%
      expect(line.totalTTC).toBe(18);
    });

    it('devrait reverse-calculer HT depuis TTC', () => {
      // Prix affiché client = 9.90€ TTC (TVA 10%)
      const line = calculateVATLine(9.90, 1, 10);

      const expectedHT = 9.90 / 1.10; // 9.00€
      expect(line.unitPriceHT).toBe(9.00);
      expect(line.totalHT).toBe(9.00);
      expect(line.vatAmount).toBeCloseTo(0.90, 2); // 9.00 × 10%
      expect(line.totalTTC).toBeCloseTo(9.90, 2);
    });
  });

  describe('generateInvoice', () => {
    it('devrait générer facture complète depuis commande', () => {
      const order: Order = {
        id: 'order123',
        items: [
          { productId: 'burger', quantity: 2, price: 10 },
          { productId: 'frites', quantity: 1, price: 3 }
        ],
        total: 23,
        status: 'COMPLETED',
        type: 'DINE_IN',
        paymentMethod: 'CARD',
        date: '2026-01-07',
        createdAt: '2026-01-07T12:00:00Z'
      };

      const lastInvoiceNumber: InvoiceNumber = {
        year: 2026,
        sequence: 41,
        formatted: '2026-00041'
      };

      const invoice = generateInvoice(
        order,
        {} as any, // restaurant profile pas utilisé actuellement
        legalMentions,
        lastInvoiceNumber
      );

      // Numéro facture
      expect(invoice.number.sequence).toBe(42);
      expect(invoice.number.formatted).toBe('2026-00042');
      expect(invoice.id).toBe('INV-2026-00042');

      // Métadonnées
      expect(invoice.orderId).toBe('order123');
      expect(invoice.paymentMethod).toBe('CARD');
      expect(invoice.restaurant).toEqual(legalMentions);

      // Lignes facture (TVA 10% DINE_IN)
      // Items: 2×10€ TTC + 1×3€ TTC = 23€ TTC total
      expect(invoice.lines).toHaveLength(2);
      expect(invoice.lines[0].totalHT).toBeCloseTo(18.18, 2); // 2 × (10/1.10)
      expect(invoice.lines[0].vatAmount).toBeCloseTo(1.82, 2); // 18.18 × 10%
      expect(invoice.lines[1].totalHT).toBeCloseTo(2.73, 2); // 1 × (3/1.10)

      // Totaux
      expect(invoice.subtotalHT).toBeCloseTo(20.91, 2); // 23 / 1.10
      expect(invoice.totalVAT).toBeCloseTo(2.09, 2); // 20.91 × 10%
      expect(invoice.totalTTC).toBeCloseTo(23.00, 2);

      // Archivage
      expect(invoice.isArchived).toBe(false);
      expect(invoice.archivedAt).toBeUndefined();
    });

    it('devrait utiliser TVA 5.5% pour TAKEAWAY', () => {
      const order: Order = {
        id: 'order456',
        items: [{ productId: 'burger', quantity: 1, price: 10 }],
        total: 10,
        status: 'COMPLETED',
        type: 'TAKEAWAY',
        paymentMethod: 'CASH',
        date: '2026-01-07',
        createdAt: '2026-01-07T12:00:00Z'
      };

      const invoice = generateInvoice(order, {} as any, legalMentions, null);

      expect(invoice.lines[0].vatRate).toBe(5.5);
      // 10€ TTC → 10/1.055 = 9.48€ HT → VAT = 0.52€
      expect(invoice.totalVAT).toBeCloseTo(0.52, 2);
      expect(invoice.totalTTC).toBeCloseTo(10.00, 2);
    });
  });

  describe('validateInvoiceSequence', () => {
    it('devrait valider séquence correcte', () => {
      const invoices: Invoice[] = [
        {
          id: 'inv1',
          number: { year: 2026, sequence: 1, formatted: '2026-00001' },
          date: '2026-01-05T10:00:00Z'
        } as Invoice,
        {
          id: 'inv2',
          number: { year: 2026, sequence: 2, formatted: '2026-00002' },
          date: '2026-01-06T11:00:00Z'
        } as Invoice,
        {
          id: 'inv3',
          number: { year: 2026, sequence: 3, formatted: '2026-00003' },
          date: '2026-01-07T12:00:00Z'
        } as Invoice
      ];

      const result = validateInvoiceSequence(invoices);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait détecter séquence brisée', () => {
      const invoices: Invoice[] = [
        {
          id: 'inv1',
          number: { year: 2026, sequence: 1, formatted: '2026-00001' },
          date: '2026-01-05T10:00:00Z'
        } as Invoice,
        {
          id: 'inv2',
          number: { year: 2026, sequence: 3, formatted: '2026-00003' }, // Saute 2
          date: '2026-01-06T11:00:00Z'
        } as Invoice
      ];

      const result = validateInvoiceSequence(invoices);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Séquence brisée');
      expect(result.errors[0]).toContain('attendu 2');
    });

    it('devrait détecter numéros en double', () => {
      const invoices: Invoice[] = [
        {
          id: 'inv1',
          number: { year: 2026, sequence: 1, formatted: '2026-00001' },
          date: '2026-01-05T10:00:00Z'
        } as Invoice,
        {
          id: 'inv2',
          number: { year: 2026, sequence: 1, formatted: '2026-00001' }, // Doublon
          date: '2026-01-06T11:00:00Z'
        } as Invoice
      ];

      const result = validateInvoiceSequence(invoices);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('double'))).toBe(true);
    });

    it('devrait valider séquence multi-années', () => {
      const invoices: Invoice[] = [
        // 2025
        {
          id: 'inv1',
          number: { year: 2025, sequence: 1, formatted: '2025-00001' },
          date: '2025-12-30T10:00:00Z'
        } as Invoice,
        {
          id: 'inv2',
          number: { year: 2025, sequence: 2, formatted: '2025-00002' },
          date: '2025-12-31T11:00:00Z'
        } as Invoice,
        // 2026 (reset)
        {
          id: 'inv3',
          number: { year: 2026, sequence: 1, formatted: '2026-00001' },
          date: '2026-01-01T12:00:00Z'
        } as Invoice,
        {
          id: 'inv4',
          number: { year: 2026, sequence: 2, formatted: '2026-00002' },
          date: '2026-01-02T13:00:00Z'
        } as Invoice
      ];

      const result = validateInvoiceSequence(invoices);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait valider liste vide', () => {
      const result = validateInvoiceSequence([]);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('formatInvoicePDF', () => {
    it('devrait formatter facture en texte', () => {
      const invoice: Invoice = {
        id: 'INV-2026-00042',
        number: { year: 2026, sequence: 42, formatted: '2026-00042' },
        date: '2026-01-07T14:30:00Z',
        restaurant: legalMentions,
        lines: [
          {
            description: 'Burger Classique',
            quantity: 2,
            unitPriceHT: 10,
            totalHT: 20,
            vatRate: 10,
            vatAmount: 2,
            totalTTC: 22
          },
          {
            description: 'Frites',
            quantity: 1,
            unitPriceHT: 3,
            totalHT: 3,
            vatRate: 10,
            vatAmount: 0.30,
            totalTTC: 3.30
          }
        ],
        subtotalHT: 23,
        totalVAT: 2.30,
        totalTTC: 25.30,
        paymentMethod: 'CARD',
        orderId: 'order123',
        isArchived: false
      };

      const pdf = formatInvoicePDF(invoice);

      // Vérifier structure
      expect(pdf).toContain('FACTURE');
      expect(pdf).toContain('2026-00042');
      expect(pdf).toContain('SIRET: 12345678901234');
      expect(pdf).toContain('N° TVA: FR12345678901');
      expect(pdf).toContain('Restaurant Test SARL');

      // Lignes
      expect(pdf).toContain('Burger Classique x 2');
      expect(pdf).toContain('10.00€ HT × 2 = 20.00€ HT');
      expect(pdf).toContain('TVA 10%: 2.00€');

      // Totaux
      expect(pdf).toContain('Total HT:        23.00 €');
      expect(pdf).toContain('TVA:             2.30 €');
      expect(pdf).toContain('Total TTC:       25.30 €');

      // Paiement
      expect(pdf).toContain('Carte Bancaire');

      // Mentions légales
      expect(pdf).toContain('Mentions légales obligatoires');
    });

    it('devrait inclure toutes mentions légales obligatoires', () => {
      const invoice: Invoice = {
        id: 'INV-2026-00001',
        number: { year: 2026, sequence: 1, formatted: '2026-00001' },
        date: '2026-01-07T14:30:00Z',
        restaurant: legalMentions,
        lines: [],
        subtotalHT: 0,
        totalVAT: 0,
        totalTTC: 0,
        paymentMethod: 'CASH',
        orderId: 'o1',
        isArchived: false
      };

      const pdf = formatInvoicePDF(invoice);

      expect(pdf).toContain('SIRET:');
      expect(pdf).toContain('N° TVA:');
      expect(pdf).toContain('RCS:');
      expect(pdf).toContain('Capital:');
      expect(pdf).toContain(legalMentions.address);
    });
  });

  describe('archiveInvoice', () => {
    it('devrait marquer facture comme archivée', () => {
      const invoice: Invoice = {
        id: 'INV-2026-00042',
        number: { year: 2026, sequence: 42, formatted: '2026-00042' },
        date: '2026-01-07T14:30:00Z',
        restaurant: legalMentions,
        lines: [],
        subtotalHT: 23,
        totalVAT: 2.30,
        totalTTC: 25.30,
        paymentMethod: 'CARD',
        orderId: 'order123',
        isArchived: false
      };

      const archived = archiveInvoice(invoice);

      expect(archived.isArchived).toBe(true);
      expect(archived.archivedAt).toBeDefined();
      expect(new Date(archived.archivedAt!).getTime()).toBeLessThanOrEqual(Date.now());

      // Préserver données originales
      expect(archived.id).toBe(invoice.id);
      expect(archived.number).toEqual(invoice.number);
      expect(archived.totalTTC).toBe(invoice.totalTTC);
    });
  });

  describe('Conformité NF525 - Intégrité', () => {
    it('devrait empêcher modification numéro après génération', () => {
      const invoice: Invoice = {
        id: 'INV-2026-00042',
        number: { year: 2026, sequence: 42, formatted: '2026-00042' },
        date: '2026-01-07T14:30:00Z',
        restaurant: legalMentions,
        lines: [],
        subtotalHT: 23,
        totalVAT: 2.30,
        totalTTC: 25.30,
        paymentMethod: 'CARD',
        orderId: 'order123',
        isArchived: false
      };

      // Tentative modification
      const modified = { ...invoice };
      modified.number.sequence = 999;
      modified.number.formatted = '2026-00999';

      // Validation devrait échouer
      const result = validateInvoiceSequence([invoice, modified]);
      expect(result.valid).toBe(false);
    });

    it('devrait garantir horodatage cohérent', () => {
      const order: Order = {
        id: 'order123',
        items: [{ productId: 'burger', quantity: 1, price: 10 }],
        total: 10,
        status: 'COMPLETED',
        type: 'DINE_IN',
        paymentMethod: 'CARD',
        date: '2026-01-07',
        createdAt: '2026-01-07T12:00:00Z'
      };

      const before = Date.now();
      const invoice = generateInvoice(order, {} as any, legalMentions, null);
      const after = Date.now();

      const invoiceTime = new Date(invoice.date).getTime();

      expect(invoiceTime).toBeGreaterThanOrEqual(before);
      expect(invoiceTime).toBeLessThanOrEqual(after);
    });
  });
});
