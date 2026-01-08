/**
 * Service d'Import CSV
 *
 * Facilite l'onboarding restaurant pilote avec import données CSV.
 *
 * Fonctionnalités:
 * - Parsing CSV avec détection encoding
 * - Validation structure et données
 * - Import ingrédients et produits
 * - Génération templates CSV
 * - Gestion doublons et références
 */

import type { Ingredient, Product, RecipeItem, Unit } from '../../types';
import { validateQuantity, validatePrice } from './error-handling';

// ============================================
// TYPES
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  rowsValid: number;
  rowsInvalid: number;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  warnings: string[];
  data?: Array<Ingredient | Product>;
}

export interface CSVRow {
  [key: string]: string;
}

// Colonnes attendues
export const INGREDIENT_COLUMNS = ['name', 'unit', 'averageCost', 'stock', 'minStock', 'supplier', 'category'];
export const PRODUCT_COLUMNS = ['name', 'category', 'price', 'vatRate', 'recipe'];

// Unités valides
const VALID_UNITS: Unit[] = ['kg', 'g', 'L', 'cl', 'ml', 'piece'];

// ============================================
// PARSING CSV
// ============================================

/**
 * Parse fichier CSV en tableau d'objets
 */
export const parseCSV = async (file: File): Promise<CSVRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCSVText(text);
        resolve(rows);
      } catch (error) {
        reject(new Error(`Erreur parsing CSV: ${(error as Error).message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lecture fichier CSV'));
    };

    reader.readAsText(file, 'UTF-8');
  });
};

/**
 * Parse texte CSV en objets
 */
export const parseCSVText = (text: string): CSVRow[] => {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error('Fichier CSV vide');
  }

  const lines = trimmed.split('\n');

  // Première ligne = headers
  const headers = lines[0].split(',').map(h => h.trim());

  if (headers.length === 0) {
    throw new Error('Headers CSV manquants');
  }

  // Lignes suivantes = données
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Ignorer lignes vides
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());

    // Vérifier nombre de colonnes
    if (values.length !== headers.length) {
      throw new Error(`Ligne ${i + 1}: nombre de colonnes incorrect (attendu: ${headers.length}, reçu: ${values.length})`);
    }

    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    rows.push(row);
  }

  return rows;
};

// ============================================
// VALIDATION INGRÉDIENTS
// ============================================

/**
 * Valide CSV ingrédients
 */
export const validateIngredientsCSV = (data: CSVRow[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let rowsValid = 0;
  let rowsInvalid = 0;

  // Vérifier colonnes obligatoires
  if (data.length === 0) {
    errors.push('Aucune donnée à valider');
    return { valid: false, errors, warnings, rowsValid, rowsInvalid };
  }

  const firstRow = data[0];
  const headers = Object.keys(firstRow);

  const requiredColumns = ['name', 'unit', 'averageCost'];
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));

  if (missingColumns.length > 0) {
    errors.push(`Colonnes obligatoires manquantes: ${missingColumns.join(', ')}`);
    return { valid: false, errors, warnings, rowsValid, rowsInvalid };
  }

  // Valider chaque ligne
  const names = new Set<string>();

  data.forEach((row, index) => {
    const rowErrors: string[] = [];
    const rowNumber = index + 2; // +2 car ligne 1 = headers, index 0 = ligne 2

    // Name obligatoire et unique
    if (!row.name || row.name.trim() === '') {
      rowErrors.push(`Ligne ${rowNumber}: nom manquant`);
    } else {
      const nameLower = row.name.toLowerCase().trim();
      if (names.has(nameLower)) {
        rowErrors.push(`Ligne ${rowNumber}: nom "${row.name}" en doublon`);
      } else {
        names.add(nameLower);
      }
    }

    // Unit valide
    if (!row.unit || row.unit.trim() === '') {
      rowErrors.push(`Ligne ${rowNumber}: unité manquante`);
    } else if (!VALID_UNITS.includes(row.unit as Unit)) {
      rowErrors.push(`Ligne ${rowNumber}: unité "${row.unit}" invalide (valides: ${VALID_UNITS.join(', ')})`);
    }

    // AverageCost valide
    if (!row.averageCost || row.averageCost.trim() === '') {
      rowErrors.push(`Ligne ${rowNumber}: coût moyen manquant`);
    } else {
      const cost = parseFloat(row.averageCost);
      const priceValidation = validatePrice(cost, `Ligne ${rowNumber}`);
      if (priceValidation) {
        rowErrors.push(priceValidation.userMessage);
      }
    }

    // Stock optionnel mais doit être valide si présent
    if (row.stock && row.stock.trim() !== '') {
      const stock = parseFloat(row.stock);
      const stockValidation = validateQuantity(stock, row.unit || 'unité', `Ligne ${rowNumber}`);
      if (stockValidation) {
        rowErrors.push(stockValidation.userMessage);
      }
    }

    // MinStock optionnel mais doit être valide si présent
    if (row.minStock && row.minStock.trim() !== '') {
      const minStock = parseFloat(row.minStock);
      const minStockValidation = validateQuantity(minStock, row.unit || 'unité', `Ligne ${rowNumber}`);
      if (minStockValidation) {
        rowErrors.push(minStockValidation.userMessage);
      }
    }

    // Supplier et category optionnels (warnings si manquants)
    if (!row.supplier || row.supplier.trim() === '') {
      warnings.push(`Ligne ${rowNumber}: fournisseur non spécifié`);
    }

    if (!row.category || row.category.trim() === '') {
      warnings.push(`Ligne ${rowNumber}: catégorie non spécifiée`);
    }

    // Compter validité ligne
    if (rowErrors.length > 0) {
      rowsInvalid++;
      errors.push(...rowErrors);
    } else {
      rowsValid++;
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rowsValid,
    rowsInvalid,
  };
};

// ============================================
// VALIDATION PRODUITS
// ============================================

/**
 * Valide CSV produits
 */
export const validateProductsCSV = (data: CSVRow[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let rowsValid = 0;
  let rowsInvalid = 0;

  if (data.length === 0) {
    errors.push('Aucune donnée à valider');
    return { valid: false, errors, warnings, rowsValid, rowsInvalid };
  }

  const firstRow = data[0];
  const headers = Object.keys(firstRow);

  const requiredColumns = ['name', 'category', 'price'];
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));

  if (missingColumns.length > 0) {
    errors.push(`Colonnes obligatoires manquantes: ${missingColumns.join(', ')}`);
    return { valid: false, errors, warnings, rowsValid, rowsInvalid };
  }

  const names = new Set<string>();

  data.forEach((row, index) => {
    const rowErrors: string[] = [];
    const rowNumber = index + 2;

    // Name obligatoire et unique
    if (!row.name || row.name.trim() === '') {
      rowErrors.push(`Ligne ${rowNumber}: nom manquant`);
    } else {
      const nameLower = row.name.toLowerCase().trim();
      if (names.has(nameLower)) {
        rowErrors.push(`Ligne ${rowNumber}: nom "${row.name}" en doublon`);
      } else {
        names.add(nameLower);
      }
    }

    // Category obligatoire
    if (!row.category || row.category.trim() === '') {
      rowErrors.push(`Ligne ${rowNumber}: catégorie manquante`);
    }

    // Price valide
    if (!row.price || row.price.trim() === '') {
      rowErrors.push(`Ligne ${rowNumber}: prix manquant`);
    } else {
      const price = parseFloat(row.price);
      const priceValidation = validatePrice(price, `Ligne ${rowNumber}`);
      if (priceValidation) {
        rowErrors.push(priceValidation.userMessage);
      }
    }

    // VatRate optionnel mais doit être valide si présent
    if (row.vatRate && row.vatRate.trim() !== '') {
      const vatRate = parseFloat(row.vatRate);
      if (isNaN(vatRate) || vatRate < 0 || vatRate > 1) {
        rowErrors.push(`Ligne ${rowNumber}: taux TVA invalide (doit être entre 0 et 1, ex: 0.1 pour 10%)`);
      }
    }

    // Recipe optionnel (warning si manquant)
    if (!row.recipe || row.recipe.trim() === '') {
      warnings.push(`Ligne ${rowNumber}: recette non spécifiée (produit sans déstockage automatique)`);
    } else {
      // Valider format JSON si présent
      try {
        const recipe = JSON.parse(row.recipe);
        if (!Array.isArray(recipe)) {
          rowErrors.push(`Ligne ${rowNumber}: recette doit être un tableau JSON`);
        } else {
          // Valider chaque item recette
          recipe.forEach((item: any, itemIndex: number) => {
            if (!item.ingredientId || typeof item.ingredientId !== 'string') {
              rowErrors.push(`Ligne ${rowNumber}, item recette ${itemIndex + 1}: ingredientId manquant`);
            }
            if (item.quantity === undefined || typeof item.quantity !== 'number') {
              rowErrors.push(`Ligne ${rowNumber}, item recette ${itemIndex + 1}: quantity manquante ou invalide`);
            }
          });
        }
      } catch (e) {
        rowErrors.push(`Ligne ${rowNumber}: recette JSON invalide (${(e as Error).message})`);
      }
    }

    if (rowErrors.length > 0) {
      rowsInvalid++;
      errors.push(...rowErrors);
    } else {
      rowsValid++;
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rowsValid,
    rowsInvalid,
  };
};

// ============================================
// IMPORT INGRÉDIENTS
// ============================================

/**
 * Importe ingrédients depuis CSV
 */
export const importIngredients = async (
  data: CSVRow[],
  companyId: string,
  existingIngredients: Ingredient[] = []
): Promise<ImportResult> => {
  // Valider d'abord
  const validation = validateIngredientsCSV(data);

  if (!validation.valid) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  const imported: Ingredient[] = [];
  const errors: string[] = [];
  const warnings: string[] = [...validation.warnings];
  let skipped = 0;

  // Map existants par nom (lowercase)
  const existingByName = new Map<string, Ingredient>();
  existingIngredients.forEach(ing => {
    existingByName.set(ing.name.toLowerCase().trim(), ing);
  });

  for (const row of data) {
    const nameLower = row.name.toLowerCase().trim();

    // Vérifier doublon avec existants
    if (existingByName.has(nameLower)) {
      warnings.push(`Ingrédient "${row.name}" existe déjà (ignoré)`);
      skipped++;
      continue;
    }

    // Créer ingrédient
    const ingredient: Ingredient = {
      id: `ing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: row.name.trim(),
      unit: row.unit as Unit,
      stock: row.stock ? parseFloat(row.stock) : 0,
      minStock: row.minStock ? parseFloat(row.minStock) : 0,
      averageCost: parseFloat(row.averageCost),
      supplier: row.supplier?.trim() || '',
      category: row.category?.trim() || 'Autre',
      quantity: row.stock ? parseFloat(row.stock) : 0, // Alias pour compatibilité
    };

    imported.push(ingredient);
  }

  return {
    success: true,
    imported: imported.length,
    skipped,
    errors,
    warnings,
    data: imported,
  };
};

// ============================================
// IMPORT PRODUITS
// ============================================

/**
 * Importe produits depuis CSV
 */
export const importProducts = async (
  data: CSVRow[],
  companyId: string,
  existingProducts: Product[] = [],
  existingIngredients: Ingredient[] = []
): Promise<ImportResult> => {
  // Valider d'abord
  const validation = validateProductsCSV(data);

  if (!validation.valid) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  const imported: Product[] = [];
  const errors: string[] = [];
  const warnings: string[] = [...validation.warnings];
  let skipped = 0;

  // Map existants par nom
  const existingByName = new Map<string, Product>();
  existingProducts.forEach(prod => {
    existingByName.set(prod.name.toLowerCase().trim(), prod);
  });

  // Map ingrédients par ID et par nom pour validation références
  const ingredientsById = new Map<string, Ingredient>();
  const ingredientsByName = new Map<string, Ingredient>();
  existingIngredients.forEach(ing => {
    ingredientsById.set(ing.id, ing);
    ingredientsByName.set(ing.name.toLowerCase().trim(), ing);
  });

  for (const row of data) {
    const nameLower = row.name.toLowerCase().trim();

    // Vérifier doublon
    if (existingByName.has(nameLower)) {
      warnings.push(`Produit "${row.name}" existe déjà (ignoré)`);
      skipped++;
      continue;
    }

    // Parser recette
    let recipe: RecipeItem[] = [];
    if (row.recipe && row.recipe.trim() !== '') {
      try {
        const recipeData = JSON.parse(row.recipe);

        // Valider références ingrédients
        for (const item of recipeData) {
          const ingredient = ingredientsById.get(item.ingredientId);

          if (!ingredient) {
            // Tenter par nom si ID introuvable
            const ingredientByName = ingredientsByName.get(item.ingredientId.toLowerCase());
            if (ingredientByName) {
              recipe.push({
                ingredientId: ingredientByName.id,
                quantity: item.quantity,
              });
            } else {
              warnings.push(`Produit "${row.name}": ingrédient "${item.ingredientId}" introuvable (recette incomplète)`);
            }
          } else {
            recipe.push({
              ingredientId: item.ingredientId,
              quantity: item.quantity,
            });
          }
        }
      } catch (e) {
        warnings.push(`Produit "${row.name}": recette JSON invalide (${(e as Error).message})`);
      }
    }

    // Créer produit
    const product: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: row.name.trim(),
      category: row.category.trim(),
      price: parseFloat(row.price),
      vatRate: row.vatRate ? parseFloat(row.vatRate) : 0.1, // Défaut 10%
      recipe,
      image: row.image?.trim() || undefined,
    };

    imported.push(product);
  }

  return {
    success: true,
    imported: imported.length,
    skipped,
    errors,
    warnings,
    data: imported,
  };
};

// ============================================
// GÉNÉRATION TEMPLATES CSV
// ============================================

/**
 * Génère template CSV pour ingrédients
 */
export const generateIngredientsCSVTemplate = (): string => {
  const headers = INGREDIENT_COLUMNS.join(',');
  const example = [
    'Farine,kg,1.20,50,10,Boulangerie Martin,Épicerie',
    'Tomate,kg,2.50,15,5,Primeur Bio,Légumes',
    'Steak haché,kg,12.50,8,2,Boucherie Dupont,Viandes',
    'Œufs,piece,0.30,120,50,Ferme locale,Œufs',
    'Lait,L,1.80,20,5,Laiterie,Produits laitiers',
  ].join('\n');

  return `${headers}\n${example}`;
};

/**
 * Génère template CSV pour produits
 */
export const generateProductsCSVTemplate = (): string => {
  const headers = PRODUCT_COLUMNS.join(',');
  const example = [
    'Burger Classique,Plats,12.00,0.10,"[{""ingredientId"":""ing_pain"",""quantity"":1},{""ingredientId"":""ing_steak"",""quantity"":0.15}]"',
    'Pizza Margherita,Pizzas,11.00,0.10,"[{""ingredientId"":""ing_farine"",""quantity"":0.25},{""ingredientId"":""ing_tomate"",""quantity"":0.1}]"',
    'Salade César,Entrées,8.50,0.10,"[{""ingredientId"":""ing_salade"",""quantity"":0.15}]"',
    'Coca-Cola,Boissons,3.00,0.20,[]',
  ].join('\n');

  return `${headers}\n${example}`;
};

/**
 * Génère template CSV selon type
 */
export const generateCSVTemplate = (type: 'ingredients' | 'products'): string => {
  switch (type) {
    case 'ingredients':
      return generateIngredientsCSVTemplate();
    case 'products':
      return generateProductsCSVTemplate();
    default:
      throw new Error(`Type de template inconnu: ${type}`);
  }
};

// ============================================
// UTILITAIRES
// ============================================

/**
 * Télécharge template CSV
 */
export const downloadCSVTemplate = (type: 'ingredients' | 'products'): void => {
  const csv = generateCSVTemplate(type);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `template_${type}.csv`;
  link.click();

  URL.revokeObjectURL(url);
};

/**
 * Exporte données en CSV
 */
export const exportToCSV = (
  data: Array<Ingredient | Product>,
  type: 'ingredients' | 'products'
): string => {
  if (data.length === 0) {
    return generateCSVTemplate(type);
  }

  const headers = type === 'ingredients' ? INGREDIENT_COLUMNS : PRODUCT_COLUMNS;
  const rows: string[] = [headers.join(',')];

  data.forEach(item => {
    if (type === 'ingredients') {
      const ing = item as Ingredient;
      rows.push([
        ing.name,
        ing.unit,
        ing.averageCost.toString(),
        ing.stock?.toString() || '0',
        ing.minStock?.toString() || '0',
        ing.supplier || '',
        ing.category || '',
      ].join(','));
    } else {
      const prod = item as Product;
      const recipeJSON = JSON.stringify(prod.recipe || []).replace(/"/g, '""'); // Escape double quotes
      rows.push([
        prod.name,
        prod.category,
        prod.price.toString(),
        prod.vatRate?.toString() || '0.1',
        `"${recipeJSON}"`,
      ].join(','));
    }
  });

  return rows.join('\n');
};
