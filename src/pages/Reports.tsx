import React, { useState, useMemo } from 'react';
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
import { useLanguage } from '../context/LanguageContext';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      name: string;
      value: number;
    };
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium">{`${label}`}</p>
        <p className="text-sm">{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const Reports = () => {
  const { 
    clients, 
    getSalesSummary, 
    getDebtSummary,
    invoices,
    sales,
    getClientById
  } = useAppContext();
  const { t } = useLanguage();
  
  const [timeRange, setTimeRange] = useState('all');
  
  // Get summaries
  const salesSummary = getSalesSummary();
  const debtSummary = getDebtSummary();
  
  // Filter data based on time range
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0); // Default to all time
    
    switch (timeRange) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        break;
    }
    
    return {
      sales: sales.filter(sale => new Date(sale.date) >= startDate),
      invoices: invoices.filter(invoice => new Date(invoice.date) >= startDate)
    };
  }, [timeRange, sales, invoices]);
  
  // Prepare data for pie charts
  const invoiceStatusData = [
    { 
      name: t('status.paid'), 
      value: filteredData.invoices.filter(inv => inv.isPaid).length,
      color: '#10b981' // green
    },
    { 
      name: t('status.unpaid'), 
      value: filteredData.invoices.filter(inv => !inv.isPaid).length,
      color: '#ef4444' // red
    },
  ];
  
  const saleInvoiceStatusData = [
    { 
      name: t('status.invoiced'), 
      value: filteredData.sales.filter(sale => sale.isInvoiced).length,
      color: '#10b981' // green
    },
    { 
      name: t('status.notInvoiced'), 
      value: filteredData.sales.filter(sale => !sale.isInvoiced).length,
      color: '#ef4444' // red
    },
  ];
  
  return (
    <MainLayout title={t('reports.title')}>
      <div className="space-y-6">
        {/* Report Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="font-medium text-lg">{t('reports.title')}</div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('general.timeRange')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('general.allTime')}</SelectItem>
                <SelectItem value="month">{t('general.thisMonth')}</SelectItem>
                <SelectItem value="quarter">{t('general.thisQuarter')}</SelectItem>
                <SelectItem value="year">{t('general.thisYear')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              {t('general.export')}
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
                  <span>{t('dashboard.monthlySales')}</span>
                </CardTitle>
                <span className="text-xl font-bold">{formatCurrency(salesSummary.totalAmount)}</span>
              </div>
              <CardDescription>{t('dashboard.salesOverTime')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesSummary.monthlySales}>
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value as number), t('dashboard.amount')]}
                      labelFormatter={(label) => `${t('dashboard.month').replace('{0}', label)}`}
                    />
                    <Bar dataKey="amountTTC" fill="#3b82f6" name={t('dashboard.amount')} />
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
                  <span>{t('reports.debtOverview')}</span>
                </CardTitle>
                <span className="text-xl font-bold">{formatCurrency(debtSummary.totalDebtTTC)}</span>
              </div>
              <CardDescription>{t('reports.debtStatus')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">{t('reports.overdue')}</div>
                  <div className="text-xl font-semibold text-destructive">
                    {formatCurrency(debtSummary.overdueDebtTTC)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">{t('reports.upcoming')}</div>
                  <div className="text-xl font-semibold">
                    {formatCurrency(debtSummary.upcomingDebtTTC)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-medium mb-2">{t('reports.topClients')}</h3>
                {debtSummary.debtByClient.slice(0, 5).map((clientDebt, index) => (
                  <div key={clientDebt.clientId} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="font-medium">{index + 1}. {clientDebt.clientName}</span>
                    <span className={`font-semibold ${clientDebt.amountTTC > 0 ? 'text-destructive' : ''}`}>
                      {formatCurrency(clientDebt.amountTTC)}
                    </span>
                  </div>
                ))}
                {debtSummary.debtByClient.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('reports.noDebts')}
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
              <CardTitle className="text-lg">{t('reports.invoiceStatus')}</CardTitle>
              <CardDescription>{t('reports.invoiceStatusDesc')}</CardDescription>
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
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Sales Invoice Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('reports.salesStatus')}</CardTitle>
              <CardDescription>{t('reports.salesStatusDesc')}</CardDescription>
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
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Detailed Reports Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.detailedReports')}</CardTitle>
            <CardDescription>{t('reports.detailedDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="debt" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="debt">{t('reports.clientDebtReport')}</TabsTrigger>
                <TabsTrigger value="sales">{t('reports.salesReport')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="debt" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('clients.contact')}</TableHead>
                        <TableHead>{t('clients.company')}</TableHead>
                        <TableHead className="text-right">{t('reports.outstandingAmount')}</TableHead>
                        <TableHead>{t('reports.overdueInvoices')}</TableHead>
                        <TableHead>{t('reports.upcomingInvoices')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.length > 0 ? (
                        clients.map((client) => {
                          const clientInvoices = filteredData.invoices.filter(inv => inv.clientId === client.id && !inv.isPaid);
                          const overdueInvoices = clientInvoices.filter(inv => new Date() > inv.dueDate);
                          const upcomingInvoices = clientInvoices.filter(inv => new Date() <= inv.dueDate);
                          const totalDebt = clientInvoices.reduce((sum, inv) => sum + inv.totalAmountTTC, 0);
                          
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
                            {t('reports.noClientDebt')}
                          </TableCell>
                        </TableRow>
                      )}
                      {clients.length > 0 && !clients.some(client => {
                        const clientInvoices = filteredData.invoices.filter(inv => inv.clientId === client.id && !inv.isPaid);
                        return clientInvoices.length > 0;
                      }) && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            {t('reports.noOutstandingDebts')}
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
                        <TableHead>{t('sales.date')}</TableHead>
                        <TableHead>{t('sales.client')}</TableHead>
                        <TableHead>{t('sales.items')}</TableHead>
                        <TableHead className="text-right">{t('sales.total')}</TableHead>
                        <TableHead>{t('sales.status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.sales.length > 0 ? (
                        filteredData.sales.map((sale) => {
                          const client = getClientById(sale.clientId);
                          if (!client) return null;
                          
                          return (
                            <TableRow key={sale.id}>
                              <TableCell>{formatDate(sale.date)}</TableCell>
                              <TableCell>
                                <div className="font-medium">{client.name}</div>
                                <div className="text-xs text-muted-foreground">{client.company}</div>
                              </TableCell>
                              <TableCell>{sale.items.length} {t('general.items')}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(sale.totalAmountTTC)}
                              </TableCell>
                              <TableCell>
                                <StatusBadge 
                                  status={sale.isInvoiced ? 'invoiced' : 'notInvoiced'} 
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            {t('reports.noSalesData')}
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
