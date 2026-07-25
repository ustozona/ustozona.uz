"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { SlidersHorizontal, ChevronDown, Ban, Layers, CalendarDays, ClipboardList, Plus, Check, Clock, X, RotateCcw } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { classColor } from "@/lib/grades-data";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
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

  // Har bir tanlangan sinf uchun hozirgi boʻlim (raqami orqali sinflar aro solishtiriladi,
  // chunki har sinfning oʻz Unit yozuvi bor — id boshqa, lekin "number" mos keladi).
  const classUnit = (c: (typeof selectedClasses)[number]) => {
    const curUnitId = lesson.unitByClass?.[c.id] ?? (c.id === selectedIds[0] ? lesson.unitId ?? null : null);
    return units.find((u) => u.id === curUnitId) ?? null;
  };
  const unitsForClass = (classId: string) => units.filter((u) => u.classId === classId).sort((a, b) => a.number - b.number);

  // Eng koʻp sinfda turgan boʻlim raqami — "umumiy" qiymat. Teng boʻlsa birinchi sinfniki.
  const numberCounts = new Map<number | null, number>();
  selectedClasses.forEach((c) => {
    const n = classUnit(c)?.number ?? null;
    numberCounts.set(n, (numberCounts.get(n) ?? 0) + 1);
  });
  let commonNumber: number | null = selectedClasses.length ? classUnit(selectedClasses[0])?.number ?? null : null;
  let commonCount = -1;
  numberCounts.forEach((count, n) => {
    if (count > commonCount) { commonCount = count; commonNumber = n; }
  });
  const commonTitle = selectedClasses.map((c) => classUnit(c)).find((u) => u?.number === commonNumber)?.title ?? null;

  const exceptionClasses = selectedClasses.filter((c) => (classUnit(c)?.number ?? null) !== commonNumber);
  const baseClasses = selectedClasses.filter((c) => (classUnit(c)?.number ?? null) === commonNumber);

  // Union of barcha boʻlim raqamlari — umumiy tanlov roʻyxati uchun.
  const allNumbers = Array.from(new Set(units.filter((u) => selectedIds.includes(u.classId)).map((u) => u.number))).sort((a, b) => a - b);

  const setCommonNumber = (number: number | null) => {
    baseClasses.forEach((c) => {
      const u = number === null ? null : unitsForClass(c.id).find((x) => x.number === number);
      onSetUnitForClass(c.id, u ? u.id : null);
    });
  };
  const resetException = (c: (typeof selectedClasses)[number]) => {
    const u = commonNumber === null ? null : unitsForClass(c.id).find((x) => x.number === commonNumber);
    onSetUnitForClass(c.id, u ? u.id : null);
  };

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
                <span className="flex items-center justify-between gap-2 w-full rounded-lg border border-border bg-card px-3.5 py-3 text-sm hover:bg-accent/50 transition-colors text-left">
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
                </span>
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

        {/* UNIT (umumiy boʻlim + kerak boʻlsa sinf boʻyicha istisno) */}
        {selectedClasses.length > 0 && (
          <div>
            <SectionLabel>{t("unit")}</SectionLabel>

            {/* Umumiy boʻlim — barcha "istisno"siz sinflarga bir yoʻla qoʻllanadi */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5 hover:bg-accent/40 transition-colors text-left">
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="size-9 rounded-xl flex items-center justify-center shrink-0 text-white bg-foreground/80">
                      <Layers className="size-4" />
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="text-xs text-muted-foreground leading-tight">
                        {baseClasses.length === selectedClasses.length ? t("classCount", { count: selectedClasses.length }) : t("classCount", { count: baseClasses.length })}
                      </span>
                      <span className="text-sm font-semibold text-foreground truncate leading-tight">
                        {commonNumber !== null && commonTitle ? `${String(commonNumber).padStart(2, "0")}. ${commonTitle}` : t("noUnitSelected")}
                      </span>
                    </span>
                  </span>
                  <ChevronDown className="size-4 opacity-50 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[260px] overflow-y-auto p-1.5">
                <DropdownMenuItem onSelect={() => setCommonNumber(null)} className="gap-2.5 py-2 rounded-lg">
                  <span className="size-2.5 rounded-[4px] shrink-0 bg-muted-foreground/25" />
                  <span className="flex-1 truncate text-muted-foreground">{t("noUnit")}</span>
                  {commonNumber === null && <Check className="size-4 shrink-0" />}
                </DropdownMenuItem>
                {allNumbers.length === 0 ? (
                  <div className="px-2 py-2 text-xs text-muted-foreground">{t("noUnitsInClass")}</div>
                ) : allNumbers.map((n) => {
                  const title = units.find((u) => selectedIds.includes(u.classId) && u.number === n)?.title ?? "";
                  const on = n === commonNumber;
                  return (
                    <DropdownMenuItem key={n} onSelect={() => setCommonNumber(n)} className="gap-2.5 py-2 rounded-lg">
                      <span className="flex-1 truncate">{String(n).padStart(2, "0")}. {title}</span>
                      {on && <Check className="size-4 shrink-0" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Istisnolar — faqat umumiy boʻlimdan farq qiladigan sinflar koʻrinadi */}
            {exceptionClasses.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70 pl-0.5">{t("exceptions")}</span>
                {exceptionClasses.map((c) => {
                  const hex = CLASS_COLOR_HEX[classColor(c)];
                  const unit = classUnit(c);
                  return (
                    <div key={c.id} className="group/exc flex items-center gap-1.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" className="flex-1 min-w-0 flex items-center gap-2.5 rounded-lg border border-dashed border-border bg-card px-3 py-2 hover:bg-accent/40 transition-colors text-left">
                            {dot(hex)}
                            <span className="text-xs font-medium text-foreground shrink-0">{c.name}</span>
                            <span className="text-xs text-muted-foreground truncate flex-1">
                              {unit ? `${String(unit.number).padStart(2, "0")}. ${unit.title}` : t("noUnitSelected")}
                            </span>
                            <ChevronDown className="size-3.5 opacity-50 shrink-0" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[240px] overflow-y-auto p-1.5">
                          <DropdownMenuItem onSelect={() => onSetUnitForClass(c.id, null)} className="gap-2.5 py-2 rounded-lg">
                            <span className="size-2.5 rounded-[4px] shrink-0 bg-muted-foreground/25" />
                            <span className="flex-1 truncate text-muted-foreground">{t("noUnit")}</span>
                            {!unit && <Check className="size-4 shrink-0" />}
                          </DropdownMenuItem>
                          {unitsForClass(c.id).map((u) => (
                            <DropdownMenuItem key={u.id} onSelect={() => onSetUnitForClass(c.id, u.id)} className="gap-2.5 py-2 rounded-lg">
                              {dot(hex)}
                              <span className="flex-1 truncate">{String(u.number).padStart(2, "0")}. {u.title}</span>
                              {u.id === unit?.id && <Check className="size-4 shrink-0" />}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <button
                        type="button"
                        onClick={() => resetException(c)}
                        title={t("resetToCommon")}
                        className="shrink-0 size-8 flex items-center justify-center rounded-lg text-muted-foreground/40 opacity-0 group-hover/exc:opacity-100 hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <RotateCcw className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Istisno qoʻshish — hozir umumiy qatorda turgan sinflardan birini alohida sozlash */}
            {baseClasses.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="mt-2.5 w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors">
                    <Plus className="size-3.5" />
                    {t("addException")}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 p-1.5">
                  {baseClasses.map((c) => {
                    const hex = CLASS_COLOR_HEX[classColor(c)];
                    return (
                      <DropdownMenuSub key={c.id}>
                        <DropdownMenuSubTrigger className="gap-2.5 py-2 rounded-lg">
                          {dot(hex)}
                          <span className="truncate">{c.name}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="max-h-[240px] overflow-y-auto p-1.5">
                          {unitsForClass(c.id).length === 0 ? (
                            <div className="px-2 py-2 text-xs text-muted-foreground">{t("noUnitsInClass")}</div>
                          ) : unitsForClass(c.id).map((u) => (
                            <DropdownMenuItem key={u.id} onSelect={() => onSetUnitForClass(c.id, u.id)} className="gap-2.5 py-2 rounded-lg">
                              {dot(hex)}
                              <span className="flex-1 truncate">{String(u.number).padStart(2, "0")}. {u.title}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
                        <span className="block text-sm font-semibold text-foreground truncate">{DAYS_UZ_SUN[d.getDay()]}</span>
                        <div className="mt-1 space-y-0.5">
                          {g.items.map((it) => {
                            const cls = selectedClasses.find((c) => c.id === it.classId);
                            return (
                              <div key={`${it.classId}-${it.idx}`} className="group/time flex items-center gap-1.5 text-xs text-muted-foreground">
                                {dot(it.hex)}
                                {selectedClasses.length > 1 && <span className="font-medium text-foreground shrink-0">{cls?.name}</span>}
                                <Clock className="size-3 shrink-0" />
                                <span className="flex-1 truncate">{fmtClock(it.startMin)} – {fmtClock(it.endMin)}</span>
                                <button onClick={() => onRemoveScheduleForClass(it.classId, it.idx)} title={t("removeSchedule")}
                                  className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors opacity-0 group-hover/time:opacity-100">
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
