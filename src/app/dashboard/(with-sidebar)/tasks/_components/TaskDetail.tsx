"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarClock, Flag, GraduationCap, Pencil, Sparkles, Trash2, X } from "lucide-react";
import { Panel, PanelHeader, PanelBody, PanelFooter } from "@/components/ui/panel";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DateKeyPicker } from "@/components/ui/date-key-picker";
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
import { PRIORITY_META, PRIORITY_ORDER, type Task, type TaskPriority } from "@/lib/tasks-data";

export function TaskDetail({
  task,
  onToggleStatus,
  onSetPriority,
  onSetDueDate,
  onSetClassId,
  onSetNote,
  onSetTitle,
  onDelete,
}: {
  task: Task | null;
  onToggleStatus: () => void;
  onSetPriority: (p: TaskPriority) => void;
  onSetDueDate: (key: string | null) => void;
  onSetClassId: (id: string | null) => void;
  onSetNote: (note: string) => void;
  onSetTitle: (title: string) => void;
  onDelete: () => void;
}) {
  const t = useTranslations("TasksPage.detail");
  const liveClasses = useLiveClasses();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [note, setNote] = useState(task?.note ?? "");
  const [title, setTitle] = useState(task?.title ?? "");

  useEffect(() => {
    setNote(task?.note ?? "");
    setTitle(task?.title ?? "");
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
            </MetaRow>

            <MetaRow icon={<GraduationCap className="size-4" />} label={t("classLabel")}>
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

            <MetaRow icon={<Sparkles className="size-4" />} label={t("sourceLabel")}>
              <TypographyMuted className="px-2">
                {t(`source.${task.source.kind}`)}
              </TypographyMuted>
            </MetaRow>
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
        ) : (
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
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
