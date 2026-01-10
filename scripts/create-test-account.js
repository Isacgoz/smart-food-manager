/**
 * Script de création compte test avec données complètes
 * Usage: node scripts/create-test-account.js
 */

const SAAS_DB_KEY = 'SMART_FOOD_SAAS_MASTER_DB';

// Compte test
const testAccount = {
  email: 'test@smartfood.com',
  password: 'test1234', // À changer en production
  profile: {
    id: 'dGVzdEBzbWFydGZvb2QuY29t', // base64 de l'email
    name: 'Restaurant Test - La Bonne Bouffe',
    ownerEmail: 'test@smartfood.com',
    plan: 'BUSINESS',
    createdAt: new Date().toISOString(),
    stockPolicy: 'WARN'
  }
};

// État initial avec données de démo
const initialState = {
  users: [
    {
      id: '1',
      name: 'Admin Test',
      pin: '1234',
      pinHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', // SHA256 de '1234'
      role: 'OWNER',
      email: 'test@smartfood.com'
    },
    {
      id: '2',
      name: 'Serveur 1',
      pin: '2222',
      pinHash: 'ed968e840d10d2d313a870bc131a4e2c311d7ad09bdf32b3418c8ca9fb1d89e9', // SHA256 de '2222'
      role: 'SERVER',
      email: 'serveur1@smartfood.com'
    }
  ],
  ingredients: [
    // Pains
    { id: 'ing-1', name: 'Pain burger', category: 'Pains', unit: 'piece', stock: 100, minStock: 20, avgPrice: 0.35 },
    { id: 'ing-2', name: 'Pain panini', category: 'Pains', unit: 'piece', stock: 80, minStock: 15, avgPrice: 0.40 },

    // Viandes
    { id: 'ing-3', name: 'Steak haché', category: 'Viandes', unit: 'kg', stock: 15, minStock: 5, avgPrice: 12.50 },
    { id: 'ing-4', name: 'Poulet pané', category: 'Viandes', unit: 'kg', stock: 10, minStock: 3, avgPrice: 8.90 },

    // Fromages
    { id: 'ing-5', name: 'Cheddar', category: 'Fromages', unit: 'kg', stock: 5, minStock: 2, avgPrice: 15.80 },
    { id: 'ing-6', name: 'Mozzarella', category: 'Fromages', unit: 'kg', stock: 4, minStock: 2, avgPrice: 14.50 },
    { id: 'ing-7', name: 'Chèvre', category: 'Fromages', unit: 'kg', stock: 3, minStock: 1, avgPrice: 18.00 },

    // Légumes
    { id: 'ing-8', name: 'Tomate', category: 'Légumes', unit: 'kg', stock: 8, minStock: 3, avgPrice: 3.50 },
    { id: 'ing-9', name: 'Salade', category: 'Légumes', unit: 'kg', stock: 5, minStock: 2, avgPrice: 2.80 },
    { id: 'ing-10', name: 'Oignon', category: 'Légumes', unit: 'kg', stock: 6, minStock: 2, avgPrice: 2.20 },

    // Sauces
    { id: 'ing-11', name: 'Sauce poivre', category: 'Sauces', unit: 'L', stock: 3, minStock: 1, avgPrice: 12.00 },
    { id: 'ing-12', name: 'Pesto', category: 'Sauces', unit: 'L', stock: 2, minStock: 1, avgPrice: 15.00 }
  ],
  products: [
    {
      id: 'prod-1',
      name: 'Burger Toasty',
      category: 'Burgers',
      price: 12.00,
      tva: 10,
      description: 'Steak grillé, cheddar, sauce poivre, tomate, bacon',
      recipe: [
        { ingredientId: 'ing-1', quantity: 1 },
        { ingredientId: 'ing-3', quantity: 0.150 },
        { ingredientId: 'ing-5', quantity: 0.030 },
        { ingredientId: 'ing-8', quantity: 0.050 },
        { ingredientId: 'ing-11', quantity: 0.020 }
      ],
      available: true
    },
    {
      id: 'prod-2',
      name: 'Panini Italien',
      category: 'Paninis',
      price: 8.50,
      tva: 10,
      description: 'Tomate, pesto, mozzarella',
      recipe: [
        { ingredientId: 'ing-2', quantity: 1 },
        { ingredientId: 'ing-8', quantity: 0.080 },
        { ingredientId: 'ing-6', quantity: 0.060 },
        { ingredientId: 'ing-12', quantity: 0.015 }
      ],
      available: true
    },
    {
      id: 'prod-3',
      name: 'Panini 4 Fromages',
      category: 'Paninis',
      price: 8.50,
      tva: 10,
      description: 'Chèvre, mozzarella, bleu, emmental',
      recipe: [
        { ingredientId: 'ing-2', quantity: 1 },
        { ingredientId: 'ing-7', quantity: 0.030 },
        { ingredientId: 'ing-6', quantity: 0.030 }
      ],
      available: true
    },
    {
      id: 'prod-4',
      name: 'Burger Tenders',
      category: 'Burgers',
      price: 12.00,
      tva: 10,
      description: 'Poulet pané, salade, tomate, cheddar',
      recipe: [
        { ingredientId: 'ing-1', quantity: 1 },
        { ingredientId: 'ing-4', quantity: 0.120 },
        { ingredientId: 'ing-9', quantity: 0.030 },
        { ingredientId: 'ing-8', quantity: 0.050 },
        { ingredientId: 'ing-5', quantity: 0.030 }
      ],
      available: true
    }
  ],
  tables: [
    { id: 'table-1', name: 'Table 1', capacity: 4, location: 'Salle', status: 'FREE' },
    { id: 'table-2', name: 'Table 2', capacity: 4, location: 'Salle', status: 'FREE' },
    { id: 'table-3', name: 'Table 3', capacity: 2, location: 'Salle', status: 'FREE' },
    { id: 'table-4', name: 'Terrasse 1', capacity: 6, location: 'Terrasse', status: 'FREE' },
    { id: 'table-5', name: 'Terrasse 2', capacity: 4, location: 'Terrasse', status: 'FREE' }
  ],
  partners: [
    {
      id: 'partner-1',
      name: 'Boulangerie Dupont',
      type: 'SUPPLIER',
      email: 'contact@boulangerie-dupont.fr',
      phone: '0102030405',
      address: '15 Rue de la Boulangerie, 75001 Paris'
    },
    {
      id: 'partner-2',
      name: 'Boucherie Martin',
      type: 'SUPPLIER',
      email: 'martin@boucherie.fr',
      phone: '0203040506',
      address: '22 Avenue de la Viande, 75002 Paris'
    }
  ],
  orders: [],
  supplierOrders: [],
  movements: [],
  cashDeclarations: [],
  expenses: [
    {
      id: 'exp-1',
      category: 'RENT',
      amount: 1500,
      description: 'Loyer mensuel',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: 'exp-2',
      category: 'UTILITIES',
      amount: 250,
      description: 'Électricité + eau',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
  ],
  _lastUpdatedAt: Date.now()
};

console.log('\n🚀 Création compte test Smart Food Manager\n');
console.log('📧 Email:', testAccount.email);
console.log('🔑 Mot de passe:', testAccount.password);
console.log('🏢 Restaurant:', testAccount.profile.name);
console.log('📊 Plan:', testAccount.profile.plan);
console.log('\n📦 Données incluses:');
console.log('  - 2 utilisateurs (Admin + Serveur 1)');
console.log('  - 12 ingrédients');
console.log('  - 4 produits avec recettes');
console.log('  - 5 tables');
console.log('  - 2 fournisseurs');
console.log('  - 2 charges');

console.log('\n🎯 INSTRUCTIONS:');
console.log('\n1. Ouvrez votre navigateur en mode développeur (F12)');
console.log('2. Allez dans Console');
console.log('3. Collez ce code:');
console.log('\n---DÉBUT CODE---\n');

const code = `
// Compte test
const account = ${JSON.stringify(testAccount, null, 2)};

// État initial
const state = ${JSON.stringify(initialState, null, 2)};

// 1. Sauvegarder compte SaaS
const saasDB = JSON.parse(localStorage.getItem('${SAAS_DB_KEY}') || '[]');
const existing = saasDB.findIndex(u => u.email === account.email);
if (existing >= 0) {
  saasDB[existing] = account;
  console.log('✅ Compte mis à jour');
} else {
  saasDB.push(account);
  console.log('✅ Nouveau compte créé');
}
localStorage.setItem('${SAAS_DB_KEY}', JSON.stringify(saasDB));

// 2. Sauvegarder état restaurant
const storageKey = 'smart_food_db_' + account.profile.id;
localStorage.setItem(storageKey, JSON.stringify(state));
localStorage.setItem('restaurant_profile', JSON.stringify(account.profile));

console.log('\\n✅ Compte test créé avec succès!');
console.log('\\n📧 Connexion:');
console.log('   Email: ${testAccount.email}');
console.log('   Mot de passe: ${testAccount.password}');
console.log('\\n💡 Rechargez la page (F5) et connectez-vous!');
`;

console.log(code);
console.log('\n---FIN CODE---\n');
console.log('4. Appuyez sur Entrée');
console.log('5. Rechargez la page (F5)');
console.log('6. Connectez-vous avec test@smartfood.com / test1234');
console.log('\n✨ Profitez de Smart Food Manager!\n');
