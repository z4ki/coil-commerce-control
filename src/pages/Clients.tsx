
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, FileText } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ClientForm from '../components/clients/ClientForm';
import { Client } from '../types';

const Clients = () => {
  const { clients, deleteClient, getClientDebt } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleDeleteClient = (client: Client) => {
    if (window.confirm(`Are you sure you want to delete ${client.name}?`)) {
      deleteClient(client.id);
      toast.success(`${client.name} has been deleted`);
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout title="Clients">
      <div className="space-y-6">
        {/* Header with search and add button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search clients..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => {
            setSelectedClient(null);
            setShowAddDialog(true);
          }}>
            <Plus className="mr-1 h-4 w-4" /> Add Client
          </Button>
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Outstanding Debt</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.company}</TableCell>
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
                              onClick={() => {
                                setSelectedClient(client);
                                setShowAddDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClient(client)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                            <Link to={`/clients/${client.id}`}>
                              <Button variant="ghost" size="icon">
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">Details</span>
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        {searchTerm
                          ? "No clients match your search."
                          : "No clients found. Add your first client."}
                      </TableCell>
                    </TableRow>
                  )}
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
              {selectedClient ? 'Edit Client' : 'Add New Client'}
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
