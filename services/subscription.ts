
import { PlanType, SubscriptionPlan } from "../types";

export const PLANS: Record<PlanType, SubscriptionPlan> = {
    STARTER: {
        id: 'STARTER',
        name: 'Démarrage (Gratuit)',
        price: 0,
        limits: {
            users: 2,
            products: 15,
            tables: 5,
            hasERP: false,
            hasStats: false,
            supportPriority: 'LOW'
        }
    },
    PRO: {
        id: 'PRO',
        name: 'Pro',
        price: 29.99,
        limits: {
            users: 5,
            products: 100,
            tables: 20,
            hasERP: true, // Stocks limités
            hasStats: true,
            supportPriority: 'MEDIUM'
        }
    },
    BUSINESS: {
        id: 'BUSINESS',
        name: 'Business Illimité',
        price: 79.99,
        limits: {
            users: -1, // Unlimited
            products: -1,
            tables: -1,
            hasERP: true,
            hasStats: true,
            supportPriority: 'HIGH'
        }
    }
};

export const checkLimit = (plan: PlanType, type: 'users' | 'products' | 'tables', currentCount: number): boolean => {
    const limit = PLANS[plan].limits[type];
    if (limit === -1) return true;
    return currentCount < limit;
};

export const hasFeature = (plan: PlanType, feature: 'hasERP' | 'hasStats'): boolean => {
    return PLANS[plan].limits[feature];
};
