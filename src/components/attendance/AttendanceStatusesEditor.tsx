"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import {
  IMPACT_LABELS,
  IMPACT_WEIGHT,
  type ScoreImpact,
  type AttendanceStatusDef,
} from "@/lib/attendance-data";
import { statusVisual } from "@/components/attendance/status-visual";
import { SettingsList } from "@/app/dashboard/settings/_components/SettingsShared";

/* Davomat statuslari muharriri — controlled (value/onChange), draft'ni host
   boshqaradi (Sozlamalar > Davomat kartasi yoki davomat sahifasidagi modal).
   Store'dan faqat READ-ONLY foydalanish soni oʻqiladi (kontekst uchun). */

const IMPACT_OPTIONS: ScoreImpact[] = ["full", "half", "none", "excluded"];

/** Variant rangi — foizga qoʻshadi (+/◐), kamaytiradi (−) yoki taʼsir qilmaydi (○). */
export const IMPACT_SIGN_CLS: Record<ScoreImpact, string> = {
  full: "text-success",
  half: "text-warning",
  none: "text-destructive",
  excluded: "text-muted-foreground",
};

/**
 * Belgi ikonkasi — matn glyphlari (◐, ○) oʻrniga inline SVG: har platformada
 * bir xil render, optik ogʻirlik +/− bilan mos, rang currentColor (token).
 */
export function SignIcon({ impact, className }: { impact: ScoreImpact; className?: string }) {
  const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 12 12" aria-hidden className={cn("shrink-0", className)}>
      {impact === "full" && (
        <>
          <line x1="6" y1="1.5" x2="6" y2="10.5" {...stroke} />
          <line x1="1.5" y1="6" x2="10.5" y2="6" {...stroke} />
        </>
      )}
      {impact === "half" && (
        <>
          <circle cx="6" cy="6" r="4.5" {...stroke} />
          <path d="M6 1.5 A4.5 4.5 0 0 0 6 10.5 Z" fill="currentColor" />
        </>
      )}
      {impact === "none" && <line x1="1.5" y1="6" x2="10.5" y2="6" {...stroke} />}
      {impact === "excluded" && <circle cx="6" cy="6" r="4.5" {...stroke} />}
    </svg>
  );
}

/** Belgilashsiz jadval qolib ketmasligi uchun oʻchirib boʻlmaydigan yadro. */
const CORE_KEYS = new Set(["present", "absent"]);

/** Jonli misol — 20 darslik namuna; vazn oʻzgarsa foiz darhol qayta hisoblanadi. */
const SAMPLE: { key: string; count: number }[] = [
  { key: "present", count: 16 },
  { key: "late", count: 2 },
  { key: "excused", count: 1 },
  { key: "absent", count: 1 },
];

type Translator = (key: string, values?: Record<string, string | number>) => string;

export function sampleRate(
  statuses: AttendanceStatusDef[],
  t: Translator
): { pct: number; parts: string[] } | null {
  let sum = 0;
  let counted = 0;
  const parts: string[] = [];
  for (const s of SAMPLE) {
    const def = statuses.find((d) => d.key === s.key);
    if (!def || !def.active) continue;
    const label = t(`sampleStatusLabel.${s.key}`);
    const w = IMPACT_WEIGHT[def.scoreImpact];
    if (w == null) {
      parts.push(t("sampleExcluded", { count: s.count, label }));
      continue;
    }
    counted += s.count;
    sum += s.count * w;
    parts.push(t("sampleWeighted", { count: s.count, label, weight: w }));
  }
  if (counted === 0) return null;
  return { pct: Math.round((sum / counted) * 100), parts };
}

export default function AttendanceStatusesEditor({
  value,
  onChange,
}: {
  value: AttendanceStatusDef[];
  onChange: (next: AttendanceStatusDef[]) => void;
}) {
  const t = useTranslations("AttendanceStatusesEditor");
  const recordsByClass = useAttendanceStore((s) => s.recordsByClass);

  // Har holat nechta yozuvda ishlatilgan — oʻchirishdan oldin kontekst.
  const usageByKey = React.useMemo(() => {
    const out: Record<string, number> = {};
    for (const records of Object.values(recordsByClass)) {
      for (const r of records) out[r.status] = (out[r.status] ?? 0) + 1;
    }
    return out;
  }, [recordsByClass]);

  // Yozuvlari bor holatni oʻchirishdan oldin tasdiq soʻraladi.
  const [confirmKey, setConfirmKey] = React.useState<string | null>(null);

  const patch = (key: string, next: Partial<AttendanceStatusDef>) =>
    onChange(value.map((s) => (s.key === key ? { ...s, ...next } : s)));

  const toggle = (st: AttendanceStatusDef, on: boolean) => {
    if (!on && (usageByKey[st.key] ?? 0) > 0) {
      setConfirmKey(st.key);
      return;
    }
    patch(st.key, { active: on });
  };

  const confirmStatus = value.find((s) => s.key === confirmKey);
  const example = sampleRate(value, t);

  return (
    <>
      <SettingsList
        items={value.map((st) => {
          const v = statusVisual(st);
          const core = st.builtIn && CORE_KEYS.has(st.key);
          const used = usageByKey[st.key] ?? 0;
          return {
            key: st.key,
            title: st.label,
            dimmed: !st.active,
            description: !st.active
              ? t("disabledDescription")
              : used > 0
                ? t("usedDescription", { count: used })
                : undefined,
            leading: (
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-md",
                  v.cellClass
                )}
              >
                <v.Icon className="size-4" strokeWidth={2.5} />
              </span>
            ),
            trailing: (
              <>
                <Select
                  value={st.scoreImpact}
                  onValueChange={(val) => patch(st.key, { scoreImpact: val as ScoreImpact })}
                >
                  <SelectTrigger className="w-32" size="sm" disabled={!st.active}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPACT_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        <SignIcon
                          impact={o}
                          className={cn("mr-1 inline-block size-3", IMPACT_SIGN_CLS[o])}
                        />
                        {IMPACT_LABELS[o]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {core ? (
                  <Tooltip>
                    {/* disabled element hodisa bermaydi — trigger uchun span oʻraladi */}
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <Switch
                          checked={st.active}
                          disabled
                          aria-label={t("coreLockedAria", { label: st.label })}
                        />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{t("coreLockedTooltip")}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Switch
                    checked={st.active}
                    onCheckedChange={(on) => toggle(st, on)}
                    aria-label={t("toggleAria", { label: st.label })}
                  />
                )}
              </>
            ),
          };
        })}
        footer={
          <>
            <span className="text-caption">
              {t("activeCount", { count: value.filter((s) => s.active).length })}
            </span>
            <span className="flex items-center gap-1.5">
              {value
                .filter((s) => s.active)
                .map((s) => {
                  const v = statusVisual(s);
                  return (
                    <Tooltip key={s.key}>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(
                            "flex size-7 items-center justify-center rounded-md",
                            v.cellClass
                          )}
                        >
                          <v.Icon className="size-4" strokeWidth={2.5} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{s.label}</TooltipContent>
                    </Tooltip>
                  );
                })}
            </span>
          </>
        }
      />

      {/* Jonli misol — vazn oʻzgarsa formula va foiz darhol qayta hisoblanadi */}
      {example && (
        <p className="text-caption leading-relaxed">
          <span className="font-medium text-foreground">{t("sampleLabel")}</span>{" "}
          {example.parts.join(" + ")} ={" "}
          <span className="font-semibold text-foreground tabular-nums">{example.pct}%</span>
        </p>
      )}

      <AlertDialog open={confirmKey != null} onOpenChange={(o) => !o && setConfirmKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("confirmTitle", { label: confirmStatus?.label ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDescription", { count: usageByKey[confirmKey ?? ""] ?? 0 })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmKey) patch(confirmKey, { active: false });
                setConfirmKey(null);
              }}
            >
              {t("deleteAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
