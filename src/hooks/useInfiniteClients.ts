import { useState, useRef, useCallback, useEffect } from "react";
import { getClientsPaginated, PaginatedClientsResult } from "@/services/clientService";
import { Client } from "@/types/index";

export function useInfiniteClients() {
  const [rows, setRows] = useState<Client[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result: PaginatedClientsResult = await getClientsPaginated(page, 5);
      setRows(prev => [...prev, ...result.rows]);
      setTotal(result.total);
      setPage(prev => prev + 1);
    } catch (e: any) {
      setError(e.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [page, loading]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(1);
    try {
      const result: PaginatedClientsResult = await getClientsPaginated(1, 5);
      setRows(result.rows);
      setTotal(result.total);
      setPage(2);
    } catch (e: any) {
      setError(e.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const hasMore = total === null ? true : rows.length < total;

  return { rows, loading, error, total, hasMore, loadMore, reload };
} 