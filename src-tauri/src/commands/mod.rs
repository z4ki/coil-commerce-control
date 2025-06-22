    use serde::{Deserialize, Serialize};
    use sqlx::SqlitePool;
    use sqlx::Row;
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
            r#"SELECT * FROM sales ORDER BY date DESC"#
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
            r#"SELECT * FROM sales WHERE id = ?"#
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
            let item_id = Uuid::new_v4().to_string();
            sqlx::query(
                r#"INSERT INTO sale_items (
                    id, sale_id, description, coil_ref, coil_thickness, coil_width, top_coat_ral, back_coat_ral, coil_weight, quantity, price_per_ton, total_amount, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#
            )
            .bind(&item_id)
            .bind(&sale_id)
            .bind(&item.description)
            .bind(&item.coil_ref)
            .bind(item.coil_thickness)
            .bind(item.coil_width)
            .bind(&item.top_coat_ral)
            .bind(&item.back_coat_ral)
            .bind(item.coil_weight)
            .bind(item.quantity)
            .bind(item.price_per_ton)
            .bind(item.total_amount)
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
            let item_id = Uuid::new_v4().to_string();
            sqlx::query(
                r#"INSERT INTO sale_items (
                    id, sale_id, description, coil_ref, coil_thickness, coil_width, top_coat_ral, back_coat_ral, coil_weight, quantity, price_per_ton, total_amount, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#
            )
            .bind(&item_id)
            .bind(&id)
            .bind(&item.description)
            .bind(&item.coil_ref)
            .bind(item.coil_thickness)
            .bind(item.coil_width)
            .bind(&item.top_coat_ral)
            .bind(&item.back_coat_ral)
            .bind(item.coil_weight)
            .bind(item.quantity)
            .bind(item.price_per_ton)
            .bind(item.total_amount)
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
        // Delete sale items first due to FK constraint
        sqlx::query("DELETE FROM sale_items WHERE sale_id = ?")
            .bind(&id)
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
        sqlx::query("DELETE FROM sales WHERE id = ?")
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
    }

    #[tauri::command]
    pub async fn get_invoices(pool: tauri::State<'_, SqlitePool>) -> Result<Vec<Invoice>, String> {
        let invoices = sqlx::query(
            r#"
            SELECT id, invoice_number, client_id, date, due_date, total_amount_ht, total_amount_ttc, is_paid, paid_at, created_at, updated_at
            FROM invoices
            ORDER BY date DESC
            "#
        )
        .fetch_all(&*pool)
        .await
        .map_err(|e| e.to_string())?;

        let invoices: Vec<Invoice> = invoices
            .into_iter()
            .map(|row| Invoice {
                id: row.get("id"),
                invoice_number: row.get("invoice_number"),
                client_id: row.get("client_id"),
                date: row.get("date"),
                due_date: row.get("due_date"),
                total_amount_ht: row.get("total_amount_ht"),
                total_amount_ttc: row.get("total_amount_ttc"),
                is_paid: row.get("is_paid"),
                paid_at: row.get("paid_at"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            })
            .collect();

        Ok(invoices)
    }

    #[tauri::command]
    pub async fn create_invoice(
        invoice: CreateInvoiceRequest,
        pool: tauri::State<'_, SqlitePool>
    ) -> Result<Invoice, String> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query(
            r#"
            INSERT INTO invoices (id, invoice_number, client_id, date, due_date, total_amount_ht, total_amount_ttc, is_paid, paid_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&id)
        .bind(&invoice.invoice_number)
        .bind(&invoice.client_id)
        .bind(&invoice.date)
        .bind(&invoice.due_date)
        .bind(invoice.total_amount_ht)
        .bind(invoice.total_amount_ttc)
        .bind(invoice.is_paid)
        .bind(&invoice.paid_at)
        .bind(&now)
        .bind(&now)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

        Ok(Invoice {
            id,
            invoice_number: invoice.invoice_number,
            client_id: invoice.client_id,
            date: invoice.date,
            due_date: invoice.due_date,
            total_amount_ht: invoice.total_amount_ht,
            total_amount_ttc: invoice.total_amount_ttc,
            is_paid: invoice.is_paid,
            paid_at: invoice.paid_at,
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
        sqlx::query!(
            "UPDATE sales SET is_invoiced = 0, invoice_id = NULL WHERE id = ?",
            sale_id
        )
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
        sqlx::query("DELETE FROM invoices WHERE id = ?")
            .bind(&id)
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }