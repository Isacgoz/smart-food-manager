/**
 * Supabase Adapter - Remplace localStorage par Supabase PostgreSQL
 * Offline-first: localStorage comme cache, Supabase comme source de vérité
 */

import { supabase } from './storage';
import { logger } from '../shared/services/logger';
import type {
  Ingredient, Product, Supplier, User, Order, Purchase,
  Table, Expense, StockMovement, Company
} from '../types';

// ============================================
// COMPANIES
// ============================================

export const getCompany = async (companyId: string): Promise<Company | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error) throw error;

    return data ? mapCompanyFromDB(data) : null;
  } catch (err) {
    logger.error('Failed to fetch company', err as Error, { companyId });
    return null;
  }
};

export const updateCompany = async (companyId: string, updates: Partial<Company>): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('companies')
      .update(mapCompanyToDB(updates))
      .eq('id', companyId);

    if (error) throw error;
    return true;
  } catch (err) {
    logger.error('Failed to update company', err as Error, { companyId });
    return false;
  }
};

// ============================================
// INGREDIENTS
// ============================================

export const getIngredients = async (companyId: string): Promise<Ingredient[]> => {
  if (!supabase) return [];

  try {
    // Set company context for RLS
    await supabase.rpc('set_config', {
      setting: 'app.current_company_id',
      value: companyId
    });

    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    if (error) throw error;
    return data?.map(mapIngredientFromDB) || [];
  } catch (err) {
    logger.error('Failed to fetch ingredients', err as Error, { companyId });
    return [];
  }
};

export const createIngredient = async (companyId: string, ingredient: Omit<Ingredient, 'id'>): Promise<Ingredient | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('ingredients')
      .insert({
        company_id: companyId,
        ...mapIngredientToDB(ingredient)
      })
      .select()
      .single();

    if (error) throw error;
    return data ? mapIngredientFromDB(data) : null;
  } catch (err) {
    logger.error('Failed to create ingredient', err as Error, { companyId });
    return null;
  }
};

export const updateIngredient = async (companyId: string, id: string, updates: Partial<Ingredient>): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('ingredients')
      .update(mapIngredientToDB(updates))
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) throw error;
    return true;
  } catch (err) {
    logger.error('Failed to update ingredient', err as Error, { companyId, id });
    return false;
  }
};

export const deleteIngredient = async (companyId: string, id: string): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) throw error;
    return true;
  } catch (err) {
    logger.error('Failed to delete ingredient', err as Error, { companyId, id });
    return false;
  }
};

// ============================================
// PRODUCTS
// ============================================

export const getProducts = async (companyId: string): Promise<Product[]> => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data?.map(mapProductFromDB) || [];
  } catch (err) {
    logger.error('Failed to fetch products', err as Error, { companyId });
    return [];
  }
};

export const createProduct = async (companyId: string, product: Omit<Product, 'id'>): Promise<Product | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        company_id: companyId,
        ...mapProductToDB(product)
      })
      .select()
      .single();

    if (error) throw error;
    return data ? mapProductFromDB(data) : null;
  } catch (err) {
    logger.error('Failed to create product', err as Error, { companyId });
    return null;
  }
};

export const updateProduct = async (companyId: string, id: string, updates: Partial<Product>): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('products')
      .update(mapProductToDB(updates))
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) throw error;
    return true;
  } catch (err) {
    logger.error('Failed to update product', err as Error, { companyId, id });
    return false;
  }
};

export const deleteProduct = async (companyId: string, id: string): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) throw error;
    return true;
  } catch (err) {
    logger.error('Failed to delete product', err as Error, { companyId, id });
    return false;
  }
};

// ============================================
// ORDERS
// ============================================

export const getOrders = async (companyId: string, limit = 100): Promise<Order[]> => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data?.map(mapOrderFromDB) || [];
  } catch (err) {
    logger.error('Failed to fetch orders', err as Error, { companyId });
    return [];
  }
};

export const createOrder = async (companyId: string, order: Omit<Order, 'id' | 'invoiceNumber'>): Promise<Order | null> => {
  if (!supabase) return null;

  try {
    // Generate invoice number via DB function
    const { data: invoiceNum, error: invoiceError } = await supabase
      .rpc('generate_invoice_number', { company_uuid: companyId });

    if (invoiceError) throw invoiceError;

    const { data, error } = await supabase
      .from('orders')
      .insert({
        company_id: companyId,
        invoice_number: invoiceNum,
        ...mapOrderToDB(order)
      })
      .select()
      .single();

    if (error) throw error;
    return data ? mapOrderFromDB(data) : null;
  } catch (err) {
    logger.error('Failed to create order', err as Error, { companyId });
    return null;
  }
};

export const updateOrder = async (companyId: string, id: string, updates: Partial<Order>): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('orders')
      .update(mapOrderToDB(updates))
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) throw error;
    return true;
  } catch (err) {
    logger.error('Failed to update order', err as Error, { companyId, id });
    return false;
  }
};

// ============================================
// MAPPERS (DB <-> App types)
// ============================================

function mapCompanyFromDB(row: any): Company {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legal_name,
    siren: row.siren,
    siret: row.siret,
    vatNumber: row.vat_number,
    address: row.address,
    postalCode: row.postal_code,
    city: row.city,
    country: row.country,
    phone: row.phone,
    email: row.email,
    plan: row.plan,
    status: row.status
  };
}

function mapCompanyToDB(company: Partial<Company>): any {
  return {
    name: company.name,
    legal_name: company.legalName,
    siren: company.siren,
    siret: company.siret,
    vat_number: company.vatNumber,
    address: company.address,
    postal_code: company.postalCode,
    city: company.city,
    country: company.country,
    phone: company.phone,
    email: company.email,
    plan: company.plan,
    status: company.status
  };
}

function mapIngredientFromDB(row: any): Ingredient {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    stock: parseFloat(row.stock),
    minStock: parseFloat(row.min_stock),
    averageCost: parseFloat(row.average_cost),
    lastPurchasePrice: row.last_purchase_price ? parseFloat(row.last_purchase_price) : undefined
  };
}

function mapIngredientToDB(ingredient: Partial<Ingredient>): any {
  return {
    name: ingredient.name,
    category: ingredient.category,
    unit: ingredient.unit,
    stock: ingredient.stock,
    min_stock: ingredient.minStock,
    average_cost: ingredient.averageCost,
    last_purchase_price: ingredient.lastPurchasePrice
  };
}

function mapProductFromDB(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: parseFloat(row.price),
    vatRate: parseFloat(row.vat_rate),
    imageUrl: row.image_url,
    recipe: row.recipe || [],
    available: row.available
  };
}

function mapProductToDB(product: Partial<Product>): any {
  return {
    name: product.name,
    category: product.category,
    price: product.price,
    vat_rate: product.vatRate,
    image_url: product.imageUrl,
    recipe: product.recipe,
    available: product.available
  };
}

function mapOrderFromDB(row: any): Order {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    tableId: row.table_id,
    serverId: row.server_id,
    items: row.items || [],
    total: parseFloat(row.total),
    paymentMethod: row.payment_method,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    paidAt: row.paid_at
  };
}

function mapOrderToDB(order: Partial<Order>): any {
  return {
    table_id: order.tableId,
    server_id: order.serverId,
    items: order.items,
    subtotal: order.total, // Calculé côté client
    vat_amount: 0, // À calculer
    total: order.total,
    payment_method: order.paymentMethod,
    status: order.status,
    notes: order.notes,
    paid_at: order.paidAt
  };
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

export const subscribeToOrders = (companyId: string, callback: (order: Order) => void) => {
  if (!supabase) return null;

  return supabase
    .channel(`orders:${companyId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `company_id=eq.${companyId}`
      },
      (payload) => {
        callback(mapOrderFromDB(payload.new));
      }
    )
    .subscribe();
};

export const subscribeToTables = (companyId: string, callback: (table: Table) => void) => {
  if (!supabase) return null;

  return supabase
    .channel(`tables:${companyId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tables',
        filter: `company_id=eq.${companyId}`
      },
      (payload) => {
        callback(payload.new as Table);
      }
    )
    .subscribe();
};
