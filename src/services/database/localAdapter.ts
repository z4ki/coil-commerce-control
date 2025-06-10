// src/services/database/localAdapter.ts
import Database from '@tauri-apps/plugin-sql';
import { DatabaseAdapter, SyncQueueItem } from './types';
import { Database as SupabaseDatabase } from '@/types/supabase';

export class LocalAdapter implements DatabaseAdapter {
  private db: Database | null = null;
  private initializationPromise: Promise<void>;
  private isInitialized = false;

  constructor() {
    this.initializationPromise = this.initDatabase()
      .then(() => {
        this.isInitialized = true;
      })
      .catch(error => {
        console.error('Database initialization failed:', error);
        throw error;
      });
  }

  private async initDatabase() {
    try {
      console.log('Starting database initialization...');
      
      // Use the platform-specific path for AppData
      const dbPath = process.platform === 'win32' 
        ? process.env.APPDATA 
        : process.platform === 'darwin'
          ? `${process.env.HOME}/Library/Application Support`
          : `${process.env.HOME}/.local/share`;
          
      const appName = 'coil-commerce-control';
      const fullPath = `${dbPath}/${appName}`.replace(/\\/g, '/');
      const dbFilePath = `${fullPath}/database.db`;
      
      console.log('Database path:', dbFilePath);
      
      // Try to load the database with proper URI format
      this.db = await Database.load(`sqlite:${dbFilePath}`);
      console.log('Database loaded successfully');
      
      // Create tables in a transaction
      await this.createTables();
      console.log('Tables created successfully');
    } catch (error: unknown) {
      console.error('Failed to initialize local database:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.execute('BEGIN');

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
        );
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
        );
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
        );
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
        );
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
        );
      `);

      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
          table_name TEXT NOT NULL,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'error')),
          error TEXT
        );
      `);

      // Indexes
      await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(client_id);`);
      await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);`);
      await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_id);`);
      await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);`);
      await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);`);
      await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);`);
      await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);`);
      await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_sync_queue_timestamp ON sync_queue(timestamp);`);

      await this.db.execute('COMMIT');
    } catch (error) {
      if (this.db) {
        await this.db.execute('ROLLBACK');
      }
      console.error('Failed to create tables:', error);
      throw new Error(
        `Failed to initialize database schema: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initializationPromise;
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
  }

  async isOnline(): Promise<boolean> {
    await this.ensureInitialized();
    return true; // Local database is always "online"
  }

  async create<T extends keyof SupabaseDatabase['public']['Tables']>(
    table: T,
    data: SupabaseDatabase['public']['Tables'][T]['Insert']
  ): Promise<SupabaseDatabase['public']['Tables'][T]['Row']> {
    await this.ensureInitialized();
    const { columnNames, values } = this.prepareInsertData(data);

    const result = await this.db!.select<SupabaseDatabase['public']['Tables'][T]['Row'][]>(
      `INSERT INTO ${table} (${columnNames.join(', ')})
       VALUES (${columnNames.map((_, i) => `$${i + 1}`).join(', ')})
       RETURNING *`,
      values
    );

    if (!result?.[0]) throw new Error('Failed to create record');
    return result[0];
  }

  private prepareInsertData(data: Record<string, any>) {
    const entries = Object.entries(data).filter(([_, value]) => value !== undefined);
    return {
      columnNames: entries.map(([key]) => key),
      values: entries.map(([_, value]) => value),
    };
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
    await this.ensureInitialized();
    
    const { sql, params } = this.buildSelectQuery(table, query);
    const result = await this.db!.select<SupabaseDatabase['public']['Tables'][T]['Row'][]>(sql, params);
    return result || [];
  }

  private buildSelectQuery(table: string, query?: {
    where?: Record<string, any>;
    select?: string;
    order?: Record<string, 'asc' | 'desc'>;
    limit?: number;
    offset?: number;
  }) {
    let sql = `SELECT ${query?.select || '*'} FROM ${table}`;
    const params: any[] = [];

    if (query?.where) {
      const conditions = Object.entries(query.where)
        .filter(([_, value]) => value !== undefined)
        .map(([key], index) => `${key} = $${index + 1}`);
      
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
        params.push(...Object.values(query.where).filter(v => v !== undefined));
      }
    }

    if (query?.order) {
      const orderClauses = Object.entries(query.order)
        .map(([key, dir]) => `${key} ${dir.toUpperCase()}`);
      if (orderClauses.length > 0) {
        sql += ` ORDER BY ${orderClauses.join(', ')}`;
      }
    }

    if (query?.limit) sql += ` LIMIT ${query.limit}`;
    if (query?.offset) sql += ` OFFSET ${query.offset}`;

    return { sql, params };
  }

  async update<T extends keyof SupabaseDatabase['public']['Tables']>(
    table: T,
    data: Partial<SupabaseDatabase['public']['Tables'][T]['Update']>,
    where: Record<string, any>
  ): Promise<SupabaseDatabase['public']['Tables'][T]['Row']> {
    await this.ensureInitialized();

    const updates = Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key], index) => `${key} = $${index + 1}`);

    const whereClauses = Object.entries(where)
      .filter(([_, value]) => value !== undefined)
      .map(([key], index) => `${key} = $${updates.length + index + 1}`);

    const sql = `
      UPDATE ${table}
      SET ${updates.join(', ')}
      WHERE ${whereClauses.join(' AND ')}
      RETURNING *
    `;

    const values = [
      ...Object.values(data).filter(v => v !== undefined),
      ...Object.values(where).filter(v => v !== undefined)
    ];

    const result = await this.db!.select<SupabaseDatabase['public']['Tables'][T]['Row'][]>(sql, values);
    if (!result?.[0]) throw new Error('Failed to update record');
    return result[0];
  }

  async delete<T extends keyof SupabaseDatabase['public']['Tables']>(
    table: T,
    where: Record<string, any>
  ): Promise<void> {
    await this.ensureInitialized();

    const whereClauses = Object.entries(where)
      .filter(([_, value]) => value !== undefined)
      .map(([key], index) => `${key} = $${index + 1}`);

    const sql = `DELETE FROM ${table} WHERE ${whereClauses.join(' AND ')}`;
    const values = Object.values(where).filter(v => v !== undefined);

    await this.db!.execute(sql, values);
  }

  async transaction<T>(operations: () => Promise<T>): Promise<T> {
    await this.ensureInitialized();
    await this.db!.execute('BEGIN');
    
    try {
      const result = await operations();
      await this.db!.execute('COMMIT');
      return result;
    } catch (error) {
      await this.db!.execute('ROLLBACK');
      throw error;
    }
  }

  async sync(): Promise<void> {
    await this.ensureInitialized();
    // Sync implementation will be added later
  }

  async getPendingChanges(): Promise<SyncQueueItem[]> {
    await this.ensureInitialized();
    try {
      interface SyncQueueRow {
        id: string;
        operation: string;
        table_name: string;
        data: string;
        timestamp: number;
        status: string;
        error?: string;
      }

      const result = await this.db!.select<SyncQueueRow[]>(
        `SELECT * FROM sync_queue 
         WHERE status = 'pending'
         ORDER BY timestamp ASC`
      );

      return result.map(row => {
        const syncItem: SyncQueueItem = {
          id: row.id,
          operation: row.operation as SyncQueueItem['operation'],
          table: row.table_name as keyof SupabaseDatabase['public']['Tables'],
          data: JSON.parse(row.data),
          timestamp: row.timestamp,
          status: row.status as SyncQueueItem['status'],
          error: row.error
        };
        return syncItem;
      });
    } catch (error) {
      console.error('Failed to get pending changes:', error);
      return [];
    }
  }
}
