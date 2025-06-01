import { supabase } from '@/integrations/supabase/client';
import { DashboardStats } from '@/types';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  // Get current date
  const today = new Date();
  
  // Get all invoices for the logged-in user
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('*');
  
  if (invoicesError) {
    console.error('Error fetching invoices for dashboard:', invoicesError);
    throw invoicesError;
  }
  
  // Get all sales for the logged-in user
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('*');
  
  if (salesError) {
    console.error('Error fetching sales for dashboard:', salesError);
    throw salesError;
  }
  
  // Calculate statistics
  const totalSales = sales.length;
  const totalInvoices = invoices.length;
  
  const paidInvoices = invoices.filter(invoice => invoice.is_paid).length;
  const unpaidInvoices = totalInvoices - paidInvoices;
  
  const overdueInvoices = invoices.filter(
    invoice => !invoice.is_paid && new Date(invoice.due_date) < today
  ).length;
  
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount_ht, 0);
  
  const paidInvoiceIds = invoices.filter(invoice => invoice.is_paid).map(invoice => invoice.id);
  
  // Get payments for the paid invoices
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .in('invoice_id', paidInvoiceIds);
  
  if (paymentsError && paidInvoiceIds.length > 0) {
    console.error('Error fetching payments for dashboard:', paymentsError);
    throw paymentsError;
  }
  
  const revenueCollected = (payments || []).reduce((sum, payment) => sum + payment.amount, 0);
  
  const outstandingAmount = totalRevenue - revenueCollected;
    // Calculate payment method totals from all payments, not just those linked to invoices
  const { data: allPayments, error: allPaymentsError } = await supabase
    .from('payments')
    .select('*');

  if (allPaymentsError) {
    console.error('Error fetching all payments for dashboard:', allPaymentsError);
    throw allPaymentsError;
  }

  const paymentMethodTotals = {
    cash: (allPayments || []).filter(p => p.method === 'cash').reduce((sum, p) => sum + Number(p.amount), 0),
    bank_transfer: (allPayments || []).filter(p => p.method === 'bank_transfer').reduce((sum, p) => sum + Number(p.amount), 0),
    check: (allPayments || []).filter(p => p.method === 'check').reduce((sum, p) => sum + Number(p.amount), 0),
  };
  
  return {
    totalSales,
    totalInvoices,
    paidInvoices,
    unpaidInvoices,
    overdueInvoices,
    totalRevenue,
    revenueCollected,
    outstandingAmount,
    paymentMethodTotals
  };
};
