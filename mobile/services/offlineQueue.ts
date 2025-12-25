import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './storage';
import { logger } from '../../shared/services/logger';

const QUEUE_KEY = 'offline_queue';

export interface QueuedAction {
  id: string;
  type: 'CREATE_ORDER' | 'UPDATE_KITCHEN_STATUS' | 'UPDATE_ORDER';
  payload: any;
  timestamp: string;
  retries: number;
  restaurantId: string;
}

/**
 * Récupérer queue depuis AsyncStorage
 */
export const getQueue = async (): Promise<QueuedAction[]> => {
  try {
    const json = await AsyncStorage.getItem(QUEUE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    logger.error('Failed to get queue', { error });
    return [];
  }
};

/**
 * Sauvegarder queue dans AsyncStorage
 */
const saveQueue = async (queue: QueuedAction[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    logger.error('Failed to save queue', { error });
  }
};

/**
 * Ajouter action à la queue
 */
export const queueAction = async (
  type: QueuedAction['type'],
  payload: any,
  restaurantId: string
): Promise<void> => {
  const queue = await getQueue();

  const action: QueuedAction = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload,
    timestamp: new Date().toISOString(),
    retries: 0,
    restaurantId
  };

  queue.push(action);
  await saveQueue(queue);

  logger.info('Action queued', {
    type,
    queueSize: queue.length,
    actionId: action.id
  });
};

/**
 * Retirer action de la queue
 */
const removeFromQueue = async (actionId: string): Promise<void> => {
  const queue = await getQueue();
  const filtered = queue.filter(a => a.id !== actionId);
  await saveQueue(filtered);
};

/**
 * Traiter la queue (envoyer actions à Supabase)
 */
export const processQueue = async (): Promise<{
  processed: number;
  failed: number;
  remaining: number;
}> => {
  const queue = await getQueue();

  if (queue.length === 0) {
    logger.debug('Queue empty, nothing to process');
    return { processed: 0, failed: 0, remaining: 0 };
  }

  logger.info('Processing queue', { queueSize: queue.length });

  let processed = 0;
  let failed = 0;
  const remaining: QueuedAction[] = [];

  for (const action of queue) {
    try {
      await processAction(action);
      processed++;
      logger.info('Action synced', { actionId: action.id, type: action.type });
    } catch (error) {
      logger.error('Action sync failed', {
        actionId: action.id,
        type: action.type,
        retries: action.retries,
        error
      });

      action.retries += 1;

      // Max 3 tentatives
      if (action.retries < 3) {
        remaining.push(action);
      } else {
        failed++;
        logger.error('Action dropped (max retries)', {
          actionId: action.id,
          type: action.type
        });
      }
    }
  }

  await saveQueue(remaining);

  logger.info('Queue processed', { processed, failed, remaining: remaining.length });

  return {
    processed,
    failed,
    remaining: remaining.length
  };
};

/**
 * Traiter une action selon son type
 */
const processAction = async (action: QueuedAction): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  const { restaurantId } = action;

  // Charger state actuel depuis Supabase
  const { data: stateData, error: fetchError } = await supabase
    .from('app_state')
    .select('data')
    .eq('id', restaurantId)
    .single();

  if (fetchError || !stateData) {
    throw new Error('Failed to fetch current state');
  }

  const currentState = stateData.data;

  switch (action.type) {
    case 'CREATE_ORDER': {
      const { order, updatedIngredients, movements } = action.payload;

      // Vérifier que la commande n'existe pas déjà (dédoublonnage)
      const orderExists = currentState.orders.some((o: any) => o.id === order.id);
      if (orderExists) {
        logger.warn('Order already exists, skipping', { orderId: order.id });
        return;
      }

      // Merger commande
      const updatedState = {
        ...currentState,
        orders: [...currentState.orders, order],
        ingredients: updatedIngredients,
        movements: [...currentState.movements, ...movements],
        _lastUpdatedAt: Date.now()
      };

      // Upsert state
      const { error: updateError } = await supabase
        .from('app_state')
        .update({ data: updatedState })
        .eq('id', restaurantId);

      if (updateError) {
        throw updateError;
      }

      logger.audit('CREATE_ORDER', 'ORDER', order.id, {
        source: 'mobile_offline_queue',
        queuedAt: action.timestamp
      });

      break;
    }

    case 'UPDATE_KITCHEN_STATUS': {
      const { orderId, status } = action.payload;

      // Trouver commande
      const orderIndex = currentState.orders.findIndex((o: any) => o.id === orderId);
      if (orderIndex === -1) {
        logger.warn('Order not found for status update', { orderId });
        return;
      }

      // Mettre à jour statut
      const updatedOrders = [...currentState.orders];
      updatedOrders[orderIndex] = {
        ...updatedOrders[orderIndex],
        kitchenStatus: status,
        version: (updatedOrders[orderIndex].version || 0) + 1,
        updatedAt: new Date().toISOString()
      };

      const updatedState = {
        ...currentState,
        orders: updatedOrders,
        _lastUpdatedAt: Date.now()
      };

      const { error: updateError } = await supabase
        .from('app_state')
        .update({ data: updatedState })
        .eq('id', restaurantId);

      if (updateError) {
        throw updateError;
      }

      logger.audit('UPDATE_KITCHEN_STATUS', 'ORDER', orderId, {
        status,
        source: 'mobile_offline_queue'
      });

      break;
    }

    case 'UPDATE_ORDER': {
      const { orderId, updates } = action.payload;

      const orderIndex = currentState.orders.findIndex((o: any) => o.id === orderId);
      if (orderIndex === -1) {
        logger.warn('Order not found for update', { orderId });
        return;
      }

      const updatedOrders = [...currentState.orders];
      updatedOrders[orderIndex] = {
        ...updatedOrders[orderIndex],
        ...updates,
        version: (updatedOrders[orderIndex].version || 0) + 1,
        updatedAt: new Date().toISOString()
      };

      const updatedState = {
        ...currentState,
        orders: updatedOrders,
        _lastUpdatedAt: Date.now()
      };

      const { error: updateError } = await supabase
        .from('app_state')
        .update({ data: updatedState })
        .eq('id', restaurantId);

      if (updateError) {
        throw updateError;
      }

      logger.audit('UPDATE_ORDER', 'ORDER', orderId, {
        source: 'mobile_offline_queue'
      });

      break;
    }

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
};

/**
 * Vider complètement la queue (pour debug/reset)
 */
export const clearQueue = async (): Promise<void> => {
  await AsyncStorage.removeItem(QUEUE_KEY);
  logger.info('Queue cleared');
};

/**
 * Obtenir taille queue
 */
export const getQueueSize = async (): Promise<number> => {
  const queue = await getQueue();
  return queue.length;
};
