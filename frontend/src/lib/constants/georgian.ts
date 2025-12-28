export const GEORGIAN_CURRENCY = {
  code: 'GEL',
  symbol: '₾',
  name: 'ლარი',
}

export const GEORGIAN_UNITS = {
  kg: 'კგ',
  unit: 'ცალი',
  pack: 'შეკვრა',
  liter: 'ლიტრი',
  box: 'ყუთი',
  gram: 'გრამი',
} as const

export const GEORGIAN_ORDER_STATUS = {
  pending: 'მოლოდინში',
  confirmed: 'დადასტურებული',
  priced: 'ფასდაუდებელი',
  out_for_delivery: 'გზაშია',
  delivered: 'მიწოდებული',
  received: 'მიღებული',
  cancelled: 'გაუქმებული',
} as const

export const GEORGIAN_MONTHS = [
  'იანვარი',
  'თებერვალი',
  'მარტი',
  'აპრილი',
  'მაისი',
  'ივნისი',
  'ივლისი',
  'აგვისტო',
  'სექტემბერი',
  'ოქტომბერი',
  'ნოემბერი',
  'დეკემბერი',
]

/**
 * Formats a number as GEL currency
 * @param amount - The amount to format
 * @returns Formatted string (e.g., "1,234.56 ₾")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ka-GE', {
    style: 'currency',
    currency: 'GEL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatGEL = formatCurrency

/**
 * Formats a date in Georgian format
 * @param date - Date object or ISO string
 * @param includeTime - Whether to include time
 * @returns Formatted string (e.g., "22 ნოემბერი 2025")
 */
export function formatDate(date: Date | string, includeTime: boolean = false): string {
  const d = new Date(date)

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }

  if (includeTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }

  return new Intl.DateTimeFormat('ka-GE', options).format(d)
}

export const formatGeorgianDate = formatDate

export function getStatusLabel(status: string): string {
  return GEORGIAN_ORDER_STATUS[status as keyof typeof GEORGIAN_ORDER_STATUS] || status
}
