/**
 * Tests unitaires - FEC Export Service
 * Validation conformité norme FEC (Article A47 A-1 LPF)
 */

import { describe, it, expect } from 'vitest';
import {
  generateFEC,
  generateFECFilename,
  validateFEC,
  PCG_ACCOUNTS,
  JOURNAL_CODES,
  type FECExportOptions,
} from '../../shared/services/fec-export';
import type { AppState, Order, Expense } from '../../shared/types';

describe('FEC Export - Génération fichier', () => {
  const mockOptions: FECExportOptions = {
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    companyName: 'Restaurant Test',
    siret: '12345678901234',
    exerciceStart: '2026-01-01',
    exerciceEnd: '2026-12-31',
  };

  const mockState: AppState = {
    users: [],
    ingredients: [],
    products: [],
    suppliers: [],
    tables: [],
    orders: [
      {
        id: 'order-1',
        items: [
          { productId: 'p1', name: 'Burger', quantity: 2, price: 9.90 },
          { productId: 'p2', name: 'Frites', quantity: 1, price: 3.50 },
        ],
        total: 23.30,
        status: 'COMPLETED',
        type: 'DINE_IN',
        paymentMethod: 'CASH',
        date: '2026-01-15T12:30:00Z',
        userId: 'user1',
        tableNumber: 5,
      },
      {
        id: 'order-2',
        items: [{ productId: 'p3', name: 'Salade', quantity: 1, price: 8.50 }],
        total: 8.50,
        status: 'COMPLETED',
        type: 'TAKEAWAY',
        paymentMethod: 'CARD',
        date: '2026-01-20T14:00:00Z',
        userId: 'user1',
      },
    ] as Order[],
    expenses: [
      {
        id: 'exp-1',
        description: 'Achat viande',
        amount: 500.00,
        category: 'SUPPLIES',
        date: '2026-01-10',
        isPaid: true,
        supplier: 'Boucherie Martin',
        invoiceNumber: 'FAC-2026-001',
      },
      {
        id: 'exp-2',
        description: 'Loyer janvier',
        amount: 1200.00,
        category: 'RENT',
        date: '2026-01-05',
        isPaid: true,
        supplier: 'SCI Immobilier',
        invoiceNumber: 'LOYER-01-2026',
      },
    ] as Expense[],
    invoices: [],
    _lastUpdatedAt: Date.now(),
    _version: 1,
  };

  it('devrait générer fichier FEC avec header correct', () => {
    const fec = generateFEC(mockState, mockOptions);
    const lines = fec.split('\n');
    
    expect(lines.length).toBeGreaterThan(1);
    
    const header = lines[0];
    expect(header).toContain('JournalCode');
    expect(header).toContain('EcritureNum');
    expect(header).toContain('CompteNum');
    expect(header).toContain('Debit');
    expect(header).toContain('Credit');
    
    // Vérifier 18 colonnes
    const columns = header.split('|');
    expect(columns).toHaveLength(18);
  });

  it('devrait générer écritures ventes avec 3 lignes par vente', () => {
    const fec = generateFEC(mockState, mockOptions);
    const lines = fec.split('\n').filter(l => l.trim());
    
    // Header + (2 ventes × 3 lignes) + (2 charges × 3 lignes) = 1 + 6 + 6 = 13
    expect(lines.length).toBe(13);
    
    // Vérifier journal VE présent
    const ventesLines = lines.filter(l => l.startsWith('VE|'));
    expect(ventesLines.length).toBe(6); // 2 ventes × 3 lignes
  });

  it('devrait calculer TVA 10% pour DINE_IN', () => {
    const fec = generateFEC(mockState, mockOptions);
    const lines = fec.split('\n');
    
    // Trouver ligne TVA collectée 10% pour order-1 (23.30€ TTC)
    const tvaLine = lines.find(l => 
      l.includes(PCG_ACCOUNTS.TVA_COLLECTEE_10) && 
      l.includes('order-1')
    );
    
    expect(tvaLine).toBeDefined();
    
    // TVA = 23.30 / 1.10 × 0.10 = 2.12€
    const columns = tvaLine!.split('|');
    const credit = parseFloat(columns[12]);
    expect(credit).toBeCloseTo(2.12, 2);
  });

  it('devrait calculer TVA 5.5% pour TAKEAWAY', () => {
    const fec = generateFEC(mockState, mockOptions);
    const lines = fec.split('\n');
    
    // Trouver ligne TVA collectée 5.5% pour order-2 (8.50€ TTC)
    const tvaLine = lines.find(l => 
      l.includes(PCG_ACCOUNTS.TVA_COLLECTEE_5_5) && 
      l.includes('order-2')
    );
    
    expect(tvaLine).toBeDefined();
    
    // TVA = 8.50 / 1.055 × 0.055 = 0.44€
    const columns = tvaLine!.split('|');
    const credit = parseFloat(columns[12]);
    expect(credit).toBeCloseTo(0.44, 2);
  });

  it('devrait utiliser compte Caisse pour paiement CASH', () => {
    const fec = generateFEC(mockState, mockOptions);
    const lines = fec.split('\n');
    
    const caisseLine = lines.find(l => 
      l.includes(PCG_ACCOUNTS.CAISSE) && 
      l.includes('order-1')
    );
    
    expect(caisseLine).toBeDefined();
    expect(caisseLine).toContain('Caisse');
  });

  it('devrait utiliser compte Banque pour paiement CARD', () => {
    const fec = generateFEC(mockState, mockOptions);
    const lines = fec.split('\n');
    
    const banqueLine = lines.find(l => 
      l.includes(PCG_ACCOUNTS.BANQUE) && 
      l.includes('order-2')
    );
    
    expect(banqueLine).toBeDefined();
    expect(banqueLine).toContain('Banque');
  });

  it('devrait générer écritures charges avec comptes PCG corrects', () => {
    const fec = generateFEC(mockState, mockOptions);
    const lines = fec.split('\n');
    
    // Vérifier charge SUPPLIES → compte 606400
    const suppliesLine = lines.find(l => 
      l.includes(PCG_ACCOUNTS.FOURNITURES) && 
      l.includes('Achat viande')
    );
    expect(suppliesLine).toBeDefined();
    
    // Vérifier charge RENT → compte 613000
    const rentLine = lines.find(l => 
      l.includes(PCG_ACCOUNTS.LOYER) && 
      l.includes('Loyer janvier')
    );
    expect(rentLine).toBeDefined();
  });

  it('devrait calculer TVA déductible 20% sur charges', () => {
    const fec = generateFEC(mockState, mockOptions);
    const lines = fec.split('\n');
    
    // Charge 500€ TTC → HT = 416.67€, TVA = 83.33€
    const tvaLine = lines.find(l => 
      l.includes(PCG_ACCOUNTS.TVA_DEDUCTIBLE) && 
      l.includes('Achat viande')
    );
    
    expect(tvaLine).toBeDefined();
    const columns = tvaLine!.split('|');
    const debit = parseFloat(columns[11]);
    expect(debit).toBeCloseTo(83.33, 2);
  });

  it('devrait filtrer commandes hors période', () => {
    const stateWithOldOrder: AppState = {
      ...mockState,
      orders: [
        ...mockState.orders,
        {
          id: 'order-old',
          items: [{ productId: 'p1', name: 'Test', quantity: 1, price: 10 }],
          total: 10,
          status: 'COMPLETED',
          type: 'DINE_IN',
          paymentMethod: 'CASH',
          date: '2025-12-15T12:00:00Z', // Hors période
          userId: 'user1',
        } as Order,
      ],
    };
    
    const fec = generateFEC(stateWithOldOrder, mockOptions);
    const lines = fec.split('\n');
    
    // Ne doit pas contenir order-old
    const oldOrderLine = lines.find(l => l.includes('order-old'));
    expect(oldOrderLine).toBeUndefined();
  });

  it('devrait ignorer commandes non COMPLETED', () => {
    const stateWithPendingOrder: AppState = {
      ...mockState,
      orders: [
        ...mockState.orders,
        {
          id: 'order-pending',
          items: [{ productId: 'p1', name: 'Test', quantity: 1, price: 10 }],
          total: 10,
          status: 'PENDING',
          type: 'DINE_IN',
          paymentMethod: 'CASH',
          date: '2026-01-15T12:00:00Z',
          userId: 'user1',
        } as Order,
      ],
    };
    
    const fec = generateFEC(stateWithPendingOrder, mockOptions);
    const lines = fec.split('\n');
    
    const pendingLine = lines.find(l => l.includes('order-pending'));
    expect(pendingLine).toBeUndefined();
  });
});

describe('FEC Export - Nom fichier', () => {
  it('devrait générer nom fichier conforme norme', () => {
    const siret = '12345678901234';
    const exerciceEnd = '2026-12-31';
    
    const filename = generateFECFilename(siret, exerciceEnd);
    
    // Format: SIREN (9 chiffres) + FEC + Date (YYYYMMDD) + .txt
    expect(filename).toBe('123456789FEC20261231.txt');
  });

  it('devrait extraire SIREN des 9 premiers chiffres SIRET', () => {
    const siret = '98765432109876';
    const exerciceEnd = '2026-06-30';
    
    const filename = generateFECFilename(siret, exerciceEnd);
    
    expect(filename).toBe('987654321FEC20260630.txt');
  });
});

describe('FEC Export - Validation', () => {
  it('devrait valider fichier FEC correct', () => {
    const validFEC = `JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLettre|DateLettre|ValidDate|Montantdevise|Idevise
VE|Journal des ventes|VE202601150001|20260115|530000|Caisse|||order-1|20260115|Vente sur place|23.30|0.00|||20260115||
VE|Journal des ventes|VE202601150001|20260115|707000|Ventes de marchandises|||order-1|20260115|Vente sur place|0.00|21.18|||20260115||
VE|Journal des ventes|VE202601150001|20260115|445711|TVA collectée 10%|||order-1|20260115|TVA 10% sur vente|0.00|2.12|||20260115||`;
    
    const result = validateFEC(validFEC);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('devrait détecter déséquilibre débit/crédit', () => {
    const unbalancedFEC = `JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLettre|DateLettre|ValidDate|Montantdevise|Idevise
VE|Journal des ventes|VE202601150001|20260115|530000|Caisse|||order-1|20260115|Vente|100.00|0.00|||20260115||
VE|Journal des ventes|VE202601150001|20260115|707000|Ventes|||order-1|20260115|Vente|0.00|50.00|||20260115||`;
    
    const result = validateFEC(unbalancedFEC);
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Déséquilibre');
  });

  it('devrait détecter nombre colonnes incorrect', () => {
    const invalidFEC = `JournalCode|JournalLib|EcritureNum
VE|Journal des ventes|VE001`;
    
    const result = validateFEC(invalidFEC);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('colonnes'))).toBe(true);
  });

  it('devrait détecter fichier vide', () => {
    const emptyFEC = '';
    
    const result = validateFEC(emptyFEC);
    
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('vide');
  });

  it('devrait tolérer différence arrondi 0.01€', () => {
    // Débit: 100.00, Crédit: 100.01 (diff 0.01€ acceptable)
    const fecWithRounding = `JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLettre|DateLettre|ValidDate|Montantdevise|Idevise
VE|Journal|VE001|20260115|530000|Caisse|||ref|20260115|Test|100.00|0.00|||20260115||
VE|Journal|VE001|20260115|707000|Ventes|||ref|20260115|Test|0.00|100.01|||20260115||`;
    
    const result = validateFEC(fecWithRounding);
    
    expect(result.valid).toBe(true);
  });
});

describe('FEC Export - Format dates', () => {
  const mockOptions: FECExportOptions = {
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    companyName: 'Test',
    siret: '12345678901234',
    exerciceStart: '2026-01-01',
    exerciceEnd: '2026-12-31',
  };

  const mockState: AppState = {
    users: [],
    ingredients: [],
    products: [],
    suppliers: [],
    tables: [],
    orders: [
      {
        id: 'order-1',
        items: [{ productId: 'p1', name: 'Test', quantity: 1, price: 10 }],
        total: 10,
        status: 'COMPLETED',
        type: 'DINE_IN',
        paymentMethod: 'CASH',
        date: '2026-01-15T12:30:45Z',
        userId: 'user1',
      } as Order,
    ],
    expenses: [],
    invoices: [],
    _lastUpdatedAt: Date.now(),
    _version: 1,
  };

  it('devrait formater dates au format YYYYMMDD', () => {
    const fec = generateFEC(mockState, mockOptions);
    const lines = fec.split('\n');
    
    const dataLine = lines[1]; // Première ligne de données
    const columns = dataLine.split('|');
    
    // EcritureDate (colonne 3)
    expect(columns[3]).toMatch(/^\d{8}$/);
    expect(columns[3]).toBe('20260115');
    
    // PieceDate (colonne 9)
    expect(columns[9]).toBe('20260115');
    
    // ValidDate (colonne 15)
    expect(columns[15]).toBe('20260115');
  });
});

describe('FEC Export - Numéros écriture', () => {
  const mockOptions: FECExportOptions = {
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    companyName: 'Test',
    siret: '12345678901234',
    exerciceStart: '2026-01-01',
    exerciceEnd: '2026-12-31',
  };

  const mockState: AppState = {
    users: [],
    ingredients: [],
    products: [],
    suppliers: [],
    tables: [],
    orders: [
      {
        id: 'order-1',
        items: [{ productId: 'p1', name: 'Test', quantity: 1, price: 10 }],
        total: 10,
        status: 'COMPLETED',
        type: 'DINE_IN',
        paymentMethod: 'CASH',
        date: '2026-01-15T12:00:00Z',
        userId: 'user1',
      } as Order,
      {
        id: 'order-2',
        items: [{ productId: 'p2', name: 'Test2', quantity: 1, price: 20 }],
        total: 20,
        status: 'COMPLETED',
        type: 'DINE_IN',
        paymentMethod: 'CASH',
        date: '2026-01-16T14:00:00Z',
        userId: 'user1',
      } as Order,
    ],
    expenses: [],
    invoices: [],
    _lastUpdatedAt: Date.now(),
    _version: 1,
  };

  it('devrait générer numéros écriture uniques et séquentiels', () => {
    const fec = generateFEC(mockState, mockOptions);
    const lines = fec.split('\n').filter(l => l.trim() && !l.startsWith('JournalCode'));
    
    const ecritureNums = lines.map(l => l.split('|')[2]);
    
    // Vérifier format: JournalCode + Date + Séquence
    ecritureNums.forEach(num => {
      expect(num).toMatch(/^[A-Z]{2}\d{8}\d{4}$/);
    });
    
    // Vérifier unicité par écriture (3 lignes par vente)
    expect(ecritureNums[0]).toBe(ecritureNums[1]); // Même écriture
    expect(ecritureNums[1]).toBe(ecritureNums[2]); // Même écriture
    expect(ecritureNums[3]).not.toBe(ecritureNums[0]); // Écriture différente
  });

  it('devrait incrémenter séquence pour chaque nouvelle écriture', () => {
    const fec = generateFEC(mockState, mockOptions);
    const lines = fec.split('\n').filter(l => l.trim() && !l.startsWith('JournalCode'));
    
    const ecriture1 = lines[0].split('|')[2];
    const ecriture2 = lines[3].split('|')[2]; // Nouvelle écriture (après 3 lignes)
    
    // Extraire séquences
    const seq1 = parseInt(ecriture1.slice(-4));
    const seq2 = parseInt(ecriture2.slice(-4));
    
    expect(seq2).toBe(seq1 + 1);
  });
});

describe('FEC Export - Équilibre comptable', () => {
  const mockOptions: FECExportOptions = {
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    companyName: 'Test',
    siret: '12345678901234',
    exerciceStart: '2026-01-01',
    exerciceEnd: '2026-12-31',
  };

  it('devrait équilibrer débit/crédit pour chaque écriture', () => {
    const mockState: AppState = {
      users: [],
      ingredients: [],
      products: [],
      suppliers: [],
      tables: [],
      orders: [
        {
          id: 'order-1',
          items: [{ productId: 'p1', name: 'Test', quantity: 1, price: 11.00 }],
          total: 11.00,
          status: 'COMPLETED',
          type: 'DINE_IN',
          paymentMethod: 'CASH',
          date: '2026-06-15T12:00:00Z',
          userId: 'user1',
        } as Order,
      ],
      expenses: [
        {
          id: 'exp-1',
          description: 'Test charge',
          amount: 120.00,
          category: 'SUPPLIES',
          date: '2026-06-10',
          isPaid: true,
          supplier: 'Fournisseur Test',
        } as Expense,
      ],
      invoices: [],
      _lastUpdatedAt: Date.now(),
      _version: 1,
    };
    
    const fec = generateFEC(mockState, mockOptions);
    const result = validateFEC(fec);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
