import { useCurrency } from "@/hooks/useCurrency";
import { useCurrentMes } from "@/hooks/useCurrentMes";
import { useTotalesMes, useTransacciones } from "@/hooks/useFinanzas";
import {
  calcPorcentaje,
  convertAndFormat,
  formatPorcentaje,
} from "@/utils/format";
import { Sparkles, TrendingUp, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

// — Color palettes ——————————————————————————————————————
const CAT_COLORS = [
  "#A8FF3E", // lime
  "#3B82F6", // blue
  "#F97316", // orange
  "#A855F7", // purple
  "#EF4444", // red
  "#FACC15", // yellow
  "#06B6D4", // cyan
  "#F472B6", // pink
];

const MET_COLORS = [
  "#34D399", // emerald
  "#60A5FA", // sky-blue
  "#FB923C", // orange
  "#C084FC", // violet
  "#F87171", // rose
  "#FDE68A", // amber
];

function catColor(i: number) {
  return CAT_COLORS[i % CAT_COLORS.length];
}
function metColor(i: number) {
  return MET_COLORS[i % MET_COLORS.length];
}

// — Data helpers ——————————————————————————————————————
interface AgrupadoEntry {
  nombre: string;
  total: number;
}

function agruparPor(
  items: { categoria: string; metodoPago: string; valor: number }[],
  campo: "categoria" | "metodoPago",
): AgrupadoEntry[] {
  const mapa = new Map<string, number>();
  for (const item of items) {
    const key = item[campo] || "Sin especificar";
    mapa.set(key, (mapa.get(key) ?? 0) + item.valor);
  }
  return Array.from(mapa.entries())
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total);
}

// — Custom pie label ——————————————————————————————————
function PieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
}) {
  if (percent < 0.04) return null;
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * R);
  const y = cy + r * Math.sin(-midAngle * R);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
}

// — Sub-components ————————————————————————————————————

interface ChartCardProps {
  title: string;
  data: AgrupadoEntry[];
  total: number;
  colors: (i: number) => string;
  tooltipFormatter: (v: number) => string;
  ocidPrefix: string;
}

function ChartCard({
  title,
  data,
  total,
  colors,
  tooltipFormatter,
  ocidPrefix,
}: ChartCardProps) {
  const chartData = data.map((e) => ({ name: e.nombre, value: e.total }));

  return (
    <div className="app-card" data-ocid={`${ocidPrefix}.card`}>
      {/* Card title */}
      <p className="text-base font-bold text-foreground mb-4">{title}</p>

      {/* Donut chart */}
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={88}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
              label={PieLabel as never}
            >
              {chartData.map((_, i) => (
                <Cell
                  key={chartData[i]?.name ?? String(i)}
                  fill={colors(i)}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [tooltipFormatter(value), ""]}
              contentStyle={{
                borderRadius: "12px",
                fontSize: "12px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                padding: "8px 12px",
              }}
              itemStyle={{ color: "var(--foreground)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* List rows */}
      <div className="mt-3 space-y-1">
        {data.map((entry, i) => {
          const pct = total > 0 ? (entry.total / total) * 100 : 0;
          return (
            <div key={entry.nombre} data-ocid={`${ocidPrefix}.item.${i + 1}`}>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-muted/40 transition-colors">
                {/* dot + name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: colors(i) }}
                  />
                  <span className="text-sm font-medium text-foreground truncate">
                    {entry.nombre}
                  </span>
                </div>
                {/* amount + pct */}
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs text-muted-foreground">
                    {formatPorcentaje(pct)}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {tooltipFormatter(entry.total)}
                  </span>
                </div>
              </div>
              {/* thin progress bar */}
              <div className="mx-3 h-0.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: colors(i) }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface HighlightCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  ocid: string;
}

function HighlightCard({ icon, label, value, sub, ocid }: HighlightCardProps) {
  return (
    <div
      className="app-card flex items-center gap-3 py-3 px-4"
      data-ocid={ocid}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ color: "oklch(0.55 0.22 128)" }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
          {label}
        </p>
        <p className="text-xs font-semibold text-muted-foreground truncate">
          {sub}
        </p>
        <p className="text-sm font-bold text-foreground tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

// — Main page ——————————————————————————————————————————
export function AnalisisPage() {
  const { mesRef } = useCurrentMes();
  const { selectedCurrency, exchangeRates } = useCurrency();
  const { data: transacciones = [], isLoading } = useTransacciones(mesRef);
  const { data: totales } = useTotalesMes(mesRef);
  const { t } = useTranslation();

  const fmt = (v: number) =>
    convertAndFormat(v, "INR", selectedCurrency, exchangeRates);

  const pagadas = transacciones.filter((tx) => tx.pagado);
  const porCategoria = agruparPor(pagadas, "categoria");
  const porMetodo = agruparPor(pagadas, "metodoPago");
  const totalGastado = pagadas.reduce((s, tx) => s + tx.valor, 0);
  const ingresosTotal = totales?.ingresosTotal ?? 0;

  const topCategoria = porCategoria[0] ?? null;
  const topMetodo = porMetodo[0] ?? null;

  const sinDatos = !isLoading && pagadas.length === 0;

  return (
    <div className="space-y-5 pb-24" data-ocid="analisis.page">
      {/* Hero stat */}
      <div className="app-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none rounded-[var(--radius-card)]" />
        <div className="flex items-center justify-between mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide"
            style={{ background: "#A8FF3E", color: "#0A0A0A" }}
          >
            <Sparkles size={11} />
            {t("analysis.automatic")}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-1">
          {t("analysis.totalMonthExpenses")}
        </p>
        <p className="text-4xl font-bold text-foreground tracking-tight">
          {isLoading ? "—" : fmt(totalGastado)}
        </p>
        {!isLoading && ingresosTotal > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {t("analysis.representOf")}{" "}
            <span className="font-semibold text-foreground">
              {formatPorcentaje(calcPorcentaje(totalGastado, ingresosTotal))}
            </span>{" "}
            {t("analysis.ofIncome")}
          </p>
        )}
        {!isLoading && ingresosTotal === 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {t("analysis.noIncomeRegistered")}
          </p>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4" data-ocid="analisis.loading_state">
          <div className="app-card h-64 animate-pulse bg-muted/60" />
          <div className="app-card h-64 animate-pulse bg-muted/60" />
        </div>
      )}

      {/* Empty state */}
      {sinDatos && (
        <div
          className="app-card flex flex-col items-center justify-center py-14 text-center"
          data-ocid="analisis.empty_state"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <span className="text-3xl">📊</span>
          </div>
          <p className="text-base font-bold text-foreground">
            {t("analysis.noPaidExpenses")}
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {t("analysis.noPaidExpensesDesc")}
          </p>
        </div>
      )}

      {/* Main content */}
      {!isLoading && !sinDatos && (
        <>
          <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1 px-1">
            {t("analysis.quickSummary")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topCategoria && (
              <HighlightCard
                icon={<TrendingUp size={18} className="text-primary" />}
                label={t("analysis.topByCategory")}
                sub={topCategoria.nombre}
                value={fmt(topCategoria.total)}
                ocid="analisis.top_categoria.card"
              />
            )}
            {topMetodo && (
              <HighlightCard
                icon={<Wallet size={18} className="text-primary" />}
                label={t("analysis.topPaymentMethod")}
                sub={topMetodo.nombre}
                value={fmt(topMetodo.total)}
                ocid="analisis.top_metodo.card"
              />
            )}
          </div>

          <div className="app-card" data-ocid="analisis.categoria.card">
            <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-4 px-1">
              {t("analysis.byCategory")}
            </p>
            {porCategoria.length > 0 ? (
              <>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={porCategoria.map((e) => ({
                          name: e.nombre,
                          value: e.total,
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={88}
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={false}
                        label={PieLabel as never}
                      >
                        {porCategoria.map((_, i) => (
                          <Cell
                            key={porCategoria[i]?.nombre ?? String(i)}
                            fill={catColor(i)}
                            stroke="transparent"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [fmt(value), ""]}
                        contentStyle={{
                          borderRadius: "12px",
                          fontSize: "12px",
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          padding: "8px 12px",
                        }}
                        itemStyle={{ color: "var(--foreground)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-1">
                  {porCategoria.map((entry, i) => {
                    const pct =
                      totalGastado > 0 ? (entry.total / totalGastado) * 100 : 0;
                    return (
                      <div
                        key={entry.nombre}
                        data-ocid={`analisis.categoria.item.${i + 1}`}
                      >
                        <div className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ background: catColor(i) }}
                            />
                            <span className="text-sm font-medium text-foreground truncate">
                              {entry.nombre}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs text-muted-foreground">
                              {formatPorcentaje(pct)}
                            </span>
                            <span className="text-sm font-bold text-foreground tabular-nums">
                              {fmt(entry.total)}
                            </span>
                          </div>
                        </div>
                        <div className="mx-3 h-0.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: catColor(i),
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div
                className="flex flex-col items-center justify-center py-10 text-center gap-2"
                data-ocid="analisis.categoria.empty_state"
              >
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground"
                    role="img"
                    aria-label={t("analysis.noExpenses")}
                  >
                    <path d="M3 3v18h18" />
                    <path d="M18 17V9" />
                    <path d="M13 17V5" />
                    <path d="M8 17v-3" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {t("analysis.noExpenses")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("analysis.noExpensesDesc")}
                </p>
              </div>
            )}
          </div>

          <ChartCard
            title={t("analysis.byPaymentMethod")}
            data={porMetodo}
            total={totalGastado}
            colors={metColor}
            tooltipFormatter={fmt}
            ocidPrefix="analisis.metodo"
          />
        </>
      )}
    </div>
  );
}
