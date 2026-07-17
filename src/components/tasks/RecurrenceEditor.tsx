"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronRight, Settings2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type Recurrence,
  type RecurrenceUnit,
  type RecurrenceBasis,
  WEEKDAY_ORDER,
  WEEKDAY_SHORT,
  parseRule,
  buildRule,
  recurrenceLabel,
} from "@/lib/recurrence";

/**
 * TickTick uslubidagi "Takrorlash" tahrirlagichi — toʻliq dizayn tizimimizda.
 * Tepada tezkor presetlar (Kunlik / Haftalik / Oylik / Yillik / Ish kunlari),
 * pastda "Moslashtirish" — Har N [birlik] + hafta kunlari tanlovi.
 *
 * `value` — rule string (yoki null), `refISO` — tayanch sana (preset yorliqlari
 * uchun: haftaning kuni, oy kuni, yil sanasi shu sanadan olinadi).
 */
export function RecurrenceEditor({
  value,
  onChange,
  refISO,
}: {
  value: string | null;
  onChange: (rule: string | null) => void;
  refISO: string | null;
}) {
  const t = useTranslations("RecurrenceEditor");
  const ref = refISO ? parseISO(refISO) : new Date();
  const current = parseRule(value);

  // Joriy qoida presetlardan biriga mos kelmasa "Moslashtirish" ochiq turadi.
  const presets = useMemo(() => buildPresets(ref, t), [refISO]);
  const matchedPreset = presets.find((p) => p.rule === value);
  const [customOpen, setCustomOpen] = useState(!!current && !matchedPreset);

  return (
    <div className="flex flex-col">
      {/* ── Yoʻq (takrorlanmaydi) ── */}
      <PresetRow
        label={t("doesNotRepeat")}
        active={!value}
        onClick={() => {
          onChange(null);
          setCustomOpen(false);
        }}
      />

      {/* ── Tezkor presetlar ── */}
      {presets.map((p) => (
        <PresetRow
          key={p.rule}
          label={p.label}
          hint={p.hint}
          active={value === p.rule}
          onClick={() => {
            onChange(p.rule);
            setCustomOpen(false);
          }}
        />
      ))}

      {/* ── Moslashtirish ── */}
      <button
        type="button"
        onClick={() => setCustomOpen((o) => !o)}
        className={cn(
          "mt-1 flex items-center gap-2.5 border-t px-1 py-2.5 text-sm transition-colors hover:bg-muted/40",
          customOpen && "text-primary"
        )}
      >
        <Settings2 className={cn("size-4", customOpen ? "text-primary" : "text-muted-foreground")} />
        <span className="font-medium">{t("customize")}</span>
        <ChevronRight className={cn("ml-auto size-4 text-muted-foreground/60 transition-transform duration-fast ease-standard", customOpen && "rotate-90")} />
      </button>

      {customOpen && (
        <CustomEditor
          value={current ?? { interval: 1, unit: "week", weekdays: [ref.getDay()], basis: "due" }}
          onChange={(rec) => onChange(buildRule(rec))}
        />
      )}
    </div>
  );
}

function PresetRow({
  label,
  hint,
  active,
  onClick,
}: {
  label: string;
  hint?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent"
    >
      <span className={cn("font-medium", active && "text-primary")}>{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      {active && <Check className="ml-auto size-4 text-primary" />}
    </button>
  );
}

function CustomEditor({
  value,
  onChange,
}: {
  value: Recurrence;
  onChange: (rec: Recurrence) => void;
}) {
  const t = useTranslations("RecurrenceEditor");
  const set = (patch: Partial<Recurrence>) => onChange({ ...value, ...patch });

  const UNIT_OPTIONS: { value: RecurrenceUnit; label: string }[] = [
    { value: "day", label: t("unitDay") },
    { value: "week", label: t("unitWeek") },
    { value: "month", label: t("unitMonth") },
    { value: "year", label: t("unitYear") },
  ];

  const BASIS_OPTIONS: { value: RecurrenceBasis; label: string }[] = [
    { value: "due", label: t("basisDue") },
    { value: "done", label: t("basisDone") },
  ];

  return (
    <div className="mt-1 flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
      {/* Tayanch sana */}
      <Select value={value.basis} onValueChange={(v) => set({ basis: v as RecurrenceBasis })}>
        <SelectTrigger className="h-9 w-full bg-background text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BASIS_OPTIONS.map((b) => (
            <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Har N [birlik] */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("every")}</span>
        <Input
          type="number"
          min={1}
          max={99}
          value={value.interval}
          onChange={(e) => set({ interval: Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1)) })}
          className="h-9 w-16 text-center text-sm"
        />
        <Select value={value.unit} onValueChange={(v) => set({ unit: v as RecurrenceUnit })}>
          <SelectTrigger className="h-9 flex-1 bg-background text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNIT_OPTIONS.map((u) => (
              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hafta kunlari (faqat birlik = Hafta) */}
      {value.unit === "week" && (
        <ToggleGroup
          type="multiple"
          spacing={1}
          value={value.weekdays.map(String)}
          onValueChange={(vals) => set({ weekdays: vals.map(Number) })}
          className="w-full justify-between"
        >
          {WEEKDAY_ORDER.map((d) => (
            <ToggleGroupItem
              key={d}
              value={String(d)}
              aria-label={WEEKDAY_SHORT[d]}
              className="size-7 rounded-full p-0 text-[11px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {WEEKDAY_SHORT[d][0]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}

      <p className="text-xs text-muted-foreground">
        {recurrenceLabel(buildRule(value)) ?? "—"}
      </p>
    </div>
  );
}

/** Tayanch sanaga bogʻlangan tezkor presetlar (TickTick kabi). */
function buildPresets(
  ref: Date,
  t: (key: string, values?: Record<string, string | number>) => string
): { rule: string; label: string; hint?: string }[] {
  const wd = ref.getDay();
  return [
    { rule: "every:due:1:day", label: t("presetDaily") },
    { rule: `every:due:1:week:days=${wd}`, label: t("presetWeekly"), hint: WEEKDAY_SHORT[wd] },
    { rule: "every:due:1:month", label: t("presetMonthly"), hint: t("dayOfMonthHint", { day: ref.getDate() }) },
    { rule: "every:due:1:year", label: t("presetYearly"), hint: format(ref, "d-MMM", { locale: uz }) },
    { rule: "every:due:1:week:days=1,2,3,4,5", label: t("presetWeekdays"), hint: t("weekdaysHint") },
  ];
}
