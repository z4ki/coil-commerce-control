import Database from 'tauri-plugin-sql-api';
import { DatabaseAdapter, SyncQueueItem } from './types';
import { Database as SupabaseDatabase } from '@/types/supabase';

export class LocalAdapter implements DatabaseAdapter {
  private db: Database | null = null;
  private syncQueue: SyncQueueItem[] = [];

  constructor() {
    this.initDatabase();
  }

  private async initDatabase() {
    try {
      this.db = await Database.load('sqlite:local.db');
      await this.createTables();
    } catch (error) {
      console.error('Failed to initialize local database:', error);
    }
  }    private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.execute('BEGIN TRANSACTION');

      // Core tables
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS clients (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          company TEXT,
          address TEXT,
          phone TEXT,
          email TEXT,
          nif TEXT,
          nis TEXT,
          rc TEXT,
          ai TEXT,
          rib TEXT,
          notes TEXT,
          credit_balance REAL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT
        )
      `);

      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL,
          date TEXT NOT NULL,
          due_date TEXT NOT NULL,
          invoice_number TEXT NOT NULL UNIQUE,
          total_amount REAL NOT NULL,
          is_paid BOOLEAN DEFAULT false,
          paid_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        )
      `);

      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS sales (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL,
          invoice_id TEXT,
          date TEXT NOT NULL,
          total_amount REAL NOT NULL,
          tax_rate REAL NOT NULL DEFAULT 0,
          transportation_fee REAL,
          is_invoiced BOOLEAN DEFAULT false,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
        )
      `);

      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS sale_items (
          id TEXT PRIMARY KEY,
          sale_id TEXT NOT NULL,
          description TEXT,
          quantity REAL NOT NULL,
          price_per_ton REAL,
          total_amount REAL NOT NULL,
          product_type TEXT NOT NULL CHECK (product_type IN ('STANDARD', 'TN40', 'STEEL_SLITTING')),
          coil_ref TEXT,
          coil_thickness REAL,
          coil_width REAL,
          coil_weight REAL,
          top_coat_ral TEXT,
          back_coat_ral TEXT,
          input_width REAL,
          output_width REAL,
          thickness REAL,
          weight REAL,
          strips_count INTEGER,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
        )
      `);

      // Create credit-related tables
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS credit_transactions (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL,
          amount REAL NOT NULL,
          type TEXT CHECK (type IN ('credit', 'debit')),
          source_type TEXT CHECK (source_type IN ('payment', 'refund', 'manual_adjustment', 'credit_use')),
          source_id TEXT,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        )
      `);

      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY,
          invoice_id TEXT NOT NULL,
          client_id TEXT NOT NULL,
          date TEXT NOT NULL,
          amount REAL NOT NULL,
          method TEXT CHECK (method IN ('cash', 'bank_transfer', 'check', 'term')),
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          generates_credit BOOLEAN DEFAULT false,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        )
      `);

      // Create sync queue table for offline changes
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
          table_name TEXT NOT NULL,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'error')),
          error TEXT
        )
      `);

      // Create indexes for better performance
      await this.db.execute(`
        CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(client_id);
        CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
        CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_id);
        CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
        CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
        CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
        CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
        CREATE INDEX IF NOT EXISTS idx_credit_client ON credit_transactions(client_id);
        CREATE INDEX IF NOT EXISTS idx_credit_date ON credit_transactions(created_at);
        CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
        CREATE INDEX IF NOT EXISTS idx_sync_queue_timestamp ON sync_queue(timestamp);
      `);

      await this.db.execute('COMMIT');
    } catch (error) {
      await this.db.execute('ROLLBACK');
      console.error('Failed to create tables:', error);
      throw new Error(`Failed to initialize database schema: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async isOnline(): Promise<boolean> {
    return false; // Local database is always "offline"
  }  async create<T extends keyof SupabaseDatabase['public']['Tables']>(
    table: T,
    data: SupabaseDatabase['public']['Tables'][T]['Insert']
  ): Promise<SupabaseDatabase['public']['Tables'][T]['Row']> {
    if (!this.db) throw new Error('Database not initialized');

    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `?${i + 1}`).join(', ');

    const query = `
      INSERT INTO ${String(table)} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.db.select(query, values);
    
    // Queue for sync
    await this.queueChange({
      id: crypto.randomUUID(),
      operation: 'create',
      table: String(table),
      data,
      timestamp: Date.now(),
      status: 'pending'
    });

    return result[0] as SupabaseDatabase['public']['Tables'][T]['Row'];
  }
  async read<T extends keyof SupabaseDatabase['public']['Tables']>(
    table: T,
    query?: {
      where?: Record<string, any>;
      select?: string;
      order?: Record<string, 'asc' | 'desc'>;
      limit?: number;
      offset?: number;
    }
  ): Promise<SupabaseDatabase['public']['Tables'][T]['Row'][]> {
    if (!this.db) throw new Error('Database not initialized');

    let sql = `SELECT ${query?.select || '*'} FROM ${String(table)}`;
    const values: any[] = [];

    if (query?.where) {
      const conditions = Object.entries(query.where)
        .map(([key], index) => `${key} = ?${index + 1}`)
        .join(' AND ');
      sql += ` WHERE ${conditions}`;
      values.push(...Object.values(query.where));
    }

    if (query?.order) {
      const orderClauses = Object.entries(query.order)
        .map(([key, direction]) => `${key} ${direction.toUpperCase()}`)
        .join(', ');
      sql += ` ORDER BY ${orderClauses}`;
    }

    if (query?.limit) {
      sql += ` LIMIT ${query.limit}`;
    }

    if (query?.offset) {
      sql += ` OFFSET ${query.offset}`;
    }

    const results = await this.db.select(sql, values);
    return results as SupabaseDatabase['public']['Tables'][T]['Row'][];
  }
  async update<T extends keyof SupabaseDatabase['public']['Tables']>(
    table: T,
    data: Partial<SupabaseDatabase['public']['Tables'][T]['Update']>,
    where: Record<string, any>
  ): Promise<SupabaseDatabase['public']['Tables'][T]['Row']> {
    if (!this.db) throw new Error('Database not initialized');

    const setClause = Object.keys(data)
      .map((key, index) => `${key} = ?${index + 1}`)
      .join(', ');

    const whereClause = Object.keys(where)
      .map((key, index) => `${key} = ?${index + 1 + Object.keys(data).length}`)
      .join(' AND ');

    const values = [...Object.values(data), ...Object.values(where)];

    const query = `
      UPDATE ${String(table)}
      SET ${setClause}
      WHERE ${whereClause}
      RETURNING *
    `;    const result = await this.db.select(query, values);    // Queue for sync
    await this.queueChange({
      id: crypto.randomUUID(),
      operation: 'update',
      table: String(table),
      data: { ...data, where },
      timestamp: Date.now(),
      status: 'pending'
    });

    return result[0] as SupabaseDatabase['public']['Tables'][T]['Row'];
  }
  async delete<T extends keyof SupabaseDatabase['public']['Tables']>(
    table: T,
    where: Record<string, any>
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const whereClause = Object.keys(where)
      .map((key, index) => `${key} = ?${index + 1}`)
      .join(' AND ');

    const values = Object.values(where);

    await this.db.execute(`DELETE FROM ${String(table)} WHERE ${whereClause}`, values);

    // Queue for sync
    await this.queueChange({
      id: crypto.randomUUID(),
      operation: 'delete',
      table: String(table),
      data: where,
      timestamp: Date.now(),
      status: 'pending'
    });
  }

  async transaction<T>(operations: () => Promise<T>): Promise<T> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.execute('BEGIN TRANSACTION');
      const result = await operations();
      await this.db.execute('COMMIT');
      return result;
    } catch (error) {
      await this.db.execute('ROLLBACK');
      throw error;
    }
  }

  async sync(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Get all pending changes
      const pendingChanges = await this.getPendingChanges();
      
      if (pendingChanges.length === 0) {
        return;
      }

      // Process each change in order
      for (const change of pendingChanges) {
        try {
          // Mark as processing
          await this.updateSyncStatus(change.id, 'processing');

          // Keep track of the change to retry later if needed
          const retryChange = { ...change };

          // Cleanup successful change
          await this.db.execute(
            `DELETE FROM sync_queue WHERE id = ?`,
            [change.id]
          );

          // Remove from memory queue
          const index = this.syncQueue.findIndex(item => item.id === change.id);
          if (index !== -1) {
            this.syncQueue.splice(index, 1);
          }
        } catch (error) {
          console.error(`Failed to process sync change ${change.id}:`, error);
          await this.updateSyncStatus(
            change.id,
            'error',
            error instanceof Error ? error.message : String(error)
          );
        }
      }

      // Cleanup old sync items
      await this.cleanupSyncQueue();
    } catch (error) {
      console.error('Failed to sync changes:', error);
      throw new Error(`Failed to sync changes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async queueChange(change: SyncQueueItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.execute(
        `INSERT INTO sync_queue (id, operation, table_name, data, timestamp, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          change.id,
          change.operation,
          change.table,
          JSON.stringify(change.data),
          change.timestamp,
          change.status
        ]
      );

      this.syncQueue.push(change);
    } catch (error) {
      console.error('Failed to queue change:', error);
      throw new Error(`Failed to queue change: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPendingChanges(): Promise<SyncQueueItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.select<Array<{
        id: string;
        operation: string;
        table_name: string;
        data: string;
        timestamp: number;
        status: string;
        error?: string;
      }>>(
        `SELECT * FROM sync_queue 
         WHERE status = 'pending'
         ORDER BY timestamp ASC`
      );

      return result.map(row => ({
        id: row.id,
        operation: row.operation as SyncQueueItem['operation'],
        table: row.table_name,
        data: JSON.parse(row.data),
        timestamp: row.timestamp,
        status: row.status as SyncQueueItem['status'],
        error: row.error
      }));
    } catch (error) {
      console.error('Failed to get pending changes:', error);
      throw new Error(`Failed to get pending changes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateSyncStatus(id: string, status: SyncQueueItem['status'], error?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.execute(
        `UPDATE sync_queue 
         SET status = ?, error = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [status, error, id]
      );
    } catch (error) {
      console.error('Failed to update sync status:', error);
      throw new Error(`Failed to update sync status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async cleanupSyncQueue(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Remove successful syncs older than maxAge
      const cutoffTime = Date.now() - maxAge;
      await this.db.execute(
        `DELETE FROM sync_queue 
         WHERE status != 'pending' 
         AND timestamp < ?`,
        [cutoffTime]
      );
    } catch (error) {
      console.error('Failed to cleanup sync queue:', error);
      throw new Error(`Failed to cleanup sync queue: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
