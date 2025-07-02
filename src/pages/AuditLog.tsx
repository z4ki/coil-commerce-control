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

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    getAuditLog()
      .then(setLogs)
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

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
          {loading && <p>{t('general.loading')}</p>}
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
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default AuditLogPage; 