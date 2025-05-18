import React, { memo } from 'react';
import { useAppContext } from '../context/AppContext';
import MainLayout from '../components/layout/MainLayout';
import DataCard from '../components/ui/DataCard';
import { BarChart2, DollarSign, Users, FileText, AlertTriangle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
    getSalesByClient
  } = useAppContext();
  
  const salesSummary = getSalesSummary();
  const debtSummary = getDebtSummary();
  
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
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DataCard
            title="Total Sales (TTC)"
            value={formatCurrency(totalSalesAmount)}
            icon={<DollarSign className="h-4 w-4" />}
            description={`Average: ${formatCurrency(averageSaleAmount)}`}
          />
          <DataCard
            title="Outstanding Debt (TTC)"
            value={formatCurrency(debtSummary.totalDebtTTC)}
            icon={<AlertCircle className="h-4 w-4" />}
            description={`Overdue: ${formatCurrency(debtSummary.overdueDebtTTC)}`}
          />
          <DataCard
            title="Total Clients"
            value={clients.length}
            icon={<Users className="h-4 w-4" />}
          />
          <DataCard
            title="Uninvoiced Sales"
            value={formatCurrency(salesSummary.uninvoicedSales)}
            icon={<FileText className="h-4 w-4" />}
            description="Sales without invoices"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Sales Chart */}
          <Card className="hoverable-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-muted-foreground" />
                <span>Monthly Sales (TTC)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <MemoizedBarChart data={salesSummary.monthlySales} />
              </div>
            </CardContent>
          </Card>

          {/* Top Clients by Debt */}
          <Card className="hoverable-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span>Top Clients</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Sales Count</TableHead>
                    <TableHead className="text-right">Total Amount (TTC)</TableHead>
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
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Activity data will appear here as you add sales and invoices.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
