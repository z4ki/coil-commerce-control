# Update Sale Debug Summary

## Context & Problem

You are building a sales management app using React (frontend) and Tauri (Rust backend).  
You are trying to **edit and update a sale**. The form works, but when you submit, you get this error from the backend:

```
Error updating sale: invalid args `sale` for command `update_sale`: premature end of input
```

---

## Frontend (React/TypeScript) Code

### A. SaleForm Submission

```ts
const onSubmit = async (data: FormValues) => {
  const items = data.items.map(item => ({
    ...item,
    pricePerTon: Number(item.pricePerTon),
  }));
  try {
    if (sale) {
      await updateSale(sale.id, { ...sale, ...data, items });
      toast.success(t('sales.updated'));
    } else {
      await addSale({ ...data, items });
      toast.success(t('sales.added'));
    }
    if (onSuccess) onSuccess();
  } catch (error: any) {
    toast.error(t('sales.saveError') + ': ' + (error?.message || error?.toString()));
    console.error('Error saving sale:', error);
  }
};
```

### B. Sale Update Service

```ts
// Utility to remove all undefined fields recursively
function removeUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, removeUndefined(v)])
    );
  }
  return obj;
}

export const updateSale = async (id: string, sale: Partial<Sale>): Promise<Sale> => {
  // Always fetch the existing sale
  const existing = await getSaleById(id);
  if (!existing) throw new Error('Sale not found');
  const merged = { ...existing, ...sale };

  // Map items to backend format
  const items = (merged.items || []).map((item: any, idx: number) => {
    if (item.pricePerTon == null) {
      throw new Error(`Sale item at index ${idx} is missing pricePerTon`);
    }
    return {
      description: item.description,
      coil_ref: item.coilRef,
      coil_thickness: item.coilThickness,
      coil_width: item.coilWidth,
      top_coat_ral: item.topCoatRAL,
      back_coat_ral: item.backCoatRAL,
      coil_weight: item.coilWeight,
      quantity: item.quantity,
      price_per_ton: item.pricePerTon,
      total_amount: item.totalAmountHT,
    };
  });

  // Prepare backend sale object
  const backendSale: any = {
    client_id: merged.clientId,
    date: merged.date instanceof Date ? merged.date.toISOString() : merged.date,
    total_amount: merged.totalAmountHT,
    total_amount_ttc: merged.totalAmountTTC,
    is_invoiced: merged.isInvoiced,
    invoice_id: merged.invoiceId,
    notes: merged.notes,
    payment_method: merged.paymentMethod,
    transportation_fee: merged.transportationFee,
    tax_rate: merged.taxRate,
    items,
  };

  // Remove undefined fields
  const cleanBackendSale = removeUndefined(backendSale);
  console.log('Sending to backend (cleaned):', cleanBackendSale);

  // Call backend
  try {
    return await tauriApi.sales.update(id, cleanBackendSale);
  } catch (error) {
    console.error('Error updating sale:', error);
    throw error;
  }
};
```

---

## Backend (Rust Tauri Command) Code

```rust
#[derive(Deserialize)]
pub struct SaleItemInput {
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

#[derive(Deserialize)]
pub struct SaleInput {
    pub client_id: String,
    pub date: String,
    pub total_amount: f64,
    pub total_amount_ttc: f64,
    pub is_invoiced: bool,
    pub invoice_id: Option<String>,
    pub notes: Option<String>,
    pub payment_method: Option<String>,
    pub transportation_fee: Option<f64>,
    pub tax_rate: f64,
    pub items: Vec<SaleItemInput>,
}

#[tauri::command]
pub async fn update_sale(id: String, sale: SaleInput) -> Result<(), String> {
    // Your update logic here
    Ok(())
}
```

---

## Logs and Error Output

**Console log before sending to backend:**
```
Sending to backend (cleaned): {
  client_id: 'ee72db4dd25fc8368da11d21ea6d8cba',
  date: '2025-06-29',
  total_amount: 1440000,
  total_amount_ttc: 1713600,
  is_invoiced: false,
  items: [ ... ],
  notes: 'sfdkljmsqdfmj',
  payment_method: 'term',
  tax_rate: 0.19,
  transportation_fee: 0
}
```

**Error:**
```
Error updating sale: invalid args `sale` for command `update_sale`: premature end of input
```

---

## Other Context

- The frontend uses React context (`useAppContext`) and is wrapped in an `AppProvider`.
- The error `useAppContext must be used within an AppProvider` sometimes appears if the context is not set up correctly in the component tree.

---

## What You Need to Fix

- The backend expects all required fields to be present and not `undefined`.
- The frontend now removes all `undefined` fields before sending.
- The error persists, so either:
  - The backend expects a field that is missing (double-check the Rust struct and the JSON sent).
  - There is a mismatch in field names or types.
  - The Tauri command signature or deserialization is stricter than expected.

---

## What to Ask the Next AI/Developer

- **Is the Rust struct for `SaleInput` correct and does it match the JSON sent from the frontend?**
- **Is there a way to get more detailed error output from the Tauri backend to see which field is missing or wrong?**
- **Should any fields be `Option<T>` that are currently required?**
- **Is there a better way to debug Tauri command deserialization errors?**

---

**You can copy and paste this summary to any AI or developer for further help.**  
If you need to add more logs or code, just append them to this summary! 