import { CashDeclaration } from '../types';
import { logger } from './logger';

export interface CashSession {
  id: string;
  restaurantId: string;
  userId: string;
  userName: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  closingCash?: number;
  theoreticalCash?: number;
  variance?: number;
  status: 'OPEN' | 'CLOSED';
}

export interface CashChange {
  amount: number;
  bills: { value: number; count: number }[];
  coins: { value: number; count: number }[];
  total: number;
}

// Valeurs monnaie Euro
const EURO_BILLS = [500, 200, 100, 50, 20, 10, 5];
const EURO_COINS = [2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01];

/**
 * Calcule rendu monnaie optimal (algorithme glouton)
 */
export const calculateChange = (amountDue: number, amountGiven: number): CashChange => {
  let remaining = Math.round((amountGiven - amountDue) * 100) / 100;

  if (remaining < 0) {
    logger.warn('Montant donné insuffisant', { amountDue, amountGiven });
    return {
      amount: 0,
      bills: [],
      coins: [],
      total: 0
    };
  }

  const bills: { value: number; count: number }[] = [];
  const coins: { value: number; count: number }[] = [];

  // Billets
  for (const bill of EURO_BILLS) {
    if (remaining >= bill) {
      const count = Math.floor(remaining / bill);
      bills.push({ value: bill, count });
      remaining = Math.round((remaining - bill * count) * 100) / 100;
    }
  }

  // Pièces
  for (const coin of EURO_COINS) {
    if (remaining >= coin) {
      const count = Math.floor(remaining / coin);
      coins.push({ value: coin, count });
      remaining = Math.round((remaining - coin * count) * 100) / 100;
    }
  }

  const total = amountGiven - amountDue;

  logger.debug('Rendu monnaie calculé', {
    amountDue,
    amountGiven,
    change: total,
    bills,
    coins
  });

  return {
    amount: total,
    bills,
    coins,
    total
  };
};

/**
 * Formatte rendu monnaie pour affichage
 */
export const formatChange = (change: CashChange): string => {
  if (change.total === 0) return 'Montant exact';

  const parts: string[] = [];

  change.bills.forEach(b => {
    parts.push(`${b.count} × ${b.value}€`);
  });

  change.coins.forEach(c => {
    parts.push(`${c.count} × ${c.value.toFixed(2)}€`);
  });

  return `Rendu: ${change.total.toFixed(2)}€\n${parts.join(', ')}`;
};

/**
 * Ouvrir session caisse
 */
export const openCashSession = (
  restaurantId: string,
  userId: string,
  userName: string,
  openingCash: number
): CashSession => {
  const session: CashSession = {
    id: `session-${Date.now()}`,
    restaurantId,
    userId,
    userName,
    openedAt: new Date().toISOString(),
    openingCash,
    status: 'OPEN'
  };

  logger.info('Session caisse ouverte', {
    sessionId: session.id,
    userId,
    openingCash
  });

  return session;
};

/**
 * Fermer session caisse
 */
export const closeCashSession = (
  session: CashSession,
  closingCash: number,
  theoreticalCash: number
): CashSession => {
  const variance = closingCash - theoreticalCash;

  const closedSession: CashSession = {
    ...session,
    closedAt: new Date().toISOString(),
    closingCash,
    theoreticalCash,
    variance,
    status: 'CLOSED'
  };

  logger.audit('CLOSE_SESSION', 'CASH_REGISTER', session.id, {
    openingCash: session.openingCash,
    closingCash,
    theoreticalCash,
    variance
  });

  if (Math.abs(variance) > 10) {
    logger.warn('Écart caisse important', {
      sessionId: session.id,
      variance,
      closingCash,
      theoreticalCash
    });
  }

  return closedSession;
};

/**
 * Calculer théorique caisse (ouverture + espèces encaissées)
 */
export const calculateTheoreticalCash = (
  openingCash: number,
  cashSales: number
): number => {
  return openingCash + cashSales;
};

/**
 * Analyser écart caisse
 */
export const analyzeCashVariance = (
  variance: number
): {
  severity: 'ok' | 'warning' | 'critical';
  message: string;
} => {
  const absVariance = Math.abs(variance);

  if (absVariance === 0) {
    return {
      severity: 'ok',
      message: 'Caisse équilibrée'
    };
  }

  if (absVariance <= 5) {
    return {
      severity: 'ok',
      message: `Écart acceptable: ${variance > 0 ? '+' : ''}${variance.toFixed(2)}€`
    };
  }

  if (absVariance <= 20) {
    return {
      severity: 'warning',
      message: `Écart à surveiller: ${variance > 0 ? '+' : ''}${variance.toFixed(2)}€`
    };
  }

  return {
    severity: 'critical',
    message: `Écart important: ${variance > 0 ? '+' : ''}${variance.toFixed(2)}€ (vérifier transactions)`
  };
};

/**
 * Historique déclarations caisse
 */
export const getCashDeclarationHistory = (
  declarations: CashDeclaration[],
  userId?: string,
  startDate?: string,
  endDate?: string
): CashDeclaration[] => {
  return declarations.filter(decl => {
    if (userId && decl.userId !== userId) return false;
    if (startDate && decl.date < startDate) return false;
    if (endDate && decl.date > endDate) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));
};
