const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `smart-food-manager-${CACHE_VERSION}`;

// Ressources critiques à mettre en cache immédiatement
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Stratégies de cache
const CACHE_STRATEGIES = {
  // Cache First: Assets statiques (JS, CSS, images)
  CACHE_FIRST: 'cache-first',
  // Network First: API calls, données dynamiques
  NETWORK_FIRST: 'network-first',
  // Stale While Revalidate: Données semi-statiques
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Install event: Pré-cache des ressources critiques
self.addEventListener('install', (event) => {
  console.log('[SW] Install event', CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Force activation immédiate
      return self.skipWaiting();
    })
  );
});

// Activate event: Nettoyage anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event', CACHE_VERSION);

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Prendre contrôle immédiat de tous les clients
      return self.clients.claim();
    })
  );
});

// Fetch event: Gestion requêtes avec stratégies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer requêtes non-HTTP
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Ignorer requêtes Supabase (toujours network)
  if (url.hostname.includes('supabase')) {
    return;
  }

  // Déterminer stratégie selon type ressource
  if (request.destination === 'document') {
    // HTML: Network First (mais cache en fallback offline)
    event.respondWith(networkFirstStrategy(request));
  } else if (request.destination === 'script' || request.destination === 'style') {
    // JS/CSS: Cache First
    event.respondWith(cacheFirstStrategy(request));
  } else if (request.destination === 'image') {
    // Images: Cache First
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // Autres: Stale While Revalidate
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});

/**
 * Cache First: Chercher en cache d'abord, sinon réseau
 */
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache First fetch failed:', error);
    // Retourner page offline si disponible
    return cache.match('/offline.html') || new Response('Offline', { status: 503 });
  }
}

/**
 * Network First: Réseau d'abord, cache en fallback
 */
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, using cache:', request.url);
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

/**
 * Stale While Revalidate: Servir cache immédiatement, mettre à jour en arrière-plan
 */
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // Toujours tenter fetch en arrière-plan
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  // Retourner cache immédiatement si dispo, sinon attendre fetch
  return cached || fetchPromise;
}

/**
 * Background Sync: Queue requêtes offline
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingOrders());
  }
});

async function syncPendingOrders() {
  try {
    // Récupérer commandes en attente depuis IndexedDB
    const db = await openDB();
    const pendingOrders = await db.getAll('pending-orders');

    console.log('[SW] Syncing pending orders:', pendingOrders.length);

    for (const order of pendingOrders) {
      try {
        // Envoyer à Supabase
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });

        if (response.ok) {
          // Supprimer de la queue
          await db.delete('pending-orders', order.id);
          console.log('[SW] Order synced:', order.id);
        }
      } catch (err) {
        console.error('[SW] Failed to sync order:', order.id, err);
      }
    }

    return true;
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error;
  }
}

/**
 * Push Notifications: Alertes temps réel
 */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Fermer' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Smart Food Manager', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

/**
 * Helper: Ouvrir IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('smart-food-manager', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-orders')) {
        db.createObjectStore('pending-orders', { keyPath: 'id' });
      }
    };
  });
}

console.log('[SW] Service Worker loaded', CACHE_VERSION);
