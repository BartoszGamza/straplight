import { useState, useEffect, useCallback, useRef } from 'react';
import { getFetchClient } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';

export interface SearchResult {
  id: number;
  documentId: string;
  label: string;
  contentType: string;
  uid: string;
}

export function useStraplight() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(0);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSelectedIndex(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { get } = getFetchClient();
        const { data } = await get(`/${PLUGIN_ID}/search`, {
          params: { q: trimmed },
        });
        setResults((data as any).results || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error('[straplight] search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isOpen]);

  const navigateToResult = useCallback(
    (result: SearchResult) => {
      const path = `/content-manager/collection-types/${result.uid}/${result.documentId}`;
      // Use captured SPA navigate if available, otherwise full navigation
      const nav = (window as any).__straplight?.navigate;
      if (nav) {
        nav(path);
      } else {
        window.location.href = `/admin${path}`;
      }
      close();
    },
    [close]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i > 0 ? i - 1 : results.length - 1));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        navigateToResult(results[selectedIndex]);
      }
    },
    [results, selectedIndex, navigateToResult, close]
  );

  return {
    isOpen,
    query,
    setQuery,
    results,
    loading,
    selectedIndex,
    close,
    onKeyDown,
    navigateToResult,
  };
}
