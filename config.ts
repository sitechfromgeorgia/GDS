/**
 * Application Configuration
 * Centralized configuration for all app-wide constants and settings.
 * Values can be overridden via environment variables.
 */

// Company Information
export const COMPANY = {
  name: import.meta.env.VITE_COMPANY_NAME || "Greenland77",
  fullName: "შპს გრინლენდ77",
  phone: import.meta.env.VITE_COMPANY_PHONE || "+995514017101",
  phoneFormatted: "+995 514 01 71 01",
  email: import.meta.env.VITE_COMPANY_EMAIL || "greenland77distribution@gmail.com",
  identificationCode: import.meta.env.VITE_COMPANY_ID || "445763512",
  whatsapp: "https://wa.me/995514017101",
} as const;

// Demo Account Credentials
export const DEMO = {
  email: "demo@gds.ge",
  password: "gds2025",
} as const;

// Application Settings
export const APP_SETTINGS = {
  // Timeouts (in milliseconds)
  authTimeout: 10000,
  profileFetchTimeout: 8000,
  apiRequestTimeout: 10000,

  // Realtime subscription
  realtimeMaxRetries: 5,
  realtimeMaxRetryDelay: 30000, // 30 seconds

  // Pagination
  defaultPageSize: 20,
  maxPageSize: 100,

  // File uploads
  maxImageSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],

  // Local storage keys
  storageKeys: {
    theme: "gds_theme",
    session: "gds_session",
    config: "gds_system_config",
  },
} as const;

// Order Status Colors
export const ORDER_STATUS_COLORS = {
  PENDING: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-800 dark:text-yellow-300",
    border: "border-yellow-200 dark:border-yellow-800",
  },
  CONFIRMED: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  OUT_FOR_DELIVERY: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-800 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  DELIVERED: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  COMPLETED: {
    bg: "bg-gray-100 dark:bg-gray-900/30",
    text: "text-gray-800 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-700",
  },
} as const;

// Georgian Units
export const UNITS = {
  kg: "კგ",
  piece: "ცალი",
  jar: "ქილა",
  bag: "ტომარა",
  liter: "ლიტრი",
  bunch: "კონა",
  pack: "შეკვრა",
  bottle: "ბოთლი",
} as const;

// Helper function to get company phone as tel: link
export const getPhoneLink = () => `tel:${COMPANY.phone}`;

// Helper function to get company email as mailto: link
export const getEmailLink = () => `mailto:${COMPANY.email}`;

// Type exports for TypeScript usage
export type OrderStatusColor = keyof typeof ORDER_STATUS_COLORS;
export type UnitKey = keyof typeof UNITS;
