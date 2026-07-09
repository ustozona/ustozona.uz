"use client";

import * as React from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SettingsGroup, SettingsList, SaveSignalPing } from "./SettingsShared";

const IMPACT_OPTIONS: ScoreImpact[] = ["full", "half", "none", "excluded"];

/** Variant rangi — foizga qoʻshadi (+/◐), kamaytiradi (−) yoki taʼsir qilmaydi (○). */
const IMPACT_SIGN_CLS: Record<ScoreImpact, string> = {
  full: "text-success",
  half: "text-warning",
  none: "text-destructive",
  excluded: "text-muted-foreground",
};

/**
 * Belgi ikonkasi — matn glyphlari (◐, ○) oʻrniga inline SVG: har platformada
 * bir xil render, optik ogʻirlik +/− bilan mos, rang currentColor (token).
 */
function SignIcon({ impact, className }: { impact: ScoreImpact; className?: string }) {
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

/** Vazn legendasi — har variant foizga qanday taʼsir qilishini tushuntiradi. */
const IMPACT_LEGEND: { impact: ScoreImpact; text: string }[] = [
  { impact: "full", text: "Davomat foiziga toʻliq qoʻshiladi" },
  { impact: "half", text: "Yarim dars sifatida qoʻshiladi" },
  { impact: "none", text: "Davomat foizini kamaytiradi" },
  { impact: "excluded", text: "Umumiy foizga taʼsir qilmaydi (hisobdan chiqariladi)" },
];

/** Belgilashsiz jadval qolib ketmasligi uchun oʻchirib boʻlmaydigan yadro. */
const CORE_KEYS = new Set(["present", "absent"]);

/** Jonli misol — 20 darslik namuna; vazn oʻzgarsa foiz darhol qayta hisoblanadi. */
const SAMPLE: { key: string; label: string; count: number }[] = [
  { key: "present", label: "Keldi", count: 16 },
  { key: "late", label: "Kechikdi", count: 2 },
  { key: "excused", label: "Sababli", count: 1 },
  { key: "absent", label: "Kelmadi", count: 1 },
];

function sampleRate(statuses: AttendanceStatusDef[]): { pct: number; parts: string[] } | null {
  let sum = 0;
  let counted = 0;
  const parts: string[] = [];
  for (const s of SAMPLE) {
    const def = statuses.find((d) => d.key === s.key);
    if (!def || !def.active) continue;
    const w = IMPACT_WEIGHT[def.scoreImpact];
    if (w == null) {
      parts.push(`${s.count} ta «${s.label}» (hisobdan chiqarilgan)`);
      continue;
    }
    counted += s.count;
    sum += s.count * w;
    parts.push(`${s.count} ta «${s.label}» (×${w})`);
  }
  if (counted === 0) return null;
  return { pct: Math.round((sum / counted) * 100), parts };
}

export default function AttendanceSection() {
  const statuses = useAttendanceStore((s) => s.statuses);
  const setStatuses = useAttendanceStore((s) => s.setStatuses);
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
    setStatuses(statuses.map((s) => (s.key === key ? { ...s, ...next } : s)));

  const toggle = (st: AttendanceStatusDef, on: boolean) => {
    if (!on && (usageByKey[st.key] ?? 0) > 0) {
      setConfirmKey(st.key);
      return;
    }
    patch(st.key, { active: on });
  };

  const confirmStatus = statuses.find((s) => s.key === confirmKey);
  const example = sampleRate(statuses);

  return (
    <>
      <SettingsGroup
        title="Davomat statuslari"
        description="Sinflaringizda davomatni qayd etish usullarini boshqaring: statuslarni faollashtiring yoki oʻchiring hamda vaznini (koeffitsiyentini) belgilang. Oʻzgarishlar barcha davomat hisobotlarida aks etadi."
        action={<SaveSignalPing signal={statuses} />}
      >
        <SettingsList
          items={statuses.map((st) => {
            const v = statusVisual(st);
            const core = st.builtIn && CORE_KEYS.has(st.key);
            const used = usageByKey[st.key] ?? 0;
            return {
              key: st.key,
              title: st.label,
              dimmed: !st.active,
              description: !st.active
                ? "Oʻchirilgan — jadvalda koʻrsatilmaydi"
                : used > 0
                  ? `${used} ta yozuvda ishlatilgan`
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
                            aria-label={`${st.label} — asosiy status, oʻchirib boʻlmaydi`}
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Asosiy status — oʻchirib boʻlmaydi</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Switch
                      checked={st.active}
                      onCheckedChange={(on) => toggle(st, on)}
                      aria-label={`${st.label} statusini yoqish`}
                    />
                  )}
                </>
              ),
            };
          })}
          footer={
            <>
              <span className="text-caption">
                {statuses.filter((s) => s.active).length} ta faol status
              </span>
              <span className="flex items-center gap-1.5">
                {statuses
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
      </SettingsGroup>

      <SettingsGroup
        title="Davomat foizi"
        description="Har bir status oʻquvchining umumiy davomat foiziga turlicha taʼsir qiladi."
      >
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-32 px-4">Taʼsir</TableHead>
                <TableHead className="w-16 text-center">Vazn</TableHead>
                <TableHead className="px-4">Izoh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {IMPACT_LEGEND.map((l) => {
                const w = IMPACT_WEIGHT[l.impact];
                return (
                  <TableRow key={l.impact} className="bg-card hover:bg-card">
                    <TableCell className="px-4 py-2.5">
                      <span className="flex items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                          <SignIcon
                            impact={l.impact}
                            className={cn("size-3.5", IMPACT_SIGN_CLS[l.impact])}
                          />
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {IMPACT_LABELS[l.impact]}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-2.5 text-center text-sm font-semibold tabular-nums text-foreground">
                      {w == null ? "—" : `×${w}`}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-caption">{l.text}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Jonli misol — vazn oʻzgarsa formula va foiz darhol qayta hisoblanadi */}
        {example && (
          <div className="space-y-1 text-caption leading-relaxed">
            <p>
              <span className="font-medium text-foreground">
                Hisoblash formulasiga misol (jami 20 ta dars):
              </span>{" "}
              {example.parts.join(" + ")} ={" "}
              <span className="font-semibold text-foreground tabular-nums">{example.pct}%</span>
            </p>
            <p>
              Eslatma: belgilanmagan (boʻsh qoldirilgan) kunlar umumiy hisobga taʼsir qilmaydi.
            </p>
          </div>
        )}
      </SettingsGroup>

      <AlertDialog open={confirmKey != null} onOpenChange={(o) => !o && setConfirmKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              «{confirmStatus?.label}» statusini oʻchirasizmi?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu status {usageByKey[confirmKey ?? ""] ?? 0} ta davomat yozuvida ishlatilgan.
              Yozuvlar oʻchmaydi, lekin jadvalda koʻrsatilmaydi va davomat foizi hisobidan
              chiqadi. Statusni qayta yoqsangiz, hammasi tiklanadi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmKey) patch(confirmKey, { active: false });
                setConfirmKey(null);
              }}
            >
              Oʻchirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
