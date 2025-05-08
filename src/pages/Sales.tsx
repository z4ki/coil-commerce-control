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
import { Plus, Search, Edit, Trash2, FileCheck, FileX, ChevronDown, ChevronRight, FileText, Download } from 'lucide-react';
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
  const [expandedSales, setExpandedSales] = useState<{[key: string]: boolean}>({});

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

  const toggleSaleExpansion = (saleId: string) => {
    setExpandedSales(prev => ({
      ...prev,
      [saleId]: !prev[saleId]
    }));
  };

  const filteredSales = sales.filter((sale) => {
    const client = getClientById(sale.clientId);
    
    if (!client) return false;
    
    const clientNameMatches = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const clientCompanyMatches = client.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    return clientNameMatches || clientCompanyMatches;
  });

  const handleExportInvoice = (sale: Sale) => {
    toast.info("Invoice PDF export functionality will be implemented soon");
  };

  const handleExportQuotation = (sale: Sale) => {
    toast.info("Quotation PDF export functionality will be implemented soon");
  };

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
                    <TableHead className="w-[30px]"></TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.length > 0 ? (
                    filteredSales.map((sale) => {
                      const client = getClientById(sale.clientId);
                      const isExpanded = expandedSales[sale.id] || false;
                      return (
                        <React.Fragment key={sale.id}>
                          <TableRow>
                            <TableCell className="p-0 pl-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleSaleExpansion(sale.id)}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell>{formatDate(sale.date)}</TableCell>
                            <TableCell>
                              <div className="font-medium">{client?.name}</div>
                              <div className="text-xs text-muted-foreground">{client?.company}</div>
                            </TableCell>
                            <TableCell>{sale.items.length} item(s)</TableCell>
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleExportQuotation(sale)}
                                  title="Export Quotation"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleExportInvoice(sale)}
                                  title="Export Invoice"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          {/* Expanded item details */}
                          {isExpanded && (
                            <TableRow className="bg-muted/50">
                              <TableCell colSpan={7} className="py-2">
                                <div className="pl-8 pr-4">
                                  <h4 className="text-sm font-medium mb-2">Sale Items:</h4>
                                  <div className="rounded border bg-background">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Description</TableHead>
                                          <TableHead>Coil Ref</TableHead>
                                          <TableHead>Thickness</TableHead>
                                          <TableHead>Width</TableHead>
                                          <TableHead>Quantity (tons)</TableHead>
                                          <TableHead>Price/Ton</TableHead>
                                          <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {sale.items.map((item) => {
                                          const totalPrice = item.totalAmount;
                                          
                                          return (
                                            <TableRow key={item.id}>
                                              <TableCell>{item.description}</TableCell>
                                              <TableCell>{item.coilRef || '-'}</TableCell>
                                              <TableCell>{item.coilThickness ? `${item.coilThickness} mm` : '-'}</TableCell>
                                              <TableCell>{item.coilWidth ? `${item.coilWidth} mm` : '-'}</TableCell>
                                              <TableCell>{item.quantity}</TableCell>
                                              <TableCell>{formatCurrency(item.pricePerTon)}</TableCell>
                                              <TableCell className="text-right">
                                                {formatCurrency(totalPrice)}
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                        
                                        {/* Summary row */}
                                        <TableRow className="border-t-2">
                                          <TableCell colSpan={7} className="font-medium text-right">
                                            Total:
                                          </TableCell>
                                          <TableCell className="text-right font-medium">
                                            {formatCurrency(sale.items.reduce((sum, item) => sum + item.totalAmount, 0))}
                                          </TableCell>
                                        </TableRow>
                                        
                                        {/* Transportation fee row */}
                                        {sale.transportationFee && sale.transportationFee > 0 && (
                                          <TableRow>
                                            <TableCell colSpan={7} className="text-right">
                                              Transportation Fee:
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {formatCurrency(sale.transportationFee)}
                                            </TableCell>
                                          </TableRow>
                                        )}
                                        
                                        {/* Grand total row */}
                                        <TableRow>
                                          <TableCell colSpan={7} className="text-right font-bold">
                                            Grand Total:
                                          </TableCell>
                                          <TableCell className="text-right font-bold">
                                            {formatCurrency(
                                              (sale.taxRate 
                                                ? sale.items.reduce((sum, item) => sum + item.totalAmount, 0) * (1 + sale.taxRate)
                                                : sale.items.reduce((sum, item) => sum + item.totalAmount, 0)
                                              ) + (sale.transportationFee || 0)
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
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
        <DialogContent className="sm:max-w-[700px]">
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
