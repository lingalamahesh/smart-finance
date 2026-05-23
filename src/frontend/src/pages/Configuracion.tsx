import { createActor } from "@/backend";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useCurrentMes } from "@/hooks/useCurrentMes";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import {
  useAddCategoria,
  useAddMetaAhorro,
  useAddMetodoPago,
  useCategorias,
  useDeleteCategoria,
  useDeleteMetaAhorro,
  useDeleteMetodoPago,
  useMetasAhorro,
  useMetodosPago,
  useUpdateMetaAhorro,
} from "@/hooks/useFinanzas";
import { SUPPORTED_LANGUAGES, useLanguage } from "@/hooks/useLanguage";
import { THEMES, type ThemeId, applyTheme, useTheme } from "@/hooks/useTheme";
import {
  CURRENCY_LABELS,
  type CurrencyCode,
  type MetaAhorro,
} from "@/types/finanzas";
import { convertAndFormat } from "@/utils/format";
import { getMesRef } from "@/utils/mes";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQueries } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart2,
  Check,
  ChevronDown,
  ChevronRight,
  Coins,
  Languages,
  LogOut,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  Tag,
  Target,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────
const MESES_CORTOS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

// ─── Section Card Shell ───────────────────────────────────────────────────────
function SectionCard({
  children,
  ocid,
}: {
  children: React.ReactNode;
  ocid?: string;
}) {
  return (
    <div
      className="bg-[var(--bg-card)] rounded-[var(--radius-card)] overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
      data-ocid={ocid}
    >
      {children}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border-color)]">
      <div className="flex items-center gap-2.5">
        <span className="text-[var(--color-primary)]">{icon}</span>
        <span className="text-[13px] font-display font-semibold text-[var(--text-primary)] tracking-tight">
          {title}
        </span>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Annual Comparison Component ──────────────────────────────────────────────
function ComparativoAnual({ year }: { year: number }) {
  const { actor, isFetching } = useActor(createActor);
  const { selectedCurrency, exchangeRates } = useCurrency();

  const queries = useQueries({
    queries: MESES_CORTOS.map((_mes, i) => {
      const mesRef = getMesRef(year, i + 1);
      return {
        queryKey: ["totales", mesRef],
        queryFn: async () => {
          if (!actor)
            return {
              ingresosTotal: 0,
              gastosTotal: 0,
              inversionesTotal: 0,
              saldo: 0,
            };
          return actor.getTotalesMes(mesRef);
        },
        enabled: !!actor && !isFetching,
      };
    }),
  });

  const isLoading = queries.some((q) => q.isLoading);

  const data = useMemo(
    () =>
      queries.map((q, i) => ({
        mes: MESES_CORTOS[i] as string,
        ingresos: q.data?.ingresosTotal ?? 0,
        gastos: q.data?.gastosTotal ?? 0,
        saldo: q.data?.saldo ?? 0,
      })),
    [queries],
  );

  if (isLoading) {
    return (
      <div className="p-4 flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 9, fontFamily: "var(--font-body)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fontFamily: "var(--font-mono)" }}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(v: number, name: string) => [
              convertAndFormat(v, "COP", selectedCurrency, exchangeRates),
              name === "ingresos"
                ? "Ingresos"
                : name === "gastos"
                  ? "Gastos"
                  : "Saldo",
            ]}
            contentStyle={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              borderRadius: 12,
              border: "1px solid var(--border-color)",
            }}
          />
          <Legend
            formatter={(v: string) =>
              v === "ingresos"
                ? "Ingresos"
                : v === "gastos"
                  ? "Gastos"
                  : "Saldo"
            }
            wrapperStyle={{ fontSize: 10, fontFamily: "var(--font-body)" }}
          />
          <Bar dataKey="ingresos" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.mes} fill="#34C759" />
            ))}
          </Bar>
          <Bar dataKey="gastos" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.mes} fill="#FF3B30" />
            ))}
          </Bar>
          <Bar dataKey="saldo" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.mes} fill="#007AFF" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Scrollable div-based grid */}
      <div className="overflow-x-auto">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto repeat(12, minmax(56px, 1fr))",
            minWidth: 700,
          }}
        >
          {/* Header row */}
          <div className="py-2 pr-3 text-[10px] font-body font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap border-b border-[var(--border-color)]">
            Concepto
          </div>
          {MESES_CORTOS.map((m) => (
            <div
              key={m}
              className="py-2 px-1 text-center text-[10px] font-body font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap border-b border-[var(--border-color)]"
            >
              {m}
            </div>
          ))}
          {/* Data rows */}
          {[
            { label: "INGRESOS", key: "ingresos" as const, color: "#34C759" },
            { label: "GASTOS", key: "gastos" as const, color: "#FF3B30" },
            { label: "SALDO", key: "saldo" as const, color: "#007AFF" },
          ].map(({ label, key, color }, rowIdx) => (
            <>
              <div
                key={label}
                className="py-2 pr-3 text-[10px] font-body font-semibold uppercase tracking-wider whitespace-nowrap"
                style={{
                  color,
                  borderBottom:
                    rowIdx < 2 ? "1px solid var(--border-color)" : "none",
                }}
              >
                {label}
              </div>
              {data.map((d) => (
                <div
                  key={d.mes}
                  className="py-2 px-1 text-center text-[10px] font-mono whitespace-nowrap"
                  style={{
                    color: d[key] > 0 ? color : "var(--text-secondary)",
                    opacity: d[key] === 0 ? 0.4 : 1,
                    borderBottom:
                      rowIdx < 2 ? "1px solid var(--border-color)" : "none",
                  }}
                >
                  {d[key] === 0 ? "—" : `${(d[key] / 1000).toFixed(1)}k`}
                </div>
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Meta Dialog ─────────────────────────────────────────────────────────────
interface MetaDialogProps {
  open: boolean;
  initial?: MetaAhorro | null;
  onClose: () => void;
}

function MetaDialog({ open, initial, onClose }: MetaDialogProps) {
  const addMeta = useAddMetaAhorro();
  const updateMeta = useUpdateMetaAhorro();
  const { selectedCurrency } = useCurrency();
  const isEditing = !!initial;
  const [nombre, setNombre] = useState("");
  const [metaTotal, setMetaTotal] = useState("");
  const [ahorroAcumulado, setAhorroAcumulado] = useState("");
  const [errors, setErrors] = useState<{ nombre?: string; metaTotal?: string }>(
    {},
  );

  useEffect(() => {
    if (open) {
      setNombre(initial?.nombre ?? "");
      setMetaTotal(initial?.metaTotal != null ? String(initial.metaTotal) : "");
      setAhorroAcumulado(
        initial?.ahorroAcumulado != null
          ? String(initial.ahorroAcumulado)
          : "0",
      );
      setErrors({});
    }
  }, [open, initial]);

  function validate(): boolean {
    const e: { nombre?: string; metaTotal?: string } = {};
    if (!nombre.trim()) e.nombre = "El nombre es requerido";
    const n = Number.parseFloat(metaTotal);
    if (!metaTotal.trim() || Number.isNaN(n) || n <= 0)
      e.metaTotal = "Ingresa un valor válido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const item: MetaAhorro = {
      id: initial?.id ?? crypto.randomUUID(),
      nombre: nombre.trim(),
      metaTotal: Number.parseFloat(metaTotal),
      ahorroAcumulado: Number.parseFloat(ahorroAcumulado) || 0,
      ahorroEsteMes: initial?.ahorroEsteMes ?? 0,
    };
    try {
      if (isEditing) {
        await updateMeta.mutateAsync(item);
        toast.success("Meta actualizada");
      } else {
        await addMeta.mutateAsync(item);
        toast.success("Meta añadida");
      }
      onClose();
    } catch {
      toast.error("Error al guardar la meta");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" data-ocid="config.meta.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-base">
            {isEditing ? "Editar meta" : "Nueva meta de ahorro"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meta-nombre" className="text-xs font-body">
              Nombre
            </Label>
            <Input
              id="meta-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Fondo de emergencia…"
              autoFocus
              data-ocid="config.meta.nombre_input"
            />
            {errors.nombre && (
              <span
                className="text-[11px] text-destructive"
                data-ocid="config.meta.nombre_input.field_error"
              >
                {errors.nombre}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meta-total" className="text-xs font-body">
              Meta total ({CURRENCY_LABELS[selectedCurrency]})
            </Label>
            <Input
              id="meta-total"
              type="number"
              min="0.01"
              step="0.01"
              value={metaTotal}
              onChange={(e) => setMetaTotal(e.target.value)}
              placeholder="0.00"
              data-ocid="config.meta.total_input"
            />
            {errors.metaTotal && (
              <span
                className="text-[11px] text-destructive"
                data-ocid="config.meta.total_input.field_error"
              >
                {errors.metaTotal}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meta-acumulado" className="text-xs font-body">
              Ahorrado hasta ahora ({CURRENCY_LABELS[selectedCurrency]})
            </Label>
            <Input
              id="meta-acumulado"
              type="number"
              min="0"
              step="0.01"
              value={ahorroAcumulado}
              onChange={(e) => setAhorroAcumulado(e.target.value)}
              placeholder="0.00"
              data-ocid="config.meta.acumulado_input"
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-body font-medium text-[var(--text-secondary)] border border-[var(--border-color)] bg-white active:scale-95 transition-transform"
              data-ocid="config.meta.cancel_button"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={addMeta.isPending || updateMeta.isPending}
              className="px-4 py-2 rounded-xl text-sm font-body font-semibold bg-[var(--color-primary)] text-[var(--text-primary)] disabled:opacity-50 active:scale-95 transition-transform"
              data-ocid="config.meta.submit_button"
            >
              {isEditing ? "Guardar" : "Añadir"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
interface DeleteConfirmProps {
  open: boolean;
  label: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
}

function DeleteConfirm({
  open,
  label,
  onClose,
  onConfirm,
  isPending,
}: DeleteConfirmProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" data-ocid="config.delete.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-base">
            Confirmar eliminación
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm font-body text-muted-foreground">
          ¿Eliminar <strong className="text-foreground">{label}</strong>? Esta
          acción no se puede deshacer.
        </p>
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-body font-medium text-[var(--text-secondary)] border border-[var(--border-color)] bg-white active:scale-95 transition-transform"
            data-ocid="config.delete.cancel_button"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-sm font-body font-semibold bg-[var(--color-danger)] text-white disabled:opacity-50 active:scale-95 transition-transform"
            data-ocid="config.delete.confirm_button"
          >
            Eliminar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── List Item with delete ────────────────────────────────────────────────────
function ListItem({
  label,
  onDelete,
  ocid,
}: {
  label: string;
  onDelete: () => void;
  ocid: string;
}) {
  return (
    <div
      className="flex items-center justify-between py-3.5 border-b border-[var(--border-color)] last:border-0"
      data-ocid={ocid}
    >
      <span className="text-[14px] font-body text-[var(--text-primary)]">
        {label}
      </span>
      <button
        type="button"
        onClick={onDelete}
        className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-red-50 hover:text-[var(--color-danger)] transition-colors"
        aria-label={`Eliminar ${label}`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

// ─── Inline Add Row ───────────────────────────────────────────────────────────
function InlineAddRow({
  placeholder,
  onAdd,
  isPending,
  ocid,
}: {
  placeholder: string;
  onAdd: (value: string) => Promise<void>;
  isPending: boolean;
  ocid: string;
}) {
  const [value, setValue] = useState("");
  const [active, setActive] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    await onAdd(trimmed);
    setValue("");
    setActive(false);
  }

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        className="flex items-center gap-2 w-full py-3 text-[13px] font-body font-medium text-[var(--color-primary)] hover:opacity-80 transition-opacity"
        style={{ borderTop: "1.5px dashed var(--border-color)" }}
        data-ocid={ocid}
      >
        <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
          <Plus size={11} color="var(--text-primary)" />
        </span>
        Añadir
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 pt-3"
      style={{ borderTop: "1.5px dashed var(--border-color)" }}
    >
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-9 text-sm flex-1"
        data-ocid={`${ocid}.input`}
      />
      <button
        type="submit"
        disabled={isPending || !value.trim()}
        className="h-9 px-3 rounded-xl bg-[var(--color-primary)] text-[var(--text-primary)] text-xs font-semibold disabled:opacity-50 shrink-0"
        data-ocid={`${ocid}.save_button`}
      >
        OK
      </button>
      <button
        type="button"
        onClick={() => {
          setValue("");
          setActive(false);
        }}
        className="w-9 h-9 rounded-xl border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)]"
        aria-label="Cancelar"
      >
        <X size={13} />
      </button>
    </form>
  );
}

// ─── Logout Button ──────────────────────────────────────────────────────────
function LogoutButton({
  logout,
  navigate,
}: {
  logout: () => Promise<void> | void;
  navigate: (opts: { to: string }) => void;
}) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutInProgress = useRef(false);

  async function handleLogout() {
    // Guard against double-tap: both state and ref
    if (logoutInProgress.current || isLoggingOut) return;
    logoutInProgress.current = true;
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      logoutInProgress.current = false;
      navigate({ to: "/" });
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      style={{ pointerEvents: isLoggingOut ? "none" : undefined }}
      className={[
        "flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-body font-semibold",
        "border border-[var(--border-color)] transition-all duration-200",
        "hover:bg-red-50 hover:text-[var(--color-danger)] hover:border-red-200",
        "active:scale-95",
        isLoggingOut ? "opacity-70 scale-95" : "text-[var(--text-secondary)]",
      ].join(" ")}
      data-ocid="config.logout_button"
      aria-label="Cerrar sesión"
    >
      {isLoggingOut ? (
        <>
          <RefreshCw size={13} className="animate-spin shrink-0" />
          <span>Cerrando...</span>
        </>
      ) : (
        <>
          <LogOut size={13} className="shrink-0" />
          <span>Salir</span>
        </>
      )}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ConfiguracionPage() {
  const navigate = useNavigate();
  const { identity, logout } = useAuth();
  const { year } = useCurrentMes();
  const { selectedCurrency, setSelectedCurrency, exchangeRates } =
    useCurrency();
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: metas, isLoading: loadingMetas } = useMetasAhorro();
  const deleteMeta = useDeleteMetaAhorro();
  const { data: metodos, isLoading: loadingMetodos } = useMetodosPago();
  const addMetodo = useAddMetodoPago();
  const deleteMetodo = useDeleteMetodoPago();
  const { data: categorias, isLoading: loadingCategorias } = useCategorias();
  const addCategoria = useAddCategoria();
  const deleteCategoria = useDeleteCategoria();

  const [metaDialog, setMetaDialog] = useState(false);
  const [editingMeta, setEditingMeta] = useState<MetaAhorro | null>(null);
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    label: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const { selectedTheme, setTheme } = useTheme();
  const { currentLanguage, setLanguage } = useLanguage();

  function handleThemeSelect(id: ThemeId) {
    const theme = THEMES.find((t) => t.id === id);
    setTheme(id);
    applyTheme(id, theme?.isDark ?? false);
  }

  function openEditMeta(meta: MetaAhorro) {
    setEditingMeta(meta);
    setMetaDialog(true);
  }

  function requestDelete(label: string, onConfirm: () => Promise<void>) {
    setDeleteState({ open: true, label, onConfirm });
  }

  // Shorten principal for display
  const principalShort = identity
    ? `${identity.getPrincipal().toText().slice(0, 8)}…`
    : null;

  return (
    <div data-ocid="config.page" className="flex flex-col gap-4 pb-24">
      {/* Page title */}
      <div className="pt-1 pb-0">
        <h1 className="text-[18px] font-display font-bold text-[var(--text-primary)] tracking-tight">
          Configuración
        </h1>
        <p className="text-[12px] font-body text-[var(--text-secondary)] mt-0.5">
          Personaliza tu experiencia Myfinance
        </p>
      </div>

      {/* ── 1. USER CARD ── */}
      <SectionCard ocid="config.user.section">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0">
            <User size={22} color="var(--text-primary)" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-body font-semibold text-[var(--text-primary)] truncate">
              {principalShort ? `ID: ${principalShort}` : "Usuario autenticado"}
            </p>
            <p className="text-[11px] font-body text-[var(--text-secondary)] mt-0.5">
              Internet Identity
            </p>
          </div>
          <LogoutButton logout={logout} navigate={navigate} />
        </div>
      </SectionCard>

      {/* ── 2. DIVISA CARD ── */}
      <SectionCard ocid="config.divisa.section">
        <SectionHeader
          icon={<Coins size={16} />}
          title="Moneda predeterminada"
        />
        <div className="px-4 py-4 flex flex-col gap-3">
          {/* Pill currency buttons */}
          <div className="flex gap-2">
            {(Object.keys(CURRENCY_LABELS) as CurrencyCode[]).map((code) => {
              const isActive = selectedCurrency === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedCurrency(code)}
                  className="flex-1 py-2.5 rounded-full text-[13px] font-body font-semibold transition-all active:scale-95"
                  style={{
                    background: isActive ? "var(--color-primary)" : "#F2F2F7",
                    color: isActive
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    border: isActive
                      ? "2px solid var(--color-primary)"
                      : "2px solid transparent",
                  }}
                  data-ocid={`config.divisa.${code.toLowerCase()}.toggle`}
                >
                  {code}
                </button>
              );
            })}
          </div>

          {/* Exchange rates */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-body text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
                Tasas actuales
              </span>
            </div>
            <div className="flex gap-2">
              {[
                {
                  label: "1 USD",
                  value: exchangeRates.usdToCop,
                  unit: "COP",
                },
                {
                  label: "1 ICP",
                  value: exchangeRates.icpToCop,
                  unit: "COP",
                },
                {
                  label: "1 ICP",
                  value: exchangeRates.icpToUsd,
                  unit: "USD",
                },
              ].map(({ label, value, unit }) => (
                <div
                  key={label}
                  className="flex-1 bg-[#F2F2F7] rounded-[12px] p-2.5 text-center"
                >
                  <p className="text-[10px] font-body text-[var(--text-secondary)]">
                    {label} =
                  </p>
                  <p className="text-[13px] font-mono font-bold text-[var(--text-primary)]">
                    {value.toFixed(2)}
                  </p>
                  <p className="text-[10px] font-body text-[var(--text-secondary)]">
                    {unit}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── 3. METAS DE AHORRO CARD ── */}
      <SectionCard ocid="config.metas.section">
        <SectionHeader
          icon={<Target size={16} />}
          title="Metas de ahorro"
          action={
            <button
              type="button"
              onClick={() => {
                setEditingMeta(null);
                setMetaDialog(true);
              }}
              className="w-7 h-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center active:scale-90 transition-transform"
              data-ocid="config.metas.add_button"
              aria-label="Añadir meta"
            >
              <Plus size={14} color="var(--text-primary)" />
            </button>
          }
        />
        <div className="px-4">
          {loadingMetas ? (
            <div className="py-4 flex flex-col gap-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : (metas ?? []).length === 0 ? (
            <p
              className="py-8 text-center text-sm font-body text-[var(--text-secondary)]"
              data-ocid="config.metas.empty_state"
            >
              No hay metas. Toca + para añadir una.
            </p>
          ) : (
            <div>
              {(metas ?? []).map((meta, i) => {
                const restante = Math.max(
                  0,
                  meta.metaTotal - meta.ahorroAcumulado,
                );
                const pct =
                  meta.metaTotal > 0
                    ? Math.min(
                        100,
                        (meta.ahorroAcumulado / meta.metaTotal) * 100,
                      )
                    : 0;
                return (
                  <div
                    key={meta.id}
                    className="py-3.5 border-b border-[var(--border-color)] last:border-0"
                    data-ocid={`config.metas.item.${i + 1}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-body font-semibold text-[var(--text-primary)] truncate">
                          {meta.nombre}
                        </p>
                        <p className="text-[11px] font-body text-[var(--text-secondary)] mt-0.5">
                          {convertAndFormat(
                            meta.ahorroAcumulado,
                            "COP",
                            selectedCurrency,
                            exchangeRates,
                          )}{" "}
                          de{" "}
                          {convertAndFormat(
                            meta.metaTotal,
                            "COP",
                            selectedCurrency,
                            exchangeRates,
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => openEditMeta(meta)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[#F2F2F7] transition-colors"
                          aria-label={`Editar ${meta.nombre}`}
                          data-ocid={`config.metas.edit_button.${i + 1}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestDelete(meta.nombre, async () => {
                              await deleteMeta.mutateAsync(meta.id);
                              toast.success("Meta eliminada");
                              setDeleteState(null);
                            })
                          }
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-red-50 hover:text-[var(--color-danger)] transition-colors"
                          aria-label={`Eliminar ${meta.nombre}`}
                          data-ocid={`config.metas.delete_button.${i + 1}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: "var(--color-primary)",
                        }}
                      />
                    </div>
                    <p className="text-[10px] font-body text-[var(--text-secondary)] mt-1">
                      {pct.toFixed(0)}% · Restante:{" "}
                      {convertAndFormat(
                        restante,
                        "COP",
                        selectedCurrency,
                        exchangeRates,
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── 4. MÉTODOS DE PAGO CARD ── */}
      <SectionCard ocid="config.metodos.section">
        <SectionHeader icon={<Wallet size={16} />} title="Métodos de pago" />
        <div className="px-4">
          {loadingMetodos ? (
            <div className="py-4 flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div>
              {(metodos ?? []).map((m, i) => (
                <ListItem
                  key={m}
                  label={m}
                  ocid={`config.metodos.item.${i + 1}`}
                  onDelete={() =>
                    requestDelete(m, async () => {
                      await deleteMetodo.mutateAsync(m);
                      toast.success("Método eliminado");
                      setDeleteState(null);
                    })
                  }
                />
              ))}
              <InlineAddRow
                placeholder="Nuevo método…"
                isPending={addMetodo.isPending}
                ocid="config.metodos.add_button"
                onAdd={async (v) => {
                  await addMetodo.mutateAsync(v);
                  toast.success("Método añadido");
                }}
              />
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── 5. CATEGORÍAS CARD ── */}
      <SectionCard ocid="config.categorias.section">
        <SectionHeader icon={<Tag size={16} />} title="Categorías" />
        <div className="px-4">
          {loadingCategorias ? (
            <div className="py-4 flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div>
              {(categorias ?? []).map((cat, i) => (
                <ListItem
                  key={cat}
                  label={cat}
                  ocid={`config.categorias.item.${i + 1}`}
                  onDelete={() =>
                    requestDelete(cat, async () => {
                      await deleteCategoria.mutateAsync(cat);
                      toast.success("Categoría eliminada");
                      setDeleteState(null);
                    })
                  }
                />
              ))}
              <InlineAddRow
                placeholder="Nueva categoría…"
                isPending={addCategoria.isPending}
                ocid="config.categorias.add_button"
                onAdd={async (v) => {
                  await addCategoria.mutateAsync(v);
                  toast.success("Categoría añadida");
                }}
              />
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── 6. IDIOMA / LANGUAGE CARD ── */}
      <SectionCard ocid="config.idioma.section">
        <SectionHeader
          icon={<Languages size={16} />}
          title="Idioma / Language"
        />
        <div className="px-4 py-4">
          <div className="relative">
            <select
              value={currentLanguage}
              onChange={(e) => setLanguage(e.target.value)}
              data-ocid="config.idioma.select"
              className="w-full appearance-none rounded-[12px] border border-[var(--border-color)] bg-[#F2F2F7] px-4 py-3 text-[14px] font-body text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] pr-10"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} — {lang.englishName}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
            />
          </div>
        </div>
      </SectionCard>

      {/* ── 7. APARIENCIA / THEME CARD ── */}
      <SectionCard ocid="config.tema.section">
        <SectionHeader icon={<Palette size={16} />} title="Apariencia" />
        <div className="px-4 pt-3 pb-4">
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((theme) => {
              const isActive = selectedTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleThemeSelect(theme.id)}
                  className="flex flex-col items-center gap-2 p-3 rounded-[16px] border-2 transition-all active:scale-95"
                  style={{
                    borderColor: isActive
                      ? "var(--color-primary)"
                      : "transparent",
                    background: isActive ? "rgba(200,255,0,0.08)" : "#F2F2F7",
                  }}
                  data-ocid={`config.tema.${theme.id}.toggle`}
                >
                  {/* Color swatch circles */}
                  <div className="relative flex items-center gap-0.5">
                    {theme.previewColors.map((color) => (
                      <span
                        key={color}
                        className="w-5 h-5 rounded-full border border-black/10"
                        style={{
                          backgroundColor: color,
                          zIndex: 3 - theme.previewColors.indexOf(color),
                        }}
                      />
                    ))}
                    {isActive && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center shadow-sm">
                          <Check
                            size={10}
                            color="var(--text-primary)"
                            strokeWidth={3}
                          />
                        </span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-body font-semibold text-[var(--text-primary)] text-center leading-tight">
                    {theme.name}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* ── 7. COMPARATIVO ANUAL CARD ── */}
      <SectionCard ocid="config.comparativo.section">
        <SectionHeader
          icon={<BarChart2 size={16} />}
          title={`Comparativo ${year}`}
          action={
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="flex items-center gap-1 text-[11px] font-body font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              data-ocid="config.comparativo.refresh_button"
            >
              Ver resultado
              <ChevronRight size={13} />
            </button>
          }
        />
        <div className="pt-4">
          <ComparativoAnual key={refreshKey} year={year} />
        </div>
      </SectionCard>

      {/* Dialogs */}
      <MetaDialog
        open={metaDialog}
        initial={editingMeta}
        onClose={() => setMetaDialog(false)}
      />
      {deleteState && (
        <DeleteConfirm
          open={deleteState.open}
          label={deleteState.label}
          onClose={() => setDeleteState(null)}
          onConfirm={deleteState.onConfirm}
          isPending={
            deleteMeta.isPending ||
            deleteMetodo.isPending ||
            deleteCategoria.isPending
          }
        />
      )}
    </div>
  );
}
