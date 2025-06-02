import React, { memo } from 'react';
import { useAppContext } from '../context/AppContext';
import MainLayout from '../components/layout/MainLayout';
import DataCard from '../components/ui/DataCard';
import { BarChart2, DollarSign, Users, FileText, AlertTriangle, AlertCircle, Wallet, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '../context/LanguageContext';

interface MonthlySalesData {
  month: string;
  amountTTC: number;
}

// Memoized chart components to prevent unnecessary re-renders
const MemoizedBarChart = memo(({ data }: { data: MonthlySalesData[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
      <XAxis 
        dataKey="month"
        height={60}
        tickLine={true}
        axisLine={true}
        scale="auto"
        padding={{ left: 0, right: 0 }}
        allowDataOverflow={false}
        minTickGap={5}
        interval="preserveStartEnd"
        tick={{ fontSize: 12 }}
      />
      <YAxis
        width={80}
        tickLine={true}
        axisLine={true}
        scale="auto"
        padding={{ top: 20, bottom: 20 }}
        allowDataOverflow={false}
        tickFormatter={(value) => formatCurrency(value)}
        tick={{ fontSize: 12 }}
      />
      <Tooltip 
        formatter={(value) => formatCurrency(value as number)} 
        labelFormatter={(label) => `Month: ${label}`}
        cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
      />
      <Bar 
        dataKey="amountTTC" 
        fill="#3b82f6"
        radius={[4, 4, 0, 0]}
        maxBarSize={50}
      />
    </BarChart>
  </ResponsiveContainer>
));

MemoizedBarChart.displayName = 'MemoizedBarChart';

const Dashboard = () => {
  const { 
    clients, 
    sales, 
    getSalesSummary, 
    getDebtSummary,
    invoices,
    getSalesByClient,
    payments
  } = useAppContext();

  // ADD THESE CONSOLE LOGS:
  console.log("[Dashboard.tsx] Payments data from context:", JSON.stringify(payments, null, 2));
  console.log(`[Dashboard.tsx] Number of payments loaded: ${payments.length}`);
  payments.forEach((p, index) => {
    console.log(`[Dashboard.tsx] Payment ${index + 1}: method='${p.method}', amount=${p.amount}`);
  });
  // END OF ADDED CONSOLE LOGS
  const { t } = useLanguage();
  
  const salesSummary = getSalesSummary();
  const debtSummary = getDebtSummary();
  
  // Calculate payment method totals
  const paymentMethodTotals = {
    cash: payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + (p.amount || 0), 0),
    bank_transfer: payments.filter(p => p.method === 'bank_transfer').reduce((sum, p) => sum + (p.amount || 0), 0),
    check: payments.filter(p => p.method === 'check').reduce((sum, p) => sum + (p.amount || 0), 0),
    deferred: payments.filter(p => p.method === 'deferred').reduce((sum, p) => sum + (p.amount || 0), 0),
    bank_account: payments.filter(p => ['bank_transfer', 'check'].includes(p.method)).reduce((sum, p) => sum + (p.amount || 0), 0)
  };
  
  // Count unpaid invoices
  const unpaidInvoices = invoices.filter(inv => !inv.isPaid).length;
  
  // Calculate total sales amount (TTC)
  const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.totalAmountTTC, 0);
  
  // Calculate average sale amount (TTC)
  const averageSaleAmount = sales.length > 0 ? totalSalesAmount / sales.length : 0;
  
  // Get top clients by sales amount (TTC)
  const topClients = clients
    .map(client => {
      const clientSales = getSalesByClient(client.id);
      const totalAmount = clientSales.reduce((sum, sale) => sum + sale.totalAmountTTC, 0);
      return {
        ...client,
        totalAmount,
        salesCount: clientSales.length
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  return (
    <MainLayout title={t('dashboard.title')}>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DataCard
            title={t('dashboard.totalSales')}
            value={formatCurrency(totalSalesAmount)}
            icon={<DollarSign className="h-4 w-4" />}
            description={t('dashboard.average').replace('{0}', formatCurrency(averageSaleAmount))}
          />
          <DataCard
            title={t('dashboard.outstandingDebt')}
            value={formatCurrency(debtSummary.totalDebtTTC)}
            icon={<AlertCircle className="h-4 w-4" />}
            description={t('dashboard.overdue').replace('{0}', formatCurrency(debtSummary.overdueDebtTTC))}
          />
          <DataCard
            title={t('payments.methods.cash')}
            value={formatCurrency(paymentMethodTotals.cash)}
            icon={<Wallet className="h-4 w-4" />}
          />
          <DataCard
            title={t('dashboard.bankAccountBalance')}
            value={formatCurrency(paymentMethodTotals.bank_account)}
            icon={<CreditCard className="h-4 w-4" />}
            description={t('dashboard.bankAndCheck')}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Monthly Sales Chart */}
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
                      labelFormatter={(label) => t('dashboard.month').replace('{0}', label)}
                    />
                    <Bar dataKey="amountTTC" fill="#3b82f6" name={t('dashboard.amount')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Top Clients by Debt */}
          <Card className="hoverable-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span>{t('dashboard.topClients')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('clients.name')}</TableHead>
                    <TableHead>{t('clients.totalOrders')}</TableHead>
                    <TableHead className="text-right">{t('sales.total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.salesCount}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(client.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="hoverable-card">
          <CardHeader>
            <CardTitle>{t('dashboard.recentSales')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              {t('dashboard.noRecentActivity')}
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
