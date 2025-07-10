import { useState, useRef, useCallback, useEffect } from "react";
import { SoldProduct, SoldProductsFilter, getSoldProductsAnalytics } from "@/services/soldProductsService";

export function useInfiniteSoldProducts(filters: SoldProductsFilter) {
  const [rows, setRows] = useState<SoldProduct[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  // Reset when filters change
  const prevFilters = useRef(filters);
  useEffect(() => {
    if (JSON.stringify(prevFilters.current) !== JSON.stringify(filters)) {
      prevFilters.current = filters;
      setRows([]);
      setPage(1);
      setTotal(null);
    }
  }, [filters]);

  const fetchPage = useCallback(
    async (pageToFetch: number) => {
      setLoading(true);
      setError(null);
      try {
        const { rows: newRows, total } = await getSoldProductsAnalytics(filters, pageToFetch, 5);
        setRows((prev) => (pageToFetch === 1 ? newRows : [...prev, ...newRows]));
        setTotal(total);
        setPage(pageToFetch);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // Initial load or filter change
  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  // Load next page
  const loadMore = useCallback(() => {
    if (loading) return;
    if (total !== null && rows.length >= total) return;
    fetchPage(page + 1);
  }, [loading, total, rows.length, fetchPage, page]);

  return {
    rows,
    loading,
    error,
    hasMore: total === null || rows.length < total,
    loadMore,
    reload: () => fetchPage(1),
  };
} 