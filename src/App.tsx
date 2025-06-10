import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { LanguageProvider } from './context/LanguageContext';
import { InvoiceSettingsProvider } from './context/InvoiceSettingsContext';
import { AppSettingsProvider } from './context/AppSettingsContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ThemeProvider from './components/theme/ThemeProvider';

// Pages
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Sales from "./pages/Sales";
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import SaleForm from "./components/sales/SaleForm";
import ClientForm from "./components/clients/ClientForm";
import InvoiceForm from "./components/invoices/InvoiceForm";
import Login from './pages/Login';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Wrapper components for forms with navigation
const InvoiceFormWrapper = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getInvoiceById } = useApp();

  const invoice = id ? getInvoiceById(id) ?? null : null;
  const onSuccess = () => navigate('/invoices');

  return <InvoiceForm invoice={invoice} onSuccess={onSuccess} />;
};

const ClientFormWrapper = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getClientById } = useApp();

  const client = id ? getClientById(id) ?? null : null;
  const onSuccess = () => navigate('/clients');

  return <ClientForm client={client} onSuccess={onSuccess} />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppProvider>
          <AuthProvider>
            <LanguageProvider>
              <AppSettingsProvider>
                <InvoiceSettingsProvider>
                  <TooltipProvider>
                    <BrowserRouter>
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        
                        {/* Protected Routes */}
                        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
                        <Route path="/clients/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
                        <Route path="/clients/new" element={<ProtectedRoute><ClientFormWrapper /></ProtectedRoute>} />
                        <Route path="/clients/edit/:id" element={<ProtectedRoute><ClientFormWrapper /></ProtectedRoute>} />
                        <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
                        <Route path="/sales/new" element={<ProtectedRoute><SaleForm /></ProtectedRoute>} />
                        <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
                        <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
                        <Route path="/invoices/new" element={<ProtectedRoute><InvoiceFormWrapper /></ProtectedRoute>} />
                        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                      <Toaster />
                      <Sonner />
                    </BrowserRouter>
                  </TooltipProvider>
                </InvoiceSettingsProvider>
              </AppSettingsProvider>
            </LanguageProvider>
          </AuthProvider>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
