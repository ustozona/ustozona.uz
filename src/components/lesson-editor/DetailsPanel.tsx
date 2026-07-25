"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { SlidersHorizontal, ChevronDown, Ban, Layers, CalendarDays, ClipboardList, Plus, Check, X } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { classColor } from "@/lib/grades-data";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { CLASS_COLOR_HEX, classGradient } from "@/lib/class-colors";
import { lessonClassIds, type Lesson, type Unit } from "@/lib/lessons-data";
import { fmtClock, dateKeyToDate } from "@/lib/lesson-schedule";
import { MONTHS_UZ_SHORT, DAYS_UZ_SUN } from "@/lib/localization";
import ClassSchedulePicker from "./ClassSchedulePicker";
import { ClassSwatch } from "@/components/ClassSwatch";
import { EditorSidePanelHeader } from "./EditorSidePanel";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-label mb-2.5">{children}</h3>
);

const dot = (hex: string) => <ClassSwatch hex={hex} className="size-2.5" />;

export default function DetailsPanel({
  lesson, units, onClose,
  onSetClasses, onSetUnitForClass, onAddScheduleForClass, onRemoveScheduleForClass,
}: {
  lesson: Lesson;
  units: Unit[];
  onClose: () => void;
  onSetClasses: (classIds: string[]) => void;
  onSetUnitForClass: (classId: string, unitId: string | null) => void;
  onAddScheduleForClass: (classId: string, date: string, startMin: number, endMin: number) => void;
  onRemoveScheduleForClass: (classId: string, index: number) => void;
}) {
  const t = useTranslations("LessonDetailsPanel");
  const liveClasses = useLiveClasses();
  const selectedIds = lessonClassIds(lesson);
  const selectedClasses = liveClasses.filter((c) => selectedIds.includes(c.id));
  const [schedOpen, setSchedOpen] = useState(false);

  const toggleClass = (id: string) => {
    onSetClasses(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  const FieldButton = ({ children }: { children: React.ReactNode }) => (
    <span className="flex items-center justify-between gap-2 w-full rounded-lg border border-border bg-card px-3.5 py-3 text-sm hover:bg-accent/50 transition-colors text-left">
      {children}
    </span>
  );

  return (
    <div className="h-full flex flex-col">
      <EditorSidePanelHeader
        icon={<SlidersHorizontal className="size-[18px]" />}
        title={t("title")}
        onClose={onClose}
        closeLabel={t("close")}
      />

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-6 space-y-7">
        {/* CLASSES (koʻp tanlov) */}
        <div>
          <SectionLabel>{t("classes")}</SectionLabel>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="w-full">
                <FieldButton>
                  <span className="flex items-center gap-1.5 flex-wrap min-w-0">
                    {selectedClasses.length === 0 ? (
                      <span className="flex items-center gap-2.5 text-muted-foreground">
                        <Ban className="size-4 shrink-0" /> {t("noClassSelected")}
                      </span>
                    ) : selectedClasses.length > 4 ? (
                      /* Yigʻiq koʻrinish — ustma-ust ClassSwatch stack + soni */
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-2.5 min-w-0">
                            <span className="flex items-center -space-x-1.5 shrink-0">
                              {selectedClasses.slice(0, 4).map((c) => (
                                <ClassSwatch
                                  key={c.id}
                                  hex={CLASS_COLOR_HEX[classColor(c)]}
                                  className="size-5 ring-2 ring-card"
                                />
                              ))}
                            </span>
                            <span className="font-semibold text-foreground">{t("classCount", { count: selectedClasses.length })}</span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {selectedClasses.map((c) => c.name).join(", ")}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      selectedClasses.map((c) => {
                        const hex = CLASS_COLOR_HEX[classColor(c)];
                        return (
                          <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: `color-mix(in srgb, ${hex} 12%, transparent)`, color: `color-mix(in srgb, ${hex} 55%, var(--foreground))` }}>
                            {dot(hex)}{c.name}
                          </span>
                        );
                      })
                    )}
                  </span>
                  <ChevronDown className="size-4 opacity-50 shrink-0" />
                </FieldButton>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[280px] overflow-y-auto">
              {liveClasses.map((c) => {
                const hex = CLASS_COLOR_HEX[classColor(c)];
                const on = selectedIds.includes(c.id);
                return (
                  <DropdownMenuItem key={c.id} onSelect={(e) => { e.preventDefault(); toggleClass(c.id); }} className="gap-2.5">
                    <span className={`size-4 rounded border flex items-center justify-center shrink-0 ${on ? "border-transparent" : "border-border"}`}
                      style={on ? { backgroundColor: hex } : undefined}>
                      {on && <Check className="size-3 text-white" />}
                    </span>
                    {dot(hex)}
                    <span className="truncate">{c.name}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* UNITS (har sinf uchun alohida) */}
        {selectedClasses.length > 0 && (
          <div>
            <SectionLabel>{t("units")}</SectionLabel>
            <div className="space-y-2.5">
              {selectedClasses.map((c) => {
                const hex = CLASS_COLOR_HEX[classColor(c)];
                const unitsForClass = units.filter((u) => u.classId === c.id).sort((a, b) => a.number - b.number);
                const curUnitId = lesson.unitByClass?.[c.id] ?? (c.id === selectedIds[0] ? lesson.unitId ?? null : null);
                const unit = units.find((u) => u.id === curUnitId);
                return (
                  <DropdownMenu key={c.id}>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className="w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5 hover:bg-accent/40 transition-colors text-left">
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="size-9 rounded-xl flex items-center justify-center shrink-0 text-white" style={classGradient(hex)}>
                            <Layers className="size-4" />
                          </span>
                          <span className="flex flex-col min-w-0">
                            <span className="text-xs text-muted-foreground leading-tight">{c.name}</span>
                            <span className="text-sm font-semibold text-foreground truncate leading-tight">
                              {unit ? `${String(unit.number).padStart(2, "0")}. ${unit.title}` : t("noUnitSelected")}
                            </span>
                          </span>
                        </span>
                        <ChevronDown className="size-4 opacity-50 shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[260px] overflow-y-auto p-1.5">
                      <DropdownMenuItem onSelect={() => onSetUnitForClass(c.id, null)} className="gap-2.5 py-2 rounded-lg">
                        <span className="size-2.5 rounded-[4px] shrink-0 bg-muted-foreground/25" />
                        <span className="flex-1 truncate text-muted-foreground">{t("noUnit")}</span>
                        {!unit && <Check className="size-4 shrink-0" />}
                      </DropdownMenuItem>
                      {unitsForClass.length === 0 ? (
                        <div className="px-2 py-2 text-xs text-muted-foreground">{t("noUnitsInClass")}</div>
                      ) : unitsForClass.map((u) => {
                        const on = u.id === curUnitId;
                        return (
                          <DropdownMenuItem key={u.id} onSelect={() => onSetUnitForClass(c.id, u.id)} className="gap-2.5 py-2 rounded-lg">
                            {dot(hex)}
                            <span className="flex-1 truncate">{String(u.number).padStart(2, "0")}. {u.title}</span>
                            {on && <Check className="size-4 shrink-0" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}
            </div>
          </div>
        )}

        {/* SCHEDULE — bitta umumiy roʻyxat, barcha biriktirilgan sinflar bir sana-karta ostida yigʻiladi */}
        {selectedClasses.length > 0 && (() => {
          type Item = { classId: string; hex: string; date: string; startMin: number; endMin: number; idx: number };
          const allItems: Item[] = [];
          selectedClasses.forEach((c) => {
            const hex = CLASS_COLOR_HEX[classColor(c)];
            const sessions = lesson.scheduleByClass?.[c.id]
              ?? (c.id === selectedIds[0] && lesson.scheduledDate
                ? [{ date: lesson.scheduledDate, startMin: lesson.startMin ?? 0, endMin: lesson.endMin ?? 0 }]
                : []);
            sessions.forEach((sess, idx) => allItems.push({ classId: c.id, hex, date: sess.date, startMin: sess.startMin, endMin: sess.endMin, idx }));
          });
          // Sessiyalarni sana boʻyicha guruhlash (sinflar aralash, vaqt boʻyicha tartiblangan).
          const groups: { date: string; items: Item[] }[] = [];
          allItems.forEach((it) => {
            let g = groups.find((x) => x.date === it.date);
            if (!g) { g = { date: it.date, items: [] }; groups.push(g); }
            g.items.push(it);
          });
          groups.sort((a, b) => a.date.localeCompare(b.date));
          groups.forEach((g) => g.items.sort((a, b) => a.startMin - b.startMin));

          return (
            <div>
              <SectionLabel>{t("schedule")}</SectionLabel>
              <div className="space-y-1.5">
                {/* Sana kartalari — bir karta = bir sana, ichida sinflar aralash vaqtlar */}
                {groups.map((g) => {
                  const d = dateKeyToDate(g.date);
                  return (
                    <div key={g.date} className="flex items-stretch gap-3 rounded-lg border border-border bg-card overflow-hidden">
                      <div className="flex flex-col items-center justify-center px-3 py-2 shrink-0 bg-muted/50">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{MONTHS_UZ_SHORT[d.getMonth()]}</span>
                        <span className="text-lg font-bold leading-none text-foreground">{d.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0 py-2 pr-2">
                        <span className="block text-[11px] font-medium text-muted-foreground truncate">{DAYS_UZ_SUN[d.getDay()]}</span>
                        <div className="mt-1 space-y-1">
                          {g.items.map((it) => {
                            const cls = selectedClasses.find((c) => c.id === it.classId);
                            return (
                              <div key={`${it.classId}-${it.idx}`} className="group/time flex items-center gap-1.5 text-xs">
                                {dot(it.hex)}
                                <span className="flex-1 truncate font-medium text-foreground">
                                  {selectedClasses.length > 1 && <span className="font-semibold">{cls?.name} </span>}
                                  ({fmtClock(it.startMin)} — {fmtClock(it.endMin)})
                                </span>
                                <button onClick={() => onRemoveScheduleForClass(it.classId, it.idx)} title={t("removeSchedule")}
                                  className="shrink-0 text-muted-foreground/40 hover:text-destructive focus-visible:text-destructive focus-visible:opacity-100 transition-colors opacity-60 group-hover/time:opacity-100">
                                  <X className="size-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Sana qoʻshish — shu tugmaga langarli popover (EMStudio uslubi) */}
                <Popover open={schedOpen} onOpenChange={setSchedOpen}>
                  <PopoverTrigger asChild>
                    <button type="button"
                      className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors">
                      <CalendarDays className="size-4" />
                      {allItems.length ? t("addMoreDate") : t("addDate")}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="left" align="start" sideOffset={12} className="p-0 w-auto">
                    <ClassSchedulePicker
                      classIds={selectedIds}
                      onAdd={(date, sess) => onAddScheduleForClass(sess.classId, date, sess.startMin, sess.endMin)}
                      onDone={() => setSchedOpen(false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          );
        })()}

        {/* ASSIGNMENTS (keyin) */}
        <div>
          <h3 className="text-label mb-2.5 flex items-center gap-2">
            {t("grades")}
            <Badge variant="outline" className="text-[10px] font-normal normal-case tracking-normal">{t("soon")}</Badge>
          </h3>
          <Button
            variant="outline"
            disabled
            disabledReason={t("soonHint")}
            className="w-full justify-center gap-2 h-auto py-3 text-muted-foreground font-normal border-dashed cursor-not-allowed"
          >
            <ClipboardList className="size-4" />
            {t("attachClassForGrading")}
          </Button>
        </div>

        {/* STANDARDS (keyin) */}
        <div>
          <h3 className="text-label mb-2.5 flex items-center gap-2">
            {t("standards")}
            <Badge variant="outline" className="text-[10px] font-normal normal-case tracking-normal">{t("soon")}</Badge>
          </h3>
          <Button
            variant="outline"
            disabled
            disabledReason={t("soonHint")}
            className="w-full justify-center gap-2 h-auto py-3 text-muted-foreground font-normal border-dashed cursor-not-allowed"
          >
            <Plus className="size-4" />
            {t("addStandard")}
          </Button>
        </div>
      </div>
    </div>
  );
}
