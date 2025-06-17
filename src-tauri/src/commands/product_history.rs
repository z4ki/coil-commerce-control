use crate::{
    models::product_history::{
        CreateProductHistoryRequest, CreateProductHistoryResponse, GetProductHistoryResponse,
        ProductHistory,
    },
    AppState,
};
use sqlx::Row;
use tauri::State;

#[tauri::command]
pub async fn get_product_history(
    state: State<'_, AppState>,
    product_id: String,
) -> Result<GetProductHistoryResponse, String> {
    let history = sqlx::query_as::<_, ProductHistory>(
        r#"
        SELECT * FROM product_history
        WHERE product_id = ?
        ORDER BY timestamp DESC
        "#,
    )
    .bind(&product_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(GetProductHistoryResponse { history })
}

#[tauri::command]
pub async fn create_product_history(
    state: State<'_, AppState>,
    request: CreateProductHistoryRequest,
) -> Result<CreateProductHistoryResponse, String> {
    let changes_json = serde_json::to_value(request.changes).map_err(|e| e.to_string())?;

    let result = sqlx::query(
        r#"
        INSERT INTO product_history (product_id, user_id, changes)
        VALUES (?, ?, ?)
        RETURNING id, timestamp
        "#,
    )
    .bind(&request.product_id)
    .bind(&request.user_id)
    .bind(changes_json)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    let id: String = result.get("id");
    let timestamp: chrono::DateTime<chrono::Utc> = result.get("timestamp");

    Ok(CreateProductHistoryResponse { id, timestamp })
} 