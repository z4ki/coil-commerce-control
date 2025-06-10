import { supabase } from '@/integrations/supabase/client';
import { LocalAdapter } from './database/localAdapter';

export class BackupService {
  private localAdapter: LocalAdapter;
  private tables = ['clients', 'sales', 'invoices', 'payments', 'credit_transactions', 'sale_items'];

  constructor(localAdapter: LocalAdapter) {
    this.localAdapter = localAdapter;
  }

  async backupToSupabase(): Promise<void> {
    try {
      for (const table of this.tables) {
        // Get all records from local DB
        const records = await this.localAdapter.read(table);
        
        if (records.length > 0) {
          // Delete existing records in Supabase
          await supabase.from(table).delete().neq('id', 'dummy');
          
          // Insert records in chunks of 500 to avoid payload size limits
          const chunkSize = 500;
          for (let i = 0; i < records.length; i += chunkSize) {
            const chunk = records.slice(i, i + chunkSize);
            const { error } = await supabase.from(table).insert(chunk);
            if (error) {
              console.error(`Error backing up ${table}:`, error);
              throw error;
            }
          }
        }
      }
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  async restoreFromSupabase(): Promise<void> {
    try {
      for (const table of this.tables) {
        // Get all records from Supabase
        const { data: records, error } = await supabase.from(table).select('*');
        
        if (error) throw error;
        
        if (records && records.length > 0) {
          // Clear local table
          await this.localAdapter.delete(table, {});
          
          // Insert records in chunks
          const chunkSize = 500;
          for (let i = 0; i < records.length; i += chunkSize) {
            const chunk = records.slice(i, i + chunkSize);
            for (const record of chunk) {
              await this.localAdapter.create(table, record);
            }
          }
        }
      }
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }
}
