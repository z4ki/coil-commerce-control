import React, { useState, useMemo, memo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import MainLayout from '../components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, FileText } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ClientForm from '../components/clients/ClientForm';
import { Client } from '@/types/index';
import { useInfiniteClients } from '@/hooks/useInfiniteClients';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import Spinner from '@/components/ui/Spinner';

type ClientTableRowProps = {
  client: Client;
  t: (key: string) => string;
  getClientDebt: (clientId: string) => number;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
};

const ClientTableRow = memo(({
  client,
  t,
  getClientDebt,
  onEdit,
  onDelete,
  onView
}: ClientTableRowProps) => (
  <TableRow key={client.id}>
    <TableCell className="font-medium">
      <Link to={`/clients/${client.id}`} className="text-primary hover:underline hover:text-primary/80">
        {client.name}
      </Link>
    </TableCell>
    <TableCell>{client.company ?? ''}</TableCell>
    <TableCell>
      <div>{client.email}</div>
      <div className="text-xs text-muted-foreground">{client.phone}</div>
    </TableCell>
    <TableCell className="text-right">
      <span className={getClientDebt(client.id) > 0 ? 'text-destructive font-medium' : ''}>
        {formatCurrency(getClientDebt(client.id))}
      </span>
    </TableCell>
    <TableCell>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
        >
          <Edit className="h-4 w-4" />
          <span className="sr-only">{t('general.edit')}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">{t('general.delete')}</span>
        </Button>
        <Link to={`/clients/${client.id}`}>
          <Button variant="ghost" size="icon">
            <FileText className="h-4 w-4" />
            <span className="sr-only">{t('general.view')}</span>
          </Button>
        </Link>
      </div>
    </TableCell>
  </TableRow>
));

const Clients = () => {
  // Remove: const { clients, deleteClient, getClientDebt } = useAppContext();
  const { deleteClient, getClientDebt } = useAppContext();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Infinite scroll
  const {
    rows: clients,
    loading,
    error,
    hasMore,
    loadMore,
    reload,
  } = useInfiniteClients();
  const sentinelRef = useIntersectionObserver(() => {
    if (hasMore && !loading) loadMore();
  });

  // Reset on search
  useEffect(() => {
    reload();
  }, [searchTerm, reload]);

  const handleDeleteClient = (client: Client) => {
    if (window.confirm(t('clients.deleteConfirm').replace('{0}', client.name))) {
      deleteClient(client.id);
      toast.success(t('clients.deleted').replace('{0}', client.name));
    }
  };

  const filteredClients = useMemo(() =>
    clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company.toLowerCase().includes(searchTerm.toLowerCase())
    ), [clients, searchTerm]);

  return (
    <MainLayout title={t('clients.title')}>
      <div className="space-y-6">
        {/* Header with search and add button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder={t('general.search')}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => {
            setSelectedClient(null);
            setShowAddDialog(true);
          }}>
            <Plus className="mr-1 h-4 w-4" /> {t('clients.add')}
          </Button>
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('clients.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
              <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead>{t('clients.name')}</TableHead>
                    <TableHead>{t('clients.company')}</TableHead>
                    <TableHead>{t('clients.contact')}</TableHead>
                    <TableHead className="text-right">{t('clients.debt')}</TableHead>
                    <TableHead className="w-[100px]">{t('general.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <ClientTableRow
                        key={client.id}
                        client={client}
                        t={t}
                        getClientDebt={getClientDebt}
                        onEdit={() => {
                          setSelectedClient(client);
                          setShowAddDialog(true);
                        }}
                        onDelete={() => handleDeleteClient(client)}
                        onView={() => {}}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        {searchTerm ? t('clients.noClients') : t('general.noData')}
                      </TableCell>
                    </TableRow>
                  )}
                  {/* Infinite scroll sentinel row */}
                  <TableRow ref={sentinelRef as any}>
                    <TableCell colSpan={5} className="text-center py-2">
                      {loading && hasMore && (
                        <div className="flex justify-center items-center py-2">
                          <Spinner size={24} />
                          <span className="ml-2">{t('general.loading')}</span>
                        </div>
                      )}
                      {!hasMore && !loading && filteredClients.length > 0 && (
                        <span className="text-muted-foreground text-xs">{t('general.endOfList') || 'No more clients'}</span>
                      )}
                      {error && <span className="text-destructive text-xs">{error}</span>}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Client Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedClient ? t('clients.form.editTitle') : t('clients.form.title')}
            </DialogTitle>
          </DialogHeader>
          <ClientForm 
            client={selectedClient} 
            onSuccess={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Clients;
