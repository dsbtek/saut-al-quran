import { useCallback, useState } from 'react';

export interface Marker {
  id: string;
  time: number;
  label: string;
  description?: string;
  category?: string;
  color?: string;
}

/**
 * Hook to manage markers used in the waveform/editor.
 * - handleMarkerAdd accepts a single Marker, an Omit<Marker,'id'>, or an array of those.
 */
export const useMarkers = () => {
  const [markers, setMarkers] = useState<Marker[]>([]);

  const generateId = useCallback((): string => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }, []);

  const handleMarkerAdd = useCallback(
    (payload: Marker | Omit<Marker, 'id'> | Array<Marker | Omit<Marker, 'id'>>) => {
      const items = Array.isArray(payload) ? payload : [payload];
      setMarkers((prev: { map: (arg0: (m: any) => any[]) => Iterable<readonly [unknown, unknown]> | null | undefined; }) => {
        const byId = new Map(prev.map((m: { id: any; }) => [m.id, m]));
        for (const it of items) {
          const marker = (it as Marker).id
            ? (it as Marker)
            : ({ id: generateId(), ...(it as Omit<Marker, 'id'>) } as Marker);
          byId.set(marker.id, marker);
        }
        return Array.from(byId.values()).sort((a, b) => a.time - b.time);
      });
    },
    [generateId],
  );

  const handleMarkerUpdate = useCallback((id: string, patch: Partial<Marker>) => {
    setMarkers((prev: any[]) => prev.map((m: { id: string; }) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const handleMarkerDelete = useCallback((id: string) => {
    setMarkers((prev: any[]) => prev.filter((m: { id: string; }) => m.id !== id));
  }, []);

  const clearMarkers = useCallback(() => {
    setMarkers([]);
  }, []);

  return {
    markers,
    handleMarkerAdd,
    handleMarkerUpdate,
    handleMarkerDelete,
    clearMarkers,
  };
};

export default useMarkers;