import React, { useState, useMemo, memo } from 'react';
import { useAppContext } from '../context/AppContext';
import MainLayout from '../components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
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
import { BarChart2, DollarSign, Download, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import StatusBadge from '../components/ui/StatusBadge';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import ExcelReportGenerator from '../components/reports/ExcelReportGenerator';

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

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  percent: number;
  index: number;
}

const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent }: LabelProps) => {
  const radius = outerRadius + 10;
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const ReportTableRow = memo(({ client, t, onView }) => (
  <TableRow key={client.id}>
    <TableCell className="font-medium">{client.name}</TableCell>
    <TableCell>{client.salesCount}</TableCell>
    <TableCell className="text-right">
      {formatCurrency(client.totalAmount)}
    </TableCell>
    <TableCell>
      <Button variant="ghost" size="icon" onClick={() => onView(client)}>
        <FileText className="h-4 w-4" />
        <span className="sr-only">{t('general.view')}</span>
      </Button>
    </TableCell>
  </TableRow>
));

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
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      sales: sales
        .filter(sale => {
          if (startDate && new Date(sale.date) < startDate) return false;
          return true;
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime()),
      invoices: invoices
        .filter(invoice => {
          if (startDate && new Date(invoice.date) < startDate) return false;
          return true;
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime()),
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('reports.exportReports')}</DialogTitle>
                  <DialogDescription>
                    {t('reports.exportReportsDesc')}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <ExcelReportGenerator 
                    onClose={() => setIsDialogOpen(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>
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
        
        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Invoice Status Chart */}
          <Card className="min-h-[400px]">
            <CardHeader>
              <CardTitle>{t('reports.invoiceStatus')}</CardTitle>
              <CardDescription>{t('reports.invoiceStatusDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={invoiceStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={renderCustomizedLabel}
                    >
                      {invoiceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Sales Status Chart */}
          <Card className="min-h-[400px]">
            <CardHeader>
              <CardTitle>{t('reports.salesStatus')}</CardTitle>
              <CardDescription>{t('reports.salesStatusDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={saleInvoiceStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={renderCustomizedLabel}
                    >
                      {saleInvoiceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Detailed Reports */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.detailedReports')}</CardTitle>
            <CardDescription>{t('reports.detailedDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Client Debt Report */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('reports.clientDebtReport')}</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('clients.name')}</TableHead>
                        <TableHead>{t('clients.company')}</TableHead>
                        <TableHead className="text-right">{t('reports.outstandingAmount')}</TableHead>
                        <TableHead className="text-right">{t('reports.overdueInvoices')}</TableHead>
                        <TableHead className="text-right">{t('reports.upcomingInvoices')}</TableHead>
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
                              <TableCell className="font-medium">
                                <Link 
                                  to={`/clients/${client.id}`}
                                  className="text-primary hover:underline hover:text-primary/80"
                                >
                                  {client.name}
                                </Link>
                              </TableCell>
                              <TableCell>{client.company}</TableCell>
                              <TableCell className="text-right font-medium text-destructive">
                                {formatCurrency(totalDebt)}
                              </TableCell>
                              <TableCell className="text-right">
                                {overdueInvoices.length > 0 ? (
                                  <span className="text-destructive font-medium">{overdueInvoices.length}</span>
                                ) : (
                                  '0'
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {upcomingInvoices.length}
                              </TableCell>
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
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Reports;
