use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ProductHistory {
    pub id: String,
    pub product_id: String,
    pub timestamp: DateTime<Utc>,
    pub user_id: String,
    pub changes: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProductHistoryChange {
    pub field: String,
    pub old_value: serde_json::Value,
    pub new_value: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProductHistoryRequest {
    pub product_id: String,
    pub user_id: String,
    pub changes: Vec<ProductHistoryChange>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetProductHistoryResponse {
    pub history: Vec<ProductHistory>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProductHistoryResponse {
    pub id: String,
    pub timestamp: DateTime<Utc>,
} 