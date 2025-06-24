use sqlx::{Connection, Executor, SqliteConnection, Row};

#[tokio::test]
async fn test_invoice_payment_triggers() -> Result<(), Box<dyn std::error::Error>> {
    // Use an in-memory SQLite database for isolation
    let mut conn = SqliteConnection::connect(":memory:").await?;

    // 1. Run all your schema and trigger migrations
    let migrations = vec![
        include_str!("../migrations/001_basic.sql"),
        include_str!("../migrations/20240609_add_soft_delete_to_entities.sql"),
        include_str!("../migrations/20240610_invoice_payment_triggers.sql"),
    ];
    for migration in migrations {
        conn.execute(migration).await?;
    }

    // Test 1: Adding a payment that makes invoice fully paid
    conn.execute("DELETE FROM payments; DELETE FROM invoice_sales; DELETE FROM sales; DELETE FROM invoices;").await?;
    conn.execute("INSERT INTO invoices (id, invoice_number, client_id, date, due_date, total_amount_ht, total_amount_ttc, is_paid, paid_at, is_deleted, created_at, updated_at) VALUES ('inv1', 'INV-001', 'cli1', '2024-06-10', '2024-06-20', 100, 120, 0, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);").await?;
    conn.execute("INSERT INTO sales (id, client_id, date, total_amount, total_amount_ttc, is_invoiced, invoice_id, is_deleted, created_at, updated_at) VALUES ('sale1', 'cli1', '2024-06-10', 100, 120, 1, 'inv1', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);").await?;
    conn.execute("INSERT INTO invoice_sales (id, invoice_id, sale_id, created_at) VALUES ('is1', 'inv1', 'sale1', CURRENT_TIMESTAMP);").await?;
    conn.execute("INSERT INTO payments (id, sale_id, client_id, amount, date, method, is_deleted, created_at, updated_at) VALUES ('pay1', 'sale1', 'cli1', 120, '2024-06-11', 'cash', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);").await?;
    let row = sqlx::query("SELECT is_paid, paid_at FROM invoices WHERE id = 'inv1'")
        .fetch_one(&mut conn)
        .await?;
    assert_eq!(row.get::<i64, _>("is_paid"), 1, "Test 1: Invoice should be paid");
    assert!(row.get::<Option<String>, _>("paid_at").is_some(), "Test 1: paid_at should be set");

    // Test 2: Adding a payment that makes invoice partially paid
    conn.execute("DELETE FROM payments; UPDATE invoices SET is_paid = 0, paid_at = NULL WHERE id = 'inv1';").await?;
    conn.execute("INSERT INTO payments (id, sale_id, client_id, amount, date, method, is_deleted, created_at, updated_at) VALUES ('pay2', 'sale1', 'cli1', 60, '2024-06-12', 'cash', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);").await?;
    let row = sqlx::query("SELECT is_paid, paid_at FROM invoices WHERE id = 'inv1'")
        .fetch_one(&mut conn)
        .await?;
    assert_eq!(row.get::<i64, _>("is_paid"), 0, "Test 2: Invoice should be unpaid");
    assert!(row.get::<Option<String>, _>("paid_at").is_none(), "Test 2: paid_at should be NULL");

    // Test 3: Modifying payment amount (up to fully paid)
    conn.execute("UPDATE payments SET amount = 120 WHERE id = 'pay2';").await?;
    let row = sqlx::query("SELECT is_paid, paid_at FROM invoices WHERE id = 'inv1'")
        .fetch_one(&mut conn)
        .await?;
    assert_eq!(row.get::<i64, _>("is_paid"), 1, "Test 3: Invoice should be paid");
    assert!(row.get::<Option<String>, _>("paid_at").is_some(), "Test 3: paid_at should be set");

    // Test 4: Modifying payment amount (down to partially paid)
    conn.execute("UPDATE payments SET amount = 50 WHERE id = 'pay2';").await?;
    let row = sqlx::query("SELECT is_paid, paid_at FROM invoices WHERE id = 'inv1'")
        .fetch_one(&mut conn)
        .await?;
    assert_eq!(row.get::<i64, _>("is_paid"), 0, "Test 4: Invoice should be unpaid");
    assert!(row.get::<Option<String>, _>("paid_at").is_none(), "Test 4: paid_at should be NULL");

    // Test 5: Soft deleting a payment that makes invoice unpaid
    conn.execute("UPDATE payments SET is_deleted = 1 WHERE id = 'pay2';").await?;
    let row = sqlx::query("SELECT is_paid, paid_at FROM invoices WHERE id = 'inv1'")
        .fetch_one(&mut conn)
        .await?;
    assert_eq!(row.get::<i64, _>("is_paid"), 0, "Test 5: Invoice should be unpaid after soft delete");
    assert!(row.get::<Option<String>, _>("paid_at").is_none(), "Test 5: paid_at should be NULL after soft delete");

    // Test 6: Restoring a payment that makes invoice paid again
    conn.execute("UPDATE payments SET is_deleted = 0 WHERE id = 'pay2';").await?;
    let row = sqlx::query("SELECT is_paid, paid_at FROM invoices WHERE id = 'inv1'")
        .fetch_one(&mut conn)
        .await?;
    assert_eq!(row.get::<i64, _>("is_paid"), 1, "Test 6: Invoice should be paid after restore");
    assert!(row.get::<Option<String>, _>("paid_at").is_some(), "Test 6: paid_at should be set after restore");

    // Test 7: Changing invoice total to affect payment status (raise total)
    conn.execute("UPDATE invoices SET total_amount_ttc = 200 WHERE id = 'inv1';").await?;
    let row = sqlx::query("SELECT is_paid, paid_at FROM invoices WHERE id = 'inv1'")
        .fetch_one(&mut conn)
        .await?;
    assert_eq!(row.get::<i64, _>("is_paid"), 0, "Test 7: Invoice should be unpaid after raising total");
    assert!(row.get::<Option<String>, _>("paid_at").is_none(), "Test 7: paid_at should be NULL after raising total");

    // Test 8: Changing invoice total to affect payment status (lower total)
    conn.execute("UPDATE invoices SET total_amount_ttc = 50 WHERE id = 'inv1';").await?;
    let row = sqlx::query("SELECT is_paid, paid_at FROM invoices WHERE id = 'inv1'")
        .fetch_one(&mut conn)
        .await?;
    assert_eq!(row.get::<i64, _>("is_paid"), 1, "Test 8: Invoice should be paid after lowering total");
    assert!(row.get::<Option<String>, _>("paid_at").is_some(), "Test 8: paid_at should be set after lowering total");

    // Test 9: Multiple payments on same invoice
    conn.execute("UPDATE invoices SET total_amount_ttc = 120 WHERE id = 'inv1';").await?;
    conn.execute("DELETE FROM payments;").await?;
    conn.execute("INSERT INTO payments (id, sale_id, client_id, amount, date, method, is_deleted, created_at, updated_at) VALUES ('pay3', 'sale1', 'cli1', 60, '2024-06-13', 'cash', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), ('pay4', 'sale1', 'cli1', 60, '2024-06-14', 'cash', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);").await?;
    let row = sqlx::query("SELECT is_paid, paid_at FROM invoices WHERE id = 'inv1'")
        .fetch_one(&mut conn)
        .await?;
    assert_eq!(row.get::<i64, _>("is_paid"), 1, "Test 9: Invoice should be paid with multiple payments");
    assert!(row.get::<Option<String>, _>("paid_at").is_some(), "Test 9: paid_at should be set with multiple payments");

    // Test 10: Invoice with multiple sales
    conn.execute("DELETE FROM payments; DELETE FROM invoice_sales; DELETE FROM sales; DELETE FROM invoices;").await?;
    conn.execute("INSERT INTO invoices (id, invoice_number, client_id, date, due_date, total_amount_ht, total_amount_ttc, is_paid, paid_at, is_deleted, created_at, updated_at) VALUES ('inv2', 'INV-002', 'cli1', '2024-06-10', '2024-06-20', 200, 240, 0, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);").await?;
    conn.execute("INSERT INTO sales (id, client_id, date, total_amount, total_amount_ttc, is_invoiced, invoice_id, is_deleted, created_at, updated_at) VALUES ('sale2', 'cli1', '2024-06-10', 100, 120, 1, 'inv2', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), ('sale3', 'cli1', '2024-06-10', 100, 120, 1, 'inv2', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);").await?;
    conn.execute("INSERT INTO invoice_sales (id, invoice_id, sale_id, created_at) VALUES ('is2', 'inv2', 'sale2', CURRENT_TIMESTAMP), ('is3', 'inv2', 'sale3', CURRENT_TIMESTAMP);").await?;
    conn.execute("INSERT INTO payments (id, sale_id, client_id, amount, date, method, is_deleted, created_at, updated_at) VALUES ('pay5', 'sale2', 'cli1', 120, '2024-06-15', 'cash', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), ('pay6', 'sale3', 'cli1', 120, '2024-06-16', 'cash', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);").await?;
    let row = sqlx::query("SELECT is_paid, paid_at FROM invoices WHERE id = 'inv2'")
        .fetch_one(&mut conn)
        .await?;
    assert_eq!(row.get::<i64, _>("is_paid"), 1, "Test 10: Invoice with multiple sales should be paid");
    assert!(row.get::<Option<String>, _>("paid_at").is_some(), "Test 10: paid_at should be set for invoice with multiple sales");

    Ok(())
} 