// Formatting utilities for currency, dates, and percentages
import type { CurrencyCode, ExchangeRates } from "@/types/finanzas";
import { CURRENCY_SYMBOLS } from "@/types/finanzas";

/**
 * Formats a value in any CurrencyCode with the correct symbol and decimals.
 */
export function formatCurrency(value: number, currency: CurrencyCode): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  if (currency === "ICP") {
    // ICP: up to 8 decimal places, remove trailing zeros
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(value);
    return `${symbol} ${formatted}`;
  }
  if (currency === "INR") {
    // INR: use en-IN locale for proper Indian number formatting
    const formatted = new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return `${symbol}${formatted}`;
  }
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${symbol} ${formatted}`;
}

/**
 * Converts an amount from one currency to another using INR as the base currency.
 * All stored values are treated as INR when no explicit currency is given.
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ExchangeRates,
): number {
  if (from === to) return amount;
  // Convert to INR first (base currency)
  let inrAmount = amount;
  if (from === "USD") inrAmount = amount * rates.usdToInr;
  else if (from === "ICP") inrAmount = amount * rates.icpToInr;
  // from === "INR" → already in INR
  // Convert from INR to target
  if (to === "INR") return inrAmount;
  if (to === "USD") return inrAmount / rates.usdToInr;
  if (to === "ICP") return inrAmount / rates.icpToInr;
  return inrAmount;
}

/**
 * Converts then formats a value. If rates are null, shows in original currency.
 */
export function convertAndFormat(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ExchangeRates | null,
): string {
  if (!rates || from === to) return formatCurrency(amount, from);
  const converted = convertCurrency(amount, from, to, rates);
  return formatCurrency(converted, to);
}

/**
 * Formats a Date object as dd/mm/aaaa string.
 * Example: new Date(2026, 2, 31) => '31/03/2026'
 */
export function formatFecha(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const aaaa = date.getFullYear();
  return `${dd}/${mm}/${aaaa}`;
}

/**
 * Formats a number as percentage string with 1 decimal.
 * Example: 70.7 => '70.7%'
 */
export function formatPorcentaje(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Parses a fecha string (dd/mm/aaaa) to a Date object.
 */
export function parseFecha(fecha: string): Date {
  const [dd, mm, aaaa] = fecha.split("/");
  return new Date(Number(aaaa), Number(mm) - 1, Number(dd));
}

/**
 * Calculates a percentage value (numerator / denominator * 100).
 * Returns 0 if denominator is 0.
 */
export function calcPorcentaje(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return (numerator / denominator) * 100;
}
