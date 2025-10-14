// 📱 SERVICE WORKER POUR PWA - L'ŒIL D'OPANOMA
// Version simple et efficace

const CACHE_NAME = 'opanoma-mobile-v1';
const BASE_URL = self.registration ? self.registration.scope : new URL('./', self.location.href).href;
const BASE_PATH = new URL('./', BASE_URL).pathname;
const MOBILE_PATH = new URL('mobile.html', BASE_URL).pathname;
const INDEX_PATH = new URL('index.html', BASE_URL).pathname;
const API_PREFIX = new URL('api', BASE_URL).pathname;

function resolveAsset(path) {
  return new URL(path, BASE_URL).toString();
}

const ROOT_ASSET = resolveAsset('./');
const MOBILE_ASSET = resolveAsset('mobile.html');
const INDEX_ASSET = resolveAsset('index.html');

const LOGO_ASSET = resolveAsset('public/img/logo.png');

const ASSETS_TO_CACHE = [
  ROOT_ASSET,
  MOBILE_ASSET,
  INDEX_ASSET,
  resolveAsset('src/style.css'),
  resolveAsset('src/newsletter-mobile.css'),
  LOGO_ASSET,
  // Cartes essentielles pour offline
  resolveAsset('public/img/majors/00-le-mat.webp'),
  resolveAsset('public/img/majors/01-le-bateleur.webp'),
  resolveAsset('public/img/majors/02-la-papesse.webp')
];

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log('📱 Service Worker installé');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cache ouvert, ajout des assets...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('✅ Assets mis en cache');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Erreur cache:', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker activé');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Supprimer les anciens caches
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Interception des requêtes (stratégie Cache First pour les assets)
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-GET et les APIs
  if (
    request.method !== 'GET' ||
    url.pathname === API_PREFIX ||
    url.pathname.startsWith(`${API_PREFIX}/`)
  ) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Si trouvé en cache, le retourner
        if (cachedResponse) {
          console.log('📦 Servi depuis le cache:', request.url);
          return cachedResponse;
        }
        
        // Sinon, aller sur le réseau
        return fetch(request)
          .then(networkResponse => {
            // Si c'est un asset important, le mettre en cache
            if (shouldCache(request)) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseClone);
                });
            }
            
            return networkResponse;
          })
          .catch(error => {
            console.log('🔌 Hors ligne pour:', request.url);
            
            // Page de fallback pour navigation hors ligne
            if (request.destination === 'document') {
              return caches.match(MOBILE_ASSET);
            }
            
            // Image de fallback
            if (request.destination === 'image') {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#667eea"/><text x="100" y="100" text-anchor="middle" fill="white" font-size="16">🔮 Opanoma</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            
            throw error;
          });
      })
  );
});

// Fonction pour déterminer si une ressource doit être cachée
function shouldCache(request) {
  const url = new URL(request.url);
  
  // Cacher les assets CSS/JS/images
  if (url.pathname.match(/\.(css|js|png|jpg|jpeg|webp|svg|gif)$/)) {
    return true;
  }
  
  // Cacher les pages importantes
  if (url.pathname === BASE_PATH || url.pathname === MOBILE_PATH || url.pathname === INDEX_PATH) {
    return true;
  }
  
  return false;
}

// Notification de mise à jour disponible
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notifications (pour futures fonctionnalités)
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: LOGO_ASSET,
      badge: LOGO_ASSET,
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Voir ma guidance',
          icon: LOGO_ASSET
        },
        {
          action: 'close',
          title: 'Fermer',
          icon: LOGO_ASSET
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification('🔮 L\'Œil d\'Opanoma', options)
    );
  }
});

// Gestion des clics sur notifications
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    // Ouvrir l'app
    event.waitUntil(
      clients.openWindow(MOBILE_ASSET)
    );
  }
});

console.log('🔮 Service Worker L\'Œil d\'Opanoma prêt !');