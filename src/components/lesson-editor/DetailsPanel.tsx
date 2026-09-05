"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { SlidersHorizontal, ChevronDown, Ban, Layers, CalendarDays, Target, Plus, Check, X } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { classColor } from "@/lib/grades-data";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { CLASS_COLOR_HEX, classGradient } from "@/lib/class-colors";
import { ClassBadge } from "@/components/ClassBadge";
import { lessonClassIds, type Lesson, type Unit } from "@/lib/lessons-data";
import { fmtClock, dateKeyToDate } from "@/lib/lesson-schedule";
import { MONTHS_UZ_SHORT, DAYS_UZ_SUN } from "@/lib/localization";
import { useStandardsStore } from "@/store/useStandardsStore";
import { BLOOM_LEVELS } from "@/lib/standards-data";
import { cn } from "@/lib/utils";
import ClassSchedulePicker from "./ClassSchedulePicker";
import { ClassSwatch } from "@/components/ClassSwatch";
import { EditorSidePanelHeader } from "@/components/ui/editor-side-panel";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-label mb-2.5">{children}</h3>
);

const dot = (hex: string) => <ClassSwatch hex={hex} className="size-2.5" />;

const FieldButton = ({ children }: { children: React.ReactNode }) => (
  <span className="flex items-center justify-between gap-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm hover:bg-accent/50 transition-colors text-left">
    {children}
  </span>
);

export default function DetailsPanel({
  lesson, units, onClose,
  onSetClasses, onSetUnitForClass, onAddScheduleForClass, onRemoveScheduleForClass, onSetStandards,
}: {
  lesson: Lesson;
  units: Unit[];
  onClose: () => void;
  onSetClasses: (classIds: string[]) => void;
  onSetUnitForClass: (classId: string, unitId: string | null) => void;
  onAddScheduleForClass: (classId: string, date: string, startMin: number, endMin: number) => void;
  onRemoveScheduleForClass: (classId: string, index: number) => void;
  onSetStandards: (standards: string[]) => void;
}) {
  const t = useTranslations("LessonDetailsPanel");
  const liveClasses = useLiveClasses();
  const selectedIds = lessonClassIds(lesson);
  const selectedClasses = liveClasses.filter((c) => selectedIds.includes(c.id));
  const [schedOpen, setSchedOpen] = useState(false);
  const [stdOpen, setStdOpen] = useState(false);

  const standardSets = useStandardsStore((s) => s.sets);
  const availableStandards = useMemo(
    () =>
      standardSets
        .filter((set) => set.classIds.some((id) => selectedIds.includes(id)))
        .flatMap((set) => set.standards.map((std) => ({ ...std, setName: set.name }))),
    [standardSets, selectedIds],
  );
  const attachedCodes = lesson.standards ?? [];
  const attachedStandards = attachedCodes
    .map((code) => availableStandards.find((s) => s.id === code))
    .filter((s): s is (typeof availableStandards)[number] => !!s);
  const pickableStandards = availableStandards.filter((s) => !attachedCodes.includes(s.id));

  const toggleStandard = (code: string) => {
    onSetStandards(attachedCodes.includes(code) ? attachedCodes.filter((c) => c !== code) : [...attachedCodes, code]);
  };

  const toggleClass = (id: string) => {
    onSetClasses(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
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
      <div className="flex-1 min-h-0 scrollbar-hover overflow-y-auto px-5 py-5 space-y-7">
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
                      selectedClasses.map((c) => (
                        <ClassBadge key={c.id} color={classColor(c)} name={c.name} />
                      ))
                    )}
                  </span>
                  <ChevronDown className="size-4 opacity-50 shrink-0" />
                </FieldButton>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[280px] scrollbar-hover overflow-y-auto">
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
        <div>
          <SectionLabel>{t("units")}</SectionLabel>
          {selectedClasses.length === 0 ? (
            <p className="text-caption text-muted-foreground rounded-xl border border-dashed border-border py-3 px-4">
              {t("selectClassFirst")}
            </p>
          ) : (
            <div className="space-y-2.5">
              {selectedClasses.map((c) => {
                const hex = CLASS_COLOR_HEX[classColor(c)];
                const unitsForClass = units.filter((u) => u.classId === c.id).sort((a, b) => a.number - b.number);
                const curUnitId = lesson.unitByClass?.[c.id] ?? (c.id === selectedIds[0] ? lesson.unitId ?? null : null);
                const unit = units.find((u) => u.id === curUnitId);
                return (
                  <DropdownMenu key={c.id}>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className="w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 hover:bg-accent/40 transition-colors text-left">
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="size-9 rounded-full flex items-center justify-center shrink-0 text-white" style={classGradient(hex)}>
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
                    <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[260px] scrollbar-hover overflow-y-auto p-1.5">
                      <DropdownMenuItem onSelect={() => onSetUnitForClass(c.id, null)} className="gap-2.5 py-2 rounded-lg">
                        <span className="size-2.5 rounded-full shrink-0 bg-muted-foreground/25" />
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
          )}
        </div>

        {/* SCHEDULE — bitta umumiy roʻyxat, barcha biriktirilgan sinflar bir sana-karta ostida yigʻiladi */}
        <div>
          <SectionLabel>{t("schedule")}</SectionLabel>
          {selectedClasses.length === 0 ? (
            <p className="text-caption text-muted-foreground rounded-xl border border-dashed border-border py-3 px-4">
              {t("selectClassFirst")}
            </p>
          ) : (() => {
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
              <div className="space-y-1.5">
                {/* Sana kartalari — bir karta = bir sana, ichida sinflar aralash vaqtlar */}
                {groups.map((g) => {
                  const d = dateKeyToDate(g.date);
                  return (
                    <div key={g.date} className="flex items-stretch gap-3 rounded-xl border border-border bg-card overflow-hidden">
                      <div className="flex flex-col items-center justify-center px-3 py-2 shrink-0 bg-muted/50" title={d.toLocaleDateString()}>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{MONTHS_UZ_SHORT[d.getMonth()]}</span>
                        <span className="text-lg font-bold leading-none text-foreground">{d.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0 py-2 pr-2">
                        <span className="block text-[11px] font-medium text-muted-foreground truncate">{DAYS_UZ_SUN[d.getDay()]}</span>
                        <div className="mt-1.5 space-y-1.5">
                          {g.items.map((it) => {
                            const cls = selectedClasses.find((c) => c.id === it.classId);
                            return (
                              <div key={`${it.classId}-${it.idx}`} className="group/time flex items-center gap-2 text-sm min-w-0">
                                <span className="shrink-0 truncate font-medium text-foreground">
                                  {fmtClock(it.startMin)} — {fmtClock(it.endMin)}
                                </span>
                                {selectedClasses.length > 1 && cls && (
                                  <ClassBadge color={classColor(cls)} name={cls.name} />
                                )}
                                <button onClick={() => onRemoveScheduleForClass(it.classId, it.idx)} title={t("removeSchedule")} aria-label={t("removeSchedule")}
                                  className="ml-auto shrink-0 text-muted-foreground/40 hover:text-destructive focus-visible:text-destructive focus-visible:opacity-100 transition-colors opacity-60 group-hover/time:opacity-100">
                                  <X className="size-4" />
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
          );
        })()}
        </div>

        {/* STANDARDS */}
        <div>
          <SectionLabel>{t("standards")}</SectionLabel>

          {attachedStandards.length > 0 && (
            <div className="flex flex-col gap-2 mb-2.5">
              {attachedStandards.map((std) => (
                <HoverCard key={std.id} openDelay={150}>
                  <HoverCardTrigger asChild>
                    <div className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-accent/40 transition-colors">
                      <span className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                        <Target className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-foreground truncate">{std.id}</div>
                        <div className="text-caption text-muted-foreground truncate">{std.setName}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleStandard(std.id)}
                        aria-label={t("removeStandard")}
                        className="size-6 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-accent shrink-0 opacity-60 group-hover:opacity-100 transition-colors"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent side="left" align="center" sideOffset={12} className="w-72">
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                        <Target className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{std.id}</div>
                        <div className="text-caption text-muted-foreground truncate">{std.setName}</div>
                      </div>
                    </div>
                    {(() => {
                      const bl = BLOOM_LEVELS.find((b) => b.id === std.bloom);
                      return bl ? (
                        <Badge variant="secondary" className={cn("shadow-none mb-2", bl.color)}>{bl.label}</Badge>
                      ) : null;
                    })()}
                    <p className="text-sm text-foreground/90 leading-relaxed">{std.desc}</p>
                    {lesson.status === "Completed" && (
                      <div className="mt-3 pt-3 border-t border-border text-caption text-muted-foreground">
                        {t("taught")}
                      </div>
                    )}
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          )}

          {selectedIds.length === 0 ? (
            <p className="text-caption text-muted-foreground rounded-xl border border-dashed border-border py-3 px-4">
              {t("selectClassFirst")}
            </p>
          ) : (
            <Popover open={stdOpen} onOpenChange={setStdOpen}>
              <PopoverTrigger asChild>
                <button type="button"
                  className="w-full flex items-center justify-center gap-2 rounded-full border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors">
                  <Plus className="size-4" />
                  {t("addStandard")}
                </button>
              </PopoverTrigger>
              <PopoverContent side="left" align="start" sideOffset={12} className="p-0 w-80">
                <Command>
                  <CommandInput placeholder={t("searchStandard")} />
                  <CommandList>
                    {availableStandards.length === 0 ? (
                      <CommandEmpty>{t("noStandardsForClass")}</CommandEmpty>
                    ) : pickableStandards.length === 0 ? (
                      <CommandEmpty>{t("allStandardsAttached")}</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {pickableStandards.map((std) => (
                          <CommandItem
                            key={std.id}
                            value={`${std.id} ${std.desc}`}
                            onSelect={() => toggleStandard(std.id)}
                            className="items-start gap-2.5"
                          >
                            <Target className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-semibold text-foreground/70">{std.id}</span>
                                <span className="text-caption text-muted-foreground truncate">{std.setName}</span>
                              </div>
                              <p className="text-sm text-foreground/90 leading-snug">{std.desc}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  );
}
