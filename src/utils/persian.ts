// ===== PERSIAN & JALALI UTILITIES =====

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Converts English/Arabic numerals in a string or number to Persian numerals
 */
export function toPersianNum(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return '';
  return String(value).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/**
 * Formats a number with Persian comma separators and Persian numerals
 * Example: 113000 -> "۱۱۳٬۰۰۰"
 */
export function formatToman(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('en-US').replace(/,/g, '٬');
  return toPersianNum(formatted);
}

/**
 * Formats a Date or ISO string to Persian Jalali date
 * Uses Intl.DateTimeFormat('fa-IR-u-ca-persian')
 */
export function toJalaliDate(dateInput?: string | Date): string {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return '۱۴۰۵/۰۷/۳۰';
  }
}

export function toJalaliShort(dateInput?: string | Date): string {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return '۱۴۰۵/۰۷/۳۰';
  }
}

export function toJalaliTime(dateInput?: string | Date): string {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    return new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return '۱۰:۴۲';
  }
}

/**
 * Converts Persian/Arabic numerals in input strings back to English digits for math
 */
export function toEnglishDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}
