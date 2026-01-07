import { describe, it, expect, beforeEach } from 'vitest';
import { validateStockBeforeOrder, destockIngredients, calculateProductCost } from '../../shared/services/business';
import { generateInvoice, generateInvoiceNumber } from '../../shared/services/invoicing';
import type { Product, Ingredient, OrderItem, Order, LegalMentions } from '../../shared/types';

/**
 * TEST INTÉGRATION : FLUX VENTE COMPLET
 *
 * POS → Validation Stock → Déstockage → Facture NF525
 *
 * Ce test simule le flux métier critique complet:
 * 1. Client commande 2 burgers
 * 2. Validation stock disponible
 * 3. Création commande
 * 4. Déstockage automatique ingrédients
 * 5. Génération facture conforme NF525
 */
describe('Integration - Flux Vente Complet (POS → Stock → Facture)', () => {
  let products: Product[];
  let ingredients: Ingredient[];
  let legalMentions: LegalMentions;

  beforeEach(() => {
    // Setup données restaurant test
    products = [
      {
        id: 'burger-classique',
        name: 'Burger Classique',
        price: 9.90,
        category: 'Burgers',
        description: 'Pain, steak 150g, fromage, oignons, tomate',
        available: true,
        imageUrl: '',
        recipe: [
          { ingredientId: 'pain-burger', quantity: 1 },
          { ingredientId: 'steak-hache', quantity: 0.150 }, // 150g
          { ingredientId: 'fromage-cheddar', quantity: 1 },
          { ingredientId: 'oignons', quantity: 0.020 }, // 20g
          { ingredientId: 'tomate', quantity: 0.050 }, // 50g
          { ingredientId: 'sauce-burger', quantity: 0.030 } // 30mL
        ]
      },
      {
        id: 'frites',
        name: 'Frites',
        price: 3.50,
        category: 'Accompagnements',
        available: true,
        imageUrl: '',
        recipe: [
          { ingredientId: 'pommes-terre', quantity: 0.200 } // 200g
        ]
      }
    ];

    ingredients = [
      { id: 'pain-burger', name: 'Pain burger', stock: 50, unit: 'pièce', category: 'Boulangerie', averageCost: 0.35, minStock: 20 },
      { id: 'steak-hache', name: 'Steak haché', stock: 5, unit: 'kg', category: 'Viande', averageCost: 8.50, minStock: 2 },
      { id: 'fromage-cheddar', name: 'Fromage cheddar', stock: 30, unit: 'tranche', category: 'Laitier', averageCost: 0.42, minStock: 10 },
      { id: 'oignons', name: 'Oignons', stock: 2, unit: 'kg', category: 'Légumes', averageCost: 2.20, minStock: 0.5 },
      { id: 'tomate', name: 'Tomate', stock: 3, unit: 'kg', category: 'Légumes', averageCost: 3.80, minStock: 1 },
      { id: 'sauce-burger', name: 'Sauce burger', stock: 1.5, unit: 'L', category: 'Sauces', averageCost: 6.50, minStock: 0.5 },
      { id: 'pommes-terre', name: 'Pommes de terre', stock: 20, unit: 'kg', category: 'Légumes', averageCost: 2.00, minStock: 5 }
    ];

    legalMentions = {
      companyName: 'Le Burger Express SARL',
      siret: '12345678901234',
      siren: '123456789',
      vatNumber: 'FR12345678901',
      address: '123 Avenue des Champs, 75008 Paris',
      capital: '5 000 EUR',
      rcs: 'Paris B 123 456 789'
    };
  });

  it('flux complet : commande → validation → déstockage → facture', () => {
    // ========== ÉTAPE 1 : CLIENT COMMANDE ==========
    const orderItems: OrderItem[] = [
      { productId: 'burger-classique', quantity: 2, price: 9.90 },
      { productId: 'frites', quantity: 1, price: 3.50 }
    ];

    const orderTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    expect(orderTotal).toBe(23.30); // 19.80 + 3.50

    // ========== ÉTAPE 2 : VALIDATION STOCK DISPONIBLE ==========
    const stockValidation = validateStockBeforeOrder(orderItems, products, ingredients);

    expect(stockValidation.valid).toBe(true);
    expect(stockValidation.errors).toHaveLength(0);

    // Vérifier stock avant
    expect(ingredients.find(i => i.id === 'pain-burger')!.stock).toBe(50);
    expect(ingredients.find(i => i.id === 'steak-hache')!.stock).toBe(5);

    // ========== ÉTAPE 3 : CRÉATION COMMANDE ==========
    const order: Order = {
      id: 'order-2026-001',
      number: '2026-00001',
      items: orderItems,
      total: orderTotal,
      status: 'PENDING',
      type: 'DINE_IN',
      paymentMethod: 'CARD',
      userId: 'user-server-1',
      tableId: 'table-5',
      date: '2026-01-07',
      createdAt: '2026-01-07T14:30:00Z',
      kitchenStatus: 'PENDING'
    };

    expect(order.status).toBe('PENDING');
    expect(order.type).toBe('DINE_IN');

    // ========== ÉTAPE 4 : DÉSTOCKAGE AUTOMATIQUE ==========
    const destockResult = destockIngredients(orderItems, products, ingredients, order.id);

    // Vérifier stock après déstockage
    const newPainStock = destockResult.updatedIngredients.find(i => i.id === 'pain-burger')!.stock;
    const newSteakStock = destockResult.updatedIngredients.find(i => i.id === 'steak-hache')!.stock;
    const newFromageStock = destockResult.updatedIngredients.find(i => i.id === 'fromage-cheddar')!.stock;

    expect(newPainStock).toBe(48); // 50 - (2 burgers × 1)
    expect(newSteakStock).toBeCloseTo(4.7, 2); // 5 - (2 × 0.150)
    expect(newFromageStock).toBe(28); // 30 - (2 × 1)

    // Vérifier mouvements créés
    expect(destockResult.movements.length).toBeGreaterThan(0);
    const painMovement = destockResult.movements.find(m => m.ingredientId === 'pain-burger');
    expect(painMovement).toBeDefined();
    expect(painMovement!.type).toBe('SALE');
    expect(painMovement!.quantity).toBe(-2);
    expect(painMovement!.documentRef).toBe(order.id);

    // ========== ÉTAPE 5 : CALCUL COÛT MATIÈRE ==========
    const burger = products.find(p => p.id === 'burger-classique')!;
    const burgerCost = calculateProductCost(burger, ingredients);

    // Coût burger = 0.35 + 1.275 + 0.42 + 0.044 + 0.190 + 0.195 = 2.474€
    expect(burgerCost).toBeCloseTo(2.474, 2);

    const totalMaterialCost = (burgerCost * 2) + (0.40 * 1); // 2 burgers + 1 frites
    const grossMargin = orderTotal - totalMaterialCost;
    const marginRate = (grossMargin / orderTotal) * 100;

    expect(totalMaterialCost).toBeCloseTo(5.35, 2); // (2.474 × 2) + 0.40
    expect(grossMargin).toBeCloseTo(17.95, 2); // 23.30 - 5.35
    expect(marginRate).toBeGreaterThan(75); // 77% marge = excellent

    // ========== ÉTAPE 6 : GÉNÉRATION FACTURE NF525 ==========
    const invoice = generateInvoice(order, {} as any, legalMentions, null);

    // Vérifier numérotation séquentielle
    expect(invoice.number.sequence).toBe(1);
    expect(invoice.number.formatted).toMatch(/^\d{4}-\d{5}$/); // Format YYYY-00001

    // Vérifier TVA (10% DINE_IN)
    // Total TTC = 23.30€ → HT = 23.30 / 1.10 = 21.18€
    expect(invoice.subtotalHT).toBeCloseTo(21.18, 2);
    expect(invoice.totalVAT).toBeCloseTo(2.12, 2); // 21.18 × 10%
    expect(invoice.totalTTC).toBeCloseTo(23.30, 2);

    // Vérifier mentions légales
    expect(invoice.restaurant).toEqual(legalMentions);
    expect(invoice.restaurant.siret).toBe('12345678901234');
    expect(invoice.restaurant.vatNumber).toBe('FR12345678901');

    // Vérifier traçabilité
    expect(invoice.orderId).toBe(order.id);
    expect(invoice.paymentMethod).toBe('CARD');
    expect(invoice.isArchived).toBe(false);

    console.log('✅ FLUX VENTE COMPLET VALIDÉ');
    console.log('   Stock pain: 50 → ' + newPainStock);
    console.log('   Stock steak: 5kg → ' + newSteakStock.toFixed(2) + 'kg');
    console.log('   Coût matière: ' + totalMaterialCost.toFixed(2) + '€');
    console.log('   Marge brute: ' + grossMargin.toFixed(2) + '€ (' + marginRate.toFixed(1) + '%)');
    console.log('   Facture N°: ' + invoice.number.formatted);
  });

  it('devrait bloquer vente si stock insuffisant', () => {
    // Simuler stock bas
    const lowStockIngredients = [...ingredients];
    const steakIndex = lowStockIngredients.findIndex(i => i.id === 'steak-hache');
    lowStockIngredients[steakIndex].stock = 0.100; // Seulement 100g dispo

    // Tenter commander 2 burgers (300g requis)
    const orderItems: OrderItem[] = [
      { productId: 'burger-classique', quantity: 2, price: 9.90 }
    ];

    const stockValidation = validateStockBeforeOrder(orderItems, products, lowStockIngredients);

    expect(stockValidation.valid).toBe(false);
    expect(stockValidation.errors.length).toBeGreaterThan(0);
    expect(stockValidation.errors[0]).toContain('Stock insuffisant');
    expect(stockValidation.errors[0]).toContain('Steak haché');
  });

  it('devrait calculer correctement avec commande multiple articles', () => {
    // Grosse commande
    const orderItems: OrderItem[] = [
      { productId: 'burger-classique', quantity: 5, price: 9.90 },
      { productId: 'frites', quantity: 5, price: 3.50 }
    ];

    const stockValidation = validateStockBeforeOrder(orderItems, products, ingredients);
    expect(stockValidation.valid).toBe(true);

    const destockResult = destockIngredients(orderItems, products, ingredients, 'order-big');

    // 5 burgers = 5 pains
    const newPainStock = destockResult.updatedIngredients.find(i => i.id === 'pain-burger')!.stock;
    expect(newPainStock).toBe(45); // 50 - 5

    // 5 burgers = 750g steak (5 × 150g)
    const newSteakStock = destockResult.updatedIngredients.find(i => i.id === 'steak-hache')!.stock;
    expect(newSteakStock).toBeCloseTo(4.25, 2); // 5 - 0.75

    // 5 frites = 1kg pommes terre (5 × 200g)
    const newPommesStock = destockResult.updatedIngredients.find(i => i.id === 'pommes-terre')!.stock;
    expect(newPommesStock).toBe(19); // 20 - 1
  });

  it('devrait gérer correctement changement PMP après achat', () => {
    // Stock initial steak: 5kg @ 8.50€/kg
    const currentSteak = ingredients.find(i => i.id === 'steak-hache')!;
    expect(currentSteak.averageCost).toBe(8.50);

    // Simuler achat fournisseur: +10kg @ 9.00€/kg
    const newStock = currentSteak.stock + 10;
    const newPMP = ((currentSteak.stock * currentSteak.averageCost) + (10 * 9.00)) / newStock;

    expect(newPMP).toBeCloseTo(8.83, 2); // (5×8.50 + 10×9.00) / 15

    // Mettre à jour ingrédient
    const updatedIngredients = [...ingredients];
    const steakIndex = updatedIngredients.findIndex(i => i.id === 'steak-hache');
    updatedIngredients[steakIndex] = {
      ...currentSteak,
      stock: newStock,
      averageCost: newPMP
    };

    // Calculer nouveau coût burger avec PMP mis à jour
    const burger = products.find(p => p.id === 'burger-classique')!;
    const newBurgerCost = calculateProductCost(burger, updatedIngredients);

    // Ancien coût: 2.045€
    // Nouveau coût: 0.35 + (0.150 × 8.83) + 0.42 + 0.044 + 0.19 + 0.195 = 2.52€
    expect(newBurgerCost).toBeGreaterThan(2.045);
    expect(newBurgerCost).toBeCloseTo(2.52, 1);
  });

  it('devrait générer numéros facture séquentiels', () => {
    const order1: Order = {
      id: 'o1',
      items: [{ productId: 'burger-classique', quantity: 1, price: 9.90 }],
      total: 9.90,
      status: 'COMPLETED',
      type: 'DINE_IN',
      paymentMethod: 'CASH',
      date: '2026-01-07',
      createdAt: '2026-01-07T10:00:00Z'
    };

    const order2: Order = {
      id: 'o2',
      items: [{ productId: 'frites', quantity: 1, price: 3.50 }],
      total: 3.50,
      status: 'COMPLETED',
      type: 'TAKEAWAY',
      paymentMethod: 'CARD',
      date: '2026-01-07',
      createdAt: '2026-01-07T11:00:00Z'
    };

    // Première facture
    const invoice1 = generateInvoice(order1, {} as any, legalMentions, null);
    expect(invoice1.number.sequence).toBe(1);
    expect(invoice1.number.formatted).toMatch(/2026-00001/);

    // Deuxième facture (incrément)
    const invoice2 = generateInvoice(order2, {} as any, legalMentions, invoice1.number);
    expect(invoice2.number.sequence).toBe(2);
    expect(invoice2.number.formatted).toMatch(/2026-00002/);

    // Vérifier pas de doublon
    expect(invoice1.number.formatted).not.toBe(invoice2.number.formatted);
  });

  it('devrait tracer tous mouvements de stock', () => {
    const orderItems: OrderItem[] = [
      { productId: 'burger-classique', quantity: 1, price: 9.90 }
    ];

    const destockResult = destockIngredients(orderItems, products, ingredients, 'order-trace');

    // 1 burger = 6 ingrédients dans la recette
    expect(destockResult.movements).toHaveLength(6);

    // Vérifier chaque mouvement a les champs requis
    destockResult.movements.forEach(movement => {
      expect(movement.id).toBeDefined();
      expect(movement.ingredientId).toBeDefined();
      expect(movement.type).toBe('SALE');
      expect(movement.quantity).toBeLessThan(0); // Déstockage = négatif
      expect(movement.documentRef).toBe('order-trace');
      expect(movement.date).toBeDefined();
    });

    // Vérifier quantités déduites correctes
    const painMovement = destockResult.movements.find(m => m.ingredientId === 'pain-burger');
    const steakMovement = destockResult.movements.find(m => m.ingredientId === 'steak-hache');

    expect(painMovement!.quantity).toBe(-1); // 1 pain
    expect(steakMovement!.quantity).toBe(-0.150); // 150g
  });
});
