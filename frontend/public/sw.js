const CACHE_NAME = 'saut-al-quran-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response because it's a stream
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(() => {
          // Return offline page for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline recordings
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-recordings') {
    event.waitUntil(syncRecordings());
  }
});

async function syncRecordings() {
  try {
    // Get pending recordings from IndexedDB
    const pendingRecordings = await getPendingRecordings();
    
    for (const recording of pendingRecordings) {
      try {
        // Attempt to upload recording
        const response = await fetch('/api/v1/recitations/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${recording.token}`
          },
          body: JSON.stringify(recording.data)
        });
        
        if (response.ok) {
          // Remove from pending recordings
          await removePendingRecording(recording.id);
          console.log('Recording synced successfully');
        }
      } catch (error) {
        console.error('Failed to sync recording:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// IndexedDB helpers for offline storage
async function getPendingRecordings() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SautAlQuranDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingRecordings'], 'readonly');
      const store = transaction.objectStore('pendingRecordings');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pendingRecordings')) {
        db.createObjectStore('pendingRecordings', { keyPath: 'id' });
      }
    };
  });
}

async function removePendingRecording(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SautAlQuranDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingRecordings'], 'readwrite');
      const store = transaction.objectStore('pendingRecordings');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}
