// alfred ai Service Worker v1.1
// Provides offline caching for static assets and API responses

const CACHE_NAME = 'alfred-ai-v5';
const STATIC_CACHE = 'alfred-static-v5';
const API_CACHE = 'alfred-api-v5';
const IMAGE_CACHE = 'alfred-images-v5';

const IS_LOVABLE_PREVIEW_HOST =
  /^id-preview--/i.test(self.location.hostname) ||
  /\.lovableproject\.com$/i.test(self.location.hostname);

// Offline fallback page
const OFFLINE_PAGE = '/offline.html';

// Static assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/favicon.jpg',
  '/alfred-ai-mid.png',
  '/alfred-ai-white-mid.png',
  '/placeholder.svg',
  '/manifest.json'
];

// API patterns to cache
const API_PATTERNS = [
  /\/rest\/v1\/blog_posts/,
  /\/rest\/v1\/testimonials/,
  /\/rest\/v1\/guides_playbooks/,
  /\/rest\/v1\/webinars_events/,
  /\/rest\/v1\/faqs/,
  /\/rest\/v1\/documentation/
];

// Image patterns to cache
const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|webp|gif|svg|ico)$/i,
  /supabase\.co\/storage/,
  /img\.youtube\.com/,
  /i\.ytimg\.com/
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  if (IS_LOVABLE_PREVIEW_HOST) {
    return;
  }

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Precache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  if (IS_LOVABLE_PREVIEW_HOST) {
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName))))
        .then(() => self.registration.unregister())
    );
    return;
  }

  const validCaches = [CACHE_NAME, STATIC_CACHE, API_CACHE, IMAGE_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => !validCaches.includes(cacheName))
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - handle caching strategies
self.addEventListener('fetch', (event) => {
  if (IS_LOVABLE_PREVIEW_HOST) {
    return;
  }

  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Skip admin routes and auth-related requests
  if (url.pathname.startsWith('/admin') || url.pathname.includes('auth')) {
    return;
  }

  // Check if it's an API request
  const isApiRequest = API_PATTERNS.some(pattern => pattern.test(url.href));
  
  // Check if it's an image request
  const isImageRequest = IMAGE_PATTERNS.some(pattern => pattern.test(url.href));
  
  // Check if it's a navigation request (HTML page)
  const isNavigationRequest = request.mode === 'navigate';

  if (isNavigationRequest) {
    // Network-first with offline fallback for navigation
    event.respondWith(handleNavigationRequest(request));
  } else if (isApiRequest) {
    // Network-first strategy for API requests with 5-minute cache
    event.respondWith(networkFirstWithCache(request, API_CACHE, 5 * 60 * 1000));
  } else if (isImageRequest) {
    // Cache-first strategy for images
    event.respondWith(cacheFirstWithNetwork(request, IMAGE_CACHE));
  } else if (url.origin === self.location.origin) {
    // Stale-while-revalidate for same-origin static assets
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
});

/**
 * Handle navigation requests with offline fallback
 */
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful navigation responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No cache, return offline page
    const offlineResponse = await cache.match(OFFLINE_PAGE);
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback: return a basic offline response
    return new Response(
      '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your connection and try again.</p></body></html>',
      {
        headers: { 'Content-Type': 'text/html' },
        status: 503
      }
    );
  }
}

/**
 * Network-first strategy with cache fallback
 * Good for API responses that need to be fresh but should work offline
 */
async function networkFirstWithCache(request, cacheName, maxAge) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      // Clone the response and add timestamp header for cache validation
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const modifiedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers
      });
      
      cache.put(request, modifiedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cache is still valid
      const cacheTime = cachedResponse.headers.get('sw-cache-time');
      if (cacheTime && (Date.now() - parseInt(cacheTime)) < maxAge) {
        console.log('[SW] Serving from cache (offline):', request.url);
        return cachedResponse;
      }
    }
    
    // Return a minimal offline response for API requests
    return new Response(JSON.stringify({ offline: true, error: 'Network unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Cache-first strategy with network fallback
 * Good for static assets like images
 */
async function cacheFirstWithNetwork(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return cached response immediately
    // Optionally update cache in background
    updateCacheInBackground(request, cache);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return placeholder for failed image requests
    console.log('[SW] Image fetch failed:', request.url);
    return new Response('', { status: 404 });
  }
}

/**
 * Stale-while-revalidate strategy
 * Returns cached version immediately while fetching update
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

/**
 * Update cache in background without blocking
 */
function updateCacheInBackground(request, cache) {
  fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response);
      }
    })
    .catch(() => {
      // Silently fail - we already have a cached version
    });
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
  
  if (event.data && event.data.type === 'PREFETCH') {
    const urls = event.data.urls || [];
    event.waitUntil(prefetchResources(urls));
  }
});

/**
 * Prefetch resources for navigation
 */
async function prefetchResources(urls) {
  const cache = await caches.open(STATIC_CACHE);
  
  for (const url of urls) {
    try {
      const response = await fetch(url, { priority: 'low' });
      if (response.ok) {
        await cache.put(url, response);
        console.log('[SW] Prefetched:', url);
      }
    } catch (error) {
      // Silently fail prefetch
    }
  }
}
