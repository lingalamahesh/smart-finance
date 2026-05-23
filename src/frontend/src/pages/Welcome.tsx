import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useCurrentMes } from "@/hooks/useCurrentMes";
import { useNotas, useSetNotas, useTotalesMes } from "@/hooks/useFinanzas";
import { convertAndFormat } from "@/utils/format";
import { getMesNames } from "@/utils/mes";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Loader2,
  PiggyBank,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export function WelcomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { mesRef, month, year } = useCurrentMes();
  const { data: totales, isLoading: loadingTotales } = useTotalesMes(mesRef);
  const { data: notasData } = useNotas(mesRef);
  const setNotasMutation = useSetNotas();
  const { selectedCurrency, exchangeRates } = useCurrency();
  const { t } = useTranslation();

  const ingresos = totales?.ingresosTotal ?? 0;
  const gastos = totales?.gastosTotal ?? 0;
  const inversiones = totales?.inversionesTotal ?? 0;
  const saldo = totales?.saldo ?? 0;

  const [notasLocal, setNotasLocal] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (notasData !== undefined) setNotasLocal(notasData);
  }, [notasData]);

  function handleNotasBlur() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setNotasMutation.mutate({ mesRef, notas: notasLocal });
  }
  function handleNotasChange(val: string) {
    setNotasLocal(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setNotasMutation.mutate({ mesRef, notas: val });
    }, 800);
  }

  const today = new Date();
  const { meses, dias } = getMesNames(t);
  const mesNombre = meses[(month ?? 1) - 1] ?? "";
  const fechaHoy = `${dias[today.getDay()]}, ${today.getDate()} ${t("common.of")} ${meses[today.getMonth()]?.toLowerCase() ?? ""} ${t("common.of")} ${today.getFullYear()}`;

  function pct(val: number) {
    if (ingresos === 0) return "0.0%";
    return `${((val / ingresos) * 100).toFixed(1)}%`;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div data-ocid="home.page" className="flex flex-col gap-4 pb-28">
      {/* Header */}
      <div className="bg-card rounded-2xl border border-border shadow-subtle px-5 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground tracking-tight uppercase">
              {mesNombre} {year}
            </h1>
            <p className="text-xs font-body text-muted-foreground mt-0.5">
              {fechaHoy}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/resumen" })}
            className="bg-primary/10 text-primary text-[10px] font-display font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider transition-smooth hover:bg-primary/20 active:scale-95"
            data-ocid="home.resumen_badge"
          >
            {t("common.income").toUpperCase()}
          </button>
        </div>
      </div>

      {/* Main balance card — dark */}
      <div
        className="rounded-2xl px-5 py-5 shadow-elevated"
        style={{ background: "#111111", color: "#FFFFFF" }}
        data-ocid="home.balance_card"
      >
        <p
          className="text-[10px] font-body font-semibold uppercase tracking-widest mb-1"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          {t("common.balance").toUpperCase()}
        </p>
        {loadingTotales ? (
          <div
            className="h-10 w-44 rounded-xl mb-3 animate-pulse"
            style={{ background: "rgba(255,255,255,0.1)" }}
          />
        ) : (
          <p
            className="font-display font-bold text-4xl leading-none mb-4 break-all"
            data-ocid="home.saldo_value"
          >
            {convertAndFormat(saldo, "COP", selectedCurrency, exchangeRates)}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium"
            style={{ color: "#4ADE80" }}
          >
            <TrendingUp size={13} />
            {loadingTotales
              ? "…"
              : convertAndFormat(
                  ingresos,
                  "COP",
                  selectedCurrency,
                  exchangeRates,
                )}
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium"
            style={{ color: "#F87171" }}
          >
            <TrendingDown size={13} />
            {loadingTotales
              ? "…"
              : convertAndFormat(
                  gastos,
                  "COP",
                  selectedCurrency,
                  exchangeRates,
                )}
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium"
            style={{ color: "#FB923C" }}
          >
            <PiggyBank size={13} />
            {loadingTotales
              ? "…"
              : convertAndFormat(
                  inversiones,
                  "COP",
                  selectedCurrency,
                  exchangeRates,
                )}
          </span>
        </div>
      </div>

      {/* 4 KPI mini-cards 2×2 */}
      <div className="grid grid-cols-2 gap-3">
        {/* INGRESOS */}
        <div
          className="bg-card rounded-2xl border border-border px-4 py-4 shadow-subtle"
          data-ocid="home.kpi.ingresos"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-2 h-2 rounded-full bg-[oklch(0.68_0.15_170)] shrink-0" />
            <span className="text-[10px] font-body font-semibold uppercase tracking-wider text-[oklch(0.50_0.15_170)]">
              {t("common.income").toUpperCase()}
            </span>
          </div>
          {loadingTotales ? (
            <div className="h-5 w-20 rounded bg-muted animate-pulse mb-1" />
          ) : (
            <p className="text-sm font-mono font-bold text-foreground leading-tight break-all">
              {convertAndFormat(
                ingresos,
                "COP",
                selectedCurrency,
                exchangeRates,
              )}
            </p>
          )}
          <span className="inline-block mt-1.5 text-[10px] font-body px-2 py-0.5 rounded-full bg-[oklch(0.68_0.15_170)]/10 text-[oklch(0.50_0.15_170)]">
            100%
          </span>
        </div>

        {/* GASTOS */}
        <div
          className="bg-card rounded-2xl border border-border px-4 py-4 shadow-subtle"
          data-ocid="home.kpi.gastos"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
            <span className="text-[10px] font-body font-semibold uppercase tracking-wider text-destructive">
              {t("common.expense").toUpperCase()}
            </span>
          </div>
          {loadingTotales ? (
            <div className="h-5 w-20 rounded bg-muted animate-pulse mb-1" />
          ) : (
            <p className="text-sm font-mono font-bold text-foreground leading-tight break-all">
              {convertAndFormat(gastos, "COP", selectedCurrency, exchangeRates)}
            </p>
          )}
          <span className="inline-block mt-1.5 text-[10px] font-body px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
            {pct(gastos)}
          </span>
        </div>

        {/* INVERSIONES */}
        <div
          className="bg-card rounded-2xl border border-border px-4 py-4 shadow-subtle"
          data-ocid="home.kpi.inversiones"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: "#FB923C" }}
            />
            <span
              className="text-[10px] font-body font-semibold uppercase tracking-wider"
              style={{ color: "#C2410C" }}
            >
              {t("summary.monthlySavings").toUpperCase()}
            </span>
          </div>
          {loadingTotales ? (
            <div className="h-5 w-20 rounded bg-muted animate-pulse mb-1" />
          ) : (
            <p className="text-sm font-mono font-bold text-foreground leading-tight break-all">
              {convertAndFormat(
                inversiones,
                "COP",
                selectedCurrency,
                exchangeRates,
              )}
            </p>
          )}
          <span
            className="inline-block mt-1.5 text-[10px] font-body px-2 py-0.5 rounded-full"
            style={{ background: "rgba(251,146,60,0.12)", color: "#C2410C" }}
          >
            {pct(inversiones)}
          </span>
        </div>

        {/* SALDO */}
        <div
          className="bg-card rounded-2xl border border-border px-4 py-4 shadow-subtle"
          data-ocid="home.kpi.saldo"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="text-[10px] font-body font-semibold uppercase tracking-wider text-primary">
              {t("common.balance").toUpperCase()}
            </span>
          </div>
          {loadingTotales ? (
            <div className="h-5 w-20 rounded bg-muted animate-pulse mb-1" />
          ) : (
            <p className="text-sm font-mono font-bold text-foreground leading-tight break-all">
              {convertAndFormat(saldo, "COP", selectedCurrency, exchangeRates)}
            </p>
          )}
          <span className="inline-block mt-1.5 text-[10px] font-body px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {pct(saldo)}
          </span>
        </div>
      </div>

      {/* Notas del mes */}
      <div
        className="bg-card rounded-2xl border border-border shadow-subtle overflow-hidden"
        data-ocid="home.notas"
      >
        <div className="px-4 pt-4 pb-2 border-b border-border flex items-center gap-2">
          <span className="w-1.5 h-4 bg-primary rounded-full" />
          <h3 className="text-xs font-display font-semibold uppercase tracking-wider text-foreground">
            {t("common.notes")}
          </h3>
        </div>
        <textarea
          className="w-full px-4 py-3 text-sm font-body text-foreground bg-transparent resize-none outline-none min-h-[88px] placeholder:text-muted-foreground/50"
          placeholder={`${t("common.notes")}…`}
          value={notasLocal}
          onChange={(e) => handleNotasChange(e.target.value)}
          onBlur={handleNotasBlur}
          data-ocid="home.notas_textarea"
        />
      </div>
    </div>
  );
}
