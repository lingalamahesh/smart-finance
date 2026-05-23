// Month/year utilities

/**
 * Returns a MesRef string from year and month.
 * Example: getMesRef(2026, 3) => '2026-03'
 */
export function getMesRef(year: number, month: number): string {
  const mm = String(month).padStart(2, "0");
  return `${year}-${mm}`;
}

/**
 * Parses a MesRef string back to year and month.
 * Example: parseMesRef('2026-03') => { year: 2026, month: 3 }
 */
export function parseMesRef(ref: string): { year: number; month: number } {
  const [yearStr, monthStr] = ref.split("-");
  return { year: Number(yearStr), month: Number(monthStr) };
}

export const MESES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const DIAS_ES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

/**
 * Returns the Spanish name for a month (1-indexed).
 * Example: getMesNombre(3) => 'Marzo'
 */
export function getMesNombre(month: number): string {
  return MESES_ES[month - 1] ?? "";
}

/**
 * Returns the Spanish day name (0=domingo...6=sábado).
 * Example: getDiaNombre(2) => 'martes'
 */
export function getDiaNombre(day: number): string {
  return DIAS_ES[day] ?? "";
}

/**
 * Returns the MesRef for the current real date.
 */
export function getMesRefActual(): string {
  const now = new Date();
  return getMesRef(now.getFullYear(), now.getMonth() + 1);
}

/**
 * Returns the previous month MesRef.
 */
export function getMesRefAnterior(year: number, month: number): string {
  if (month === 1) return getMesRef(year - 1, 12);
  return getMesRef(year, month - 1);
}

/**
 * Returns the next month MesRef.
 */
export function getMesRefSiguiente(year: number, month: number): string {
  if (month === 12) return getMesRef(year + 1, 1);
  return getMesRef(year, month + 1);
}

/**
 * Returns arrays of month and day names using i18n translation function.
 * Falls back to Spanish names if translation keys are missing.
 */
export function getMesNames(t: (key: string) => string): {
  meses: string[];
  mesesCortos: string[];
  dias: string[];
} {
  const meses = [
    t("months.january"),
    t("months.february"),
    t("months.march"),
    t("months.april"),
    t("months.may"),
    t("months.june"),
    t("months.july"),
    t("months.august"),
    t("months.september"),
    t("months.october"),
    t("months.november"),
    t("months.december"),
  ];
  const mesesCortos = [
    t("monthsShort.jan"),
    t("monthsShort.feb"),
    t("monthsShort.mar"),
    t("monthsShort.apr"),
    t("monthsShort.may"),
    t("monthsShort.jun"),
    t("monthsShort.jul"),
    t("monthsShort.aug"),
    t("monthsShort.sep"),
    t("monthsShort.oct"),
    t("monthsShort.nov"),
    t("monthsShort.dec"),
  ];
  const dias = [
    t("days.sunday"),
    t("days.monday"),
    t("days.tuesday"),
    t("days.wednesday"),
    t("days.thursday"),
    t("days.friday"),
    t("days.saturday"),
  ];
  return { meses, mesesCortos, dias };
}
