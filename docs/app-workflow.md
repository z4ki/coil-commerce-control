# App Workflow Diagram

This document provides a detailed workflow of the main user journeys in the Coil Commerce Control app, including API and database interactions.

```mermaid
flowchart TD
    %% Entry & Navigation
    Start(["Start"])
    Login["Login/Authentication"]
    Dashboard["Dashboard"]
    Sidebar["Sidebar Navigation"]
    End(["End"])

    %% Sales Flow
    SalesPage["Sales Page"]
    NewSale["Create/Edit Sale"]
    SelectClient["Select Client"]
    AddSaleItems["Add Sale Items"]
    SetSaleDetails["Set Date, Payment Method, Notes"]
    CalculateSaleTotals["Calculate Sale Totals"]
    SaveSale["Save Sale"]
    SaleAPICall["API: addSale/updateSale"]
    SaleDBWrite["DB: Write Sale, SaleItems"]
    SaleSuccess["Sale Saved"]
    SaleError["Sale Error"]
    ExportSalePDF["Export Sale PDF"]
    PDFGen["PDF Generation (Client-side)"]

    %% Invoice Flow
    InvoicesPage["Invoices Page"]
    NewInvoice["Create/Edit Invoice"]
    SelectInvoiceClient["Select Client"]
    LinkSales["Link Sales to Invoice"]
    SetInvoiceDetails["Set Date, Notes"]
    CalculateInvoiceTotals["Calculate Invoice Totals"]
    SaveInvoice["Save Invoice"]
    InvoiceAPICall["API: addInvoice/updateInvoice"]
    InvoiceDBWrite["DB: Write Invoice, InvoiceSales"]
    InvoiceSuccess["Invoice Saved"]
    InvoiceError["Invoice Error"]
    ExportInvoicePDF["Export Invoice PDF"]
    InvoicePDFGen["PDF Generation (Client-side)"]
    RecordPayment["Record Payment"]
    PaymentAPICall["API: addPayment"]
    PaymentDBWrite["DB: Write Payment"]
    UpdatePaymentStatus["DB Trigger: Update Invoice.is_paid"]

    %% Product Flow
    ProductsPage["Products Page"]
    AddEditProduct["Add/Edit Product"]
    ProductAPICall["API: addProduct/updateProduct"]
    ProductDBWrite["DB: Write Product"]
    ProductHistory["View Product History"]
    SaveProduct["Save Product"]
    ProductSuccess["Product Saved"]
    ProductError["Product Error"]

    %% Client Flow
    ClientsPage["Clients Page"]
    AddEditClient["Add/Edit Client"]
    ClientAPICall["API: addClient/updateClient"]
    ClientDBWrite["DB: Write Client"]
    SaveClient["Save Client"]
    ClientSuccess["Client Saved"]
    ClientError["Client Error"]

    %% Payment Flow
    PaymentsPage["Payments Page"]
    AddPayment["Add Payment"]
    LinkPayment["Link Payment to Sale/Invoice"]
    SavePayment["Save Payment"]
    PaymentAPICall2["API: addPayment"]
    PaymentDBWrite2["DB: Write Payment"]
    PaymentSuccess["Payment Saved"]
    PaymentError["Payment Error"]

    %% Reports Flow
    ReportsPage["Reports Page"]
    GenerateReport["Generate Report"]
    ReportAPICall["API: getReportData"]
    ExportReport["Export Report (Excel/PDF)"]
    ReportExportGen["Excel/PDF Generation (Client-side)"]

    %% Settings/Backup
    SettingsPage["Settings Page"]
    BackupData["Backup Data"]
    BackupAPICall["API: backup/export"]
    BackupFile["File: Exported DB"]
    RestoreData["Restore Data"]
    RestoreAPICall["API: restore/import"]
    RestoreDBWrite["DB: Import Data"]

    %% Navigation
    Start --> Login
    Login --> Dashboard
    Dashboard --> Sidebar
    Sidebar --> SalesPage
    Sidebar --> InvoicesPage
    Sidebar --> ProductsPage
    Sidebar --> ClientsPage
    Sidebar --> PaymentsPage
    Sidebar --> ReportsPage
    Sidebar --> SettingsPage

    %% Sales Flow
    SalesPage --> NewSale
    NewSale --> SelectClient
    SelectClient --> AddSaleItems
    AddSaleItems --> SetSaleDetails
    SetSaleDetails --> CalculateSaleTotals
    CalculateSaleTotals --> SaveSale
    SaveSale --> SaleAPICall
    SaleAPICall --> SaleDBWrite
    SaleDBWrite -->|"Success"| SaleSuccess
    SaleDBWrite -->|"Error"| SaleError
    SaleSuccess --> ExportSalePDF
    ExportSalePDF --> PDFGen
    PDFGen --> End
    SaleError --> End

    %% Invoice Flow
    InvoicesPage --> NewInvoice
    NewInvoice --> SelectInvoiceClient
    SelectInvoiceClient --> LinkSales
    LinkSales --> SetInvoiceDetails
    SetInvoiceDetails --> CalculateInvoiceTotals
    CalculateInvoiceTotals --> SaveInvoice
    SaveInvoice --> InvoiceAPICall
    InvoiceAPICall --> InvoiceDBWrite
    InvoiceDBWrite -->|"Success"| InvoiceSuccess
    InvoiceDBWrite -->|"Error"| InvoiceError
    InvoiceSuccess --> ExportInvoicePDF
    ExportInvoicePDF --> InvoicePDFGen
    InvoicePDFGen --> RecordPayment
    RecordPayment --> PaymentAPICall
    PaymentAPICall --> PaymentDBWrite
    PaymentDBWrite --> UpdatePaymentStatus
    UpdatePaymentStatus --> End
    InvoiceError --> End

    %% Product Flow
    ProductsPage --> AddEditProduct
    AddEditProduct --> ProductAPICall
    ProductAPICall --> ProductDBWrite
    ProductDBWrite --> ProductHistory
    ProductHistory --> SaveProduct
    SaveProduct -->|"Success"| ProductSuccess
    SaveProduct -->|"Error"| ProductError
    ProductSuccess --> End
    ProductError --> End

    %% Client Flow
    ClientsPage --> AddEditClient
    AddEditClient --> ClientAPICall
    ClientAPICall --> ClientDBWrite
    ClientDBWrite --> SaveClient
    SaveClient -->|"Success"| ClientSuccess
    SaveClient -->|"Error"| ClientError
    ClientSuccess --> End
    ClientError --> End

    %% Payment Flow
    PaymentsPage --> AddPayment
    AddPayment --> LinkPayment
    LinkPayment --> SavePayment
    SavePayment --> PaymentAPICall2
    PaymentAPICall2 --> PaymentDBWrite2
    PaymentDBWrite2 -->|"Success"| PaymentSuccess
    PaymentDBWrite2 -->|"Error"| PaymentError
    PaymentSuccess --> End
    PaymentError --> End

    %% Reports Flow
    ReportsPage --> GenerateReport
    GenerateReport --> ReportAPICall
    ReportAPICall --> ExportReport
    ExportReport --> ReportExportGen
    ReportExportGen --> End

    %% Settings/Backup
    SettingsPage --> BackupData
    BackupData --> BackupAPICall
    BackupAPICall --> BackupFile
    SettingsPage --> RestoreData
    RestoreData --> RestoreAPICall
    RestoreAPICall --> RestoreDBWrite
    RestoreDBWrite --> End
```

## Legend

- **API:** Calls to backend (Rust/Tauri or Supabase) for CRUD operations.
- **DB:** Database writes/reads (SQLite or Supabase Postgres).
- **Client-side:** Actions performed in the browser (PDF/Excel generation, UI feedback).
- **Triggers:** Database triggers for automatic status updates (e.g., payment status).

---

You can view and edit this diagram using any Markdown viewer that supports Mermaid, or use the [Mermaid Live Editor](https://mermaid.live/). 