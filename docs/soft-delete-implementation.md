# Soft Delete Implementation Guide
## Tauri + React + SQLite Sales Manager App

### Overview
Implement soft delete functionality for a **Tauri + React + SQLite desktop app** managing invoices, sales, and payments. The app is **offline-first** with no sync mechanism.

**Entities to implement soft delete:**
- `invoices`
- `sales` 
- `payments`

---

## 1. Database Layer (SQLite)

### 1.1 Schema Updates
- [x] Add `is_deleted` and `deleted_at` columns to all tables

### 1.2 Performance Indexes
- [x] Create indexes for efficient querying

### 1.3 Migration Strategy
- [x] Create a migration script or use your existing migration system
- [x] Ensure backwards compatibility with existing data
- [x] Test migration on a backup database first
- [x] Verify existing data integrity

---

## 2. Rust Backend (Tauri Commands)

### 2.1 Update Existing Query Commands
- [x] Modify all existing `get_*` commands to exclude soft-deleted records

### 2.2 Soft Delete Commands
- [x] Implement soft delete functionality for all entities

### 2.3 Restore Commands (Optional)
- [x] Add restore functionality to undo soft deletions

### 2.4 Archive Query Commands
- [x] Add commands to fetch soft-deleted records

---

## 3. TypeScript Frontend

### 3.1 Type Definitions
- [x] Update interface definitions

### 3.2 API Functions
- [x] Update Tauri invoke functions

### 3.3 UI Components
- [x] Update existing delete buttons to use soft delete
- [x] Implement archive/trash view component for invoices and sales
- [x] Add restore functionality to UI for invoices and sales
- [x] Update state management to handle soft deletes
- [x] Test user workflows for invoices and sales
- [x] Implement archive/trash view and restore for payments

---

## 4. Implementation Checklist

### Database
- [x] Add `is_deleted` and `deleted_at` columns to all tables
- [x] Create performance indexes on `is_deleted` columns
- [x] Test migration on backup database
- [x] Verify existing data integrity

### Backend
- [x] Update all existing query commands to filter `is_deleted = FALSE`
- [x] Implement soft delete commands for all entities
- [x] Add restore commands (optional)
- [x] Add archive query commands
- [x] Update Tauri command exports
- [x] Test all commands with sample data

### Frontend
- [x] Update TypeScript interfaces
- [x] Create soft delete API functions
- [x] Update existing delete buttons to use soft delete
- [x] Implement archive/trash view component for invoices and sales
- [x] Add restore functionality to UI for invoices and sales
- [x] Update state management to handle soft deletes
- [x] Test user workflows for invoices and sales
- [x] Implement archive/trash view and restore for payments

### Testing
- [ ] Unit tests for soft delete commands
- [ ] Integration tests for complete delete/restore flow
- [ ] UI testing for delete and restore actions
- [ ] Performance testing with large datasets

---

## 5. Best Practices & Considerations

### Performance
- Always use indexes on `is_deleted` columns
- Consider pagination for archive views with large datasets
- Monitor query performance after implementation

### User Experience
- Provide clear visual feedback for delete actions
- Consider undo functionality with toast notifications
- Implement confirmation dialogs for destructive actions

### Data Management
- Plan for eventual hard deletion of very old soft-deleted records
- Consider export functionality for archived data
- Implement proper logging for audit trails

### Error Handling
- Handle database errors gracefully
- Provide meaningful error messages to users
- Implement retry mechanisms for failed operations