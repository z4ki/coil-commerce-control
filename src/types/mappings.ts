import { Database } from './supabase';
import { 
    Client, 
    Sale, 
    Invoice, 
    Payment, 
    PaymentMethodType,
    ProductType,
    SaleItem
} from './index';

// Type aliases for better readability
export type DbClient = Database['public']['Tables']['clients']['Row'];
export type DbSale = Database['public']['Tables']['sales']['Row'];
export type DbInvoice = Database['public']['Tables']['invoices']['Row'];
export type DbPayment = Database['public']['Tables']['payments']['Row'];
export type DbSaleItem = Database['public']['Tables']['sale_items']['Row'];

export function mapDbClientToClient(dbClient: DbClient): Client {
    return {
        id: dbClient.id,
        name: dbClient.name,
        company: dbClient.company || undefined,
        address: dbClient.address || '',
        phone: dbClient.phone || '',
        email: dbClient.email || '',
        nif: dbClient.nif || undefined,
        nis: dbClient.nis || undefined,
        rc: dbClient.rc || undefined,
        ai: dbClient.ai || undefined,
        rib: dbClient.rib || undefined,
        notes: dbClient.notes || undefined,
        creditBalance: dbClient.credit_balance,
        createdAt: new Date(dbClient.created_at),
        updatedAt: dbClient.updated_at ? new Date(dbClient.updated_at) : undefined
    };
}

export function mapDbSaleToSale(dbSale: DbSale): Sale {
    return {
        id: dbSale.id,
        clientId: dbSale.client_id,
        date: new Date(dbSale.date),
        totalAmountHT: dbSale.total_amount,
        totalAmountTTC: dbSale.total_amount * (1 + (dbSale.tax_rate || 0)),
        isInvoiced: dbSale.is_invoiced,
        invoiceId: dbSale.invoice_id || undefined,
        notes: dbSale.notes || undefined,
        paymentMethod: dbSale.payment_method as PaymentMethodType,
        productType: dbSale.product_type as ProductType,
        taxRate: dbSale.tax_rate || 0,
        transportationFee: dbSale.transportation_fee || undefined,
        items: [], // This should be populated separately
        createdAt: new Date(dbSale.created_at),
        updatedAt: dbSale.updated_at ? new Date(dbSale.updated_at) : undefined
    };
}

export function mapDbSaleItemToSaleItem(dbItem: DbSaleItem): SaleItem {
    return {
        id: dbItem.id,
        description: dbItem.description,
        productType: dbItem.product_type as ProductType,
        coilRef: dbItem.coil_ref || undefined,
        coilThickness: dbItem.coil_thickness || undefined,
        coilWidth: dbItem.coil_width || undefined,
        topCoatRAL: dbItem.top_coat_ral || undefined,
        backCoatRAL: dbItem.back_coat_ral || undefined,
        coilWeight: dbItem.coil_weight || undefined,
        inputWidth: dbItem.input_width || undefined,
        outputWidth: dbItem.output_width || undefined,
        thickness: dbItem.thickness || undefined,
        weight: dbItem.weight || undefined,
        stripsCount: dbItem.strips_count || undefined,
        quantity: dbItem.quantity,
        pricePerTon: dbItem.price_per_ton,
        totalAmountHT: dbItem.total_amount,
        totalAmountTTC: dbItem.total_amount * 1.19, // TODO: Use actual tax rate
        weightInTons: dbItem.weight_in_tons
    };
}

export function mapDbInvoiceToInvoice(dbInvoice: DbInvoice): Invoice {
    return {
        id: dbInvoice.id,
        clientId: dbInvoice.client_id,
        date: new Date(dbInvoice.date),
        number: dbInvoice.invoice_number,
        totalAmountHT: dbInvoice.total_amount,
        totalAmountTTC: dbInvoice.total_amount * (1 + (dbInvoice.tax_rate || 0)),
        isPaid: dbInvoice.is_paid,
        dueDate: dbInvoice.due_date ? new Date(dbInvoice.due_date) : undefined,
        notes: dbInvoice.notes || undefined,
        transportationFee: dbInvoice.transportation_fee || undefined,
        salesIds: [], // This should be populated separately
        sales: [], // This should be populated separately
        createdAt: new Date(dbInvoice.created_at),
        updatedAt: dbInvoice.updated_at ? new Date(dbInvoice.updated_at) : undefined
    };
}

export function mapDbPaymentToPayment(dbPayment: DbPayment): Payment {
    return {
        id: dbPayment.id,
        saleId: dbPayment.sale_id || undefined,
        clientId: dbPayment.client_id,
        bulkPaymentId: dbPayment.bulk_payment_id || undefined,
        date: new Date(dbPayment.date),
        amount: dbPayment.amount,
        method: dbPayment.method as PaymentMethodType,
        notes: dbPayment.notes || undefined,
        generatesCredit: dbPayment.generates_credit,
        createdAt: new Date(dbPayment.created_at),
        updatedAt: dbPayment.updated_at ? new Date(dbPayment.updated_at) : undefined
    };
}



