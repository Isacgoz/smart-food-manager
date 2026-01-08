import { describe, it, expect } from 'vitest';
import {
  parseCSVText,
  validateIngredientsCSV,
  validateProductsCSV,
  importIngredients,
  importProducts,
  generateCSVTemplate,
  generateIngredientsCSVTemplate,
  generateProductsCSVTemplate,
  exportToCSV,
  type CSVRow,
} from '../../shared/services/csv-import';
import type { Ingredient, Product } from '../../types';

describe('CSV Import - Parsing', () => {
  it('devrait parser CSV simple', () => {
    const csv = `name,unit,averageCost
Farine,kg,1.20
Sucre,kg,2.50`;

    const rows = parseCSVText(csv);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      name: 'Farine',
      unit: 'kg',
      averageCost: '1.20',
    });
    expect(rows[1]).toEqual({
      name: 'Sucre',
      unit: 'kg',
      averageCost: '2.50',
    });
  });

  it('devrait ignorer lignes vides', () => {
    const csv = `name,unit,averageCost
Farine,kg,1.20

Sucre,kg,2.50`;

    const rows = parseCSVText(csv);
    expect(rows).toHaveLength(2);
  });

  it('devrait trim espaces', () => {
    const csv = `name , unit , averageCost
 Farine , kg , 1.20 `;

    const rows = parseCSVText(csv);
    expect(rows[0].name).toBe('Farine');
    expect(rows[0].unit).toBe('kg');
  });

  it('devrait rejeter CSV vide', () => {
    expect(() => parseCSVText('')).toThrow('Fichier CSV vide');
  });

  it('devrait rejeter ligne avec nombre colonnes incorrect', () => {
    const csv = `name,unit,averageCost
Farine,kg`;

    expect(() => parseCSVText(csv)).toThrow('nombre de colonnes incorrect');
  });
});

describe('CSV Import - Validation Ingrédients', () => {
  it('devrait valider CSV ingrédients correct', () => {
    const data: CSVRow[] = [
      {
        name: 'Farine',
        unit: 'kg',
        averageCost: '1.20',
        stock: '50',
        minStock: '10',
        supplier: 'Boulangerie',
        category: 'Épicerie',
      },
      {
        name: 'Sucre',
        unit: 'kg',
        averageCost: '2.50',
        stock: '20',
        minStock: '5',
        supplier: 'Grossiste',
        category: 'Épicerie',
      },
    ];

    const result = validateIngredientsCSV(data);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.rowsValid).toBe(2);
    expect(result.rowsInvalid).toBe(0);
  });

  it('devrait détecter colonnes manquantes', () => {
    const data: CSVRow[] = [
      { name: 'Farine' }, // Manque unit et averageCost
    ];

    const result = validateIngredientsCSV(data);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Colonnes obligatoires manquantes');
  });

  it('devrait détecter nom manquant', () => {
    const data: CSVRow[] = [
      { name: '', unit: 'kg', averageCost: '1.20' },
    ];

    const result = validateIngredientsCSV(data);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('nom manquant'))).toBe(true);
  });

  it('devrait détecter doublons', () => {
    const data: CSVRow[] = [
      { name: 'Farine', unit: 'kg', averageCost: '1.20' },
      { name: 'farine', unit: 'g', averageCost: '1.50' }, // Doublon (case insensitive)
    ];

    const result = validateIngredientsCSV(data);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('doublon'))).toBe(true);
  });

  it('devrait détecter unité invalide', () => {
    const data: CSVRow[] = [
      { name: 'Farine', unit: 'tonnes', averageCost: '1.20' },
    ];

    const result = validateIngredientsCSV(data);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('unité') && e.includes('invalide'))).toBe(true);
  });

  it('devrait détecter prix invalide', () => {
    const data: CSVRow[] = [
      { name: 'Farine', unit: 'kg', averageCost: '-5' },
    ];

    const result = validateIngredientsCSV(data);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('négatif') || e.includes('invalide'))).toBe(true);
  });

  it('devrait détecter quantité stock invalide', () => {
    const data: CSVRow[] = [
      { name: 'Farine', unit: 'kg', averageCost: '1.20', stock: '-10' },
    ];

    const result = validateIngredientsCSV(data);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('négative'))).toBe(true);
  });

  it('devrait warning si fournisseur manquant', () => {
    const data: CSVRow[] = [
      { name: 'Farine', unit: 'kg', averageCost: '1.20', supplier: '' },
    ];

    const result = validateIngredientsCSV(data);

    expect(result.valid).toBe(true); // Valide mais warning
    expect(result.warnings.some(w => w.includes('fournisseur'))).toBe(true);
  });

  it('devrait accepter stock et minStock optionnels', () => {
    const data: CSVRow[] = [
      { name: 'Farine', unit: 'kg', averageCost: '1.20' }, // Sans stock ni minStock
    ];

    const result = validateIngredientsCSV(data);

    expect(result.valid).toBe(true);
    expect(result.rowsValid).toBe(1);
  });
});

describe('CSV Import - Validation Produits', () => {
  it('devrait valider CSV produits correct', () => {
    const data: CSVRow[] = [
      {
        name: 'Burger',
        category: 'Plats',
        price: '12.00',
        vatRate: '0.1',
        recipe: '[{"ingredientId":"ing1","quantity":1}]',
      },
      {
        name: 'Pizza',
        category: 'Pizzas',
        price: '11.00',
        vatRate: '0.1',
        recipe: '[{"ingredientId":"ing2","quantity":0.25}]',
      },
    ];

    const result = validateProductsCSV(data);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.rowsValid).toBe(2);
  });

  it('devrait détecter nom manquant', () => {
    const data: CSVRow[] = [
      { name: '', category: 'Plats', price: '12.00' },
    ];

    const result = validateProductsCSV(data);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('nom manquant'))).toBe(true);
  });

  it('devrait détecter doublons produits', () => {
    const data: CSVRow[] = [
      { name: 'Burger', category: 'Plats', price: '12.00' },
      { name: 'burger', category: 'Plats', price: '13.00' }, // Doublon
    ];

    const result = validateProductsCSV(data);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('doublon'))).toBe(true);
  });

  it('devrait détecter prix invalide', () => {
    const data: CSVRow[] = [
      { name: 'Burger', category: 'Plats', price: '0' },
    ];

    const result = validateProductsCSV(data);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('supérieur à 0'))).toBe(true);
  });

  it('devrait détecter taux TVA invalide', () => {
    const data: CSVRow[] = [
      { name: 'Burger', category: 'Plats', price: '12.00', vatRate: '2.5' }, // > 1
    ];

    const result = validateProductsCSV(data);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('TVA'))).toBe(true);
  });

  it('devrait warning si recette manquante', () => {
    const data: CSVRow[] = [
      { name: 'Coca', category: 'Boissons', price: '3.00', recipe: '' },
    ];

    const result = validateProductsCSV(data);

    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.includes('recette'))).toBe(true);
  });

  it('devrait détecter recette JSON invalide', () => {
    const data: CSVRow[] = [
      { name: 'Burger', category: 'Plats', price: '12.00', recipe: 'invalid json' },
    ];

    const result = validateProductsCSV(data);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('JSON invalide'))).toBe(true);
  });

  it('devrait détecter recette non-tableau', () => {
    const data: CSVRow[] = [
      { name: 'Burger', category: 'Plats', price: '12.00', recipe: '{"not":"array"}' },
    ];

    const result = validateProductsCSV(data);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('tableau'))).toBe(true);
  });

  it('devrait valider structure items recette', () => {
    const data: CSVRow[] = [
      {
        name: 'Burger',
        category: 'Plats',
        price: '12.00',
        recipe: '[{"ingredientId":"ing1","quantity":1}]',
      },
    ];

    const result = validateProductsCSV(data);

    expect(result.valid).toBe(true);
  });

  it('devrait détecter ingredientId manquant dans recette', () => {
    const data: CSVRow[] = [
      {
        name: 'Burger',
        category: 'Plats',
        price: '12.00',
        recipe: '[{"quantity":1}]', // Manque ingredientId
      },
    ];

    const result = validateProductsCSV(data);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('ingredientId'))).toBe(true);
  });

  it('devrait détecter quantity manquante dans recette', () => {
    const data: CSVRow[] = [
      {
        name: 'Burger',
        category: 'Plats',
        price: '12.00',
        recipe: '[{"ingredientId":"ing1"}]', // Manque quantity
      },
    ];

    const result = validateProductsCSV(data);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('quantity'))).toBe(true);
  });
});

describe('CSV Import - Import Ingrédients', () => {
  it('devrait importer ingrédients valides', async () => {
    const data: CSVRow[] = [
      {
        name: 'Farine',
        unit: 'kg',
        averageCost: '1.20',
        stock: '50',
        minStock: '10',
        supplier: 'Boulangerie',
        category: 'Épicerie',
      },
    ];

    const result = await importIngredients(data, 'company1');

    expect(result.success).toBe(true);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.data).toHaveLength(1);

    const ingredient = result.data![0] as Ingredient;
    expect(ingredient.name).toBe('Farine');
    expect(ingredient.unit).toBe('kg');
    expect(ingredient.averageCost).toBe(1.2);
    expect(ingredient.stock).toBe(50);
    expect(ingredient.minStock).toBe(10);
    expect(ingredient.id).toBeDefined();
  });

  it('devrait ignorer doublons avec existants', async () => {
    const data: CSVRow[] = [
      { name: 'Farine', unit: 'kg', averageCost: '1.20' },
      { name: 'Sucre', unit: 'kg', averageCost: '2.50' },
    ];

    const existing: Ingredient[] = [
      {
        id: 'ing1',
        name: 'Farine', // Existe déjà
        unit: 'kg',
        stock: 100,
        minStock: 20,
        averageCost: 1.0,
        quantity: 100,
      },
    ];

    const result = await importIngredients(data, 'company1', existing);

    expect(result.success).toBe(true);
    expect(result.imported).toBe(1); // Seulement Sucre
    expect(result.skipped).toBe(1); // Farine ignorée
    expect(result.warnings.some(w => w.includes('existe déjà'))).toBe(true);
  });

  it('devrait refuser données invalides', async () => {
    const data: CSVRow[] = [
      { name: '', unit: 'kg', averageCost: '1.20' }, // Nom manquant
    ];

    const result = await importIngredients(data, 'company1');

    expect(result.success).toBe(false);
    expect(result.imported).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('devrait créer IDs uniques', async () => {
    const data: CSVRow[] = [
      { name: 'Farine', unit: 'kg', averageCost: '1.20' },
      { name: 'Sucre', unit: 'kg', averageCost: '2.50' },
    ];

    const result = await importIngredients(data, 'company1');

    expect(result.data).toHaveLength(2);
    const ids = result.data!.map(ing => (ing as Ingredient).id);
    expect(new Set(ids).size).toBe(2); // IDs uniques
  });

  it('devrait utiliser valeurs par défaut si optionnels manquants', async () => {
    const data: CSVRow[] = [
      { name: 'Farine', unit: 'kg', averageCost: '1.20' }, // Sans stock, minStock, supplier, category
    ];

    const result = await importIngredients(data, 'company1');

    const ingredient = result.data![0] as Ingredient;
    expect(ingredient.stock).toBe(0);
    expect(ingredient.minStock).toBe(0);
    expect(ingredient.supplier).toBe('');
    expect(ingredient.category).toBe('Autre');
  });
});

describe('CSV Import - Import Produits', () => {
  const existingIngredients: Ingredient[] = [
    {
      id: 'ing_pain',
      name: 'Pain',
      unit: 'piece',
      stock: 50,
      minStock: 10,
      averageCost: 0.5,
      quantity: 50,
    },
    {
      id: 'ing_steak',
      name: 'Steak',
      unit: 'kg',
      stock: 10,
      minStock: 2,
      averageCost: 12,
      quantity: 10,
    },
  ];

  it('devrait importer produits valides', async () => {
    const data: CSVRow[] = [
      {
        name: 'Burger',
        category: 'Plats',
        price: '12.00',
        vatRate: '0.1',
        recipe: '[{"ingredientId":"ing_pain","quantity":1},{"ingredientId":"ing_steak","quantity":0.15}]',
      },
    ];

    const result = await importProducts(data, 'company1', [], existingIngredients);

    expect(result.success).toBe(true);
    expect(result.imported).toBe(1);
    expect(result.data).toHaveLength(1);

    const product = result.data![0] as Product;
    expect(product.name).toBe('Burger');
    expect(product.price).toBe(12);
    expect(product.vatRate).toBe(0.1);
    expect(product.recipe).toHaveLength(2);
    expect(product.recipe[0].ingredientId).toBe('ing_pain');
    expect(product.recipe[0].quantity).toBe(1);
  });

  it('devrait ignorer doublons produits', async () => {
    const data: CSVRow[] = [
      { name: 'Burger', category: 'Plats', price: '12.00' },
    ];

    const existing: Product[] = [
      {
        id: 'prod1',
        name: 'Burger',
        category: 'Plats',
        price: 11,
        vatRate: 0.1,
        recipe: [],
      },
    ];

    const result = await importProducts(data, 'company1', existing);

    expect(result.success).toBe(true);
    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('devrait warning si ingrédient recette introuvable', async () => {
    const data: CSVRow[] = [
      {
        name: 'Burger',
        category: 'Plats',
        price: '12.00',
        recipe: '[{"ingredientId":"ing_inexistant","quantity":1}]',
      },
    ];

    const result = await importProducts(data, 'company1', [], existingIngredients);

    expect(result.success).toBe(true);
    expect(result.warnings.some(w => w.includes('introuvable'))).toBe(true);

    const product = result.data![0] as Product;
    expect(product.recipe).toHaveLength(0); // Recette vide car ingrédient introuvable
  });

  it('devrait résoudre ingrédient par nom si ID introuvable', async () => {
    const data: CSVRow[] = [
      {
        name: 'Burger',
        category: 'Plats',
        price: '12.00',
        recipe: '[{"ingredientId":"Pain","quantity":1}]', // Nom au lieu d'ID
      },
    ];

    const result = await importProducts(data, 'company1', [], existingIngredients);

    expect(result.success).toBe(true);

    const product = result.data![0] as Product;
    expect(product.recipe).toHaveLength(1);
    expect(product.recipe[0].ingredientId).toBe('ing_pain'); // Résolu par nom
  });

  it('devrait utiliser vatRate par défaut 10%', async () => {
    const data: CSVRow[] = [
      { name: 'Burger', category: 'Plats', price: '12.00' }, // Sans vatRate
    ];

    const result = await importProducts(data, 'company1');

    const product = result.data![0] as Product;
    expect(product.vatRate).toBe(0.1);
  });

  it('devrait gérer recette vide', async () => {
    const data: CSVRow[] = [
      { name: 'Coca', category: 'Boissons', price: '3.00', recipe: '[]' },
    ];

    const result = await importProducts(data, 'company1');

    const product = result.data![0] as Product;
    expect(product.recipe).toHaveLength(0);
  });
});

describe('CSV Import - Génération Templates', () => {
  it('devrait générer template ingrédients', () => {
    const template = generateIngredientsCSVTemplate();

    expect(template).toContain('name,unit,averageCost');
    expect(template).toContain('Farine,kg,1.20');
    expect(template.split('\n').length).toBeGreaterThan(2);
  });

  it('devrait générer template produits', () => {
    const template = generateProductsCSVTemplate();

    expect(template).toContain('name,category,price');
    expect(template).toContain('Burger Classique');
    expect(template.split('\n').length).toBeGreaterThan(2);
  });

  it('generateCSVTemplate devrait router vers bon type', () => {
    const ingredientsTemplate = generateCSVTemplate('ingredients');
    const productsTemplate = generateCSVTemplate('products');

    expect(ingredientsTemplate).toContain('Farine');
    expect(productsTemplate).toContain('Burger');
  });

  it('generateCSVTemplate devrait rejeter type inconnu', () => {
    expect(() => generateCSVTemplate('unknown' as any)).toThrow('Type de template inconnu');
  });
});

describe('CSV Import - Export CSV', () => {
  it('devrait exporter ingrédients en CSV', () => {
    const ingredients: Ingredient[] = [
      {
        id: 'ing1',
        name: 'Farine',
        unit: 'kg',
        stock: 50,
        minStock: 10,
        averageCost: 1.2,
        supplier: 'Boulangerie',
        category: 'Épicerie',
        quantity: 50,
      },
    ];

    const csv = exportToCSV(ingredients, 'ingredients');

    expect(csv).toContain('name,unit,averageCost');
    expect(csv).toContain('Farine,kg,1.2,50,10,Boulangerie,Épicerie');
  });

  it('devrait exporter produits en CSV', () => {
    const products: Product[] = [
      {
        id: 'prod1',
        name: 'Burger',
        category: 'Plats',
        price: 12,
        vatRate: 0.1,
        recipe: [{ ingredientId: 'ing1', quantity: 1 }],
      },
    ];

    const csv = exportToCSV(products, 'products');

    expect(csv).toContain('name,category,price');
    expect(csv).toContain('Burger,Plats,12');
    expect(csv).toContain('ingredientId');
  });

  it('devrait escape double quotes dans recette JSON', () => {
    const products: Product[] = [
      {
        id: 'prod1',
        name: 'Burger',
        category: 'Plats',
        price: 12,
        vatRate: 0.1,
        recipe: [{ ingredientId: 'ing1', quantity: 1 }],
      },
    ];

    const csv = exportToCSV(products, 'products');

    // Le JSON doit être quoted et les quotes escapés
    expect(csv).toContain('"[{');
  });

  it('devrait retourner template si données vides', () => {
    const csv = exportToCSV([], 'ingredients');

    expect(csv).toContain('name,unit,averageCost');
    expect(csv).toContain('Farine'); // Exemple template
  });
});
