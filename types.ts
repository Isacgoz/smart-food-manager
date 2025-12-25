
export type Role = 'OWNER' | 'MANAGER' | 'SERVER' | 'COOK';
export type Unit = 'kg' | 'g' | 'L' | 'cl' | 'ml' | 'piece';
export type PlanType = 'STARTER' | 'PRO' | 'BUSINESS';
export type KitchenStatus = 'QUEUED' | 'PREPARING' | 'READY' | 'SERVED';

export interface User {
  id: string;
  name: string;
  pin: string; // @deprecated: utilisé uniquement pour compatibilité
  pinHash?: string; // Hash SHA-256 pour vérification offline
  role: Role;
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
  note?: string; 
}

export interface RestaurantProfile { 
  id: string; 
  name: string; 
  ownerEmail: string; 
  plan: PlanType; 
  createdAt: string; 
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
