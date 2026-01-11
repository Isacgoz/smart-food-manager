/**
 * Service de gestion de l'historique des prix
 * Suit toutes les modifications de prix pour l'audit et la conformité NF525
 */

import { Product } from '../shared/types';
import { BusinessError } from '../shared/services/monitoring';

export interface PriceHistoryEntry {
  id: string;
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  changeDate: string;
  changedBy: string;
  reason?: string;
  isRetroactive: boolean;
}

export interface PriceChange {
  productId: string;
  oldPrice: number;
  newPrice: number;
  reason?: string;
}

/**
 * Enregistre un changement de prix
 */
export function recordPriceChange(
  product: Product,
  newPrice: number,
  userId: string,
  reason?: string
): PriceHistoryEntry {
  
  // Vérifier que le prix est valide
  if (newPrice < 0) {
    throw new BusinessError(
      'INVALID_PRICE',
      'Le prix ne peut pas être négatif',
      { productId: product.id, newPrice }
    );
  }

  // Vérifier que le prix a changé
  if (newPrice === product.price) {
    throw new BusinessError(
      'PRICE_UNCHANGED',
      'Le nouveau prix est identique à l\'ancien',
      { productId: product.id, price: product.price }
    );
  }

  const entry: PriceHistoryEntry = {
    id: generatePriceHistoryId(),
    productId: product.id,
    productName: product.name,
    oldPrice: product.price,
    newPrice,
    changeDate: new Date().toISOString(),
    changedBy: userId,
    reason,
    isRetroactive: false
  };

  return entry;
}

/**
 * Vérifie si un changement de prix est rétroactif
 * Un changement est rétroactif s'il affecte des commandes déjà passées
 */
export function isRetroactivePriceChange(
  productId: string,
  lastOrderDate?: string
): boolean {
  if (!lastOrderDate) {
    return false;
  }

  const lastOrder = new Date(lastOrderDate);
  const now = new Date();
  
  // Si la dernière commande date de moins de 24h, c'est rétroactif
  const hoursSinceLastOrder = (now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastOrder < 24;
}

/**
 * Empêche les changements de prix rétroactifs (conformité NF525)
 */
export function validatePriceChange(
  product: Product,
  newPrice: number,
  lastOrderDate?: string
): void {
  
  if (isRetroactivePriceChange(product.id, lastOrderDate)) {
    throw new BusinessError(
      'RETROACTIVE_PRICE_CHANGE',
      'Impossible de modifier le prix: des commandes ont été passées dans les dernières 24h. ' +
      'Pour des raisons de conformité comptable (NF525), les prix ne peuvent pas être modifiés rétroactivement.',
      { productId: product.id, lastOrderDate }
    );
  }
}

/**
 * Calcule les statistiques de variation de prix
 */
export function calculatePriceStatistics(
  history: PriceHistoryEntry[]
): {
  totalChanges: number;
  averageChange: number;
  maxIncrease: number;
  maxDecrease: number;
  lastChange?: PriceHistoryEntry;
} {
  if (history.length === 0) {
    return {
      totalChanges: 0,
      averageChange: 0,
      maxIncrease: 0,
      maxDecrease: 0
    };
  }

  let totalChange = 0;
  let maxIncrease = 0;
  let maxDecrease = 0;

  for (const entry of history) {
    const change = entry.newPrice - entry.oldPrice;
    totalChange += change;
    
    if (change > maxIncrease) {
      maxIncrease = change;
    }
    if (change < maxDecrease) {
      maxDecrease = change;
    }
  }

  // Trier par date pour obtenir le dernier changement
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime()
  );

  return {
    totalChanges: history.length,
    averageChange: totalChange / history.length,
    maxIncrease,
    maxDecrease,
    lastChange: sortedHistory[0]
  };
}

/**
 * Obtient l'historique des prix pour un produit
 */
export function getProductPriceHistory(
  productId: string,
  allHistory: PriceHistoryEntry[]
): PriceHistoryEntry[] {
  return allHistory
    .filter(entry => entry.productId === productId)
    .sort((a, b) => new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime());
}

/**
 * Obtient le prix d'un produit à une date donnée
 */
export function getPriceAtDate(
  productId: string,
  date: string,
  currentPrice: number,
  history: PriceHistoryEntry[]
): number {
  const targetDate = new Date(date);
  
  // Filtrer l'historique pour ce produit
  const productHistory = getProductPriceHistory(productId, history);
  
  // Trouver le dernier changement avant la date cible
  for (const entry of productHistory) {
    const changeDate = new Date(entry.changeDate);
    
    if (changeDate <= targetDate) {
      return entry.newPrice;
    }
  }
  
  // Si aucun changement avant cette date, retourner le prix actuel
  return currentPrice;
}

/**
 * Formate un changement de prix pour l'affichage
 */
export function formatPriceChange(entry: PriceHistoryEntry): string {
  const change = entry.newPrice - entry.oldPrice;
  const changePercent = ((change / entry.oldPrice) * 100).toFixed(1);
  const direction = change > 0 ? '↑' : '↓';
  
  return `${direction} ${Math.abs(change).toFixed(2)}€ (${changePercent}%)`;
}

/**
 * Génère un ID unique pour l'historique des prix
 */
function generatePriceHistoryId(): string {
  return `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Exporte l'historique des prix au format CSV pour l'audit
 */
export function exportPriceHistoryCSV(history: PriceHistoryEntry[]): string {
  const headers = [
    'ID',
    'Produit',
    'Ancien Prix',
    'Nouveau Prix',
    'Variation',
    'Date',
    'Modifié par',
    'Raison',
    'Rétroactif'
  ];

  const rows = history.map(entry => {
    const change = entry.newPrice - entry.oldPrice;
    return [
      entry.id,
      entry.productName,
      entry.oldPrice.toFixed(2),
      entry.newPrice.toFixed(2),
      change.toFixed(2),
      new Date(entry.changeDate).toLocaleString('fr-FR'),
      entry.changedBy,
      entry.reason || '',
      entry.isRetroactive ? 'Oui' : 'Non'
    ];
  });

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

  return csvContent;
}

/**
 * Télécharge l'historique des prix au format CSV
 */
export function downloadPriceHistoryCSV(history: PriceHistoryEntry[]): void {
  const csv = exportPriceHistoryCSV(history);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const filename = `historique_prix_${new Date().toISOString().split('T')[0]}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Crée une entrée d'audit pour un changement de prix
 */
export interface PriceChangeAuditEntry {
  timestamp: string;
  action: 'PRICE_CHANGE';
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  userId: string;
  reason?: string;
  isRetroactive: boolean;
}

export function createPriceChangeAuditEntry(
  entry: PriceHistoryEntry
): PriceChangeAuditEntry {
  return {
    timestamp: entry.changeDate,
    action: 'PRICE_CHANGE',
    productId: entry.productId,
    productName: entry.productName,
    oldPrice: entry.oldPrice,
    newPrice: entry.newPrice,
    userId: entry.changedBy,
    reason: entry.reason,
    isRetroactive: entry.isRetroactive
  };
}
