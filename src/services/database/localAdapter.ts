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
  }
  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // Create tables matching Supabase schema
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
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL REFERENCES clients(id),
        date TEXT NOT NULL,
        total_amount REAL NOT NULL,
        payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'check', 'term')),
        product_type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      )
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        sale_id TEXT NOT NULL REFERENCES sales(id),
        client_id TEXT NOT NULL REFERENCES clients(id),
        bulk_payment_id TEXT,
        date TEXT NOT NULL,
        amount REAL NOT NULL,
        method TEXT CHECK (method IN ('cash', 'bank_transfer', 'check', 'term')),
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        generates_credit INTEGER DEFAULT 0,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      )
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS credit_transactions (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL REFERENCES clients(id),
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
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        operation TEXT NOT NULL,
        table_name TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        status TEXT NOT NULL,
        error TEXT
      )
    `);

    // Create indexes for better performance
    await this.db.execute(`
      CREATE INDEX IF NOT EXISTS payments_sale_id_idx ON payments(sale_id);
      CREATE INDEX IF NOT EXISTS payments_client_id_idx ON payments(client_id);
      CREATE INDEX IF NOT EXISTS payments_date_idx ON payments(date);
      CREATE INDEX IF NOT EXISTS sales_client_id_idx ON sales(client_id);
      CREATE INDEX IF NOT EXISTS credit_transactions_client_id_idx ON credit_transactions(client_id);
      CREATE INDEX IF NOT EXISTS credit_transactions_created_at_idx ON credit_transactions(created_at);
    `);
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

  private async queueChange(change: SyncQueueItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

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
  }
  async getPendingChanges(): Promise<SyncQueueItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.select<Array<Record<string, unknown>>>(
      'SELECT * FROM sync_queue WHERE status = ? ORDER BY timestamp ASC',
      ['pending']
    );    return result.map((row) => ({
      id: row.id as string,
      operation: row.operation as SyncQueueItem['operation'],
      table: row.table_name as string,
      data: JSON.parse(row.data as string),
      timestamp: row.timestamp as number,
      status: row.status as SyncQueueItem['status'],
      error: row.error as string | undefined
    }));
  }

  async sync(): Promise<void> {
    // This will be implemented in the DatabaseManager
    return;
  }
}
