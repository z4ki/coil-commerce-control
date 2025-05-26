-- Create a function to delete a payment and its associated credit transaction
CREATE OR REPLACE FUNCTION delete_payment_with_credit(payment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Start transaction
  BEGIN
    -- Delete credit transaction if it exists
    DELETE FROM credit_transactions
    WHERE source_type = 'payment' AND source_id = payment_id;

    -- Delete the payment
    DELETE FROM payments
    WHERE id = payment_id;

    -- Commit transaction
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback transaction on error
      ROLLBACK;
      RAISE;
  END;
END;
$$; 