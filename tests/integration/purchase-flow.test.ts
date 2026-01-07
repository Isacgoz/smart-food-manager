import { describe, it, expect, beforeEach } from 'vitest';
import { calculatePMP, calculateProductCost } from '../../shared/services/business';
import type { Product, Ingredient, SupplierOrder, SupplierOrderItem, StockMovement } from '../../shared/types';

/**
 * TEST INTÉGRATION : FLUX ACHAT FOURNISSEUR COMPLET
 *
 * Commande Fournisseur → Réception → Mise à jour Stock → Recalcul PMP → Impact Coûts
 *
 * Ce test simule le flux métier critique complet:
 * 1. Créer commande fournisseur
 * 2. Réceptionner livraison
 * 3. Mise à jour stock automatique
 * 4. Recalcul PMP (Prix Moyen Pondéré)
 * 5. Impact sur coûts matière produits
 * 6. Traçabilité mouvements stock
 */
describe('Integration - Flux Achat Fournisseur Complet', () => {
  let ingredients: Ingredient[];
  let products: Product[];

  beforeEach(() => {
    // Setup données restaurant test
    ingredients = [
      {
        id: 'steak-hache',
        name: 'Steak haché',
        stock: 5, // 5kg en stock
        unit: 'kg',
        category: 'Viande',
        averageCost: 8.50, // PMP actuel 8.50€/kg
        minStock: 2
      },
      {
        id: 'pain-burger',
        name: 'Pain burger',
        stock: 50,
        unit: 'pièce',
        category: 'Boulangerie',
        averageCost: 0.35,
        minStock: 20
      },
      {
        id: 'fromage-cheddar',
        name: 'Fromage cheddar',
        stock: 30,
        unit: 'tranche',
        category: 'Laitier',
        averageCost: 0.42,
        minStock: 10
      }
    ];

    products = [
      {
        id: 'burger-classique',
        name: 'Burger Classique',
        price: 9.90,
        category: 'Burgers',
        description: 'Pain, steak 150g, fromage',
        available: true,
        imageUrl: '',
        recipe: [
          { ingredientId: 'pain-burger', quantity: 1 },
          { ingredientId: 'steak-hache', quantity: 0.150 }, // 150g
          { ingredientId: 'fromage-cheddar', quantity: 1 }
        ]
      }
    ];
  });

  it('flux complet : commande → réception → PMP → coûts produits', () => {
    // ========== ÉTAPE 1 : CRÉER COMMANDE FOURNISSEUR ==========
    const supplierOrder: SupplierOrder = {
      id: 'po-2026-001',
      supplierId: 'supplier-viandes-du-sud',
      orderNumber: 'PO-2026-00001',
      date: '2026-01-07',
      status: 'PENDING',
      items: [
        {
          ingredientId: 'steak-hache',
          quantity: 10, // Commander 10kg
          unitCost: 9.00, // Nouveau prix 9.00€/kg (augmentation)
          totalCost: 90.00
        }
      ],
      totalCost: 90.00,
      createdAt: '2026-01-07T08:00:00Z'
    };

    expect(supplierOrder.status).toBe('PENDING');
    expect(supplierOrder.totalCost).toBe(90.00);

    // ========== ÉTAPE 2 : RÉCEPTION LIVRAISON ==========
    // Simuler validation bon de réception
    const receivedOrder = { ...supplierOrder, status: 'RECEIVED' as const };
    expect(receivedOrder.status).toBe('RECEIVED');

    // ========== ÉTAPE 3 : CALCUL NOUVEAU PMP ==========
    const steakIngredient = ingredients.find(i => i.id === 'steak-hache')!;
    const orderItem = supplierOrder.items[0];

    const oldPMP = steakIngredient.averageCost;
    const oldStock = steakIngredient.stock;

    // Formule PMP: ((stock_actuel × PMP_ancien) + (qté_reçue × prix_unitaire)) / (stock_actuel + qté_reçue)
    const newPMP = calculatePMP(
      oldStock,
      oldPMP,
      orderItem.quantity,
      orderItem.unitCost
    );

    // (5 × 8.50) + (10 × 9.00) / (5 + 10) = (42.5 + 90) / 15 = 132.5 / 15 = 8.833€/kg
    expect(newPMP).toBeCloseTo(8.833, 3);
    expect(newPMP).toBeGreaterThan(oldPMP); // Prix a augmenté

    // ========== ÉTAPE 4 : MISE À JOUR STOCK ==========
    const newStock = oldStock + orderItem.quantity;
    expect(newStock).toBe(15); // 5 + 10 = 15kg

    // Mise à jour ingrédient
    const updatedIngredients = ingredients.map(ing =>
      ing.id === 'steak-hache'
        ? { ...ing, stock: newStock, averageCost: newPMP }
        : ing
    );

    const updatedSteak = updatedIngredients.find(i => i.id === 'steak-hache')!;
    expect(updatedSteak.stock).toBe(15);
    expect(updatedSteak.averageCost).toBeCloseTo(8.833, 3);

    // ========== ÉTAPE 5 : IMPACT SUR COÛT PRODUIT ==========
    const burger = products[0];

    // Coût AVANT réception (avec ancien PMP)
    const oldBurgerCost = calculateProductCost(burger, ingredients);
    // 0.35 (pain) + (0.150 × 8.50) + 0.42 (fromage) = 0.35 + 1.275 + 0.42 = 2.045€
    expect(oldBurgerCost).toBeCloseTo(2.045, 3);

    // Coût APRÈS réception (avec nouveau PMP)
    const newBurgerCost = calculateProductCost(burger, updatedIngredients);
    // 0.35 (pain) + (0.150 × 8.833) + 0.42 (fromage) = 0.35 + 1.325 + 0.42 = 2.095€
    expect(newBurgerCost).toBeCloseTo(2.095, 3);

    // Vérifier augmentation coût
    const costIncrease = newBurgerCost - oldBurgerCost;
    expect(costIncrease).toBeCloseTo(0.05, 2); // +0.05€ par burger

    // Impact sur marge
    const oldMargin = burger.price - oldBurgerCost;
    const newMargin = burger.price - newBurgerCost;
    const marginLoss = oldMargin - newMargin;

    expect(marginLoss).toBeCloseTo(0.05, 2); // Marge réduite de 0.05€

    // ========== ÉTAPE 6 : CRÉER MOUVEMENT STOCK ==========
    const stockMovement: StockMovement = {
      id: 'mov-001',
      ingredientId: orderItem.ingredientId,
      type: 'PURCHASE',
      quantity: orderItem.quantity,
      unitCost: orderItem.unitCost,
      date: receivedOrder.date,
      documentRef: receivedOrder.id,
      createdAt: new Date().toISOString()
    };

    expect(stockMovement.type).toBe('PURCHASE');
    expect(stockMovement.quantity).toBe(10); // Mouvement positif
    expect(stockMovement.unitCost).toBe(9.00);
    expect(stockMovement.documentRef).toBe('po-2026-001');

    console.log('✅ FLUX ACHAT FOURNISSEUR VALIDÉ');
    console.log('   Stock steak: 5kg → 15kg');
    console.log('   PMP steak: 8.50€ → ' + newPMP.toFixed(2) + '€');
    console.log('   Coût burger: ' + oldBurgerCost.toFixed(2) + '€ → ' + newBurgerCost.toFixed(2) + '€');
    console.log('   Perte marge: -' + marginLoss.toFixed(2) + '€/burger');
  });

  it('devrait calculer PMP correctement avec stock initial zéro', () => {
    // Simuler premier achat (stock vide)
    const emptyIngredient: Ingredient = {
      id: 'nouvel-ingredient',
      name: 'Nouvel ingrédient',
      stock: 0,
      unit: 'kg',
      category: 'Divers',
      averageCost: 0,
      minStock: 1
    };

    const firstPurchaseCost = 12.50;
    const firstPurchaseQty = 5;

    const newPMP = calculatePMP(
      emptyIngredient.stock,
      emptyIngredient.averageCost,
      firstPurchaseQty,
      firstPurchaseCost
    );

    // Avec stock = 0, PMP = prix d'achat
    expect(newPMP).toBe(12.50);
  });

  it('devrait gérer achat à prix inférieur (réduction PMP)', () => {
    const steakIngredient = ingredients.find(i => i.id === 'steak-hache')!;

    // Acheter 20kg à 7.50€/kg (prix promotionnel)
    const newPMP = calculatePMP(
      steakIngredient.stock, // 5kg
      steakIngredient.averageCost, // 8.50€
      20, // +20kg
      7.50 // Prix promo
    );

    // (5 × 8.50) + (20 × 7.50) / (5 + 20) = (42.5 + 150) / 25 = 7.70€/kg
    expect(newPMP).toBeCloseTo(7.70, 2);
    expect(newPMP).toBeLessThan(steakIngredient.averageCost); // Prix a baissé
  });

  it('devrait tracer tous mouvements stock d\'un ingrédient', () => {
    const movements: StockMovement[] = [];

    // Mouvement 1: Achat initial
    movements.push({
      id: 'mov-001',
      ingredientId: 'steak-hache',
      type: 'PURCHASE',
      quantity: 10,
      unitCost: 9.00,
      date: '2026-01-07',
      documentRef: 'po-2026-001',
      createdAt: '2026-01-07T08:00:00Z'
    });

    // Mouvement 2: Vente (déstockage)
    movements.push({
      id: 'mov-002',
      ingredientId: 'steak-hache',
      type: 'SALE',
      quantity: -0.300, // 2 burgers × 150g
      date: '2026-01-07',
      documentRef: 'order-001',
      createdAt: '2026-01-07T12:30:00Z'
    });

    // Mouvement 3: Nouvel achat
    movements.push({
      id: 'mov-003',
      ingredientId: 'steak-hache',
      type: 'PURCHASE',
      quantity: 15,
      unitCost: 8.80,
      date: '2026-01-10',
      documentRef: 'po-2026-002',
      createdAt: '2026-01-10T09:00:00Z'
    });

    // Vérifier traçabilité complète
    expect(movements).toHaveLength(3);

    const purchases = movements.filter(m => m.type === 'PURCHASE');
    const sales = movements.filter(m => m.type === 'SALE');

    expect(purchases).toHaveLength(2);
    expect(sales).toHaveLength(1);

    // Vérifier stock théorique
    const stockChange = movements.reduce((sum, m) => sum + m.quantity, 0);
    const theoreticalStock = 5 + stockChange; // Stock initial 5kg

    // 5 + 10 - 0.300 + 15 = 29.7kg
    expect(theoreticalStock).toBeCloseTo(29.7, 1);

    // Vérifier tous mouvements ont référence document
    movements.forEach(m => {
      expect(m.documentRef).toBeDefined();
      expect(m.documentRef).toMatch(/^(po-|order-)/);
    });
  });

  it('devrait calculer impact financier d\'une hausse fournisseur', () => {
    // Scénario: Fournisseur augmente prix de 10%
    const steakIngredient = ingredients.find(i => i.id === 'steak-hache')!;
    const burger = products[0];

    // Prix actuel
    const currentPMP = steakIngredient.averageCost; // 8.50€
    const currentBurgerCost = calculateProductCost(burger, ingredients);

    // Nouvelle commande avec hausse 10%
    const newPrice = currentPMP * 1.10; // 9.35€/kg
    const purchaseQty = 20;

    const newPMP = calculatePMP(
      steakIngredient.stock,
      currentPMP,
      purchaseQty,
      newPrice
    );

    // (5 × 8.50) + (20 × 9.35) / 25 = (42.5 + 187) / 25 = 9.18€/kg
    expect(newPMP).toBeCloseTo(9.18, 2);

    // Mise à jour ingredients
    const updatedIngredients = ingredients.map(ing =>
      ing.id === 'steak-hache' ? { ...ing, averageCost: newPMP } : ing
    );

    const newBurgerCost = calculateProductCost(burger, updatedIngredients);

    // Impact par burger
    const costIncrease = newBurgerCost - currentBurgerCost;
    const costIncreasePercent = (costIncrease / currentBurgerCost) * 100;

    expect(costIncrease).toBeGreaterThan(0);
    expect(costIncreasePercent).toBeCloseTo(5, 0); // ~5% d'augmentation

    // Impact sur CA mensuel (ex: 500 burgers/mois)
    const monthlyVolume = 500;
    const monthlyExtraCost = costIncrease * monthlyVolume;

    console.log('Impact hausse 10% fournisseur:');
    console.log('  Coût burger: +' + costIncrease.toFixed(2) + '€ (+' + costIncreasePercent.toFixed(1) + '%)');
    console.log('  Impact mensuel (500 burgers): +' + monthlyExtraCost.toFixed(2) + '€');

    expect(monthlyExtraCost).toBeGreaterThan(0);
  });

  it('devrait gérer commande multi-ingrédients avec PMP différents', () => {
    const supplierOrder: SupplierOrder = {
      id: 'po-2026-002',
      supplierId: 'supplier-metro',
      orderNumber: 'PO-2026-00002',
      date: '2026-01-08',
      status: 'RECEIVED',
      items: [
        {
          ingredientId: 'steak-hache',
          quantity: 15,
          unitCost: 8.80,
          totalCost: 132.00
        },
        {
          ingredientId: 'pain-burger',
          quantity: 100,
          unitCost: 0.32, // Prix baissé
          totalCost: 32.00
        },
        {
          ingredientId: 'fromage-cheddar',
          quantity: 50,
          unitCost: 0.45, // Prix augmenté
          totalCost: 22.50
        }
      ],
      totalCost: 186.50,
      createdAt: '2026-01-08T10:00:00Z'
    };

    // Calculer nouveaux PMP pour chaque ingrédient
    const updatedIngredients = ingredients.map(ing => {
      const orderItem = supplierOrder.items.find(item => item.ingredientId === ing.id);
      if (!orderItem) return ing;

      const newPMP = calculatePMP(
        ing.stock,
        ing.averageCost,
        orderItem.quantity,
        orderItem.unitCost
      );

      return {
        ...ing,
        stock: ing.stock + orderItem.quantity,
        averageCost: newPMP
      };
    });

    // Vérifier steak
    const updatedSteak = updatedIngredients.find(i => i.id === 'steak-hache')!;
    expect(updatedSteak.stock).toBe(20); // 5 + 15
    expect(updatedSteak.averageCost).toBeCloseTo(8.725, 3); // (5×8.50 + 15×8.80) / 20

    // Vérifier pain (baisse)
    const updatedPain = updatedIngredients.find(i => i.id === 'pain-burger')!;
    expect(updatedPain.stock).toBe(150); // 50 + 100
    expect(updatedPain.averageCost).toBeCloseTo(0.33, 2); // (50×0.35 + 100×0.32) / 150
    expect(updatedPain.averageCost).toBeLessThan(0.35); // Prix a baissé

    // Vérifier fromage (hausse)
    const updatedFromage = updatedIngredients.find(i => i.id === 'fromage-cheddar')!;
    expect(updatedFromage.stock).toBe(80); // 30 + 50
    expect(updatedFromage.averageCost).toBeCloseTo(0.44, 2); // (30×0.42 + 50×0.45) / 80
    expect(updatedFromage.averageCost).toBeGreaterThan(0.42); // Prix a augmenté

    // Impact global sur burger
    const burger = products[0];
    const oldCost = calculateProductCost(burger, ingredients);
    const newCost = calculateProductCost(burger, updatedIngredients);

    const costDelta = newCost - oldCost;
    console.log('Impact commande multi-ingrédients sur burger:');
    console.log('  Coût avant: ' + oldCost.toFixed(3) + '€');
    console.log('  Coût après: ' + newCost.toFixed(3) + '€');
    console.log('  Delta: ' + (costDelta >= 0 ? '+' : '') + costDelta.toFixed(3) + '€');

    // Delta devrait être proche de 0 (baisse pain compensée par hausse fromage et steak)
    expect(Math.abs(costDelta)).toBeLessThan(0.10); // <10 centimes
  });
});
