// BuildaQuest Service Worker
// Provides basic offline functionality and caching

const CACHE_NAME = 'buildaquest-v1'
const STATIC_CACHE_URLS = [
  '/',
  '/demo',
  '/pricing',
  '/contact',
  '/privacy',
  '/terms',
  '/logo-full.svg',
  '/favicon.ico',
  '/manifest.json'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('BuildaQuest: Caching static assets')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .catch((error) => {
        console.error('BuildaQuest: Failed to cache static assets:', error)
      })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('BuildaQuest: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse.status === 200) {
              const responseClone = networkResponse.clone()
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone)
                })
            }
            return networkResponse
          })
          .catch((error) => {
            console.log('BuildaQuest: Network request failed:', error)

            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/')
            }

            throw error
          })
      })
  )
})

// Background sync for form submissions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('BuildaQuest: Background sync triggered')
    // Handle background sync logic here
  }
})

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    console.log('BuildaQuest: Push notification received:', data)

    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/favicon-32x32.png',
      data: data.data
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  )
})