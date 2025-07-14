import { useState, useCallback, useEffect } from "react";
import { getAuditLog, PaginatedAuditLogResult, AuditLog } from "@/services/auditLogService";

export function useInfiniteAuditLog(pageSize: number = 50) {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result: PaginatedAuditLogResult = await getAuditLog(page, pageSize);
      setRows(prev => [...prev, ...result.rows]);
      setTotal(result.total);
      setPage(prev => prev + 1);
    } catch (e: any) {
      setError(e.message || "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [page, loading, pageSize]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(1);
    try {
      const result: PaginatedAuditLogResult = await getAuditLog(1, pageSize);
      setRows(result.rows);
      setTotal(result.total);
      setPage(2);
    } catch (e: any) {
      setError(e.message || "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    reload();
  }, [reload]);

  const hasMore = total === null ? true : rows.length < total;

  return { rows, loading, error, total, hasMore, loadMore, reload };
} 