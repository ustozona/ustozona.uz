"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  Cake,
  CalendarClock,
  ClipboardCheck,
  Flag,
  GraduationCap,
  Pencil,
  Repeat,
  Trash2,
  X,
} from "lucide-react";
import { Panel, PanelHeader, PanelBody, PanelFooter } from "@/components/ui/panel";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateKeyPicker } from "@/components/ui/date-key-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ClassSwatch } from "@/components/ClassSwatch";
import { TypographyLabel, TypographyMuted } from "@/components/ui/typography";
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
  formatDateGroupLabel,
  PRIORITY_META,
  PRIORITY_ORDER,
  TAG_PILL_CLASS,
  type Task,
  type TaskPriority,
} from "@/lib/tasks-data";

function fmtDueMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function TaskDetail({
  task,
  onToggleStatus,
  onSetPriority,
  onSetDueDate,
  onSetClassId,
  onSetNote,
  onSetTitle,
  onSetTags,
  onSetRepeat,
  onDelete,
  onCancel,
}: {
  task: Task | null;
  onToggleStatus: () => void;
  onSetPriority: (p: TaskPriority) => void;
  onSetDueDate: (key: string | null) => void;
  onSetClassId: (id: string | null) => void;
  onSetNote: (note: string) => void;
  onSetTitle: (title: string) => void;
  onSetTags: (tags: string[]) => void;
  onSetRepeat: (repeat: Task["repeat"]) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("TasksPage.detail");
  const liveClasses = useLiveClasses();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [note, setNote] = useState(task?.note ?? "");
  const [title, setTitle] = useState(task?.title ?? "");
  const [tagInput, setTagInput] = useState("");

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
            <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
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
      <PanelHeader
        divider
        title={
          <div className="flex min-w-0 items-center gap-2.5">
            <Checkbox
              checked={done}
              onCheckedChange={onToggleStatus}
              className="size-5 shrink-0 rounded-full"
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
          </div>
        }
      />
      <PanelBody inset>
        <div className="flex flex-col gap-5">
          {/* Meta qatorlari */}
          <div className="flex flex-col gap-1">
            <MetaRow icon={<CalendarClock className="size-4" />} label={t("dueLabel")}>
              {isManual ? (
                <>
                  <DateKeyPicker
                    value={task.dueDate ?? ""}
                    onChange={(key) => onSetDueDate(key)}
                    className="h-8 border-0 px-2 shadow-none hover:bg-muted"
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
                <TypographyMuted className="px-2">
                  {task.dueDate ? formatDateGroupLabel(task.dueDate) : "—"}
                  {task.dueMin != null ? `, ${fmtDueMin(task.dueMin)}` : ""}
                </TypographyMuted>
              )}
            </MetaRow>

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

            <MetaRow icon={<Flag className="size-4" />} label={t("priorityLabel")}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-8 items-center gap-1.5 rounded px-2 text-sm hover:bg-muted"
                  >
                    <span className={cn("size-2 shrink-0 rounded-full", prio.dot)} />
                    <span className={prio.text}>{t(`priority.${task.priority}`)}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {PRIORITY_ORDER.map((p) => (
                    <DropdownMenuItem key={p} onClick={() => onSetPriority(p)} className="gap-2">
                      <span className={cn("size-2 shrink-0 rounded-full", PRIORITY_META[p].dot)} />
                      {t(`priority.${p}`)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
          </div>

          {/* Teglar */}
          <div className="flex flex-col gap-1.5">
            <TypographyLabel>{t("tagsLabel")}</TypographyLabel>
            <div className="flex flex-wrap items-center gap-1.5">
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
                className="h-7 w-32 border-0 bg-transparent px-1.5 text-xs shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Izoh */}
          <div className="flex flex-col gap-1.5">
            <TypographyLabel>{t("noteLabel")}</TypographyLabel>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => note !== (task.note ?? "") && onSetNote(note)}
              placeholder={t("notePlaceholder")}
              className="min-h-24 resize-none shadow-none"
            />
          </div>
        </div>
      </PanelBody>
      <PanelFooter className="justify-between">
        <TypographyMuted>
          {t("createdAt", { date: new Date(task.createdAt).toLocaleDateString() })}
        </TypographyMuted>
        {isManual ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" /> {t("delete")}
          </Button>
        ) : task.status === "canceled" ? (
          <TypographyMuted>{t("canceledLabel")}</TypographyMuted>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <Pencil className="size-4" /> {t("cancelAuto")}
          </Button>
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

function SourceIcon({ kind, className }: { kind: Task["source"]["kind"]; className?: string }) {
  if (kind === "lesson") return <BookOpen className={className} />;
  if (kind === "grading") return <ClipboardCheck className={className} />;
  if (kind === "birthday") return <Cake className={className} />;
  return <Pencil className={className} />;
}

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
    <div className="grid grid-cols-[6.5rem_1fr] items-center gap-2">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="flex min-w-0 items-center gap-1">{children}</div>
    </div>
  );
}
