// Shared TypeScript types matching backend models

export type MesRef = string; // format: 'YYYY-MM'

export type CurrencyCode = "INR" | "USD" | "ICP";

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: "₹",
  USD: "$",
  ICP: "ICP",
};

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  INR: "Indian Rupee (₹)",
  USD: "US Dollar (USD)",
  ICP: "ICP",
};

export interface ExchangeRates {
  usdToInr: number;
  icpToUsd: number;
  icpToInr: number;
  lastUpdated: bigint;
}

export interface TotalesMes {
  ingresosTotal: number;
  gastosTotal: number;
  inversionesTotal: number;
  saldo: number;
}

export interface FuenteIngreso {
  id: string;
  descripcion: string;
  valor: number;
  fecha?: string; // dd/mm/aaaa — optional for backward compatibility
  mesReferencia: string;
  monedaOriginal: CurrencyCode;
  imagenUrl?: string | null;
}

export interface Transaccion {
  id: string;
  descripcion: string;
  valor: number;
  fecha: string; // dd/mm/aaaa
  categoria: string;
  metodoPago: string;
  esEsencial: boolean;
  pagado: boolean;
  esGastoFijo: boolean;
  mesReferencia: string;
  monedaOriginal: CurrencyCode;
  imagenUrl?: string | null;
}

export interface MetaAhorro {
  id: string;
  nombre: string;
  metaTotal: number;
  ahorroAcumulado: number;
  ahorroEsteMes: number;
}

export interface MesState {
  year: number;
  month: number; // 1-12
}

export const CATEGORIAS_DEFAULT = [
  "Comida/Alimentación",
  "Transporte",
  "Supermercado",
  "Vivienda",
  "Servicios del hogar",
  "Membresías",
  "Suscripciones",
] as const;

export const METODOS_PAGO_DEFAULT = [
  "Efectivo",
  "Tarjeta de crédito",
  "Tarjeta de débito",
  "Transferencia bancaria",
  "Factura/Recibo",
  "Pago móvil",
] as const;
