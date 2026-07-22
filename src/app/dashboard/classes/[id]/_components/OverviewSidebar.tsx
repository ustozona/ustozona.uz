"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { FileText, CheckSquare, ChevronRight, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TypographyMuted } from "@/components/ui/typography";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyContent,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { panelCardClass } from "@/components/DashboardPage";
import { cn } from "@/lib/utils";
import { MONTHS_UZ_SHORT } from "@/lib/localization";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { lessonClassIds } from "@/lib/lessons-data";
import { useLessonStore } from "@/store/useLessonStore";
import { useTaskStore } from "@/store/useTaskStore";
import { TASK_STATUS, PRIORITY_STYLES } from "@/lib/tasks-data";
import type { ClassIdentity } from "@/lib/class-id";
import { useClassNotesStore } from "@/store/useClassNotesStore";
import { useMounted } from "@/lib/use-mounted";

type Tab = "notes" | "tasks";

/** "YYYY-MM-DD" → mahalliy Date (UTC siljishisiz). */
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
/** Qisqa sana yorligʻi (masalan "3-iyun"). */
function shortDate(s: string): string {
  const [, m, d] = s.split("-").map(Number);
  return `${d}-${MONTHS_UZ_SHORT[(m || 1) - 1]}`;
}

export function OverviewSidebar({ identity }: { identity: ClassIdentity }) {
  const t = useTranslations("OverviewSidebar");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tab, setTab] = useState<Tab>("notes");
  const hex = CLASS_COLOR_HEX[identity.color];

  // Persist tiklanmaguncha (mount) SSR seed bilan mos placeholder.
  const mounted = useMounted();

  // Eslatma — sinf boʻyicha persist (yoʻqolmaydi).
  const note = useClassNotesStore((s) => s.notes[identity.id]) ?? "";
  const setNote = useClassNotesStore((s) => s.setNote);

  // Kalendar markerlari — shu sinfning rejalashtirilgan dars kunlari.
  const lessons = useLessonStore((s) => s.lessons);
  const lessonDays = useMemo(() => {
    if (!mounted) return [] as Date[];
    return lessons
      .filter((l) => lessonClassIds(l).includes(identity.id) && l.scheduledDate)
      .map((l) => parseLocalDate(l.scheduledDate as string));
  }, [mounted, lessons, identity.id]);

  // Vazifalar — shu sinfga biriktirilgan (classIds), bajarilmaganlar tepada.
  const tasks = useTaskStore((s) => s.tasks);
  const toggleTaskDone = useTaskStore((s) => s.toggleTaskDone);
  const classTasks = useMemo(() => {
    if (!mounted) return [];
    const mine = tasks.filter((task) => task.classIds.includes(identity.id));
    const rank = (s: string) => (s === TASK_STATUS.DONE || s === TASK_STATUS.CANCELED ? 1 : 0);
    return mine.sort((a, b) => {
      const r = rank(a.status) - rank(b.status);
      if (r !== 0) return r;
      return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
    });
  }, [mounted, tasks, identity.id]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6">
      {/* Calendar */}
      <Card className="shrink-0 p-2 shadow-none">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="w-full bg-transparent"
          modifiers={{ lesson: lessonDays }}
          modifiersStyles={{ lesson: { fontWeight: 700, color: hex } }}
        />
        <div className="flex items-center gap-1.5 px-2 pb-1 pt-0.5">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: hex }} />
          <TypographyMuted className="text-[11px]">{t("lessonDaysLegend")}</TypographyMuted>
        </div>
      </Card>

      {/* Notes / Tasks */}
      <Card className={panelCardClass}>
        <div className="shrink-0 border-b border-border px-4 py-3 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground">
            {tab === "notes" ? t("notesTab") : t("tasksTab")}
            {tab === "tasks" && classTasks.length > 0 && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground tabular-nums">
                {classTasks.length}
              </span>
            )}
          </span>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/60">
            <button
              type="button"
              onClick={() => setTab("notes")}
              title={t("notesTab")}
              className={cn(
                "size-7 rounded-md flex items-center justify-center transition-colors",
                tab === "notes"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setTab("tasks")}
              title={t("tasksTab")}
              className={cn(
                "size-7 rounded-md flex items-center justify-center transition-colors",
                tab === "tasks"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CheckSquare className="size-4" />
            </button>
          </div>
        </div>

        {tab === "notes" ? (
          <div className="flex-1 min-h-0 p-4">
            <Textarea
              value={mounted ? note : ""}
              onChange={(e) => setNote(identity.id, e.target.value)}
              placeholder={t("notesPlaceholder")}
              className="h-full resize-none border-0 shadow-none px-0 focus-visible:ring-0 bg-transparent"
            />
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3">
              {!mounted ? null : classTasks.length === 0 ? (
                <Empty className="p-6">
                  <EmptyHeader>
                    <EmptyMedia><Illustration name="30" className="h-32 text-black dark:text-white" /></EmptyMedia>
                    <EmptyTitle>{t("tasksEmptyTitle")}</EmptyTitle>
                  </EmptyHeader>
                  <EmptyContent>
                    <Link
                      href="/dashboard/tasks"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      {t("tasksSectionLink")}
                      <ChevronRight className="size-3.5" />
                    </Link>
                  </EmptyContent>
                </Empty>
              ) : (
                <div className="space-y-1">
                  {classTasks.map((task) => {
                    const done = task.status === TASK_STATUS.DONE;
                    const canceled = task.status === TASK_STATUS.CANCELED;
                    return (
                      <div
                        key={task.id}
                        className="group flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => toggleTaskDone(task.id)}
                          title={done ? t("markUndone") : t("markDone")}
                          className={cn(
                            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                            done ? "border-transparent text-white" : "border-muted-foreground/40 hover:border-foreground"
                          )}
                          style={done ? { backgroundColor: hex } : undefined}
                        >
                          {done && <Check className="size-3" strokeWidth={3} />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-sm leading-snug",
                              done || canceled ? "text-muted-foreground line-through" : "text-foreground"
                            )}
                          >
                            {task.title}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            {task.priority !== "none" && (
                              <span className={cn("size-1.5 rounded-full shrink-0", PRIORITY_STYLES[task.priority].dot)} />
                            )}
                            {task.dueDate && (
                              <TypographyMuted className="text-[11px] tabular-nums">
                                {shortDate(task.dueDate)}
                              </TypographyMuted>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
