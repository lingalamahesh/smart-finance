import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/hooks/useCurrency";
import { useCurrentMes } from "@/hooks/useCurrentMes";
import {
  useAddMetaAhorro,
  useMetasAhorro,
  useNotas,
  useSetNotas,
  useUpdateMetaAhorro,
} from "@/hooks/useFinanzas";
import type { MetaAhorro } from "@/types/finanzas";
import { convertAndFormat } from "@/utils/format";
import { Check, Pencil, PiggyBank, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// ─── Inline Edit Amount ───────────────────────────────────────────────────────
interface InlineEditProps {
  value: number;
  onSave: (v: number) => void;
  disabled?: boolean;
  ocid: string;
}

function InlineEditAmount({ value, onSave, disabled, ocid }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  function startEdit() {
    setDraft(String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  function commit() {
    const num = Number.parseFloat(draft);
    if (Number.isNaN(num) || num < 0) {
      setDraft(String(value));
      setEditing(false);
      return;
    }
    setEditing(false);
    if (num !== value) onSave(num);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") {
      setDraft(String(value));
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="number"
          min="0"
          step="1000"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          data-ocid={ocid}
          className="w-28 h-8 px-2 text-sm font-mono font-bold rounded-lg border-2 border-[#C8FF00] bg-[#C8FF00]/10 text-foreground outline-none text-right"
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            commit();
          }}
          className="w-7 h-7 rounded-full bg-[#C8FF00] flex items-center justify-center shrink-0"
          aria-label="Guardar"
        >
          <Check size={13} className="text-black" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      disabled={disabled}
      data-ocid={ocid}
      className="flex items-center gap-1.5 group disabled:opacity-50"
      aria-label="Editar este mes"
    >
      <span className="text-sm font-mono font-bold text-foreground tabular-nums">
        {value.toLocaleString("es-CO")}
      </span>
      <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center opacity-60 group-hover:opacity-100 transition-fast">
        <Pencil size={10} className="text-muted-foreground" />
      </span>
    </button>
  );
}

// ─── Goal Progress Bar ────────────────────────────────────────────────────────
function GoalProgressBar({ pct, flash }: { pct: number; flash: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  return (
    <div
      className="relative h-2 rounded-full overflow-hidden"
      style={{ background: "#E5E5EA" }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: mounted ? `${Math.min(pct, 100)}%` : "0%",
          background: "linear-gradient(90deg, #C8FF00 0%, #34C759 100%)",
          transition: "width 0.6s ease",
          boxShadow: flash ? "0 0 8px #C8FF00" : "none",
        }}
      />
      {flash && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(90deg, #C8FF00 0%, #34C759 100%)",
            opacity: 0.4,
            animation: "fadeOut 0.8s ease forwards",
          }}
        />
      )}
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────
interface GoalCardProps {
  meta: MetaAhorro;
  index: number;
  onUpdateEsteMes: (meta: MetaAhorro, newVal: number) => void;
  isPending: boolean;
}

function GoalCard({ meta, index, onUpdateEsteMes, isPending }: GoalCardProps) {
  const { selectedCurrency, exchangeRates } = useCurrency();
  const [optimisticEsteMes, setOptimisticEsteMes] = useState<number | null>(
    null,
  );
  const [flash, setFlash] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setOptimisticEsteMes(null);
  }, []);

  const esteMes = optimisticEsteMes ?? meta.ahorroEsteMes ?? 0;
  const acumulado = meta.ahorroAcumulado ?? 0;
  const total = meta.metaTotal ?? 0;
  const progreso = acumulado + esteMes;
  const pct = total > 0 ? Math.min((progreso / total) * 100, 100) : 0;
  const restante = Math.max(0, total - progreso);
  const pctDisplay = Math.round(pct);

  function handleSaveEsteMes(newVal: number) {
    // Optimistic update
    setOptimisticEsteMes(newVal);
    setFlash(true);
    setTimeout(() => setFlash(false), 900);
    onUpdateEsteMes(meta, newVal);
  }

  function fmt(v: number) {
    return convertAndFormat(v, "INR", selectedCurrency, exchangeRates);
  }

  return (
    <div
      className="app-card"
      style={{ marginBottom: 0, padding: "20px" }}
      data-ocid={`metas.item.${index}`}
    >
      {/* TOP ROW: name + percentage */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#C8FF00" }}
          >
            <PiggyBank size={15} className="text-black" />
          </span>
          <span className="font-display font-bold text-foreground text-base truncate">
            {meta.nombre}
          </span>
        </div>
        <span
          className="shrink-0 ml-3 text-sm font-mono font-bold"
          style={{
            color: pct >= 100 ? "#34C759" : pct >= 60 ? "#C8FF00" : "#6B6B6B",
          }}
        >
          {pctDisplay}%
        </span>
      </div>

      {/* PROGRESS BAR */}
      <GoalProgressBar pct={pct} flash={flash} />

      {/* STATS ROW */}
      <div className="flex items-center justify-between mt-3 gap-1">
        <div className="flex flex-col">
          <span className="section-title" style={{ marginBottom: 2 }}>
            {t("goals.target")}
          </span>
          <span className="text-xs font-mono text-foreground tabular-nums">
            {fmt(total)}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="section-title" style={{ marginBottom: 2 }}>
            {t("goals.accumulated")}
          </span>
          <span className="text-xs font-mono text-foreground tabular-nums">
            {fmt(acumulado)}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="section-title" style={{ marginBottom: 2 }}>
            {t("goals.remaining")}
          </span>
          <span
            className="text-xs font-mono tabular-nums"
            style={{ color: restante === 0 ? "#34C759" : "#6B6B6B" }}
          >
            {fmt(restante)}
          </span>
        </div>
      </div>

      {/* ESTE MES ROW */}
      <div
        className="flex items-center justify-between mt-3 pt-3"
        style={{ borderTop: "1px solid #E5E5EA" }}
      >
        <span className="section-title" style={{ marginBottom: 0 }}>
          {t("goals.thisMonth")}
        </span>
        <InlineEditAmount
          value={esteMes}
          onSave={handleSaveEsteMes}
          disabled={isPending}
          ocid={`metas.este_mes_input.${index}`}
        />
      </div>
    </div>
  );
}

// ─── Add Meta Sheet ───────────────────────────────────────────────────────────
interface AddMetaSheetProps {
  onClose: () => void;
  onAdd: (m: MetaAhorro) => void;
}

function AddMetaSheet({ onClose, onAdd }: AddMetaSheetProps) {
  const [nombre, setNombre] = useState("");
  const [metaTotal, setMetaTotal] = useState("");
  const [ahorroAcumulado, setAhorroAcumulado] = useState("");
  const [ahorroEsteMes, setAhorroEsteMes] = useState("");
  const { t } = useTranslation();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const meta = Number.parseFloat(metaTotal);
    const acum = Number.parseFloat(ahorroAcumulado) || 0;
    const esteMes = Number.parseFloat(ahorroEsteMes) || 0;
    if (!nombre.trim() || Number.isNaN(meta) || meta <= 0) {
      toast.error(t("goals.goalRequired"));
      return;
    }
    onAdd({
      id: `meta-${Date.now()}`,
      nombre: nombre.trim(),
      metaTotal: meta,
      ahorroAcumulado: acum,
      ahorroEsteMes: esteMes,
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
        onKeyDown={() => {}}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bottom-sheet"
        style={{
          background: "#FFFFFF",
          borderRadius: "24px 24px 0 0",
          padding: "24px 20px 40px",
          maxWidth: 540,
          margin: "0 auto",
        }}
        data-ocid="metas.add_dialog"
      >
        {/* Handle */}
        <div
          className="w-10 h-1 rounded-full mx-auto mb-5"
          style={{ background: "#E5E5EA" }}
        />
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-display font-bold text-foreground">
            {t("goals.newGoalTitle")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#F2F2F7" }}
            data-ocid="metas.add_dialog_close_button"
            aria-label={t("common.close")}
          >
            <X size={16} className="text-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="meta-nombre"
              className="section-title"
              style={{ marginBottom: 0 }}
            >
              {t("goals.goalNameLabel")}
            </label>
            <input
              id="meta-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={t("goals.goalNamePlaceholder")}
              data-ocid="metas.nombre_input"
              className="h-12 px-4 rounded-xl text-sm font-body text-foreground outline-none"
              style={{ background: "#F2F2F7", border: "none" }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="meta-total"
              className="section-title"
              style={{ marginBottom: 0 }}
            >
              {t("goals.totalTarget")}
            </label>
            <input
              id="meta-total"
              type="number"
              min="0"
              step="1000"
              value={metaTotal}
              onChange={(e) => setMetaTotal(e.target.value)}
              placeholder="0"
              data-ocid="metas.meta_total_input"
              className="h-12 px-4 rounded-xl text-sm font-mono text-foreground outline-none"
              style={{ background: "#F2F2F7", border: "none" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="meta-acumulado"
                className="section-title"
                style={{ marginBottom: 0 }}
              >
                {t("goals.iHave")}
              </label>
              <input
                id="meta-acumulado"
                type="number"
                min="0"
                step="1000"
                value={ahorroAcumulado}
                onChange={(e) => setAhorroAcumulado(e.target.value)}
                placeholder="0"
                data-ocid="metas.acumulado_input"
                className="h-12 px-4 rounded-xl text-sm font-mono text-foreground outline-none"
                style={{ background: "#F2F2F7", border: "none" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="meta-estemes"
                className="section-title"
                style={{ marginBottom: 0 }}
              >
                {t("goals.thisMonth")}
              </label>
              <input
                id="meta-estemes"
                type="number"
                min="0"
                step="1000"
                value={ahorroEsteMes}
                onChange={(e) => setAhorroEsteMes(e.target.value)}
                placeholder="0"
                data-ocid="metas.este_mes_nuevo_input"
                className="h-12 px-4 rounded-xl text-sm font-mono text-foreground outline-none"
                style={{ background: "#F2F2F7", border: "none" }}
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary w-full mt-2"
            style={{ height: 52 }}
            data-ocid="metas.add_submit_button"
          >
            {t("goals.saveGoal")}
          </button>
        </form>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function MetasPage() {
  const { mesRef } = useCurrentMes();
  const { t } = useTranslation();

  const { data: metas, isLoading: loadingMetas } = useMetasAhorro();
  const { data: notasData, isLoading: loadingNotas } = useNotas(mesRef);
  const setNotasMutation = useSetNotas();
  const updateMeta = useUpdateMetaAhorro();
  const addMeta = useAddMetaAhorro();

  const [notasLocal, setNotasLocal] = useState("");
  const [showAddSheet, setShowAddSheet] = useState(false);

  useEffect(() => {
    if (notasData !== undefined) setNotasLocal(notasData);
  }, [notasData]);

  const saveNotasTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleNotasChange = useCallback(
    (val: string) => {
      setNotasLocal(val);
      if (saveNotasTimer.current) clearTimeout(saveNotasTimer.current);
      saveNotasTimer.current = setTimeout(() => {
        setNotasMutation.mutate({ mesRef, notas: val });
      }, 800);
    },
    [mesRef, setNotasMutation],
  );
  const handleNotasBlur = useCallback(() => {
    if (saveNotasTimer.current) clearTimeout(saveNotasTimer.current);
    setNotasMutation.mutate({ mesRef, notas: notasLocal });
  }, [mesRef, notasLocal, setNotasMutation]);

  async function handleUpdateEsteMes(meta: MetaAhorro, newVal: number) {
    try {
      await updateMeta.mutateAsync({ ...meta, ahorroEsteMes: newVal });
    } catch {
      toast.error(t("goals.errorUpdate"));
    }
  }

  async function handleAddMeta(newMeta: MetaAhorro) {
    try {
      await addMeta.mutateAsync(newMeta);
      setShowAddSheet(false);
      toast.success(t("goals.goalAdded"));
    } catch {
      toast.error(t("goals.errorAdd"));
    }
  }

  const { selectedCurrency, exchangeRates } = useCurrency();
  const metasList = metas ?? [];
  const totalEsteMes = metasList.reduce(
    (s, m) => s + (m.ahorroEsteMes ?? 0),
    0,
  );

  function fmt(v: number) {
    return convertAndFormat(v, "INR", selectedCurrency, exchangeRates);
  }

  return (
    <div data-ocid="metas.page" className="flex flex-col gap-4 pb-24">
      {/* ─── HERO: Total reservado ─── */}
      <div className="app-card" data-ocid="metas.hero_card">
        <p className="section-title">{t("goals.reservedThisMonth")}</p>
        {loadingMetas ? (
          <Skeleton className="h-10 w-40" />
        ) : (
          <>
            <p className="amount-large" style={{ color: "#0A0A0A" }}>
              {fmt(totalEsteMes)}
            </p>
            <p className="text-sm font-body mt-1" style={{ color: "#6B6B6B" }}>
              {t("goals.in")} {metasList.length} {t("goals.activeGoal")}
              {metasList.length !== 1
                ? `${t("goals.activeGoals").slice(-1)}`
                : ""}
            </p>
          </>
        )}
      </div>

      {/* ─── NOTAS ─── */}
      <div className="app-card" data-ocid="metas.notas">
        <p className="section-title">{t("goals.monthlyNotes")}</p>
        {loadingNotas ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <textarea
            className="w-full text-sm font-body text-foreground bg-transparent resize-none outline-none min-h-[80px] placeholder:text-[#6B6B6B]/50"
            placeholder={t("goals.notesPlaceholder")}
            value={notasLocal}
            onChange={(e) => handleNotasChange(e.target.value)}
            onBlur={handleNotasBlur}
            data-ocid="metas.notas_textarea"
          />
        )}
      </div>

      {/* ─── GOALS LIST ─── */}
      <div className="flex flex-col gap-0">
        <p className="section-title px-1" style={{ marginBottom: 12 }}>
          {t("goals.yourGoals")}
        </p>

        {loadingMetas ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 w-full rounded-[20px]" />
            ))}
          </div>
        ) : metasList.length === 0 ? (
          <div
            className="app-card flex flex-col items-center gap-3 py-10"
            data-ocid="metas.empty_state"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "#F2F2F7" }}
            >
              <PiggyBank size={26} style={{ color: "#6B6B6B" }} />
            </div>
            <p
              className="text-sm font-body text-center"
              style={{ color: "#6B6B6B" }}
            >
              {t("goals.noGoals")}{" "}
              <button
                type="button"
                onClick={() => setShowAddSheet(true)}
                className="font-semibold underline underline-offset-2"
                style={{ color: "#C8FF00" }}
                data-ocid="metas.empty_add_button"
              >
                {t("goals.noGoalsAdd")}
              </button>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {metasList.map((meta, i) => (
              <GoalCard
                key={meta.id}
                meta={meta}
                index={i + 1}
                onUpdateEsteMes={handleUpdateEsteMes}
                isPending={updateMeta.isPending}
              />
            ))}
          </div>
        )}

        {/* ADD GOAL — dashed button */}
        <button
          type="button"
          onClick={() => setShowAddSheet(true)}
          data-ocid="metas.add_open_modal_button"
          className="mt-3 w-full h-14 rounded-[20px] flex items-center justify-center gap-2 text-sm font-display font-semibold transition-fast"
          style={{
            border: "2px dashed #C8FF00",
            color: "#6B6B6B",
            background: "transparent",
          }}
        >
          <Plus size={16} style={{ color: "#C8FF00" }} />
          {t("goals.addNewGoal")}
        </button>
      </div>

      {/* ─── TOTAL RESERVED FOOTER ─── */}
      {metasList.length > 0 && (
        <div
          className="flex items-center justify-between px-5 py-4 rounded-[20px]"
          style={{ background: "#0A0A0A" }}
          data-ocid="metas.total_row"
        >
          <span
            className="text-xs font-display font-semibold uppercase tracking-wider"
            style={{ color: "#6B6B6B" }}
          >
            {t("goals.totalReserved")}
          </span>
          <span
            className="text-base font-mono font-bold"
            style={{ color: "#C8FF00" }}
          >
            {fmt(totalEsteMes)}
          </span>
        </div>
      )}

      {/* ─── BOTTOM SHEET ─── */}
      {showAddSheet && (
        <AddMetaSheet
          onClose={() => setShowAddSheet(false)}
          onAdd={handleAddMeta}
        />
      )}
    </div>
  );
}
