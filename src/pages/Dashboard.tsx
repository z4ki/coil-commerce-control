import React, { useEffect, useState, memo } from 'react';
import { useAppContext } from '../context/AppContext';
import MainLayout from '../components/layout/MainLayout';
import DataCard from '../components/ui/DataCard';
import { BarChart2, DollarSign, Users, FileText, AlertTriangle, AlertCircle, Wallet, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '../context/LanguageContext';
import { getDashboardStats } from '../services/dashboardService';
import type { DashboardStats } from '@/types/index';

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

const DashboardTableRow = memo(({ client, t }: { client: any, t: any }) => (
  <TableRow key={client.id}>
    <TableCell className="font-medium">{client.name}</TableCell>
    <TableCell>{client.salesCount}</TableCell>
    <TableCell className="text-right">
      {formatCurrency(client.totalAmount)}
    </TableCell>
  </TableRow>
));

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
  
  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then((stats) => {
        setDashboardStats(stats);
        setStatsLoading(false);
      })
      .catch((err) => {
        setStatsError(err.message || 'Error loading dashboard stats');
        setStatsLoading(false);
      });
  }, []);

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

  useEffect(() => {
    import('../pages/Sales').then(() => {
      import('../pages/Invoices').then(() => {
        import('../pages/Clients').then(() => {
          import('../pages/Reports');
        });
      });
    });
  }, []);

  // UI rendering
  if (statsLoading) {
    return <MainLayout title={t('dashboard.title')}><div className="p-8 text-center">{t('general.loading') || 'Loading...'}</div></MainLayout>;
  }
  if (statsError) {
    return <MainLayout title={t('dashboard.title')}><div className="p-8 text-center text-red-500">{statsError}</div></MainLayout>;
  }
  if (!dashboardStats) {
    return <MainLayout title={t('dashboard.title')}><div className="p-8 text-center text-red-500">{t('general.error') || 'Error loading dashboard stats.'}</div></MainLayout>;
  }

  return (
    <MainLayout title={t('dashboard.title')}>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DataCard
            title={t('dashboard.totalSales')}
            value={dashboardStats.total_revenue ? formatCurrency(dashboardStats.total_revenue) : '-'}
            icon={<DollarSign className="h-4 w-4" />}
            description={t('dashboard.totalSalesCount').replace('{0}', String(dashboardStats.sales_count))}
          />
          <DataCard
            title={t('dashboard.monthlySales')}
            value={dashboardStats.monthly_revenue ? formatCurrency(dashboardStats.monthly_revenue) : '-'}
            icon={<BarChart2 className="h-4 w-4" />}
            description={t('dashboard.monthlySalesCount').replace('{0}', String(dashboardStats.monthly_sales_count))}
          />
          <DataCard
            title={t('dashboard.newClients')}
            value={dashboardStats.new_clients}
            icon={<Users className="h-4 w-4" />}
          />
          <DataCard
            title={t('dashboard.overdueInvoices')}
            value={dashboardStats.overdue_invoices}
            icon={<AlertCircle className="h-4 w-4" />}
            description={t('dashboard.unpaidInvoices').replace('{0}', String(dashboardStats.unpaid_invoices))}
          />
          {/* New cards for debts, cash, and bank account */}
          <DataCard
            title={t('dashboard.outstandingDebt')}
            value={formatCurrency(getDebtSummary().totalDebtTTC)}
            icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          />
          <DataCard
            title={t('dashboard.cash')}
            value={formatCurrency(paymentMethodTotals.cash)}
            icon={<Wallet className="h-4 w-4 text-green-600" />}
          />
          <DataCard
            title={t('dashboard.bankAndCheck')}
            value={formatCurrency(paymentMethodTotals.bank_account)}
            icon={<CreditCard className="h-4 w-4 text-blue-600" />}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                    <DashboardTableRow key={client.id} client={client} t={t} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="hoverable-card">
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity') || 'Recent Activity'}</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              // Merge and sort activities
              const activities = [
                ...sales.map(sale => ({
                  type: 'sale',
                  id: sale.id,
                  date: new Date(sale.createdAt),
                  client: clients.find(c => c.id === sale.clientId)?.name || sale.clientId,
                  amount: formatCurrency(sale.totalAmountTTC)
                })),
                ...payments.map(payment => ({
                  type: 'payment',
                  id: payment.id,
                  date: new Date(payment.createdAt),
                  client: clients.find(c => c.id === payment.clientId)?.name || payment.clientId,
                  amount: formatCurrency(payment.amount)
                })),
                ...invoices.map(invoice => ({
                  type: 'invoice',
                  id: invoice.id,
                  date: new Date(invoice.createdAt),
                  invoiceNumber: invoice.invoiceNumber,
                  amount: formatCurrency(invoice.totalAmountTTC)
                }))
              ];
              const sortedActivities = activities
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .slice(0, 10);
              if (sortedActivities.length === 0) {
                return (
                  <p className="text-muted-foreground text-center py-8">
                    {t('dashboard.noRecentActivity')}
                  </p>
                );
              }
              const renderActivityDescription = (activity: any) => {
                if (activity.type === 'invoice') {
                  return t('dashboard.invoiceIssued')
                    .replace('{invoiceNumber}', activity.invoiceNumber)
                    .replace('{amount}', activity.amount);
                }
                if (activity.type === 'payment') {
                  return t('dashboard.paymentFrom')
                    .replace('{client}', activity.client)
                    .replace('{amount}', activity.amount);
                }
                if (activity.type === 'sale') {
                  return t('dashboard.saleTo')
                    .replace('{client}', activity.client)
                    .replace('{amount}', activity.amount);
                }
                return '';
              };
              return (
                <ul>
                  {sortedActivities.map(activity => (
                    <li key={activity.type + activity.id} className="py-2 border-b last:border-b-0 flex justify-between items-center">
                      <span>
                        <span className="font-semibold capitalize">{activity.type}:</span> {renderActivityDescription(activity)}
                      </span>
                      <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                        {activity.date.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
