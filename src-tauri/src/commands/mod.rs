use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use sqlx::Row;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use serde_json;
use serde_json::Value;
use chrono::NaiveDateTime;
use std::env;
use std::fs;
use std::path::Path;
use sqlx::Connection;
use dirs;
use tokio::sync::oneshot;
use tauri_plugin_dialog::DialogExt;
use std::path::PathBuf;



// Client structs
#[derive(Debug, Serialize, Deserialize)]
pub struct Client {
    pub id: String,
    pub name: String,
    pub company: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub nif: Option<String>,
    pub nis: Option<String>,
    pub rc: Option<String>,
    pub ai: Option<String>,
    pub rib: Option<String>,
    pub credit_balance: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateClientRequest {
    pub name: String,
    pub company: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub nif: Option<String>,
    pub nis: Option<String>,
    pub rc: Option<String>,
    pub ai: Option<String>,
    pub rib: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateClientRequest {
    pub name: Option<String>,
    pub company: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub nif: Option<String>,
    pub nis: Option<String>,
    pub rc: Option<String>,
    pub ai: Option<String>,
    pub rib: Option<String>,
}

// Sale structs
#[derive(Debug, Serialize, Deserialize)]
pub struct SaleItem {
    pub id: String,
    pub sale_id: String,
    pub description: String,
    pub coil_ref: Option<String>,
    pub coil_thickness: Option<f64>,
    pub coil_width: Option<f64>,
    pub top_coat_ral: Option<String>,
    pub back_coat_ral: Option<String>,
    pub coil_weight: Option<f64>,
    pub quantity: f64,
    pub price_per_ton: f64,
    pub total_amount: f64,
    pub product_type: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Sale {
    pub id: String,
    pub client_id: String,
    pub date: DateTime<Utc>,
    pub total_amount: f64,
    pub total_amount_ttc: f64,
    pub is_invoiced: bool,
    pub invoice_id: Option<String>,
    pub notes: Option<String>,
    pub payment_method: Option<String>,
    pub transportation_fee: Option<f64>,
    pub tax_rate: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
    pub is_paid: bool,
    pub paid_at: Option<DateTime<Utc>>,
    pub items: Vec<SaleItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSaleRequest {
    pub client_id: String,
    pub date: DateTime<Utc>,
    pub total_amount: f64,
    pub total_amount_ttc: f64,
    pub is_invoiced: bool,
    pub invoice_id: Option<String>,
    pub notes: Option<String>,
    pub payment_method: Option<String>,
    pub transportation_fee: Option<f64>,
    pub tax_rate: f64,
    pub is_paid: Option<bool>,
    pub paid_at: Option<DateTime<Utc>>,
    pub items: Vec<CreateSaleItemRequest>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSaleItemRequest {
    pub description: String,
    pub coil_ref: Option<String>,
    pub coil_thickness: Option<f64>,
    pub coil_width: Option<f64>,
    pub top_coat_ral: Option<String>,
    pub back_coat_ral: Option<String>,
    pub coil_weight: Option<f64>,
    pub quantity: f64,
    pub price_per_ton: f64,
    pub total_amount: f64,
    pub product_type: String,
}

// Client commands
#[derive(serde::Serialize, serde::Deserialize)]
pub struct PaginatedClientsResult {
    pub rows: Vec<Client>,
    pub total: i64,
}

#[tauri::command]
pub async fn get_clients(
    page: Option<u32>,
    page_size: Option<u32>,
    pool: tauri::State<'_, SqlitePool>
) -> Result<PaginatedClientsResult, String> {
    let page = page.unwrap_or(1);
    let page_size = page_size.unwrap_or(5);
    let offset = (page - 1) * page_size;
    // Total count
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM clients WHERE 1=1")
        .fetch_one(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    // Paginated rows
    let clients = sqlx::query(
        r#"SELECT id, name, company, email, phone, address, notes, nif, nis, rc, ai, rib, credit_balance, created_at, updated_at FROM clients ORDER BY name LIMIT ? OFFSET ?"#
    )
    .bind(page_size as i64)
    .bind(offset as i64)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    let rows: Vec<Client> = clients
        .into_iter()
        .map(|row| Client {
            id: row.get("id"),
            name: row.get("name"),
            company: row.get("company"),
            email: row.get("email"),
            phone: row.get("phone"),
            address: row.get("address"),
            notes: row.get("notes"),
            nif: row.get("nif"),
            nis: row.get("nis"),
            rc: row.get("rc"),
            ai: row.get("ai"),
            rib: row.get("rib"),
            credit_balance: row.get("credit_balance"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();
    Ok(PaginatedClientsResult { rows, total })
}

#[tauri::command]
pub async fn get_client_by_id(
    id: String,
    pool: tauri::State<'_, SqlitePool>
) -> Result<Option<Client>, String> {
    let client = sqlx::query(
        r#"
        SELECT 
            id, name, company, email, phone, address, notes, nif, nis, rc, ai, rib,
            credit_balance, created_at, updated_at
        FROM clients 
        WHERE id = ?
        "#
    )
    .bind(id)
    .fetch_optional(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    
    let client = client.map(|row| Client {
        id: row.get("id"),
        name: row.get("name"),
        company: row.get("company"),
        email: row.get("email"),
        phone: row.get("phone"),
        address: row.get("address"),
        notes: row.get("notes"),
        nif: row.get("nif"),
        nis: row.get("nis"),
        rc: row.get("rc"),
        ai: row.get("ai"),
        rib: row.get("rib"),
        credit_balance: row.get("credit_balance"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    });
    
    Ok(client)
}

#[tauri::command]
pub async fn create_client(
    client: CreateClientRequest,
    pool: tauri::State<'_, SqlitePool>
) -> Result<Client, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();
    
    sqlx::query(
        r#"
        INSERT INTO clients (
            id, name, company, email, phone, address, notes, nif, nis, rc, ai, rib,
            credit_balance, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, ?, ?)
        "#
    )
    .bind(&id)
    .bind(&client.name)
    .bind(&client.company)
    .bind(&client.email)
    .bind(&client.phone)
    .bind(&client.address)
    .bind(&client.notes)
    .bind(&client.nif)
    .bind(&client.nis)
    .bind(&client.rc)
    .bind(&client.ai)
    .bind(&client.rib)
    .bind(now)
    .bind(now)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    
    // Fetch the created client
    let new_client = get_client_by_id(id, pool).await?
        .ok_or_else(|| "Failed to retrieve created client".to_string())?;
    
    Ok(new_client)
}

#[tauri::command]
pub async fn update_client(
    id: String,
    client: UpdateClientRequest,
    pool: tauri::State<'_, SqlitePool>
) -> Result<Client, String> {
    let now = Utc::now();
    let mut query = String::from("UPDATE clients SET updated_at = ?");
    let mut bind_values: Vec<String> = Vec::new();
    let mut bind_indices: Vec<&str> = Vec::new();

    if let Some(ref name) = client.name { query.push_str(", name = ?"); bind_values.push(name.clone()); bind_indices.push("name"); }
    if let Some(ref company) = client.company { query.push_str(", company = ?"); bind_values.push(company.clone()); bind_indices.push("company"); }
    if let Some(ref email) = client.email { query.push_str(", email = ?"); bind_values.push(email.clone()); bind_indices.push("email"); }
    if let Some(ref phone) = client.phone { query.push_str(", phone = ?"); bind_values.push(phone.clone()); bind_indices.push("phone"); }
    if let Some(ref address) = client.address { query.push_str(", address = ?"); bind_values.push(address.clone()); bind_indices.push("address"); }
    if let Some(ref notes) = client.notes { query.push_str(", notes = ?"); bind_values.push(notes.clone()); bind_indices.push("notes"); }
    if let Some(ref nif) = client.nif { query.push_str(", nif = ?"); bind_values.push(nif.clone()); bind_indices.push("nif"); }
    if let Some(ref nis) = client.nis { query.push_str(", nis = ?"); bind_values.push(nis.clone()); bind_indices.push("nis"); }
    if let Some(ref rc) = client.rc { query.push_str(", rc = ?"); bind_values.push(rc.clone()); bind_indices.push("rc"); }
    if let Some(ref ai) = client.ai { query.push_str(", ai = ?"); bind_values.push(ai.clone()); bind_indices.push("ai"); }
    if let Some(ref rib) = client.rib { query.push_str(", rib = ?"); bind_values.push(rib.clone()); bind_indices.push("rib"); }

    query.push_str(" WHERE id = ?");

    // If only updated_at is being set, return an error
    if bind_values.is_empty() {
        return Err("No fields to update".to_string());
    }

    let mut q = sqlx::query(&query);
    q = q.bind(now);
    for value in &bind_values {
        q = q.bind(value);
    }
    q = q.bind(&id);
    q.execute(&*pool).await.map_err(|e| e.to_string())?;

    // Fetch the updated client
    let updated_client = get_client_by_id(id, pool).await?
        .ok_or_else(|| "Client not found after update".to_string())?;

    Ok(updated_client)
}

#[tauri::command]
pub async fn delete_client(
    id: String,
    pool: tauri::State<'_, SqlitePool>
) -> Result<(), String> {
    sqlx::query("DELETE FROM clients WHERE id = ?")
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    // Insert audit log entry for client deletion
    insert_audit_log(&*pool, "delete", "client", &id, None, Some("Client deleted")).await?;
    Ok(())
}

// Sale commands
#[derive(serde::Serialize, serde::Deserialize)]
pub struct PaginatedSalesResult {
    pub rows: Vec<Sale>,
    pub total: i64,
}

#[tauri::command]
pub async fn get_sales(
    page: Option<u32>,
    page_size: Option<u32>,
    pool: tauri::State<'_, SqlitePool>
) -> Result<PaginatedSalesResult, String> {
    let page = page.unwrap_or(1);
    let page_size = page_size.unwrap_or(5);
    let offset = (page - 1) * page_size;
    // Total count
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM sales WHERE is_deleted = 0 OR is_deleted IS NULL")
        .fetch_one(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    // Paginated sales
    let sales_rows = sqlx::query(
        r#"SELECT * FROM sales WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY date DESC LIMIT ? OFFSET ?"#
    )
    .bind(page_size as i64)
    .bind(offset as i64)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    let mut rows = Vec::new();
    for sale_row in sales_rows {
        let sale_id: String = sale_row.get("id");
        let items_rows = sqlx::query(
            r#"SELECT * FROM sale_items WHERE sale_id = ?"#
        )
        .bind(&sale_id)
        .fetch_all(&*pool)
        .await
        .map_err(|e| e.to_string())?;
        let items = items_rows.into_iter().map(|row| SaleItem {
            id: row.get("id"),
            sale_id: row.get("sale_id"),
            description: row.get("description"),
            coil_ref: row.get("coil_ref"),
            coil_thickness: row.get("coil_thickness"),
            coil_width: row.get("coil_width"),
            top_coat_ral: row.get("top_coat_ral"),
            back_coat_ral: row.get("back_coat_ral"),
            coil_weight: row.get("coil_weight"),
            quantity: row.get("quantity"),
            price_per_ton: row.get("price_per_ton"),
            total_amount: row.get("total_amount"),
            product_type: row.get("product_type"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }).collect();
        rows.push(Sale {
            id: sale_row.get("id"),
            client_id: sale_row.get("client_id"),
            date: sale_row.get("date"),
            total_amount: sale_row.get("total_amount"),
            total_amount_ttc: sale_row.get("total_amount_ttc"),
            is_invoiced: sale_row.get("is_invoiced"),
            invoice_id: sale_row.get("invoice_id"),
            notes: sale_row.get("notes"),
            payment_method: sale_row.get("payment_method"),
            transportation_fee: sale_row.get("transportation_fee"),
            tax_rate: sale_row.get("tax_rate"),
            created_at: sale_row.get("created_at"),
            updated_at: sale_row.get("updated_at"),
            is_paid: sale_row.get("is_paid"),
            paid_at: sale_row.get("paid_at"),
            items,
        });
    }
    Ok(PaginatedSalesResult { rows, total })
}

#[tauri::command]
pub async fn get_sale_by_id(
    id: String,
    pool: tauri::State<'_, SqlitePool>
) -> Result<Option<Sale>, String> {
    let sale_row = sqlx::query(
        r#"SELECT * FROM sales WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)"#
    )
    .bind(&id)
    .fetch_optional(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    if let Some(sale_row) = sale_row {
        let items_rows = sqlx::query(
            r#"SELECT * FROM sale_items WHERE sale_id = ?"#
        )
        .bind(&id)
        .fetch_all(&*pool)
        .await
        .map_err(|e| e.to_string())?;
        let items = items_rows.into_iter().map(|row| SaleItem {
            id: row.get("id"),
            sale_id: row.get("sale_id"),
            description: row.get("description"),
            coil_ref: row.get("coil_ref"),
            coil_thickness: row.get("coil_thickness"),
            coil_width: row.get("coil_width"),
            top_coat_ral: row.get("top_coat_ral"),
            back_coat_ral: row.get("back_coat_ral"),
            coil_weight: row.get("coil_weight"),
            quantity: row.get("quantity"),
            price_per_ton: row.get("price_per_ton"),
            total_amount: row.get("total_amount"),
            product_type: row.get("product_type"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }).collect();
        Ok(Some(Sale {
            id: sale_row.get("id"),
            client_id: sale_row.get("client_id"),
            date: sale_row.get("date"),
            total_amount: sale_row.get("total_amount"),
            total_amount_ttc: sale_row.get("total_amount_ttc"),
            is_invoiced: sale_row.get("is_invoiced"),
            invoice_id: sale_row.get("invoice_id"),
            notes: sale_row.get("notes"),
            payment_method: sale_row.get("payment_method"),
            transportation_fee: sale_row.get("transportation_fee"),
            tax_rate: sale_row.get("tax_rate"),
            created_at: sale_row.get("created_at"),
            updated_at: sale_row.get("updated_at"),
            is_paid: sale_row.get("is_paid"),
            paid_at: sale_row.get("paid_at"),
            items,
        }))
    } else {
        Ok(None)
    }
}

fn calculate_total_amount(item: &CreateSaleItemRequest) -> f64 {
    match item.product_type.as_str() {
        "coil" => {
            let weight = item.coil_weight.unwrap_or(0.0);
            item.price_per_ton * weight
        }
        "corrugated_sheet" => {
            let length = item.coil_width.unwrap_or(0.0);
            item.quantity * length * item.price_per_ton
        }
        "steel_slitting" => {
            let weight = item.coil_weight.unwrap_or(0.0);
            item.price_per_ton * weight
        }
        _ => item.total_amount
    }
}

fn validate_sale_item(item: &CreateSaleItemRequest) -> Result<(), String> {
    if item.description.trim().is_empty() {
        return Err("Description is required".to_string());
    }
    if item.product_type.trim().is_empty() {
        return Err("Product type is required".to_string());
    }
    match item.product_type.as_str() {
        "coil" => {
            if item.coil_thickness.unwrap_or(0.0) <= 0.0 {
                return Err("Coil thickness is required and must be positive for coils".to_string());
            }
            if item.coil_width.unwrap_or(0.0) <= 0.0 {
                return Err("Coil width is required and must be positive for coils".to_string());
            }
            if item.coil_weight.unwrap_or(0.0) <= 0.0 {
                return Err("Coil weight is required and must be positive for coils".to_string());
            }
        }
        "corrugated_sheet" => {
            if item.coil_width.unwrap_or(0.0) <= 0.0 {
                return Err("Length (coil_width) is required and must be positive for corrugated sheets".to_string());
            }
            if item.quantity <= 0.0 {
                return Err("Quantity is required and must be positive for corrugated sheets".to_string());
            }
        }
        "steel_slitting" => {
            if item.coil_weight.unwrap_or(0.0) <= 0.0 {
                return Err("Weight (coil_weight) is required and must be positive for steel slitting".to_string());
            }
            if item.quantity <= 0.0 {
                return Err("Quantity is required and must be positive for steel slitting".to_string());
            }
        }
        _ => {}
    }
    Ok(())
}

#[tauri::command]
pub async fn create_sale(
    sale: CreateSaleRequest,
    pool: tauri::State<'_, SqlitePool>
) -> Result<Sale, String> {
    // Debug: print the received sale JSON and fields
    match serde_json::to_string(&sale) {
        Ok(json) => println!("[create_sale] Received sale JSON: {}", json),
        Err(e) => println!("[create_sale] Failed to serialize received sale: {}", e),
    }
    println!("[create_sale] Fields: client_id={:?}, date={:?}, total_amount={:?}, total_amount_ttc={:?}, is_invoiced={:?}, invoice_id={:?}, notes={:?}, payment_method={:?}, transportation_fee={:?}, tax_rate={:?}, is_paid={:?}, paid_at={:?}, items.len={}",
        sale.client_id, sale.date, sale.total_amount, sale.total_amount_ttc, sale.is_invoiced, sale.invoice_id, sale.notes, sale.payment_method, sale.transportation_fee, sale.tax_rate, sale.is_paid, sale.paid_at, sale.items.len());
    let sale_id = Uuid::new_v4().to_string();
    let now = Utc::now();
    let is_paid = sale.is_paid.unwrap_or(false);
    let paid_at = sale.paid_at;
    sqlx::query(
        r#"INSERT INTO sales (
            id, client_id, date, total_amount, total_amount_ttc, is_invoiced, invoice_id, notes, payment_method, transportation_fee, tax_rate, is_paid, paid_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#
    )
    .bind(&sale_id)
    .bind(&sale.client_id)
    .bind(sale.date)
    .bind(sale.total_amount)
    .bind(sale.total_amount_ttc)
    .bind(sale.is_invoiced)
    .bind(&sale.invoice_id)
    .bind(&sale.notes)
    .bind(&sale.payment_method)
    .bind(sale.transportation_fee)
    .bind(sale.tax_rate)
    .bind(is_paid)
    .bind(paid_at)
    .bind(now)
    .bind(now)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    // Insert sale items
    for item in &sale.items {
        validate_sale_item(item)?;
        let item_id = Uuid::new_v4().to_string();
        let total_amount = calculate_total_amount(item);
        sqlx::query(
            r#"INSERT INTO sale_items (
                id, sale_id, description, coil_ref, coil_thickness, coil_width, top_coat_ral, back_coat_ral, coil_weight, quantity, price_per_ton, total_amount, product_type, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#
        )
        .bind(&item_id)
        .bind(&sale_id)
        .bind(&item.description)
        .bind(item.coil_ref.as_ref())
        .bind(item.coil_thickness)
        .bind(item.coil_width)
        .bind(item.top_coat_ral.as_ref())
        .bind(item.back_coat_ral.as_ref())
        .bind(item.coil_weight)
        .bind(item.quantity)
        .bind(item.price_per_ton)
        .bind(total_amount)
        .bind(&item.product_type)
        .bind(now)
        .bind(now)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    }
    // Fetch and return the created sale
    get_sale_by_id(sale_id, pool).await.and_then(|opt| opt.ok_or_else(|| "Failed to retrieve created sale".to_string()))
}

#[tauri::command]
pub async fn update_sale(
    id: String,
    sale: CreateSaleRequest,
    pool: tauri::State<'_, SqlitePool>
) -> Result<Sale, String> {
    // Log the received sale for debugging
    match serde_json::to_string(&sale) {
        Ok(json) => println!("[update_sale] Received sale JSON: {}", json),
        Err(e) => println!("[update_sale] Failed to serialize received sale: {}", e),
    }
    let now = Utc::now();
    let is_paid = sale.is_paid.unwrap_or(false);
    let paid_at = sale.paid_at;
    sqlx::query(
        r#"UPDATE sales SET client_id = ?, date = ?, total_amount = ?, total_amount_ttc = ?, is_invoiced = ?, invoice_id = ?, notes = ?, payment_method = ?, transportation_fee = ?, tax_rate = ?, is_paid = ?, paid_at = ?, updated_at = ? WHERE id = ?"#
    )
    .bind(&sale.client_id)
    .bind(sale.date)
    .bind(sale.total_amount)
    .bind(sale.total_amount_ttc)
    .bind(sale.is_invoiced)
    .bind(&sale.invoice_id)
    .bind(&sale.notes)
    .bind(&sale.payment_method)
    .bind(sale.transportation_fee)
    .bind(sale.tax_rate)
    .bind(is_paid)
    .bind(paid_at)
    .bind(now)
    .bind(&id)
    .execute(&*pool)
    .await
    .map_err(|e| {
        println!("[update_sale] SQL error: {}", e);
        e.to_string()
    })?;
    // Delete old items
    sqlx::query("DELETE FROM sale_items WHERE sale_id = ?")
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| {
            println!("[update_sale] SQL error (delete items): {}", e);
            e.to_string()
        })?;
    // Insert new items
    for item in &sale.items {
        if let Err(e) = validate_sale_item(item) {
            println!("[update_sale] Invalid sale item: {}", e);
            return Err(format!("Invalid sale item: {}", e));
        }
        let item_id = Uuid::new_v4().to_string();
        let total_amount = calculate_total_amount(item);
        sqlx::query(
            r#"INSERT INTO sale_items (
                id, sale_id, description, coil_ref, coil_thickness, coil_width, top_coat_ral, back_coat_ral, coil_weight, quantity, price_per_ton, total_amount, product_type, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#
        )
        .bind(&item_id)
        .bind(&id)
        .bind(&item.description)
        .bind(item.coil_ref.as_ref())
        .bind(item.coil_thickness)
        .bind(item.coil_width)
        .bind(item.top_coat_ral.as_ref())
        .bind(item.back_coat_ral.as_ref())
        .bind(item.coil_weight)
        .bind(item.quantity)
        .bind(item.price_per_ton)
        .bind(total_amount)
        .bind(&item.product_type)
        .bind(now)
        .bind(now)
        .execute(&*pool)
        .await
        .map_err(|e| {
            println!("[update_sale] SQL error (insert item): {}", e);
            e.to_string()
        })?;
    }
    // Fetch and return the updated sale
    get_sale_by_id(id, pool).await.and_then(|opt| opt.ok_or_else(|| "Failed to retrieve updated sale".to_string()))
}

#[tauri::command]
pub async fn delete_sale(
    id: String,
    pool: tauri::State<'_, SqlitePool>
) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    // 1. Find all affected invoices via invoice_sales
    let invoice_ids: Vec<String> = sqlx::query("SELECT invoice_id FROM invoice_sales WHERE sale_id = ?")
        .bind(&id)
        .fetch_all(&*pool)
        .await
        .map_err(|e| e.to_string())?
        .into_iter()
        .filter_map(|row| row.try_get::<String, _>("invoice_id").ok())
        .collect();
    // 2. Block deletion if any related invoice is paid
    for invoice_id in &invoice_ids {
        let is_paid: Option<bool> = sqlx::query_scalar("SELECT is_paid FROM invoices WHERE id = ?")
            .bind(invoice_id)
            .fetch_one(&*pool)
            .await
            .map_err(|e| e.to_string())?;
        if is_paid.unwrap_or(false) {
            return Err(format!("Cannot delete sale: related invoice {} is paid.", invoice_id));
        }
    }
    // 3. Soft delete the sale
    sqlx::query("UPDATE sales SET is_deleted = 1, deleted_at = ? WHERE id = ?")
        .bind(&now)
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    // 4. Soft delete all related payments
    sqlx::query("UPDATE payments SET is_deleted = 1, deleted_at = ? WHERE sale_id = ?")
        .bind(&now)
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    // 5. Remove all invoice_sales rows for this sale
    sqlx::query("DELETE FROM invoice_sales WHERE sale_id = ?")
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    // 6. For each affected invoice, check if it has any remaining non-deleted sales
    for invoice_id in invoice_ids {
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM invoice_sales s JOIN sales ON s.sale_id = sales.id WHERE s.invoice_id = ? AND (sales.is_deleted = 0 OR sales.is_deleted IS NULL)"
        )
        .bind(&invoice_id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| e.to_string())?;
        if count == 0 {
            // Soft delete the invoice
            sqlx::query("UPDATE invoices SET is_deleted = 1, deleted_at = ? WHERE id = ?")
                .bind(&now)
                .bind(&invoice_id)
                .execute(&*pool)
                .await
                .map_err(|e| e.to_string())?;
        }
    }
    // Insert audit log entry for sale soft delete
    insert_audit_log(&*pool, "soft_delete", "sale", &id, None, Some("Sale soft-deleted")).await?;
    Ok(())
}

#[tauri::command]
pub async fn restore_sale(
    id: String,
    pool: tauri::State<'_, SqlitePool>
) -> Result<(), String> {
    // 1. Restore the sale
    sqlx::query("UPDATE sales SET is_deleted = 0, deleted_at = NULL WHERE id = ?")
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    // 2. Restore all related payments
    sqlx::query("UPDATE payments SET is_deleted = 0, deleted_at = NULL WHERE sale_id = ?")
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    // 3. Restore invoice_sales rows (not possible if deleted, but if you use is_deleted, restore here)
    // 4. For each affected invoice, check if all its sales are now restored (not deleted)
    let invoice_ids: Vec<String> = sqlx::query("SELECT invoice_id FROM invoice_sales WHERE sale_id = ?")
        .bind(&id)
        .fetch_all(&*pool)
        .await
        .map_err(|e| e.to_string())?
        .into_iter()
        .filter_map(|row| row.try_get::<String, _>("invoice_id").ok())
        .collect();
    for invoice_id in invoice_ids {
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM invoice_sales s JOIN sales ON s.sale_id = sales.id WHERE s.invoice_id = ? AND (sales.is_deleted = 1)"
        )
        .bind(&invoice_id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| e.to_string())?;
        if count == 0 {
            // All sales are restored, so restore the invoice
            sqlx::query("UPDATE invoices SET is_deleted = 0, deleted_at = NULL WHERE id = ?")
                .bind(&invoice_id)
                .execute(&*pool)
                .await
                .map_err(|e| e.to_string())?;
        }
    }
    // Insert audit log entry for sale restore
    insert_audit_log(&*pool, "restore", "sale", &id, None, Some("Sale restored")).await?;
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Invoice {
    pub id: String,
    pub invoice_number: String,
    pub client_id: String,
    pub date: String,
    pub due_date: String,
    pub total_amount_ht: f64,
    pub total_amount_ttc: f64,
    pub is_paid: bool,
    pub paid_at: Option<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub deleted_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateInvoiceRequest {
    pub invoice_number: String,
    pub client_id: String,
    pub date: String,
    pub due_date: String,
    pub total_amount_ht: f64,
    pub total_amount_ttc: f64,
    pub is_paid: bool,
    pub paid_at: Option<String>,
    pub sales_ids: Vec<String>,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct PaginatedInvoicesResult {
    pub rows: Vec<serde_json::Value>,
    pub total: i64,
}

#[tauri::command]
pub async fn get_invoices(
    page: Option<u32>,
    page_size: Option<u32>,
    pool: tauri::State<'_, SqlitePool>
) -> Result<PaginatedInvoicesResult, String> {
    let page = page.unwrap_or(1);
    let page_size = page_size.unwrap_or(5);
    let offset = (page - 1) * page_size;
    // Total count
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM invoices WHERE is_deleted = 0 OR is_deleted IS NULL")
        .fetch_one(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    // Paginated rows
    let invoices = sqlx::query(
        r#"
        SELECT i.id, i.invoice_number, i.client_id, i.date, i.due_date, 
               i.total_amount_ht, i.total_amount_ttc, i.is_paid, i.paid_at, 
               i.created_at, i.updated_at,
               GROUP_CONCAT(s.id) as sales_ids
        FROM invoices i
        LEFT JOIN sales s ON s.invoice_id = i.id
        WHERE i.is_deleted = 0 OR i.is_deleted IS NULL
        GROUP BY i.id
        ORDER BY i.date DESC
        LIMIT ? OFFSET ?
        "#
    )
    .bind(page_size as i64)
    .bind(offset as i64)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    let rows: Vec<serde_json::Value> = invoices
        .into_iter()
        .map(|row| {
            let sales_ids: Option<String> = row.get("sales_ids");
            let sales_ids_array = sales_ids
                .map(|s| s.split(',').filter(|s| !s.is_empty()).map(String::from).collect::<Vec<_>>())
                .unwrap_or_default();
            serde_json::json!({
                "id": row.get::<String, _>("id"),
                "invoice_number": row.get::<String, _>("invoice_number"),
                "client_id": row.get::<String, _>("client_id"),
                "date": row.get::<String, _>("date"),
                "due_date": row.get::<String, _>("due_date"),
                "total_amount_ht": row.get::<f64, _>("total_amount_ht"),
                "total_amount_ttc": row.get::<f64, _>("total_amount_ttc"),
                "is_paid": row.get::<bool, _>("is_paid"),
                "paid_at": row.get::<Option<String>, _>("paid_at"),
                "created_at": row.get::<String, _>("created_at"),
                "updated_at": row.get::<Option<String>, _>("updated_at"),
                "sales_ids": sales_ids_array
            })
        })
        .collect();
    Ok(PaginatedInvoicesResult { rows, total })
}

#[tauri::command]
pub async fn create_invoice(
    invoice: CreateInvoiceRequest,
    pool: tauri::State<'_, SqlitePool>
) -> Result<Invoice, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    sqlx::query(
        r#"INSERT INTO invoices (
            id, invoice_number, client_id, date, due_date, total_amount_ht, total_amount_ttc, is_paid, paid_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#
    )
    .bind(&id)
    .bind(&invoice.invoice_number)
    .bind(&invoice.client_id)
    .bind(&invoice.date)
    .bind(&invoice.due_date)
    .bind(invoice.total_amount_ht)
    .bind(invoice.total_amount_ttc)
    .bind(false) // is_paid always false at creation
    .bind(Option::<String>::None) // paid_at always null at creation
    .bind(&now)
    .bind(&now)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    // After creating the invoice, update the sales and their payments
    for sale_id in &invoice.sales_ids {
        // Mark sale as invoiced
        sqlx::query("UPDATE sales SET is_invoiced = 1, invoice_id = ? WHERE id = ?")
        .bind(&id)
        .bind(sale_id)
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;

        // Link sale to invoice in invoice_sales
        let link_id = Uuid::new_v4().to_string();
        sqlx::query("INSERT INTO invoice_sales (id, invoice_id, sale_id, created_at) VALUES (?, ?, ?, ?)")
            .bind(&link_id)
            .bind(&id)
            .bind(sale_id)
            .bind(&now)
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;

        // Find payments for this sale and link them to the invoice
        sqlx::query("UPDATE payments SET invoice_id = ? WHERE sale_id = ?")
            .bind(&id)
            .bind(sale_id)
            .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    }

    Ok(Invoice {
        id,
        invoice_number: invoice.invoice_number,
        client_id: invoice.client_id,
        date: invoice.date,
        due_date: invoice.due_date,
        total_amount_ht: invoice.total_amount_ht,
        total_amount_ttc: invoice.total_amount_ttc,
        is_paid: false, // always false at creation
        paid_at: None,  // always None at creation
        created_at: now.clone(),
        updated_at: Some(now),
        deleted_at: None,// always None at creation
    })
}

#[tauri::command]
pub async fn restore_invoice(id: String, pool: tauri::State<'_, SqlitePool>) -> Result<(), String> {
    sqlx::query("UPDATE invoices SET is_deleted = 0, deleted_at = NULL WHERE id = ?")
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    // Insert audit log entry for invoice restore
    insert_audit_log(&*pool, "restore", "invoice", &id, None, Some("Invoice restored")).await?;
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CorrugatedSheetItem {
    pub id: String,
    pub sale_id: String,
    pub description: String,
    pub thickness: Option<f64>,
    pub width: Option<f64>,
    pub length: Option<f64>,
    pub color: Option<String>,
    pub quantity: i64,
    pub price_per_unit: f64,
    pub total_amount: f64,
    pub created_at: String,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCorrugatedSheetItemRequest {
    pub sale_id: String,
    pub description: String,
    pub thickness: Option<f64>,
    pub width: Option<f64>,
    pub length: Option<f64>,
    pub color: Option<String>,
    pub quantity: i64,
    pub price_per_unit: f64,
    pub total_amount: f64,
}

#[tauri::command]
pub async fn get_corrugated_sheet_items(pool: tauri::State<'_, SqlitePool>) -> Result<Vec<CorrugatedSheetItem>, String> {
    let items = sqlx::query(
        r#"
        SELECT id, sale_id, description, thickness, width, length, color, quantity, price_per_unit, total_amount, created_at, updated_at
        FROM corrugated_sheet_items
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let items: Vec<CorrugatedSheetItem> = items
        .into_iter()
        .map(|row| CorrugatedSheetItem {
            id: row.get("id"),
            sale_id: row.get("sale_id"),
            description: row.get("description"),
            thickness: row.get("thickness"),
            width: row.get("width"),
            length: row.get("length"),
            color: row.get("color"),
            quantity: row.get("quantity"),
            price_per_unit: row.get("price_per_unit"),
            total_amount: row.get("total_amount"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(items)
}

#[tauri::command]
pub async fn create_corrugated_sheet_item(
    item: CreateCorrugatedSheetItemRequest,
    pool: tauri::State<'_, SqlitePool>
) -> Result<CorrugatedSheetItem, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        INSERT INTO corrugated_sheet_items (id, sale_id, description, thickness, width, length, color, quantity, price_per_unit, total_amount, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&id)
    .bind(&item.sale_id)
    .bind(&item.description)
    .bind(item.thickness)
    .bind(item.width)
    .bind(item.length)
    .bind(&item.color)
    .bind(item.quantity)
    .bind(item.price_per_unit)
    .bind(item.total_amount)
    .bind(&now)
    .bind(&now)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(CorrugatedSheetItem {
        id,
        sale_id: item.sale_id,
        description: item.description,
        thickness: item.thickness,
        width: item.width,
        length: item.length,
        color: item.color,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit,
        total_amount: item.total_amount,
        created_at: now.clone(),
        updated_at: Some(now),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SteelSlittingStripItem {
    pub id: String,
    pub sale_id: String,
    pub description: String,
    pub thickness: Option<f64>,
    pub width: Option<f64>,
    pub coil_weight: Option<f64>,
    pub quantity: i64,
    pub price_per_unit: f64,
    pub total_amount: f64,
    pub created_at: String,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSteelSlittingStripItemRequest {
    pub sale_id: String,
    pub description: String,
    pub thickness: Option<f64>,
    pub width: Option<f64>,
    pub coil_weight: Option<f64>,
    pub quantity: i64,
    pub price_per_unit: f64,
    pub total_amount: f64,
}

#[tauri::command]
pub async fn get_steel_slitting_strip_items(pool: tauri::State<'_, SqlitePool>) -> Result<Vec<SteelSlittingStripItem>, String> {
    let items = sqlx::query(
        r#"
        SELECT id, sale_id, description, thickness, width, coil_weight, quantity, price_per_unit, total_amount, created_at, updated_at
        FROM steel_slitting_strip_items
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let items: Vec<SteelSlittingStripItem> = items
        .into_iter()
        .map(|row| SteelSlittingStripItem {
            id: row.get("id"),
            sale_id: row.get("sale_id"),
            description: row.get("description"),
            thickness: row.get("thickness"),
            width: row.get("width"),
            coil_weight: row.get("coil_weight"),
            quantity: row.get("quantity"),
            price_per_unit: row.get("price_per_unit"),
            total_amount: row.get("total_amount"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(items)
}

#[tauri::command]
pub async fn create_steel_slitting_strip_item(
    item: CreateSteelSlittingStripItemRequest,
    pool: tauri::State<'_, SqlitePool>
) -> Result<SteelSlittingStripItem, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        INSERT INTO steel_slitting_strip_items (id, sale_id, description, thickness, width, coil_weight, quantity, price_per_unit, total_amount, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&id)
    .bind(&item.sale_id)
    .bind(&item.description)
    .bind(item.thickness)
    .bind(item.width)
    .bind(item.coil_weight)
    .bind(item.quantity)
    .bind(item.price_per_unit)
    .bind(item.total_amount)
    .bind(&now)
    .bind(&now)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(SteelSlittingStripItem {
        id,
        sale_id: item.sale_id,
        description: item.description,
        thickness: item.thickness,
        width: item.width,
        coil_weight: item.coil_weight,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit,
        total_amount: item.total_amount,
        created_at: now.clone(),
        updated_at: Some(now),
    })
}

#[tauri::command]
pub async fn mark_sale_invoiced(
    sale_id: String,
    invoice_id: String,
    pool: tauri::State<'_, SqlitePool>
) -> Result<(), String> {
    
    sqlx::query!(
        "UPDATE sales SET is_invoiced = 1, invoice_id = ? WHERE id = ?",
        invoice_id,
        sale_id
    )
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn unmark_sale_invoiced(
    sale_id: String,
    pool: tauri::State<'_, SqlitePool>
) -> Result<(), String> {
    sqlx::query(
        "UPDATE sales SET is_invoiced = 0, invoice_id = ? WHERE id = ?"
    )
    .bind(Option::<String>::None) // This will be NULL
    .bind(&sale_id)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuditLog {
    pub id: i64,
    pub action: String,
    pub entity_type: String,
    pub entity_id: String,
    pub user_id: Option<String>,
    pub timestamp: String,
    pub details: Option<String>,
}

async fn insert_audit_log(
    pool: &SqlitePool,
    action: &str,
    entity_type: &str,
    entity_id: &str,
    user_id: Option<&str>,
    details: Option<&str>,
) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query(
        "INSERT INTO audit_log (action, entity_type, entity_id, user_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(action)
    .bind(entity_type)
    .bind(entity_id)
    .bind(user_id)
    .bind(&now)
    .bind(details)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn delete_invoice(
    id: String,
    pool: tauri::State<'_, SqlitePool>
) -> Result<(), String> {
    // Check if invoice is a draft and has no payments
    let invoice_row = sqlx::query!("SELECT is_paid FROM invoices WHERE id = ?", id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    let is_paid = invoice_row.is_paid;
    // Treat NULL as false (unpaid) for draft logic
    let is_paid = is_paid.unwrap_or(false);
    let payment_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM payments WHERE invoice_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)")
        .bind(&id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    if !is_paid && payment_count == 0 {
        // Hard delete: remove invoice, invoice_sales, and unmark sales
        sqlx::query("DELETE FROM invoice_sales WHERE invoice_id = ?")
            .bind(&id)
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
        sqlx::query("UPDATE sales SET is_invoiced = 0, invoice_id = NULL WHERE invoice_id = ?")
            .bind(&id)
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
        sqlx::query("DELETE FROM invoices WHERE id = ?")
            .bind(&id)
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
        insert_audit_log(&*pool, "hard_delete", "invoice", &id, None, Some("Invoice hard-deleted (draft, no payments)")).await?;
    } else {
        // Soft delete as before
        let sales = sqlx::query!("SELECT id FROM sales WHERE invoice_id = ?", id)
            .fetch_all(&*pool)
            .await
            .map_err(|e| e.to_string())?;
        for sale in &sales {
            sqlx::query!(
                "UPDATE sales SET is_invoiced = 0, invoice_id = NULL WHERE id = ?",
                sale.id
            )
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
        }
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query("UPDATE invoices SET is_deleted = 1, deleted_at = ? WHERE id = ?")
            .bind(&now)
            .bind(&id)
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
        insert_audit_log(&*pool, "soft_delete", "invoice", &id, None, Some("Invoice soft-deleted")).await?;
    }
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Payment {
    pub id: String,
    pub sale_id: Option<String>,
    pub invoice_id: Option<String>,
    pub client_id: String,
    pub amount: f64,
    pub date: String,
    pub method: String,
    pub notes: Option<String>,
    pub check_number: Option<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub is_deleted: Option<bool>,
    pub deleted_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePaymentRequest {
    pub sale_id: Option<String>,
    pub invoice_id: Option<String>,
    pub client_id: String,
    pub amount: f64,
    pub date: String,
    pub method: String,
    pub notes: Option<String>,
    pub check_number: Option<String>,
}

#[tauri::command]
pub async fn create_payment(
    mut payment: CreatePaymentRequest,
    pool: tauri::State<'_, SqlitePool>
) -> Result<Payment, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    // Ensure check_number is None if method is not 'check'
    if payment.method != "check" {
        payment.check_number = None;
    }

    sqlx::query(
        r#"
        INSERT INTO payments (id, sale_id, invoice_id, client_id, amount, date, method, notes, check_number, created_at, updated_at, is_deleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        "#,
    )
    .bind(&id)
    .bind(&payment.sale_id)
    .bind(&payment.invoice_id)
    .bind(&payment.client_id)
    .bind(payment.amount)
    .bind(&payment.date)
    .bind(&payment.method)
    .bind(&payment.notes)
    .bind(&payment.check_number)
    .bind(&now)
    .bind(&now)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let new_payment = Payment {
        id,
        sale_id: payment.sale_id,
        invoice_id: payment.invoice_id,
        client_id: payment.client_id,
        amount: payment.amount,
        date: payment.date,
        method: payment.method,
        notes: payment.notes,
        check_number: payment.check_number,
        created_at: now.clone(),
        updated_at: Some(now),
        is_deleted: Some(false),
        deleted_at: None,
    };

    Ok(new_payment)
}

#[tauri::command]
pub async fn get_payments(
    pool: tauri::State<'_, SqlitePool>
) -> Result<Vec<Payment>, String> {
    let rows = sqlx::query(
        r#"SELECT * FROM payments WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY date DESC"#
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let payments = rows.into_iter().map(|row| Payment {
        id: row.get("id"),
        sale_id: row.get("sale_id"),
        invoice_id: row.get("invoice_id"),
        client_id: row.get("client_id"),
        amount: row.get("amount"),
        date: row.get("date"),
        method: row.get("method"),
        notes: row.get("notes"),
        check_number: row.get("check_number"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
        is_deleted: row.get("is_deleted"),
        deleted_at: row.get("deleted_at"),
    }).collect();
    Ok(payments)
}

#[tauri::command]
pub async fn delete_payment(
    id: String,
    pool: tauri::State<'_, SqlitePool>
) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query("UPDATE payments SET is_deleted = 1, deleted_at = ? WHERE id = ?")
        .bind(&now)
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    // Insert audit log entry for payment soft delete
    insert_audit_log(&*pool, "soft_delete", "payment", &id, None, Some("Payment soft-deleted")).await?;
    Ok(())
}

#[tauri::command]
pub async fn restore_payment(id: String, pool: tauri::State<'_, SqlitePool>) -> Result<(), String> {
    sqlx::query("UPDATE payments SET is_deleted = 0, deleted_at = NULL WHERE id = ?")
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    // Insert audit log entry for payment restore
    insert_audit_log(&*pool, "restore", "payment", &id, None, Some("Payment restored")).await?;
    Ok(())
}

#[tauri::command]
pub async fn get_deleted_invoices(pool: tauri::State<'_, SqlitePool>) -> Result<Vec<serde_json::Value>, String> {
    let invoices = sqlx::query(
        r#"
        SELECT i.id, i.invoice_number, i.client_id, i.date, i.due_date, 
               i.total_amount_ht, i.total_amount_ttc, i.is_paid, i.paid_at, 
               i.created_at, i.updated_at,
               GROUP_CONCAT(s.id) as sales_ids
        FROM invoices i
        LEFT JOIN sales s ON s.invoice_id = i.id
        WHERE i.is_deleted = 1
        GROUP BY i.id
        ORDER BY i.deleted_at DESC
        "#
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    let invoices: Vec<serde_json::Value> = invoices
        .into_iter()
        .map(|row| {
            let sales_ids: Option<String> = row.get("sales_ids");
            let sales_ids_array = sales_ids
                .map(|s| s.split(',').filter(|s| !s.is_empty()).map(String::from).collect::<Vec<_>>())
                .unwrap_or_default();
            serde_json::json!({
                "id": row.get::<String, _>("id"),
                "invoice_number": row.get::<String, _>("invoice_number"),
                "client_id": row.get::<String, _>("client_id"),
                "date": row.get::<String, _>("date"),
                "due_date": row.get::<String, _>("due_date"),
                "total_amount_ht": row.get::<f64, _>("total_amount_ht"),
                "total_amount_ttc": row.get::<f64, _>("total_amount_ttc"),
                "is_paid": row.get::<bool, _>("is_paid"),
                "paid_at": row.get::<Option<String>, _>("paid_at"),
                "created_at": row.get::<String, _>("created_at"),
                "updated_at": row.get::<Option<String>, _>("updated_at"),
                // "deleted_at": row.get::<String, _>("deleted_at"),
                "sales_ids": sales_ids_array
            })
        })
        .collect();
    
    Ok(invoices)
}

#[tauri::command]
pub async fn get_deleted_sales(pool: tauri::State<'_, SqlitePool>) -> Result<Vec<Sale>, String> {
    let sales_rows = sqlx::query(
        r#"SELECT * FROM sales WHERE is_deleted = 1 ORDER BY deleted_at DESC"#
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    let mut sales = Vec::new();
    for sale_row in sales_rows {
        let sale_id: String = sale_row.get("id");
        let items_rows = sqlx::query(
            r#"SELECT * FROM sale_items WHERE sale_id = ?"#
        )
        .bind(&sale_id)
        .fetch_all(&*pool)
        .await
        .map_err(|e| e.to_string())?;
        let items = items_rows.into_iter().map(|row| SaleItem {
            id: row.get("id"),
            sale_id: row.get("sale_id"),
            description: row.get("description"),
            coil_ref: row.get("coil_ref"),
            coil_thickness: row.get("coil_thickness"),
            coil_width: row.get("coil_width"),
            top_coat_ral: row.get("top_coat_ral"),
            back_coat_ral: row.get("back_coat_ral"),
            coil_weight: row.get("coil_weight"),
            quantity: row.get("quantity"),
            price_per_ton: row.get("price_per_ton"),
            total_amount: row.get("total_amount"),
            product_type: row.get("product_type"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }).collect();
        sales.push(Sale {
            id: sale_row.get("id"),
            client_id: sale_row.get("client_id"),
            date: sale_row.get("date"),
            total_amount: sale_row.get("total_amount"),
            total_amount_ttc: sale_row.get("total_amount_ttc"),
            is_invoiced: sale_row.get("is_invoiced"),
            invoice_id: sale_row.get("invoice_id"),
            notes: sale_row.get("notes"),
            payment_method: sale_row.get("payment_method"),
            transportation_fee: sale_row.get("transportation_fee"),
            tax_rate: sale_row.get("tax_rate"),
            created_at: sale_row.get("created_at"),
            updated_at: sale_row.get("updated_at"),
            is_paid: sale_row.get("is_paid"),
            paid_at: sale_row.get("paid_at"),
            items,
        });
    }
    Ok(sales)
}

#[tauri::command]
pub async fn get_deleted_payments(pool: tauri::State<'_, SqlitePool>) -> Result<Vec<Payment>, String> {
    let rows = sqlx::query(
        r#"SELECT * FROM payments WHERE is_deleted = 1 ORDER BY deleted_at DESC"#
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    let payments = rows.into_iter().map(|row| Payment {
        id: row.get("id"),
        sale_id: row.get("sale_id"),
        invoice_id: row.get("invoice_id"),
        client_id: row.get("client_id"),
        amount: row.get("amount"),
        date: row.get("date"),
        method: row.get("method"),
        notes: row.get("notes"),
        check_number: row.get("check_number"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
        is_deleted: row.get("is_deleted"),
        deleted_at: row.get("deleted_at"),
    }).collect();
    Ok(payments)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    pub id: Option<String>,
    pub company_name: Option<String>,
    pub company_address: Option<String>,
    pub company_phone: Option<String>,
    pub company_email: Option<String>,
    pub company_logo: Option<String>,
    pub tax_rate: Option<f64>,
    pub currency: Option<String>,
    pub nif: Option<String>,
    pub nis: Option<String>,
    pub rc: Option<String>,
    pub ai: Option<String>,
    pub rib: Option<String>,
    pub language: Option<String>,
    pub theme: Option<String>,
    pub notifications: Option<bool>,
    pub dark_mode: Option<bool>,
    pub user_id: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[tauri::command]
pub async fn get_settings(pool: tauri::State<'_, SqlitePool>) -> Result<Settings, String> {
    let row = sqlx::query(
        r#"
        SELECT
            id, company_name, company_address, company_phone, company_email, company_logo,
            tax_rate, currency, nif, nis, rc, ai, rib, language, theme, notifications, dark_mode,
            user_id, created_at, updated_at
        FROM settings
        LIMIT 1
        "#
    )
    .fetch_optional(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    if let Some(row) = row {
        Ok(Settings {
            id: row.get("id"),
            company_name: row.get("company_name"),
            company_address: row.get("company_address"),
            company_phone: row.get("company_phone"),
            company_email: row.get("company_email"),
            company_logo: row.get("company_logo"),
            tax_rate: row.get("tax_rate"),
            currency: row.get("currency"),
            nif: row.get("nif"),
            nis: row.get("nis"),
            rc: row.get("rc"),
            ai: row.get("ai"),
            rib: row.get("rib"),
            language: row.get("language"),
            theme: row.get("theme"),
            notifications: row.get("notifications"),
            dark_mode: row.get("dark_mode"),
            user_id: row.get("user_id"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    } else {
        Err("No settings found".to_string())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateSettingsRequest {
    pub company_name: Option<String>,
    pub company_address: Option<String>,
    pub company_phone: Option<String>,
    pub company_email: Option<String>,
    pub company_logo: Option<String>,
    pub tax_rate: Option<f64>,
    pub currency: Option<String>,
    pub nif: Option<String>,
    pub nis: Option<String>,
    pub rc: Option<String>,
    pub ai: Option<String>,
    pub rib: Option<String>,
    pub language: Option<String>,
    pub theme: Option<String>,
    pub notifications: Option<bool>,
    pub dark_mode: Option<bool>,
    pub user_id: Option<String>,
}

#[tauri::command]
pub async fn update_settings(
    updates: UpdateSettingsRequest,
    pool: tauri::State<'_, SqlitePool>,
) -> Result<(), String> {
    let mut set_clauses = Vec::new();

    if let Some(_) = updates.company_name { set_clauses.push("company_name = ?"); }
    if let Some(_) = updates.company_address { set_clauses.push("company_address = ?"); }
    if let Some(_) = updates.company_phone { set_clauses.push("company_phone = ?"); }
    if let Some(_) = updates.company_email { set_clauses.push("company_email = ?"); }
    if let Some(_) = updates.company_logo { set_clauses.push("company_logo = ?"); }
    if let Some(_) = updates.tax_rate { set_clauses.push("tax_rate = ?"); }
    if let Some(_) = updates.currency { set_clauses.push("currency = ?"); }
    if let Some(_) = updates.nif { set_clauses.push("nif = ?"); }
    if let Some(_) = updates.nis { set_clauses.push("nis = ?"); }
    if let Some(_) = updates.rc { set_clauses.push("rc = ?"); }
    if let Some(_) = updates.ai { set_clauses.push("ai = ?"); }
    if let Some(_) = updates.rib { set_clauses.push("rib = ?"); }
    if let Some(_) = updates.language { set_clauses.push("language = ?"); }
    if let Some(_) = updates.theme { set_clauses.push("theme = ?"); }
    if let Some(_) = updates.notifications { set_clauses.push("notifications = ?"); }
    if let Some(_) = updates.dark_mode { set_clauses.push("dark_mode = ?"); }
    if let Some(_) = updates.user_id { set_clauses.push("user_id = ?"); }

    if set_clauses.is_empty() {
        return Err("No fields to update".to_string());
    }

    let query = format!("UPDATE settings SET {}", set_clauses.join(", "));
    let mut q = sqlx::query(&query);

    // Bind values in the same order as set_clauses
    if let Some(ref v) = updates.company_name { q = q.bind(v); }
    if let Some(ref v) = updates.company_address { q = q.bind(v); }
    if let Some(ref v) = updates.company_phone { q = q.bind(v); }
    if let Some(ref v) = updates.company_email { q = q.bind(v); }
    if let Some(ref v) = updates.company_logo { q = q.bind(v); }
    if let Some(v) = updates.tax_rate { q = q.bind(v); }
    if let Some(ref v) = updates.currency { q = q.bind(v); }
    if let Some(ref v) = updates.nif { q = q.bind(v); }
    if let Some(ref v) = updates.nis { q = q.bind(v); }
    if let Some(ref v) = updates.rc { q = q.bind(v); }
    if let Some(ref v) = updates.ai { q = q.bind(v); }
    if let Some(ref v) = updates.rib { q = q.bind(v); }
    if let Some(ref v) = updates.language { q = q.bind(v); }
    if let Some(ref v) = updates.theme { q = q.bind(v); }
    if let Some(v) = updates.notifications { q = q.bind(v); }
    if let Some(v) = updates.dark_mode { q = q.bind(v); }
    if let Some(ref v) = updates.user_id { q = q.bind(v); }

    q.execute(&*pool).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn export_db(app: tauri::AppHandle, export_path: Option<String>) -> Result<String, String> {
    let db_url = std::env::var("DATABASE_URL").map_err(|e| e.to_string())?;
    let db_path = db_url.strip_prefix("sqlite://").ok_or("Invalid DATABASE_URL")?;

    let export_path = if let Some(path) = export_path {
        std::path::PathBuf::from(path)
    } else {
        app.dialog()
            .file()
            .add_filter("SQLite Database", &["sqlite", "db"])
            .blocking_save_file()
            .ok_or("Export cancelled by user")?
            .as_path()
            .expect("Dialog returned a FilePath with no path")
            .to_path_buf()
    };

    if let Some(parent) = export_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    std::fs::copy(db_path, &export_path).map_err(|e| e.to_string())?;
    Ok(format!("Database exported to {}", export_path.display()))
}

#[tauri::command]
pub async fn import_db(app: tauri::AppHandle, import_path: Option<String>) -> Result<String, String> {
    let db_url = std::env::var("DATABASE_URL").map_err(|e| e.to_string())?;
    let db_path = db_url.strip_prefix("sqlite://").ok_or("Invalid DATABASE_URL")?;
    let db_path = std::path::PathBuf::from(db_path);

    let import_path = if let Some(path) = import_path {
        std::path::PathBuf::from(path)
    } else {
        app.dialog()
            .file()
            .add_filter("SQLite Database", &["sqlite", "db"])
            .blocking_pick_file()
            .ok_or("Import cancelled by user")?
            .as_path()
            .expect("Dialog returned a FilePath with no path")
            .to_path_buf()
    };

    if !import_path.exists() {
        return Err("Selected import file does not exist".to_string());
    }

    let backup_path = db_path.with_extension("backup");
    std::fs::copy(&db_path, &backup_path).map_err(|e| format!("Failed to create backup: {}", e))?;
    std::fs::copy(&import_path, &db_path).map_err(|e| e.to_string())?;

    Ok(format!(
        "Database imported successfully from {}. Backup created at {}",
        import_path.display(),
        backup_path.display()
    ))
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct PaginatedAuditLogResult {
    pub rows: Vec<AuditLog>,
    pub total: i64,
}

#[tauri::command]
pub async fn get_audit_log(
    page: Option<u32>,
    page_size: Option<u32>,
    pool: tauri::State<'_, SqlitePool>
) -> Result<PaginatedAuditLogResult, String> {
    let page = page.unwrap_or(1);
    let page_size = page_size.unwrap_or(50);
    let offset = (page - 1) * page_size;
    // Total count
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM audit_log")
        .fetch_one(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    // Paginated rows
    let rows = sqlx::query(
        "SELECT id, action, entity_type, entity_id, user_id, timestamp, details FROM audit_log ORDER BY timestamp DESC LIMIT ? OFFSET ?"
    )
    .bind(page_size as i64)
    .bind(offset as i64)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    let logs = rows.into_iter().map(|row| AuditLog {
        id: row.get("id"),
        action: row.get("action"),
        entity_type: row.get("entity_type"),
        entity_id: row.get("entity_id"),
        user_id: row.get("user_id"),
        timestamp: row.get("timestamp"),
        details: row.get("details"),
    }).collect();
    Ok(PaginatedAuditLogResult { rows: logs, total })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SoldProductsFilter {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub product_type: Option<String>,
    pub client_id: Option<String>,
    /// Multi-select filter for thickness (mm)
    pub thickness: Option<Vec<f64>>,
    /// Multi-select filter for width (mm)
    pub width: Option<Vec<f64>>,
    /// Unit price min filter
    pub unit_price_min: Option<f64>,
    /// Unit price max filter
    pub unit_price_max: Option<f64>,
    /// Payment status filter: 'all', 'paid', 'unpaid'
    pub payment_status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SoldProduct {
    pub product_name: String,
    pub client_name: String,
    pub thickness: f64,
    pub width: f64,
    pub quantity: f64,
    pub weight: f64,
    pub unit_price: f64,
    pub total_price: f64,
    pub invoice_number: String,
    pub sale_date: String,
    pub payment_status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SoldProductsSummary {
    pub total_weight: f64,
    pub total_revenue: f64, // item-level total (legacy)
    pub official_total_revenue: f64, // sum of sales.total_amount_ttc
    pub item_total_revenue: f64, // sum of sale_items.total_amount * 1.19
    pub total_quantity: f64,
    pub unique_products: i64,
    pub unique_clients: i64,
    pub average_order_value: f64,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct SoldProductsAnalyticsResult {
    pub rows: Vec<SoldProduct>,
    pub total: i64,
}

#[tauri::command]
pub async fn get_sold_products_analytics(
    filter: SoldProductsFilter,
    page: Option<u32>,
    page_size: Option<u32>,
    pool: tauri::State<'_, SqlitePool>,
) -> Result<SoldProductsAnalyticsResult, String> {
    // println!("[get_sold_products_analytics] filter: {:?}", filter);
    let page = page.unwrap_or(1);
    let page_size = page_size.unwrap_or(5);
    let offset = (page - 1) * page_size;
    let mut query = String::from(r#"
        SELECT
            si.description as product_name,
            c.name as client_name,
            si.coil_thickness as thickness,
            si.coil_width as width,
            si.quantity,
            si.coil_weight as weight,
            si.price_per_ton as unit_price,
            (si.total_amount * 1.19) as total_price,
            i.invoice_number,
            s.date as sale_date,
            CASE WHEN i.is_paid = 1 THEN 'Paid' ELSE 'Unpaid' END as payment_status
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN clients c ON s.client_id = c.id
        LEFT JOIN invoices i ON s.invoice_id = i.id
        WHERE 1=1
    "#);
    let mut params: Vec<(String, String)> = Vec::new();
    if let Some(ref start) = filter.start_date {
        query.push_str(" AND s.date >= ?");
        params.push(("start_date".to_string(), start.clone()));
    }
    if let Some(ref end) = filter.end_date {
        query.push_str(" AND s.date <= ?");
        params.push(("end_date".to_string(), end.clone()));
    }
    if let Some(ref pt) = filter.product_type {
        query.push_str(" AND si.product_type = ?");
        params.push(("product_type".to_string(), pt.clone()));
    }
    if let Some(ref cid) = filter.client_id {
        query.push_str(" AND s.client_id = ?");
        params.push(("client_id".to_string(), cid.clone()));
    }
    if let Some(ref thicknesses) = filter.thickness {
        if !thicknesses.is_empty() {
            let placeholders = vec!["?"; thicknesses.len()].join(", ");
            query.push_str(&format!(" AND si.coil_thickness IN ({})", placeholders));
            for t in thicknesses {
                params.push(("thickness".to_string(), t.to_string()));
            }
        }
    }
    if let Some(ref widths) = filter.width {
        if !widths.is_empty() {
            let placeholders = vec!["?"; widths.len()].join(", ");
            query.push_str(&format!(" AND si.coil_width IN ({})", placeholders));
            for w in widths {
                params.push(("width".to_string(), w.to_string()));
            }
        }
    }
    if let Some(min) = filter.unit_price_min {
        query.push_str(" AND si.price_per_ton >= ?");
        params.push(("unit_price_min".to_string(), min.to_string()));
    }
    if let Some(max) = filter.unit_price_max {
        query.push_str(" AND si.price_per_ton <= ?");
        params.push(("unit_price_max".to_string(), max.to_string()));
    }
    if let Some(ref status) = filter.payment_status {
        if status == "paid" {
            query.push_str(" AND i.is_paid = 1");
        } else if status == "unpaid" {
            query.push_str(" AND (i.is_paid = 0 OR i.is_paid IS NULL)");
        }
    }
    query.push_str(" ORDER BY s.date DESC, si.description ASC");
    // For pagination
    let paginated_query = format!("{} LIMIT ? OFFSET ?", query);
    // For total count
    let count_query = format!("SELECT COUNT(*) as total FROM ({} ) as sub", query);
    // Fetch total count
    let mut count_q = sqlx::query(&count_query);
    for (_k, v) in &params {
        count_q = count_q.bind(v);
    }
    let total: i64 = match count_q.fetch_one(&*pool).await {
        Ok(row) => row.try_get("total").unwrap_or(0),
        Err(e) => {
            // println!("[get_sold_products_analytics] COUNT SQL error: {}", e);
            return Err(e.to_string());
        }
    };
    // Fetch paginated rows
    let mut q = sqlx::query(&paginated_query);
    for (_k, v) in &params {
        q = q.bind(v);
    }
    q = q.bind(page_size as i64);
    q = q.bind(offset as i64);
    let rows = match q.fetch_all(&*pool).await {
        Ok(rows) => rows,
        Err(e) => {
            // println!("[get_sold_products_analytics] SQL error: {}", e);
            return Err(e.to_string());
        }
    };
    let products = rows.into_iter().map(|row| SoldProduct {
        product_name: row.try_get("product_name").unwrap_or_default(),
        client_name: row.try_get("client_name").unwrap_or_default(),
        thickness: row.try_get("thickness").unwrap_or(0.0),
        width: row.try_get("width").unwrap_or(0.0),
        quantity: row.get("quantity"),
        weight: row.try_get("weight").unwrap_or(0.0),
        unit_price: row.try_get("unit_price").unwrap_or(0.0),
        total_price: row.try_get("total_price").unwrap_or(0.0),
        invoice_number: row.try_get("invoice_number").unwrap_or_default(),
        sale_date: row.try_get("sale_date").unwrap_or_default(),
        payment_status: row.try_get("payment_status").unwrap_or_default(),
    }).collect();
    Ok(SoldProductsAnalyticsResult { rows: products, total })
}

#[tauri::command]
pub async fn get_sold_products_summary(
    filter: SoldProductsFilter,
    pool: tauri::State<'_, SqlitePool>,
) -> Result<SoldProductsSummary, String> {
    // Build WHERE clause and params as before
    let mut where_clause = String::from("WHERE 1=1");
    let mut params: Vec<String> = Vec::new();
    if let Some(ref start) = filter.start_date {
        where_clause.push_str(" AND s.date >= ?");
        params.push(start.clone());
    }
    if let Some(ref end) = filter.end_date {
        where_clause.push_str(" AND s.date <= ?");
        params.push(end.clone());
    }
    if let Some(ref pt) = filter.product_type {
        where_clause.push_str(" AND si.product_type = ?");
        params.push(pt.clone());
    }
    if let Some(ref cid) = filter.client_id {
        where_clause.push_str(" AND s.client_id = ?");
        params.push(cid.clone());
    }
    if let Some(ref thicknesses) = filter.thickness {
        if !thicknesses.is_empty() {
            let placeholders = vec!["?"; thicknesses.len()].join(", ");
            where_clause.push_str(&format!(" AND si.coil_thickness IN ({})", placeholders));
            for t in thicknesses {
                params.push(t.to_string());
            }
        }
    }
    if let Some(ref widths) = filter.width {
        if !widths.is_empty() {
            let placeholders = vec!["?"; widths.len()].join(", ");
            where_clause.push_str(&format!(" AND si.coil_width IN ({})", placeholders));
            for w in widths {
                params.push(w.to_string());
            }
        }
    }
    if let Some(min) = filter.unit_price_min {
        where_clause.push_str(" AND si.price_per_ton >= ?");
        params.push(min.to_string());
    }
    if let Some(max) = filter.unit_price_max {
        where_clause.push_str(" AND si.price_per_ton <= ?");
        params.push(max.to_string());
    }
    if let Some(ref status) = filter.payment_status {
        if status == "paid" {
            where_clause.push_str(" AND i.is_paid = 1");
        } else if status == "unpaid" {
            where_clause.push_str(" AND (i.is_paid = 0 OR i.is_paid IS NULL)");
        }
    }
    // Item-level total (legacy)
    let item_query = format!(r#"
        SELECT
            SUM(si.coil_weight) as total_weight,
            SUM(si.total_amount * 1.19) as item_total_revenue,
            SUM(si.quantity) as total_quantity,
            COUNT(DISTINCT si.description) as unique_products,
            COUNT(DISTINCT s.client_id) as unique_clients,
            AVG(s.total_amount) as average_order_value
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN clients c ON s.client_id = c.id
        LEFT JOIN invoices i ON s.invoice_id = i.id
        {}
    "#, where_clause);
    let mut item_q = sqlx::query(&item_query);
    for v in &params {
        item_q = item_q.bind(v);
    }
    let item_row = item_q.fetch_one(&*pool).await.map_err(|e| e.to_string())?;
    let total_weight: f64 = item_row.try_get("total_weight").unwrap_or(0.0);
    let item_total_revenue: f64 = item_row.try_get("item_total_revenue").unwrap_or(0.0);
    let total_quantity: f64 = item_row.try_get("total_quantity").unwrap_or(0.0);
    let unique_products: i64 = item_row.try_get("unique_products").unwrap_or(0);
    let unique_clients: i64 = item_row.try_get("unique_clients").unwrap_or(0);
    let average_order_value: f64 = item_row.try_get("average_order_value").unwrap_or(0.0);
    // Official total: sum sales.total_amount_ttc for matching sales
    let mut sales_where = String::from("WHERE is_deleted = 0 OR is_deleted IS NULL");
    let mut sales_params: Vec<String> = Vec::new();
    if let Some(ref start) = filter.start_date {
        sales_where.push_str(" AND date >= ?");
        sales_params.push(start.clone());
    }
    if let Some(ref end) = filter.end_date {
        sales_where.push_str(" AND date <= ?");
        sales_params.push(end.clone());
    }
    if let Some(ref cid) = filter.client_id {
        sales_where.push_str(" AND client_id = ?");
        sales_params.push(cid.clone());
    }
    // If product/thickness/width filters are present, restrict to sales that have at least one matching item
    let mut restrict_to_sales = false;
    if filter.product_type.is_some() || (filter.thickness.is_some() && !filter.thickness.as_ref().unwrap().is_empty()) || (filter.width.is_some() && !filter.width.as_ref().unwrap().is_empty()) {
        restrict_to_sales = true;
    }
    let official_total_revenue = if restrict_to_sales {
        // Find sale_ids matching the item filters
        let mut sale_ids_query = format!("SELECT DISTINCT s.id FROM sales s JOIN sale_items si ON si.sale_id = s.id {}", where_clause);
        let mut sale_ids_q = sqlx::query(&sale_ids_query);
        for v in &params {
            sale_ids_q = sale_ids_q.bind(v);
        }
        let sale_ids_rows = sale_ids_q.fetch_all(&*pool).await.map_err(|e| e.to_string())?;
        let sale_ids: Vec<String> = sale_ids_rows.into_iter().filter_map(|row| row.try_get::<String, _>("id").ok()).collect();
        if sale_ids.is_empty() {
            0.0
        } else {
            // Build a query to sum total_amount_ttc for these sales
            let placeholders = sale_ids.iter().map(|_| "?").collect::<Vec<_>>().join(", ");
            let sum_query = format!("SELECT SUM(total_amount_ttc) as official_total_revenue FROM sales WHERE id IN ({})", placeholders);
            let mut sum_q = sqlx::query(&sum_query);
            for id in &sale_ids {
                sum_q = sum_q.bind(id);
            }
            let sum_row = sum_q.fetch_one(&*pool).await.map_err(|e| e.to_string())?;
            sum_row.try_get("official_total_revenue").unwrap_or(0.0)
        }
    } else {
        // No product/thickness/width filter: sum all matching sales
        let sum_query = format!("SELECT SUM(total_amount_ttc) as official_total_revenue FROM sales {}", sales_where);
        let mut sum_q = sqlx::query(&sum_query);
        for v in &sales_params {
            sum_q = sum_q.bind(v);
        }
        let sum_row = sum_q.fetch_one(&*pool).await.map_err(|e| e.to_string())?;
        sum_row.try_get("official_total_revenue").unwrap_or(0.0)
    };
    Ok(SoldProductsSummary {
        total_weight,
        total_revenue: item_total_revenue, // legacy
        official_total_revenue,
        item_total_revenue,
        total_quantity,
        unique_products,
        unique_clients,
        average_order_value,
    })
}

#[tauri::command]
pub async fn get_unique_thickness_width(
    pool: tauri::State<'_, SqlitePool>
) -> Result<(Vec<f64>, Vec<f64>), String> {
    // Fetch unique thicknesses
    let thickness_rows = sqlx::query("SELECT DISTINCT coil_thickness FROM sale_items WHERE coil_thickness IS NOT NULL ORDER BY coil_thickness ASC")
        .fetch_all(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    // Fetch unique widths
    let width_rows = sqlx::query("SELECT DISTINCT coil_width FROM sale_items WHERE coil_width IS NOT NULL ORDER BY coil_width ASC")
        .fetch_all(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    // Map to Vec<f64>
    let thicknesses = thickness_rows
        .into_iter()
        .filter_map(|row| row.try_get::<f64, _>("coil_thickness").ok())
        .collect::<Vec<f64>>();
    let widths = width_rows
        .into_iter()
        .filter_map(|row| row.try_get::<f64, _>("coil_width").ok())
        .collect::<Vec<f64>>();
    Ok((thicknesses, widths))
}

// --- Summary Structs ---
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ClientSummary {
    pub id: String,
    pub name: String,
    pub company: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub rib: Option<String>,
    pub credit: Option<f64>,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub total_sales_volume: f64,
    pub last_sale_date: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SaleSummary {
    pub id: String,
    pub client_id: String,
    pub date: String,
    pub total_amount: f64,
    pub payment_method: Option<String>,
    pub payment_status: Option<String>,
    pub is_invoiced: bool,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub client_name: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct InvoiceSummary {
    pub id: String,
    pub client_id: String,
    pub date: String,
    pub due_date: String,
    pub total_amount: f64,
    pub status: String,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub client_name: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct DashboardStats {
    pub total_revenue: f64,
    pub sales_count: i64,
    pub monthly_revenue: f64,
    pub monthly_sales_count: i64,
    pub new_clients: i64,
    pub overdue_invoices: i64,
    pub unpaid_invoices: i64,
}

// --- Summary Commands ---

#[tauri::command]
pub async fn get_clients_summary(pool: tauri::State<'_, SqlitePool>) -> Result<Vec<ClientSummary>, String> {
    let rows = sqlx::query_as::<_, ClientSummary>(
        r#"
        SELECT
            c.id,
            c.name,
            c.company,
            c.email,
            c.phone,
            c.address,
            c.rib,
            c.credit_balance as credit,
            c.created_at,
            c.updated_at,
            COALESCE(SUM(s.total_amount), 0.0) AS total_sales_volume,
            MAX(s.date) AS last_sale_date
        FROM
            clients c
        LEFT JOIN
            sales s ON c.id = s.client_id AND s.deleted_at IS NULL
        WHERE
            c.deleted_at IS NULL
        GROUP BY
            c.id
        ORDER BY
            c.name ASC
        "#
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(rows)
}

#[tauri::command]
pub async fn get_sales_summary(pool: tauri::State<'_, SqlitePool>, limit: i64, offset: i64) -> Result<Vec<SaleSummary>, String> {
    let rows = sqlx::query_as::<_, SaleSummary>(
        r#"
        SELECT
            s.id,
            s.client_id,
            s.date,
            s.total_amount,
            s.payment_method,
            s.payment_status,
            s.is_invoiced,
            s.created_at,
            s.updated_at,
            c.name as client_name
        FROM
            sales s
        JOIN
            clients c ON s.client_id = c.id
        WHERE
            s.deleted_at IS NULL
        ORDER BY
            s.date DESC
        LIMIT ? OFFSET ?
        "#
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(rows)
}

#[tauri::command]
pub async fn get_invoices_summary(pool: tauri::State<'_, SqlitePool>, limit: i64, offset: i64) -> Result<Vec<InvoiceSummary>, String> {
    let rows = sqlx::query_as::<_, InvoiceSummary>(
        r#"
        SELECT
            i.id,
            i.client_id,
            i.date,
            i.due_date,
            i.total_amount_ttc as total_amount,
            i.status,
            i.created_at,
            i.updated_at,
            c.name as client_name
        FROM
            invoices i
        JOIN
            clients c ON i.client_id = c.id
        WHERE
            i.deleted_at IS NULL
        ORDER BY
            i.date DESC
        LIMIT ? OFFSET ?
        "#
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(rows)
}




#[tauri::command]
pub async fn get_dashboard_stats(pool: tauri::State<'_, SqlitePool>) -> Result<DashboardStats, String> {
    // This query now uses `is_deleted` which matches your schema.
    // It also uses `query_as!` for safe, direct mapping to the struct.
    let stats = sqlx::query_as::<_, DashboardStats>(
        r#"
        WITH
          AllTimeSales AS (
            SELECT
              COALESCE(SUM(total_amount_ttc), 0.0) AS total_revenue,
              COUNT(id) AS sales_count
            FROM sales
            WHERE is_deleted = 0 OR is_deleted IS NULL
          ),
          MonthlySales AS (
            SELECT
              COALESCE(SUM(total_amount_ttc), 0.0) AS monthly_revenue,
              COUNT(id) AS monthly_sales_count
            FROM sales
            WHERE (strftime('%Y-%m', date) = strftime('%Y-%m', 'now', 'localtime'))
              AND (is_deleted = 0 OR is_deleted IS NULL)
          ),
          NewClients AS (
            SELECT COUNT(id) AS new_clients
            FROM clients
            WHERE (strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime'))
              AND (is_deleted = 0 OR is_deleted IS NULL)
          ),
          InvoiceStats AS (
            SELECT
              COUNT(CASE WHEN is_paid = 0 AND due_date < date('now', 'localtime') THEN 1 END) AS overdue_invoices,
              COUNT(CASE WHEN is_paid = 0 AND due_date >= date('now', 'localtime') THEN 1 END) AS unpaid_invoices
            FROM invoices
            WHERE is_deleted = 0 OR is_deleted IS NULL
          )
        SELECT
          AllTimeSales.total_revenue,
          AllTimeSales.sales_count,
          MonthlySales.monthly_revenue,
          MonthlySales.monthly_sales_count,
          NewClients.new_clients,
          InvoiceStats.overdue_invoices,
          InvoiceStats.unpaid_invoices
        FROM AllTimeSales, MonthlySales, NewClients, InvoiceStats
        "#
    )
    .fetch_one(&*pool)
    .await
    .map_err(|e| {
        println!("[DEBUG][get_dashboard_stats] SQL error: {:?}", e);
        e.to_string()
    })?;

    Ok(stats)
}

    