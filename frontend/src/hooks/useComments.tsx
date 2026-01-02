import { useState, useCallback } from 'react';

export interface CommentItem {
  id: string;
  timestamp: number;
  endTimestamp?: number;
  text?: string;
  audio_url?: string;
  type: 'text' | 'audio';
  created_at: string;
}

export const useComments = () => {
  const [comments, setComments] = useState<CommentItem[]>([]);

  const addComment = useCallback((payload: CommentItem | CommentItem[]) => {
    setComments((prev: { map: (arg0: (c: any) => any[]) => Iterable<readonly [unknown, unknown]> | null | undefined; }) => {
      const items = Array.isArray(payload) ? payload : [payload];
      // ensure no duplicate ids by replacing existing ones with same id
      const byId = new Map(prev.map((c: { id: any; }) => [c.id, c]));
      for (const it of items) {
        byId.set(it.id, it);
      }
      return Array.from(byId.values()).sort((a, b) => a.timestamp - b.timestamp);
    });
  }, []);

  const updateComment = useCallback((id: string, patch: Partial<CommentItem>) => {
    setComments((prev: any[]) => prev.map((c: { id: string; }) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const removeComment = useCallback((id: string) => {
    setComments((prev: any[]) => prev.filter((c: { id: string; }) => c.id !== id));
  }, []);

  return {
    comments,
    addComment,
    updateComment,
    removeComment,
  };
};