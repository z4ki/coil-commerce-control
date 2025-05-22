/**
 * Format a monetary value to currency format
 */
export const formatCurrency = (amount: number): string => {
  // Format number with French formatting (uses spaces for thousands)
  const formattedNumber = amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).replace(/\s/g, '\u00A0');;
  
  // Keep spaces for PDF display
  return formattedNumber;
};




/**
 * Format a date to a readable string
 */
export const formatDate = (date: Date, format?: string): string => {
  // If format is provided and is 'YYYYMMDD', use a custom format
  if (format === 'YYYYMMDD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
  
  // Otherwise use the default format
  const language = localStorage.getItem('language') || 'fr';
  return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

/**
 * Format a date to display in an input field
 */
export const formatDateInput = (date: Date | null): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Parse a date string from an input field
 */
export const parseDateInput = (dateString: string): Date => {
  return new Date(dateString);
};

/**
 * Generate a unique invoice number with a custom prefix and next number from settings
 */
export const generateInvoiceNumber = (prefix: string = 'FAC', nextNumber?: number): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // last two digits
  const formattedNumber = nextNumber ? 
    nextNumber.toString().padStart(5, '0') : 
    Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit number
  return `${prefix}-${year}/${formattedNumber}`;
};
