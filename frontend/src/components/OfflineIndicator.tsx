import React, { useState, useEffect } from 'react';
import { offlineStorage } from '../services/offlineStorage';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending items count
    loadPendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingCount = async () => {
    try {
      const [recordings, markers] = await Promise.all([
        offlineStorage.getPendingRecordings(),
        offlineStorage.getPendingMarkers(),
      ]);
      setPendingCount(recordings.length + markers.length);
    } catch (error) {
      console.error('Failed to load pending count:', error);
    }
  };

  if (isOnline && pendingCount === 0) {
    return null; // Don't show anything when online and no pending items
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 1000,
        backgroundColor: isOnline ? '#28a745' : '#dc3545',
        color: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}
    >
      {isOnline ? (
        <>
          🟢 Online
          {pendingCount > 0 && (
            <span style={{ marginLeft: '8px' }}>
              ({pendingCount} pending)
            </span>
          )}
        </>
      ) : (
        <>🔴 Offline</>
      )}
    </div>
  );
};

export default OfflineIndicator;
