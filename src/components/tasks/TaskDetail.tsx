"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { X, Clock, Play, Pause, RotateCcw, MessageSquare, Paperclip, Check, Trash2, Calendar, Tag, Flag, Plus, MoreHorizontal, Users, CheckCircle2, ListChecks, ClipboardList, GraduationCap, Repeat, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TypographyH3, TypographyLabel, TypographyMuted } from "@/components/ui/typography";
import { SectionIcon } from "@/components/ui/section-icon";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription,
} from "@/components/ui/empty";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { type DateRange } from "react-day-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format, parseISO, addDays } from "date-fns";
import { uz } from "date-fns/locale";
import { useTaskStore } from "@/store/useTaskStore";
import { TASK_STATUS, PRIORITY_STYLES, STATUS_LABELS, STATUS_STYLES, ASSIGNEES } from "@/lib/tasks-data";
import { classColor } from "@/lib/grades-data";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { ClassSwatch } from "@/components/ClassSwatch";
import { RecurrenceEditor } from "@/components/tasks/RecurrenceEditor";
import { recurrenceLabel } from "@/lib/recurrence";

const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;

export default function TaskDetail() {
  const liveClasses = useLiveClasses();
  const tasks = useTaskStore(s => s.tasks);
  const selectedTaskId = useTaskStore(s => s.selectedTaskId);
  const setSelectedTaskId = useTaskStore(s => s.setSelectedTaskId);
  const updateTask = useTaskStore(s => s.updateTask);
  const deleteTask = useTaskStore(s => s.deleteTask);
  const toggleTaskDone = useTaskStore(s => s.toggleTaskDone);
  const addComment = useTaskStore(s => s.addComment);
  const deleteComment = useTaskStore(s => s.deleteComment);
  const addPomodoroSession = useTaskStore(s => s.addPomodoroSession);
  const addSubtask = useTaskStore(s => s.addSubtask);
  const toggleSubtaskDone = useTaskStore(s => s.toggleSubtaskDone);
  const deleteSubtask = useTaskStore(s => s.deleteSubtask);

  const task = useMemo(() => tasks.find(t => t.id === selectedTaskId), [tasks, selectedTaskId]);

  const [commentText, setCommentText] = useState("");
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [tagText, setTagText] = useState("");
  const [descOpen, setDescOpen] = useState(false);
  const [subtasksOpen, setSubtasksOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  // Pomodoro states
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  const [timeLeft, setTimeLeft] = useState(FOCUS_MINUTES * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop timer if task changes
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setTimerMode("focus");
    setTimeLeft(FOCUS_MINUTES * 60);
    // Boʻlimlar yopiq holatga qaytadi; kontent boʻlsa render oʻzi ochadi.
    setDescOpen(false);
    setSubtasksOpen(false);
    setCommentsOpen(false);
    setTagText("");
  }, [selectedTaskId]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsActive(false);

      if (timerMode === "focus" && task) {
        addPomodoroSession(task.id, {
          startedAt: new Date(Date.now() - FOCUS_MINUTES * 60 * 1000).toISOString(),
          durationMin: FOCUS_MINUTES,
          type: "focus"
        });
        setTimerMode("break");
        setTimeLeft(BREAK_MINUTES * 60);
      } else {
        setTimerMode("focus");
        setTimeLeft(FOCUS_MINUTES * 60);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, timerMode, task, addPomodoroSession]);

  // Auto-resize textareas
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = "inherit";
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [task?.title]);

  useEffect(() => {
    if (descRef.current) {
      descRef.current.style.height = "inherit";
      descRef.current.style.height = `${Math.max(descRef.current.scrollHeight, 80)}px`;
    }
  }, [task?.description]);

  if (!task) {
    return (
      <Empty className="h-full bg-card rounded-xl card-elevation">
        <EmptyHeader>
          <EmptyMedia variant="icon"><ClipboardList /></EmptyMedia>
          <EmptyTitle>Vazifa tanlanmagan</EmptyTitle>
          <EmptyDescription>Tafsilotlarni koʻrish uchun roʻyxatdan vazifani tanlang.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const isDone = task.status === TASK_STATUS.DONE;
  const isCanceled = task.status === TASK_STATUS.CANCELED;
  const priorityStyle = PRIORITY_STYLES[task.priority];

  // Stats
  const focusSessions = task.pomodoroSessions.filter(s => s.type === "focus");
  const totalFocusMin = focusSessions.reduce((acc, s) => acc + s.durationMin, 0);
  const completedPomodoros = focusSessions.length;

  // Subtasks
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(st => st.isDone).length;
  const subtaskProgress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment(task.id, commentText.trim());
    setCommentText("");
  };

  const totalTimeLabel = totalFocusMin > 60
    ? `${Math.floor(totalFocusMin / 60)}s ${totalFocusMin % 60}d`
    : `${totalFocusMin} daqiqa`;

  const totalSecs = timerMode === "focus" ? FOCUS_MINUTES * 60 : BREAK_MINUTES * 60;
  const ringDashoffset = 283 - (283 * (timeLeft / totalSecs));

  // Class names
  const selectedClassObjs = liveClasses.filter(c => task.classIds?.includes(c.id));
  const className = selectedClassObjs.length > 0 ? selectedClassObjs.map(c => c.name).join(", ") : "Umumiy";

  // Overdue check
  const todayStr = new Date().toISOString().split("T")[0];
  const isOverdue = task.dueDate && task.dueDate < todayStr && !isDone;
  const overdueDays = isOverdue && task.dueDate
    ? Math.round((Date.parse(todayStr) - Date.parse(task.dueDate)) / 86400000)
    : 0;

  // Takrorlanish yorligʻi
  const recurLabel = task.recurrenceRule ? recurrenceLabel(task.recurrenceRule, task.dueDate) : null;

  return (
    <div className="h-full bg-card rounded-xl card-elevation flex flex-col overflow-hidden min-w-0 relative">

      {/* ── Header ── */}
      <div className="px-5 py-5 flex items-center justify-between shrink-0 gap-3 border-b border-border bg-card min-h-[4.5rem] z-10 relative">
        <div className="flex items-center gap-3 min-w-0">
          <SectionIcon><ClipboardList /></SectionIcon>
          <CardTitle className="truncate">Vazifa tafsiloti</CardTitle>
          {isActive && (
            <Badge variant="secondary" className="px-2 py-0.5 rounded-md text-xs font-medium text-primary bg-primary/10 animate-pulse gap-1.5">
              <Clock className="size-3" />
              {formatTime(timeLeft)}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSelectedTaskId(null)} className="size-9 text-muted-foreground hover:text-foreground rounded-lg">
          <X className="size-4" />
        </Button>
        {/* Subtask Progress Bar */}
        {subtasks.length > 0 && (
          <div className="absolute bottom-0 left-0 h-[2px] w-full bg-transparent overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 min-h-0 relative">
        <ScrollArea className="h-full w-full">
          <div className="px-5 py-5 pb-20 space-y-5">

            {/* ─ Title Row ─ */}
            <div className="flex items-start gap-3">
              <div className="mt-[2px] shrink-0">
                {isCanceled ? (
                  <div className="size-[18px] rounded-full border-2 border-destructive flex items-center justify-center text-destructive bg-destructive/10 cursor-pointer" onClick={() => updateTask(task.id, { status: TASK_STATUS.TODO })}>
                    <X className="size-3" strokeWidth={3} />
                  </div>
                ) : (
                  <Checkbox
                    checked={isDone}
                    onCheckedChange={() => toggleTaskDone(task.id)}
                    className="size-[18px] rounded-full border-2 data-[state=checked]:border-success data-[state=checked]:bg-success"
                  />
                )}
              </div>
              <textarea
                ref={titleRef}
                value={task.title}
                onChange={e => updateTask(task.id, { title: e.target.value })}
                placeholder="Vazifa nomi..."
                rows={1}
                className={cn(
                  "w-full text-base font-semibold tracking-tight text-foreground/95 bg-transparent border-none outline-none resize-none leading-snug placeholder:text-muted-foreground/30",
                  isDone && "line-through text-muted-foreground"
                )}
              />
            </div>

            {/* ─ Properties (1-col Notion-style rows) ─ */}
            <div className="divide-y divide-border/40 text-sm">

              {/* Holat */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center py-1.5 px-2 -mx-2 rounded-md hover:bg-muted/40 transition-colors cursor-pointer group">
                    <div className="w-[140px] flex items-center gap-2.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                      <CheckCircle2 className="size-4" />
                      <span className="text-sm font-medium">Holat</span>
                    </div>
                    <div className={cn("flex-1 text-sm font-medium flex items-center gap-2 truncate", STATUS_STYLES[task.status].text)}>
                      {STATUS_LABELS[task.status]}
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  {Object.values(TASK_STATUS).map(st => (
                    <DropdownMenuItem key={st} onClick={() => updateTask(task.id, { status: st, completedAt: st === TASK_STATUS.DONE ? new Date().toISOString() : null })}>
                      <span className={cn("size-2 rounded-full mr-2", STATUS_STYLES[st].bg.replace('/10', ''))} />
                      {STATUS_LABELS[st]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sana */}
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center py-1.5 px-2 -mx-2 rounded-md hover:bg-muted/40 transition-colors cursor-pointer group">
                    <div className="w-[140px] flex items-center gap-2.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                      <Calendar className="size-4" />
                      <span className="text-sm font-medium">Sana</span>
                    </div>
                    <div className={cn(
                      "flex-1 flex items-center gap-2 min-w-0 text-sm font-medium",
                      isOverdue ? "text-destructive" : task.dueDate ? "text-foreground" : "text-muted-foreground"
                    )}>
                      <span className="truncate">
                        {task.dueDate ? (
                          task.endDate ? (
                            `${format(parseISO(task.dueDate), "d-MMM", { locale: uz })} — ${format(parseISO(task.endDate), "d-MMM, yyyy", { locale: uz })}`
                          ) : (
                            `${format(parseISO(task.dueDate), "d-MMMM, yyyy", { locale: uz })}${task.dueTime ? `, ${task.dueTime}` : ""}`
                          )
                        ) : "Tanlash..."}
                      </span>
                      {isOverdue && (
                        <span className="shrink-0 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] font-semibold text-destructive">
                          {overdueDays} kun kechikkan
                        </span>
                      )}
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto max-h-[var(--radix-popover-content-available-height)] overflow-y-auto p-0 flex flex-col shadow-lg rounded-xl"
                  side="left"
                  align="start"
                  sideOffset={8}
                  collisionPadding={16}
                >
                  <CalendarComponent
                    mode="range"
                    selected={{
                      from: task.dueDate ? parseISO(task.dueDate) : undefined,
                      to: task.endDate ? parseISO(task.endDate) : undefined
                    }}
                    onSelect={(range: DateRange | undefined) => {
                      updateTask(task.id, {
                        dueDate: range?.from ? format(range.from, "yyyy-MM-dd") : null,
                        endDate: range?.to ? format(range.to, "yyyy-MM-dd") : null
                      });
                    }}
                    autoFocus
                    locale={uz}
                    className="p-3"
                  />

                  <div className="px-3 pb-3 pt-2 border-t border-border/40 bg-muted/10 flex flex-col gap-3 rounded-b-xl">
                    {/* Vaqt tanlash (Faqat bitta kun tanlansa) */}
                    {task.dueDate && !task.endDate && (
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="size-3.5" />
                          <span className="text-xs font-medium">Vaqt</span>
                        </div>
                        <Input
                          type="time"
                          value={task.dueTime || ""}
                          onChange={(e) => updateTask(task.id, { dueTime: e.target.value })}
                          className="w-[110px] h-8 text-xs bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary/30"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: "Bugun", days: 0 },
                        { label: "Ertaga", days: 1 },
                        { label: "1 hafta", days: 7 },
                      ].map((p) => (
                        <Button
                          key={p.days}
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-normal bg-background border-border/60 hover:bg-muted"
                          onClick={() => updateTask(task.id, {
                            dueDate: format(addDays(new Date(), p.days), "yyyy-MM-dd"),
                            endDate: null,
                            dueTime: null
                          })}
                        >{p.label}</Button>
                      ))}
                    </div>

                    {task.dueDate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => updateTask(task.id, { dueDate: null, endDate: null, dueTime: null })}
                      >
                        Sanani tozalash
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Ustuvorlik */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center py-1.5 px-2 -mx-2 rounded-md hover:bg-muted/40 transition-colors cursor-pointer group">
                    <div className="w-[140px] flex items-center gap-2.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                      <Flag className="size-4" />
                      <span className="text-sm font-medium">Ustuvorlik</span>
                    </div>
                    <div className={cn("flex-1 text-sm font-medium flex items-center gap-2 truncate",
                      task.priority === "none" ? "text-muted-foreground" : priorityStyle.text
                    )}>
                      <Flag className={cn("size-3.5",
                        task.priority === "high" ? "fill-destructive text-destructive" :
                          task.priority === "medium" ? "fill-warning text-warning" :
                            task.priority === "low" ? "fill-info text-info" : "text-muted-foreground"
                      )} />
                      {task.priority === "none" ? "Yoʻq" : task.priority === "high" ? "Yuqori" : task.priority === "medium" ? "Oʻrta" : "Past"}
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => updateTask(task.id, { priority: "high" })}>
                    <Flag className="size-3.5 fill-destructive text-destructive mr-2" /> Yuqori
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateTask(task.id, { priority: "medium" })}>
                    <Flag className="size-3.5 fill-warning text-warning mr-2" /> Oʻrta
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateTask(task.id, { priority: "low" })}>
                    <Flag className="size-3.5 fill-info text-info mr-2" /> Past
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => updateTask(task.id, { priority: "none" })}>
                    <Flag className="size-3.5 text-muted-foreground mr-2" /> Yoʻq
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sinf */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center py-1.5 px-2 -mx-2 rounded-md hover:bg-muted/40 transition-colors cursor-pointer group">
                    <div className="w-[140px] flex items-center gap-2.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                      <GraduationCap className="size-4" />
                      <span className="text-sm font-medium">Sinf</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 text-sm font-medium text-foreground min-w-0">
                      {selectedClassObjs.length > 0 ? (
                        <div className="flex items-center gap-2 truncate">
                          <div className="flex -space-x-1 shrink-0">
                            {selectedClassObjs.map(cls => (
                              <ClassSwatch key={cls.id} hex={CLASS_COLOR_HEX[classColor(cls)]} className="size-2.5 border border-card" />
                            ))}
                          </div>
                          <span className="truncate">{className}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground truncate">
                          <span className="size-2.5 rounded-[4px] shrink-0 border-2 border-muted-foreground/30 bg-transparent" />
                          <span>Umumiy</span>
                        </div>
                      )}
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[260px]">
                  {liveClasses.map(c => {
                    const hex = CLASS_COLOR_HEX[classColor(c)];
                    return (
                      <DropdownMenuItem key={c.id} onSelect={() => {
                        const current = task.classIds ?? [];
                        const newIds = current.includes(c.id)
                          ? current.filter(id => id !== c.id)
                          : [...current, c.id];
                        updateTask(task.id, { classIds: newIds });
                      }}>
                        <div className="flex items-center gap-2.5 w-full">
                          <ClassSwatch hex={hex} className="size-2.5" />
                          <span className="flex-1">{c.name}</span>
                          {task.classIds?.includes(c.id) && (
                            <Check className="size-4 text-primary" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>



              {/* Takrorlanish */}
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center py-1.5 px-2 -mx-2 rounded-md hover:bg-muted/40 transition-colors cursor-pointer group">
                    <div className="w-[140px] flex items-center gap-2.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                      <Repeat className="size-4" />
                      <span className="text-sm font-medium">Takrorlanish</span>
                    </div>
                    <div className={cn(
                      "flex-1 text-sm font-medium truncate flex items-center gap-2",
                      recurLabel ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {recurLabel ?? "Yoʻq"}
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[280px] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto p-2"
                  side="left"
                  align="start"
                  sideOffset={8}
                  collisionPadding={16}
                >
                  <RecurrenceEditor
                    value={task.recurrenceRule ?? null}
                    refISO={task.dueDate}
                    onChange={(rule) => updateTask(task.id, { recurrenceRule: rule, isRecurring: !!rule })}
                  />
                </PopoverContent>
              </Popover>

              {/* Pomodoro — ikkilamchi: faqat footer "Taymer" tugmasidan ochiladi
                  (controlled). Asosiy metadata roʻyxatidan olib tashlandi. */}
              <Dialog open={isPomodoroOpen} onOpenChange={setIsPomodoroOpen}>
                <DialogContent className="sm:max-w-xs">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                      <Clock className="size-4 text-primary" /> Pomodoro Taymer
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center py-4">
                    <div className="relative size-36 flex items-center justify-center mb-5">
                      <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                        <circle
                          cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                          strokeDasharray="283" strokeDashoffset={ringDashoffset}
                          className={cn("transition-[stroke-dashoffset] duration-1000 ease-linear", timerMode === "focus" ? "text-primary" : "text-success")}
                        />
                      </svg>
                      <div className="text-3xl font-bold tracking-tighter tabular-nums z-10">
                        {formatTime(timeLeft)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 mb-5">
                      <Button variant="outline" size="icon" className="size-9 rounded-full" onClick={() => {
                        setTimeLeft(timerMode === "focus" ? FOCUS_MINUTES * 60 : BREAK_MINUTES * 60);
                        setIsActive(false);
                      }}>
                        <RotateCcw className="size-3.5" />
                      </Button>
                      <Button
                        className={cn("w-28 rounded-full h-9 gap-2 font-semibold text-sm", timerMode === "focus" ? "" : "bg-success text-success-foreground hover:bg-success/90")}
                        onClick={() => setIsActive(!isActive)}
                        variant={timerMode === "focus" ? "default" : "secondary"}
                      >
                        {isActive ? <Pause className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current" />}
                        {isActive ? "Pauza" : "Boshlash"}
                      </Button>
                    </div>
                    <div className="flex items-center gap-1 p-1 rounded-full bg-muted w-full max-w-[180px]">
                      <button
                        className={cn("flex-1 text-xs font-semibold py-1.5 rounded-full transition-all", timerMode === "focus" ? "bg-background shadow text-foreground" : "text-muted-foreground")}
                        onClick={() => { setTimerMode("focus"); setTimeLeft(FOCUS_MINUTES * 60); setIsActive(false); }}
                      >Diqqat</button>
                      <button
                        className={cn("flex-1 text-xs font-semibold py-1.5 rounded-full transition-all", timerMode === "break" ? "bg-background shadow text-foreground" : "text-muted-foreground")}
                        onClick={() => { setTimerMode("break"); setTimeLeft(BREAK_MINUTES * 60); setIsActive(false); }}
                      >Tanaffus</button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 tabular-nums">
                      {completedPomodoros}/{task.estimatedPomodoros || "—"} sessiya · {totalTimeLabel}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Mas'ullar */}
              <div className="flex items-center py-1.5 px-2 -mx-2 rounded-md hover:bg-muted/40 transition-colors group">
                <div className="w-[140px] flex items-center gap-2.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                  <Users className="size-4" />
                  <span className="text-sm font-medium">Mas'ullar</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Select
                    value=""
                    onValueChange={(val) => {
                      if (!val) return;
                      const current = task.assigneeIds || [];
                      const newIds = current.includes(val)
                        ? current.filter(id => id !== val)
                        : [...current, val];
                      updateTask(task.id, { assigneeIds: newIds });
                    }}
                  >
                    <SelectTrigger
                      className="border-none shadow-none bg-transparent h-auto p-0 focus:ring-0 focus:ring-offset-0 hover:bg-transparent [&>svg]:hidden w-full"
                    >
                      <SelectValue asChild>
                        <div>
                          {task.assigneeIds && task.assigneeIds.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <AvatarGroup>
                                {task.assigneeIds.map(id => {
                                  const assignee = ASSIGNEES.find(a => a.id === id);
                                  return assignee ? (
                                    <Avatar key={id} size="sm" title={assignee.name}>
                                      <AvatarFallback className="bg-primary/15 text-primary font-semibold text-[10px]">{assignee.initials}</AvatarFallback>
                                    </Avatar>
                                  ) : null;
                                })}
                              </AvatarGroup>
                              <span className="text-xs text-muted-foreground">
                                {task.assigneeIds.map(id => ASSIGNEES.find(a => a.id === id)?.name).filter(Boolean).join(", ")}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <div className="size-5 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center shrink-0">
                                <Plus className="size-3 text-muted-foreground/70" />
                              </div>
                              <span className="text-xs">Qoʻshish</span>
                            </div>
                          )}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      className="[&_*[role=option]]:pr-8 [&_*[role=option]]:pl-2 [&_*[role=option]>span]:right-2 [&_*[role=option]>span]:left-auto [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 data-[state=open]:slide-in-from-bottom-8 data-[state=open]:zoom-in-100 duration-400 w-[200px]"
                      align="end"
                    >
                      <SelectGroup>
                        <SelectLabel className="pl-2">Mas'ulni tanlang</SelectLabel>
                        {ASSIGNEES.map(a => (
                          <SelectItem key={a.id} value={a.id}>
                            <Avatar size="sm">
                              <AvatarFallback className="bg-primary/15 text-primary font-semibold text-[10px]">{a.initials}</AvatarFallback>
                            </Avatar>
                            <span className="flex-1">{a.name}</span>
                            {task.assigneeIds?.includes(a.id) && <Check className="size-3.5 text-primary ml-1" />}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      {(task.assigneeIds?.length ?? 0) > 0 && (
                        <>
                          <div className="my-1 h-px bg-border" />
                          <button
                            className="w-full px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors text-left"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              updateTask(task.id, { assigneeIds: [] });
                            }}
                          >
                            Barchani olib tashlash
                          </button>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

            </div>

            {/* ─ Subtasks (Description dan OLDIN) ─ */}
            {(subtasks.length > 0 || subtasksOpen) ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks className="size-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground/80">Ost vazifalar</span>
                </div>
                {subtasks.length > 0 && (
                  <span className="text-caption tabular-nums">
                    {completedSubtasks}/{subtasks.length}
                  </span>
                )}
              </div>

              {subtasks.length > 0 && (
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${subtaskProgress}%` }}
                  />
                </div>
              )}

              <div className="space-y-1">
                {subtasks.map(st => (
                  <div key={st.id} className="group flex items-center gap-2 py-1">
                    <Checkbox
                      id={`subtask-${st.id}`}
                      checked={st.isDone}
                      onCheckedChange={() => toggleSubtaskDone(task.id, st.id)}
                      className="peer size-4 cursor-pointer rounded border-muted-foreground/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary shrink-0"
                    />
                    <Label
                      htmlFor={`subtask-${st.id}`}
                      className="flex-1 text-sm cursor-pointer peer-data-[state=checked]:line-through peer-data-[state=checked]:text-muted-foreground text-foreground/90 transition-colors"
                    >
                      {st.title}
                    </Label>
                    <button
                      onClick={() => deleteSubtask(task.id, st.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 bg-muted/20 border border-border/40 hover:border-border/80 focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all rounded-md px-3 mt-1">
                <Plus className="size-3.5 text-muted-foreground/50 shrink-0" />
                <input
                  value={subtaskTitle}
                  onChange={e => setSubtaskTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && subtaskTitle.trim()) {
                      e.preventDefault();
                      addSubtask(task.id, subtaskTitle.trim());
                      setSubtaskTitle("");
                    }
                  }}
                  placeholder="Ost vazifa qoʻshish..."
                  className="h-8 flex-1 border-none bg-transparent px-0 text-sm focus:outline-none placeholder:text-muted-foreground/60 text-foreground"
                  autoFocus={subtasksOpen}
                />
              </div>
            </div>
            ) : (
              <button
                type="button"
                onClick={() => setSubtasksOpen(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 -mx-2 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
              >
                <ListChecks className="size-4" /> Ost vazifa qoʻshish
              </button>
            )}

            {/* ─ Description (vizual chegara bilan) ─ */}
            {(task.description || descOpen) ? (
              <div>
                <span className="text-xs font-semibold text-foreground/80 mb-2 block">Tavsif</span>
                <div className="bg-muted/20 rounded-lg border border-border/30 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                  <textarea
                    ref={descRef}
                    value={task.description}
                    onChange={e => updateTask(task.id, { description: e.target.value })}
                    placeholder="Tavsif qoʻshish..."
                    autoFocus={descOpen && !task.description}
                    className="w-full text-sm leading-relaxed bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/60 text-foreground/85 min-h-[80px] p-3"
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDescOpen(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 -mx-2 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
              >
                <AlignLeft className="size-4" /> Tavsif qoʻshish
              </button>
            )}

            {/* ─ Tags ─ */}
            <div className="flex flex-wrap items-center gap-1.5">
              {task.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="group/tag px-2 py-0.5 rounded-md text-xs font-medium gap-1">
                  {tag}
                  <button
                    onClick={() => updateTask(task.id, { tags: task.tags.filter(t => t !== tag) })}
                    className="opacity-50 hover:opacity-100 hover:text-destructive transition-opacity"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              <Popover onOpenChange={(o) => { if (!o) setTagText(""); }}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground gap-1">
                    <Plus className="size-3" /> Teg
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-2" align="start" sideOffset={6}>
                  <div className="flex items-center gap-2 rounded-md border border-border/60 px-2 focus-within:ring-1 focus-within:ring-primary/30">
                    <Tag className="size-3.5 text-muted-foreground/60 shrink-0" />
                    <input
                      autoFocus
                      value={tagText}
                      onChange={e => setTagText(e.target.value)}
                      onKeyDown={e => {
                        const v = tagText.trim();
                        if (e.key === "Enter" && v && !task.tags.includes(v)) {
                          e.preventDefault();
                          updateTask(task.id, { tags: [...task.tags, v] });
                          setTagText("");
                        }
                      }}
                      placeholder="Teg nomi..."
                      className="h-8 flex-1 border-none bg-transparent px-0 text-sm focus:outline-none placeholder:text-muted-foreground/60 text-foreground"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* ─ Attachments ─ */}
            {task.attachments.length > 0 && (
              <>
                <Separator className="bg-border/30" />
                <div>
                  <TypographyLabel className="mb-2.5 block text-muted-foreground">Fayllar</TypographyLabel>
                  <div className="space-y-1.5">
                    {task.attachments.map(file => (
                      <div key={file} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/30 border border-border/30 text-sm hover:bg-muted/50 transition-colors cursor-pointer group">
                        <div className="size-7 rounded-md bg-background flex items-center justify-center shrink-0 shadow-sm">
                          <Paperclip className="size-3.5 text-muted-foreground" />
                        </div>
                        <span className="truncate flex-1 text-sm font-medium">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ─ Comments ─ */}
            <Separator className="bg-border/30" />
            {(task.comments.length > 0 || commentsOpen) ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TypographyLabel className="text-muted-foreground">Izohlar</TypographyLabel>
                {task.comments.length > 0 && (
                  <Badge variant="secondary" className="px-1.5 h-5 text-xs rounded-full">{task.comments.length}</Badge>
                )}
              </div>

              {/* Comment list */}
              <div className="space-y-3 mb-3">
                {task.comments.map(c => (
                  <div key={c.id} className="group flex gap-2.5">
                    <Avatar size="sm" className="shrink-0 mt-0.5">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">MZ</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-xs font-semibold">Maxdum</span>
                        <span className="text-caption">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="group/bubble relative inline-block">
                        <div className="px-3 py-1.5 rounded-xl rounded-tl-sm bg-muted/40 text-sm leading-relaxed text-foreground/85">
                          {c.text}
                        </div>
                        <button
                          onClick={() => deleteComment(task.id, c.id)}
                          className="absolute -right-7 top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5 rounded"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* New comment */}
              <div className="flex items-start gap-2.5">
                <Avatar size="sm" className="shrink-0 mt-1.5">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">MZ</AvatarFallback>
                </Avatar>
                <div className="flex-1 relative">
                  <Textarea
                    placeholder="Izoh yozing..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    autoFocus={commentsOpen && task.comments.length === 0}
                    className="min-h-[40px] py-2 pr-9 resize-none rounded-lg bg-transparent border-border/40 focus-visible:ring-1 text-sm"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className="absolute right-1 bottom-1 size-7 rounded-md text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <MessageSquare className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            ) : (
              <button
                type="button"
                onClick={() => setCommentsOpen(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 -mx-2 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
              >
                <MessageSquare className="size-4" /> Izoh qoʻshish
              </button>
            )}

          </div>
        </ScrollArea>
      </div>

      {/* ── Footer Toolbar ── */}
      <div className="shrink-0 h-12 bg-card border-t border-border/50 flex items-center justify-between px-3 z-20">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Button variant="ghost" size="sm" className="rounded-lg h-9 px-2.5 hover:text-foreground" onClick={() => setIsPomodoroOpen(true)}>
            <Clock className="size-4 mr-1.5" />
            <span className="text-xs">Taymer</span>
          </Button>
          <label className="cursor-pointer">
            <input type="file" className="hidden" onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                updateTask(task.id, { attachments: [...task.attachments, file.name] });
                toast.success(`"${file.name}" biriktirildi`);
              }
            }} />
            <div className="rounded-lg size-9 hover:text-foreground flex items-center justify-center hover:bg-muted/50 transition-colors">
              <Paperclip className="size-4" />
            </div>
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg size-9 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px]">
              <DropdownMenuItem onClick={() => setConfirmDeleteOpen(true)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                <Trash2 className="size-3.5 mr-2" /> Vazifani oʻchirish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Vazifani oʻchirishni tasdiqlaysizmi?</AlertDialogTitle>
                <AlertDialogDescription>
                  Vazifa va uning barcha kichik vazifalari, izohlari va taymer yozuvlari butunlay oʻchiriladi. Bu amalni qaytarib boʻlmaydi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => { deleteTask(task.id); toast.success("Vazifa oʻchirildi"); }}
                >
                  Oʻchirish
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

    </div>
  );
}
