-- Trigger: Automatically update invoices.is_paid and invoices.paid_at after payment changes

CREATE TRIGGER update_invoice_payment_status_after_insert
AFTER INSERT ON payments
FOR EACH ROW
WHEN NEW.invoice_id IS NOT NULL
BEGIN
  UPDATE invoices
  SET
    is_paid = (
      SELECT
        CASE
          WHEN IFNULL(SUM(amount), 0) >= invoices.total_amount_ttc THEN 1
          ELSE 0
        END
      FROM payments
      WHERE invoice_id = NEW.invoice_id AND is_deleted = 0
    ),
    paid_at = (
      SELECT
        CASE
          WHEN IFNULL(SUM(amount), 0) >= invoices.total_amount_ttc THEN CURRENT_TIMESTAMP
          ELSE NULL
        END
      FROM payments
      WHERE invoice_id = NEW.invoice_id AND is_deleted = 0
    )
  WHERE id = NEW.invoice_id AND is_deleted = 0;
END;

CREATE TRIGGER update_invoice_payment_status_after_update
AFTER UPDATE ON payments
FOR EACH ROW
WHEN NEW.invoice_id IS NOT NULL
BEGIN
  UPDATE invoices
  SET
    is_paid = (
      SELECT
        CASE
          WHEN IFNULL(SUM(amount), 0) >= invoices.total_amount_ttc THEN 1
          ELSE 0
        END
      FROM payments
      WHERE invoice_id = NEW.invoice_id AND is_deleted = 0
    ),
    paid_at = (
      SELECT
        CASE
          WHEN IFNULL(SUM(amount), 0) >= invoices.total_amount_ttc THEN CURRENT_TIMESTAMP
          ELSE NULL
        END
      FROM payments
      WHERE invoice_id = NEW.invoice_id AND is_deleted = 0
    )
  WHERE id = NEW.invoice_id AND is_deleted = 0;
END;

CREATE TRIGGER update_invoice_payment_status_after_delete
AFTER DELETE ON payments
FOR EACH ROW
WHEN OLD.invoice_id IS NOT NULL
BEGIN
  UPDATE invoices
  SET
    is_paid = (
      SELECT
        CASE
          WHEN IFNULL(SUM(amount), 0) >= invoices.total_amount_ttc THEN 1
          ELSE 0
        END
      FROM payments
      WHERE invoice_id = OLD.invoice_id AND is_deleted = 0
    ),
    paid_at = (
      SELECT
        CASE
          WHEN IFNULL(SUM(amount), 0) >= invoices.total_amount_ttc THEN CURRENT_TIMESTAMP
          ELSE NULL
        END
      FROM payments
      WHERE invoice_id = OLD.invoice_id AND is_deleted = 0
    )
  WHERE id = OLD.invoice_id AND is_deleted = 0;
END; 