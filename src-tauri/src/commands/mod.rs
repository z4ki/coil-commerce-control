use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use chrono::{DateTime, Utc};
use uuid::Uuid;

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
}

// Client commands
#[tauri::command]
pub async fn get_clients(pool: tauri::State<'_, SqlitePool>) -> Result<Vec<Client>, String> {
    let clients = sqlx::query(
        r#"
        SELECT 
            id, name, company, email, phone, address, notes, nif, nis, rc, ai, rib,
            credit_balance, created_at, updated_at
        FROM clients 
        ORDER BY name
        "#
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    
    let clients: Vec<Client> = clients
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
    
    Ok(clients)
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
    
    // Build dynamic update query
    let mut query = String::from("UPDATE clients SET updated_at = ?");
    let mut params: Vec<Box<dyn sqlx::Encode<'_, sqlx::Sqlite> + Send + Sync>> = vec![Box::new(now)];
    
    if let Some(name) = client.name {
        query.push_str(", name = ?");
        params.push(Box::new(name));
    }
    if let Some(company) = client.company {
        query.push_str(", company = ?");
        params.push(Box::new(company));
    }
    if let Some(email) = client.email {
        query.push_str(", email = ?");
        params.push(Box::new(email));
    }
    if let Some(phone) = client.phone {
        query.push_str(", phone = ?");
        params.push(Box::new(phone));
    }
    if let Some(address) = client.address {
        query.push_str(", address = ?");
        params.push(Box::new(address));
    }
    if let Some(notes) = client.notes {
        query.push_str(", notes = ?");
        params.push(Box::new(notes));
    }
    if let Some(nif) = client.nif {
        query.push_str(", nif = ?");
        params.push(Box::new(nif));
    }
    if let Some(nis) = client.nis {
        query.push_str(", nis = ?");
        params.push(Box::new(nis));
    }
    if let Some(rc) = client.rc {
        query.push_str(", rc = ?");
        params.push(Box::new(rc));
    }
    if let Some(ai) = client.ai {
        query.push_str(", ai = ?");
        params.push(Box::new(ai));
    }
    if let Some(rib) = client.rib {
        query.push_str(", rib = ?");
        params.push(Box::new(rib));
    }
    
    query.push_str(" WHERE id = ?");
    params.push(Box::new(id));
    
    sqlx::query(&query)
        .bind(params)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    
    // Fetch the updated client
    let updated_client = get_client_by_id(id, pool).await?
        .ok_or_else(|| "Client not found after update".to_string())?;
    
    Ok(updated_client)
}

// Sale commands
#[tauri::command]
pub async fn get_sales(pool: tauri::State<'_, SqlitePool>) -> Result<Vec<Sale>, String> {
    // Implementation needed
    unimplemented!()
}

#[tauri::command]
pub async fn get_sale_by_id(
    id: String,
    pool: tauri::State<'_, SqlitePool>
) -> Result<Option<Sale>, String> {
    // Implementation needed
    unimplemented!()
}

#[tauri::command]
pub async fn create_sale(
    sale: CreateSaleRequest,
    pool: tauri::State<'_, SqlitePool>
) -> Result<Sale, String> {
    // Implementation needed
    unimplemented!()
}

#[tauri::command]
pub async fn delete_sale(
    id: String,
    pool: tauri::State<'_, SqlitePool>
) -> Result<(), String> {
    // Implementation needed
    unimplemented!()
}