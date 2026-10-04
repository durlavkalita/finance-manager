/**
 * Converts integer paise to clean formatted INR currency string.
 * Example: 800000 -> "₹8,000", 45050 -> "₹450.50", -120000 -> "-₹1,200"
 */
export function formatPaiseToINR(paise: number, showDecimalsIfZero: boolean = false): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise));
  const rupees = Math.floor(absPaise / 100);
  const remainingPaise = absPaise % 100;

  const formattedRupees = rupees.toLocaleString('en-IN');

  let result = '';
  if (remainingPaise === 0 && !showDecimalsIfZero) {
    result = `₹${formattedRupees}`;
  } else {
    const paiseStr = remainingPaise.toString().padStart(2, '0');
    result = `₹${formattedRupees}.${paiseStr}`;
  }

  return isNegative ? `-${result}` : result;
}

/**
 * Parses user input (string or number in INR) to integer paise.
 * Examples: "8000" -> 800000, "450.50" -> 45050, "8,000" -> 800000
 */
export function parseINRToPaise(input: string | number): number {
  if (typeof input === 'number') {
    if (isNaN(input)) return 0;
    return Math.round(input * 100);
  }

  if (!input || typeof input !== 'string') return 0;

  // Clean string: remove ₹, commas, spaces
  const cleaned = input.replace(/[^0-9.-]/g, '');
  if (!cleaned) return 0;

  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;

  return Math.round(num * 100);
}

/**
 * Helper to display paise as formatted float string e.g. 45050 -> "450.50", 800000 -> "8000"
 */
export function paiseToInputString(paise: number): string {
  if (!paise) return '';
  const rupees = paise / 100;
  return rupees.toString();
}
