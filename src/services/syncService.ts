import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { invoke } from '@tauri-apps/api/core';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface SyncData {
  clients: any[];
  sales: any[];
  payments: any[];
  credit_transactions: any[];
}

interface SyncQueueItem {
  id: string;
  table_name: string;
  entity_id: string;
  operation: string;
  data: string;
  created_at: string;
  synced_at?: string;
  sync_status: string;
  error?: string;
  retry_count: number;
  version: number;
}

class SyncService {
  private lastSynced: Date | null = null;
  private isSyncing: boolean = false;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => {
    this.isOnline = true;
    toast.success('Back online! Syncing changes...');
    this.syncChanges();
  };

  private handleOffline = () => {
    this.isOnline = false;
    toast.warning('You are offline. Changes will be synced when connection is restored.');
  };

  async initialSync(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // Fetch all data from Supabase only if we're online
      if (this.isOnline) {
        const [
          { data: clients, error: clientsError },
          { data: sales, error: salesError },
          { data: payments, error: paymentsError },
          { data: creditTransactions, error: creditError }
        ] = await Promise.all([
          supabase.from('clients').select('*'),
          supabase.from('sales').select('*'),
          supabase.from('payments').select('*'),
          supabase.from('credit_transactions').select('*')
        ]);

        if (clientsError || salesError || paymentsError || creditError) {
          throw new Error('Failed to fetch data from Supabase');
        }

        // Save to local SQLite database
        await invoke('initial_sync', {
          data: {
            clients: clients || [],
            sales: sales || [],
            payments: payments || [],
            credit_transactions: creditTransactions || []
          }
        });

        this.lastSynced = new Date();
        toast.success('Initial sync completed successfully');
      } else {
        // If offline, just check if we have local data
        const hasLocalData = await invoke<boolean>('check_local_data');
        if (!hasLocalData) {
          toast.error('No local data available. Please connect to the internet for initial setup.');
          throw new Error('No local data available');
        }
      }
    } catch (error) {
      console.error('Initial sync failed:', error);
      toast.error('Initial sync failed');
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  async syncChanges(): Promise<void> {
    if (this.isSyncing || !this.isOnline) return;
    this.isSyncing = true;

    try {
      // Get pending changes from local DB
      const pendingChanges = await invoke<SyncQueueItem[]>('fetch_pending_sync_items');
      
      for (const change of pendingChanges) {
        try {
          // Upload change to Supabase
          const { error } = await supabase
            .from(change.table_name)
            .upsert(JSON.parse(change.data));

          if (error) throw error;

          // Mark as synced in local DB
          await invoke('mark_sync_complete', { id: change.id });
        } catch (error) {
          console.error(`Failed to sync change ${change.id}:`, error);
          await invoke('mark_sync_failed', { 
            id: change.id, 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      this.lastSynced = new Date();
      if (pendingChanges.length > 0) {
        toast.success(`Synced ${pendingChanges.length} changes successfully`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync failed');
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  async getPendingChanges(): Promise<SyncQueueItem[]> {
    try {
      return await invoke<SyncQueueItem[]>('fetch_pending_sync_items');
    } catch (error) {
      console.error('Failed to fetch pending changes:', error);
      return [];
    }
  }

  getStatus() {
    return {
      lastSynced: this.lastSynced,
      isSyncing: this.isSyncing,
      isOnline: this.isOnline
    };
  }
}

export const syncService = new SyncService();
