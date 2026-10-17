// src/utils/format.ts
const currencyCode = import.meta.env.VITE_CURRENCY_CODE?.trim() || 'USD';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}
