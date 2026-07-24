"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  Cake,
  CalendarClock,
  ChevronRight,
  Clock,
  ClipboardCheck,
  Flag,
  GraduationCap,
  Pencil,
  Play,
  Repeat,
  Tag,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { Panel, PanelHeader, PanelBody, PanelFooter } from "@/components/ui/panel";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { AppleEmojiSprite } from "@/components/ui/apple-emoji";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateKeyPicker } from "@/components/ui/date-key-picker";
import { TaskTimeCard } from "./TaskTimeCard";
import { WheelPicker, WheelPickerWrapper } from "@/components/wheel-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ClassSwatch } from "@/components/ClassSwatch";
import { TypographyMuted } from "@/components/ui/typography";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { buildRule, recurrenceLabel } from "@/lib/recurrence";
import {
  dateToKey,
  formatDateGroupLabel,
  formatMinutes,
  PRIORITY_META,
  PRIORITY_ORDER,
  TAG_PILL_CLASS,
  taskPomoLengthMin,
  todayKey as todayKeyOf,
  totalFocusMinutes,
  type Task,
  type TaskPriority,
} from "@/lib/tasks-data";

function fmtDueMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Muddat qatoridagi vaqt — dars-manbali vazifada oraliq (10:35–11:20). */
function fmtDueRange(task: Task): string {
  const start = fmtDueMin(task.dueMin!);
  if (task.dueEndMin == null) return start;
  return `${start}–${fmtDueMin(task.dueEndMin)}`;
}

/** Gʻildirak-tanlagich variantlari: taxminiy pomodoro 1–50, uzunlik 1–60 daqiqa. */
const EST_POMO_OPTIONS = Array.from({ length: 50 }, (_, i) => ({
  label: String(i + 1),
  value: String(i + 1),
}));
const POMO_LEN_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  label: String(i + 1),
  value: String(i + 1),
}));

export function TaskDetail({
  task,
  onToggleStatus,
  onSetPriority,
  onSetDueDate,
  onSetDueRange,
  onSetClassId,
  onSetNote,
  onSetTitle,
  onSetTags,
  onSetRepeat,
  onSetEstPomos,
  onSetPomoMinutes,
  onStartFocus,
  onDelete,
  onCancel,
  onClose,
  pomoMinutes,
}: {
  task: Task | null;
  onToggleStatus: () => void;
  onSetPriority: (p: TaskPriority) => void;
  onSetDueDate: (key: string | null) => void;
  onSetDueRange: (patch: { dueDate: string | null; dueMin?: number | null; dueEndMin?: number | null }) => void;
  onSetClassId: (id: string | null) => void;
  onSetNote: (note: string) => void;
  onSetTitle: (title: string) => void;
  onSetTags: (tags: string[]) => void;
  onSetRepeat: (repeat: Task["repeat"]) => void;
  onSetEstPomos: (n: number) => void;
  onSetPomoMinutes: (n: number) => void;
  onStartFocus: () => void;
  onDelete: () => void;
  onCancel: () => void;
  onClose: () => void;
  pomoMinutes: number;
}) {
  const t = useTranslations("TasksPage.detail");
  const liveClasses = useLiveClasses();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [note, setNote] = useState(task?.note ?? "");
  const [title, setTitle] = useState(task?.title ?? "");
  const [tagInput, setTagInput] = useState("");
  const [pomoOpen, setPomoOpen] = useState(false);
  const [pendingEstPomos, setPendingEstPomos] = useState(Math.max(1, task?.estPomos ?? 1));
  const [pendingPomoMin, setPendingPomoMin] = useState(pomoMinutes);

  useEffect(() => {
    setNote(task?.note ?? "");
    setTitle(task?.title ?? "");
    setTagInput("");
  }, [task?.id]);

  if (!task) {
    return (
      <Panel>
        <Empty className="h-full border-0">
          <EmptyHeader>
            <EmptyMedia>
              <Illustration name="18" className="h-32 text-black dark:text-white" />
            </EmptyMedia>
            <EmptyTitle className="flex items-center justify-center gap-1.5">
              {t("emptyTitle")}
              <AppleEmojiSprite emoji="👈" className="size-4.5" />
            </EmptyTitle>
            <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Panel>
    );
  }

  const done = task.status === "done";
  const classInfo = task.classId ? liveClasses.find((c) => c.id === task.classId) : undefined;
  const classHex = classInfo ? CLASS_COLOR_HEX[classColor(classInfo)] : undefined;
  const isManual = task.source.kind === "manual";
  const isLessonTask = task.source.kind === "lesson";
  const effectivePomoMin = taskPomoLengthMin(task, pomoMinutes);
  const prio = PRIORITY_META[task.priority];
  const sourceHref =
    task.source.kind === "lesson"
      ? `/dashboard/lessons?classId=${encodeURIComponent(task.source.classId)}`
      : task.source.kind === "grading"
        ? `/dashboard/grades?classId=${encodeURIComponent(task.source.classId)}`
        : task.source.kind === "birthday"
          ? `/dashboard/students/${encodeURIComponent(task.source.studentId)}`
          : null;

  return (
    <Panel>
      {/* Focus To-Do sarlavha qatori: [ustuvorlik-rangli checkbox] [▶] [sarlavha] [bayroq] */}
      <PanelHeader divider>
        <div className="col-span-3 flex min-w-0 items-center gap-2.5">
          <Checkbox
            checked={done}
            onCheckedChange={onToggleStatus}
            className={cn(
              "size-5 shrink-0 rounded-full",
              done
                ? "border-success bg-success data-[state=checked]:border-success data-[state=checked]:bg-success"
                : prio.checkbox
            )}
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && title !== task.title && onSetTitle(title.trim())}
            className={cn(
              "min-w-0 flex-1 truncate bg-transparent text-base font-semibold outline-none",
              done && "text-muted-foreground line-through"
            )}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
                aria-label={t("priorityLabel")}
              >
                <Flag
                  className={cn("size-4", task.priority === "none" ? "text-muted-foreground/40" : prio.text)}
                  fill={task.priority === "none" ? "none" : "currentColor"}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {PRIORITY_ORDER.map((p) => (
                <DropdownMenuItem key={p} onClick={() => onSetPriority(p)} className="gap-2">
                  <Flag
                    className={cn("size-3.5 shrink-0", p === "none" ? "text-muted-foreground/40" : PRIORITY_META[p].text)}
                    fill={p === "none" ? "none" : "currentColor"}
                  />
                  {t(`priority.${p}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PanelHeader>
      <PanelBody inset>
        <div className="flex flex-col divide-y divide-border/40">
          {/* Teglar — sarlavha ostidagi birinchi qator (Focus To-Do TagAdd) */}
          <MetaRow icon={<Tag className="size-4" />} label={t("tagsLabel")}>
            {(task.tags ?? []).map((tag) => (
              <span
                key={tag}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                  TAG_PILL_CLASS
                )}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onSetTags((task.tags ?? []).filter((x) => x !== tag))}
                  aria-label={t("removeTagAria", { tag })}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                const v = tagInput.trim();
                if (!v || (task.tags ?? []).includes(v)) return setTagInput("");
                onSetTags([...(task.tags ?? []), v]);
                setTagInput("");
              }}
              placeholder={t("addTagPlaceholder")}
              className="h-7 w-28 border-0 bg-transparent px-1.5 text-right text-xs shadow-none focus-visible:ring-0"
            />
          </MetaRow>

          {/* Pomodoro — bajarilgan/taxminiy. Dars-manbali vazifada uzunlik VA soni
              qatʼiy (darsning oʻzidan kelib chiqadi — 1 dars = 1 seans, uzunligi
              dars vaqti), shuning uchun read-only. Baholash/tugʻilgan kun/qoʻlda
              vazifalarida oʻqituvchi ikkalasini ham erkin belgilaydi. */}
          <MetaRow icon={<Timer className="size-4" />} label={t("focusMetaLabel")}>
            {isLessonTask ? (
              <PomoDisplay
                completed={Math.floor(totalFocusMinutes(task) / Math.max(1, effectivePomoMin))}
                estimated={task.estPomos ?? 0}
                lengthLabel={formatMinutes(effectivePomoMin)}
                className="cursor-default px-1.5 py-1 opacity-80"
              />
            ) : (
            <Popover
              open={pomoOpen}
              onOpenChange={(open) => {
                setPomoOpen(open);
                if (open) {
                  // Eski vazifalarda estPomos 0 boʻlishi mumkin — roʻyxat 1 dan boshlanadi.
                  setPendingEstPomos(Math.max(1, task.estPomos ?? 1));
                  setPendingPomoMin(effectivePomoMin);
                }
              }}
            >
              <PopoverTrigger asChild>
                <button type="button" className="rounded-md transition-colors hover:bg-muted">
                  <PomoDisplay
                    completed={Math.floor(totalFocusMinutes(task) / Math.max(1, effectivePomoMin))}
                    estimated={task.estPomos ?? 0}
                    lengthLabel={formatMinutes(effectivePomoMin)}
                    className="px-1.5 py-1"
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-60 p-4">
                <div className="flex flex-col gap-4">
                  <div className="space-y-0.5 text-center">
                    <p className="heading-small">{t("estPomosTitle")}</p>
                    <TypographyMuted className="tabular-nums">
                      {t("estPomosFormula", {
                        count: pendingEstPomos,
                        length: formatMinutes(pendingPomoMin),
                        total: formatMinutes(pendingEstPomos * pendingPomoMin),
                      })}
                    </TypographyMuted>
                  </div>

                  {/* Ikki alohida gʻildirak-quti (Focus To-Do qolipi) — yozuvlar
                      qutilardan tashqarida, max-w bilan ataylab 2 qatorga
                      oʻtkaziladi (eni tejaladi).

                      DIQQAT — visibleCount: kutubxona konteyner balandligini halqa
                      radiusidan hisoblaydi (radius = itemHeight / (2·tan(π/N))),
                      shuning uchun N kichik boʻlsa quti siqilib qoladi (N=5 → ~65px).
                      N=16, h=28 → ~148px. N 4 ga karrali boʻlishi ham shart.

                      `infinite` faqat davomiylik gʻildiragida: 60→1 aylanishi
                      qulay deb topildi; soni (1–50) esa chegaralangan kattalik —
                      aylantirilsa 50 dan keyin 0 choki gʻalati koʻrinardi. */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center gap-2">
                      <WheelPickerWrapper className="rounded-lg bg-muted/50 px-2">
                        <WheelPicker
                          options={EST_POMO_OPTIONS}
                          value={String(pendingEstPomos)}
                          onValueChange={(v) => setPendingEstPomos(Number(v))}
                          visibleCount={16}
                          optionItemHeight={28}
                        />
                      </WheelPickerWrapper>
                      <span className="max-w-20 text-center text-xs leading-tight text-muted-foreground">
                        {t("estPomosLabel")}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <WheelPickerWrapper className="rounded-lg bg-muted/50 px-2">
                        <WheelPicker
                          options={POMO_LEN_OPTIONS}
                          value={String(pendingPomoMin)}
                          onValueChange={(v) => setPendingPomoMin(Number(v))}
                          visibleCount={16}
                          optionItemHeight={28}
                          infinite
                        />
                      </WheelPickerWrapper>
                      <span className="max-w-20 text-center text-xs leading-tight text-muted-foreground">
                        {t("pomoLengthLabel")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPomoOpen(false)}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        onSetEstPomos(pendingEstPomos);
                        if (!isLessonTask && pendingPomoMin !== pomoMinutes) onSetPomoMinutes(pendingPomoMin);
                        setPomoOpen(false);
                      }}
                    >
                      {t("confirmOk")}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            )}
          </MetaRow>

          {/* Sana va vaqt ikki alohida qatorga ajratilgan — bitta uzun satr
              (25-iyul, 14:15–15:00) tor panelda (sidebar ochiq) ikki qatorga
              buzilib, MetaRow'ning min-h-11 balandligiga sigʻmay kesilib
              qolardi. Ikkala qator ham xuddi shu TaskTimeCard popoverini
              ochadi — modelda alohida maydon yoʻq. */}
          <MetaRow icon={<CalendarClock className="size-4" />} label={t("dueLabel")}>
              {isManual ? (
                <>
                  <TaskTimeCard
                    value={{ dueDate: task.dueDate, dueMin: task.dueMin, dueEndMin: task.dueEndMin }}
                    onChange={onSetDueRange}
                    trigger={
                      <button
                        type="button"
                        className={cn(
                          "flex h-8 min-w-0 items-center truncate rounded px-2 text-sm hover:bg-muted",
                          !task.dueDate && "text-muted-foreground"
                        )}
                      >
                        {task.dueDate ? formatDateGroupLabel(task.dueDate) : "—"}
                      </button>
                    }
                  />
                  {task.dueDate && (
                    <button
                      type="button"
                      onClick={() => onSetDueDate(null)}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={t("clearDue")}
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </>
              ) : (
                <TypographyMuted className="truncate px-2">
                  {task.dueDate ? formatDateGroupLabel(task.dueDate) : "—"}
                </TypographyMuted>
              )}
            </MetaRow>

            {(isManual ? task.dueDate : task.dueMin != null) && (
              <MetaRow icon={<Clock className="size-4" />} label={t("timeRowLabel")}>
                {isManual ? (
                  <>
                    <TaskTimeCard
                      value={{ dueDate: task.dueDate, dueMin: task.dueMin, dueEndMin: task.dueEndMin }}
                      onChange={onSetDueRange}
                      trigger={
                        <button
                          type="button"
                          className={cn(
                            "flex h-8 min-w-0 items-center truncate rounded px-2 text-sm hover:bg-muted",
                            task.dueMin == null && "text-muted-foreground"
                          )}
                        >
                          {task.dueMin != null ? fmtDueRange(task) : "—"}
                        </button>
                      }
                    />
                    {task.dueMin != null && (
                      <button
                        type="button"
                        onClick={() =>
                          onSetDueRange({ dueDate: task.dueDate, dueMin: null, dueEndMin: null })
                        }
                        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={t("clearDue")}
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </>
                ) : (
                  <TypographyMuted className="truncate px-2">{fmtDueRange(task)}</TypographyMuted>
                )}
              </MetaRow>
            )}

            <MetaRow icon={<GraduationCap className="size-4" />} label={t("classLabel")}>
              {isManual ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-8 min-w-0 items-center gap-1.5 rounded px-2 text-sm hover:bg-muted"
                    >
                      {classInfo && classHex ? (
                        <>
                          <ClassSwatch hex={classHex} />
                          <span className="truncate">{classInfo.name}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">{t("noClass")}</span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => onSetClassId(null)}>{t("noClass")}</DropdownMenuItem>
                    {liveClasses.map((cls) => (
                      <DropdownMenuItem key={cls.id} onClick={() => onSetClassId(cls.id)} className="gap-2">
                        <ClassSwatch hex={CLASS_COLOR_HEX[classColor(cls)]} />
                        {cls.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex min-w-0 items-center gap-1.5 px-2">
                  {classInfo && classHex ? (
                    <>
                      <ClassSwatch hex={classHex} />
                      <span className="truncate text-sm">{classInfo.name}</span>
                    </>
                  ) : (
                    <TypographyMuted>{t("noClass")}</TypographyMuted>
                  )}
                </div>
              )}
            </MetaRow>

            <MetaRow icon={<SourceIcon kind={task.source.kind} className="size-4" />} label={t("sourceLabel")}>
              {sourceHref ? (
                <Link
                  href={sourceHref}
                  className="px-2 text-sm text-primary underline-offset-2 hover:underline"
                >
                  {t(`source.${task.source.kind}`)}
                </Link>
              ) : (
                <TypographyMuted className="px-2">{t(`source.${task.source.kind}`)}</TypographyMuted>
              )}
            </MetaRow>

            {isManual && (
              <MetaRow icon={<Repeat className="size-4" />} label={t("repeatLabel")}>
                <RepeatPicker
                  repeat={task.repeat ?? null}
                  refDate={task.dueDate}
                  onChange={onSetRepeat}
                  label={t("repeatNone")}
                />
              </MetaRow>
            )}

          {/* Fokusni boshlash — izoh ustida, alohida qator (Focus To-Do dan pastga koʻchirildi).
              Bajarilgan/bekor qilingan vazifada tugma yashirilmaydi — disabled holatda koʻrsatiladi. */}
          <div className="py-3">
            <Button
              type="button"
              variant="default"
              onClick={onStartFocus}
              disabled={done || task.status === "canceled"}
              className="w-full justify-center gap-2 disabled:bg-muted disabled:text-muted-foreground"
            >
              <Play className="size-3.5 fill-current" />
              {t("startFocus")}
            </Button>
          </div>

          {/* Izoh — panel tagidagi erkin matn (Focus To-Do RemarkItem) */}
          <div className="pt-3">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => note !== (task.note ?? "") && onSetNote(note)}
              placeholder={t("notePlaceholder")}
              className="min-h-24 resize-none border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
      </PanelBody>
      {/* Focus To-Do BottomBar: [yopish] [yaratilgan sana — markazda] [oʻchirish/bekor] */}
      <PanelFooter className="items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label={t("closeAria")}
              className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("closeAria")}</TooltipContent>
        </Tooltip>
        <TypographyMuted className="min-w-0 flex-1 truncate text-center">
          {(() => {
            const createdKey = dateToKey(new Date(task.createdAt));
            return createdKey === todayKeyOf()
              ? t("createdToday")
              : t("createdAt", { date: formatDateGroupLabel(createdKey) });
          })()}
        </TypographyMuted>
        {isManual ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteOpen(true)}
                aria-label={t("delete")}
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("delete")}</TooltipContent>
          </Tooltip>
        ) : task.status === "canceled" ? (
          <TypographyMuted className="shrink-0">{t("canceledLabel")}</TypographyMuted>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                aria-label={t("cancelAuto")}
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("cancelAuto")}</TooltipContent>
          </Tooltip>
        )}
      </PanelFooter>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteDialogDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                setDeleteOpen(false);
                onDelete();
              }}
            >
              {t("confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  );
}

type TaskRepeatUnit = "day" | "week" | "month";
const REPEAT_UNITS: TaskRepeatUnit[] = ["day", "week", "month"];

function RepeatPicker({
  repeat,
  refDate,
  onChange,
  label,
}: {
  repeat: Task["repeat"];
  refDate: string | null;
  onChange: (repeat: Task["repeat"]) => void;
  label: string;
}) {
  const t = useTranslations("TasksPage.detail");
  const [open, setOpen] = useState(false);
  const [every, setEvery] = useState(repeat?.every ?? 1);
  const [unit, setUnit] = useState<TaskRepeatUnit>(repeat?.unit ?? "week");

  useEffect(() => {
    setEvery(repeat?.every ?? 1);
    setUnit(repeat?.unit ?? "week");
  }, [repeat?.every, repeat?.unit]);

  const displayLabel = repeat
    ? recurrenceLabel(buildRule({ interval: repeat.every, unit: repeat.unit, weekdays: [], basis: "due" }), refDate)
    : label;

  const apply = (nextEvery: number, nextUnit: TaskRepeatUnit) => {
    setEvery(nextEvery);
    setUnit(nextUnit);
    onChange({ every: Math.max(1, nextEvery), unit: nextUnit });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-8 items-center gap-1.5 rounded px-2 text-sm hover:bg-muted",
            !repeat && "text-muted-foreground"
          )}
        >
          {displayLabel}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 space-y-3 p-3">
        <div className="flex items-center gap-2">
          <TypographyMuted>{t("repeatEvery")}</TypographyMuted>
          <Input
            type="number"
            min={1}
            max={30}
            value={every}
            onChange={(e) => apply(Number(e.target.value) || 1, unit)}
            className="h-8 w-16"
          />
        </div>
        <div className="grid grid-cols-3 gap-1">
          {REPEAT_UNITS.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => apply(every, u)}
              className={cn(
                "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                unit === u
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {t(`repeatUnit.${u}`)}
            </button>
          ))}
        </div>
        {repeat && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-1.5 text-muted-foreground hover:text-destructive"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            <X className="size-3.5" /> {t("repeatClear")}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Focus To-Do qolipi: har bir rejalashtirilgan pomodoro — bitta doiracha,
    bajarilgani toʻliq primary, qolgani border rangida. 5 tadan koʻpiga qator
    sigʻmaydi — u holda PomoDisplay faqat raqamli koʻrinishga tushadi. */
const POMO_DOTS_MAX = 5;

function PomoDots({ completed, estimated }: { completed: number; estimated: number }) {
  return (
    <span className="flex items-center gap-1">
      {Array.from({ length: estimated }, (_, i) => (
        <span
          key={i}
          className={cn(
            "size-2 shrink-0 rounded-full",
            i < completed ? "bg-primary" : "bg-border"
          )}
        />
      ))}
    </span>
  );
}

function PomoDisplay({
  completed,
  estimated,
  lengthLabel,
  className,
}: {
  completed: number;
  estimated: number;
  lengthLabel: string;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      {estimated > 0 && estimated <= POMO_DOTS_MAX ? (
        <PomoDots completed={completed} estimated={estimated} />
      ) : null}
      <span className="text-sm font-semibold tabular-nums">
        {completed}
        <span className="text-muted-foreground/50">/</span>
        {estimated}
      </span>
      <span className="text-xs text-muted-foreground">· {lengthLabel}</span>
    </span>
  );
}

function SourceIcon({ kind, className }: { kind: Task["source"]["kind"]; className?: string }) {
  if (kind === "lesson") return <BookOpen className={className} />;
  if (kind === "grading") return <ClipboardCheck className={className} />;
  if (kind === "birthday") return <Cake className={className} />;
  return <Pencil className={className} />;
}

/* Focus To-Do uslubi: ikon + yorliq chapda, qiymat oʻng chetda. */
function MetaRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 py-1">
      <span className="flex shrink-0 items-center gap-2.5 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-1">{children}</div>
    </div>
  );
}
