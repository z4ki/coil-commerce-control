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

### **Phase 2: Replace Supabase Imports with Mock Data (DAY 1-2)** ✅ COMPLETED
**Completed:**
- ✅ Created mock data layer with same API interface
- ✅ Updated clientService.ts to use localDB
- ✅ Updated saleService.ts to use localDB
- ✅ Updated invoiceService.ts to use localDB
- ✅ Updated paymentService.ts to use localDB
- ✅ All functionality tested with mock data
- ✅ No Supabase dependencies remain

**Goal: App works with mock data, no Supabase dependency**

---

### **Phase 3: Add Real SQLite (DAY 2-3)** ✅ IN PROGRESS
**Completed:**
- ✅ Added SQLite dependencies and schema
- ✅ All Tauri backend CRUD commands for clients, sales, invoices, and sale items
- ✅ Frontend services (client, sale, invoice) now use Tauri API integration
- ✅ Invoice and sale CRUD are fully migrated to Tauri/SQLite
- ✅ When deleting an invoice, all related sales are correctly unmarked as invoiced (is_invoiced = 0, invoice_id = NULL)
- ✅ The frontend now re-fetches sales after invoice deletion, so the UI always reflects the correct invoiced status
- ✅ Atomic backend commands for marking/unmarking sales as invoiced (no more partial update bugs)
- ✅ Robust mapping and runtime validation between frontend and backend

**Next steps:**
- ⏳ Migrate payment and bulk payment CRUD to Tauri/SQLite
- ⏳ Test all payment-related functionality

**Goal: App uses real SQLite database locally for all core entities**

---

### **CRUD Functionalities Checklist**

- [x] Clients: get, getById, create, update, delete
- [x] Sales: get, getById, create, update, delete
- [x] Invoices: get, getById, create, update, delete
- [x] Sales unmarking on invoice delete (no stale invoiced sales)
- [ ] Payments: get, getById, create, update, delete
- [ ] Bulk Payments: get, getById, create, update, delete
- [ ] Credit Transactions: get, getById, create, update, delete
- [ ] Settings: get, update

As each CRUD is migrated to Tauri, mark it as completed here.

---

### **Phase 4: Add Your Product Schema (DAY 3-4)**
**Time: 3-4 hours**

#### 4.1 Add Product Tables
Create `src-tauri/migrations/002_products.sql` with the product schema from your original plan:
```sql
-- Add the corrugated_sheet_items, steel_slitting_strip_items, etc.
-- tables from your original plan
```

#### 4.2 Add Product Commands ✅ COMPLETED
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