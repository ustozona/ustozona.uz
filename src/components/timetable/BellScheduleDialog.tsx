"use client";

import { useState } from "react";
import type { BellConfig } from "@/lib/bell-schedule";
import { buildSlots, type ShiftConfig } from "@/lib/timetable";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { BellRing, SaveIcon, Sunrise, Sunset, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SHIFT_OPTIONS = [
  {
    id: "single",
    title: "1-smena",
    desc: "Barcha sinflar ertalab oʻqiydi.",
    icon: Sunrise,
    color: "text-blue-500",
    background: "bg-blue-500/10",
  },
  {
    id: "double",
    title: "2-smena",
    desc: "Ertalabki va tushdan keyingi guruh.",
    icon: Sunset,
    color: "text-orange-400",
    background: "bg-orange-400/10",
  },
] as const;

const minToHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const hhmmToMin = (s: string) => { const [h, m] = s.split(":").map(Number); return (h || 0) * 60 + (m || 0); };

/* ════════════════════════════════════════════════════════════════════
   QOʻNGʻIROQ JADVALI DIALOGI

   Header — ilova standarti (SectionIcon + CardTitle/Description + size-9
   yopish, border-b px-5 py-4), footer — border-t bg-muted/20 px-5 py-4.
   2 ustunli: chapda tahrirlanadigan maydonlar (scroll), oʻngda — jonli
   vizual kun jadvali (ShiftTimeline) — har oʻzgarishda darhol yangilanadi.
   ════════════════════════════════════════════════════════════════════ */

type TimelineRow =
  | { kind: "lesson"; index: number; startMin: number; endMin: number }
  | { kind: "break"; long: boolean; startMin: number; endMin: number };

function buildTimelineRows(cfg: ShiftConfig): TimelineRow[] {
  const slots = buildSlots(cfg);
  const rows: TimelineRow[] = [];
  slots.forEach((s, i) => {
    rows.push({ kind: "lesson", index: s.index, startMin: s.startMin, endMin: s.endMin });
    const next = slots[i + 1];
    if (next) {
      rows.push({ kind: "break", long: s.index === cfg.longBreakAfter, startMin: s.endMin, endMin: next.startMin });
    }
  });
  return rows;
}

export default function BellScheduleDialog({ config, onSave, onClose }: {
  config: BellConfig;
  onSave: (c: BellConfig) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<BellConfig>(() => structuredClone(config));

  const setShift = (key: "shift1" | "shift2", patch: Partial<ShiftConfig>) =>
    setDraft((d) => ({ ...d, [key]: { ...d[key], ...patch } }));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-6xl gap-0 overflow-hidden p-0 bg-card"
      >
        {/* Standart header — ikona + sarlavha + size-9 yopish tugmasi */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SectionIcon className="shrink-0">
              <BellRing />
            </SectionIcon>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <DialogTitle asChild>
                <CardTitle>Qoʻngʻiroq jadvali</CardTitle>
              </DialogTitle>
              <DialogDescription className="text-caption">
                Smena hamda dars va tanaffus vaqtlarini sozlang. Dars soatlari shu asosda hisoblanadi.
              </DialogDescription>
            </div>
          </div>
          <DialogClose className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <X className="size-4" />
            <span className="sr-only">Yopish</span>
          </DialogClose>
        </div>

        <div className="grid max-h-[70vh] grid-cols-1 md:grid-cols-[1fr_380px]">
          {/* Chap — tahrirlanadigan maydonlar */}
          <div className="flex flex-col gap-5 overflow-y-auto scrollbar-thin border-border p-5 md:border-r">
            <div className="space-y-2">
              <Label>Smena</Label>
              <RadioGroup
                value={draft.profile}
                onValueChange={(v) => setDraft((d) => ({ ...d, profile: v as "single" | "double" }))}
                className="grid grid-cols-2 gap-2"
              >
                {SHIFT_OPTIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Label
                      key={item.id}
                      htmlFor={`shift-${item.id}`}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 shadow-xs transition-all",
                        "hover:bg-accent",
                        "has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent"
                      )}
                    >
                      <div className={cn("shrink-0 rounded-lg p-1.5", item.background)}>
                        <Icon className={cn("size-4", item.color)} />
                      </div>
                      <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                        <div className="grid gap-1">
                          <p className="font-medium leading-none">{item.title}</p>
                          <p className="text-xs font-normal text-muted-foreground">{item.desc}</p>
                        </div>
                        <RadioGroupItem value={item.id} id={`shift-${item.id}`} className="mt-0.5 shrink-0" />
                      </div>
                    </Label>
                  );
                })}
              </RadioGroup>
            </div>

            <ShiftFields title="1-smena" cfg={draft.shift1} onChange={(p) => setShift("shift1", p)} />
            {draft.profile === "double" && (
              <ShiftFields title="2-smena" cfg={draft.shift2} onChange={(p) => setShift("shift2", p)} />
            )}
          </div>

          {/* Oʻng — jonli vizual kun jadvali */}
          <div className="flex flex-col gap-4 overflow-y-auto scrollbar-thin bg-muted/20 p-4">
            <ShiftTimeline title="1-smena" cfg={draft.shift1} />
            {draft.profile === "double" && <ShiftTimeline title="2-smena" cfg={draft.shift2} />}
          </div>
        </div>

        <DialogFooter className="border-t border-border bg-muted/20 px-5 py-4">
          <Button variant="outline" onClick={onClose}>Bekor qilish</Button>
          <Button onClick={() => onSave(draft)}><SaveIcon />Saqlash</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Oʻng panel — smena uchun vertikal vaqt jadvali (dars/tanaffus bloklari). */
function ShiftTimeline({ title, cfg }: { title: string; cfg: ShiftConfig }) {
  const rows = buildTimelineRows(cfg);
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="space-y-1">
        {rows.map((r, i) =>
          r.kind === "lesson" ? (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md border border-primary/25 bg-primary/8 px-2.5 py-1.5"
            >
              <span className="text-xs font-semibold tabular-nums text-foreground">{r.index}-soat</span>
              <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
                {minToHHMM(r.startMin)}–{minToHHMM(r.endMin)}
              </span>
            </div>
          ) : (
            <div
              key={i}
              className={cn(
                "flex items-center justify-center rounded-md text-[10px] text-muted-foreground",
                r.long ? "h-6 bg-amber-500/10 text-amber-700 dark:text-amber-500" : "h-3.5"
              )}
            >
              {r.long ? `Katta tanaffus · ${r.endMin - r.startMin} daq` : `${r.endMin - r.startMin} daq`}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function ShiftFields({ title, cfg, onChange }: {
  title: string;
  cfg: ShiftConfig;
  onChange: (patch: Partial<ShiftConfig>) => void;
}) {
  const bigBreakTotal = cfg.breakMin + cfg.longBreakExtraMin;
  const numField = (val: number, set: (n: number) => void, min = 0, max = 240) => (
    <Input
      type="number"
      min={min}
      max={max}
      value={val}
      onChange={(e) => set(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
      className="h-9"
    />
  );

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Boshlanish vaqti</Label>
          <Input type="time" value={minToHHMM(cfg.startMin)} onChange={(e) => onChange({ startMin: hhmmToMin(e.target.value) })} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Darslar soni</Label>
          {numField(cfg.lessonCount, (n) => onChange({ lessonCount: n }), 1, 12)}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Dars davomiyligi (daqiqa)</Label>
          {numField(cfg.lessonMin, (n) => onChange({ lessonMin: n }), 5, 120)}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Tanaffus davomiyligi (daq)</Label>
          {numField(cfg.breakMin, (n) => onChange({ breakMin: n }), 0, 60)}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Katta tanaffus (daq)</Label>
          {numField(bigBreakTotal, (n) => onChange({ longBreakExtraMin: Math.max(0, n - cfg.breakMin) }), 0, 60)}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Katta tanaffus qaysi darsdan keyin?</Label>
          {numField(cfg.longBreakAfter, (n) => onChange({ longBreakAfter: n }), 1, cfg.lessonCount)}
        </div>
      </div>
    </div>
  );
}
