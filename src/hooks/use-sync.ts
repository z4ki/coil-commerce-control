import { useEffect, useState, useCallback } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

// Initialize Tauri APIs
let tauriInvoke: ((cmd: string, args?: any) => Promise<any>) | undefined;

const invokeSafe = async <T>(cmd: string, args?: any): Promise<T> => {
  if (!window.__TAURI__) {
    console.warn('Not running in Tauri environment');
    return [] as any;
  }
  
  if (!tauriInvoke) {
    const tauri = await import('@tauri-apps/api/tauri');
    tauriInvoke = tauri.invoke;
  }
  
  return tauriInvoke(cmd, args);
};

interface SyncQueueItem {
  id: string;
  table_name: string;
  operation: string;
  sync_status: 'pending' | 'completed' | 'failed';
  error_message?: string;
  retry_count: number;
  created_at: string;
  synced_at?: string;
  last_attempt?: string;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt?: Date;
  pendingChanges: number;
  error?: string;
}

export function useSync() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingChanges: 0,
  });  // Query for getting sync queue items
  const { data: syncQueue = [] } = useQuery<SyncQueueItem[]>({
    queryKey: ['syncQueue'],
    queryFn: () => invokeSafe('fetch_pending_sync_items'),
    refetchInterval: 30000, // Refetch every 30 seconds
  });  // Mutation for syncing changes
  const { mutate: syncChanges, isPending } = useMutation({
    mutationFn: async () => {
      setStatus(prev => ({ ...prev, isSyncing: true }));
      try {
        await invokeSafe('sync_changes');
        setStatus(prev => ({ 
          ...prev, 
          isSyncing: false,
          lastSyncedAt: new Date(),
          error: undefined
        }));
        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ['syncQueue'] });
        toast.success('Synchronization completed successfully');
      } catch (error) {
        setStatus(prev => ({ 
          ...prev, 
          isSyncing: false, 
          error: error instanceof Error ? error.message : 'Sync failed'
        }));
        toast.error('Synchronization failed. Will retry automatically.');
        throw error;
      }
    }
  });
  // Effect to check online status and auto-sync
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupNetworkListener = async () => {
      try {
        // Check if we're running in Tauri
        if (window.__TAURI__) {
          const { listen } = await import('@tauri-apps/api/event');
          unlisten = await listen('network-status', (event: any) => {
            const isOnline = event.payload.isOnline;
            setStatus(prev => ({ ...prev, isOnline }));
            
            if (isOnline && syncQueue.length > 0) {
              syncChanges();
            }
          });
        } else {
          // Fallback to browser events when not in Tauri
          const handleOnline = () => {
            setStatus(prev => ({ ...prev, isOnline: true }));
            if (syncQueue.length > 0) {
              syncChanges();
            }
          };
          const handleOffline = () => {
            setStatus(prev => ({ ...prev, isOnline: false }));
          };

          window.addEventListener('online', handleOnline);
          window.addEventListener('offline', handleOffline);
          
          unlisten = () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
          };
        }
      } catch (error) {
        console.error('Failed to setup network listener:', error);
      }
    };

    setupNetworkListener();
    
    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [syncQueue.length, syncChanges]);

  // Effect to update pending changes count
  useEffect(() => {
    setStatus(prev => ({ 
      ...prev, 
      pendingChanges: syncQueue.length,
    }));
  }, [syncQueue]);

  const retryFailedSync = useCallback(() => {
    syncChanges();
  }, [syncChanges]);

  return {
    status,
    syncChanges,
    retryFailedSync,
    isPending,
    pendingItems: syncQueue,
  };
}
