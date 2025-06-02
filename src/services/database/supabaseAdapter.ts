import { supabase } from '@/integrations/supabase/client';
import { DatabaseAdapter } from './types';
import { Database } from '@/types/supabase';

export class SupabaseAdapter implements DatabaseAdapter {
  private lastOnlineCheck: number = 0;
  private isOnlineValue: boolean = true;
  
  async isOnline(): Promise<boolean> {
    // Cache the result for 30 seconds
    if (Date.now() - this.lastOnlineCheck < 30000) {
      return this.isOnlineValue;
    }

    try {
      const { data } = await supabase.from('health_check').select('count').single();
      this.isOnlineValue = true;
      this.lastOnlineCheck = Date.now();
      return true;
    } catch (error) {
      this.isOnlineValue = false;
      this.lastOnlineCheck = Date.now();
      return false;
    }
  }

  async create<T extends keyof Database['public']['Tables']>(
    table: T,
    data: Database['public']['Tables'][T]['Insert']
  ): Promise<Database['public']['Tables'][T]['Row']> {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    if (!result) throw new Error('Failed to create record');
    
    return result;
  }

  async read<T extends keyof Database['public']['Tables']>(
    table: T,
    query?: {
      where?: Record<string, any>;
      select?: string;
      order?: Record<string, 'asc' | 'desc'>;
      limit?: number;
      offset?: number;
    }
  ): Promise<Database['public']['Tables'][T]['Row'][]> {
    let queryBuilder = supabase
      .from(table)
      .select(query?.select || '*');

    if (query?.where) {
      Object.entries(query.where).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value);
      });
    }

    if (query?.order) {
      Object.entries(query.order).forEach(([key, direction]) => {
        queryBuilder = queryBuilder.order(key, { ascending: direction === 'asc' });
      });
    }

    if (query?.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }

    if (query?.offset) {
      queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit || 10) - 1);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;
    return data || [];
  }

  async update<T extends keyof Database['public']['Tables']>(
    table: T,
    data: Partial<Database['public']['Tables'][T]['Update']>,
    where: Record<string, any>
  ): Promise<Database['public']['Tables'][T]['Row']> {
    let queryBuilder = supabase.from(table).update(data);

    Object.entries(where).forEach(([key, value]) => {
      queryBuilder = queryBuilder.eq(key, value);
    });

    const { data: result, error } = await queryBuilder.select().single();

    if (error) throw error;
    if (!result) throw new Error('Failed to update record');
    
    return result;
  }

  async delete<T extends keyof Database['public']['Tables']>(
    table: T,
    where: Record<string, any>
  ): Promise<void> {
    let queryBuilder = supabase.from(table);

    Object.entries(where).forEach(([key, value]) => {
      queryBuilder = queryBuilder.eq(key, value);
    });

    const { error } = await queryBuilder.delete();

    if (error) throw error;
  }

  async transaction<T>(operations: () => Promise<T>): Promise<T> {
    // Supabase doesn't support client-side transactions
    // We'll just execute the operations
    return await operations();
  }

  async sync(): Promise<void> {
    // No sync needed for online database
    return;
  }

  async getPendingChanges(): Promise<any[]> {
    // No pending changes in online mode
    return [];
  }
}
