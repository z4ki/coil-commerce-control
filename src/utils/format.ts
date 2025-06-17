/**
 * Format a monetary value to currency format
 */
export const formatCurrency = (amount: number | undefined | null): string => {
  // Handle undefined, null, or NaN values
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0,00';
  }

  // Ensure amount is a number and handle negative values
  const numericAmount = Math.abs(Number(amount));
  
  // Format number with French formatting (uses spaces for thousands)
  const formattedNumber = numericAmount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).replace(/\s/g, '\u00A0');
  
  // Add negative sign if needed
  return amount < 0 ? `-${formattedNumber}` : formattedNumber;
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

// /**
//  * Parse a date string from an input field
//  */
// export const parseDateInput = (dateString: string): Date => {
//   return new Date(dateString);
// };
/**
 * Parses a date string from an <input type="date"> (YYYY-MM-DD)
 * into a JavaScript Date object, correctly handling timezones.
 * @param dateString The date string to parse.
 * @returns A Date object or null if the input is invalid.
 */
export const parseDateInput = (dateString: string): Date | null => {
  // Guard against null, undefined, or non-string inputs
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  // The 'T00:00:00' part is crucial. It tells the Date constructor
  // to parse the date in the user's local timezone, not UTC. This avoids
  // the common "off-by-one-day" error that can happen when using new Date('YYYY-MM-DD').
  const localDate = new Date(`${dateString}T00:00:00`);

  // Check if the constructed date is valid
  if (isNaN(localDate.getTime())) {
    console.error("Invalid date string provided to parseDateInput:", dateString);
    return null;
  }

  return localDate;
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
