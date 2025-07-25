import { time } from 'console';
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'fr';

type TranslationValue = string | { [key: string]: TranslationValue };

interface Translations {
  [key: string]: TranslationValue;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

type NestedTranslations = {
  [key: string]: string | NestedTranslations;
};

const translations: { [key in Language]: Translations } = {
  en: {
    // Common
    'common': {
      'edit': 'Edit',
      'delete': 'Delete',
      'cancel': 'Cancel',
      'actions': 'Actions'
    },
    // Status
    'status': {
      'invoiced': 'Invoiced',
      'notInvoiced': 'Not Invoiced',
      'paid': 'Paid',
      'unpaid': 'Unpaid',
      'overdue': 'Overdue',
      'pending': 'Pending',
      'partiallyPaid': 'Partially Paid'
    },

    // General
    'general': {
      'settings': 'Settings',
      'save': 'Save Changes',
      'language': 'Language',
      'currency': 'Currency',
      'darkMode': 'Dark Mode',
      'notifications': 'Email Notifications',
      'saveSuccess': 'Settings Saved',
      'description': 'Configure Settings',
      'export': 'Export',
      'timeRange': 'Time Range',
      'allTime': 'All Time',
      'thisMonth': 'This Month',
      'thisQuarter': 'This Quarter',
      'thisYear': 'This Year',
      'search': 'Search',
      'noData': 'No Data',
      'items': 'Items',
      'actions': 'Actions',
      'edit': 'Edit',
      'view': 'View',
      'confirm': 'Confirm',
      'cancel': 'Cancel',
      'close': 'Close',
      'back': 'Back',
      'next': 'Next',
      'submit': 'Submit',
      'reset': 'Reset',
      'filter': 'Filter',
      'clear': 'Clear',
      'refresh': 'Refresh',
      'loading': 'Loading',
      'error': 'Error',
      'success': 'Success',
      'warning': 'Warning',
      'info': 'Info',
      'invoices': 'Invoices',
      'reports': 'Reports',
      'adminUser': 'Admin User',
      'quantity': 'Quantity',
      'restore': 'Restore',
      'all': 'All',
      'allTypes': 'All Types',
      'allStatuses': 'All Statuses',
      'delete': 'Delete',
      'endOfList': 'No more results',
      'noResults': 'No results found',
      'allDataLoaded': 'All data has been loaded',
    },

    auditLog: {
      title: 'Audit Log',
      description: 'All critical actions in the system are recorded here for accountability and compliance.',
      searchPlaceholder: 'Search audit log...',
      empty: 'No audit log entries found.',
      id: 'ID',
      action: 'Action',
      entityType: 'Entity Type',
      entityId: 'Entity ID',
      timestamp: 'Timestamp',
      details: 'Details'
    },

    // Dashboard
    'dashboard': {
      'title': 'Dashboard',
      'summary': 'Sales Summary',
      'totalSales': 'Total Sales',
      'average': 'Average: {0}',
      'outstandingDebt': 'Outstanding Debt',
      'overdue': 'Overdue: {0}',
      'totalClients': 'Total Clients',
      'uninvoicedSales': 'Uninvoiced Sales',
      'salesWithoutInvoices': 'Sales without invoices',
      'monthlySales': 'Monthly Sales',
      'salesOverTime': 'Sales over time',
      'amount': 'Amount',
      'month': 'Month: {0}',
      'topClients': 'Top Clients',
      'recentSales': 'Recent Activity',
      'recentActivity': 'Recent Activity',
      'noRecentActivity': 'Activity data will appear here as you add sales and invoices',
      'bankAccountBalance': 'Bank Account Balance',
      'bankAndCheck': 'Bank transfers and checks',
      'quantity': 'Quantity',
      'invoiceIssued': 'Invoice issued #{invoiceNumber} ({amount})',
      'paymentFrom': 'Payment from {client} ({amount})',
      'saleTo': 'Sale to {client} ({amount})',
      'newClients': 'New Clients',
      'overdueInvoices': 'Overdue Invoices',
      'unpaidInvoices': 'Unpaid Invoices',
      'totalSalesCount': 'Total Sales Count',
      'monthlySalesCount': 'Monthly Sales Count',
    },

    // Sales
    'sales': {
      'title': 'Sales',
      'add': 'Add Sale',
      'edit': 'Edit Sale',
      'delete': 'Delete Sale',
      'view': 'View Sale',
      'list': 'Sales List',
      'filter': 'Filter Sales',
      'date': 'Date',
      'client': 'Client',
      'items': 'Items',
      'total': 'Total',
      'status': 'Status',
      'notes': 'Notes',
      'payment': 'Payment',
      'invoice': 'Invoice',
      'viewInvoice': 'View Invoice',
      'quotation': 'Quotation',
      'delivery': 'Delivery',
      'confirmation': 'Confirmation',
      'deleteConfirm': 'Are you sure you want to delete this sale?',
      'deleted': 'Sale has been deleted',
      'cannotChangeStatus': 'Cannot change sale status',
      'markedAsNotInvoiced': 'Sale marked as not invoiced',
      'markedAsInvoiced': 'Sale marked as invoiced',
      'exportPending': 'Exporting {0}...',
      'noSales': 'No sales found',
      'history': 'Sales History',
      'invoiced': 'Invoiced',
      'notInvoiced': 'Not Invoiced',
      'totalPaid': 'Total Paid',
      'paid': 'Amount Paid',
      'remaining': 'Remaining Amount',
      'paymentStatus': 'Payment Status',
      'fullyPaid': 'Fully Paid',
      'partiallyPaid': 'Partially Paid',
      'unpaid': 'Unpaid',
      'clientNotFound': 'Client not found',
      'pdfGenerated': 'Quotation generated successfully',
      'paymentMethod': 'Payment Method',
      'totalAmount': 'Total Amount',
      'amountPaid': 'Amount Paid',
      'actions': 'Actions',
      'pdfError': 'Error generating quotation',
      'quantity': 'Quantity',
      'showArchive': 'Show Archive',
      'showActive': 'Show Active',
      'archive': 'Deleted Sales',
      'number': 'Sale Number',
      'deletedAt': 'Deleted At',
      'deleteBlocked': 'Cannot delete sale: related invoice is paid.',
      'blockedByInvoice': 'Blocked by invoice',
      'invoicedFilter': 'Invoiced Status'
    },

    // Clients
    'clients': {
      'title': 'Clients',
      'add': 'Add Client',
      'edit': 'Edit Client',
      'delete': 'Delete Client',
      'view': 'View Client',
      'list': 'Clients List',
      'filter': 'Filter Clients',
      'name': 'Name',
      'company': 'Company',
      'email': 'Email',
      'phone': 'Phone',
      'address': 'Address',
      'notes': 'Notes',
      'status': 'Status',
      'since': 'Client Since',
      'lastOrder': 'Last Order',
      'totalOrders': 'Total Orders',
      'totalSpent': 'Total Spent',
      'contact': 'Contact',
      'debt': 'Outstanding Debt',
      'deleteConfirm': 'Are you sure you want to delete {0}?',
      'deleted': 'Client {0} has been deleted',
      'noClients': 'No clients found',
      'form': {
        'title': 'Add Client',
        'editTitle': 'Edit Client',
        'name': 'Name',
        'company': 'Company',
        'email': 'Email',
        'phone': 'Phone',
        'address': 'Address',
        'nif': 'NIF ',
        'nis': 'NIS ',
        'rc': 'RC ',
        'ai': 'AI ',
        'rib': 'RIB (Bank Account)',
        'placeholders': {
          'name': 'John Doe',
          'company': 'ACME Corp',
          'email': 'john@example.com',
          'phone': '0660 XX XX XX',
          'address': '123 Main St, City, Country',
          'nif': 'Tax Identification Number',
          'nis': 'Statistical Identification Number',
          'rc': 'Commercial Register Number',
          'ai': 'Tax Article Number',
          'rib': 'Bank Account Number (RIB)',
        },
        'actions': {
          'cancel': 'Cancel',
          'add': 'Add Client',
          'update': 'Update Client'
        },
        
      },
      'quantity': 'Quantity'
    },

    // Company
    'company': {
      'title': 'Company',
      'description': 'Manage your company information',
      'name': 'Company Name',
      'email': 'Email Address',
      'phone': 'Phone Number',
      'address': 'Address',
      'taxId': 'Tax ID',
      'nis': 'NIS Number',
      'rc': 'RC Number',
      'ai': 'AI Number',
      'rib': 'RIB (Bank Account)',
      'quantity': 'Quantity'
    },

    // Invoice
    'invoice': {
      'title': 'Invoice Settings',
      'description': 'Configure invoice settings',
      'prefixes': 'Invoice Prefixes',
      'prefixesDescription': 'Add and manage invoice number prefixes',
      'prefixPlaceholder': 'Enter prefix',
      'addPrefix': 'Add Prefix',
      'defaultPrefix': 'Set as Default',
      'deletePrefix': 'Delete Prefix',
      'nextNumber': 'Next Invoice Number',
      'paymentTerms': 'Payment Terms',
      'notes': 'Default Notes',
      'autoPdf': 'Auto-generate PDF',
      'quantity': 'Quantity',
      'deleteDraftTitle': 'Delete Draft Invoice',
      'deleteConfirmTitle': 'Delete Invoice?',
      'deleteDraftConfirm': 'This invoice is a draft and has no payments. It will be permanently deleted. This action cannot be undone.',
      'deleteWarning': 'This invoice has payments or is finalized. It will be soft deleted (archived), and all data will be preserved for audit and compliance.',
      'salesCount': '{count} sales linked',
      'paymentsCount': '{count} payments linked',
      'deleteDraftAction': 'Delete Permanently',
      'deleteAction': 'Archive Invoice'
    },

    // Import/Export
    'importExport': {
      'title': 'Import/Export',
      'description': 'Import or export your data',
      'importPending': 'Importing data...',
      'exportPending': 'Exporting data...',
      'reports': {
        'title': 'Reports',
        'debtOverview': 'Debt Overview',
        'debtStatus': 'Current debt status and top debtors',
        'overdue': 'Overdue',
        'upcoming': 'Upcoming',
        'topClients': 'Top Clients',
        'noDebts': 'No outstanding debts',
        'invoiceStatus': 'Invoice Status',
        'invoiceStatusDesc': 'Distribution of paid vs unpaid invoices',
        'salesStatus': 'Sales Status',
        'salesStatusDesc': 'Distribution of invoiced vs non-invoiced sales',
        'detailedReports': 'Detailed Reports',
        'detailedDesc': 'View detailed reports by category',
        'clientDebtReport': 'Client Debt Report',
        'salesReport': 'Sales Report',
        'outstandingAmount': 'Outstanding Amount',
        'overdueInvoices': 'Overdue Invoices',
        'upcomingInvoices': 'Upcoming Invoices',
        'noClientDebt': 'No clients with outstanding debt',
        'noOutstandingDebts': 'No outstanding debts for the selected period',
        'noSalesData': 'No sales data for the selected period',
        'quantity': 'Quantity'
      }
    },

    // Reports
    'reports': {
      'title': 'Reports',
      'debtOverview': 'Debt Overview',
      'debtStatus': 'Current debt status and top debtors',
      'overdue': 'Overdue',
      'upcoming': 'Upcoming',
      'topClients': 'Top Clients',
      'noDebts': 'No outstanding debts',
      'invoiceStatus': 'Invoice Status',
      'invoiceStatusDesc': 'Distribution of paid vs unpaid invoices',
      'salesStatus': 'Sales Status',
      'salesStatusDesc': 'Distribution of invoiced vs non-invoiced sales',
      'detailedReports': 'Detailed Reports',
      'detailedDesc': 'View detailed reports by category',
      'clientDebtReport': 'Client Debt Report',
      'salesReport': 'Sales Report',
      'outstandingAmount': 'Outstanding Amount',
      'overdueInvoices': 'Overdue Invoices',
      'upcomingInvoices': 'Upcoming Invoices',
      'noClientDebt': 'No clients with outstanding debt',
      'noOutstandingDebts': 'No outstanding debts for the selected period',
      'noSalesData': 'No sales data for the selected period',
      'quantity': 'Quantity'
    },

    // Forms
    'form': {
      'required': 'This field is required',
      'invalidEmail': 'Invalid email address',
      'invalidPhone': 'Invalid phone number',
      'save': 'Save',
      'cancel': 'Cancel',
      'error': 'An error occurred',
      'success': 'Operation successful',
      
      // Sale Form
      'sale': {
        'title': 'New Sale',
        'editTitle': 'Edit Sale',
        'client': 'Client',
        'selectClient': 'Select a client',
        'date': 'Sale date',
        'items': 'Items',
        'addItem': 'Add Item',
        'itemName': 'Item Name',
        'description': 'Description',
        'quantity': 'Quantity',
        'unitPrice': 'Unit Price',
        'tax': 'Tax Rate',
        'total': 'Total',
        'totalHT': 'Total excl. tax',
        'totalTTC': 'Total incl. tax',
        'tva': 'VAT',
        'subtotal': 'Subtotal',
        'totalTax': 'Total Tax',
        'totalAmount': 'Total Amount',
        'notes': 'Notes',
        'transportationFee': 'Transportation Fee',
        'coilRef': 'Coil Reference',
        'coilThickness': 'Thickness (mm)',
        'coilWidth': 'Width (mm)',
        'topCoatRAL': 'Top RAL Color',
        'backCoatRAL': 'Back RAL Color',
        'coilWeight': 'Weight (tons)',
        'pricePerTon': 'Price per ton',
        'itemTotal': 'Item Total',
        'summary': 'Summary',
        'subtotalHT': 'Subtotal excl. tax',
        'totalTVA': 'VAT (19%)',
        'finalTotal': 'Total incl. tax',
        'quantityPositive': 'Quantity must be positive',
        'pricePositive': 'Price must be positive',
        'itemRequired': 'At least one item is required',
        'coilDescription': 'PRELAQUED STEEL COILS {0}*{1}',
        'coilDescriptionWithRAL': 'PRELAQUED STEEL COILS {0}*{1} RAL {2}/{3}',
        'addSale': 'Add Sale',
        'addSaleMethod': 'Add Sale Method',
        'paymentMethod': 'Payment Method',
        'paymentMethods': {
          'cash': 'Cash',
          'bank': 'Bank Transfer',
          'check': 'Check',
          'card': 'Card',
          'other': 'Other'
        },
        'export': {
          'quotation': 'Export Quotation',
          'invoice': 'Export Invoice',
          'generating': 'Generating document...'
        },
        'productType': 'Product Type',
        'productTypeCoil': 'Coil',
        'productTypeSteelSlitting': 'Steel Slitting',
        'productTypeCorrugatedSheet': 'Corrugated Sheet',
        'corrugatedSheetDescription': 'Corrugated Sheet {0}mm x {1}m, {2} units, RAL {3}/{4}',
        'steelSlittingDescription': 'Steel Slitting {0}mm x {1}mm'
      },

      // Payment Form
      'payment': {
        'title': 'Payment',
        'method': 'Payment Method',
        'methods': {
          'cash': 'Cash',
          'bank': 'Bank Transfer',
          'check': 'Check',
          'card': 'Card',
          'other': 'Other'
        },
        'status': 'Payment Status',
        'paid': 'Paid',
        'unpaid': 'Unpaid',
        'partial': 'Partially Paid',
        'quantity': 'Quantity',
        'checkNumber': 'Check Number'
      },

      // Client Form
      'client': {
        'title': 'Add Client',
        'addTitle': 'Ajouter un client',
        'name': 'Name',
        'company': 'Company',
        'email': 'Email',
        'phone': 'Phone',
        'address': 'Address',
        'nif': 'NIF (Tax ID)',
        'nis': 'NIS (Statistical ID)',
        'rc': 'RC (Commercial Register)',
        'ai': 'AI (Tax Article)',
        'placeholders': {
          'name': 'John Doe',
          'company': 'ACME Corp',
          'email': 'john@example.com',
          'phone': '0660 XX XX XX',
          'address': '123 Main St, City, Country',
          'nif': 'Tax Identification Number',
          'nis': 'Statistical Identification Number',
          'rc': 'Commercial Register Number',
          'ai': 'Tax Article Number'
        },
        'actions': {
          'cancel': 'Cancel',
          'add': 'Add Client'
        },
        'quantity': 'Quantity'
      }
    },

    // Sale Form
    'saleForm': {
      'title': 'Add New Sale',
      'editTitle': 'Edit Sale',
      'client': 'Client',
      'selectClient': 'Select a client',
      'date': 'Sale Date',
      'items': 'Items',
      'addItem': 'Add Item',
      'itemName': 'Item Name',
      'description': 'Description',
      'quantity': 'Quantity',
      'unitPrice': 'Unit Price',
      'tax': 'Tax Rate',
      'total': 'Total',
      'subtotal': 'Subtotal',
      'totalTax': 'Total Tax',
      'totalAmount': 'Montant total',
      'notes': 'Notes',
      'paymentMethod': 'Payment Method',
      'cash': 'Cash',
      'bank': 'Bank Transfer',
      'check': 'Check',
      'other': 'Autre',
      'paymentStatus': 'Statut de paiement',
      'invoiceStatus': 'Invoice Status',
      'createInvoice': 'Créer une facture',
      'success': 'Vente enregistrée avec succès',
      'error': 'Erreur lors de l\'enregistrement de la vente',
      'quantity': 'Quantity'
    },

    // Client Form
    'clientForm': {
      'title': 'Add New Client',
      'editTitle': 'Edit Client',
      'personalInfo': 'Personal Information',
      'name': 'Full Name',
      'email': 'Email Address',
      'phone': 'Phone Number',
      'companyInfo': 'Company Information',
      'company': 'Company Name',
      'taxId': 'Tax ID',
      'nis': 'NIS Number',
      'rc': 'RC Number',
      'ai': 'AI Number',
      'address': 'Address',
      'street': 'Street Address',
      'city': 'City',
      'state': 'State/Province',
      'postalCode': 'Postal Code',
      'country': 'Country',
      'notes': 'Additional Notes',
      'success': 'Client successfully saved',
      'error': 'Error saving client',
      'duplicateEmail': 'A client with this email already exists',
      'quantity': 'Quantity'
    },

    // Invoices
    'invoices': {
      'title': 'Invoices',
      'searchPlaceholder': 'Search invoices...',
      'create': 'Create Invoice',
      'invoiceNumber': 'Invoice #',
      'client': 'Client',
      'date': 'Date',
      'dueDate': 'Due Date',
      'amount': 'Amount',
      'status': 'Status',
      'actions': 'Actions',
      'noMatch': 'No invoices match your search.',
      'noInvoices': 'No invoices found. Create your first invoice.',
      'edit': 'Edit',
      'delete': 'Delete',
      'viewDetails': 'View Details',
      'downloadPDF': 'Download PDF',
      'deleteConfirm': 'Are you sure you want to delete this invoice?',
      'deleted': 'Invoice has been deleted',
      'editTitle': 'Edit Invoice',
      'createTitle': 'Create New Invoice',
      'editDesc': 'Update the invoice details below.',
      'createDesc': 'Fill in the details below to create a new invoice.',
      'clientNotFound': 'Client not found',
      'pdfGenerated': 'Invoice generated successfully',
      'pdfError': 'Error generating invoice',
      'invoice': 'Invoice',
      'quantity': 'Quantity',
      'showArchive': 'Show Archive',
      'showActive': 'Show Active',
      'restore': 'Restore',
      'deleteDraftTitle': 'Delete Draft Invoice',
      'deleteConfirmTitle': 'Delete Invoice?',
      'deleteDraftConfirm': 'This invoice is a draft and has no payments. It will be permanently deleted. This action cannot be undone.',
      'deleteWarning': 'This invoice has payments or is finalized. It will be soft deleted (archived), and all data will be preserved for audit and compliance.',
      'salesCount': '{count} sales linked',
      'paymentsCount': '{count} payments linked',
      'deleteDraftAction': 'Delete Permanently',
      'deleteAction': 'Archive Invoice'
    },

    // Payments
    'payments': {
      'title': 'Payments',
      'add': 'Add Payment',
      'edit': 'Edit Payment',
      'delete': 'Delete Payment',
      'date': 'Payment Date',
      'amount': 'Amount',
      'method': 'Payment Method',
      'notes': 'Notes',
      'status': 'Payment Status',
      'recorded': 'Payment recorded successfully',
      'error': 'Error recording payment',
      'deleteConfirm': 'Are you sure you want to delete this payment?',
      'deleted': 'Payment deleted successfully',
      'selectMethod': 'Select payment method',
      'warning': {
        'exceedsRemaining': 'Payment of {amount} exceeds the remaining amount of {remaining}. This will result in a credit balance.'
      },
      'methods': {
        'cash': 'Cash',
        'bank_transfer': 'Bank Transfer',
        'check': 'Check',
        'term': 'Term Payment',
        'credit_card': 'Credit Card'
      },
      'quantity': 'Quantity',
      'showDeleted': 'Show Deleted Payments',
      'showActive': 'Show Active Payments',
      'checkNumber': 'Check Number'
    },

    // Client Details
    'clientDetails': {
      'title': 'Client Details',
      'financialSummary': 'Financial Summary',
      'salesTotal': 'Total Sales',
      'invoicedAmount': 'Invoiced Amount',
      'uninvoicedAmount': 'Uninvoiced Amount',
      'paidAmount': 'Paid Amount',
      'creditBalance': 'Credit Balance',
      'outstandingDebt': 'Outstanding Debt',
      'salesHistory': 'Sales History',
      'invoiceHistory': 'Invoice History',
      'paymentHistory': 'Payment History',
      'quantity': 'Quantity'
    },

    // Invoice Details
    'invoiceDetails': {
      'title': 'Invoice Details',
      'client': 'Client',
      'status': 'Status',
      'dates': 'Dates',
      'issuedOn': 'Issued On',
      'dueBy': 'Due By',
      'amounts': 'Amounts',
      'subtotal': 'Subtotal',
      'tax': 'Tax',
      'total': 'Total',
      'amountPaid': 'Amount Paid',
      'remainingAmount': 'Remaining Amount',
      'sales': 'Related Sales',
      'payments': 'Payments',
      'quantity': 'Quantity'
    },

    // PDF Export
    'pdf': {
      'export': 'Export as PDF',
      'generated': 'PDF generated successfully',
      'error': 'Error generating PDF',
      'clientNotFound': 'Client not found',
      'saleNotFound': 'Sale not found',
      'quantity': 'Quantity'
    },

    'productTypes': {
      'coil': 'Coil',
      'steelSlitting': 'Steel Slitting',
      'corrugatedSheet': 'Corrugated Sheet',
    },
    analytics: {
      soldProducts: 'Analytics',
      title: 'Sold Products Analytics',
      dateRange: 'Date Range',
      productType: 'Product Type',
      client: 'Client',
      thickness: 'Thickness (mm)',
      width: 'Width (mm)',
      unitPriceMin: 'Unit Price Min',
      unitPriceMax: 'Unit Price Max',
      paymentStatus: 'Payment Status',
      totalWeightSold: 'Total Weight Sold',
      totalRevenue: 'Total Revenue',
      totalQuantitySold: 'Total Quantity Sold',
      uniqueClients: 'Unique Clients',
      productName: 'Product Name',
      clientName: 'Client Name',
      quantitySold: 'Quantity Sold',
      weight: 'Weight (ton)',
      unitPrice: 'Unit Price',
      totalPrice: 'Total Price',
      invoiceNumber: 'Invoice Number',
      saleDate: 'Sale Date',
      loadingSummary: 'Loading summary...',
      loadingData: 'Loading data...',
      officialTotalRevenue: 'Official Total Revenue',
      itemTotalRevenue: 'Product Total Revenue',
      officialTotalRevenueTooltip: 'Sum of sales (invoices) with tax (TTC). Matches official accounting.',
      itemTotalRevenueTooltip: 'Sum of sold product amounts (with VAT). Useful for product-level analysis.',
    },
  },
  fr: {
    // Common
    'common': {
      'edit': 'Modifier',
      'delete': 'Supprimer',
      'cancel': 'Annuler',
      'actions': 'Actions'
    },
    // Status
    'status': {
      'invoiced': 'Facturé',
      'notInvoiced': 'Non facturé',
      'paid': 'Payé',
      'unpaid': 'Non Payé',
      'overdue': 'En Retard',
      'pending': 'En Attente',
      'partiallyPaid': 'Partiellement payé'
    },

    // General
    'general': {
      'auditLog': 'Journal d\'audit',
      'settings': 'Paramètres',
      'save': 'Enregistrer',
      'language': 'Langue',
      'currency': 'Devise',
      'darkMode': 'Mode Sombre',
      'notifications': 'Notifications',
      'saveSuccess': 'Paramètres enregistrés',
      'description': 'Configurer',
      'export': 'Exporter',
      'timeRange': 'Période',
      'allTime': 'Tout',
      'thisMonth': 'Ce Mois',
      'thisQuarter': 'Ce Trimestre',
      'thisYear': 'Cette Année',
      'search': 'Rechercher',
      'noData': 'Aucune donnée',
      'items': 'Éléments',
      'actions': 'Actions',
      'edit': 'Modifier',
      'view': 'Voir',
      'confirm': 'Confirmer',
      'cancel': 'Annuler',
      'close': 'Fermer',
      'back': 'Retour',
      'next': 'Suivant',
      'submit': 'Soumettre',
      'reset': 'Réinitialiser',
      'filter': 'Filtrer',
      'clear': 'Effacer',
      'refresh': 'Actualiser',
      'loading': 'Chargement',
      'error': 'Erreur',
      'success': 'Succès',
      'warning': 'Avertissement',
      'info': 'Info',
      'invoices': 'Factures',
      'reports': 'Rapports',
      'adminUser': 'Administrateur',
      'quantity': 'Quantité',
      'restore': 'Restaurer',
      'all': 'Tout',
      'allTypes': 'All Types',
      'allStatuses': 'All Statuses',
      'delete': 'Supprimer',
      'endOfList': 'Plus de résultats',
      'noResults': 'Aucun résultat trouvé',
      'allDataLoaded': 'Toutes les données ont été chargées',

    },

    auditLog: {
      title: "Journal d'audit",
      description: "Toutes les actions critiques du système sont enregistrées ici pour la conformité et la traçabilité.",
      searchPlaceholder: "Rechercher dans le journal...",
      empty: "Aucune entrée trouvée dans le journal d'audit.",
      id: 'ID',
      action: 'Action',
      entityType: "Type d'entité",
      entityId: "ID de l'entité",
      timestamp: 'Horodatage',
      details: 'Détails'
    },

    // Dashboard
    'dashboard': {
      'title': 'Tableau de bord',
      'summary': 'Résumé des ventes',
      'totalSales': 'Ventes totales',
      'average': 'Moyenne: {0}',
      'outstandingDebt': 'Créances en cours',
      'overdue': 'En retard: {0}',
      'totalClients': 'Total clients',
      'uninvoicedSales': 'Ventes non facturées',
      'salesWithoutInvoices': 'Ventes sans factures',
      'monthlySales': 'Ventes mensuelles',
      'salesOverTime': 'Évolution des ventes',
      'amount': 'Montant',
      'month': 'Mois: {0}',
      'topClients': 'Meilleurs clients',
      'recentSales': 'Activité récente',
      'recentActivity': 'Activité récente',
      'noRecentActivity': 'Les données d\'activité apparaîtront ici au fur et à mesure que vous ajoutez des ventes et des factures',
      'bankAccountBalance': 'Solde Compte Bancaire',
      'bankAndCheck': 'Virements Bancaires et Chèques',
      'quantity': 'Quantité',
      'invoiceIssued': 'Facture émise n°{invoiceNumber} ({amount})',
      'paymentFrom': 'Paiement de {client} ({amount})',
      'saleTo': 'Vente à {client} ({amount})',
      'newClients': 'Nouveaux clients',
      'overdueInvoices': 'Factures en retard',
      'unpaidInvoices': 'Factures impayées',
      'totalSalesCount': 'Nombre total de ventes',
      'monthlySalesCount': 'Nombre de ventes ce mois',
    },

    // Sales
    'sales': {
      'title': 'Ventes',
      'add': 'Ajouter une vente',
      'edit': 'Modifier la vente',
      'delete': 'Supprimer la vente',
      'view': 'Voir la vente',
      'list': 'Liste des ventes',
      'filter': 'Filtrer les ventes',
      'date': 'Date',
      'client': 'Client',
      'items': 'Articles',
      'total': 'Total',
      'status': 'Statut',
      'notes': 'Notes',
      'payment': 'Paiement',
      'invoice': 'Facture',
      'viewInvoice': 'Voir la facture',
      'quotation': 'Devis',
      'delivery': 'Livraison',
      'confirmation': 'Confirmation',
      'deleteConfirm': 'Êtes-vous sûr de vouloir supprimer cette vente ?',
      'deleted': 'La vente a été supprimée',
      'cannotChangeStatus': 'Impossible de changer le statut de la vente',
      'markedAsNotInvoiced': 'Vente marquée comme non facturée',
      'markedAsInvoiced': 'Vente marquée comme facturée',
      'exportPending': 'Export de {0} en cours...',
      'noSales': 'Aucune vente trouvée',
      'history': 'Historique des ventes',
      'invoiced': 'Facturé',
      'notInvoiced': 'Non facturé',
      'totalPaid': 'Total payé',
      'paid': 'Payé',
      'remaining': 'Montant restant',
      'paymentStatus': 'État de paiement',
      'fullyPaid': 'Entièrement payé',
      'partiallyPaid': 'Partiellement payé',
      'unpaid': 'Non payé',
      'clientNotFound': 'Client introuvable',
      'pdfGenerated': 'Devis généré avec succès',
      'paymentMethod': 'Méthode de paiement',
      'totalAmount': 'Montant total',
      'amountPaid': 'Montant payé',
      'actions': 'Actions',
      'pdfError': 'Erreur lors de la génération du devis',
      'quantity': 'Quantité',
      'showArchive': "Afficher l'archive",
      'showActive': 'Afficher les actifs',
      'archive': 'Ventes supprimées',
      'number': 'Numéro de vente',
      'deletedAt': 'Supprimé le',
      'deleteBlocked': 'Suppression impossible : la facture liée est payée.',
      'blockedByInvoice': 'Bloqué par la facture',
      'invoicedFilter': 'Statut de facturation'
    },

    // Clients
    'clients': {
      'title': 'Clients',
      'add': 'Ajouter un client',
      'edit': 'Modifier le client',
      'delete': 'Supprimer le client',
      'view': 'Voir le client',
      'list': 'Liste des clients',
      'filter': 'Filtrer les clients',
      'name': 'Nom',
      'company': 'Société',
      'email': 'Email',
      'phone': 'Téléphone',
      'address': 'Adresse',
      'notes': 'Notes',
      'status': 'Statut',
      'since': 'Client depuis',
      'lastOrder': 'Dernière commande',
      'totalOrders': 'Total des commandes',
      'totalSpent': 'Total dépensé',
      'contact': 'Contact',
      'debt': 'Créances',
      'deleteConfirm': 'Êtes-vous sûr de vouloir supprimer {0} ?',
      'deleted': 'Le client {0} a été supprimé',
      'noClients': 'Aucun client trouvé',
      'form': {
        'title': 'Ajouter un client',
        'editTitle': 'Modifier le client',
        'name': 'Nom',
        'company': 'Société',
        'email': 'Email',
        'phone': 'Téléphone',
        'address': 'Adresse',
        'nif': 'NIF',
        'nis': 'NIS ',
        "rc": "RC ",
        "ai": "AI ",
        'rib': 'RIB (Relevé d\'Identité Bancaire)',
        'placeholders': {
          'name': 'John Doe',
          'company': 'ACME Corp',
          'email': 'john@example.com',
          'phone': '0660 XX XX XX',
          'address': '123 Main St, City, Country',
          'nif': 'Numéro d\'Identification Fiscale',
          'nis': 'Numéro d\'Identification Statistique',
          'rc': 'Numéro du Registre de Commerce',
          'ai': 'Numéro d\'Article d\'Imposition',
          'rib': 'Numéro de compte bancaire (RIB)',
        },
        'actions': {
          'cancel': 'Annuler',
          'add': 'Ajouter le client',
          'update': 'Mettre à jour le client'
        },
      },
      'quantity': 'Quantité'
    },

    // Company
    'company': {
      'title': 'Entreprise',
      'description': 'Gérer les informations de votre entreprise',
      'name': 'Nom de l\'entreprise',
      'email': 'Adresse email',
      'phone': 'Numéro de téléphone',
      'address': 'Adresse',
      'taxId': 'Numéro d\'identification fiscale',
      'nis': 'Numéro d\'identification statistique',
      'rc': 'Registre du commerce',
      'ai': 'Article d\'imposition',
      'rib': 'RIB (Relevé d\'Identité Bancaire)',
      'quantity': 'Quantité'
    },

    // Invoice
    'invoice': {
      'title': 'Paramètres de facturation',
      'description': 'Configurer les paramètres de facturation',
      'prefixes': 'Préfixes de facture',
      'prefixesDescription': 'Ajouter et gérer les préfixes de numéro de facture',
      'prefixPlaceholder': 'Entrer le préfixe',
      'addPrefix': 'Ajouter un préfixe',
      'defaultPrefix': 'Définir par défaut',
      'deletePrefix': 'Supprimer le préfixe',
      'nextNumber': 'Prochain numéro de facture',
      'paymentTerms': 'Conditions de paiement',
      'notes': 'Notes par défaut',
      'autoPdf': 'Générer automatiquement le PDF',
      'quantity': 'Quantité',
      'deleteDraftTitle': 'Supprimer le brouillon de facture',
      'deleteConfirmTitle': 'Supprimer la facture ?',
      'deleteDraftConfirm': 'Cette facture est un brouillon et n\'a aucun paiement. Elle sera supprimée définitivement. Cette action est irréversible.',
      'deleteWarning': 'Cette facture a des paiements ou est finalisée. Elle sera archivée (suppression douce), et toutes les données seront conservées pour la conformité.',
      'salesCount': '{count} ventes liées',
      'paymentsCount': '{count} paiements liés',
      'deleteDraftAction': 'Supprimer définitivement',
      'deleteAction': 'Archiver la facture'
    },

    // Import/Export
    'importExport': {
      'title': 'Import/Export',
      'description': 'Importer ou exporter vos données',
      'importPending': 'Importation des données...',
      'exportPending': 'Exportation des données...',
      'reports': {
        'title': 'Rapports',
        'debtOverview': 'Aperçu des Créances',
        'debtStatus': 'État actuel des créances et principaux débiteurs',
        'overdue': 'En Retard',
        'upcoming': 'À Venir',
        'topClients': 'Principaux Clients',
        'noDebts': 'Aucune créance en cours',
        'invoiceStatus': 'État des Factures',
        'invoiceStatusDesc': 'Répartition des factures payées et impayées',
        'salesStatus': 'État des Ventes',
        'salesStatusDesc': 'Répartition des ventes facturées et non facturées',
        'detailedReports': 'Rapports Détaillés',
        'detailedDesc': 'Voir les rapports détaillés par catégorie',
        'clientDebtReport': 'Rapport des Créances Clients',
        'salesReport': 'Rapport des Ventes',
        'outstandingAmount': 'Montant Dû',
        'overdueInvoices': 'Factures en Retard',
        'upcomingInvoices': 'Factures à Venir',
        'noClientDebt': 'Aucun client avec des créances en cours',
        'noOutstandingDebts': 'Aucune créance pour la période sélectionnée',
        'noSalesData': 'Aucune donnée de vente pour la période sélectionnée',
        'quantity': 'Quantité'
      }
    },

    // Reports
    'reports': {
      'title': 'Rapports',
      'debtOverview': 'Aperçu des Créances',
      'debtStatus': 'État actuel des créances et principaux débiteurs',
      'overdue': 'En Retard',
      'upcoming': 'À Venir',
      'topClients': 'Principaux Clients',
      'noDebts': 'Aucune créance en cours',
      'invoiceStatus': 'État des Factures',
      'invoiceStatusDesc': 'Répartition des factures payées et impayées',
      'salesStatus': 'État des Ventes',
      'salesStatusDesc': 'Répartition des ventes facturées et non facturées',
      'detailedReports': 'Rapports Détaillés',
      'detailedDesc': 'Voir les rapports détaillés par catégorie',
      'clientDebtReport': 'Rapport des Créances Clients',
      'salesReport': 'Rapport des Ventes',
      'outstandingAmount': 'Montant Dû',
      'overdueInvoices': 'Factures en Retard',
      'upcomingInvoices': 'Factures à Venir',
      'noClientDebt': 'Aucun client avec des créances en cours',
      'noOutstandingDebts': 'Aucune créance pour la période sélectionnée',
      'noSalesData': 'Aucune donnée de vente pour la période sélectionnée',
      'quantity': 'Quantité'
    },

    // Forms
    'form': {
      'required': 'Ce champ est obligatoire',
      'invalidEmail': 'Adresse email invalide',
      'invalidPhone': 'Numéro de téléphone invalide',
      'save': 'Enregistrer',
      'cancel': 'Annuler',
      'error': 'Une erreur est survenue',
      'success': 'Opération réussie',
      
      // Sale Form
      'sale': {
        'title': 'Nouvelle Vente',
        'editTitle': 'Modifier la Vente',
        'client': 'Client',
        'selectClient': 'Sélectionner un client',
        'date': 'Date de vente',
        'items': 'Articles',
        'addItem': 'Ajouter un article',
        'itemName': 'Nom de l\'article',
        'description': 'Description',
        'quantity': 'Quantity',
        'unitPrice': 'Prix unitaire',
        'tax': 'Taux de TVA',
        'total': 'Total',
        'totalHT': 'Total HT',
        'totalTTC': 'Total TTC',
        'tva': 'TVA',
        'subtotal': 'Sous-total',
        'totalTax': 'Total TVA',
        'totalAmount': 'Montant total',
        'notes': 'Notes',
        'transportationFee': 'Frais de transport',
        'coilRef': 'Référence bobine',
        'coilThickness': 'Épaisseur (mm)',
        'coilWidth': 'Largeur (mm)',
        'topCoatRAL': 'RAL face supérieure',
        'backCoatRAL': 'RAL face inférieure',
        'coilWeight': 'Poids (tons)',
        'pricePerTon': 'Prix par tonne (DA)',
        'itemTotal': 'Total article',
        'summary': 'Résumé',
        'subtotalHT': 'Sous-total HT',
        'totalTVA': 'Total TVA (19%)',
        'finalTotal': 'Total TTC',
        'quantityPositive': 'La quantité doit être positive',
        'pricePositive': 'Le prix doit être positif',
        'itemRequired': 'Au moins un article est requis',
        'coilDescription': 'BOBINES D\'ACIER PRELAQUE {0}*{1}',
        'coilDescriptionWithRAL': 'BOBINES D\'ACIER PRELAQUE {0}*{1} RAL {2}/{3}',
        'addSale': 'Ajouter une vente',
        'addSaleMethod': 'Ajouter une méthode de vente',
        'paymentMethod': 'Mode de paiement',
        'paymentMethods': {
          'cash': 'Espèces',
          'bank': 'Virement bancaire',
          'check': 'Chèque',
          'card': 'Carte',
          'other': 'Autre'
        },
        'export': {
          'quotation': 'Exporter le devis',
          'invoice': 'Exporter la facture',
          'generating': 'Génération du document...'
        },
        'productType': 'Type de produit',
        'productTypeCoil': 'Coil',
        'productTypeSteelSlitting': 'Refendage acier',
        'productTypeCorrugatedSheet': 'Tôle ondulée',
        'corrugatedSheetDescription': 'Tôle ondulée {0}mm x {1}m, {2} unités, RAL {3}/{4}',
        'steelSlittingDescription': 'Refendage acier {0}mm x {1}mm'
      },

      // Payment Form
      'payment': {
        'title': 'Paiement',
        'method': 'Mode de paiement',
        'methods': {
          'cash': 'Espèces',
          'bank': 'Virement bancaire',
          'check': 'Chèque',
          'card': 'Carte',
          'other': 'Autre'
        },
        'status': 'Statut de paiement',
        'paid': 'Payé',
        'unpaid': 'Non payé',
        'partial': 'Partiellement payé',
        'quantity': 'Quantity',
        'checkNumber': 'Numéro de chèque'
      },

      // Client Form
      'client': {
        'title': 'Add Client',
        'addTitle': 'Ajouter un client',
        'name': 'Nom',
        'company': 'Société',
        'email': 'Email',
        'phone': 'Téléphone',
        'address': 'Adresse',
        'nif': 'NIF (Numéro d\'Identification Fiscale)',
        'nis': 'NIS (Numéro d\'Identification Statistique)',
        'rc': 'RC (Registre de Commerce)',
        'ai': "AI (Article d'Imposition)",
        'placeholders': {
          'name': 'John Doe',
          'company': 'ACME Corp',
          'email': 'john@example.com',
          'phone': '0660 XX XX XX',
          'address': '123 Main St, City, Country',
          'nif': 'Numéro d\'Identification Fiscale',
          'nis': 'Numéro d\'Identification Statistique',
          'rc': 'Numéro du Registre de Commerce',
          'ai': "Numéro d'Article d'Imposition"
        },
        'actions': {
          'cancel': 'Annuler',
          'add': 'Ajouter le client'
        },
        'quantity': 'Quantity'
      }
    },

    // Sale Form
    'saleForm': {
      'title': 'Nouvelle Vente',
      'editTitle': 'Modifier la Vente',
      'client': 'Client',
      'selectClient': 'Sélectionner un client',
      'date': 'Date de vente',
      'items': 'Articles',
      'addItem': 'Ajouter un article',
      'itemName': 'Nom de l\'article',
      'description': 'Description',
      'quantity': 'Quantity',
      'unitPrice': 'Prix unitaire',
      'tax': 'Taux de TVA',
      'total': 'Total',
      'subtotal': 'Sous-total',
      'totalTax': 'Total TVA',
      'totalAmount': 'Montant total',
      'notes': 'Notes',
      'paymentMethod': 'Mode de paiement',
      'cash': 'Espèces',
      'bank': 'Virement bancaire',
      'check': 'Chèque',
      'other': 'Autre',
      'paymentStatus': 'Statut de paiement',
      'invoiceStatus': 'Statut de facturation',
      'createInvoice': 'Créer une facture',
      'success': 'Vente enregistrée avec succès',
      'error': 'Erreur lors de l\'enregistrement de la vente',
      'quantity': 'Quantity'
    },

    // Client Form
    'clientForm': {
      'title': 'Add New Client',
      'editTitle': 'Edit Client',
      'personalInfo': 'Personal Information',
      'name': 'Full Name',
      'email': 'Email Address',
      'phone': 'Phone Number',
      'companyInfo': 'Company Information',
      'company': 'Company Name',
      'taxId': 'Tax ID',
      'nis': 'NIS Number',
      'rc': 'RC Number',
      'ai': 'AI Number',
      'address': 'Address',
      'street': 'Street Address',
      'city': 'City',
      'state': 'State/Province',
      'postalCode': 'Postal Code',
      'country': 'Country',
      'notes': 'Additional Notes',
      'success': 'Client successfully saved',
      'error': 'Error saving client',
      'duplicateEmail': 'A client with this email already exists',
      'quantity': 'Quantity'
    },

    // Invoices
    'invoices': {
      'title': 'Factures',
      'searchPlaceholder': 'Rechercher des factures...',
      'create': 'Créer une facture',
      'invoiceNumber': 'N° Facture',
      'client': 'Client',
      'date': 'Date',
      'dueDate': 'Date d\'échéance',
      'amount': 'Montant',
      'status': 'Statut',
      'actions': 'Actions',
      'noMatch': 'Aucune facture ne correspond à votre recherche.',
      'noInvoices': 'Aucune facture trouvée. Créez votre première facture.',
      'edit': 'Modifier',
      'delete': 'Supprimer',
      'viewDetails': 'Voir les détails',
      'downloadPDF': 'Télécharger le PDF',
      'deleteConfirm': 'Êtes-vous sûr de vouloir supprimer cette facture ?',
      'deleted': 'La facture a été supprimée',
      'editTitle': 'Modifier la facture',
      'createTitle': 'Créer une nouvelle facture',
      'editDesc': 'Mettez à jour les détails de la facture ci-dessous.',
      'createDesc': 'Remplissez les détails ci-dessous pour créer une nouvelle facture.',
      'clientNotFound': 'Client introuvable',
      'pdfGenerated': 'Facture générée avec succès',
      'pdfError': 'Erreur lors de la génération de la facture',
      'invoice': 'Facture',
      'quantity': 'Quantity',
      'showArchive': "Afficher l'archive",
      'showActive': 'Afficher les actifs',
      'restore': 'Restaurer',
      'deleteDraftTitle': 'Supprimer le brouillon de facture',
      'deleteConfirmTitle': 'Supprimer la facture ?',
      'deleteDraftConfirm': 'Cette facture est un brouillon et n\'a aucun paiement. Elle sera supprimée définitivement. Cette action est irréversible.',
      'deleteWarning': 'Cette facture a des paiements ou est finalisée. Elle sera archivée (suppression douce), et toutes les données seront conservées pour la conformité.',
      'salesCount': '{count} ventes liées',
      'paymentsCount': '{count} paiements liés',
      'deleteDraftAction': 'Supprimer définitivement',
      'deleteAction': 'Archiver la facture'
    },

    // Payments
    'payments': {
      'title': 'Paiements',
      'add': 'Ajouter un paiement',
      'edit': 'Modifier le paiement',
      'delete': 'Supprimer le paiement',
      'date': 'Date de paiement',
      'amount': 'Montant',
      'method': 'Méthode de paiement',
      'notes': 'Notes',
      'status': 'Statut de paiement',
      'recorded': 'Paiement enregistré avec succès',
      'error': 'Erreur lors de l\'enregistrement du paiement',
      'deleteConfirm': 'Êtes-vous sûr de vouloir supprimer ce paiement ?',
      'deleted': 'Paiement supprimé avec succès',
      'selectMethod': 'Sélectionner la méthode de paiement',
      'warning': {
        'exceedsRemaining': 'Le paiement de {amount} dépasse le montant restant de {remaining}. Cela entraînera un solde créditeur.'
      },
      'methods': {
        'cash': 'Espèces',
        'bank_transfer': 'Virement bancaire',
        'check': 'Chèque',
        'term': 'À terme',
      },
      'quantity': 'Quantity',
      'showDeleted': 'Afficher les paiements supprimés',
      'showActive': 'Afficher les paiements actifs',
      'checkNumber': 'Numéro de chèque'
    },

    // Client Details
    'clientDetails': {
      'title': 'Client Details',
      'financialSummary': 'Financial Summary',
      'salesTotal': 'Total Sales',
      'invoicedAmount': 'Invoiced Amount',
      'uninvoicedAmount': 'Uninvoiced Amount',
      'paidAmount': 'Paid Amount',
      'creditBalance': 'Credit Balance',
      'outstandingDebt': 'Outstanding Debt',
      'salesHistory': 'Sales History',
      'invoiceHistory': 'Invoice History',
      'paymentHistory': 'Payment History',
      'quantity': 'Quantity'
    },

    // Invoice Details
    'invoiceDetails': {
      'title': 'Détails de la facture',
      'client': 'Client',
      'status': 'Status',
      'dates': 'Dates',
      'issuedOn': 'Date d\'émission',
      'dueBy': 'Date d\'échéance',
      'amounts': 'Montants',
      'subtotal': 'Sous-total',
      'tax': 'Taxe',
      'total': 'Total',
      'amountPaid': 'Montant payé',
      'remainingAmount': 'Montant restant',
      'sales': 'Ventes liées',
      'payments': 'Paiements',
      'quantity': 'Quantity'
    },

    // PDF Export
    'pdf': {
      'export': 'Exporter en PDF',
      'generated': 'PDF généré avec succès',
      'error': 'Erreur lors de la génération du PDF',
      'clientNotFound': 'Client introuvable',
      'saleNotFound': 'Vente introuvable',
      'quantity': 'Quantity'
    },

    'productTypes': {
      'coil': 'Bobine',
      'steelSlitting': 'Refendage acier',
      'corrugatedSheet': 'Tôle ondulée',
    },
    analytics: {
      soldProducts: 'Analyse',
      title: 'Analyse des produits vendus',
      dateRange: 'Plage de dates',
      productType: 'Type de produit',
      client: 'Client',
      thickness: 'Épaisseur (mm)',
      width: 'Largeur (mm)',
      unitPriceMin: 'P.U min',
      unitPriceMax: 'P.U max',
      paymentStatus: 'Statut de paiement',
      totalWeightSold: 'Poids total vendu',
      totalRevenue: 'Total',
      totalQuantitySold: 'Quantité totale vendue',
      uniqueClients: 'Clients uniques',
      productName: 'Nom du produit',
      clientName: 'Nom du client',
      quantitySold: 'Quantité vendue',
      weight: 'Poids (tonne)',
      unitPrice: 'P.U',
      totalPrice: 'Prix total',
      invoiceNumber: 'Numéro de facture',
      saleDate: 'Date de vente',
      loadingSummary: 'Chargement du résumé...',
      loadingData: 'Chargement des données...',
      officialTotalRevenue: 'Chiffre d\'affaires officiel',
      itemTotalRevenue: 'Chiffre d\'affaires produits',
      officialTotalRevenueTooltip: 'Somme des ventes TTC (factures officielles). Correspond à la comptabilité.',
      itemTotalRevenueTooltip: 'Somme des montants des produits vendus (avec TVA). Utile pour l\'analyse par produit.',
    },
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Helper function to get translations, supporting both flat and nested structures
const getTranslation = (translations: Translations, key: string): string => {
  // First try direct lookup (flat structure)
  const directTranslation = translations[key];
  if (typeof directTranslation === 'string') {
    return directTranslation;
  }

  // If not found, try nested lookup
  const parts = key.split('.');
  let current: NestedTranslations = translations;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      const next = current[part];
      if (typeof next === 'string') {
        return next;
      }
      current = next as NestedTranslations;
    } else {
      return key; // Return key if path not found
    }
  }

  return key; // Return key if we didn't find a string value
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language');
    return (savedLang as Language) || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return getTranslation(translations[language], key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}; 