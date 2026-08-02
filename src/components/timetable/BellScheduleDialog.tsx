"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { remapEventsForBellChange, type BellConfig } from "@/lib/bell-schedule";
import { buildSlots, defaultsForProfile, type ShiftConfig, type SchoolProfile, type TimetableEvent } from "@/lib/timetable";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { BellRing, Check, Info, RotateCcw, SaveIcon, Sunrise, Sunset, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PROFILE_OPTIONS = [
  { id: "single", icon: Sunrise },
  { id: "double", icon: Sunset },
] as const;

const minToHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
/** Kalit tartibiga bogʻliq boʻlmagan taqqoslash — server (JSONB) qaytargan
    obyektlarda kalitlar qayta tartiblangan boʻladi, JSON.stringify aldanadi. */
const shiftsEqual = (a: ShiftConfig, b: ShiftConfig) =>
  (Object.keys({ ...a, ...b }) as (keyof ShiftConfig)[]).every((k) => a[k] === b[k]);

/* ════════════════════════════════════════════════════════════════════
   QOʻNGʻIROQ JADVALI DIALOGI

   Header — ilova standarti (SectionIcon + CardTitle/Description + size-9
   yopish, border-b px-5 py-4), footer — border-t bg-muted/20 px-5 py-4.
   Bitta ustun, oldindan koʻrish paneli yoʻq.

   Boshlanish vaqti (8:00 / 13:00), darslar soni (6), dars davomiyligi
   (45 daq) va katta tanaffus oʻrni (3-darsdan keyin) BARCHA maktablarda
   bir xil — shu sabab endi tahrirlanmaydi (SINGLE/DOUBLE_SHIFT_DEFAULTS,
   timetable.ts). Faqat maktabga qarab oʻzgaradigan narsa — tanaffus va
   katta tanaffus davomiyligi (ShiftFields). Maktab rejimi almashtirilganda,
   foydalanuvchi qiymatlarga tegmagan boʻlsa, rejimga mos preset
   (defaultsForProfile) avtomatik qoʻllanadi — standart har ikkalasida ham
   5 daq tanaffus / 10 daq katta tanaffus. Saqlashda joylashtirilgan darslar
   yangi period vaqtlariga koʻchiriladi (remapEventsForBellChange) —
   jadval kataklardan "tushib ketmaydi". Rejim almashtirish AutoHeight
   ichida — Tabs qoʻshilib/olib tashlanganda modal balandligi silliq
   animatsiya bilan oʻzgaradi, "sakramaydi".
   ════════════════════════════════════════════════════════════════════ */

export default function BellScheduleDialog({ config, events, onSave, onClose }: {
  config: BellConfig;
  /** Joriy qoralamadagi darslar — nechtasi yangi vaqtga koʻchishini oldindan koʻrsatish uchun */
  events: TimetableEvent[];
  onSave: (c: BellConfig) => void;
  onClose: () => void;
}) {
  const t = useTranslations("BellScheduleDialog");
  const [draft, setDraft] = useState<BellConfig>(() => structuredClone(config));
  const [activeShift, setActiveShift] = useState<"shift1" | "shift2">("shift1");

  const setShift = (key: "shift1" | "shift2", patch: Partial<ShiftConfig>) =>
    setDraft((d) => ({ ...d, [key]: { ...d[key], ...patch } }));

  /** Rejim almashganda: qiymatlar hali eski rejim presetida turgan boʻlsa —
      yangi rejim presetiga oʻtkazamiz; foydalanuvchi sozlagan boʻlsa tegmaymiz. */
  const changeProfile = (p: SchoolProfile) =>
    setDraft((d) => {
      if (p === d.profile) return d;
      const prev = defaultsForProfile(d.profile);
      const untouched = shiftsEqual(d.shift1, prev.shift1) && shiftsEqual(d.shift2, prev.shift2);
      if (!untouched) return { ...d, profile: p };
      const next = defaultsForProfile(p);
      return { profile: p, shift1: { ...next.shift1 }, shift2: { ...next.shift2 } };
    });

  /** Saqlashda vaqti oʻzgaradigan darslar soni — footerda oldindan koʻrsatiladi */
  const movedCount = useMemo(
    () => remapEventsForBellChange(events, config, draft).moved,
    [events, config, draft]
  );

  const defaults = defaultsForProfile(draft.profile);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md gap-0 overflow-hidden p-0 bg-card"
      >
        {/* Standart header — ikona + sarlavha + size-9 yopish tugmasi */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SectionIcon className="shrink-0">
              <BellRing />
            </SectionIcon>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <DialogTitle asChild>
                <CardTitle>{t("title")}</CardTitle>
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t("description")}
              </DialogDescription>
            </div>
          </div>
          <DialogClose className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <X className="size-4" />
            <span className="sr-only">{t("close")}</span>
          </DialogClose>
        </div>

        <div className="grid max-h-[70vh] grid-cols-1">
          <div className="flex flex-col gap-5 overflow-y-auto scrollbar-thin p-5">
            <BellWarnings cfg={draft} />
            <div className="space-y-2">
              <Label>{t("schoolProfile")}</Label>
              <RadioGroup
                value={draft.profile}
                onValueChange={(v) => changeProfile(v as SchoolProfile)}
                className="gap-2"
              >
                {PROFILE_OPTIONS.map((item) => {
                  const checked = draft.profile === item.id;
                  return (
                    <Label
                      key={item.id}
                      htmlFor={`profile-${item.id}`}
                      className={cn(
                        "group flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all active:scale-[0.99]",
                        // hover faqat tanlanmaganda: fon oq qoladi, faqat chegara qorayadi
                        "has-data-[state=unchecked]:hover:border-foreground/25 has-data-[state=unchecked]:hover:shadow-xs",
                        // sr-only radioning klaviatura fokusi karta ustida koʻrinadi
                        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50",
                        "has-data-[state=checked]:border-success has-data-[state=checked]:bg-success/5"
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                          checked ? "bg-success/15" : "bg-muted"
                        )}
                      >
                        <item.icon
                          className={cn("size-4 transition-colors", checked ? "text-success" : "text-muted-foreground")}
                        />
                      </div>
                      <p className="w-full self-center font-medium leading-none">{t(`profile.${item.id}.title`)}</p>
                      <RadioGroupItem value={item.id} id={`profile-${item.id}`} className="sr-only" />
                      <span
                        className={cn(
                          "flex size-5 shrink-0 self-center items-center justify-center rounded-full border transition-colors",
                          checked
                            ? "border-transparent bg-success text-success-foreground"
                            : "border-input group-hover:border-muted-foreground/50"
                        )}
                      >
                        {checked && <Check className="size-3" strokeWidth={3} />}
                      </span>
                    </Label>
                  );
                })}
              </RadioGroup>
            </div>

            <Separator />

            <AutoHeight>
              {draft.profile === "single" ? (
                <ShiftFields
                  cfg={draft.shift1}
                  onChange={(p) => setShift("shift1", p)}
                  onReset={() => setShift("shift1", { ...defaults.shift1 })}
                />
              ) : (
                (() => {
                  const shiftSwitcher = (
                    <ToggleGroup
                      type="single"
                      value={activeShift}
                      onValueChange={(v) => v && setActiveShift(v as "shift1" | "shift2")}
                      variant="outline"
                      className="grid w-full grid-cols-2"
                    >
                      <ToggleGroupItem value="shift1">{t("shift1")}</ToggleGroupItem>
                      <ToggleGroupItem value="shift2">{t("shift2")}</ToggleGroupItem>
                    </ToggleGroup>
                  );
                  return activeShift === "shift1" ? (
                    <ShiftFields
                      cfg={draft.shift1}
                      onChange={(p) => setShift("shift1", p)}
                      onReset={() => setShift("shift1", { ...defaults.shift1 })}
                      header={shiftSwitcher}
                    />
                  ) : (
                    <ShiftFields
                      cfg={draft.shift2}
                      onChange={(p) => setShift("shift2", p)}
                      onReset={() => setShift("shift2", { ...defaults.shift2 })}
                      header={shiftSwitcher}
                    />
                  );
                })()
              )}
            </AutoHeight>
          </div>
        </div>

        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4 sm:items-center">
          {movedCount > 0 && (
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground sm:mr-auto">
              <Info className="size-3.5 shrink-0" />
              {t("movedCountHint", { count: movedCount })}
            </span>
          )}
          <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
          <Button onClick={() => onSave(draft)}><SaveIcon />{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Balandligi silliq oʻzgaradigan konteyner — rejim almashganda modal "sakramaydi" ─── */
function AutoHeight({ children }: { children: React.ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  // Balandlik oʻzgarishi paytida qisqa vaqt "overflow-hidden" — sakrashning
  // oldini olish uchun. Tinch holatda "visible"ga qaytadi, aks holda input
  // fokus halqasi (box-shadow 3px) ResizeObserver oʻlchagan aniq chegarada kesilib qolardi.
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    let prev: number | undefined;
    const ro = new ResizeObserver(([entry]) => {
      const next = entry.contentRect.height;
      if (prev !== undefined && prev !== next) setAnimating(true);
      prev = next;
      setHeight(next);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      style={height !== undefined ? { height } : undefined}
      onTransitionEnd={() => setAnimating(false)}
      className={cn("transition-[height] duration-fast ease-standard", animating && "overflow-hidden")}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}

/* ─── Ogohlantirishlar — smena kesishuvi va yarim tundan oshish ─── */
function BellWarnings({ cfg }: { cfg: BellConfig }) {
  const t = useTranslations("BellScheduleDialog");
  const end1 = buildSlots(cfg.shift1).at(-1)?.endMin ?? 0;
  const end2 = cfg.profile === "double" ? buildSlots(cfg.shift2).at(-1)?.endMin ?? 0 : 0;
  const overlap = cfg.profile === "double" && cfg.shift2.startMin < end1;
  const pastMidnight = Math.max(end1, end2) > 24 * 60;
  if (!overlap && !pastMidnight) return null;
  return (
    <div className="space-y-2">
      {overlap && (
        <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400">
          <TriangleAlert />
          <AlertDescription className="text-amber-700/90 dark:text-amber-400/90">
            {t("overlapWarning", { end1: minToHHMM(end1), start2: minToHHMM(cfg.shift2.startMin) })}
          </AlertDescription>
        </Alert>
      )}
      {pastMidnight && (
        <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400">
          <TriangleAlert />
          <AlertDescription className="text-amber-700/90 dark:text-amber-400/90">
            {t("pastMidnightWarning")}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/* ─── Smena maydonlari ─── */

function ShiftFields({ cfg, onChange, onReset, header }: {
  cfg: ShiftConfig;
  onChange: (patch: Partial<ShiftConfig>) => void;
  onReset: () => void;
  /** Smena tanlovchi (2-smenali profilda) — shu kartaga tegishli boʻlgani uchun ichida koʻrsatiladi */
  header?: ReactNode;
}) {
  const t = useTranslations("BellScheduleDialog");
  const bigBreakTotal = cfg.breakMin + cfg.longBreakExtraMin;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{t("breaks")}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
          {t("default")}
        </Button>
      </div>
      {header}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{t("break")}</Label>
          <NumField
            value={cfg.breakMin}
            min={0}
            max={60}
            suffix={t("minutesSuffix")}
            onCommit={(n) => onChange({ breakMin: n })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("longBreak")}</Label>
          <NumField
            value={bigBreakTotal}
            min={cfg.breakMin}
            max={90}
            suffix={t("minutesSuffix")}
            onCommit={(n) => onChange({ longBreakExtraMin: Math.max(0, n - cfg.breakMin) })}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Raqam maydoni — yozayotganda erkin, blur'da chegaraga keltiriladi ─── */
function NumField({ value, min, max, suffix, onCommit }: {
  value: number;
  min: number;
  max: number;
  suffix: string;
  onCommit: (n: number) => void;
}) {
  const [text, setText] = useState(String(value));
  // Tashqi oʻzgarish (Standart tugmasi, tanaffus oʻzgarsa katta tanaffus) — matnni sinxronlash
  useEffect(() => { setText(String(value)); }, [value]);

  return (
    <div className="relative">
      <Input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value !== "" && Number.isFinite(n) && n >= min && n <= max) onCommit(n);
        }}
        onBlur={() => {
          const n = Number(text);
          const clamped = Math.min(max, Math.max(min, Number.isFinite(n) && text !== "" ? n : min));
          setText(String(clamped));
          if (clamped !== value) onCommit(clamped);
        }}
        className="h-9 pr-10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        {suffix}
      </span>
    </div>
  );
}
