import { useState, useEffect, useCallback, useRef } from 'react';
import { getFetchClient } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';
import { useStraplightSettings } from './useStraplightSettings';

export interface SearchResult {
  id: number;
  documentId: string;
  label: string;
  contentType: string;
  uid: string;
  fields: { name: string; value: string }[];
}

export function useStraplight() {
  const settings = useStraplightSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

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
    requestIdRef.current++;
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = query.trim();
    if (trimmed.length < settings.minQueryLength) {
      setResults([]);
      setSelectedIndex(0);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const id = ++requestIdRef.current;
      setLoading(true);
      try {
        const { get } = getFetchClient();
        const { data } = await get(`/${PLUGIN_ID}/search`, {
          params: { q: trimmed },
        });
        // Ignore stale responses
        if (id !== requestIdRef.current) return;
        setResults((data as any).results || []);
        setSelectedIndex(0);
      } catch {
        if (id !== requestIdRef.current) return;
        setResults([]);
      } finally {
        if (id === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, settings.debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isOpen, settings.debounceMs, settings.minQueryLength]);

  const navigateToResult = useCallback(
    (result: SearchResult) => {
      const path = `/content-manager/collection-types/${result.uid}/${result.documentId}`;
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
