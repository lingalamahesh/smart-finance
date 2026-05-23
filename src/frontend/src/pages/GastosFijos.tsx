import { ImageViewer } from "@/components/ImageViewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { convertAndFormat, formatFecha } from "@/utils/format";
import {
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Loader2,
  Paperclip,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import { blobToDataUrl, compressImage } from "../utils/imageCompression";

// ── Chart colors ──────────────────────────────────────────────────────────────

const CHART_COLORS = [
  "#22c55e",
  "#f59e0b",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

// ── Category icons map ────────────────────────────────────────────────────────

const CAT_EMOJI: Record<string, string> = {
  Vivienda: "🏠",
  "Servicios del hogar": "💡",
  Membresías: "🎫",
  Suscripciones: "📱",
  "Comida/Alimentación": "🍔",
  Transporte: "🚗",
  Supermercado: "🛒",
};

function getCatEmoji(cat: string): string {
  return CAT_EMOJI[cat] ?? "📋";
}

// ── helpers ───────────────────────────────────────────────────────────────────

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
    esGastoFijo: true,
    mesReferencia,
    monedaOriginal: defaultCurrency,
  };
}

// ── TxAmount ──────────────────────────────────────────────────────────────────

function TxAmount({
  tx,
  className = "",
}: { tx: Transaccion; className?: string }) {
  const { selectedCurrency, exchangeRates } = useCurrency();
  return (
    <span
      className={`font-mono font-bold whitespace-nowrap inline-flex items-center gap-1 ${className}`}
    >
      {tx.monedaOriginal !== selectedCurrency && (
        <Badge
          variant="outline"
          className="text-[9px] h-4 px-1 font-mono shrink-0"
        >
          {tx.monedaOriginal}
        </Badge>
      )}
      {convertAndFormat(
        tx.valor,
        tx.monedaOriginal as CurrencyCode,
        selectedCurrency,
        exchangeRates,
      )}
    </span>
  );
}

// ── GastoFijoCard ─────────────────────────────────────────────────────────────

interface CardProps {
  tx: Transaccion;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePagado: () => void;
  isBusy: boolean;
}

function GastoFijoCard({
  tx,
  index,
  onEdit,
  onDelete,
  onTogglePagado,
  isBusy,
}: CardProps) {
  const isPending = !tx.pagado;
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const { t } = useTranslation();

  return (
    <>
      <div
        className={`relative rounded-2xl border transition-all active:scale-[0.99] ${
          isPending
            ? "bg-card border-amber-400/60 shadow-sm"
            : "bg-card border-border shadow-sm"
        }`}
        data-ocid={`gastos-fijos.lista.item.${index}`}
      >
        {/* Pending left bar */}
        {isPending && (
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-amber-400" />
        )}

        {/* Main tap area — toggles paid status */}
        <button
          type="button"
          className="w-full text-left p-4 pl-5 flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
          onClick={onTogglePagado}
          disabled={isBusy}
          aria-label={
            isPending
              ? t("fixedExpenses.markAsPaid")
              : t("fixedExpenses.markPending")
          }
          data-ocid={`gastos-fijos.lista.pagado.${index}`}
        >
          {/* Category icon circle */}
          <div
            className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-lg ${
              isPending ? "bg-amber-100 dark:bg-amber-900/30" : "bg-accent/10"
            }`}
          >
            <span>{getCatEmoji(tx.categoria)}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-body font-semibold truncate ${
                isPending ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {tx.descripcion}
            </p>
            <p className="text-xs text-muted-foreground font-body mt-0.5 truncate">
              {tx.categoria} · {tx.fecha}
            </p>
          </div>

          {/* Amount + status */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <TxAmount
              tx={tx}
              className={`text-sm ${
                isPending ? "text-amber-600" : "text-accent"
              }`}
            />
            <div
              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-body font-semibold ${
                isPending
                  ? "bg-amber-500/10 text-amber-600 border border-amber-300"
                  : "bg-accent/10 text-accent border border-accent/20"
              }`}
            >
              {isPending ? (
                <>
                  <AlertTriangle size={8} />
                  {t("fixedExpenses.markPending")}
                </>
              ) : (
                <>
                  <CheckCircle2 size={8} />
                  {t("fixedExpenses.markAsPaid")}
                </>
              )}
            </div>
          </div>
        </button>

        {/* Action row */}
        <div className="flex items-center gap-1 px-4 pb-3 pt-0 pl-5">
          <span className="text-[11px] font-body text-muted-foreground flex-1">
            {tx.metodoPago}
          </span>
          {tx.imagenUrl && (
            <button
              type="button"
              onClick={() => setViewerUrl(tx.imagenUrl!)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={t("fixedExpenses.viewReceipt")}
              data-ocid={`gastos-fijos.lista.imagen_button.${index}`}
            >
              <Paperclip size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label={t("common.edit")}
            data-ocid={`gastos-fijos.lista.edit_button.${index}`}
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label={t("common.delete")}
            data-ocid={`gastos-fijos.lista.delete_button.${index}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {viewerUrl && (
        <ImageViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />
      )}
    </>
  );
}

// ── DonutChart ────────────────────────────────────────────────────────────────

interface ChartEntry {
  name: string;
  value: number;
  color: string;
  pct: string;
}

function DonutChart({ data }: { data: ChartEntry[] }) {
  const { selectedCurrency, exchangeRates } = useCurrency();
  const { t } = useTranslation();

  if (data.length === 0) return null;

  return (
    <div
      className="bg-card rounded-2xl border border-border p-4 shadow-sm"
      data-ocid="gastos-fijos.chart"
    >
      <h3 className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {t("fixedExpenses.distributionByCategory")}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [
              convertAndFormat(value, "COP", selectedCurrency, exchangeRates),
              "",
            ]}
            labelFormatter={(label: string) => label}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              fontSize: "12px",
              fontFamily: "var(--font-body)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="mt-3 space-y-1.5">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: entry.color }}
            />
            <span className="text-xs font-body text-muted-foreground flex-1 truncate">
              {entry.name}
            </span>
            <span className="text-xs font-mono font-semibold text-foreground">
              {convertAndFormat(
                entry.value,
                "COP",
                selectedCurrency,
                exchangeRates,
              )}
            </span>
            <span className="text-[10px] font-body text-muted-foreground w-10 text-right">
              {entry.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── GastoFijoDialog (bottom-sheet style) ──────────────────────────────────────

interface DialogProps {
  open: boolean;
  onClose: () => void;
  initial: Transaccion | null;
  mesReferencia: string;
  categorias: string[];
  metodosPago: string[];
}

function GastoFijoDialog({
  open,
  onClose,
  initial,
  mesReferencia,
  categorias,
  metodosPago,
}: DialogProps) {
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

  // Reset form every time the sheet opens or the item being edited changes
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
      errs.descripcion = t("fixedExpenses.descriptionRequired");
    if (form.valor <= 0) errs.valor = t("fixedExpenses.valueRequired");
    if (!form.fecha.match(/^\d{2}\/\d{2}\/\d{4}$/))
      errs.fecha = t("fixedExpenses.dateFormatError");
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
        {
          ...form,
          id: initial.id,
          esGastoFijo: true,
          imagenUrl: imagenUrl ?? undefined,
        },
        {
          onSuccess: () => toast.success(t("fixedExpenses.editFixed")),
          onError: (err) => {
            console.error("Error al actualizar gasto fijo:", err);
            toast.error(t("common.error"));
          },
        },
      );
    } else {
      addMutation.mutate(
        {
          ...form,
          id: crypto.randomUUID(),
          esGastoFijo: true,
          imagenUrl: imagenUrl ?? undefined,
        },
        {
          onSuccess: () => toast.success(t("fixedExpenses.addFixed")),
          onError: (err) => {
            console.error("Error al guardar gasto fijo:", err);
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
      data-ocid="gastos-fijos.dialog"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      aria-modal="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-base font-display font-semibold text-foreground">
          {isEdit
            ? t("fixedExpenses.editFixedTitle")
            : t("fixedExpenses.addFixedTitle")}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          aria-label={t("common.close")}
          data-ocid="gastos-fijos.dialog.close_button"
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
        <div className="grid gap-1.5 animate-field-in">
          <Label className="font-body text-sm">
            {t("fixedExpenses.description")}
          </Label>
          <Input
            data-ocid="gastos-fijos.form.descripcion.input"
            value={form.descripcion}
            onChange={(e) =>
              setForm((p) => ({ ...p, descripcion: e.target.value }))
            }
            placeholder={t("fixedExpenses.descriptionPlaceholder")}
            className="h-12 font-body rounded-xl text-base"
            autoFocus={false}
          />
          {errors.descripcion && (
            <p
              className="text-xs text-destructive"
              data-ocid="gastos-fijos.form.descripcion.field_error"
            >
              {errors.descripcion}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 animate-field-in">
          <div className="grid gap-1.5">
            <Label className="font-body text-sm">
              {t("fixedExpenses.value")}
            </Label>
            <Input
              data-ocid="gastos-fijos.form.valor.input"
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
              className="h-12 font-mono rounded-xl text-base"
            />
            {errors.valor && (
              <p
                className="text-xs text-destructive"
                data-ocid="gastos-fijos.form.valor.field_error"
              >
                {errors.valor}
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label className="font-body text-sm">
              {t("fixedExpenses.currency")}
            </Label>
            <Select
              value={form.monedaOriginal as string}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, monedaOriginal: v as CurrencyCode }))
              }
            >
              <SelectTrigger
                data-ocid="gastos-fijos.form.moneda.select"
                className="h-12 font-body rounded-xl"
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

        <div className="grid gap-1.5 animate-field-in">
          <Label className="font-body text-sm">
            {t("fixedExpenses.dateFormat")}
          </Label>
          <Input
            data-ocid="gastos-fijos.form.fecha.input"
            value={form.fecha}
            onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
            placeholder={t("fixedExpenses.datePlaceholder")}
            className="h-12 font-mono rounded-xl text-base"
          />
          {errors.fecha && (
            <p
              className="text-xs text-destructive"
              data-ocid="gastos-fijos.form.fecha.field_error"
            >
              {errors.fecha}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 animate-field-in">
          <div className="grid gap-1.5">
            <Label className="font-body text-sm">
              {t("fixedExpenses.category")}
            </Label>
            <Select
              value={form.categoria}
              onValueChange={(v) => setForm((p) => ({ ...p, categoria: v }))}
            >
              <SelectTrigger
                data-ocid="gastos-fijos.form.categoria.select"
                className="h-12 font-body rounded-xl"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c} className="font-body">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="font-body text-sm">
              {t("fixedExpenses.payMethod")}
            </Label>
            <Select
              value={form.metodoPago}
              onValueChange={(v) => setForm((p) => ({ ...p, metodoPago: v }))}
            >
              <SelectTrigger
                data-ocid="gastos-fijos.form.metodopago.select"
                className="h-12 font-body rounded-xl"
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
        </div>

        <div className="flex items-center gap-2 px-1 animate-field-in">
          <Checkbox
            data-ocid="gastos-fijos.form.pagado.checkbox"
            id="gf-pagado"
            checked={form.pagado}
            onCheckedChange={(v) => setForm((p) => ({ ...p, pagado: !!v }))}
          />
          <Label
            htmlFor="gf-pagado"
            className="font-body text-sm cursor-pointer"
          >
            {t("fixedExpenses.markAsPaid")}
          </Label>
        </div>

        {/* Imagen adjunta */}
        <div className="flex flex-col gap-2 animate-field-in">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="gf-agregar-imagen"
              checked={showImagePicker || !!imagenUrl}
              onChange={(e) => {
                if (!e.target.checked) {
                  setImagenUrl(null);
                  setShowImagePicker(false);
                } else {
                  setShowImagePicker(true);
                  fileInputRef.current?.click();
                }
              }}
              className="w-4 h-4 accent-primary cursor-pointer"
              data-ocid="gastos-fijos.form.imagen_checkbox"
            />
            <label
              htmlFor="gf-agregar-imagen"
              className="text-sm font-body text-muted-foreground cursor-pointer select-none"
            >
              {t("fixedExpenses.addImageSupport")}
            </label>
          </div>
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
            <img
              src={imagenUrl}
              alt="Comprobante"
              className="rounded-xl border border-border max-h-32 object-contain w-full"
            />
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
          data-ocid="gastos-fijos.dialog.confirm_button"
        >
          {isBusy ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              {t("fixedExpenses.saving")}
            </>
          ) : isEdit ? (
            t("fixedExpenses.saveChanges")
          ) : (
            t("fixedExpenses.addFixedBtn")
          )}
        </Button>
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="w-full h-10 text-sm font-body text-muted-foreground hover:text-foreground transition-colors mt-1"
          data-ocid="gastos-fijos.dialog.cancel_button"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}

// ── DeleteDialog ──────────────────────────────────────────────────────────────

interface DeleteDialogProps {
  item: Transaccion | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

function DeleteDialog({
  item,
  onClose,
  onConfirm,
  isPending,
}: DeleteDialogProps) {
  const { t } = useTranslation();
  if (!item) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={() => {}}
        aria-hidden="true"
      />
      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-elevated"
        data-ocid="gastos-fijos.delete_dialog"
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
                {t("fixedExpenses.deleteConfirmTitle")}
              </h3>
              <p className="text-sm font-body text-muted-foreground mt-0.5">
                {t("common.delete")}{" "}
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
            data-ocid="gastos-fijos.delete_dialog.confirm_button"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                {t("fixedExpenses.deleting")}
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
            data-ocid="gastos-fijos.delete_dialog.cancel_button"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function GastosFijosPage() {
  const { mesRef } = useCurrentMes();
  const { t } = useTranslation();

  const { data: transacciones, isLoading: loadingTx } =
    useTransacciones(mesRef);
  const { data: categoriasData } = useCategorias();
  const { data: metodosPagoData } = useMetodosPago();

  const updateMutation = useUpdateTransaccion();
  const deleteMutation = useDeleteTransaccion();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaccion | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaccion | null>(null);

  // Optimistic paid toggles: id → optimistic pagado value
  const [optimisticPagado, setOptimisticPagado] = useState<
    Record<string, boolean>
  >({});

  const { selectedCurrency, exchangeRates } = useCurrency();

  const categorias: string[] =
    categoriasData && categoriasData.length > 0
      ? categoriasData
      : [...CATEGORIAS_DEFAULT];

  const metodosPago: string[] =
    metodosPagoData && metodosPagoData.length > 0
      ? metodosPagoData
      : [...METODOS_PAGO_DEFAULT];

  // Apply optimistic overrides
  const gastosFijos = (transacciones ?? [])
    .filter((tx) => tx.esGastoFijo)
    .map((tx) =>
      tx.id in optimisticPagado
        ? { ...tx, pagado: optimisticPagado[tx.id] }
        : tx,
    );

  const pendientes = gastosFijos.filter((tx) => !tx.pagado);
  const pagados = gastosFijos.filter((tx) => tx.pagado);

  const totalPendiente = pendientes.reduce((s, tx) => s + tx.valor, 0);
  const totalPagado = pagados.reduce((s, tx) => s + tx.valor, 0);
  const total = gastosFijos.reduce((s, tx) => s + tx.valor, 0);

  // Chart data
  const porCategoria = gastosFijos.reduce<Record<string, number>>((acc, tx) => {
    acc[tx.categoria] = (acc[tx.categoria] ?? 0) + tx.valor;
    return acc;
  }, {});

  const chartData: ChartEntry[] = Object.entries(porCategoria)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value], i) => ({
      name,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
      pct: total > 0 ? ((value / total) * 100).toFixed(1) : "0.0",
    }));

  async function togglePagado(tx: Transaccion) {
    const newVal = !tx.pagado;
    // Optimistic update
    setOptimisticPagado((prev) => ({ ...prev, [tx.id]: newVal }));
    try {
      await updateMutation.mutateAsync({ ...tx, pagado: newVal });
    } catch {
      // Revert
      setOptimisticPagado((prev) => {
        const next = { ...prev };
        delete next[tx.id];
        return next;
      });
      toast.error(t("common.error"));
    } finally {
      // Clean up after backend confirms
      setOptimisticPagado((prev) => {
        const next = { ...prev };
        delete next[tx.id];
        return next;
      });
    }
  }

  async function handleDelete() {
    if (!deletingTx) return;
    try {
      await deleteMutation.mutateAsync({ id: deletingTx.id, mesRef });
      toast.success(t("fixedExpenses.deleteFixed"));
      setDeletingTx(null);
    } catch {
      toast.error(t("common.error"));
    }
  }

  function openAdd() {
    setEditingTx(null);
    setDialogOpen(true);
  }

  function openEdit(tx: Transaccion) {
    setEditingTx(tx);
    setDialogOpen(true);
  }

  return (
    <div data-ocid="gastos-fijos.page" className="flex flex-col gap-4 pb-36">
      {/* ── Stats Header Card ─────────────────────────────────────────────── */}
      <div
        className="bg-card rounded-2xl border border-border p-5 shadow-sm relative overflow-hidden"
        data-ocid="gastos-fijos.stats_card"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
        <p className="text-xs font-display font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          {t("fixedExpenses.monthTotal")}
        </p>
        {loadingTx ? (
          <Skeleton className="h-10 w-44 mb-3" />
        ) : (
          <p className="text-3xl font-mono font-bold text-foreground mb-3 leading-none">
            {convertAndFormat(total, "COP", selectedCurrency, exchangeRates)}
          </p>
        )}
        <div className="flex gap-4">
          <div
            className="flex items-center gap-2"
            data-ocid="gastos-fijos.stats_pagados"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            {loadingTx ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <span className="text-sm font-body">
                <span className="font-semibold text-green-600">
                  {pagados.length} {t("fixedExpenses.paidCount")}
                </span>
                <span className="text-muted-foreground ml-1 text-xs">
                  (
                  {convertAndFormat(
                    totalPagado,
                    "COP",
                    selectedCurrency,
                    exchangeRates,
                  )}
                  )
                </span>
              </span>
            )}
          </div>
          <div
            className="flex items-center gap-2"
            data-ocid="gastos-fijos.stats_pendientes"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            {loadingTx ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <span className="text-sm font-body">
                <span className="font-semibold text-amber-600">
                  {pendientes.length} {t("fixedExpenses.pendingCount")}
                </span>
                <span className="text-muted-foreground ml-1 text-xs">
                  (
                  {convertAndFormat(
                    totalPendiente,
                    "COP",
                    selectedCurrency,
                    exchangeRates,
                  )}
                  )
                </span>
              </span>
            )}
          </div>
        </div>
        {/* Progress bar */}
        {gastosFijos.length > 0 && !loadingTx && (
          <div className="mt-3">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{
                  width: `${(pagados.length / gastosFijos.length) * 100}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-body mt-1">
              {((pagados.length / gastosFijos.length) * 100).toFixed(0)}
              {t("fixedExpenses.commitmentsPaid")}
            </p>
          </div>
        )}
      </div>

      {/* ── Donut Chart ───────────────────────────────────────────────────── */}
      {!loadingTx && chartData.length > 0 && <DonutChart data={chartData} />}
      {loadingTx && <Skeleton className="h-64 w-full rounded-2xl" />}

      {/* ── Pending section ───────────────────────────────────────────────── */}
      {!loadingTx && pendientes.length > 0 && (
        <section data-ocid="gastos-fijos.pendientes_section">
          <div className="flex items-center gap-2 mb-2 px-1">
            <AlertTriangle size={14} className="text-amber-500" />
            <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-amber-600">
              {t("fixedExpenses.pendingSection")}
            </h2>
            <span className="ml-auto text-xs font-mono font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
              {pendientes.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {pendientes.map((tx, i) => (
              <GastoFijoCard
                key={tx.id}
                tx={tx}
                index={i + 1}
                onEdit={() => openEdit(tx)}
                onDelete={() => setDeletingTx(tx)}
                onTogglePagado={() => togglePagado(tx)}
                isBusy={updateMutation.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Paid section ──────────────────────────────────────────────────── */}
      {!loadingTx && pagados.length > 0 && (
        <section data-ocid="gastos-fijos.pagados_section">
          <div className="flex items-center gap-2 mb-2 px-1">
            <CheckCircle2 size={14} className="text-accent" />
            <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-accent">
              {t("fixedExpenses.paidSection")}
            </h2>
            <span className="ml-auto text-xs font-mono font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
              {pagados.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {pagados.map((tx, i) => (
              <GastoFijoCard
                key={tx.id}
                tx={tx}
                index={pendientes.length + i + 1}
                onEdit={() => openEdit(tx)}
                onDelete={() => setDeletingTx(tx)}
                onTogglePagado={() => togglePagado(tx)}
                isBusy={updateMutation.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!loadingTx && gastosFijos.length === 0 && (
        <div
          className="bg-card rounded-2xl border border-border p-10 text-center shadow-sm"
          data-ocid="gastos-fijos.lista.empty_state"
        >
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <RotateCcw size={24} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-body font-semibold text-foreground">
            {t("fixedExpenses.noFixed")}
          </p>
          <p className="text-xs text-muted-foreground font-body mt-1 mb-4">
            {t("fixedExpenses.noFixedDesc")}
          </p>
          <Button
            type="button"
            onClick={openAdd}
            className="rounded-xl gap-2 text-sm"
            data-ocid="gastos-fijos.lista.empty_state.add_button"
          >
            <Plus size={14} />
            {t("fixedExpenses.addFirstFixed")}
          </Button>
        </div>
      )}

      {/* ── Skeleton cards ────────────────────────────────────────────────── */}
      {loadingTx && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* ── FAB ──────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={openAdd}
        aria-label={t("fixedExpenses.addFixed")}
        data-ocid="gastos-fijos.agregar_button"
        className="fixed bottom-28 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-30 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all"
        style={{ boxShadow: "0 4px 20px oklch(0.68 0.15 136 / 0.4)" }}
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      {dialogOpen && (
        <GastoFijoDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditingTx(null);
          }}
          initial={editingTx}
          mesReferencia={mesRef}
          categorias={categorias}
          metodosPago={metodosPago}
        />
      )}
      <DeleteDialog
        item={deletingTx}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
