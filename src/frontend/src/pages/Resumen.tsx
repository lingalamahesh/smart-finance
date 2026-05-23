import { ImageViewer } from "@/components/ImageViewer";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackend } from "@/hooks/useBackend";
import { useCurrency } from "@/hooks/useCurrency";
import { useCurrentMes } from "@/hooks/useCurrentMes";
import {
  useAddFuenteIngreso,
  useDeleteFuenteIngreso,
  useFuentesIngreso,
  useTotalesMes,
  useUpdateFuenteIngreso,
} from "@/hooks/useFinanzas";
import { CURRENCY_LABELS, type CurrencyCode } from "@/types/finanzas";
import type { FuenteIngreso } from "@/types/finanzas";
import { convertAndFormat, parseFecha } from "@/utils/format";
import { getMesNames } from "@/utils/mes";
import {
  CheckCircle2,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { blobToDataUrl, compressImage } from "../utils/imageCompression";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getInitial(str: string): string {
  return (str.trim()[0] ?? "?").toUpperCase();
}

function fromInputDate(val: string): string {
  if (!val) return "";
  const [y, m, d] = val.split("-");
  if (!y || !m || !d) return val;
  return `${d}/${m}/${y}`;
}

function toInputDate(fecha: string | undefined): string {
  if (!fecha) return new Date().toISOString().slice(0, 10);
  const parts = fecha.split("/");
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return new Date().toISOString().slice(0, 10);
}

// ─── Optimistic type ──────────────────────────────────────────────────────────
interface OptimisticFuente extends FuenteIngreso {
  _optimistic?: boolean;
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      data-ocid="resumen.sheet"
    >
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm sheet-backdrop"
        onClick={onClose}
        onKeyDown={() => {}}
        aria-hidden="true"
        style={{ touchAction: "none" }}
      />
      {/* Sheet container: fixed height flex column so footer never clips */}
      <div
        className="relative bg-card rounded-t-3xl shadow-elevated flex flex-col max-h-[92dvh] bottom-sheet"
        style={{ overscrollBehavior: "contain" }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        aria-modal="true"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 flex-shrink-0">
          <span className="font-display font-semibold text-base text-foreground">
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted transition-smooth text-muted-foreground"
            aria-label="Cerrar"
            data-ocid="resumen.sheet.close_button"
          >
            <X size={18} />
          </button>
        </div>
        {/* Scrollable body — grows, scrolls */}
        <div
          className="flex-1 overflow-y-auto px-5 pb-2"
          style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Fuente Form Sheet ────────────────────────────────────────────────────────
interface FuenteSheetProps {
  open: boolean;
  initial?: FuenteIngreso | null;
  mesRef: string;
  onClose: () => void;
  onOptimisticAdd: (item: OptimisticFuente) => void;
  onOptimisticRevert: (tempId: string) => void;
  onOptimisticUpdate: (item: FuenteIngreso) => void;
}

function FuenteSheet({
  open,
  initial,
  mesRef,
  onClose,
  onOptimisticAdd,
  onOptimisticRevert,
  onOptimisticUpdate,
}: FuenteSheetProps) {
  const addFuente = useAddFuenteIngreso();
  const updateFuente = useUpdateFuenteIngreso();
  const isEditing = !!initial;
  const { selectedCurrency } = useCurrency();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [descripcion, setDescripcion] = useState("");
  const [valor, setValor] = useState("");
  const [moneda, setMoneda] = useState<CurrencyCode>(selectedCurrency);
  const [fechaInput, setFechaInput] = useState("");
  const [errors, setErrors] = useState<{
    descripcion?: string;
    valor?: string;
  }>({});
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (open) {
      setDescripcion(initial?.descripcion ?? "");
      setValor(initial?.valor != null ? String(initial.valor) : "");
      setMoneda((initial?.monedaOriginal as CurrencyCode) ?? selectedCurrency);
      setFechaInput(toInputDate(initial?.fecha));
      setErrors({});
      setSaving(false);
      if (initial?.imagenUrl) {
        setImagenUrl(initial.imagenUrl);
        setShowImagePicker(true);
      } else {
        setImagenUrl(null);
        setShowImagePicker(false);
      }
    }
  }, [open, initial, selectedCurrency]);

  function validate(): boolean {
    const e: { descripcion?: string; valor?: string } = {};
    if (!descripcion.trim()) e.descripcion = "La descripción es requerida";
    const n = Number.parseFloat(valor);
    if (!valor.trim() || Number.isNaN(n) || n < 0)
      e.valor = "Ingresa un valor válido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate() || saving) return;
    setSaving(true);

    const item: FuenteIngreso = {
      id: initial?.id ?? crypto.randomUUID(),
      descripcion: descripcion.trim(),
      valor: Number.parseFloat(valor),
      fecha: fechaInput ? fromInputDate(fechaInput) : undefined,
      mesReferencia: mesRef,
      monedaOriginal: moneda,
      imagenUrl: imagenUrl ?? null,
    };

    if (isEditing) {
      onOptimisticUpdate(item);
      onClose();
      setSaving(false);
      updateFuente.mutate(item, {
        onSuccess: () => toast.success("Fuente actualizada"),
        onError: (err) => {
          console.error("Error al actualizar fuente:", err);
          toast.error("Error al actualizar la fuente");
        },
      });
    } else {
      const tempId = `temp-${Date.now()}`;
      const optimisticItem: OptimisticFuente = {
        ...item,
        id: tempId,
        _optimistic: true,
      };
      onOptimisticAdd(optimisticItem);
      onClose();
      setSaving(false);
      addFuente.mutate(item, {
        onSuccess: () => {
          onOptimisticRevert(tempId);
          toast.success("Fuente añadida");
        },
        onError: (err) => {
          console.error("Error al añadir fuente:", err);
          onOptimisticRevert(tempId);
          toast.error("Error al añadir la fuente");
        },
      });
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-white flex flex-col"
      style={{ height: "100dvh" }}
      data-ocid="resumen.sheet"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      aria-modal="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
        <span className="font-display font-semibold text-base text-foreground">
          {isEditing ? "Editar fuente" : "Nueva fuente de ingreso"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-muted transition-smooth text-muted-foreground"
          aria-label="Cerrar"
          data-ocid="resumen.sheet.close_button"
        >
          <X size={20} />
        </button>
      </div>

      {/* Scrollable body */}
      <div
        className="flex-1 overflow-y-auto px-5 py-4"
        style={{
          WebkitOverflowScrolling: "touch" as never,
          overscrollBehavior: "contain",
          paddingBottom: "24px",
        }}
      >
        <form
          id="fuente-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          autoComplete="off"
        >
          {/* Descripción */}
          <div className="flex flex-col gap-1.5 animate-field-in">
            <label
              htmlFor="fs-desc"
              className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide"
            >
              Descripción
            </label>
            <input
              id="fs-desc"
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Sueldo, Freelance…"
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm font-body text-foreground outline-none border border-transparent focus:border-ring transition-smooth placeholder:text-muted-foreground/50"
              style={{ fontSize: "16px" }}
              data-ocid="resumen.fuente.descripcion_input"
            />
            {errors.descripcion && (
              <span
                className="text-[11px] text-destructive"
                data-ocid="resumen.fuente.descripcion_input.field_error"
              >
                {errors.descripcion}
              </span>
            )}
          </div>

          {/* Valor + Moneda */}
          <div className="grid grid-cols-2 gap-3 animate-field-in">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="fs-valor"
                className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide"
              >
                Valor
              </label>
              <input
                id="fs-valor"
                type="number"
                min="0"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0.00"
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm font-mono text-foreground outline-none border border-transparent focus:border-ring transition-smooth placeholder:text-muted-foreground/50"
                style={{ fontSize: "16px" }}
                data-ocid="resumen.fuente.valor_input"
              />
              {errors.valor && (
                <span
                  className="text-[11px] text-destructive"
                  data-ocid="resumen.fuente.valor_input.field_error"
                >
                  {errors.valor}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="fs-moneda"
                className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide"
              >
                Moneda
              </label>
              <select
                id="fs-moneda"
                value={moneda}
                onChange={(e) => setMoneda(e.target.value as CurrencyCode)}
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm font-body text-foreground outline-none border border-transparent focus:border-ring transition-smooth appearance-none"
                style={{ fontSize: "16px" }}
                data-ocid="resumen.fuente.moneda_select"
              >
                {(Object.keys(CURRENCY_LABELS) as CurrencyCode[]).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha */}
          <div className="flex flex-col gap-1.5 animate-field-in">
            <label
              htmlFor="fs-fecha"
              className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide"
            >
              Fecha del ingreso
            </label>
            <input
              id="fs-fecha"
              type="date"
              value={fechaInput}
              onChange={(e) => setFechaInput(e.target.value)}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm font-mono text-foreground outline-none border border-transparent focus:border-ring transition-smooth"
              style={{ fontSize: "16px" }}
              data-ocid="resumen.fuente.fecha_input"
            />
          </div>

          {/* Imagen adjunta */}
          <div className="flex flex-col gap-2 animate-field-in">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="fs-imagen"
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
                data-ocid="resumen.fuente.imagen_checkbox"
              />
              <label
                htmlFor="fs-imagen"
                className="text-sm font-body text-muted-foreground cursor-pointer select-none flex items-center gap-1.5"
              >
                <Paperclip size={13} />
                Agregar imagen
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
              <div className="relative">
                <img
                  src={imagenUrl}
                  alt="Comprobante"
                  className="rounded-xl border border-border max-h-28 object-contain w-full"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagenUrl(null);
                    setShowImagePicker(false);
                  }}
                  className="absolute top-1.5 right-1.5 p-1 bg-card rounded-full shadow-subtle text-muted-foreground hover:text-destructive transition-smooth"
                  aria-label="Quitar imagen"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Sticky footer — always visible, solid white background */}
      <div
        className="flex-shrink-0 bg-white px-5 pt-3"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <button
          type="submit"
          form="fuente-form"
          disabled={saving}
          onClick={(e) => {
            e.preventDefault();
            const formEl = document.getElementById(
              "fuente-form",
            ) as HTMLFormElement | null;
            if (formEl) formEl.requestSubmit();
          }}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-sm flex items-center justify-center gap-2 shadow-elevated transition-smooth hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          data-ocid="resumen.fuente.submit_button"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {isEditing ? "Guardar cambios" : "Añadir fuente"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full text-muted-foreground font-body text-sm h-10 rounded-2xl hover:bg-muted transition-smooth mt-2"
          data-ocid="resumen.fuente.cancel_button"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Delete Confirm Sheet ─────────────────────────────────────────────────────
interface DeleteSheetProps {
  target: FuenteIngreso | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

function DeleteSheet({
  target,
  onClose,
  onConfirm,
  isPending,
}: DeleteSheetProps) {
  return (
    <BottomSheet open={!!target} onClose={onClose} title="Eliminar fuente">
      <div className="flex flex-col gap-4">
        <p className="text-sm font-body text-muted-foreground">
          ¿Seguro que quieres eliminar{" "}
          <strong className="text-foreground">{target?.descripcion}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="w-full bg-destructive text-destructive-foreground font-display font-semibold text-sm h-12 rounded-2xl flex items-center justify-center gap-2 transition-smooth hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          data-ocid="resumen.delete.confirm_button"
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
          Eliminar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full text-muted-foreground font-body text-sm h-10 rounded-2xl hover:bg-muted transition-smooth"
          data-ocid="resumen.delete.cancel_button"
        >
          Cancelar
        </button>
      </div>
    </BottomSheet>
  );
}

// ─── Fuente Card Item ─────────────────────────────────────────────────────────
interface FuenteCardProps {
  fuente: OptimisticFuente;
  index: number;
  onEdit: (f: FuenteIngreso) => void;
  onDelete: (f: FuenteIngreso) => void;
}

// All avatars use consistent lime-green palette

function FuenteCard({ fuente, index, onEdit, onDelete }: FuenteCardProps) {
  const { selectedCurrency, exchangeRates } = useCurrency();
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 transition-smooth ${
        fuente._optimistic ? "opacity-60" : ""
      }`}
      data-ocid={`resumen.fuentes.item.${index}`}
    >
      {/* Circle avatar — consistent lime-green palette */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-display font-bold shrink-0"
        style={{
          background: "oklch(0.94 0.10 115)",
          color: "oklch(0.35 0.15 115)",
        }}
      >
        {fuente._optimistic ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          getInitial(fuente.descripcion)
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body font-medium text-foreground truncate">
          {fuente.descripcion}
        </p>
        {fuente.fecha && (
          <p className="text-[11px] font-mono text-muted-foreground">
            {fuente.fecha}
          </p>
        )}
      </div>

      {/* Amount */}
      <span className="text-sm font-mono font-semibold text-[oklch(0.50_0.15_170)] shrink-0">
        {convertAndFormat(
          fuente.valor,
          (fuente.monedaOriginal as CurrencyCode) || "COP",
          selectedCurrency,
          exchangeRates,
        )}
      </span>

      {/* Image indicator */}
      {fuente.imagenUrl && !fuente._optimistic && (
        <button
          type="button"
          onClick={() => setViewerUrl(fuente.imagenUrl!)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
          aria-label="Ver comprobante"
          data-ocid={`resumen.fuentes.imagen_button.${index}`}
        >
          <Paperclip size={13} />
        </button>
      )}

      {/* Edit / Delete */}
      {!fuente._optimistic && (
        <>
          <button
            type="button"
            onClick={() => onEdit(fuente)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
            aria-label={`Editar ${fuente.descripcion}`}
            data-ocid={`resumen.fuentes.edit_button.${index}`}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(fuente)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth"
            aria-label={`Eliminar ${fuente.descripcion}`}
            data-ocid={`resumen.fuentes.delete_button.${index}`}
          >
            <Trash2 size={14} />
          </button>
        </>
      )}

      {viewerUrl && (
        <ImageViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ResumenPage() {
  const { mesRef } = useCurrentMes();
  const _today = new Date();

  // Init current month on mesRef change
  const { initMesMutation } = useBackend();
  const prevMesRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevMesRef.current !== null && prevMesRef.current !== mesRef) {
      const [yearStr, monthStr] = mesRef.split("-");
      initMesMutation.mutate({
        anio: Number(yearStr),
        mes: Number(monthStr),
      });
    }
    prevMesRef.current = mesRef;
  }, [mesRef, initMesMutation]);

  // Remote data
  const { data: totales, isLoading: loadingTotales } = useTotalesMes(mesRef);
  const { data: remoteFuentes, isLoading: loadingFuentes } =
    useFuentesIngreso(mesRef);
  const deleteFuente = useDeleteFuenteIngreso();
  const { selectedCurrency, exchangeRates } = useCurrency();

  const ingresos = totales?.ingresosTotal ?? 0;

  // Optimistic fuentes — synced from remote, supports immediate adds/edits
  const [fuentes, setFuentes] = useState<OptimisticFuente[]>([]);
  useEffect(() => {
    if (!loadingFuentes && remoteFuentes) {
      setFuentes(
        [...remoteFuentes].sort((a, b) => {
          if (!a.fecha && !b.fecha) return 0;
          if (!a.fecha) return 1;
          if (!b.fecha) return -1;
          return parseFecha(a.fecha).getTime() - parseFecha(b.fecha).getTime();
        }),
      );
    }
  }, [remoteFuentes, loadingFuentes]);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FuenteIngreso | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FuenteIngreso | null>(null);

  function openAdd() {
    setEditTarget(null);
    setSheetOpen(true);
  }
  function openEdit(f: FuenteIngreso) {
    setEditTarget(f);
    setSheetOpen(true);
  }

  // Optimistic handlers
  function handleOptimisticAdd(item: OptimisticFuente) {
    setFuentes((prev) =>
      [...prev, item].sort((a, b) => {
        if (!a.fecha && !b.fecha) return 0;
        if (!a.fecha) return 1;
        if (!b.fecha) return -1;
        return parseFecha(a.fecha).getTime() - parseFecha(b.fecha).getTime();
      }),
    );
  }
  function handleOptimisticRevert(tempId: string) {
    setFuentes((prev) => prev.filter((f) => f.id !== tempId));
  }
  function handleOptimisticUpdate(item: FuenteIngreso) {
    setFuentes((prev) =>
      prev.map((f) => (f.id === item.id ? { ...item, _optimistic: false } : f)),
    );
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    // optimistic remove
    setFuentes((prev) => prev.filter((f) => f.id !== deleteTarget.id));
    const removed = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteFuente.mutateAsync({ id: removed.id, mesRef });
      toast.success("Fuente eliminada");
    } catch {
      // revert on error
      setFuentes((prev) => [...prev, removed]);
      toast.error("Error al eliminar la fuente");
    }
  }

  return (
    <div data-ocid="resumen.page" className="flex flex-col gap-4 pb-6">
      {/* ── Fuentes de Ingreso ───────────────────────────────── */}
      <div
        className="bg-card rounded-2xl border border-border shadow-subtle overflow-hidden"
        data-ocid="resumen.fuentes"
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[oklch(0.68_0.15_170)] rounded-full" />
            <h3 className="text-xs font-display font-semibold uppercase tracking-wider text-foreground">
              Fuentes de Ingreso
            </h3>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-1 text-[11px] font-body font-semibold text-primary hover:text-primary/80 transition-smooth"
            data-ocid="resumen.fuentes.add_button"
          >
            <Plus size={13} />
            Añadir
          </button>
        </div>

        {/* Card list */}
        {loadingFuentes ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : fuentes.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center"
            data-ocid="resumen.fuentes.empty_state"
          >
            <span className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <TrendingUp size={22} className="text-muted-foreground" />
            </span>
            <p className="text-sm font-body font-medium text-foreground">
              Sin fuentes de ingreso
            </p>
            <p className="text-xs font-body text-muted-foreground">
              Añade tu primera fuente para comenzar
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {fuentes.map((f, i) => (
              <FuenteCard
                key={f.id}
                fuente={f}
                index={i + 1}
                onEdit={openEdit}
                onDelete={(item) => setDeleteTarget(item)}
              />
            ))}
          </div>
        )}

        {/* Total footer */}
        {fuentes.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t border-border">
            <span className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">
              Total Ingresos
            </span>
            <span className="text-sm font-mono font-bold text-[oklch(0.50_0.15_170)]">
              {loadingTotales
                ? "…"
                : convertAndFormat(
                    ingresos,
                    "COP",
                    selectedCurrency,
                    exchangeRates,
                  )}
            </span>
          </div>
        )}
      </div>

      {/* ── FAB ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={openAdd}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-30"
        aria-label="Agregar fuente de ingreso"
        data-ocid="resumen.fuentes.fab_button"
      >
        <Plus size={24} />
      </button>

      {/* ── Sheets ─────────────────────────────────────────────── */}
      <FuenteSheet
        open={sheetOpen}
        initial={editTarget}
        mesRef={mesRef}
        onClose={() => setSheetOpen(false)}
        onOptimisticAdd={handleOptimisticAdd}
        onOptimisticRevert={handleOptimisticRevert}
        onOptimisticUpdate={handleOptimisticUpdate}
      />
      <DeleteSheet
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isPending={deleteFuente.isPending}
      />
    </div>
  );
}
