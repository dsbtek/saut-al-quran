interface PendingRecording {
    id: string;
    data: {
        surah_name: string;
        ayah_start: number;
        ayah_end: number;
        audio_data: string;
        duration?: number;
    };
    token: string;
    timestamp: number;
}

interface PendingMarker {
    id: string;
    data: {
        recitation_id: number;
        timestamp: number;
        label: string;
        description?: string;
    };
    token: string;
    timestamp: number;
}

class OfflineStorage {
    private dbName = 'SautAlQuranDB';
    private version = 1;

    private async openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = () => {
                const db = request.result;

                // Create object stores
                if (!db.objectStoreNames.contains('pendingRecordings')) {
                    db.createObjectStore('pendingRecordings', {
                        keyPath: 'id',
                    });
                }

                if (!db.objectStoreNames.contains('pendingMarkers')) {
                    db.createObjectStore('pendingMarkers', { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains('cachedRecitations')) {
                    db.createObjectStore('cachedRecitations', {
                        keyPath: 'id',
                    });
                }

                if (!db.objectStoreNames.contains('cachedComments')) {
                    db.createObjectStore('cachedComments', { keyPath: 'id' });
                }
            };
        });
    }

    // Pending recordings for offline submission
    async savePendingRecording(
        recording: Omit<PendingRecording, 'id' | 'timestamp'>,
    ): Promise<string> {
        const db = await this.openDB();
        const id =
            Date.now().toString() + Math.random().toString(36).substr(2, 9);

        const pendingRecording: PendingRecording = {
            id,
            ...recording,
            timestamp: Date.now(),
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                ['pendingRecordings'],
                'readwrite',
            );
            const store = transaction.objectStore('pendingRecordings');
            const request = store.add(pendingRecording);

            request.onsuccess = () => resolve(id);
            request.onerror = () => reject(request.error);
        });
    }

    async getPendingRecordings(): Promise<PendingRecording[]> {
        const db = await this.openDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                ['pendingRecordings'],
                'readonly',
            );
            const store = transaction.objectStore('pendingRecordings');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async removePendingRecording(id: string): Promise<void> {
        const db = await this.openDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                ['pendingRecordings'],
                'readwrite',
            );
            const store = transaction.objectStore('pendingRecordings');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Pending markers for offline creation
    async savePendingMarker(
        marker: Omit<PendingMarker, 'id' | 'timestamp'>,
    ): Promise<string> {
        const db = await this.openDB();
        const id =
            Date.now().toString() + Math.random().toString(36).substr(2, 9);

        const pendingMarker: PendingMarker = {
            id,
            ...marker,
            timestamp: Date.now(),
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingMarkers'], 'readwrite');
            const store = transaction.objectStore('pendingMarkers');
            const request = store.add(pendingMarker);

            request.onsuccess = () => resolve(id);
            request.onerror = () => reject(request.error);
        });
    }

    async getPendingMarkers(): Promise<PendingMarker[]> {
        const db = await this.openDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingMarkers'], 'readonly');
            const store = transaction.objectStore('pendingMarkers');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async removePendingMarker(id: string): Promise<void> {
        const db = await this.openDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingMarkers'], 'readwrite');
            const store = transaction.objectStore('pendingMarkers');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Cache management
    async cacheRecitations(recitations: any[]): Promise<void> {
        const db = await this.openDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                ['cachedRecitations'],
                'readwrite',
            );
            const store = transaction.objectStore('cachedRecitations');

            // Clear existing cache
            store.clear();

            // Add new data
            recitations.forEach((recitation) => {
                store.add(recitation);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async getCachedRecitations(): Promise<any[]> {
        const db = await this.openDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                ['cachedRecitations'],
                'readonly',
            );
            const store = transaction.objectStore('cachedRecitations');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async cacheComments(recitationId: number, comments: any[]): Promise<void> {
        const db = await this.openDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['cachedComments'], 'readwrite');
            const store = transaction.objectStore('cachedComments');

            const cacheEntry = {
                id: `recitation_${recitationId}`,
                recitationId,
                comments,
                timestamp: Date.now(),
            };

            const request = store.put(cacheEntry);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getCachedComments(recitationId: number): Promise<any[]> {
        const db = await this.openDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['cachedComments'], 'readonly');
            const store = transaction.objectStore('cachedComments');
            const request = store.get(`recitation_${recitationId}`);

            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.comments : []);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Check if online
    isOnline(): boolean {
        return navigator.onLine;
    }

    // Register for background sync
    async registerBackgroundSync(): Promise<void> {
        if (
            'serviceWorker' in navigator &&
            'sync' in window.ServiceWorkerRegistration.prototype
        ) {
            const registration = await navigator.serviceWorker.ready;
            // Type assertion for sync property
            await (registration as any).sync.register(
                'background-sync-recordings',
            );
        }
    }
}

export const offlineStorage = new OfflineStorage();
