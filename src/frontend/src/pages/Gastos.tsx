import { ImageViewer } from "@/components/ImageViewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/hooks/useCurrency";
import { useCurrentMes } from "@/hooks/useCurrentMes";
import {
  useAddTransaccion,
  useCategorias,
  useDeleteTransaccion,
  useMetodosPago,
  useTotalesMes,
  useTransacciones,
  useUpdateTransaccion,
} from "@/hooks/useFinanzas";
import {
  CATEGORIAS_DEFAULT,
  CURRENCY_LABELS,
  type CurrencyCode,
  METODOS_PAGO_DEFAULT,
} from "@/types/finanzas";
import type { Transaccion } from "@/types/finanzas";
import {
  calcPorcentaje,
  convertAndFormat,
  formatFecha,
  formatPorcentaje,
  parseFecha,
} from "@/utils/format";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  Edit2,
  Loader2,
  MoreVertical,
  Plus,
  ShoppingCart,
  Trash2,
  TrendingDown,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { blobToDataUrl, compressImage } from "../utils/imageCompression";

// ── helpers ──────────────────────────────────────────────────────────────────

function todayFecha(): string {
  return formatFecha(new Date());
}

function makeEmptyForm(
  mesReferencia: string,
  defaultCurrency: CurrencyCode = "COP",
): Omit<Transaccion, "id"> {
  return {
    descripcion: "",
    valor: 0,
    fecha: todayFecha(),
    categoria: CATEGORIAS_DEFAULT[0],
    metodoPago: METODOS_PAGO_DEFAULT[0],
    esEsencial: false,
    pagado: false,
    esGastoFijo: false,
    mesReferencia,
    monedaOriginal: defaultCurrency,
  };
}

const CATEGORY_META: Record<string, { emoji: string; bg: string }> = {
  "Comida/Alimentación": {
    emoji: "🍔",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  Transporte: { emoji: "🚌", bg: "bg-blue-100 dark:bg-blue-900/30" },
  Supermercado: { emoji: "🛒", bg: "bg-green-100 dark:bg-green-900/30" },
  Vivienda: { emoji: "🏠", bg: "bg-purple-100 dark:bg-purple-900/30" },
  "Servicios del hogar": {
    emoji: "💡",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  Membresías: { emoji: "🎫", bg: "bg-pink-100 dark:bg-pink-900/30" },
  Suscripciones: { emoji: "📱", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
};

function getCatMeta(cat: string) {
  return CATEGORY_META[cat] ?? { emoji: "💸", bg: "bg-muted" };
}

function formatFechaLabel(fecha: string): string {
  try {
    const d = parseFecha(fecha);
    return d.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return fecha;
  }
}

type Group = { dateLabel: string; dateKey: string; items: Transaccion[] };

function groupByDate(txs: Transaccion[]): Group[] {
  const map = new Map<string, Transaccion[]>();
  for (const tx of txs) {
    const existing = map.get(tx.fecha) ?? [];
    existing.push(tx);
    map.set(tx.fecha, existing);
  }
  const sorted = [...map.entries()].sort(([a], [b]) => {
    const parse = (f: string) => {
      const [d, m, y] = f.split("/");
      return new Date(+y, +m - 1, +d).getTime();
    };
    return parse(b) - parse(a);
  });
  return sorted.map(([fecha, items]) => ({
    dateKey: fecha,
    dateLabel: formatFechaLabel(fecha),
    items,
  }));
}

// ── TxValue ───────────────────────────────────────────────────────────────────
function TxValue({
  tx,
  className = "",
}: { tx: Transaccion; className?: string }) {
  const { selectedCurrency, exchangeRates } = useCurrency();
  return (
    <span className={`font-mono font-bold tabular-nums ${className}`}>
      {convertAndFormat(
        tx.valor,
        (tx.monedaOriginal ?? "COP") as CurrencyCode,
        selectedCurrency,
        exchangeRates,
      )}
    </span>
  );
}

function ConvertedTotal({
  value,
  from = "COP",
}: { value: number; from?: CurrencyCode }) {
  const { selectedCurrency, exchangeRates } = useCurrency();
  return <>{convertAndFormat(value, from, selectedCurrency, exchangeRates)}</>;
}

// ── Mini toggle switch ────────────────────────────────────────────────────────
function ToggleRow({
  label,
  checked,
  onToggle,
  ocid,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  ocid: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      data-ocid={ocid}
      className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-colors ${
        checked
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-background text-muted-foreground"
      }`}
    >
      <span className="text-sm font-body">{label}</span>
      <div
        className={`w-9 h-5 rounded-full relative transition-colors ${checked ? "bg-accent" : "bg-muted"}`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}

// ── Bottom Sheet (add / edit) ──────────────────────────────────────────────────

interface SheetProps {
  open: boolean;
  onClose: () => void;
  initial: Transaccion | null;
  mesReferencia: string;
  categorias: string[];
  metodosPago: string[];
}

function TransaccionSheet({
  open,
  onClose,
  initial,
  mesReferencia,
  categorias,
  metodosPago,
}: SheetProps) {
  const isEdit = !!initial;
  const addMutation = useAddTransaccion();
  const updateMutation = useUpdateTransaccion();
  const { selectedCurrency } = useCurrency();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const [form, setForm] = useState<Omit<Transaccion, "id">>(() =>
    initial ? { ...initial } : makeEmptyForm(mesReferencia, selectedCurrency),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagenUrl, setImagenUrl] = useState<string | null>(
    initial?.imagenUrl ?? null,
  );
  const [showImagePicker, setShowImagePicker] = useState(!!initial?.imagenUrl);
  const [isSaving, setIsSaving] = useState(false);

  // Hide BottomNav while this modal is open
  useEffect(() => {
    if (open) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [open]);

  // Reset form state every time the sheet opens or initial item changes
  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? { ...initial }
          : makeEmptyForm(mesReferencia, selectedCurrency),
      );
      setErrors({});
      setImagenUrl(initial?.imagenUrl ?? null);
      setShowImagePicker(!!initial?.imagenUrl);
    }
  }, [open, initial, mesReferencia, selectedCurrency]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.descripcion.trim())
      errs.descripcion = t("expenses.descriptionRequired");
    if (form.valor <= 0) errs.valor = t("expenses.valueRequired");
    if (!form.fecha.match(/^\d{2}\/\d{2}\/\d{4}$/))
      errs.fecha = t("expenses.dateFormatError");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 180));
    setIsSaving(false);
    // Close immediately for instant UX
    onClose();
    if (isEdit && initial) {
      updateMutation.mutate(
        { ...form, id: initial.id, imagenUrl: imagenUrl ?? undefined },
        {
          onSuccess: () => toast.success(t("expenses.editExpense")),
          onError: (err) => {
            console.error("Error al actualizar gasto:", err);
            toast.error(t("common.error"));
          },
        },
      );
    } else {
      addMutation.mutate(
        { ...form, id: crypto.randomUUID(), imagenUrl: imagenUrl ?? undefined },
        {
          onSuccess: () => toast.success(t("expenses.addExpense")),
          onError: (err) => {
            console.error("Error al guardar gasto:", err);
            toast.error(t("common.error"));
          },
        },
      );
    }
  }

  const isBusy = isSaving || addMutation.isPending || updateMutation.isPending;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-white flex flex-col"
      style={{ height: "100dvh" }}
      data-ocid="gastos.dialog"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      aria-modal="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-base font-display font-semibold text-foreground">
          {isEdit ? t("expenses.editExpense") : t("expenses.addExpenseTitle")}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          aria-label={t("common.close")}
          data-ocid="gastos.dialog.close_button"
        >
          <X size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* Scrollable body */}
      <div
        className="overflow-y-auto flex-1 px-5 py-4 space-y-4"
        style={{
          WebkitOverflowScrolling: "touch" as never,
          overscrollBehavior: "contain",
          paddingBottom: "24px",
        }}
      >
        <div className="space-y-1.5 animate-field-in">
          <Label className="text-sm font-body text-muted-foreground">
            {t("expenses.description")}
          </Label>
          <Input
            data-ocid="gastos.form.descripcion.input"
            value={form.descripcion}
            onChange={(e) =>
              setForm((p) => ({ ...p, descripcion: e.target.value }))
            }
            placeholder={t("expenses.descriptionPlaceholder")}
            className="h-12 rounded-xl text-base font-body"
            autoFocus={false}
          />
          {errors.descripcion && (
            <p
              className="text-xs text-destructive"
              data-ocid="gastos.form.descripcion.field_error"
            >
              {errors.descripcion}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 animate-field-in">
          <div className="space-y-1.5">
            <Label className="text-sm font-body text-muted-foreground">
              {t("expenses.value")}
            </Label>
            <Input
              data-ocid="gastos.form.valor.input"
              type="number"
              min="0"
              step="0.01"
              value={form.valor || ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  valor: Number.parseFloat(e.target.value) || 0,
                }))
              }
              placeholder="0.00"
              className="h-12 rounded-xl font-mono text-base"
            />
            {errors.valor && (
              <p
                className="text-xs text-destructive"
                data-ocid="gastos.form.valor.field_error"
              >
                {errors.valor}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-body text-muted-foreground">
              {t("expenses.currency")}
            </Label>
            <Select
              value={form.monedaOriginal as string}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, monedaOriginal: v as CurrencyCode }))
              }
            >
              <SelectTrigger
                data-ocid="gastos.form.moneda.select"
                className="h-12 rounded-xl font-body"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CURRENCY_LABELS) as CurrencyCode[]).map((c) => (
                  <SelectItem key={c} value={c} className="font-body">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5 animate-field-in">
          <Label className="text-sm font-body text-muted-foreground">
            {t("expenses.dateFormat")}
          </Label>
          <Input
            data-ocid="gastos.form.fecha.input"
            value={form.fecha}
            onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
            placeholder={t("expenses.datePlaceholder")}
            className="h-12 rounded-xl font-mono text-base"
          />
          {errors.fecha && (
            <p
              className="text-xs text-destructive"
              data-ocid="gastos.form.fecha.field_error"
            >
              {errors.fecha}
            </p>
          )}
        </div>

        <div className="space-y-1.5 animate-field-in">
          <Label className="text-sm font-body text-muted-foreground">
            {t("expenses.category")}
          </Label>
          <Select
            value={form.categoria}
            onValueChange={(v) => setForm((p) => ({ ...p, categoria: v }))}
          >
            <SelectTrigger
              data-ocid="gastos.form.categoria.select"
              className="h-12 rounded-xl font-body"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c} value={c} className="font-body">
                  {getCatMeta(c).emoji} {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 animate-field-in">
          <Label className="text-sm font-body text-muted-foreground">
            {t("expenses.payMethod")}
          </Label>
          <Select
            value={form.metodoPago}
            onValueChange={(v) => setForm((p) => ({ ...p, metodoPago: v }))}
          >
            <SelectTrigger
              data-ocid="gastos.form.metodopago.select"
              className="h-12 rounded-xl font-body"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {metodosPago.map((m) => (
                <SelectItem key={m} value={m} className="font-body">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 animate-field-in">
          <ToggleRow
            label={t("expenses.isEssential")}
            checked={form.esEsencial}
            onToggle={() =>
              setForm((p) => ({ ...p, esEsencial: !p.esEsencial }))
            }
            ocid="gastos.form.esencial.toggle"
          />
          <ToggleRow
            label={t("expenses.isPaid")}
            checked={form.pagado}
            onToggle={() => setForm((p) => ({ ...p, pagado: !p.pagado }))}
            ocid="gastos.form.pagado.toggle"
          />
        </div>

        {/* Imagen */}
        <div className="space-y-2 animate-field-in">
          <button
            type="button"
            onClick={() => {
              if (showImagePicker || imagenUrl) {
                setImagenUrl(null);
                setShowImagePicker(false);
              } else {
                setShowImagePicker(true);
                fileInputRef.current?.click();
              }
            }}
            data-ocid="gastos.form.imagen_checkbox"
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-colors ${
              showImagePicker || imagenUrl
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-background text-muted-foreground"
            }`}
          >
            <Camera size={16} />
            <span className="text-sm font-body">
              {imagenUrl ? t("expenses.imageAttached") : t("expenses.addImage")}
            </span>
            {!(showImagePicker || imagenUrl) && (
              <span className="ml-auto text-xs text-muted-foreground">
                {t("common.optional")}
              </span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const compressed = await compressImage(file);
              const dataUrl = await blobToDataUrl(compressed);
              setImagenUrl(dataUrl);
              setShowImagePicker(true);
              e.target.value = "";
            }}
          />
          {imagenUrl && (
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img
                src={imagenUrl}
                alt="Comprobante"
                className="w-full max-h-36 object-contain bg-muted"
              />
              <button
                type="button"
                onClick={() => {
                  setImagenUrl(null);
                  setShowImagePicker(false);
                }}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white"
                aria-label={t("expenses.removeImage")}
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sticky footer — always visible, solid white background */}
      <div
        className="flex-shrink-0 bg-white px-5 pt-3"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <Button
          type="button"
          onClick={handleSave}
          disabled={isBusy}
          className="w-full h-12 rounded-2xl text-sm font-display font-semibold"
          data-ocid="gastos.dialog.confirm_button"
        >
          {isBusy ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              {t("expenses.saving")}
            </>
          ) : isEdit ? (
            t("expenses.saveChanges")
          ) : (
            t("expenses.addExpenseBtn")
          )}
        </Button>
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="w-full h-10 text-sm font-body text-muted-foreground hover:text-foreground transition-colors mt-1"
          data-ocid="gastos.dialog.cancel_button"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}

// ── Delete Sheet ──────────────────────────────────────────────────────────────────

function DeleteSheet({
  item,
  onClose,
  onConfirm,
  isPending,
}: {
  item: Transaccion | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  if (!item) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={() => {}}
        aria-hidden="true"
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-elevated"
        data-ocid="gastos.delete_dialog"
        style={{ animation: "slideUp 0.25s cubic-bezier(0.4,0,0.2,1)" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted" />
        </div>
        <div className="px-5 pt-4 pb-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <Trash2 size={18} className="text-destructive" />
            </div>
            <div>
              <h3 className="text-base font-display font-semibold text-foreground">
                {t("expenses.deleteConfirmTitle")}
              </h3>
              <p className="text-sm font-body text-muted-foreground mt-0.5">
                {t("expenses.deleteConfirmMsg")}{" "}
                <strong className="text-foreground">
                  &ldquo;{item.descripcion}&rdquo;
                </strong>
                ?
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            className="w-full h-12 rounded-xl text-base font-display font-semibold"
            data-ocid="gastos.delete_dialog.confirm_button"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                {t("expenses.deleting")}
              </>
            ) : (
              t("common.delete")
            )}
          </Button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-full h-10 text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="gastos.delete_dialog.cancel_button"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Filter Pills ──────────────────────────────────────────────────────────────────

function FilterPills({
  categorias,
  active,
  onChange,
}: { categorias: string[]; active: string; onChange: (c: string) => void }) {
  const { t } = useTranslation();
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none" }}
      data-ocid="gastos.filtro_categoria"
    >
      {[t("expenses.allCategories"), ...categorias].map((c, idx) => {
        const isAll = idx === 0;
        const isActive = isAll ? active === "todas" : active === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(isAll ? "todas" : c)}
            data-ocid={`gastos.filtro.tab.${c.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
            className={`shrink-0 text-xs font-body font-medium h-8 px-4 rounded-full border transition-all ${
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-subtle"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}

// ── Transaction Card ────────────────────────────────────────────────────────────

interface CardProps {
  tx: Transaccion;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePagado: () => void;
  isBusy: boolean;
  isOptimistic?: boolean;
}

function GastoCard({
  tx,
  index,
  onEdit,
  onDelete,
  onTogglePagado,
  isBusy,
  isOptimistic,
}: CardProps) {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const cat = getCatMeta(tx.categoria);
  const { t } = useTranslation();

  return (
    <div
      className={`bg-card rounded-2xl border border-border shadow-subtle overflow-visible transition-opacity ${
        isOptimistic ? "opacity-60" : "opacity-100"
      }`}
      data-ocid={`gastos.lista.item.${index}`}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Category icon */}
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl ${cat.bg}`}
          aria-hidden="true"
        >
          {cat.emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-semibold text-foreground truncate">
                {tx.descripcion}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xs text-muted-foreground font-body">
                  {tx.categoria}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {tx.fecha}
                </span>
                {tx.esEsencial && (
                  <Badge className="text-[9px] h-4 px-1.5 bg-accent/10 text-accent border-accent/20 rounded-full">
                    {t("expenses.essential")}
                  </Badge>
                )}
              </div>
            </div>
            {/* Amount */}
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <TxValue tx={tx} className="text-sm text-destructive" />
              {isOptimistic && (
                <Loader2
                  size={10}
                  className="animate-spin text-muted-foreground"
                />
              )}
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] font-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {tx.metodoPago}
            </span>
            <div className="flex items-center gap-1.5">
              {tx.imagenUrl && (
                <button
                  type="button"
                  onClick={() => setViewerUrl(tx.imagenUrl!)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label={t("expenses.viewReceipt")}
                  data-ocid={`gastos.lista.imagen_button.${index}`}
                >
                  <Camera size={13} />
                </button>
              )}
              {/* Paid toggle pill */}
              <button
                type="button"
                onClick={onTogglePagado}
                disabled={isBusy}
                aria-label={
                  tx.pagado ? t("expenses.markPending") : t("expenses.markPaid")
                }
                data-ocid={`gastos.lista.pagado.${index}`}
                className={`flex items-center gap-1 text-[11px] font-body font-medium h-6 px-2.5 rounded-full transition-all ${
                  tx.pagado
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50"
                }`}
              >
                {isBusy ? (
                  <Loader2 size={9} className="animate-spin" />
                ) : tx.pagado ? (
                  <CheckCircle2 size={10} />
                ) : (
                  <Clock size={10} />
                )}
                {tx.pagado ? t("expenses.paid") : t("expenses.pending")}
              </button>
              {/* 3-dot menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label={t("expenses.moreOptions")}
                  data-ocid={`gastos.lista.menu_button.${index}`}
                >
                  <MoreVertical size={14} />
                </button>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                      onKeyDown={() => {}}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 bottom-full mb-1 z-20 bg-card border border-border rounded-xl shadow-elevated overflow-hidden min-w-28">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onEdit();
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-body text-foreground hover:bg-muted transition-colors"
                        data-ocid={`gastos.lista.edit_button.${index}`}
                      >
                        <Edit2 size={13} className="text-muted-foreground" />{" "}
                        {t("common.edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete();
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-body text-destructive hover:bg-destructive/5 transition-colors"
                        data-ocid={`gastos.lista.delete_button.${index}`}
                      >
                        <Trash2 size={13} /> {t("common.delete")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {viewerUrl && (
        <ImageViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function GastosPage() {
  const { mesRef } = useCurrentMes();
  const { t } = useTranslation();

  const { data: totales, isLoading: loadingTotales } = useTotalesMes(mesRef);
  const { data: transacciones, isLoading: loadingTx } =
    useTransacciones(mesRef);
  const { data: categoriasData } = useCategorias();
  const { data: metodosPagoData } = useMetodosPago();

  const updateMutation = useUpdateTransaccion();
  const deleteMutation = useDeleteTransaccion();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaccion | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaccion | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");

  // Optimistic state
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [optimisticOverrides, setOptimisticOverrides] = useState<
    Map<string, Partial<Transaccion>>
  >(new Map());

  const ingresos = totales?.ingresosTotal ?? 0;
  const gastosTotales = totales?.gastosTotal ?? 0;
  const saldo = totales?.saldo ?? 0;
  const pctGastos = calcPorcentaje(gastosTotales, ingresos);

  const categorias: string[] =
    categoriasData && categoriasData.length > 0
      ? categoriasData
      : [...CATEGORIAS_DEFAULT];
  const metodosPago: string[] =
    metodosPagoData && metodosPagoData.length > 0
      ? metodosPagoData
      : [...METODOS_PAGO_DEFAULT];

  const gastosDiarios = (transacciones ?? [])
    .filter((t) => !t.esGastoFijo)
    .map((t) => {
      const override = optimisticOverrides.get(t.id);
      return override ? { ...t, ...override } : t;
    });

  const sorted = [...gastosDiarios].sort((a, b) => {
    const parse = (f: string) => {
      const [d, m, y] = f.split("/");
      return new Date(+y, +m - 1, +d).getTime();
    };
    return parse(b.fecha) - parse(a.fecha);
  });

  const gastosVisibles =
    filtroCategoria === "todas"
      ? sorted
      : sorted.filter((t) => t.categoria === filtroCategoria);
  const groups = groupByDate(gastosVisibles);

  const flatIndex = new Map<string, number>();
  let idx = 1;
  for (const g of groups) {
    for (const tx of g.items) {
      flatIndex.set(tx.id, idx++);
    }
  }

  const togglePagado = useCallback(
    async (tx: Transaccion) => {
      const newVal = !tx.pagado;
      setOptimisticOverrides((prev) => {
        const n = new Map(prev);
        n.set(tx.id, { pagado: newVal });
        return n;
      });
      setSyncingIds((prev) => new Set(prev).add(tx.id));
      try {
        await updateMutation.mutateAsync({ ...tx, pagado: newVal });
      } catch {
        setOptimisticOverrides((prev) => {
          const n = new Map(prev);
          n.delete(tx.id);
          return n;
        });
        toast.error(t("common.error"));
      } finally {
        setSyncingIds((prev) => {
          const n = new Set(prev);
          n.delete(tx.id);
          return n;
        });
        setOptimisticOverrides((prev) => {
          const n = new Map(prev);
          n.delete(tx.id);
          return n;
        });
      }
    },
    [updateMutation, t],
  );

  async function handleDelete() {
    if (!deletingTx) return;
    const id = deletingTx.id;
    setDeletingTx(null);
    try {
      await deleteMutation.mutateAsync({ id, mesRef });
      toast.success(t("expenses.deleteExpense"));
    } catch {
      toast.error(t("common.error"));
    }
  }

  function openAdd() {
    setEditingTx(null);
    setSheetOpen(true);
  }
  function openEdit(tx: Transaccion) {
    setEditingTx(tx);
    setSheetOpen(true);
  }

  return (
    <div data-ocid="gastos.page" className="flex flex-col gap-4 pb-28">
      {/* Hero Card */}
      <div
        data-ocid="gastos.saldo_card"
        className="bg-card rounded-3xl border border-border shadow-subtle overflow-hidden"
      >
        <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary/50" />
        <div className="p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <Wallet size={13} className="text-muted-foreground" />
            <p className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-widest">
              {t("expenses.availableBalance")}
            </p>
          </div>
          {loadingTotales ? (
            <Skeleton className="h-10 w-48 my-1" />
          ) : (
            <p
              className={`text-3xl font-mono font-bold leading-tight ${saldo >= 0 ? "text-accent" : "text-destructive"}`}
            >
              <ConvertedTotal value={saldo} />
            </p>
          )}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {pctGastos > 80 ? (
              <AlertCircle size={12} className="text-destructive" />
            ) : (
              <TrendingDown size={12} className="text-muted-foreground" />
            )}
            <span className="text-xs font-body text-muted-foreground">
              {t("expenses.monthlyExpenses")}:
            </span>
            <span
              className={`text-xs font-mono font-semibold ${
                pctGastos > 80
                  ? "text-destructive"
                  : pctGastos > 60
                    ? "text-amber-600"
                    : "text-accent"
              }`}
              data-ocid="gastos.pct_gastos_badge"
            >
              <ConvertedTotal value={gastosTotales} /> (
              {formatPorcentaje(pctGastos)})
            </span>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <FilterPills
        categorias={categorias}
        active={filtroCategoria}
        onChange={setFiltroCategoria}
      />

      {/* List */}
      <div data-ocid="gastos.lista">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-display font-semibold text-foreground">
              {t("expenses.title")}
            </h3>
            {gastosVisibles.length > 0 && (
              <span className="text-xs font-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {gastosVisibles.length}
              </span>
            )}
          </div>
          {gastosVisibles.length > 0 && (
            <span className="text-xs font-mono text-muted-foreground">
              {t("expenses.paid")}:{" "}
              <ConvertedTotal
                value={gastosVisibles
                  .filter((tx) => tx.pagado)
                  .reduce((s, tx) => s + tx.valor, 0)}
              />
            </span>
          )}
        </div>

        {loadingTx ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border p-4"
              >
                <div className="flex gap-3">
                  <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                    <Skeleton className="h-6 w-1/3 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : gastosVisibles.length === 0 ? (
          <div
            className="bg-card rounded-2xl border border-border p-10 text-center"
            data-ocid="gastos.lista.empty_state"
          >
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <ShoppingCart size={24} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-display font-semibold text-foreground">
              {filtroCategoria !== "todas"
                ? `${t("expenses.noExpensesInCategory")} "${filtroCategoria}"`
                : t("expenses.noExpenses")}
            </p>
            <p className="text-xs text-muted-foreground font-body mt-1">
              {t("expenses.addFirst")}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.dateKey}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-body font-medium text-muted-foreground capitalize">
                    {group.dateLabel}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-mono text-muted-foreground">
                    <ConvertedTotal
                      value={group.items.reduce((s, tx) => s + tx.valor, 0)}
                    />
                  </span>
                </div>
                <div className="space-y-2">
                  {group.items.map((tx) => (
                    <GastoCard
                      key={tx.id}
                      tx={tx}
                      index={flatIndex.get(tx.id) ?? 0}
                      onEdit={() => openEdit(tx)}
                      onDelete={() => setDeletingTx(tx)}
                      onTogglePagado={() => togglePagado(tx)}
                      isBusy={syncingIds.has(tx.id)}
                      isOptimistic={syncingIds.has(tx.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={openAdd}
        className="fixed bottom-28 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-40"
        aria-label={t("expenses.addExpense")}
        data-ocid="gastos.agregar_button"
      >
        <Plus size={24} />
      </button>

      {/* Sheets */}
      {sheetOpen && (
        <TransaccionSheet
          open={sheetOpen}
          onClose={() => {
            setSheetOpen(false);
            setEditingTx(null);
          }}
          initial={editingTx}
          mesReferencia={mesRef}
          categorias={categorias}
          metodosPago={metodosPago}
        />
      )}
      <DeleteSheet
        item={deletingTx}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
