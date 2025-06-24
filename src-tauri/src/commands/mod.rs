    use serde::{Deserialize, Serialize};
    use sqlx::SqlitePool;
    use sqlx::Row;
    use chrono::{DateTime, Utc};
    use uuid::Uuid;
    use serde_json;

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
        pub product_type: String,
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
            .bind(id)
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // Sale commands
    #[tauri::command]
    pub async fn get_sales(pool: tauri::State<'_, SqlitePool>) -> Result<Vec<Sale>, String> {
        let sales_rows = sqlx::query(
            r#"SELECT * FROM sales WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY date DESC"#
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
                items,
            });
        }
        Ok(sales)
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
        let sale_id = Uuid::new_v4().to_string();
        let now = Utc::now();
        sqlx::query(
            r#"INSERT INTO sales (
                id, client_id, date, total_amount, total_amount_ttc, is_invoiced, invoice_id, notes, payment_method, transportation_fee, tax_rate, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#
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
        let now = Utc::now();
        sqlx::query(
            r#"UPDATE sales SET client_id = ?, date = ?, total_amount = ?, total_amount_ttc = ?, is_invoiced = ?, invoice_id = ?, notes = ?, payment_method = ?, transportation_fee = ?, tax_rate = ?, updated_at = ? WHERE id = ?"#
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
        .bind(now)
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;
        // Delete old items
        sqlx::query("DELETE FROM sale_items WHERE sale_id = ?")
            .bind(&id)
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
        // Insert new items
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
            .map_err(|e| e.to_string())?;
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
        sqlx::query("UPDATE sales SET is_deleted = 1, deleted_at = ? WHERE id = ?")
            .bind(&now)
            .bind(&id)
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
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

    #[tauri::command]
    pub async fn get_invoices(pool: tauri::State<'_, SqlitePool>) -> Result<Vec<serde_json::Value>, String> {
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
                    "sales_ids": sales_ids_array
                })
            })
            .collect();

        Ok(invoices)
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
        })
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

    #[tauri::command]
    pub async fn delete_invoice(
        id: String,
        pool: tauri::State<'_, SqlitePool>
    ) -> Result<(), String> {
        // Unmark all related sales as invoiced
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
    }

    #[tauri::command]
    pub async fn create_payment(
        mut payment: CreatePaymentRequest,
        pool: tauri::State<'_, SqlitePool>
    ) -> Result<Payment, String> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        // If sale_id is provided and no invoice_id, check if the sale is invoiced
        if let (Some(sale_id), None) = (&payment.sale_id, &payment.invoice_id) {
            let row = sqlx::query!("SELECT invoice_id FROM sales WHERE id = ?", sale_id)
                .fetch_optional(&*pool)
                .await
                .map_err(|e| e.to_string())?;
            if let Some(r) = row {
                if let Some(inv_id) = r.invoice_id {
                    payment.invoice_id = Some(inv_id);
                }
            }
        }

        sqlx::query(
            r#"INSERT INTO payments (
                id, sale_id, invoice_id, client_id, amount, date, method, notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#
        )
        .bind(&id)
        .bind(&payment.sale_id)
        .bind(&payment.invoice_id)
        .bind(&payment.client_id)
        .bind(payment.amount)
        .bind(&payment.date)
        .bind(&payment.method)
        .bind(&payment.notes)
        .bind(&now)
        .bind(&now)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

        Ok(Payment {
            id,
            sale_id: payment.sale_id,
            invoice_id: payment.invoice_id,
            client_id: payment.client_id,
            amount: payment.amount,
            date: payment.date,
            method: payment.method,
            notes: payment.notes,
            created_at: now.clone(),
            updated_at: Some(now),
            is_deleted: Some(false),
            deleted_at: None,
        })
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
        Ok(())
    }

    #[tauri::command]
    pub async fn restore_invoice(id: String, pool: tauri::State<'_, SqlitePool>) -> Result<(), String> {
        sqlx::query("UPDATE invoices SET is_deleted = 0, deleted_at = NULL WHERE id = ?")
            .bind(&id)
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub async fn restore_sale(id: String, pool: tauri::State<'_, SqlitePool>) -> Result<(), String> {
        sqlx::query("UPDATE sales SET is_deleted = 0, deleted_at = NULL WHERE id = ?")
            .bind(&id)
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub async fn restore_payment(id: String, pool: tauri::State<'_, SqlitePool>) -> Result<(), String> {
        sqlx::query("UPDATE payments SET is_deleted = 0, deleted_at = NULL WHERE id = ?")
            .bind(&id)
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
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
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            is_deleted: row.get("is_deleted"),
            deleted_at: row.get("deleted_at"),
        }).collect();
        Ok(payments)
    }