'use client';

import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from './use-debounced-value';

type Fetcher<T> = (search: string) => Promise<T[]>;

/**
 * Debounced searchable meta list.
 * - `initialItems` seeds the dropdown (from Promise.all bootstrap)
 * - typing triggers debounced remote search
 */
export function useMetaSearch<T extends { id: string }>(
  fetcher: Fetcher<T>,
  initialItems: T[] = [],
  delayMs = 350,
) {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<T[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, delayMs);
  const requestIdRef = useRef(0);
  const fetcherRef = useRef(fetcher);
  const initialRef = useRef(initialItems);

  fetcherRef.current = fetcher;
  initialRef.current = initialItems;

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    if (!debouncedSearch.trim()) {
      setItems(initialRef.current);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetcherRef
      .current(debouncedSearch.trim())
      .then((next) => {
        if (requestId !== requestIdRef.current) return;
        setItems(next);
      })
      .catch((err: unknown) => {
        if (requestId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load options');
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      });
  }, [debouncedSearch]);

  return {
    search,
    setSearch,
    items,
    loading,
    error,
  };
}
