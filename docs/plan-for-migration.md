# Tauri Desktop App Migration Plan - Offline-First with Multiple Products Support
## Invoice Management System - Web to Desktop with Offline Capabilities & Product Variety

### **Phase 0: Prerequisites & Environment Setup**
**Estimated Time:** 1-2 days

#### 0.1 Install Required Tools
- [ ] Install Rust (stable channel): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- [ ] Install Node.js (LTS version 18+)
- [ ] Install Tauri CLI: `cargo install tauri-cli`
- [ ] Install system dependencies (platform-specific):
  - **Windows:** Microsoft C++ Build Tools
  - **macOS:** Xcode Command Line Tools
  - **Linux:** `build-essential`, `libwebkit2gtk-4.0-dev`, `libssl-dev`

#### 0.2 Existing Project Analysis
- [ ] Document your current project structure
- [ ] List all existing dependencies in `package.json`
- [ ] Identify current API endpoints/calls that need offline support
- [ ] Note web-specific features that need desktop adaptation
- [ ] **NEW:** Map data flows for offline synchronization
- [ ] **NEW:** Identify conflict resolution requirements
- [ ] **NEW:** Analyze current product types and their specific attributes
- [ ] **NEW:** Document pricing models per product type
- [ ] Backup your current working web app

---

### **Phase 1: Tauri Integration with Existing React App**
**Estimated Time:** 1 day

#### 1.1 Add Tauri to Existing Project
```bash
# From your existing React/Vite project root
npm install --save-dev @tauri-apps/cli
npx tauri init
```

#### 1.2 Configure Tauri for Vite
- [ ] Update `src-tauri/tauri.conf.json`:
  - Set `build.distDir` to `"../dist"`
  - Set `build.devPath` to `"http://localhost:5173"` (Vite default port)
  - Set app name: "Invoice Manager"
  - Configure window settings (min size: 1200x800, default size)
  - Set app identifier: `com.yourcompany.invoicemanager`
  - **NEW:** Enable file system access for local database
  - **NEW:** Configure permissions for network access (for sync)
- [ ] Configure app icons (generate icon set)
- [ ] Set up window management settings

#### 1.3 Update Package.json Scripts
```json
{
  "scripts": {
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

#### 1.4 Initial Build Test
- [ ] Run `npm run tauri:dev` to ensure Tauri works with your existing app
- [ ] Fix any immediate compilation errors
- [ ] Verify window opens and displays your current React app

---

### **Phase 2: Enhanced Offline Database Layer - SQLite with Multiple Products**
**Estimated Time:** 4-5 days (Extended for offline features + product complexity)

#### 2.1 Add Database Dependencies
```toml
# Add to src-tauri/Cargo.toml
[dependencies]
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "sqlite", "chrono", "uuid"] }
tokio = { version = "1", features = ["full"] }
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1.0", features = ["v4", "serde"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
anyhow = "1.0"
# NEW: Offline-specific dependencies
reqwest = { version = "0.11", features = ["json"] }
tokio-cron-scheduler = "0.9"
# NEW: Additional dependencies for product calculations
rust_decimal = { version = "1.29", features = ["serde-json"] }
```

#### 2.2 Create Enhanced Database Schema for Multiple Products & Offline Support
- [ ] Create `src-tauri/migrations/001_initial_offline_products.sql`:
```sql
-- Clients table (simplified)
CREATE TABLE clients (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME NULL
);

-- Sales table (simplified)
CREATE TABLE sales (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    client_id TEXT NOT NULL,
    date DATE NOT NULL,
    total_amount_ht REAL NOT NULL,
    payment_method TEXT,
    is_invoiced BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- NEW: Base sale items table with common fields
CREATE TABLE sale_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    sale_id TEXT NOT NULL,
    description TEXT NOT NULL,
    product_type TEXT NOT NULL CHECK (product_type IN ('corrugated_sheet', 'steel_slitting_strip', 'steel_slitting_sheet')),
    quantity REAL NOT NULL,
    price_per_ton REAL NOT NULL,
    total_amount REAL NOT NULL,
    thickness REAL NOT NULL,  -- Common field for all types
    weight REAL NOT NULL,     -- Common field for all types
    item_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Offline sync fields
    server_id TEXT NULL,
    last_synced DATETIME NULL,
    sync_status TEXT DEFAULT 'pending',
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME NULL,
    version INTEGER DEFAULT 1,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- Product-specific details tables
CREATE TABLE corrugated_sheet_items (
    sale_item_id TEXT PRIMARY KEY,
    sheet_count INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE CASCADE
);

CREATE TABLE steel_slitting_strip_items (
    sale_item_id TEXT PRIMARY KEY,
    strip_width REAL NOT NULL,
    strip_count INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE CASCADE
);

CREATE TABLE steel_slitting_sheet_items (
    sale_item_id TEXT PRIMARY KEY,
    sheet_width REAL NOT NULL,
    sheet_length REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE CASCADE
);

-- NEW: Specialized product detail tables
CREATE TABLE coil_sale_items (
    sale_item_id TEXT PRIMARY KEY,
    thickness REAL NOT NULL,
    width REAL NOT NULL,
    weight REAL NOT NULL,
    top_coat_ral TEXT,
    back_coat_ral TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE CASCADE
);

CREATE TABLE sheet_sale_items (
    sale_item_id TEXT PRIMARY KEY,
    length REAL NOT NULL,
    width REAL NOT NULL,
    thickness REAL NOT NULL,
    ral_color TEXT,
    sheet_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE CASCADE
);

CREATE TABLE slitting_sale_items (
    sale_item_id TEXT PRIMARY KEY,
    original_width REAL NOT NULL,
    target_width REAL NOT NULL,
    thickness REAL NOT NULL,
    meters_length REAL NOT NULL,
    strips_count INTEGER NOT NULL,
    waste_percentage REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE CASCADE
);

-- NEW: Custom product table for flexible additional products
CREATE TABLE custom_sale_items (
    sale_item_id TEXT PRIMARY KEY,
    custom_attributes TEXT, -- JSON for flexible attributes
    unit_type TEXT DEFAULT 'ton', -- ton, piece, meter, etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE CASCADE
);

-- NEW: Product templates for quick creation
CREATE TABLE product_templates (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    product_type TEXT NOT NULL CHECK (product_type IN ('coil', 'sheet', 'slitting', 'custom')),
    description_template TEXT,
    default_price REAL,
    template_data TEXT, -- JSON for product-specific defaults
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Offline sync fields
    server_id TEXT NULL,
    last_synced DATETIME NULL,
    sync_status TEXT DEFAULT 'pending',
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Enhanced invoices table
CREATE TABLE invoices (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    invoice_number TEXT NOT NULL UNIQUE,
    client_id TEXT NOT NULL,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount_ht REAL NOT NULL,
    total_amount_ttc REAL NOT NULL,
    tax_rate REAL NOT NULL DEFAULT 0.19,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at DATETIME NULL,
    payment_method TEXT,
    sales_ids TEXT, -- JSON array of sale IDs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Offline sync fields
    server_id TEXT NULL,
    last_synced DATETIME NULL,
    sync_status TEXT DEFAULT 'pending',
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME NULL,
    version INTEGER DEFAULT 1,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Invoice settings table
CREATE TABLE invoice_settings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    default_prefix TEXT NOT NULL DEFAULT 'INV',
    next_number INTEGER NOT NULL DEFAULT 1,
    payment_terms INTEGER NOT NULL DEFAULT 30,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO invoice_settings (default_prefix, next_number, payment_terms) 
VALUES ('INV', 1, 30);

-- NEW: Indexes for performance
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_type ON sale_items(product_type);
CREATE INDEX idx_sale_items_sync_status ON sale_items(sync_status);
CREATE INDEX idx_clients_sync_status ON clients(sync_status);
CREATE INDEX idx_sales_sync_status ON sales(sync_status);
CREATE INDEX idx_invoices_sync_status ON invoices(sync_status);

-- NEW: Insert default product templates
INSERT INTO product_templates (name, product_type, description_template, template_data) VALUES
('Standard Coil', 'coil', 'Steel Coil - {thickness}mm x {width}mm', '{"default_thickness": 0.5, "default_width": 1000}'),
('Standard Sheet', 'sheet', 'Steel Sheet - {length}mm x {width}mm x {thickness}mm', '{"default_length": 2000, "default_width": 1000, "default_thickness": 0.5}'),
('Standard Slitting', 'slitting', 'Slitting Service - {original_width}mm to {target_width}mm', '{"default_waste": 5.0}');
```

#### 2.3 Enhanced Database Connection Module
- [ ] Create `src-tauri/src/database/mod.rs`
- [ ] Create `src-tauri/src/database/connection.rs`
- [ ] Create `src-tauri/src/database/migrations.rs`
- [ ] **NEW:** Create `src-tauri/src/database/sync_manager.rs`
- [ ] **NEW:** Create `src-tauri/src/database/conflict_resolver.rs`
- [ ] Implement connection pooling and migration runner

#### 2.4 Enhanced Database Models with Product Support
- [ ] Create `src-tauri/src/models/mod.rs`
- [ ] Create `src-tauri/src/models/client.rs`
- [ ] Create `src-tauri/src/models/sale.rs`
- [ ] **NEW:** Create `src-tauri/src/models/sale_item.rs`:
```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "product_type")]
pub enum SaleItem {
    CorrugatedSheet {
        id: String,
        sale_id: String,
        description: String,
        quantity: f64,
        price_per_ton: f64,
        total_amount: f64,
        thickness: f64,
        weight: f64,
        sheet_count: i32,
        // ... sync fields
    },
    SteelSlittingStrip {
        id: String,
        sale_id: String,
        description: String,
        quantity: f64,
        price_per_ton: f64,
        total_amount: f64,
        thickness: f64,
        weight: f64,
        strip_width: f64,
        strip_count: i32,
        // ... sync fields
    },
    SteelSlittingSheet {
        id: String,
        sale_id: String,
        description: String,
        quantity: f64,
        price_per_ton: f64,
        total_amount: f64,
        thickness: f64,
        weight: f64,
        sheet_width: f64,
        sheet_length: f64,
        // ... sync fields
    }
}

// Validation traits for each product type
pub trait ProductValidation {
    fn validate(&self) -> Result<(), AppError>;
    fn calculate_weight(&self) -> f64;
    fn calculate_total_amount(&self) -> f64;
}

impl ProductValidation for SaleItem {
    fn validate(&self) -> Result<(), AppError> {
        match self {
            SaleItem::CorrugatedSheet { thickness, weight, sheet_count, .. } => {
                if *thickness <= 0.0 {
                    return Err(AppError::ValidationError("Thickness must be positive".into()));
                }
                if *weight <= 0.0 {
                    return Err(AppError::ValidationError("Weight must be positive".into()));
                }
                if *sheet_count <= 0 {
                    return Err(AppError::ValidationError("Sheet count must be positive".into()));
                }
                Ok(())
            },
            SaleItem::SteelSlittingStrip { thickness, weight, strip_width, strip_count, .. } => {
                if *thickness <= 0.0 {
                    return Err(AppError::ValidationError("Thickness must be positive".into()));
                }
                if *weight <= 0.0 {
                    return Err(AppError::ValidationError("Weight must be positive".into()));
                }
                if *strip_width <= 0.0 {
                    return Err(AppError::ValidationError("Strip width must be positive".into()));
                }
                if *strip_count <= 0 {
                    return Err(AppError::ValidationError("Strip count must be positive".into()));
                }
                Ok(())
            },
            SaleItem::SteelSlittingSheet { thickness, weight, sheet_width, sheet_length, .. } => {
                if *thickness <= 0.0 {
                    return Err(AppError::ValidationError("Thickness must be positive".into()));
                }
                if *weight <= 0.0 {
                    return Err(AppError::ValidationError("Weight must be positive".into()));
                }
                if *sheet_width <= 0.0 {
                    return Err(AppError::ValidationError("Sheet width must be positive".into()));
                }
                if *sheet_length <= 0.0 {
                    return Err(AppError::ValidationError("Sheet length must be positive".into()));
                }
                Ok(())
            }
        }
    }

    fn calculate_weight(&self) -> f64 {
        match self {
            SaleItem::CorrugatedSheet { thickness, sheet_count, .. } => {
                // Implement corrugated sheet weight calculation
                thickness * *sheet_count as f64 * CORRUGATED_SHEET_DENSITY
            },
            SaleItem::SteelSlittingStrip { thickness, strip_width, strip_count, .. } => {
                // Implement steel strip weight calculation
                thickness * strip_width * *strip_count as f64 * STEEL_DENSITY
            },
            SaleItem::SteelSlittingSheet { thickness, sheet_width, sheet_length, .. } => {
                // Implement steel sheet weight calculation
                thickness * sheet_width * sheet_length * STEEL_DENSITY
            }
        }
    }

    fn calculate_total_amount(&self) -> f64 {
        match self {
            SaleItem::CorrugatedSheet { weight, price_per_ton, .. } |
            SaleItem::SteelSlittingStrip { weight, price_per_ton, .. } |
            SaleItem::SteelSlittingSheet { weight, price_per_ton, .. } => {
                weight * price_per_ton
            }
        }
    }
}
```
- [ ] Create `src-tauri/src/models/invoice.rs`
- [ ] **NEW:** Create `src-tauri/src/models/product_template.rs`
- [ ] **NEW:** Create `SyncOperation`, `SyncMetadata` models
- [ ] Add validation methods for each product type
- [ ] Add conflict resolution methods

---

### **Phase 3: Enhanced Tauri Commands with Product Management**
**Estimated Time:** 5-6 days (Extended for product functionality)

#### 3.1 Enhanced Client Management Commands
- [ ] Create `src-tauri/src/commands/clients.rs`:
  - `get_clients()` - List all clients (exclude deleted)
  - `get_client(id)` - Get single client
  - `create_client(client_data)` - Create new client + log sync operation
  - `update_client(id, client_data)` - Update client + log sync operation
  - `delete_client(id)` - Soft delete client + log sync operation
  - `get_clients_pending_sync()` - Get clients needing sync

#### 3.2 Enhanced Sales Management Commands
- [ ] Create `src-tauri/src/commands/sales.rs`:
  - `get_sales()` - List all sales (exclude deleted)
  - `get_sales_by_client(client_id)` - Get sales for specific client
  - `get_uninvoiced_sales(client_id)` - Get uninvoiced sales
  - `create_sale(sale_data)` - Create new sale + log sync operation
  - `update_sale(id, sale_data)` - Update sale + log sync operation
  - `delete_sale(id)` - Soft delete sale + log sync operation
  - **NEW:** `add_sale_item(sale_id, item_data)` - Add product to sale
  - **NEW:** `update_sale_item(item_id, item_data)` - Update product in sale
  - **NEW:** `delete_sale_item(item_id)` - Remove product from sale
  - **NEW:** `get_sale_items(sale_id)` - Get all products in sale
  - **NEW:** `reorder_sale_items(sale_id, item_orders)` - Reorder products
  - **NEW:** `duplicate_sale_item(item_id)` - Duplicate a product
  - `get_sales_pending_sync()` - Get sales needing sync

#### 3.3 NEW: Product Template Management Commands
- [ ] Create `src-tauri/src/commands/product_templates.rs`:
  - `get_product_templates()` - List all active templates
  - `get_templates_by_type(product_type)` - Get templates for specific product type
  - `create_product_template(template_data)` - Create new template
  - `update_product_template(id, template_data)` - Update template
  - `delete_product_template(id)` - Soft delete template
  - `apply_template_to_sale(template_id, sale_id)` - Quick add from template

#### 3.4 NEW: Product Calculation Commands
- [ ] Create `src-tauri/src/commands/calculations.rs`:
  - `calculate_coil_weight(thickness, width, length)` - Calculate coil weight
  - `calculate_sheet_weight(length, width, thickness, count)` - Calculate sheet weight
  - `calculate_slitting_yield(original_width, target_width, waste_pct)` - Calculate slitting efficiency
  - `calculate_price_breakdown(sale_id)` - Get detailed price breakdown
  - `estimate_delivery_weight(sale_id)` - Estimate total delivery weight
  - `calculate_material_usage(sale_id)` - Calculate material consumption

#### 3.5 Enhanced Invoice Management Commands
- [ ] Create `src-tauri/src/commands/invoices.rs`:
  - `get_invoices()` - List all invoices (exclude deleted)
  - `get_invoice(id)` - Get single invoice
  - `get_invoice_with_items(id)` - Get invoice with detailed item breakdown
  - `create_invoice(invoice_data)` - Create new invoice + log sync operation
  - `update_invoice(id, invoice_data)` - Update invoice + log sync operation
  - `delete_invoice(id)` - Soft delete invoice + log sync operation
  - `generate_invoice_number()` - Generate next invoice number
  - **NEW:** `generate_invoice_pdf_with_items(id)` - Generate PDF with product details
  - `get_invoices_pending_sync()` - Get invoices needing sync

#### 3.6 Sync Management Commands
- [ ] Create `src-tauri/src/commands/sync.rs`:
  - `get_sync_status()` - Get overall sync status
  - `trigger_manual_sync()` - Force immediate sync
  - `get_pending_operations()` - Get operations waiting to sync
  - `resolve_conflict(operation_id, resolution)` - Resolve sync conflicts
  - `configure_sync(config)` - Update sync settings
  - `get_sync_history()` - Get sync operation history
  - `retry_failed_operations()` - Retry failed sync operations

#### 3.7 Connection Management Commands
- [ ] Create `src-tauri/src/commands/connection.rs`:
  - `check_connection_status()` - Test internet connectivity
  - `test_server_connection()` - Test API server availability
  - `get_connection_info()` - Get current connection details

#### 3.8 Enhanced Settings Management Commands
- [ ] Create `src-tauri/src/commands/settings.rs`:
  - `get_invoice_settings()` - Get current settings
  - `update_invoice_settings(settings)` - Update settings
  - `get_sync_settings()` - Get sync configuration
  - `update_sync_settings(settings)` - Update sync configuration
  - **NEW:** `get_product_settings()` - Get product-specific settings
  - **NEW:** `update_product_settings(settings)` - Update product settings

#### 3.9 Register All Commands
- [ ] Update `src-tauri/src/main.rs` to register all commands
- [ ] Add proper error handling and logging
- [ ] Set up background sync scheduler
- [ ] Test each command individually

#### 3.10 Add Backup Commands
- [ ] Create `src-tauri/src/commands/backup.rs`:
```rust
#[tauri::command]
pub async fn export_database(path: String) -> Result<(), AppError> {
    // Export SQLite database to specified path
    // Include all tables and data
}

#[tauri::command]
pub async fn import_database(path: String) -> Result<(), AppError> {
    // Import SQLite database from specified path
    // Validate data integrity
    // Handle conflicts with existing data
}
```

---

### **Phase 4: Enhanced Frontend with Product Management UI**
**Estimated Time:** 4-5 days (Extended for product interfaces)

#### 4.1 Add Enhanced Frontend Dependencies
```bash
npm install @tauri-apps/api
npm install react-query @tanstack/react-query
npm install zustand
npm install react-hook-form
npm install @hookform/resolvers yup
npm install react-dnd react-dnd-html5-backend  # For drag-and-drop reordering
npm install react-select  # For better product type selection
```

#### 4.2 Create Enhanced Tauri API Layer
- [ ] Create `src/lib/tauri-api.ts`:
  - Wrapper functions for all Tauri commands
  - Type-safe interfaces matching Rust structs
  - Error handling and loading states
  - Offline detection and queuing logic
  - Automatic retry mechanisms
  - **NEW:** Product-specific API functions
  - **NEW:** Template management functions
  - **NEW:** Calculation helpers

#### 4.3 Enhanced State Management
- [ ] Create `src/stores/offline-store.ts` (using Zustand):
  - Connection status tracking
  - Pending operations queue
  - Sync status management
  - Conflict resolution state
  - Last sync timestamps
- [ ] **NEW:** Create `src/stores/product-store.ts`:
  - Current sale items state
  - Product templates cache
  - Calculation results cache
  - UI state (expanded items, edit modes)

#### 4.4 Enhanced Context Providers
- [ ] Modify existing `AppContext` to use Tauri commands
- [ ] Create `OfflineContext` for sync management
- [ ] Create `ConnectionContext` for network status
- [ ] Update `AppSettingsContext` for local settings
- [ ] Update `InvoiceSettingsContext` with sync capabilities
- [ ] **NEW:** Create `ProductContext` for product management
- [ ] Keep existing `LanguageContext` as-is

#### 4.5 NEW: Product Management UI Components
- [ ] Create `src/components/products/ProductSelector.tsx`:
  - Product type selection (coil, sheet, slitting, custom)
  - Template selection dropdown
  - Quick add buttons
- [ ] Create `src/components/products/ProductFormFields.tsx`:
  - Dynamic form fields based on product type
  - Real-time calculations
  - Validation for each product type
- [ ] Create `src/components/products/CoilForm.tsx`:
  - Thickness, width, weight inputs
  - RAL color selectors
  - Weight calculation preview
- [ ] Create `src/components/products/SheetForm.tsx`:
  - Length, width, thickness inputs
  - Sheet count selector
  - Total area/weight calculations
- [ ] Create `src/components/products/SlittingForm.tsx`:
  - Original/target width inputs
  - Strips count calculator
  - Waste percentage input
  - Efficiency indicators
- [ ] Create `src/components/products/CustomForm.tsx`:
  - Dynamic attribute builder
  - Unit type selector
  - Flexible pricing options
- [ ] Create `src/components/products/ProductItemCard.tsx`:
  - Display product details
  - Edit/delete actions
  - Drag handle for reordering
  - Price breakdown view
- [ ] Create `src/components/products/ProductList.tsx`:
  - Drag-and-drop reordering
  - Bulk actions (duplicate, delete)
  - Total calculations
  - Expandable details view

#### 4.6 NEW: Product Template Management
- [ ] Create `src/components/templates/TemplateManager.tsx`:
  - Template CRUD interface
  - Template preview
  - Apply to current sale
- [ ] Create `src/components/templates/TemplateForm.tsx`:
  - Template creation/editing
  - Default values setup
  - Product type configuration

#### 4.7 Enhanced Offline UI Components
- [ ] Update `src/components/OfflineIndicator.tsx`:
  - Connection status display
  - Sync progress indicator
  - Pending changes counter
  - Product sync status
- [ ] Create `src/components/SyncManager.tsx`:
  - Manual sync trigger
  - Sync history display
  - Conflict resolution interface
- [ ] Create `src/components/ConflictResolver.tsx`:
  - Side-by-side conflict comparison
  - Resolution selection interface
  - Product-specific conflict handling

#### 4.8 Enhanced Existing Components
- [ ] Update sales forms to include product management
- [ ] Add product breakdown to invoice displays
- [ ] Add pending sync indicators to product rows
- [ ] Implement optimistic updates with rollback
- [ ] Add offline-first error handling
- [ ] Update dashboard with product analytics

#### 4.9 Add Backup UI Components
- [ ] Create `src/components/backup/BackupManager.tsx`
- [ ] Create `src/components/backup/BackupHistory.tsx`

---

### **Phase 5: Backup/Restore**
**Estimated Time:** 4-5 days

#### 5.1 Add Backup/Restore Commands
- [ ] Create `src-tauri/src/commands/backup.rs`:
  - `export_database(path: String) -> Result<(), AppError>`
  - `import_database(path: String) -> Result<(), AppError>`

#### 5.2 Add Backup UI Components
- [ ] Create `src/components/backup/BackupManager.tsx`
- [ ] Create `src/components/backup/BackupHistory.tsx`

---

### **Phase 6: Testing & Quality Assurance**
**Estimated Time:** 5-6 days (Extended for product testing)

#### 6.1 Unit Testing
- [ ] Add Rust unit tests for database operations
- [ ] Add Rust unit tests for business logic
- [ ] Add React component testing
- [ ] Add API integration tests
- [ ] Add sync engine unit tests
- [ ] Add conflict resolution tests
- [ ] **NEW:** Product-specific unit tests
- [ ] **NEW:** Calculation accuracy tests
- [ ] **NEW:** Template functionality tests

#### 6.2 Integration Testing
- [ ] Test complete user workflows
- [ ] Test database migrations
- [ ] Test error scenarios
- [ ] Test performance with large datasets
- [ ] Test offline scenarios
- [ ] Test sync operations
- [ ] Test conflict resolution workflows
- [ ] **NEW:** Test multi-product sales workflows
- [ ] **NEW:** Test product template applications
- [ ] **NEW:** Test complex product calculations

#### 6.3 Product-Specific Testing
- [ ] **NEW:** Test each product type thoroughly
- [ ] **NEW:** Test product switching/conversion
- [ ] **NEW:** Test template creation and application
- [ ] **NEW:** Test calculation accuracy for all product types
- [ ] **NEW:** Test product reordering and duplication
- [ ] **NEW:** Test bulk product operations

#### 6.4 Cross-Platform Testing
- [ ] Test on Windows
