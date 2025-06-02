import { Database } from '@/types/supabase';

export interface DatabaseAdapter {
  isOnline(): Promise<boolean>;
  
  // Generic CRUD operations
  create<T extends keyof Database['public']['Tables']>(
    table: T,
    data: Database['public']['Tables'][T]['Insert']
  ): Promise<Database['public']['Tables'][T]['Row']>;
  
  read<T extends keyof Database['public']['Tables']>(
    table: T,
    query?: {
      where?: Record<string, any>;
      select?: string;
      order?: Record<string, 'asc' | 'desc'>;
      limit?: number;
      offset?: number;
    }
  ): Promise<Database['public']['Tables'][T]['Row'][]>;
  
  update<T extends keyof Database['public']['Tables']>(
    table: T,
    data: Partial<Database['public']['Tables'][T]['Update']>,
    where: Record<string, any>
  ): Promise<Database['public']['Tables'][T]['Row']>;
  
  delete<T extends keyof Database['public']['Tables']>(
    table: T,
    where: Record<string, any>
  ): Promise<void>;
  
  // Transaction support
  transaction<T>(operations: () => Promise<T>): Promise<T>;
  
  // Sync operations
  sync(): Promise<void>;
  getPendingChanges(): Promise<any[]>;
}

export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  status: 'pending' | 'processing' | 'error';
  error?: string;
}
