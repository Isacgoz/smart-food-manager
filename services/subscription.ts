
import { PlanType, SubscriptionPlan } from "../types";

export const PLANS: Record<PlanType, SubscriptionPlan> = {
    SOLO: {
        id: 'SOLO',
        name: 'Solo',
        price: 29,
        limits: {
            users: 1,
            products: 50,
            tables: 10,
            hasERP: true,
            hasStats: false,
            supportPriority: 'LOW'
        }
    },
    TEAM: {
        id: 'TEAM',
        name: 'Team',
        price: 79,
        limits: {
            users: 5,
            products: 200,
            tables: 30,
            hasERP: true,
            hasStats: true,
            supportPriority: 'MEDIUM'
        }
    },
    BUSINESS: {
        id: 'BUSINESS',
        name: 'Business',
        price: 149,
        limits: {
            users: -1,
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
