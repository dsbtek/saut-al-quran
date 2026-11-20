const CACHE_NAME = 'saut-al-quran-v2';
const urlsToCache = ['/', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls or non-GET requests
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
          return cached;
        });

      return cached || fetchPromise;
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-recordings') {
    event.waitUntil(syncRecordings());
  }
});

async function syncRecordings() {
  try {
    const pendingRecordings = await getPendingRecordings();
    for (const recording of pendingRecordings) {
      try {
        const response = await fetch('/api/v1/recitations/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${recording.token}`,
          },
          body: JSON.stringify(recording.data),
        });
        if (response.ok) {
          await removePendingRecording(recording.id);
        }
      } catch (error) {
        console.error('Failed to sync recording:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function getPendingRecordings() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SautAlQuranDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pendingRecordings')) {
        resolve([]);
        return;
      }
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
    request.onerror = () => reject(request.error);
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
