import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getPublicApiOrigin } from "@/lib/api-base"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string | undefined | null) {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (value === undefined || value === null || isNaN(value)) return "৳ 0.00";

  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2,
    currencyDisplay: 'symbol',
  }).format(value);
}

export function getImageUrl(path: string | undefined | null) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;

  const baseUrl = getPublicApiOrigin();

  // Normalize the path and combine with base URL
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${baseUrl}/${cleanPath}`;
}
