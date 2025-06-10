import { useEffect, useState, useCallback } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { syncService, isLocalDbInitialized, initialDownloadAndInsert } from '../services/syncService';
import type { SyncData } from '../services/syncService';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSynced: Date | null;
  pendingChanges: number;
  error?: string;
}

export function useSync() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSynced: null,
    pendingChanges: 0
  });

  // Query to fetch pending items
  const { data: pendingItems = [] } = useQuery({
    queryKey: ['pendingSync'],
    queryFn: () => syncService.getPendingChanges(),
    initialData: []
  });

  // Initial sync mutation
  const { mutate: performInitialSync } = useMutation({
    mutationFn: () => syncService.initialSync(),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setStatus(prev => ({
        ...prev,
        lastSynced: new Date(),
        error: undefined
      }));
    },
    onError: (error) => {
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Initial sync failed'
      }));
    }
  });

  // Regular sync mutation
  const { mutate: syncChanges, isPending } = useMutation({
    mutationFn: () => syncService.syncChanges(),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setStatus(prev => ({
        ...prev,
        lastSynced: new Date(),
        error: undefined
      }));
    },
    onError: (error) => {
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sync failed'
      }));
    }
  });

  // Effect to handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      syncChanges();
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync when component mounts
    if (navigator.onLine) {
      performInitialSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync every 5 minutes when online
  useEffect(() => {
    if (!status.isOnline) return;

    const interval = setInterval(() => {
      syncChanges();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [status.isOnline]);

  useEffect(() => {
    // Update pendingChanges count when pendingItems changes
    setStatus(prev => ({
      ...prev,
      pendingChanges: pendingItems.length
    }));
  }, [pendingItems]);

  useEffect(() => {
    async function ensureLocalDb() {
      const initialized = await isLocalDbInitialized();
      if (!initialized) {
        // You may want to get these from env or config
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        await initialDownloadAndInsert(supabaseUrl, supabaseKey);
      }
    }
    ensureLocalDb();
  }, []);

  return {
    status,
    syncNow: syncChanges,
    isPending,
    pendingItems
  };
}
