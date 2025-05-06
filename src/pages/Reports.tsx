
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import MainLayout from '../components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart2, DollarSign, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import StatusBadge from '../components/ui/StatusBadge';

const Reports = () => {
  const { 
    clients, 
    getSalesSummary, 
    getDebtSummary,
    invoices,
    sales,
    getClientById
  } = useAppContext();
  
  const salesSummary = getSalesSummary();
  const debtSummary = getDebtSummary();
  
  const [timeRange, setTimeRange] = useState('all');
  
  // Prepare data for pie charts
  const invoiceStatusData = [
    { name: 'Paid', value: invoices.filter(inv => inv.isPaid).length },
    { name: 'Unpaid', value: invoices.filter(inv => !inv.isPaid).length },
  ];
  
  const saleInvoiceStatusData = [
    { name: 'Invoiced', value: sales.filter(sale => sale.isInvoiced).length },
    { name: 'Not Invoiced', value: sales.filter(sale => !sale.isInvoiced).length },
  ];
  
  // Colors for pie charts
  const COLORS = ['#10b981', '#ef4444'];
  
  return (
    <MainLayout title="Reports">
      <div className="space-y-6">
        {/* Report Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="font-medium text-lg">Reports & Analytics</div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Sales and Debt Analytics */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Sales Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-muted-foreground" />
                  <span>Monthly Sales</span>
                </CardTitle>
                <span className="text-xl font-bold">{formatCurrency(salesSummary.totalSales)}</span>
              </div>
              <CardDescription>Sales over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesSummary.monthlySales}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number)} 
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Bar dataKey="amount" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Debt Overview */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span>Debt Overview</span>
                </CardTitle>
                <span className="text-xl font-bold">{formatCurrency(debtSummary.totalDebt)}</span>
              </div>
              <CardDescription>Current debt status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Overdue</div>
                  <div className="text-xl font-semibold text-destructive">
                    {formatCurrency(debtSummary.overdueDebt)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Upcoming</div>
                  <div className="text-xl font-semibold">
                    {formatCurrency(debtSummary.upcomingDebt)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-medium mb-2">Top Clients by Debt</h3>
                {debtSummary.debtByClient.slice(0, 5).map((clientDebt, index) => (
                  <div key={clientDebt.clientId} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="font-medium">{index + 1}. {clientDebt.clientName}</span>
                    <span className={`font-semibold ${clientDebt.amount > 0 ? 'text-destructive' : ''}`}>
                      {formatCurrency(clientDebt.amount)}
                    </span>
                  </div>
                ))}
                {debtSummary.debtByClient.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No outstanding debts
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Status Distribution Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Invoice Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Status Distribution</CardTitle>
              <CardDescription>Overview of invoice payment status</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="h-64 w-full max-w-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={invoiceStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {invoiceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => [`${value} invoices`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Sales Invoice Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sales Invoicing Status</CardTitle>
              <CardDescription>Invoiced vs non-invoiced sales</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="h-64 w-full max-w-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={saleInvoiceStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {saleInvoiceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => [`${value} sales`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Detailed Reports Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Reports</CardTitle>
            <CardDescription>View detailed reports for sales and debts</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="debt" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="debt">Client Debt Report</TabsTrigger>
                <TabsTrigger value="sales">Sales Report</TabsTrigger>
              </TabsList>
              
              <TabsContent value="debt" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead className="text-right">Outstanding Amount</TableHead>
                        <TableHead>Overdue Invoices</TableHead>
                        <TableHead>Upcoming Invoices</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.length > 0 ? (
                        clients.map((client) => {
                          const clientInvoices = invoices.filter(inv => inv.clientId === client.id && !inv.isPaid);
                          const overdueInvoices = clientInvoices.filter(inv => new Date() > inv.dueDate);
                          const upcomingInvoices = clientInvoices.filter(inv => new Date() <= inv.dueDate);
                          const totalDebt = clientInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
                          
                          // Only show clients with debt
                          if (totalDebt <= 0) return null;
                          
                          return (
                            <TableRow key={client.id}>
                              <TableCell className="font-medium">{client.name}</TableCell>
                              <TableCell>{client.company}</TableCell>
                              <TableCell className="text-right font-semibold text-destructive">
                                {formatCurrency(totalDebt)}
                              </TableCell>
                              <TableCell>{overdueInvoices.length}</TableCell>
                              <TableCell>{upcomingInvoices.length}</TableCell>
                            </TableRow>
                          );
                        }).filter(Boolean)
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No client debt data available.
                          </TableCell>
                        </TableRow>
                      )}
                      {clients.length > 0 && !clients.some(client => {
                        const clientInvoices = invoices.filter(inv => inv.clientId === client.id && !inv.isPaid);
                        return clientInvoices.length > 0;
                      }) && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No outstanding debts to display.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="sales" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.length > 0 ? (
                        sales.map((sale) => {
                          const client = getClientById(sale.clientId);
                          if (!client) return null;
                          
                          return (
                            <TableRow key={sale.id}>
                              <TableCell>{formatDate(sale.date)}</TableCell>
                              <TableCell>
                                <div className="font-medium">{client.name}</div>
                                <div className="text-xs text-muted-foreground">{client.company}</div>
                              </TableCell>
                              <TableCell>{sale.items.length} items</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(sale.totalAmount)}
                              </TableCell>
                              <TableCell>
                                <StatusBadge 
                                  status={sale.isInvoiced ? 'invoiced' : 'not-invoiced'} 
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No sales data available.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Reports;
