use rusqlite::{Connection, Error as SqliteError, Result};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

pub struct DatabaseConnection(pub Mutex<Connection>);

impl DatabaseConnection {
    pub fn new(conn: Connection) -> Self {
        Self(Mutex::new(conn))
    }

    pub fn check_needs_initial_sync(&self) -> Result<bool> {
        let conn = self.0.lock().unwrap();
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM sync_log WHERE sync_type = 'download'",
            [],
            |row| row.get(0),
        )?;
        Ok(count == 0)
    }

    pub fn perform_initial_sync(&self) -> Result<()> {
        let conn = self.0.lock().unwrap();
        
        // For now, just mark as synced
        // TODO: Implement actual Supabase sync
        conn.execute(
            "INSERT OR REPLACE INTO sync_log (id, entity_type, entity_id, sync_type, sync_status)
             VALUES ('initial_sync', 'all', '0', 'download', 'success')",
            [],
        )?;

        Ok(())
    }

    pub fn fetch_pending_sync_items(&self) -> Result<Vec<(String, String, String)>> {
        let conn = self.0.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT table_name, id, operation FROM sync_queue WHERE sync_status = 'pending' ORDER BY created_at ASC"
        )?;
        let items = stmt.query_map([], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?
            ))
        })?;
        
        Ok(items.collect::<Result<Vec<_>>>()?)
    }

    pub fn queue_sync_operation(&self, table_name: &str, id: &str, operation: &str) -> Result<()> {
        let conn = self.0.lock().unwrap();
        conn.execute(
            "INSERT INTO sync_queue (id, table_name, operation, sync_status, created_at)
             VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)",
            [id, table_name, operation],
        )?;
        Ok(())
    }

    pub fn mark_sync_complete(&self, id: &str) -> Result<()> {
        let conn = self.0.lock().unwrap();
        conn.execute(
            "UPDATE sync_queue SET sync_status = 'completed', synced_at = CURRENT_TIMESTAMP
             WHERE id = ?",
            [id],
        )?;
        Ok(())
    }

    pub fn mark_sync_failed(&self, id: &str, error: &str) -> Result<()> {
        let conn = self.0.lock().unwrap();
        conn.execute(
            "UPDATE sync_queue SET sync_status = 'failed', error_message = ?, 
             last_attempt = CURRENT_TIMESTAMP, retry_count = retry_count + 1
             WHERE id = ?",
            [error, id],
        )?;
        Ok(())
    }

    pub fn get_entity_data(&self, table_name: &str, id: &str) -> Result<String> {
        let conn = self.0.lock().unwrap();
        let mut stmt = conn.prepare(
            &format!("SELECT json_object(*) FROM {} WHERE id = ?", table_name)
        )?;
        let data: String = stmt.query_row([id], |row| row.get(0))?;
        Ok(data)
    }
}

pub fn initialize_database(app_handle: &tauri::AppHandle) -> Result<DatabaseConnection> {
    let app_dir = app_handle.path().app_data_dir().expect("Failed to get app dir");
    let db_path: PathBuf = app_dir.join("local.db");
    
    // Create the directory if it doesn't exist
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent).map_err(|_| SqliteError::InvalidPath(parent.to_path_buf()))?;
    }
    
    let conn = Connection::open(&db_path)?;
    
    // Enable foreign key constraints
    conn.execute("PRAGMA foreign_keys = ON", [])?;

    // Create clients table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS clients (
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
            credit_balance REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sync_status TEXT DEFAULT 'new'
        )",
        [],
    )?;

    // Create sales table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            date TEXT NOT NULL,
            total_amount REAL NOT NULL,
            payment_method TEXT NOT NULL,
            payment_status TEXT DEFAULT 'pending',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sync_status TEXT DEFAULT 'new',
            FOREIGN KEY (client_id) REFERENCES clients(id)
        )",
        [],
    )?;

    // Create payments table for tracking payments against sales
    conn.execute(
        "CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            sale_id TEXT NOT NULL,
            amount REAL NOT NULL,
            payment_method TEXT NOT NULL,
            payment_date TIMESTAMP NOT NULL,
            reference_number TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sync_status TEXT DEFAULT 'new',
            FOREIGN KEY (sale_id) REFERENCES sales(id)
        )",
        [],
    )?;

    // Create credit_transactions table for tracking client credit balance changes
    conn.execute(
        "CREATE TABLE IF NOT EXISTS credit_transactions (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            amount REAL NOT NULL,
            transaction_type TEXT NOT NULL, -- 'credit' or 'debit'
            related_sale_id TEXT,
            related_payment_id TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sync_status TEXT DEFAULT 'new',
            FOREIGN KEY (client_id) REFERENCES clients(id),
            FOREIGN KEY (related_sale_id) REFERENCES sales(id),
            FOREIGN KEY (related_payment_id) REFERENCES payments(id)
        )",
        [],
    )?;

    // Create sync_log table for tracking synchronization status
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sync_log (
            id TEXT PRIMARY KEY,
            entity_type TEXT NOT NULL, -- 'client', 'sale', 'payment', 'credit_transaction'
            entity_id TEXT NOT NULL,
            sync_type TEXT NOT NULL, -- 'upload', 'download'
            sync_status TEXT NOT NULL, -- 'success', 'failed'
            error_message TEXT,
            attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Create sync_queue table for tracking pending synchronization operations
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sync_queue (
            id TEXT PRIMARY KEY,
            table_name TEXT NOT NULL,
            operation TEXT NOT NULL, -- 'create', 'update', or 'delete'
            sync_status TEXT NOT NULL, -- 'pending', 'completed', 'failed'
            error_message TEXT,
            retry_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            synced_at TIMESTAMP,
            last_attempt TIMESTAMP
        )",
        [],
    )?;

    // Create indexes for better query performance
    conn.execute("CREATE INDEX IF NOT EXISTS idx_clients_sync_status ON clients(sync_status)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales(client_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sales_sync_status ON sales(sync_status)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON payments(sale_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_payments_sync_status ON payments(sync_status)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_credit_transactions_client_id ON credit_transactions(client_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_credit_transactions_sync_status ON credit_transactions(sync_status)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(sync_status)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at)", [])?;

    // After creating tables, check if we need to perform initial sync
    conn.execute(
        "INSERT OR REPLACE INTO sync_log (id, entity_type, entity_id, sync_type, sync_status)
         SELECT 'initial_sync', 'all', '0', 'download', 'pending'
         WHERE NOT EXISTS (SELECT 1 FROM sync_log)",
        [],
    )?;

    let db_connection = DatabaseConnection::new(conn);

    // Perform initial sync if needed
    if db_connection.check_needs_initial_sync()? {
        db_connection.perform_initial_sync()?;
    }

    Ok(db_connection)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tauri::test::{mock_app_handle, mock_builder};

    #[test]
    fn test_initialize_database() {
        // Create a test app handle
        let app = mock_builder().build().unwrap();
        let app_handle = app.app_handle();
        
        // Initialize the database
        let db = initialize_database(&app_handle).expect("Failed to initialize database");
        let conn = db.0.lock().unwrap();

        // Test that all tables were created
        let tables = [
            "clients",
            "sales",
            "payments",
            "credit_transactions",
            "sync_log",
            "sync_queue",
        ];

        for table in tables.iter() {
            let result: Result<i32> = conn.query_row(
                &format!("SELECT 1 FROM {} LIMIT 1", table),
                [],
                |row| row.get(0),
            );
            assert!(result.is_ok() || matches!(result.unwrap_err(), rusqlite::Error::QueryReturnedNoRows));
        }

        // Clean up the test database
        let db_path = app_handle.path().app_data_dir().map(|p| p.join("local.db"));
        if let Some(db_path) = db_path {
            let _ = std::fs::remove_file(db_path);
        }
    }
}