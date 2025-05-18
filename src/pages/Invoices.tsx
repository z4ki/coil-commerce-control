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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, Edit, Trash2, FileText, MoreVertical, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import StatusBadge from '../components/ui/StatusBadge';
import { Invoice } from '../types';
import { toast } from 'sonner';
import InvoiceForm from '../components/invoices/InvoiceForm';
import { Link } from 'react-router-dom';

const Invoices = () => {
  const { invoices, deleteInvoice, getClientById } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const handleDeleteInvoice = (invoice: Invoice) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(invoice.id);
      toast.success('Invoice has been deleted');
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const client = getClientById(invoice.clientId);
    
    if (!client) return false;
    
    return (
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <MainLayout title="Invoices">
      <div className="space-y-6">
        {/* Header with search and add button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search invoices..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => {
            setSelectedInvoice(null);
            setShowAddDialog(true);
          }}>
            <Plus className="mr-1 h-4 w-4" /> Create Invoice
          </Button>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice) => {
                      const client = getClientById(invoice.clientId);
                      const isOverdue = !invoice.isPaid && new Date() > invoice.dueDate;
                      
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            <Link 
                              to={`/invoices/${invoice.id}`}
                              className="text-primary hover:underline"
                            >
                              {invoice.invoiceNumber}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div>{client?.name}</div>
                            <div className="text-xs text-muted-foreground">{client?.company}</div>
                          </TableCell>
                          <TableCell>{formatDate(invoice.date)}</TableCell>
                          <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(invoice.totalAmountTTC)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge 
                              status={invoice.isPaid ? 'paid' : isOverdue ? 'overdue' : 'unpaid'} 
                            />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setShowAddDialog(true);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteInvoice(invoice)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/invoices/${invoice.id}`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>View Details</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  <span>Download PDF</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        {searchTerm
                          ? "No invoices match your search."
                          : "No invoices found. Create your first invoice."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Invoice Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 z-50 bg-background pb-4 mb-4">
            <DialogTitle>
              {selectedInvoice ? 'Edit Invoice' : 'Create New Invoice'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedInvoice 
                ? 'Update the invoice details below.' 
                : 'Fill in the details below to create a new invoice.'}
            </p>
          </DialogHeader>
          <div className="overflow-y-auto">
            <InvoiceForm 
              invoice={selectedInvoice} 
              onSuccess={() => setShowAddDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Invoices;
