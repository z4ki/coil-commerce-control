-- =====================================================
-- COMPLETE PAYMENT STATUS MANAGEMENT TRIGGERS
-- Covers ALL payment scenarios and edge cases
-- =====================================================

-- Drop all existing payment-related triggers
DROP TRIGGER IF EXISTS update_invoice_payment_status_after_payment_insert;
DROP TRIGGER IF EXISTS update_invoice_payment_status_after_payment_update;
DROP TRIGGER IF EXISTS update_invoice_payment_status_after_payment_delete;
DROP TRIGGER IF EXISTS update_sale_payment_status_after_payment_insert;
DROP TRIGGER IF EXISTS update_sale_payment_status_after_payment_update;
DROP TRIGGER IF EXISTS update_sale_payment_status_after_payment_delete;
DROP TRIGGER IF EXISTS update_invoice_status_after_sale_update;
DROP TRIGGER IF EXISTS update_sales_status_after_invoice_update;
DROP TRIGGER IF EXISTS validate_payment_references;

-- =====================================================
-- VALIDATION TRIGGER - Prevent Invalid References
-- =====================================================

CREATE TRIGGER validate_payment_references
BEFORE INSERT ON payments
FOR EACH ROW
WHEN NEW.sale_id IS NOT NULL OR NEW.invoice_id IS NOT NULL
BEGIN
  -- Validate sale_id exists and is not deleted
  SELECT CASE
    WHEN NEW.sale_id IS NOT NULL AND 
         (SELECT COUNT(*) FROM sales WHERE id = NEW.sale_id) = 0
    THEN RAISE(ABORT, 'Payment references non-existent sale')
  END;
  
  -- Validate invoice_id exists and is not deleted
  SELECT CASE
    WHEN NEW.invoice_id IS NOT NULL AND 
         (SELECT COUNT(*) FROM invoices WHERE id = NEW.invoice_id AND is_deleted = 0) = 0
    THEN RAISE(ABORT, 'Payment references non-existent or deleted invoice')
  END;
END;

-- =====================================================
-- SALE PAYMENT STATUS TRIGGERS
-- =====================================================

-- Trigger: After INSERT on payments - Update Sale Status
CREATE TRIGGER update_sale_payment_status_after_payment_insert
AFTER INSERT ON payments
FOR EACH ROW
WHEN NEW.sale_id IS NOT NULL
BEGIN
  UPDATE sales
  SET
    is_paid = (
      SELECT CASE
        WHEN IFNULL((
          SELECT SUM(p.amount)
          FROM payments p
          WHERE p.sale_id = NEW.sale_id AND p.is_deleted = 0
        ), 0) >= sales.total_amount_ttc THEN 1
        ELSE 0
      END
    ),
    paid_at = (
      SELECT CASE
        WHEN IFNULL((
          SELECT SUM(p.amount)
          FROM payments p
          WHERE p.sale_id = NEW.sale_id AND p.is_deleted = 0
        ), 0) >= sales.total_amount_ttc THEN 
          (SELECT MIN(p.created_at) FROM payments p WHERE p.sale_id = NEW.sale_id AND p.is_deleted = 0)
        ELSE NULL
      END
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.sale_id;
END;

-- Trigger: After UPDATE on payments - Update Sale Status
CREATE TRIGGER update_sale_payment_status_after_payment_update
AFTER UPDATE ON payments
FOR EACH ROW
WHEN NEW.sale_id IS NOT NULL OR OLD.sale_id IS NOT NULL
BEGIN
  -- Update the new sale if sale_id changed or was updated
  UPDATE sales
  SET
    is_paid = (
      SELECT CASE
        WHEN IFNULL((
          SELECT SUM(p.amount)
          FROM payments p
          WHERE p.sale_id = NEW.sale_id AND p.is_deleted = 0
        ), 0) >= sales.total_amount_ttc THEN 1
        ELSE 0
      END
    ),
    paid_at = (
      SELECT CASE
        WHEN IFNULL((
          SELECT SUM(p.amount)
          FROM payments p
          WHERE p.sale_id = NEW.sale_id AND p.is_deleted = 0
        ), 0) >= sales.total_amount_ttc THEN 
          (SELECT MIN(p.created_at) FROM payments p WHERE p.sale_id = NEW.sale_id AND p.is_deleted = 0)
        ELSE NULL
      END
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.sale_id AND NEW.sale_id IS NOT NULL;

  -- Update the old sale if sale_id was changed
  UPDATE sales
  SET
    is_paid = (
      SELECT CASE
        WHEN IFNULL((
          SELECT SUM(p.amount)
          FROM payments p
          WHERE p.sale_id = OLD.sale_id AND p.is_deleted = 0
        ), 0) >= sales.total_amount_ttc THEN 1
        ELSE 0
      END
    ),
    paid_at = (
      SELECT CASE
        WHEN IFNULL((
          SELECT SUM(p.amount)
          FROM payments p
          WHERE p.sale_id = OLD.sale_id AND p.is_deleted = 0
        ), 0) >= sales.total_amount_ttc THEN 
          (SELECT MIN(p.created_at) FROM payments p WHERE p.sale_id = OLD.sale_id AND p.is_deleted = 0)
        ELSE NULL
      END
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.sale_id AND OLD.sale_id IS NOT NULL AND OLD.sale_id != NEW.sale_id;
END;

-- Trigger: After DELETE on payments - Update Sale Status
CREATE TRIGGER update_sale_payment_status_after_payment_delete
AFTER DELETE ON payments
FOR EACH ROW
WHEN OLD.sale_id IS NOT NULL
BEGIN
  UPDATE sales
  SET
    is_paid = (
      SELECT CASE
        WHEN IFNULL((
          SELECT SUM(p.amount)
          FROM payments p
          WHERE p.sale_id = OLD.sale_id AND p.is_deleted = 0
        ), 0) >= sales.total_amount_ttc THEN 1
        ELSE 0
      END
    ),
    paid_at = (
      SELECT CASE
        WHEN IFNULL((
          SELECT SUM(p.amount)
          FROM payments p
          WHERE p.sale_id = OLD.sale_id AND p.is_deleted = 0
        ), 0) >= sales.total_amount_ttc THEN 
          (SELECT MIN(p.created_at) FROM payments p WHERE p.sale_id = OLD.sale_id AND p.is_deleted = 0)
        ELSE NULL
      END
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.sale_id;
END;

-- =====================================================
-- INVOICE PAYMENT STATUS TRIGGERS
-- Handles both sale-linked and direct invoice payments
-- =====================================================

-- Trigger: After INSERT on payments - Update Invoice Status
CREATE TRIGGER update_invoice_payment_status_after_payment_insert
AFTER INSERT ON payments
FOR EACH ROW
WHEN NEW.sale_id IS NOT NULL OR NEW.invoice_id IS NOT NULL
BEGIN
  -- Update invoices linked through sales
  UPDATE invoices
  SET
    is_paid = (
      SELECT CASE
        WHEN (
          -- Sum of payments through linked sales
          IFNULL((
            SELECT SUM(p.amount)
            FROM invoice_sales s
            JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
            WHERE s.invoice_id = invoices.id
          ), 0) +
          -- Plus direct payments to invoice
          IFNULL((
            SELECT SUM(p.amount)
            FROM payments p
            WHERE p.invoice_id = invoices.id AND p.is_deleted = 0
          ), 0)
        ) >= invoices.total_amount_ttc THEN 1
        ELSE 0
      END
    ),
    paid_at = (
      SELECT CASE
        WHEN (
          IFNULL((
            SELECT SUM(p.amount)
            FROM invoice_sales s
            JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
            WHERE s.invoice_id = invoices.id
          ), 0) +
          IFNULL((
            SELECT SUM(p.amount)
            FROM payments p
            WHERE p.invoice_id = invoices.id AND p.is_deleted = 0
          ), 0)
        ) >= invoices.total_amount_ttc THEN 
          (SELECT MIN(earliest_payment) FROM (
            SELECT MIN(p.created_at) as earliest_payment
            FROM invoice_sales s
            JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
            WHERE s.invoice_id = invoices.id
            UNION ALL
            SELECT MIN(p.created_at) as earliest_payment
            FROM payments p
            WHERE p.invoice_id = invoices.id AND p.is_deleted = 0
          ))
        ELSE NULL
      END
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id IN (
    SELECT DISTINCT invoice_id 
    FROM invoice_sales 
    WHERE sale_id = NEW.sale_id
    UNION
    SELECT NEW.invoice_id
    WHERE NEW.invoice_id IS NOT NULL
  ) AND is_deleted = 0;
END;

-- Trigger: After UPDATE on payments - Update Invoice Status
CREATE TRIGGER update_invoice_payment_status_after_payment_update
AFTER UPDATE ON payments
FOR EACH ROW
WHEN NEW.sale_id IS NOT NULL OR OLD.sale_id IS NOT NULL OR NEW.invoice_id IS NOT NULL OR OLD.invoice_id IS NOT NULL
BEGIN
  -- Update invoices for all affected cases
  UPDATE invoices
  SET
    is_paid = (
      SELECT CASE
        WHEN (
          IFNULL((
            SELECT SUM(p.amount)
            FROM invoice_sales s
            JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
            WHERE s.invoice_id = invoices.id
          ), 0) +
          IFNULL((
            SELECT SUM(p.amount)
            FROM payments p
            WHERE p.invoice_id = invoices.id AND p.is_deleted = 0
          ), 0)
        ) >= invoices.total_amount_ttc THEN 1
        ELSE 0
      END
    ),
    paid_at = (
      SELECT CASE
        WHEN (
          IFNULL((
            SELECT SUM(p.amount)
            FROM invoice_sales s
            JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
            WHERE s.invoice_id = invoices.id
          ), 0) +
          IFNULL((
            SELECT SUM(p.amount)
            FROM payments p
            WHERE p.invoice_id = invoices.id AND p.is_deleted = 0
          ), 0)
        ) >= invoices.total_amount_ttc THEN 
          (SELECT MIN(earliest_payment) FROM (
            SELECT MIN(p.created_at) as earliest_payment
            FROM invoice_sales s
            JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
            WHERE s.invoice_id = invoices.id
            UNION ALL
            SELECT MIN(p.created_at) as earliest_payment
            FROM payments p
            WHERE p.invoice_id = invoices.id AND p.is_deleted = 0
          ))
        ELSE NULL
      END
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id IN (
    SELECT DISTINCT invoice_id 
    FROM invoice_sales 
    WHERE sale_id IN (NEW.sale_id, OLD.sale_id)
    UNION
    SELECT NEW.invoice_id WHERE NEW.invoice_id IS NOT NULL
    UNION
    SELECT OLD.invoice_id WHERE OLD.invoice_id IS NOT NULL
  ) AND is_deleted = 0;
END;

-- Trigger: After DELETE on payments - Update Invoice Status
CREATE TRIGGER update_invoice_payment_status_after_payment_delete
AFTER DELETE ON payments
FOR EACH ROW
WHEN OLD.sale_id IS NOT NULL OR OLD.invoice_id IS NOT NULL
BEGIN
  UPDATE invoices
  SET
    is_paid = (
      SELECT CASE
        WHEN (
          IFNULL((
            SELECT SUM(p.amount)
            FROM invoice_sales s
            JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
            WHERE s.invoice_id = invoices.id
          ), 0) +
          IFNULL((
            SELECT SUM(p.amount)
            FROM payments p
            WHERE p.invoice_id = invoices.id AND p.is_deleted = 0
          ), 0)
        ) >= invoices.total_amount_ttc THEN 1
        ELSE 0
      END
    ),
    paid_at = (
      SELECT CASE
        WHEN (
          IFNULL((
            SELECT SUM(p.amount)
            FROM invoice_sales s
            JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
            WHERE s.invoice_id = invoices.id
          ), 0) +
          IFNULL((
            SELECT SUM(p.amount)
            FROM payments p
            WHERE p.invoice_id = invoices.id AND p.is_deleted = 0
          ), 0)
        ) >= invoices.total_amount_ttc THEN 
          (SELECT MIN(earliest_payment) FROM (
            SELECT MIN(p.created_at) as earliest_payment
            FROM invoice_sales s
            JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
            WHERE s.invoice_id = invoices.id
            UNION ALL
            SELECT MIN(p.created_at) as earliest_payment
            FROM payments p
            WHERE p.invoice_id = invoices.id AND p.is_deleted = 0
          ))
        ELSE NULL
      END
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id IN (
    SELECT DISTINCT invoice_id 
    FROM invoice_sales 
    WHERE sale_id = OLD.sale_id
    UNION
    SELECT OLD.invoice_id
    WHERE OLD.invoice_id IS NOT NULL
  ) AND is_deleted = 0;
END;

-- =====================================================
-- CROSS-TABLE CONSISTENCY TRIGGERS
-- Handle manual updates and ensure consistency
-- =====================================================

-- Trigger: When sale payment status is manually changed, update linked invoices
CREATE TRIGGER update_invoice_status_after_sale_update
AFTER UPDATE OF is_paid, paid_at ON sales
FOR EACH ROW
WHEN OLD.is_paid != NEW.is_paid OR (OLD.paid_at IS NULL) != (NEW.paid_at IS NULL)
BEGIN
  UPDATE invoices
  SET
    is_paid = (
      SELECT CASE
        WHEN (
          IFNULL((
            SELECT SUM(p.amount)
            FROM invoice_sales s
            JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
            WHERE s.invoice_id = invoices.id
          ), 0) +
          IFNULL((
            SELECT SUM(p.amount)
            FROM payments p
            WHERE p.invoice_id = invoices.id AND p.is_deleted = 0
          ), 0)
        ) >= invoices.total_amount_ttc THEN 1
        ELSE 0
      END
    ),
    paid_at = (
      SELECT CASE
        WHEN (
          IFNULL((
            SELECT SUM(p.amount)
            FROM invoice_sales s
            JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
            WHERE s.invoice_id = invoices.id
          ), 0) +
          IFNULL((
            SELECT SUM(p.amount)
            FROM payments p
            WHERE p.invoice_id = invoices.id AND p.is_deleted = 0
          ), 0)
        ) >= invoices.total_amount_ttc THEN 
          (SELECT MIN(earliest_payment) FROM (
            SELECT MIN(p.created_at) as earliest_payment
            FROM invoice_sales s
            JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
            WHERE s.invoice_id = invoices.id
            UNION ALL
            SELECT MIN(p.created_at) as earliest_payment
            FROM payments p
            WHERE p.invoice_id = invoices.id AND p.is_deleted = 0
          ))
        ELSE NULL
      END
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id IN (
    SELECT invoice_id FROM invoice_sales WHERE sale_id = NEW.id
  ) AND is_deleted = 0;
END;

-- Trigger: When invoice is deleted/restored, recalculate linked sales
CREATE TRIGGER update_sales_status_after_invoice_update
AFTER UPDATE OF is_deleted ON invoices
FOR EACH ROW
WHEN OLD.is_deleted != NEW.is_deleted
BEGIN
  -- Recalculate all sales linked to this invoice
  UPDATE sales
  SET
    is_paid = (
      SELECT CASE
        WHEN IFNULL((
          SELECT SUM(p.amount)
          FROM payments p
          WHERE p.sale_id = sales.id AND p.is_deleted = 0
        ), 0) >= sales.total_amount_ttc THEN 1
        ELSE 0
      END
    ),
    paid_at = (
      SELECT CASE
        WHEN IFNULL((
          SELECT SUM(p.amount)
          FROM payments p
          WHERE p.sale_id = sales.id AND p.is_deleted = 0
        ), 0) >= sales.total_amount_ttc THEN 
          (SELECT MIN(p.created_at) FROM payments p WHERE p.sale_id = sales.id AND p.is_deleted = 0)
        ELSE NULL
      END
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id IN (
    SELECT sale_id FROM invoice_sales WHERE invoice_id = NEW.id
  );
END;

-- =====================================================
-- BULK PAYMENT TRIGGERS
-- Handle bulk payment scenarios
-- =====================================================

-- Trigger: When bulk_payment is updated, recalculate all affected sales/invoices
CREATE TRIGGER update_status_after_bulk_payment_change
AFTER UPDATE OF is_deleted ON bulk_payments
FOR EACH ROW
WHEN OLD.is_deleted != NEW.is_deleted
BEGIN
  -- Update all sales with payments linked to this bulk payment
  UPDATE sales
  SET
    is_paid = (
      SELECT CASE
        WHEN IFNULL((
          SELECT SUM(p.amount)
          FROM payments p
          WHERE p.sale_id = sales.id AND p.is_deleted = 0
        ), 0) >= sales.total_amount_ttc THEN 1
        ELSE 0
      END
    ),
    paid_at = (
      SELECT CASE
        WHEN IFNULL((
          SELECT SUM(p.amount)
          FROM payments p
          WHERE p.sale_id = sales.id AND p.is_deleted = 0
        ), 0) >= sales.total_amount_ttc THEN 
          (SELECT MIN(p.created_at) FROM payments p WHERE p.sale_id = sales.id AND p.is_deleted = 0)
        ELSE NULL
      END
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id IN (
    SELECT DISTINCT sale_id 
    FROM payments 
    WHERE bulk_payment_id = NEW.id AND sale_id IS NOT NULL
  );

  -- Update all invoices linked to affected sales
  UPDATE invoices
  SET
    is_paid = (
      SELECT CASE
        WHEN (
          IFNULL((
            SELECT SUM(p.amount)
            FROM invoice_sales s
            JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
            WHERE s.invoice_id = invoices.id
          ), 0) +
          IFNULL((
            SELECT SUM(p.amount)
            FROM payments p
            WHERE p.invoice_id = invoices.id AND p.is_deleted = 0
          ), 0)
        ) >= invoices.total_amount_ttc THEN 1
        ELSE 0
      END
    ),
    paid_at = (
      SELECT CASE
        WHEN (
          IFNULL((
            SELECT SUM(p.amount)
            FROM invoice_sales s
            JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
            WHERE s.invoice_id = invoices.id
          ), 0) +
          IFNULL((
            SELECT SUM(p.amount)
            FROM payments p
            WHERE p.invoice_id = invoices.id AND p.is_deleted = 0
          ), 0)
        ) >= invoices.total_amount_ttc THEN 
          (SELECT MIN(earliest_payment) FROM (
            SELECT MIN(p.created_at) as earliest_payment
            FROM invoice_sales s
            JOIN payments p ON p.sale_id = s.sale_id AND p.is_deleted = 0
            WHERE s.invoice_id = invoices.id
            UNION ALL
            SELECT MIN(p.created_at) as earliest_payment
            FROM payments p
            WHERE p.invoice_id = invoices.id AND p.is_deleted = 0
          ))
        ELSE NULL
      END
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id IN (
    SELECT DISTINCT invoice_id
    FROM invoice_sales s
    WHERE s.sale_id IN (
      SELECT DISTINCT sale_id 
      FROM payments 
      WHERE bulk_payment_id = NEW.id AND sale_id IS NOT NULL
    )
  ) AND is_deleted = 0;
END; 