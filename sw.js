const CACHE_NAME = 'lily-birthday-v1';
const BASE_URL = '/LilyBirthday';

// Lista de archivos a cachear con rutas absolutas para GitHub Pages
const urlsToCache = [
  `${BASE_URL}/`,
  `${BASE_URL}/index.html`,
  `${BASE_URL}/manifest.json`,
  `${BASE_URL}/triples-bg.jpg`,
  `${BASE_URL}/chikibang.mp4`,
  `${BASE_URL}/logo.png`,
  `${BASE_URL}/logo-512.png`
];

self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache:', error);
      })
  );
  // Forzar la activación inmediata
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomar control inmediato de todas las páginas
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  // Solo interceptar requests GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si encontramos el archivo en cache, lo devolvemos
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }

        // Si no está en cache, intentamos hacer fetch
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Verificar si la respuesta es válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta para poder usarla tanto para devolver como para cachear
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // Si es la página principal, devolver desde cache
            if (event.request.url.includes('/LilyBirthday/') || event.request.url.endsWith('/')) {
              return caches.match(`${BASE_URL}/index.html`);
            }
          });
      })
  );
});
