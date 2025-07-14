import React, { useEffect, useState, useMemo } from 'react';
import { getAuditLog, AuditLog } from '../services/auditLogService';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../components/ui/table';
import MainLayout from '../components/layout/MainLayout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useLanguage } from '../context/LanguageContext';
import { useInfiniteAuditLog } from '@/hooks/useInfiniteAuditLog';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

const AuditLogPage: React.FC = () => {
  // Remove: const [logs, setLogs] = useState<AuditLog[]>([]);
  // Remove: const [loading, setLoading] = useState(true);
  // Remove: const [error, setError] = useState<string | null>(null);
  // Remove: useEffect(() => { getAuditLog().then(setLogs)... }, []);
  const [search, setSearch] = useState('');
  const { t } = useLanguage();

  // Infinite scroll
  const {
    rows: logs,
    loading,
    error,
    hasMore,
    loadMore,
    reload,
  } = useInfiniteAuditLog(50);
  const sentinelRef = useIntersectionObserver(() => {
    if (hasMore && !loading) loadMore();
  });

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    const lower = search.toLowerCase();
    return logs.filter(log =>
      Object.values(log).some(val =>
        (val ? String(val).toLowerCase().includes(lower) : false)
      )
    );
  }, [logs, search]);

  return (
    <MainLayout title={t('general.auditLog')}>
      <Card>
        <CardHeader>
          <CardTitle>{t('auditLog.title')}</CardTitle>
          <CardDescription>{t('auditLog.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <Input
              placeholder={t('auditLog.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          {loading && filteredLogs.length === 0 && <p>{t('general.loading')}</p>}
          {error && <p className="text-red-600">{t('general.error')}: {error}</p>}
          {!loading && !error && filteredLogs.length === 0 && (
            <div className="text-center text-muted-foreground py-8">{t('auditLog.empty')}</div>
          )}
          {!loading && !error && filteredLogs.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('auditLog.id')}</TableHead>
                  <TableHead>{t('auditLog.action')}</TableHead>
                  <TableHead>{t('auditLog.entityType')}</TableHead>
                  <TableHead>{t('auditLog.entityId')}</TableHead>
                  <TableHead>{t('auditLog.timestamp')}</TableHead>
                  <TableHead>{t('auditLog.details')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.id}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.entity_type}</TableCell>
                    <TableCell>{log.entity_id}</TableCell>
                    <TableCell>{formatDate(log.timestamp)}</TableCell>
                    <TableCell>{log.details || '-'}</TableCell>
                  </TableRow>
                ))}
                <TableRow ref={sentinelRef as any}>
                  <TableCell colSpan={6} className="text-center py-2">
                    {loading && <span>{t('general.loading')}</span>}
                    {!hasMore && !loading && logs.length > 0 && (
                      <span className="text-gray-400">{t('general.allDataLoaded')}</span>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default AuditLogPage; 