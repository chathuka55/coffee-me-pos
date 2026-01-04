import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { storage } from '@/lib/store';

export function formatCurrency(value: number, locale?: string, currencyCode?: string) {
  try {
    const settings = storage.getSettings();
    const loc = locale || settings.currencyLocale || 'en-IN';
    const cur = currencyCode || settings.currencyCode || 'INR';
    return new Intl.NumberFormat(loc, { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(value);
  } catch (e) {
    return value.toFixed(2);
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
