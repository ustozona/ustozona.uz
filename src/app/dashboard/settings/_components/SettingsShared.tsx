"use client";

import * as React from "react";
import { create } from "zustand";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

/* Sozlamalar sahifasi uchun umumiy qurilish bloklari — GradesSettingsModal
   patterniga mos (modal-uslub karta + toggle/qator). Barcha rang/tipografiya
   tokenlardan; hech qanday hardcoded hex. */

/**
 * Modal-uslub sozlamalar kartasi (Stripe/Vercel patterni): header'da
 * sentence-case sarlavha + muted tavsif, body, ixtiyoriy footer (odatda
 * SaveFooter). Eski SettingsGroup (uppercase label) oʻrnini bosadi.
 */
export function SettingsCard({
  title,
  description,
  action,
  children,
  footer,
  destructive,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  /** Sarlavha oʻngida ixtiyoriy slot — masalan badge yoki indikator. */
  action?: React.ReactNode;
  children: React.ReactNode;
  /** Pastki panel — odatda SaveFooter. */
  footer?: React.ReactNode;
  /** Danger-zone kartasi — chegara destruktiv rangda. */
  destructive?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border bg-card",
        destructive ? "border-destructive/30" : "border-border",
        className
      )}
    >
      <div
        className={cn(
          "flex items-start justify-between gap-3 border-b px-5 py-3.5",
          destructive ? "border-destructive/30" : "border-border"
        )}
      >
        <div className="min-w-0 space-y-0.5">
          <h3 className="heading-small text-foreground">{title}</h3>
          {description && <p className="text-caption">{description}</p>}
        </div>
        {action && <div className="shrink-0 pt-0.5">{action}</div>}
      </div>
      <div className="space-y-4 p-5">{children}</div>
      {footer && (
        <div
          className={cn(
            "flex items-center justify-between gap-3 border-t bg-muted/20 px-5 py-3",
            destructive ? "border-destructive/30" : "border-border"
          )}
        >
          {footer}
        </div>
      )}
    </section>
  );
}

/* ── Draft (explicit save) infratuzilmasi ─────────────────────────── */

/** Kalit tartibidan mustaqil taqqoslash — JSONB key-order gotcha. */
export function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v) ?? "null";
}

/**
 * Explicit-save karta uchun draft holati. `committed` (store qiymati)
 * tashqaridan oʻzgarsa va draft toza boʻlsa draft ham yangilanadi
 * (masalan boshqa modal orqali saqlangan boʻlsa).
 */
export function useDraft<T>(committed: T, commit: (next: T) => void) {
  const [draft, setDraft] = React.useState<T>(committed);
  const committedKey = stableStringify(committed);
  const dirty = stableStringify(draft) !== committedKey;

  // Toza holatda tashqi oʻzgarishga ergashish (hidratsiya, boshqa host
  // saqlagani); dirty draft'da foydalanuvchi tahriri yutilmaydi.
  React.useEffect(() => {
    setDraft((prev) => (stableStringify(prev) === committedKey ? committed : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedKey]);

  const save = () => commit(draft);
  const reset = () => setDraft(committed);

  return { draft, setDraft, dirty, save, reset };
}

type DraftEntry = { dirty: boolean; valid: boolean; save: () => void; reset: () => void };

/**
 * Explicit-save kartalarning draft registri — sahifa headeridagi yagona
 * Saqlash/Bekor qilish paneli va boʻlim almashtirish guard'i shu yerdan
 * oʻqiydi. Har karta oʻz `save`/`reset`ini eʼlon qiladi; header ularni
 * yigʻib bitta amal sifatida chaqiradi.
 */
export const useDraftRegistry = create<{
  entries: Record<string, DraftEntry>;
  register: (key: string, entry: DraftEntry) => void;
  unregister: (key: string) => void;
}>((set) => ({
  entries: {},
  register: (key, entry) => set((s) => ({ entries: { ...s.entries, [key]: entry } })),
  unregister: (key) =>
    set((s) => {
      if (!(key in s.entries)) return s;
      const entries = { ...s.entries };
      delete entries[key];
      return { entries };
    }),
}));

/**
 * Kartaning draft holatini registrga eʼlon qiladi; unmount'da olib
 * tashlaydi. `save`/`reset` har render yangi funksiya boʻlishi mumkin —
 * ref orqali eng soʻnggisi chaqiriladi, effekt faqat `dirty` oʻzgarganda
 * qayta registratsiya qiladi.
 */
export function useRegisterDraft(
  key: string,
  dirty: boolean,
  save: () => void,
  reset: () => void,
  valid = true
) {
  const register = useDraftRegistry((s) => s.register);
  const unregister = useDraftRegistry((s) => s.unregister);
  const saveRef = React.useRef(save);
  const resetRef = React.useRef(reset);
  React.useEffect(() => {
    saveRef.current = save;
    resetRef.current = reset;
  }, [save, reset]);
  React.useEffect(() => {
    register(key, { dirty, valid, save: () => saveRef.current(), reset: () => resetRef.current() });
    return () => unregister(key);
  }, [key, dirty, valid, register, unregister]);
}

/**
 * Explicit-save footer tarkibi: chapda holat matni, oʻngda Bekor + Saqlash.
 * Saqlangach qisqa "Saqlandi" indikatori koʻrsatiladi.
 */
export function SaveFooter({
  dirty,
  disabled,
  onSave,
  onReset,
}: {
  dirty: boolean;
  /** Validatsiya oʻtmaganda saqlashni bloklash (dirty boʻlsa ham). */
  disabled?: boolean;
  onSave: () => void;
  onReset: () => void;
}) {
  // SavedIndicator ishlatilmaydi: u dirty paytida unmount boʻlib, saqlashdan
  // keyingi birinchi renderda "signal oʻzgarishi"ni koʻrmay qoladi.
  const [showSaved, setShowSaved] = React.useState(false);
  React.useEffect(() => {
    if (!showSaved) return;
    const t = setTimeout(() => setShowSaved(false), 1600);
    return () => clearTimeout(t);
  }, [showSaved]);

  return (
    <>
      <span className="min-w-0">
        {dirty ? (
          <span className="text-caption">Saqlanmagan oʻzgarishlar bor</span>
        ) : (
          <span
            aria-live="polite"
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium text-success transition-opacity duration-fast",
              showSaved ? "opacity-100" : "opacity-0"
            )}
          >
            <Check className="size-3.5" strokeWidth={2.5} />
            Saqlandi
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {dirty && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Bekor qilish
          </Button>
        )}
        <Button
          size="sm"
          disabled={!dirty || disabled}
          onClick={() => {
            onSave();
            setShowSaved(true);
          }}
        >
          Saqlash
        </Button>
      </span>
    </>
  );
}

/** Chapda label + tavsif, oʻngda ixtiyoriy control. */
export function SettingRow({
  title,
  description,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        {description && <span className="text-caption">{description}</span>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

/**
 * Global "saqlandi" pulsi — boʻlimlardagi har bir SavedIndicator yonganida
 * +1 boʻladi; sozlamalar sahifasi headeridagi umumiy indikator shunga ulanadi.
 */
export const useSaveSignal = create<{ n: number; ping: () => void }>((set) => ({
  n: 0,
  ping: () => set((s) => ({ n: s.n + 1 })),
}));

/**
 * Koʻrinmas pinger — `signal` oʻzgarganda (dastlabki mount tashqari) faqat
 * global pulsga uzatadi. Sozlamalar boʻlimlari lokal chip oʻrniga shuni
 * ishlatadi; koʻrsatish sahifa headeridagi yagona SavedIndicator'da.
 */
export function SaveSignalPing({ signal }: { signal: unknown }) {
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    useSaveSignal.getState().ping();
  }, [signal]);
  return null;
}

/**
 * Avtomatik saqlash indikatori. `signal` oʻzgarganda (dastlabki mount tashqari)
 * qisqa vaqt "Saqlandi" chipini koʻrsatadi. Har oʻzgarish darhol saqlanadigan
 * (store'ga yoziladigan) maydonlar uchun feedback beradi.
 * `bubble=false` — global pulsga uzatmaydi (headerdagi indikatorning oʻzi
 * pulsni tinglaydi, aks holda cheksiz halqa boʻlardi).
 */
export function SavedIndicator({ signal, bubble = true }: { signal: unknown; bubble?: boolean }) {
  const [visible, setVisible] = React.useState(false);
  const first = React.useRef(true);

  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setVisible(true);
    if (bubble) useSaveSignal.getState().ping();
    const t = setTimeout(() => setVisible(false), 1600);
    return () => clearTimeout(t);
  }, [signal]);

  return (
    <span
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-success transition-opacity duration-fast",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <Check className="size-3.5" strokeWidth={2.5} />
      Saqlandi
    </span>
  );
}

/**
 * Guruhlangan roʻyxat — bitta rounded konteyner, divider bilan ajratilgan
 * qatorlar (avval Attendance/Data har biri oʻzicha qayta yozgan pattern —
 * endi yagona manba). Har bir item ixtiyoriy leading (ikonka/dot) va
 * trailing (control) slotlariga ega.
 */
export function SettingsList({
  items,
  footer,
  className,
}: {
  /** Roʻyxat ostidagi xulosa qatori — modal-footer uslubida (border-t + muted fon). */
  footer?: React.ReactNode;
  items: {
    key: string;
    title: React.ReactNode;
    description?: React.ReactNode;
    leading?: React.ReactNode;
    trailing?: React.ReactNode;
    /** Oʻchirilgan/passiv qator — kontent xiralashadi (controllar emas). */
    dimmed?: boolean;
    /** Bola-qator (master toggle ostidagi) — chapdan indent. */
    indent?: boolean;
    /** Tavsif truncate qilinmaydi — toʻliq matn oʻqiladi. */
    multiline?: boolean;
  }[];
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border", className)}>
      {items.map((item, i) => (
        <div
          key={item.key}
          className={cn(
            "flex items-center gap-3 bg-card px-4 py-3",
            i !== 0 && "border-t border-border",
            item.indent && "pl-8"
          )}
        >
          {item.leading && (
            <span className={cn("flex shrink-0 items-center", item.dimmed && "opacity-50 grayscale")}>
              {item.leading}
            </span>
          )}
          <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", item.dimmed && "opacity-60")}>
            <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
            {item.description && (
              <span className={cn("text-caption", !item.multiline && "truncate")}>
                {item.description}
              </span>
            )}
          </div>
          {item.trailing && <div className="flex shrink-0 items-center gap-2">{item.trailing}</div>}
        </div>
      ))}
      {footer && (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-2.5">
          {footer}
        </div>
      )}
    </div>
  );
}

/** Toggle qatori — SettingRow ustida Switch. */
export function SwitchRow({
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      )}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        {description && <span className="text-caption">{description}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </label>
  );
}
