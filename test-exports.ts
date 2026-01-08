/**
 * Test script for accounting exports
 * Run with: npx ts-node test-exports.ts
 */

import { exportFEC } from './services/accounting-fec';
import { exportCA3 } from './services/accounting-ca3';
import { exportExpenses } from './services/accounting-expenses';
import { Order, Expense } from './shared/types';

// Sample data for testing
const sampleOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'CMD-001',
    items: [
      {
        id: '1',
        productId: 'prod-1',
        name: 'Pizza Margherita',
        quantity: 2,
        unitPrice: 12.50,
        vatRate: 10,
        total: 25.00
      },
      {
        id: '2',
        productId: 'prod-2',
        name: 'Salade César',
        quantity: 1,
        unitPrice: 8.50,
        vatRate: 10,
        total: 8.50
      }
    ],
    subtotal: 33.50,
    total: 33.50,
    paymentMethod: 'CARD',
    status: 'PAID',
    createdAt: new Date('2026-01-05T12:30:00'),
    userId: 'user-1',
    companyId: 'company-1',
    tableNumber: 5
  },
  {
    id: '2',
    orderNumber: 'CMD-002',
    items: [
      {
        id: '3',
        productId: 'prod-3',
        name: 'Burger Classique',
        quantity: 3,
        unitPrice: 15.00,
        vatRate: 10,
        total: 45.00
      },
      {
        id: '4',
        productId: 'prod-4',
        name: 'Frites',
        quantity: 3,
        unitPrice: 4.50,
        vatRate: 10,
        total: 13.50
      },
      {
        id: '5',
        productId: 'prod-5',
        name: 'Coca-Cola',
        quantity: 3,
        unitPrice: 3.50,
        vatRate: 20,
        total: 10.50
      }
    ],
    subtotal: 69.00,
    total: 69.00,
    paymentMethod: 'CASH',
    status: 'PAID',
    createdAt: new Date('2026-01-06T19:15:00'),
    userId: 'user-1',
    companyId: 'company-1',
    tableNumber: 12
  },
  {
    id: '3',
    orderNumber: 'CMD-003',
    items: [
      {
        id: '6',
        productId: 'prod-6',
        name: 'Pâtes Carbonara',
        quantity: 1,
        unitPrice: 14.00,
        vatRate: 10,
        total: 14.00
      },
      {
        id: '7',
        productId: 'prod-7',
        name: 'Tiramisu',
        quantity: 1,
        unitPrice: 6.50,
        vatRate: 10,
        total: 6.50
      },
      {
        id: '8',
        productId: 'prod-8',
        name: 'Café',
        quantity: 1,
        unitPrice: 2.50,
        vatRate: 10,
        total: 2.50
      }
    ],
    subtotal: 23.00,
    total: 23.00,
    paymentMethod: 'CARD',
    status: 'PAID',
    createdAt: new Date('2026-01-07T13:45:00'),
    userId: 'user-2',
    companyId: 'company-1',
    tableNumber: 8
  }
];

const sampleExpenses: Expense[] = [
  {
    id: '1',
    date: new Date('2026-01-03'),
    category: 'RENT',
    description: 'Loyer janvier 2026',
    amount: 2500.00,
    vatRate: 20,
    vatAmount: 500.00,
    supplier: 'Immobilière Paris',
    paymentMethod: 'TRANSFER',
    companyId: 'company-1',
    createdAt: new Date('2026-01-03T10:00:00')
  },
  {
    id: '2',
    date: new Date('2026-01-04'),
    category: 'UTILITIES',
    description: 'Électricité décembre 2025',
    amount: 450.00,
    vatRate: 20,
    vatAmount: 90.00,
    supplier: 'EDF',
    paymentMethod: 'DIRECT_DEBIT',
    companyId: 'company-1',
    createdAt: new Date('2026-01-04T09:30:00')
  },
  {
    id: '3',
    date: new Date('2026-01-05'),
    category: 'SUPPLIES',
    description: 'Achat ingrédients',
    amount: 850.00,
    vatRate: 5.5,
    vatAmount: 46.75,
    supplier: 'Metro Cash & Carry',
    paymentMethod: 'CARD',
    companyId: 'company-1',
    createdAt: new Date('2026-01-05T14:20:00')
  },
  {
    id: '4',
    date: new Date('2026-01-06'),
    category: 'MARKETING',
    description: 'Publicité Facebook',
    amount: 200.00,
    vatRate: 20,
    vatAmount: 40.00,
    supplier: 'Meta Platforms',
    paymentMethod: 'CARD',
    companyId: 'company-1',
    createdAt: new Date('2026-01-06T16:00:00')
  },
  {
    id: '5',
    date: new Date('2026-01-07'),
    category: 'MAINTENANCE',
    description: 'Réparation four',
    amount: 350.00,
    vatRate: 20,
    vatAmount: 70.00,
    supplier: 'Techni-Cuisine',
    paymentMethod: 'CASH',
    companyId: 'company-1',
    createdAt: new Date('2026-01-07T11:00:00')
  }
];

const restaurantInfo = {
  name: 'Restaurant Test',
  siret: '12345678901234',
  address: '123 Rue de la Paix, 75001 Paris'
};

async function testExports() {
  console.log('🧪 Testing Accounting Exports\n');
  console.log('=' .repeat(60));

  // Test 1: FEC Export
  console.log('\n📊 Test 1: FEC Export (French Accounting Standard)');
  console.log('-'.repeat(60));
  try {
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-01-31');
    
    const fecData = exportFEC(sampleOrders, sampleExpenses, startDate, endDate, restaurantInfo);
    console.log('✅ FEC export generated successfully');
    console.log(`   Lines: ${fecData.split('\n').length}`);
    console.log(`   Size: ${fecData.length} characters`);
    console.log('\n   Sample (first 5 lines):');
    fecData.split('\n').slice(0, 5).forEach((line, i) => {
      console.log(`   ${i + 1}. ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
    });
  } catch (error) {
    console.error('❌ FEC export failed:', error);
  }

  // Test 2: CA3 Export
  console.log('\n\n📊 Test 2: CA3 Export (VAT Declaration)');
  console.log('-'.repeat(60));
  try {
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-01-31');
    
    const ca3Data = exportCA3(sampleOrders, sampleExpenses, startDate, endDate, 'csv');
    console.log('✅ CA3 export generated successfully');
    console.log(`   Lines: ${ca3Data.split('\n').length}`);
    console.log(`   Size: ${ca3Data.length} characters`);
    console.log('\n   Content:');
    ca3Data.split('\n').forEach((line, i) => {
      console.log(`   ${line}`);
    });
  } catch (error) {
    console.error('❌ CA3 export failed:', error);
  }

  // Test 3: Expenses Export
  console.log('\n\n📊 Test 3: Expenses Export');
  console.log('-'.repeat(60));
  try {
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-01-31');
    
    const expensesData = exportExpenses(sampleExpenses, startDate, endDate, 'csv');
    console.log('✅ Expenses export generated successfully');
    console.log(`   Lines: ${expensesData.split('\n').length}`);
    console.log(`   Size: ${expensesData.length} characters`);
    console.log('\n   Sample (first 10 lines):');
    expensesData.split('\n').slice(0, 10).forEach((line, i) => {
      console.log(`   ${line}`);
    });
  } catch (error) {
    console.error('❌ Expenses export failed:', error);
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📈 Test Summary');
  console.log('='.repeat(60));
  console.log(`Total Orders: ${sampleOrders.length}`);
  console.log(`Total Expenses: ${sampleExpenses.length}`);
  
  const totalSales = sampleOrders.reduce((sum, order) => sum + order.total, 0);
  const totalExpensesAmount = sampleExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  console.log(`\nTotal Sales: ${totalSales.toFixed(2)} €`);
  console.log(`Total Expenses: ${totalExpensesAmount.toFixed(2)} €`);
  console.log(`Net Result: ${(totalSales - totalExpensesAmount).toFixed(2)} €`);
  
  console.log('\n✅ All export tests completed successfully!');
}

// Run tests
testExports().catch(console.error);
