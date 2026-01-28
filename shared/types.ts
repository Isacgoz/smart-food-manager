
export type Role = 'OWNER' | 'MANAGER' | 'SERVER' | 'COOK';
export type Unit = 'kg' | 'g' | 'L' | 'cl' | 'ml' | 'piece';
export type PlanType = 'SOLO' | 'TEAM' | 'BUSINESS';
export type KitchenStatus = 'QUEUED' | 'PREPARING' | 'READY' | 'SERVED';
export type StockPolicy = 'BLOCK' | 'WARN' | 'SILENT';
export type OrderType = 'DINE_IN' | 'TAKEAWAY';

export interface User {
  id: string;
  name: string;
  pin: string; // @deprecated: utilisé uniquement pour compatibilité
  pinHash?: string; // Hash SHA-256 pour vérification offline
  role: Role;
  email?: string;
}

export interface Order {
  id: string;
  number: number;
  items: OrderItem[];
  total: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  kitchenStatus: KitchenStatus;
  date: string;
  paymentMethod?: 'CASH' | 'CARD';
  tableId?: string;
  userId: string; // Prise de commande
  paidByUserId?: string; // ENCAISSEMENT (Crucial pour l'audit)
  version?: number; // Optimistic locking
  updatedAt?: string;
  type?: OrderType; // DINE_IN (sur place) ou TAKEAWAY (emporter) - impact TVA
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number;
}

export interface Ingredient { 
  id: string; 
  name: string; 
  unit: Unit; 
  stock: number; 
  minStock: number; 
  averageCost: number; 
}

export interface Product { 
  id: string; 
  name: string; 
  category: string; 
  price: number; 
  vatRate: number; 
  image?: string; 
  recipe: RecipeItem[]; 
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  vatRate?: number; // Taux TVA pour exports comptables
  note?: string;
}

export interface RestaurantProfile {
  id: string;
  name: string;
  ownerEmail: string;
  plan: PlanType;
  createdAt: string;
  stockPolicy?: StockPolicy;
  // Subscription & Trial
  subscriptionStatus?: 'trial' | 'active' | 'expired' | 'cancelled';
  trialEndsAt?: string; // ISO date
  subscriptionEndsAt?: string; // ISO date
  // Infos légales NF525
  legalName?: string;
  siren?: string;
  siret?: string;
  vatNumber?: string;
  address?: string;
  postalCode?: string;
  city?: string;
}

export interface CashDeclaration { 
  id: string; 
  userId: string; 
  amount: number; 
  date: string; 
  type: 'OPENING' | 'CLOSING'; 
}

export type PartnerType = 'CLIENT' | 'SUPPLIER' | 'MAINTENANCE' | 'DELIVERY' | 'MARKETING' | 'OTHER';

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  email: string;
  phone: string;
  address: string;
  notes: string;
  loyaltyPoints: number;
  totalSpent: number;
}

export interface SupplierOrderItem {
  ingredientId: string;
  quantity: number;
  cost: number;
}

export interface SupplierOrder {
  id: string;
  supplierId: string;
  items: SupplierOrderItem[];
  totalCost: number;
  date: string;
  status: 'PENDING' | 'RECEIVED';
}

export interface SubscriptionPlan {
  id: PlanType;
  name: string;
  price: number;
  limits: {
    users: number;
    products: number;
    tables: number;
    hasERP: boolean;
    hasStats: boolean;
    supportPriority: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface PinResetRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  newPin?: string;
}

export interface StockMovement {
  id: string;
  ingredientId: string;
  type: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'WASTE';
  quantity: number;
  date: string;
  documentRef?: string;
}

export interface Table {
  id: string;
  name: string;
  seats: number;
}

// ============================================
// TYPES: Gestion Charges & EBE
// ============================================

export type ExpenseType = 'FIXED' | 'VARIABLE';
export type ExpenseCategory =
  | 'RENT' // Loyer
  | 'SALARIES' // Salaires
  | 'ELECTRICITY' // Électricité
  | 'WATER' // Eau
  | 'GAS' // Gaz
  | 'INTERNET' // Internet/Téléphone
  | 'INSURANCE' // Assurances
  | 'MAINTENANCE' // Maintenance/Réparations
  | 'MARKETING' // Marketing/Publicité
  | 'ACCOUNTING' // Comptabilité
  | 'BANK_FEES' // Frais bancaires
  | 'WASTE_MANAGEMENT' // Gestion déchets
  | 'CLEANING' // Produits nettoyage
  | 'LICENSES' // Licences/Permis
  | 'OTHER'; // Autres

export interface Expense {
  id: string;
  restaurantId: string;
  category: ExpenseCategory;
  label: string; // Description libre
  amount: number;
  type: ExpenseType; // FIXED ou VARIABLE
  frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME';
  date: string; // Date de la dépense
  createdAt: string;
  createdBy: string; // userId
  isPaid: boolean;
  paymentDate?: string;
  notes?: string;
}

export interface EBECalculation {
  period: {
    start: string;
    end: string;
  };
  revenue: {
    totalSales: number; // CA total
    cash: number;
    card: number;
  };
  expenses: {
    totalExpenses: number;
    fixed: number;
    variable: number;
    byCategory: Record<ExpenseCategory, number>;
  };
  materialCost: number; // Coût matière
  grossMargin: number; // Marge brute (CA - Coût matière)
  grossMarginRate: number; // % marge brute
  ebe: number; // EBE = Marge brute - Charges
  ebeRate: number; // % EBE / CA
  isProfitable: boolean; // EBE > 0
}
