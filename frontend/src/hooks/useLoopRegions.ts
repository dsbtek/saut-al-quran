import { useCallback, useState } from 'react';

export interface LoopRegion {
  id: string;
  start: number;
  end: number;
  color?: string;
  enabled?: boolean;
}

export const useLoopRegions = () => {
  const [loopRegions, setLoopRegions] = useState<LoopRegion[]>([]);
  const [activeLoopId, setActiveLoopId] = useState<string | null>(null);

  const generateId = useCallback(() => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`, []);

  const handleLoopRegionAdd = useCallback(
    (payload: LoopRegion | Omit<LoopRegion, 'id'> | Array<LoopRegion | Omit<LoopRegion, 'id'>>) => {
      const items = Array.isArray(payload) ? payload : [payload];
      setLoopRegions((prev: { map: (arg0: (r: any) => any[]) => Iterable<readonly [unknown, unknown]> | null | undefined; }) => {
        const byId = new Map(prev.map((r: { id: any; }) => [r.id, r]));
        for (const it of items) {
          const region = (it as LoopRegion).id
            ? (it as LoopRegion)
            : ({ id: generateId(), enabled: true, ...(it as Omit<LoopRegion, 'id'>) } as LoopRegion);
          byId.set(region.id, region);
        }
        return (Array.from(byId.values()) as LoopRegion[]).sort((a, b) => a.start - b.start);
      });
    },
    [generateId],
  );

  const handleLoopRegionUpdate = useCallback((id: string, patch: Partial<LoopRegion>) => {
    setLoopRegions((prev: any[]) => prev.map((r: { id: string; }) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const handleLoopRegionDelete = useCallback((id: string) => {
    setLoopRegions((prev: any[]) => prev.filter((r: { id: string; }) => r.id !== id));
    setActiveLoopId((current: string) => (current === id ? null : current));
  }, []);

  const handleLoopToggle = useCallback((id: string) => {
    setLoopRegions((prev: any[]) =>
      prev.map((r: { id: string; enabled: any; }) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    );
    setActiveLoopId((current: string) => (current === id ? null : id));
  }, []);

  const clearLoopRegions = useCallback(() => {
    setLoopRegions([]);
    setActiveLoopId(null);
  }, []);

  return {
    loopRegions,
    activeLoopId,
    handleLoopRegionAdd,
    handleLoopRegionUpdate,
    handleLoopRegionDelete,
    handleLoopToggle,
    clearLoopRegions,
    setActiveLoopId,
  };
};

export default useLoopRegions;