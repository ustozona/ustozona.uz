"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Calendar as CalendarIcon, Flag, Clock2Icon, Repeat, Check, X, ChevronRight, Sun, Sunrise, CalendarPlus, CalendarDays } from "lucide-react";
import { format, addDays, parseISO } from "date-fns";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ClassSwatch } from "@/components/ClassSwatch";
import { classColor } from "@/lib/grades-data";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { parseTaskNLP } from "@/lib/task-parser";
import { RecurrenceEditor } from "@/components/tasks/RecurrenceEditor";
import { recurrenceLabel } from "@/lib/recurrence";
import { useTaskStore } from "@/store/useTaskStore";
import { TASK_STATUS, type TaskPriority, type TaskStatus } from "@/lib/tasks-data";

export type ComposerSeed = {
  dueDate?: string | null;
  priority?: TaskPriority;
  classIds?: string[];
  status?: TaskStatus;
};

export type TaskComposerHandle = { focus: () => void };

const PRIORITY_OPTION_VALUES: { value: TaskPriority; cls: string }[] = [
  { value: "high", cls: "fill-destructive text-destructive" },
  { value: "medium", cls: "fill-warning text-warning" },
  { value: "low", cls: "fill-info text-info" },
  { value: "none", cls: "text-muted-foreground/60" },
];

const todayStr = () => format(new Date(), "yyyy-MM-dd");

/** Sananing qisqa, inson oʻqiydigan yorligʻi (Bugun/Ertaga/d-MMM). */
function dateLabel(d: string, todayLabel: string, tomorrowLabel: string): string {
  const todayIso = todayStr();
  const tomorrowIso = format(addDays(new Date(), 1), "yyyy-MM-dd");
  if (d === todayIso) return todayLabel;
  if (d === tomorrowIso) return tomorrowLabel;
  return format(parseISO(d), "d-MMM", { locale: uz });
}

/**
 * Tezkor vazifa qoʻshish qutisi (TickTick uslubi) — bizning dizayn tizimida.
 * Yopiq holatda sokin "+ Vazifa qoʻshish" qatori; fokusda bordered karta:
 * sarlavha + toolbar (Sana / Ustuvorlik / Sinf) + Qoʻshish tugmasi.
 *
 * Variant A: faqat tezkor maydonlar — yagona muddat (+ ixtiyoriy vaqt),
 * ustuvorlik, sinf va takrorlash. Davomiylik (boshlanish–muhlat), tavsif,
 * masʼullar va eslatma kabi ogʻir maydonlar Vazifa tafsiloti panelida tahrirlanadi.
 */
export const TaskComposer = forwardRef<TaskComposerHandle, { seed?: ComposerSeed }>(
  function TaskComposer({ seed }, ref) {
    const t = useTranslations("TaskComposer");
    const tPriority = useTranslations("TaskPriority");
    const PRIORITY_OPTIONS = PRIORITY_OPTION_VALUES.map((p) => ({ ...p, label: tPriority(p.value) }));
    const addTask = useTaskStore((s) => s.addTask);

    const [expanded, setExpanded] = useState(false);
    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState<string | null>(null);
    const [dueTime, setDueTime] = useState<string | null>(null);
    const [priority, setPriority] = useState<TaskPriority>("none");
    const [classIds, setClassIds] = useState<string[]>([]);
    const liveClasses = useLiveClasses();
    const [repeatOpen, setRepeatOpen] = useState(false);
    const [recurrenceRule, setRecurrenceRule] = useState<string | null>(null);
    const [calMonth, setCalMonth] = useState<Date>(new Date());
    const [datePopoverOpen, setDatePopoverOpen] = useState(false);
    const [classPopoverOpen, setClassPopoverOpen] = useState(false);

    // Sanani tanlash + koʻrinayotgan oyni oʻsha sanaga koʻchirish (preset/calendar).
    const pickDate = (d: Date | null) => {
      setDueDate(d ? format(d, "yyyy-MM-dd") : null);
      if (d) setCalMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    };

    const inputRef = useRef<HTMLInputElement>(null);

    const expand = () => {
      // Faol roʻyxat (filtr) konteksti — pillalarni oldindan toʻldirish.
      setDueDate(seed?.dueDate ?? null);
      setCalMonth(seed?.dueDate ? new Date(parseISO(seed.dueDate).getFullYear(), parseISO(seed.dueDate).getMonth(), 1) : new Date());
      setPriority(seed?.priority ?? "none");
      setClassIds(seed?.classIds ?? []);
      setExpanded(true);
      requestAnimationFrame(() => inputRef.current?.focus());
    };

    useImperativeHandle(ref, () => ({ focus: expand }), [seed]);

    const clearDates = () => {
      setDueDate(null);
      setDueTime(null);
      setRecurrenceRule(null);
      setRepeatOpen(false);
    };

    const reset = () => {
      setTitle("");
      setDueDate(seed?.dueDate ?? null);
      setDueTime(null);
      setPriority(seed?.priority ?? "none");
      setClassIds(seed?.classIds ?? []);
      setRecurrenceRule(null);
      setRepeatOpen(false);
    };

    const collapse = () => {
      setExpanded(false);
      setTitle("");
      setDueDate(null);
      setDueTime(null);
      setPriority("none");
      setClassIds([]);
      setRecurrenceRule(null);
      setRepeatOpen(false);
    };

    const submit = () => {
      if (!title.trim()) return;
      const parsed = parseTaskNLP(title);
      // Qoʻlda tanlangan pillalar ustuvor; NLP faqat boʻsh maydonlarni toʻldiradi.
      const finalDate = dueDate ?? parsed.dueDate ?? null;
      const finalClassIds =
        classIds.length > 0 ? classIds : parsed.classIds.length > 0 ? parsed.classIds : seed?.classIds ?? [];

      addTask({
        title: parsed.title || title.trim(),
        dueDate: finalDate,
        dueTime: finalDate ? dueTime : null,
        endDate: null,
        endTime: null,
        classIds: finalClassIds,
        mentions: parsed.mentions,
        priority,
        status: seed?.status ?? TASK_STATUS.TODO,
        isRecurring: !!recurrenceRule,
        recurrenceRule,
      });

      reset();
      requestAnimationFrame(() => inputRef.current?.focus());
    };

    // ── Yopiq holat: sokin qator ──
    if (!expanded) {
      return (
        <button
          type="button"
          onClick={expand}
          className="group flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <Plus className="size-4 text-muted-foreground/70 transition-colors group-hover:text-primary" />
          {t("addTask")}
        </button>
      );
    }

    const priorityMeta = PRIORITY_OPTIONS.find((p) => p.value === priority)!;

    // Tezkor sana presetlari — yagona sana, oldinga qaragan (task muddatiga mos).
    // Icon-only ghost tugmalar + tooltip; faolida nuqta-indikator (primary fon).
    const now = new Date();
    const quickPresets = [
      { label: t("today"), date: now, icon: Sun },
      { label: t("tomorrow"), date: addDays(now, 1), icon: Sunrise },
      { label: t("dayAfterTomorrow"), date: addDays(now, 2), icon: CalendarPlus },
      { label: t("nextWeek"), date: addDays(now, 7), icon: CalendarDays },
    ];
    const presetIso = (d: Date) => format(d, "yyyy-MM-dd");
    const isPresetActive = (d: Date) => dueDate === presetIso(d);

    // ── Ochiq holat: compose karta ──
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="rounded-xl border border-primary/40 bg-card shadow-sm ring-2 ring-primary/10 transition-shadow"
      >
        <div className="px-3 pt-3">
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") collapse();
            }}
            placeholder={t("titlePlaceholder")}
            className="h-auto border-none bg-transparent p-0 text-sm font-medium shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
          />
        </div>

        <div className="flex items-center gap-1 px-2.5 py-2">
          {/* ── Sana ── */}
          <Popover
            open={datePopoverOpen}
            onOpenChange={(open) => {
              setDatePopoverOpen(open);
              if (open && dueDate) setCalMonth(new Date(parseISO(dueDate).getFullYear(), parseISO(dueDate).getMonth(), 1));
            }}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 gap-1.5 px-2 text-xs font-medium",
                  dueDate ? "text-primary hover:text-primary" : "text-muted-foreground"
                )}
              >
                <CalendarIcon className="size-4" />
                {dueDate ? (
                  <span>
                    {dateLabel(dueDate, t("today"), t("tomorrow"))}
                    {dueTime ? `, ${dueTime}` : ""}
                  </span>
                ) : (
                  t("dateLabel")
                )}
                {recurrenceRule && <Repeat className="size-3" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[300px] max-h-[min(34rem,var(--radix-popover-content-available-height))] overflow-y-auto p-0"
              align="start"
              sideOffset={8}
            >
              {/* Tezkor presetlar — icon-only ghost + tooltip, butun kenglikka teng taqsim */}
              <TooltipProvider delayDuration={200}>
                <div role="toolbar" aria-label={t("quickDateToolbarLabel")} className="grid grid-cols-4 gap-1.5 p-2.5 pb-1">
                  {quickPresets.map((p) => (
                    <Tooltip key={p.label}>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={p.label}
                          className={cn(
                            "h-9 w-full border border-border text-muted-foreground hover:text-foreground",
                            isPresetActive(p.date) && "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                          )}
                          onClick={() => pickDate(p.date)}
                        >
                          <p.icon className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{p.label}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>

              <div className="px-3">
                <Calendar
                  mode="single"
                  selected={dueDate ? parseISO(dueDate) : undefined}
                  onSelect={(d) => pickDate(d ?? null)}
                  month={calMonth}
                  onMonthChange={setCalMonth}
                  locale={uz}
                  fixedWeeks
                  className="w-full p-0 [--cell-size:--spacing(9)]"
                />
              </div>

              {/* Vaqt — inline qator (yonida time input) */}
              <div className="mt-2 flex items-center gap-2.5 border-t px-3 py-2.5 text-sm">
                <Clock2Icon className="size-4 text-muted-foreground" />
                <span className="font-medium">{t("time")}</span>
                <Input
                  type="time"
                  value={dueTime || ""}
                  onChange={(e) => setDueTime(e.target.value || null)}
                  className="ml-auto h-8 w-[110px] text-sm [&::-webkit-calendar-picker-indicator]:opacity-60"
                />
              </div>

              {/* Takrorlash (ochiluvchi qator) */}
              <Collapsible open={repeatOpen} onOpenChange={setRepeatOpen} className="border-t">
                <CollapsibleTrigger asChild>
                  <button type="button" className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted/40 transition-colors">
                    <Repeat className="size-4 text-muted-foreground" />
                    <span className="font-medium">{t("repeat")}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{recurrenceLabel(recurrenceRule, dueDate) ?? t("doesNotRepeat")}</span>
                    <ChevronRight className={cn("size-4 text-muted-foreground/60 transition-transform duration-fast ease-standard", repeatOpen && "rotate-90")} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-3">
                  <RecurrenceEditor value={recurrenceRule} onChange={setRecurrenceRule} refISO={dueDate} />
                </CollapsibleContent>
              </Collapsible>

              {/* Footer: Tozalash / OK */}
              <div className="flex items-center gap-2 border-t p-3">
                <Button type="button" variant="outline" size="sm" className="h-9 flex-1 text-xs" onClick={clearDates}>
                  {t("clear")}
                </Button>
                <Button type="button" size="sm" className="h-9 flex-1 text-xs" onClick={() => setDatePopoverOpen(false)}>
                  {t("ok")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* ── Ustuvorlik ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn("h-8 gap-1.5 px-2 text-xs font-medium", priority === "none" && "text-muted-foreground")}
              >
                <Flag className={cn("size-4", priorityMeta.cls)} />
                {priority !== "none" && <span>{priorityMeta.label}</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {PRIORITY_OPTIONS.map((p) => (
                <DropdownMenuItem
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={cn(p.value === priority && "text-primary")}
                >
                  <Flag className={cn("size-4", p.cls)} />
                  <span className="flex-1">{p.label}</span>
                  {p.value === priority && <Check className="size-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* ── Sinf ── */}
          <Popover open={classPopoverOpen} onOpenChange={setClassPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn("h-8 gap-1.5 px-2 text-xs font-medium", classIds.length === 0 && "text-muted-foreground")}
              >
                {classIds.length > 0 ? (
                  <>
                    {(() => {
                      const first = liveClasses.find((c) => c.id === classIds[0]);
                      return (
                        <>
                          <ClassSwatch hex={first ? CLASS_COLOR_HEX[classColor(first)] : CLASS_COLOR_HEX.gray} />
                          <span>{classIds.length === 1 ? first?.name ?? t("classLabel") : t("classCount", { count: classIds.length })}</span>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    <CalendarIcon className="hidden" />
                    <span className="flex size-4 items-center justify-center rounded-[4px] border border-dashed border-muted-foreground/50" />
                    {t("classLabel")}
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-1.5" sideOffset={8}>
              <div className="flex max-h-64 flex-col overflow-y-auto">
                {liveClasses.map((cls) => {
                  const active = classIds.includes(cls.id);
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() =>
                        setClassIds((prev) =>
                          prev.includes(cls.id) ? prev.filter((id) => id !== cls.id) : [...prev, cls.id]
                        )
                      }
                      className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent"
                    >
                      <ClassSwatch hex={CLASS_COLOR_HEX[classColor(cls)]} />
                      <span className="flex-1 truncate font-medium">{cls.name}</span>
                      {active && <Check className="size-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* ── Oʻng tomon: Bekor + Qoʻshish ── */}
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={collapse}
            >
              <X className="size-4" />
            </Button>
            <Button type="submit" size="sm" className="h-8 gap-1.5 px-3 text-xs" disabled={!title.trim()}>
              {t("submit")}
              <Kbd className="hidden bg-primary-foreground/15 text-primary-foreground sm:inline-flex">↵</Kbd>
            </Button>
          </div>
        </div>
      </form>
    );
  }
);
