/**
 * Script Test Monitoring Sentry
 * Usage: node scripts/test-monitoring.ts
 *
 * Teste capture erreurs + alertes business sans impacter production
 */

import {
  captureBusinessError,
  captureTechnicalError,
  trackMetric,
  trackEvent,
  businessAlerts,
} from '../shared/services/monitoring';
import type { User, Ingredient, Order } from '../shared/types';

// Mock données test
const testUser: User = {
  id: 'test-user-123',
  email: 'test@sentry-demo.com',
  name: 'Test Monitoring',
  role: 'MANAGER',
  pin: '0000',
  companyId: 'test-company',
  createdAt: new Date().toISOString(),
} as User;

const testIngredient: Ingredient = {
  id: 'ing-test-1',
  name: 'Pain Test',
  quantity: -5, // Stock négatif!
  unit: 'pièce',
  category: 'Boulangerie',
  averageCost: 0.35,
  supplier: 'Test Supplier',
} as Ingredient;

const testOrder: Order = {
  id: 'order-test-123',
  number: 42,
  items: [
    { productId: 'burger-test', quantity: 5, price: 9.90, name: 'Burger Test' },
  ],
  total: 49.50,
  status: 'PENDING',
  kitchenStatus: 'PENDING',
  date: new Date().toISOString(),
  userId: testUser.id,
} as Order;

/**
 * Test 1: Erreur business simple
 */
function testBusinessError() {
  console.log('\n🧪 Test 1: Erreur Business');

  const error = new Error('Test erreur business - Stock négatif simulé');

  captureBusinessError(error, {
    tags: {
      test: 'true',
      feature: 'stock_management',
    },
    extra: {
      ingredientId: testIngredient.id,
      ingredientName: testIngredient.name,
      stockValue: testIngredient.quantity,
    },
    user: {
      id: testUser.id,
      email: testUser.email,
      role: testUser.role,
    },
  });

  console.log('✅ Erreur business capturée (check Sentry dashboard)');
}

/**
 * Test 2: Erreur technique
 */
function testTechnicalError() {
  console.log('\n🧪 Test 2: Erreur Technique');

  const error = new Error('Test erreur technique - Timeout Supabase simulé');

  captureTechnicalError(error, {
    tags: {
      test: 'true',
      service: 'supabase',
      operation: 'sync',
    },
    extra: {
      companyId: 'test-company',
      timeout: 5000,
      retryAttempt: 3,
    },
  });

  console.log('✅ Erreur technique capturée');
}

/**
 * Test 3: Alerte stock négatif
 */
function testStockNegativeAlert() {
  console.log('\n🧪 Test 3: Alerte Stock Négatif');

  businessAlerts.stockNegative(testIngredient, testIngredient.quantity, testUser);

  console.log('✅ Alerte stock négatif envoyée');
}

/**
 * Test 4: Alerte écart caisse
 */
function testCashDiscrepancyAlert() {
  console.log('\n🧪 Test 4: Alerte Écart Caisse');

  const expected = 500.00;
  const actual = 445.50;
  const diff = actual - expected; // -54.50€

  businessAlerts.cashDiscrepancy(expected, actual, diff, testUser);

  console.log('✅ Alerte écart caisse envoyée (diff: -54.50€)');
}

/**
 * Test 5: Alerte stock insuffisant
 */
function testInsufficientStockAlert() {
  console.log('\n🧪 Test 5: Alerte Stock Insuffisant');

  const missingIngredients = [
    {
      name: 'Pain Test',
      required: 10,
      available: 2,
    },
    {
      name: 'Steak Test',
      required: 1.5,
      available: 0.3,
    },
  ];

  businessAlerts.insufficientStock(testOrder, missingIngredients);

  console.log('✅ Alerte stock insuffisant envoyée (2 ingrédients manquants)');
}

/**
 * Test 6: Alerte marge faible
 */
function testLowMarginAlert() {
  console.log('\n🧪 Test 6: Alerte Marge Faible');

  const productName = 'Burger Promo Test';
  const price = 5.00;
  const cost = 4.50;
  const marginRate = ((price - cost) / price) * 100; // 10%

  businessAlerts.lowMargin(productName, price, cost, marginRate);

  console.log(`✅ Alerte marge faible envoyée (${marginRate.toFixed(1)}%)`);
}

/**
 * Test 7: Métriques personnalisées
 */
function testCustomMetrics() {
  console.log('\n🧪 Test 7: Métriques Personnalisées');

  trackMetric({
    name: 'test_order_processing_time',
    value: 250,
    unit: 'millisecond',
    tags: {
      orderType: 'DINE_IN',
      test: 'true',
    },
  });

  trackMetric({
    name: 'test_stock_depletion_rate',
    value: 15.5,
    unit: 'percent',
    tags: {
      ingredient: 'Pain',
      test: 'true',
    },
  });

  console.log('✅ 2 métriques envoyées');
}

/**
 * Test 8: Événements utilisateur
 */
function testUserEvents() {
  console.log('\n🧪 Test 8: Événements Utilisateur');

  trackEvent('test_order_completed', {
    orderId: testOrder.id,
    total: testOrder.total,
    itemCount: testOrder.items.length,
    paymentMethod: 'CARD',
    test: true,
  });

  trackEvent('test_product_viewed', {
    productId: 'burger-test',
    productName: 'Burger Test',
    category: 'Burgers',
    test: true,
  });

  console.log('✅ 2 événements trackés');
}

/**
 * Main - Exécuter tous les tests
 */
async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║   🔍 Test Monitoring Sentry          ║');
  console.log('║   Smart Food Manager                 ║');
  console.log('╚══════════════════════════════════════╝');

  console.log('\n⚠️  IMPORTANT:');
  console.log('- Vérifier VITE_SENTRY_DSN configuré (.env)');
  console.log('- Toutes erreurs taggées test=true');
  console.log('- Vérifier dashboard Sentry après 30s\n');

  try {
    testBusinessError();
    await sleep(500);

    testTechnicalError();
    await sleep(500);

    testStockNegativeAlert();
    await sleep(500);

    testCashDiscrepancyAlert();
    await sleep(500);

    testInsufficientStockAlert();
    await sleep(500);

    testLowMarginAlert();
    await sleep(500);

    testCustomMetrics();
    await sleep(500);

    testUserEvents();

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   ✅ Tests Terminés                   ║');
    console.log('╚══════════════════════════════════════╝');
    console.log('\n📊 Check Sentry Dashboard:');
    console.log('   https://sentry.io/organizations/YOUR_ORG/issues/');
    console.log('\n🔍 Filtres:');
    console.log('   - tag.test:true');
    console.log('   - environment:development');
    console.log('\n⏱️  Attendre 30 secondes pour indexation\n');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Helper sleep
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Exécuter si script appelé directement
if (require.main === module) {
  main();
}

export {
  testBusinessError,
  testTechnicalError,
  testStockNegativeAlert,
  testCashDiscrepancyAlert,
  testInsufficientStockAlert,
  testLowMarginAlert,
  testCustomMetrics,
  testUserEvents,
};
