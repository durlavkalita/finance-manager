/**
 * Returns the current month key in "YYYY-MM" format.
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  return getMonthKeyFromDate(now);
}

/**
 * Extracts "YYYY-MM" month key from a Date object or ISO date string ("YYYY-MM-DD").
 */
export function getMonthKeyFromDate(date: Date | string): string {
  if (typeof date === 'string') {
    // If it's YYYY-MM-DD or ISO string
    if (date.length >= 7 && date.includes('-')) {
      return date.substring(0, 7);
    }
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    }
    return getCurrentMonthKey();
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Formats "YYYY-MM" to readable display string like "October 2026".
 */
export function formatMonthKeyDisplay(monthKey: string): string {
  if (!monthKey || monthKey.length !== 7 || !monthKey.includes('-')) {
    return monthKey;
  }
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed

  if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
    return monthKey;
  }

  const date = new Date(year, month, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Computes previous month key given "YYYY-MM".
 */
export function getPreviousMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1; // 1 to 12

  if (month === 1) {
    month = 12;
    year -= 1;
  } else {
    month -= 1;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Computes next month key given "YYYY-MM".
 */
export function getNextMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);

  if (month === 12) {
    month = 1;
    year += 1;
  } else {
    month += 1;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Validates ISO date format YYYY-MM-DD.
 */
export function isValidISODate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

/**
 * Returns today's ISO date string "YYYY-MM-DD".
 */
export function getTodayISODate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
