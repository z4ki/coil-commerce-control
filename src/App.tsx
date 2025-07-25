import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import { LanguageProvider } from './context/LanguageContext';
import { InvoiceSettingsProvider } from './context/InvoiceSettingsContext';
import { AppSettingsProvider } from './context/AppSettingsContext';
import ThemeProvider from './components/theme/ThemeProvider';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ProductAnalytics } from './components/analytics/ProductAnalytics';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { ProductSearchBar } from './components/products/ProductSearchBar';
import { ProductList } from './components/products/ProductList';
import { useProductStore } from './stores/product-store';

// Lazy load route components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const ClientDetail = lazy(() => import('./pages/ClientDetail'));
const Sales = lazy(() => import('./pages/Sales'));
const Invoices = lazy(() => import('./pages/Invoices'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));
const SaleForm = lazy(() => import('./components/sales/SaleForm'));
const ClientForm = lazy(() => import('./components/clients/ClientForm'));
const InvoiceForm = lazy(() => import('./components/invoices/InvoiceForm'));
const SaleDetail = lazy(() => import('./pages/SaleDetail'));
const AuditLogPage = lazy(() => import('./pages/AuditLog'));
const SoldProductsAnalytics = lazy(() => import('./pages/SoldProductsAnalytics'));

const queryClient = new QueryClient();

// Wrapper components for forms with navigation
const InvoiceFormWrapper = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getInvoiceById } = useAppContext();

  const invoice = id ? getInvoiceById(id) ?? null : null;
  const onSuccess = () => navigate('/invoices');

  return <InvoiceForm invoice={invoice} onSuccess={onSuccess} />;
};

const ClientFormWrapper = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getClientById } = useAppContext();

  const client = id ? getClientById(id) ?? null : null;
  const onSuccess = () => navigate('/clients');

  return <ClientForm client={client} onSuccess={onSuccess} />;
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading (replace with real data fetch or initialization)
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(false);
  // const { filters, setFilters } = useProductStore();

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <QueryClientProvider client={queryClient}>
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(255,255,255,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div className="loader" style={{
            border: '6px solid #e0e0e0',
            borderTop: '6px solid #0078d4',
            borderRadius: '50%',
            width: 48,
            height: 48,
            animation: 'spin 1s linear infinite',
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      <TooltipProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AppSettingsProvider>
              <InvoiceSettingsProvider>
                <AppProvider>
                  <BrowserRouter>
                    <Suspense fallback={<div>Loading page...</div>}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/sales" element={<Sales />} />
                        <Route path="/sales/new" element={<SaleForm />} />
                        <Route path="/sales/:id" element={<SaleDetail />} />
                        <Route path="/invoices" element={<Invoices />} />
                        <Route path="/invoices/new" element={<InvoiceFormWrapper />} />
                        <Route path="/invoices/:invoiceId" element={<InvoiceDetail />} />
                        <Route path="/clients" element={<Clients />} />
                        <Route path="/clients/new" element={<ClientFormWrapper />} />
                        <Route path="/clients/:id" element={<ClientDetail />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/audit-log" element={<AuditLogPage />} />
                        <Route path="/analytics/sold-products" element={<SoldProductsAnalytics />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </BrowserRouter>
                  <Toaster />
                  <Sonner />
                </AppProvider>
              </InvoiceSettingsProvider>
            </AppSettingsProvider>
          </ThemeProvider>
        </LanguageProvider>
      </TooltipProvider>
      {/* <ErrorBoundary>
        <ProductSearchBar filters={filters} onChange={setFilters} />
        <ProductList />
        <ProductAnalytics />
      </ErrorBoundary> */}
    </QueryClientProvider>
  );
};

export default App;
