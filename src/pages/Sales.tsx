
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import MainLayout from '../components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { Plus, Search, Edit, Trash2, FileCheck, FileX } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import StatusBadge from '../components/ui/StatusBadge';
import { Sale } from '../types';
import { toast } from 'sonner';
import SaleForm from '../components/sales/SaleForm';

const Sales = () => {
  const { sales, clients, deleteSale, updateSale, getClientById } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const handleDeleteSale = (sale: Sale) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      deleteSale(sale.id);
      toast.success('Sale has been deleted');
    }
  };

  const toggleInvoiceStatus = (sale: Sale) => {
    if (sale.isInvoiced) {
      // Can only toggle if not already linked to an invoice
      if (sale.invoiceId) {
        toast.error('Cannot change status of a sale linked to an invoice');
        return;
      }
      updateSale(sale.id, { isInvoiced: false });
      toast.success('Sale marked as not invoiced');
    } else {
      updateSale(sale.id, { isInvoiced: true });
      toast.success('Sale marked as invoiced');
    }
  };

  const filteredSales = sales.filter((sale) => {
    const client = getClientById(sale.clientId);
    
    if (!client) return false;
    
    const clientNameMatches = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const clientCompanyMatches = client.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    return clientNameMatches || clientCompanyMatches;
  });

  return (
    <MainLayout title="Sales">
      <div className="space-y-6">
        {/* Header with search and add button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search by client..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => {
            setSelectedSale(null);
            setShowAddDialog(true);
          }}>
            <Plus className="mr-1 h-4 w-4" /> Add Sale
          </Button>
        </div>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Quantity (tons)</TableHead>
                    <TableHead>Price/Ton</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.length > 0 ? (
                    filteredSales.map((sale) => {
                      const client = getClientById(sale.clientId);
                      return (
                        <TableRow key={sale.id}>
                          <TableCell>{formatDate(sale.date)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{client?.name}</div>
                            <div className="text-xs text-muted-foreground">{client?.company}</div>
                          </TableCell>
                          <TableCell>{sale.quantity}</TableCell>
                          <TableCell>{formatCurrency(sale.pricePerTon)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(sale.totalAmount)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge 
                              status={sale.isInvoiced ? 'invoiced' : 'not-invoiced'} 
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedSale(sale);
                                  setShowAddDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSale(sale)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleInvoiceStatus(sale)}
                                disabled={sale.isInvoiced && !!sale.invoiceId}
                                title={sale.isInvoiced ? "Mark as not invoiced" : "Mark as invoiced"}
                              >
                                {sale.isInvoiced ? (
                                  <FileX className="h-4 w-4" />
                                ) : (
                                  <FileCheck className="h-4 w-4" />
                                )}
                                <span className="sr-only">Toggle Invoice Status</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        {searchTerm
                          ? "No sales match your search."
                          : "No sales found. Add your first sale."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Sale Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedSale ? 'Edit Sale' : 'Add New Sale'}
            </DialogTitle>
          </DialogHeader>
          <SaleForm 
            sale={selectedSale} 
            onSuccess={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Sales;
