const units = [
  '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept',
  'dix-huit', 'dix-neuf'
];

const tens = [
  '', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante',
  'quatre-vingt', 'quatre-vingt'
];

const scales = ['', 'mille', 'million', 'milliard', 'billion'];

function convertLessThanOneThousand(number: number): string {
  if (number === 0) {
    return '';
  }

  let result = '';

  if (number >= 100) {
    if (Math.floor(number / 100) === 1) {
      result = 'cent ';
    } else {
      result = units[Math.floor(number / 100)] + ' cent ';
    }
    number %= 100;
  }

  if (number >= 20) {
    const ten = Math.floor(number / 10);
    const unit = number % 10;

    result += tens[ten];

    if (unit === 1 && ten !== 8) {
      result += ' et un';
    } else if (unit > 0) {
      result += '-' + units[unit];
    }

    // Special cases for French numbers
    if (ten === 7 || ten === 9) {
      result = result.replace(tens[ten], tens[ten - 1] + '-' + units[10 + (number % 10)]);
    }
  } else {
    result += units[number];
  }

  return result.trim();
}

export function numberToWords(number: number): string {
  if (number === 0) {
    return 'zéro';
  }

  // Round to 2 decimal places and split into integer and decimal parts
  const roundedNumber = Math.round(number * 100) / 100;
  const [integerPart, decimalPart] = roundedNumber.toString().split('.');
  const integerNumber = parseInt(integerPart);

  let result = '';
  let scaleIndex = 0;
  let n = integerNumber;

  do {
    const hundreds = n % 1000;
    if (hundreds !== 0) {
      const words = convertLessThanOneThousand(hundreds);
      if (scaleIndex > 0) {
        if (hundreds === 1 && scaleIndex === 1) {
          result = scales[scaleIndex] + ' ' + result;
        } else {
          result = words + ' ' + scales[scaleIndex] + (hundreds > 1 && scaleIndex > 1 ? 's' : '') + ' ' + result;
        }
      } else {
        result = words + ' ' + result;
      }
    }
    scaleIndex++;
    n = Math.floor(n / 1000);
  } while (n > 0);

  return result.trim();
} 