import {
  parse as dateFnsParse,
  format as dateFnsFormat,
  isValid,
  getYear,
  startOfDay,
  nextDay,
  Day,
} from 'date-fns';
// Ensure you have Chinese locale if needed for weekday parsing/formatting
// import { zhCN } from 'date-fns/locale';

// Consistent internal format
export const DATE_FORMAT_STORAGE = 'yyyy-MM-dd';

/**
 * Parses a string potentially representing a date in various formats.
 * Handles: yyyy-mm-dd, mm-dd, Chinese weekdays.
 * @param text The input string from the user.
 * @returns The date formatted as 'yyyy-MM-dd' or null if parsing fails.
 */
export function parseDateString(text: string | null): string | null {
  if (!text) return null;

  const trimmedText = text.trim();
  if (!trimmedText) return null;

  const today = startOfDay(new Date());
  const currentYear = getYear(today);

  // 1. Try yyyy-MM-dd
  let parsed = dateFnsParse(trimmedText, 'yyyy-MM-dd', today);
  if (isValid(parsed)) {
    return dateFnsFormat(parsed, DATE_FORMAT_STORAGE);
  }

  // 2. Try MM-DD (assume current year)
  // Use regex for stricter MM-DD format check before parsing
  if (/^\d{1,2}-\d{1,2}$/.test(trimmedText)) {
    parsed = dateFnsParse(`${currentYear}-${trimmedText}`, 'yyyy-MM-dd', today);
    if (isValid(parsed)) {
      return dateFnsFormat(parsed, DATE_FORMAT_STORAGE);
    }
  }

  // 3. Try Weekday (Chinese) - Find *next* occurrence
  // Ensure your keys match the exact input you expect
  const weekdayMap: { [key: string]: Day } = {
    '星期日': 0, '周日': 0, '星期天': 0, '周天': 0,
    '星期一': 1, '周一': 1,
    '星期二': 2, '周二': 2,
    '星期三': 3, '周三': 3,
    '星期四': 4, '周四': 4,
    '星期五': 5, '周五': 5,
    '星期六': 6, '周六': 6,
  };

  if (trimmedText in weekdayMap) {
    const targetDay = weekdayMap[trimmedText];
    // Ensure today isn't the target day if we want strictly *next*
    // const baseDate = getDay(today) === targetDay ? addDays(today, 1) : today;
    // const nextOccurrence = nextDay(baseDate, targetDay);
    // Simpler: nextDay finds the next occurrence *after* the reference date
    const nextOccurrence = nextDay(today, targetDay);
    return dateFnsFormat(nextOccurrence, DATE_FORMAT_STORAGE);
  }

  // Add more rules here if needed (e.g., "明天", "今天")

  return null; // No valid format recognized
}

/**
 * Converts a 'yyyy-MM-dd' string to a Date object for the date picker.
 * Returns null if the string is invalid.
 * Important: Use T00:00:00Z (UTC midnight) or parse carefully
 * to avoid timezone shifting the date. date-fns handles this well.
 */
export function dateStringToDateObject(dateString: string | null): Date | undefined {
  if (!dateString) return undefined;
  const parsed = dateFnsParse(dateString, DATE_FORMAT_STORAGE, new Date());
  return isValid(parsed) ? parsed : undefined;
}

/**
 * Formats a Date object (e.g., from picker) into 'yyyy-MM-dd' string.
 */
export function dateObjectToDateString(date: Date | null | undefined): string | null {
  if (!date || !isValid(date)) return null;
  return dateFnsFormat(date, DATE_FORMAT_STORAGE);
}

/**
 * Formats a stored 'yyyy-MM-dd' date for default display if needed,
 * although requirement is to show original user input primarily.
 * Example: Could format '2025-10-31' as 'Oct 31, 2025'
 */
// export function formatDateForDisplay(dateValue: string | null): string {
//   const dateObj = dateStringToDateObject(dateValue);
//   if (!dateObj) return 'Invalid Date';
//   // Customize format as needed
//   return dateFnsFormat(dateObj, 'PP'); // e.g., 'Oct 31, 2025'
// }
