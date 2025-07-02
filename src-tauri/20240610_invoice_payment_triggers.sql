-- Remove old triggers if they exist
DROP TRIGGER IF EXISTS update_invoice_payment_status_after_insert;
DROP TRIGGER IF EXISTS update_invoice_payment_status_after_update;
DROP TRIGGER IF EXISTS update_invoice_payment_status_after_delete;

-- New trigger: After INSERT on payments
CREATE TRIGGER update_invoice_payment_status_after_payment_insert
AFTER INSERT ON payments
FOR EACH ROW
WHEN NEW.sale_id IS NOT NULL
BEGIN
  UPDATE invoices
  SET
    is_paid = (
      SELECT CASE
        WHEN IFNULL((
          SELECT SUM(p.amount)
          FROM invoice_sales s
          JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
          WHERE s.invoice_id = invoices.id
        ), 0) >= invoices.total_amount_ttc THEN 1
        ELSE 0
      END
    ),
    paid_at = (
      SELECT CASE
        WHEN IFNULL((
          SELECT SUM(p.amount)
          FROM invoice_sales s
          JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
          WHERE s.invoice_id = invoices.id
        ), 0) >= invoices.total_amount_ttc THEN CURRENT_TIMESTAMP
        ELSE NULL
      END
    )
  WHERE id IN (
    SELECT invoice_id FROM invoice_sales WHERE sale_id = NEW.sale_id
  ) AND is_deleted = 0;
END;

-- New trigger: After UPDATE on payments
CREATE TRIGGER update_invoice_payment_status_after_payment_update
AFTER UPDATE ON payments
FOR EACH ROW
WHEN NEW.sale_id IS NOT NULL
BEGIN
  UPDATE invoices
  SET
    is_paid = (
      SELECT CASE
        WHEN IFNULL((
          SELECT SUM(p.amount)
          FROM invoice_sales s
          JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
          WHERE s.invoice_id = invoices.id
        ), 0) >= invoices.total_amount_ttc THEN 1
        ELSE 0
      END
    ),
    paid_at = (
      SELECT CASE
        WHEN IFNULL((
          SELECT SUM(p.amount)
          FROM invoice_sales s
          JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
          WHERE s.invoice_id = invoices.id
        ), 0) >= invoices.total_amount_ttc THEN CURRENT_TIMESTAMP
        ELSE NULL
      END
    )
  WHERE id IN (
    SELECT invoice_id FROM invoice_sales WHERE sale_id = NEW.sale_id
  ) AND is_deleted = 0;
END;

-- New trigger: After DELETE on payments
CREATE TRIGGER update_invoice_payment_status_after_payment_delete
AFTER DELETE ON payments
FOR EACH ROW
WHEN OLD.sale_id IS NOT NULL
BEGIN
  UPDATE invoices
  SET
    is_paid = (
      SELECT CASE
        WHEN IFNULL((
          SELECT SUM(p.amount)
          FROM invoice_sales s
          JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
          WHERE s.invoice_id = invoices.id
        ), 0) >= invoices.total_amount_ttc THEN 1
        ELSE 0
      END
    ),
    paid_at = (
      SELECT CASE
        WHEN IFNULL((
          SELECT SUM(p.amount)
          FROM invoice_sales s
          JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
          WHERE s.invoice_id = invoices.id
        ), 0) >= invoices.total_amount_ttc THEN CURRENT_TIMESTAMP
        ELSE NULL
      END
    )
  WHERE id IN (
    SELECT invoice_id FROM invoice_sales WHERE sale_id = OLD.sale_id
  ) AND is_deleted = 0;
END; 