"use client";

import { useState } from "react";
import type { BellConfig } from "@/lib/bell-schedule";
import { computePeriods } from "@/lib/bell-schedule";
import type { ShiftConfig } from "@/lib/timetable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SaveIcon } from "lucide-react";

const minToHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const hhmmToMin = (s: string) => { const [h, m] = s.split(":").map(Number); return (h || 0) * 60 + (m || 0); };

export default function BellScheduleDialog({ config, onSave, onClose }: {
  config: BellConfig;
  onSave: (c: BellConfig) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<BellConfig>(() => structuredClone(config));

  const setShift = (key: "shift1" | "shift2", patch: Partial<ShiftConfig>) =>
    setDraft((d) => ({ ...d, [key]: { ...d[key], ...patch } }));

  const previewS1 = computePeriods({ ...draft, profile: "single" });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Qoʻngʻiroq jadvali</DialogTitle>
          <DialogDescription>Smena va dars/tanaffus vaqtlarini sozlang. Dars soatlari shu yerdan hisoblanadi.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Smena */}
          <div className="space-y-2">
            <Label>Smena</Label>
            <ToggleGroup
              type="single"
              value={draft.profile}
              onValueChange={(v) => v && setDraft((d) => ({ ...d, profile: v as "single" | "double" }))}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="single" className="px-4 text-xs">1 smena</ToggleGroupItem>
              <ToggleGroupItem value="double" className="px-4 text-xs">2 smena</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <ShiftFields title="1-smena" cfg={draft.shift1} onChange={(p) => setShift("shift1", p)} />
          {draft.profile === "double" && (
            <ShiftFields title="2-smena" cfg={draft.shift2} onChange={(p) => setShift("shift2", p)} />
          )}

          {/* Koʻrib chiqish */}
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">1-smena darslari (koʻrib chiqish):</p>
            <div className="flex flex-wrap gap-1.5">
              {previewS1.map((p) => (
                <span key={p.index} className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] tabular-nums text-foreground">
                  {p.index}-soat · {minToHHMM(p.startMin)}–{minToHHMM(p.endMin)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Bekor qilish</Button>
          <Button onClick={() => onSave(draft)}><SaveIcon />Saqlash</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Boshlanish vaqti</Label>
          <Input type="time" value={minToHHMM(cfg.startMin)} onChange={(e) => onChange({ startMin: hhmmToMin(e.target.value) })} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Darslar soni</Label>
          {numField(cfg.lessonCount, (n) => onChange({ lessonCount: n }), 1, 12)}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Dars uzunligi (daq)</Label>
          {numField(cfg.lessonMin, (n) => onChange({ lessonMin: n }), 5, 120)}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Oddiy tanaffus (daq)</Label>
          {numField(cfg.breakMin, (n) => onChange({ breakMin: n }), 0, 60)}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Katta tanaffus (daq)</Label>
          {numField(bigBreakTotal, (n) => onChange({ longBreakExtraMin: Math.max(0, n - cfg.breakMin) }), 0, 60)}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Katta tanaffus nechanchi darsdan keyin</Label>
          {numField(cfg.longBreakAfter, (n) => onChange({ longBreakAfter: n }), 1, cfg.lessonCount)}
        </div>
      </div>
    </div>
  );
}
