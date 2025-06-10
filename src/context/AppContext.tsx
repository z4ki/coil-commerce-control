// Place this file in src/contexts/AppContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { LocalAdapter } from '@/services/database/localAdapter';
import { BackupService } from '@/services/backupService';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Database } from '@/types/supabase';

type Client = Database['public']['Tables']['clients']['Row'];
type Sale = Database['public']['Tables']['sales']['Row'];
type Invoice = Database['public']['Tables']['invoices']['Row'];
type Payment = Database['public']['Tables']['payments']['Row'];

interface AppContextType {
  localAdapter: LocalAdapter;
  isOnline: boolean;
  lastBackup: string | null;
  performBackup: () => Promise<void>;
  backupInProgress: boolean;
  // Data
  clients: Client[];
  sales: Sale[];
  invoices: Invoice[];
  payments: Payment[];
  // Functions
  getSalesSummary: () => { totalAmount: number; count: number };
  getDebtSummary: () => { totalAmount: number; count: number };
  getSalesByClient: (clientId: string) => Sale[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [lastBackup, setLastBackup] = useLocalStorage<string | null>('lastBackupTimestamp', null);
  const [initialized, setInitialized] = useState(false);
  // State for initialization error
  const [initError, setInitError] = useState<string | null>(null);
  
  // State for data
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  
  const localAdapter = React.useMemo(() => new LocalAdapter(), []);
  const backupService = React.useMemo(() => new BackupService(localAdapter), [localAdapter]);
  // Initialize database and load data
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    async function initializeData() {
      try {
        // Load initial data
        const [clientData, salesData, invoiceData, paymentData] = await Promise.all([
          localAdapter.read<'clients'>('clients'),
          localAdapter.read<'sales'>('sales'),
          localAdapter.read<'invoices'>('invoices'),
          localAdapter.read<'payments'>('payments')
        ]);

        setClients(clientData);
        setSales(salesData);
        setInvoices(invoiceData);
        setPayments(paymentData);
        setInitialized(true);
        setInitError(null);
      } catch (error) {
        console.error('Failed to initialize data:', error);
        
        // Retry logic
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying database initialization (attempt ${retryCount}/${MAX_RETRIES})...`);
          retryTimeout = setTimeout(initializeData, RETRY_DELAY);
        } else {
          setInitError(error instanceof Error ? error.message : 'Failed to initialize database');
        }
      }
    }

    initializeData();

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [localAdapter]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Data summary functions
  const getSalesSummary = React.useCallback(() => {
    const totalAmount = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
    return {
      totalAmount,
      count: sales.length
    };
  }, [sales]);

  const getDebtSummary = React.useCallback(() => {
    const unpaidInvoices = invoices.filter(inv => !inv.is_paid);
    const totalAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    return {
      totalAmount,
      count: unpaidInvoices.length
    };
  }, [invoices]);

  const getSalesByClient = React.useCallback((clientId: string) => {
    return sales.filter(sale => sale.client_id === clientId);
  }, [sales]);

  // Automatic daily backup
  useEffect(() => {
    const checkAndBackup = async () => {
      if (!isOnline || backupInProgress || !initialized) return;

      const now = new Date();
      const lastBackupTime = lastBackup ? new Date(lastBackup) : new Date(0);
      const timeSinceLastBackup = now.getTime() - lastBackupTime.getTime();
      
      // If last backup was more than 24 hours ago
      if (timeSinceLastBackup > 24 * 60 * 60 * 1000) {
        try {
          setBackupInProgress(true);
          await backupService.backupToSupabase();
          setLastBackup(now.toISOString());
        } catch (error) {
          console.error('Automatic backup failed:', error);
        } finally {
          setBackupInProgress(false);
        }
      }
    };

    // Check for backup needs when coming online or on initialization
    if (isOnline && initialized) {
      checkAndBackup();
    }

    // Set up periodic checks
    const interval = setInterval(checkAndBackup, 60 * 60 * 1000); // Check every hour
    return () => clearInterval(interval);
  }, [isOnline, backupInProgress, initialized, lastBackup, backupService]);

  // Manual backup function
  const performBackup = React.useCallback(async () => {
    if (!isOnline || backupInProgress || !initialized) {
      throw new Error('Cannot perform backup at this time');
    }

    try {
      setBackupInProgress(true);
      await backupService.backupToSupabase();
      const now = new Date();
      setLastBackup(now.toISOString());
    } finally {
      setBackupInProgress(false);
    }
  }, [isOnline, backupInProgress, initialized, backupService]);

  // Context value
  const contextValue = React.useMemo(() => ({
    localAdapter,
    isOnline,
    lastBackup,
    performBackup,
    backupInProgress,
    // Data
    clients,
    sales,
    invoices,
    payments,
    // Functions
    getSalesSummary,
    getDebtSummary,
    getSalesByClient,
  }), [
    localAdapter,
    isOnline,
    lastBackup,
    performBackup,
    backupInProgress,
    clients,
    sales,
    invoices,
    payments,
    getSalesSummary,
    getDebtSummary,
    getSalesByClient,
  ]);

  // Show error state if initialization failed
  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg max-w-md">
          <h2 className="text-lg font-semibold mb-2">Database Initialization Error</h2>
          <p className="text-sm">{initError}</p>
        </div>
      </div>
    );
  }

  // Show loading state during initialization
  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Add useApp hook after AppProvider
export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
