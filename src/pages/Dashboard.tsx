
import React from 'react';
import { useAppContext } from '../context/AppContext';
import MainLayout from '../components/layout/MainLayout';
import DataCard from '../components/ui/DataCard';
import { BarChart2, DollarSign, Users, FileText, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/format';

const Dashboard = () => {
  const { 
    clients, 
    getSalesSummary, 
    getDebtSummary,
    invoices
  } = useAppContext();
  
  const salesSummary = getSalesSummary();
  const debtSummary = getDebtSummary();
  
  // Count unpaid invoices
  const unpaidInvoices = invoices.filter(inv => !inv.isPaid).length;
  
  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DataCard
            title="Total Sales"
            value={formatCurrency(salesSummary.totalSales)}
            icon={<DollarSign className="h-4 w-4" />}
            description="All time sales value"
          />
          <DataCard
            title="Outstanding Debt"
            value={formatCurrency(debtSummary.totalDebt)}
            icon={<AlertTriangle className="h-4 w-4" />}
            description={`${unpaidInvoices} unpaid invoices`}
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
                <span>Monthly Sales</span>
              </CardTitle>
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

          {/* Top Clients by Debt */}
          <Card className="hoverable-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span>Top Clients by Outstanding Debt</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {debtSummary.debtByClient.slice(0, 5).map((clientDebt) => (
                  <div key={clientDebt.clientId} className="flex items-center justify-between">
                    <span className="font-medium">{clientDebt.clientName}</span>
                    <span className="text-destructive font-semibold">
                      {formatCurrency(clientDebt.amount)}
                    </span>
                  </div>
                ))}
                {debtSummary.debtByClient.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No outstanding debts</p>
                )}
              </div>
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
