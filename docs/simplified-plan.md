# Simplified Tauri Migration Plan - Local First
## React/Vite + Supabase → Tauri Desktop with Local SQLite

### **Phase 1: Get Your App Running in Tauri (TODAY)** ✅ COMPLETED
**Time: 2-3 hours**

#### 1.1 Quick Tauri Setup ✅
```bash
# In your existing React/Vite project
npm install --save-dev @tauri-apps/cli
npx tauri init
```

#### 1.2 Configure Tauri (Just the basics) ✅
Updated `src-tauri/tauri.conf.json` with correct app name and paths.

#### 1.3 Update package.json ✅
Added Tauri scripts:
```json
{
  "scripts": {
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

#### 1.4 Test It Works ⚠️  COMPLETED
- Tauri setup completed
- Need to fix port configuration (Vite runs on 8081, Tauri expects 5173)
- **Next step**: Update Tauri config to use correct port

**Goal: Your existing app opens in a desktop window**

---

### **Phase 2: Replace Supabase Calls with Mock Data (DAY 1-2)** 🔄 IN PROGRESS
**Time: 3-4 hours**

#### 2.1 Create Local Data Layer ✅ COMPLETED
Created `src/lib/local-data.ts` with comprehensive mock data structure:
- ✅ Mock clients with full data structure
- ✅ Mock sales with items and calculations
- ✅ Mock invoices with proper relationships
- ✅ Mock payments and bulk payments
- ✅ Mock credit transactions with balance updates
- ✅ Mock settings with company profile
- ✅ Full CRUD operations for all entities

#### 2.2 Replace Supabase Imports 🔄 IN PROGRESS
**Completed:**
- ✅ Created mock data layer with same API interface
- ✅ Updated clientService.ts to use localDB
- ✅ Updated saleService.ts to use localDB

**Next steps:**
- ⏳ Update remaining services (invoiceService, paymentService, settingsService)
- ⏳ Test all functionality with mock data
- ⏳ Verify no Supabase dependencies remain

**Goal: App works with mock data, no Supabase dependency**

---

### **Phase 3: Add Real SQLite (DAY 2-3)**
**Time: 4-5 hours**

#### 3.1 Add SQLite Dependencies
Add to `src-tauri/Cargo.toml`:
```toml
[dependencies]
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "sqlite", "chrono", "uuid"] }
tokio = { version = "1", features = ["full"] }
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1.0", features = ["v4", "serde"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
anyhow = "1.0"
```

#### 3.2 Create Simple Database Schema
Create `src-tauri/migrations/001_basic.sql`:
```sql
-- Keep it simple first - match your current Supabase structure
CREATE TABLE clients (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    client_id TEXT NOT NULL,
    date DATE NOT NULL,
    total_amount_ht REAL NOT NULL,
    payment_method TEXT,
    is_invoiced BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Add more tables as needed to match your current structure
```

#### 3.3 Basic Tauri Commands
Create `src-tauri/src/commands/mod.rs`:
```rust
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;

#[derive(Debug, Serialize, Deserialize)]
pub struct Client {
    pub id: String,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
}

#[tauri::command]
pub async fn get_clients(pool: tauri::State<'_, SqlitePool>) -> Result<Vec<Client>, String> {
    let clients = sqlx::query_as!(
        Client,
        "SELECT id, name, email, phone, address FROM clients ORDER BY name"
    )
    .fetch_all(&**pool)
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(clients)
}

#[tauri::command]
pub async fn create_client(
    client: Client,
    pool: tauri::State<'_, SqlitePool>
) -> Result<Client, String> {
    let id = uuid::Uuid::new_v4().to_string();
    
    sqlx::query!(
        "INSERT INTO clients (id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)",
        id, client.name, client.email, client.phone, client.address
    )
    .execute(&**pool)
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(Client {
        id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
    })
}

// Add more CRUD commands as needed
```

#### 3.4 Update main.rs
```rust
mod commands;

use sqlx::SqlitePool;
use std::fs;

#[tokio::main]
async fn main() {
    // Create database directory
    let app_dir = dirs::config_dir().unwrap().join("coil-commerce-control");
    fs::create_dir_all(&app_dir).expect("Failed to create app directory");
    
    // Setup database
    let database_url = format!("sqlite:{}/database.db", app_dir.display());
    let pool = SqlitePool::connect(&database_url).await
        .expect("Failed to connect to database");
    
    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await
        .expect("Failed to run migrations");

    tauri::Builder::default()
        .manage(pool)
        .invoke_handler(tauri::generate_handler![
            commands::get_clients,
            commands::create_client,
            // Add more commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### 3.5 Update Frontend to Use Tauri
Replace your mock data with Tauri calls:
```typescript
// src/lib/tauri-api.ts
import { invoke } from '@tauri-apps/api/tauri'

export const db = {
  clients: {
    getAll: () => invoke('get_clients'),
    create: (client) => invoke('create_client', { client }),
    // Add more methods
  }
}
```

**Goal: App uses real SQLite database locally**

---

### **Phase 4: Add Your Product Schema (DAY 3-4)**
**Time: 3-4 hours**

#### 4.1 Add Product Tables
Create `src-tauri/migrations/002_products.sql` with the product schema from your original plan:
```sql
-- Add the corrugated_sheet_items, steel_slitting_strip_items, etc.
-- tables from your original plan
```

#### 4.2 Add Product Commands
Add product CRUD commands to match your needs

#### 4.3 Update Frontend
Add product management UI components

**Goal: Full product management working locally**

---

### **Phase 5: Future - Supabase Backup (LATER)**
**When you're ready:**

#### 5.1 Add Backup Commands
```rust
#[tauri::command]
pub async fn backup_to_supabase() -> Result<(), String> {
    // Export local data and sync to Supabase
}

#[tauri::command]
pub async fn restore_from_supabase() -> Result<(), String> {
    // Import data from Supabase to local
}
```

---

## **Key Differences from Original Plan:**

✅ **What we're doing:**
- Start with existing app in Tauri window
- Replace Supabase with local SQLite step-by-step
- Add product features incrementally
- Keep it simple and working at each step

❌ **What we're NOT doing (yet):**
- Complex offline sync
- Conflict resolution
- Advanced product templates
- Multiple phases at once

This gets you a working desktop app FAST, then you can add features one by one!

## **Current Status:**
- ✅ Phase 1: Tauri setup completed (need port fix)
- ✅ Phase 2: Mock data layer created, services being updated
- ⏳ Phase 3: Ready to start when Phase 2 is complete