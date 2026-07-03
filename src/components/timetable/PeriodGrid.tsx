"use client";

import { Fragment, useState } from "react";
import { classTints, autoClassColor, CLASS_CARD_INTERACTION } from "@/lib/class-colors";
import { cn } from "@/lib/utils";
import type { TimetableEvent } from "@/lib/timetable";
import type { PeriodRow } from "@/lib/bell-schedule";
import type { SchoolClass } from "@/lib/classes-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { XIcon, Plus, Check } from "lucide-react";

const DAY_UZ = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const minToHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export type PeriodGridProps = {
  periods: PeriodRow[];
  events: TimetableEvent[];
  classes: SchoolClass[];
  getClass: (id: number) => SchoolClass;
  profile: "single" | "double";
  /** Arxiv rejimi — qoʻyish/oʻchirish/tahrirlash oʻchadi, faqat koʻrish */
  readOnly?: boolean;
  /** Period katagiga sinf qoʻyish (mavjudini almashtiradi) */
  onPlace: (day: number, startMin: number, endMin: number, classId: number) => void;
  /** Erkin-vaqtli toʻgarak qoʻshish */
  onAddClub: (day: number, classId: number, startMin: number, endMin: number) => void;
  onRemove: (eventId: string) => void;
  onEditEvent: (ev: TimetableEvent) => void;
};

export default function PeriodGrid({ periods, events, classes, getClass, profile, readOnly = false, onPlace, onAddClub, onRemove, onEditEvent }: PeriodGridProps) {
  const isPeriodTime = (s: number) => periods.some((p) => p.startMin === s);
  const lastPeriodEnd = periods.length ? Math.max(...periods.map((p) => p.endMin)) : 15 * 60;

  return (
    <div className="mx-6 my-2 min-h-0 flex-1 overflow-auto rounded-md border border-border [scrollbar-width:thin]">
      <div className="grid min-w-[680px]" style={{ gridTemplateColumns: "6.5rem repeat(6, minmax(0, 1fr))" }}>
        {/* Sarlavha */}
        <div className="sticky top-0 z-20 border-b border-r border-border bg-muted py-2.5 text-center text-[13px] font-semibold text-foreground/70">Soat</div>
        {DAY_UZ.map((d, i) => (
          <div key={d} className={cn("sticky top-0 z-20 truncate border-b border-border bg-muted py-2.5 text-center text-sm font-medium text-foreground/80", i > 0 && "border-l")}>{d}</div>
        ))}

        {/* Period qatorlari */}
        {periods.map((p, ri) => {
          const showShiftSep = profile === "double" && p.shift === 2 && (ri === 0 || periods[ri - 1].shift !== 2);
          return (
            <Fragment key={`${p.shift}-${p.index}`}>
              {showShiftSep && (
                <div className="col-span-full border-b border-border bg-muted/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  2-smena
                </div>
              )}
              <div className="flex flex-col items-center justify-center border-b border-r border-border bg-card/60 px-2 py-2 text-center">
                <span className="text-xs font-semibold text-foreground">{p.label}</span>
                <span className="text-[10px] tabular-nums text-muted-foreground">{minToHHMM(p.startMin)} — {minToHHMM(p.endMin)}</span>
              </div>
              {DAY_UZ.map((_, ci) => {
                const day = ci + 1;
                const ev = events.find((e) => e.day === day && e.startMin === p.startMin);
                return (
                  <PeriodCell
                    key={day}
                    event={ev}
                    day={day}
                    period={p}
                    classes={classes}
                    getClass={getClass}
                    readOnly={readOnly}
                    onPlace={onPlace}
                    onRemove={onRemove}
                    onEdit={onEditEvent}
                    borderLeft={ci > 0}
                  />
                );
              })}
            </Fragment>
          );
        })}

        {/* Qoʻshimcha darslar (erkin vaqtli) zonasi */}
        <div className="flex items-center justify-center border-r border-border bg-card/60 px-2 py-2 text-center">
          <span className="text-xs font-semibold leading-tight text-foreground">Qoʻshimcha darslar</span>
        </div>
        {DAY_UZ.map((_, ci) => {
          const day = ci + 1;
          const clubs = events.filter((e) => e.day === day && !isPeriodTime(e.startMin)).sort((a, b) => a.startMin - b.startMin);
          // Yangi qoʻshimcha dars vaqti: oxirgisidan (yoki oxirgi darsdan) keyin, 45 daq
          const base = clubs.length ? clubs[clubs.length - 1].endMin + 5 : lastPeriodEnd + 15;
          return (
            <div
              key={day}
              className={cn("flex min-h-[56px] flex-col gap-1 border-border p-1", ci > 0 && "border-l")}
              onDragOver={(e) => { if (!readOnly && Array.from(e.dataTransfer.types).includes("text/class-id")) e.preventDefault(); }}
              onDrop={(e) => { if (readOnly) return; e.preventDefault(); const cid = Number(e.dataTransfer.getData("text/class-id")); if (cid) onAddClub(day, cid, base, base + 45); }}
            >
              {clubs.map((ev) => {
                const cls = getClass(ev.classId);
                const tints = classTints(cls.color ?? autoClassColor(cls.id));
                return (
                  <div
                    key={ev.id}
                    onClick={() => { if (!readOnly) onEditEvent(ev); }}
                    className={cn("group/club relative overflow-hidden rounded-md border pl-2 pr-1 py-1", readOnly ? "cursor-default" : "cursor-pointer", CLASS_CARD_INTERACTION)}
                    style={{ ...tints.surfaceStrong, ...tints.borderMedium }}
                  >
                    <span className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: tints.solid }} aria-hidden />
                    <span className="block truncate text-[11px] font-semibold leading-tight text-foreground">{cls.name}</span>
                    <span style={tints.textStrong} className="block truncate text-[10px] tabular-nums leading-tight opacity-80">{minToHHMM(ev.startMin)} — {minToHHMM(ev.endMin)}</span>
                    {!readOnly && (
                      <button
                        type="button"
                        aria-label="Oʻchirish"
                        onClick={(e) => { e.stopPropagation(); onRemove(ev.id); }}
                        className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-sm opacity-0 transition-opacity hover:bg-foreground/10 group-hover/club:opacity-100"
                      >
                        <XIcon className="size-3" />
                      </button>
                    )}
                  </div>
                );
              })}
              {!readOnly && <ClubAddButton classes={classes} onAdd={(cid) => onAddClub(day, cid, base, base + 45)} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Qoʻshimcha dars qoʻshish — oddiy katakdek "+" (tayyor sinf roʻyxati) ─── */
function ClubAddButton({ classes, onAdd }: { classes: SchoolClass[]; onAdd: (classId: number) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="group/cell flex min-h-[44px] flex-1 items-center justify-center rounded-md transition-colors hover:bg-muted/60">
          <Plus className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover/cell:opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <ClassPicker classes={classes} onSelect={(cid) => { onAdd(cid); setOpen(false); }} />
      </PopoverContent>
    </Popover>
  );
}

/* ─── Period katagi ─── */
function PeriodCell({ event, day, period, classes, getClass, readOnly = false, onPlace, onRemove, onEdit, borderLeft }: {
  event?: TimetableEvent;
  day: number;
  period: PeriodRow;
  classes: SchoolClass[];
  getClass: (id: number) => SchoolClass;
  readOnly?: boolean;
  onPlace: (day: number, startMin: number, endMin: number, classId: number) => void;
  onRemove: (id: string) => void;
  onEdit: (ev: TimetableEvent) => void;
  borderLeft: boolean;
}) {
  const [open, setOpen] = useState(false);
  const allowDrop = (e: React.DragEvent) => { if (!readOnly && Array.from(e.dataTransfer.types).includes("text/class-id")) e.preventDefault(); };
  const handleDrop = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    const cid = Number(e.dataTransfer.getData("text/class-id"));
    if (cid) onPlace(day, period.startMin, period.endMin, cid);
  };
  const wrap = cn("relative min-h-[56px] border-b border-border p-1", borderLeft && "border-l");

  if (event) {
    const cls = getClass(event.classId);
    const tints = classTints(cls.color ?? autoClassColor(cls.id));
    const cellCard = (
      <div role={readOnly ? undefined : "button"} tabIndex={readOnly ? undefined : 0} className={cn("group/cell relative h-full w-full overflow-hidden rounded-md border pl-2 pr-1 py-1", readOnly ? "cursor-default" : "cursor-pointer", CLASS_CARD_INTERACTION)} style={{ ...tints.surfaceStrong, ...tints.borderMedium }}>
        <span className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: tints.solid }} aria-hidden />
        <span className="block truncate text-xs font-semibold leading-tight text-foreground">{cls.name}</span>
        {cls.subject && <span style={tints.textStrong} className="block truncate text-[10px] leading-tight opacity-80">{cls.subject}</span>}
        {!readOnly && (
          <button
            type="button"
            aria-label="Oʻchirish"
            onClick={(e) => { e.stopPropagation(); onRemove(event.id); }}
            className="absolute top-0.5 right-0.5 z-10 flex size-4 items-center justify-center rounded-sm opacity-0 transition-opacity hover:bg-foreground/10 group-hover/cell:opacity-100"
          >
            <XIcon className="size-3" />
          </button>
        )}
      </div>
    );

    if (readOnly) return <div className={wrap}>{cellCard}</div>;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <div className={wrap} onDragOver={allowDrop} onDrop={handleDrop}>
          <PopoverTrigger asChild>{cellCard}</PopoverTrigger>
        </div>
        <PopoverContent className="w-56 p-0" align="start">
          <ClassPicker classes={classes} selectedId={event.classId} onSelect={(cid) => { onPlace(day, period.startMin, period.endMin, cid); setOpen(false); }} />
        </PopoverContent>
      </Popover>
    );
  }

  if (readOnly) return <div className={wrap} />;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={wrap} onDragOver={allowDrop} onDrop={handleDrop}>
        <PopoverTrigger asChild>
          <button type="button" className="group/cell flex h-full min-h-[48px] w-full items-center justify-center rounded-md transition-colors hover:bg-muted/60">
            <Plus className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover/cell:opacity-60" />
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-56 p-0" align="start">
        <ClassPicker classes={classes} onSelect={(cid) => { onPlace(day, period.startMin, period.endMin, cid); setOpen(false); }} />
      </PopoverContent>
    </Popover>
  );
}

/* ─── Sinf tanlash (qidiruvli) ─── */
function ClassPicker({ classes, selectedId, onSelect }: {
  classes: SchoolClass[];
  selectedId?: number;
  onSelect: (classId: number) => void;
}) {
  return (
    <Command>
      <CommandInput placeholder="Sinf qidirish..." className="h-9" />
      <CommandList>
        <CommandEmpty>Topilmadi</CommandEmpty>
        <CommandGroup>
          {classes.map((c) => {
            const tints = classTints(c.color ?? autoClassColor(c.id));
            return (
              <CommandItem key={c.id} value={`${c.name} ${c.subject ?? ""}`} onSelect={() => onSelect(c.id)} className="gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: tints.solid }} />
                <span className="font-medium">{c.name}</span>
                {c.subject && <span className="truncate text-xs text-muted-foreground">{c.subject}</span>}
                {selectedId === c.id && <Check className="ml-auto size-4" />}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
