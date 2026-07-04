"use client";

import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import { Check, ChevronDown, ChevronRight, LayoutGrid, Plus, ListTodo, Repeat, CalendarClock, Trash2, CheckCheck, X, SlidersHorizontal, ArrowUpDown, Flag, Inbox, Calendar, CalendarDays, AlertCircle, CheckCircle2, Layers, ListPlus, Pin, Ban, Link2, Timer, Files, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"; // Unused dropdown imports removed
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SectionIcon } from "@/components/ui/section-icon";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { CardTitle } from "@/components/ui/card";
import { TaskComposer, type TaskComposerHandle, type ComposerSeed } from "./TaskComposer";
import { useTaskStore } from "@/store/useTaskStore";
import { type TaskFilter } from "./TasksSidebar";
import { TASK_STATUS, STATUS_META, nextRecurrenceDate, type TaskStatus, type TaskPriority } from "@/lib/tasks-data";
import { recurrenceLabel } from "@/lib/recurrence";
import { ContextMenu, type ContextMenuItem } from "@/components/shadcn-space/context-menu/context-menu-01";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { useFilteredTasks, type GroupByMode, type SortByMode } from "@/hooks/useFilteredTasks";
import { format, parseISO } from "date-fns";
import { uz } from "date-fns/locale";

const STATUS_GROUPS = STATUS_META.map((s) => ({ id: s.id, label: s.groupLabel, color: s.dot }));

const DATE_GROUPS = ["bugun", "ertaga", "kelasi hafta", "muddatsiz", "oʻtgan"];

type Props = {
  activeFilter: TaskFilter;
};

export default function TasksList({ activeFilter }: Props) {
  const liveClasses = useLiveClasses();
  const tasks = useTaskStore((s) => s.tasks);
  const selectedTaskId = useTaskStore((s) => s.selectedTaskId);
  const setSelectedTaskId = useTaskStore((s) => s.setSelectedTaskId);
  const toggleTaskDone = useTaskStore((s) => s.toggleTaskDone);
  const reorderTasks = useTaskStore((s) => s.reorderTasks);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);

  const [groupBy, setGroupBy] = useState<GroupByMode>("status");
  const [sortBy, setSortBy] = useState<SortByMode>("default");
  const [showCompleted, setShowCompleted] = useState(false);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [filterSubMenu, setFilterSubMenu] = useState<"group" | "sort" | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Selection & UI State
  const [isSelectModeActive, setIsSelectModeActive] = useState(false);
  // const [toolbarVariant, setToolbarVariant] = useState<number>(5); // removed unused variant state
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const captureBarRef = useRef<TaskComposerHandle>(null);

  // Drag-tartiblash (faqat "Standart" saralashda, guruh ichida)
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const manualSort = sortBy === "default";

  const { tasksList, groupedTasks, totalTasks, completedTasks } = useFilteredTasks(tasks, activeFilter, groupBy, sortBy, showCompleted);

  // Tabriklash: joriy roʻyxatdagi oxirgi vazifa bajarilib boʻsh qolганда bir marta
  // confetti otiladi. Faqat boʻsh-EMASdan → boʻshga oʻtishda (filtr almashishida
  // emas) va sessiyada bir martagina (celebratedRef).
  const celebratedRef = useRef(false);
  const prevEmptyRef = useRef<boolean | null>(null);
  const prevFilterRef = useRef(activeFilter);
  useEffect(() => {
    const isEmpty = tasksList.length === 0;
    const filterChanged = prevFilterRef.current !== activeFilter;
    if (!filterChanged && prevEmptyRef.current === false && isEmpty && !celebratedRef.current) {
      celebratedRef.current = true;
      confetti({ particleCount: 90, spread: 75, startVelocity: 45, origin: { y: 0.7 }, zIndex: 100 });
    }
    prevEmptyRef.current = isEmpty;
    prevFilterRef.current = activeFilter;
  }, [tasksList.length, activeFilter]);

  const todayStr = new Date().toISOString().split("T")[0];

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Guruh ichida draggedId ni targetId joyiga koʻchirib, yangi tartibni saqlaydi.
  const handleDropOnTask = (targetId: string, groupId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const ids = (groupedTasks[groupId] || []).map(t => t.id);
    const from = ids.indexOf(draggedId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    reorderTasks(ids);
    setDraggedId(null);
    setDragOverId(null);
  };

  // Klaviatura-shortcutlar (input/textarea ichida yozayотganда e'tiborsiz):
  //   q / a → vazifa qoʻshish qutisini ochish · Esc → tanlovni bekor qilish
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "Escape" && (selectedIds.size > 0 || isSelectModeActive)) {
        clearSelection();
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "q" || e.key === "a") {
        e.preventDefault();
        captureBarRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, isSelectModeActive]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setIsSelectModeActive(false);
  };

  const selectAll = () => {
    setSelectedIds(new Set(tasksList.map(t => t.id)));
  };

  const bulkMarkDone = () => {
    selectedIds.forEach(id => {
      const task = tasks.find(t => t.id === id);
      if (task && task.status !== TASK_STATUS.DONE) toggleTaskDone(id);
    });
    clearSelection();
    toast.success("Bajarildi");
  };

  // Oʻchirishni tasdiqlash — bitta yoki tanlangan (bulk) vazifalar uchun bitta AlertDialog.
  const [pendingDelete, setPendingDelete] = useState<{ ids: string[]; bulk: boolean } | null>(null);

  const performDelete = () => {
    if (!pendingDelete) return;
    const { ids, bulk } = pendingDelete;
    ids.forEach(id => deleteTask(id));
    if (bulk) clearSelection();
    setPendingDelete(null);
    toast.success(ids.length > 1 ? `${ids.length} ta vazifa oʻchirildi` : "Vazifa oʻchirildi");
  };

  const bulkSnooze = () => {
    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + 1);
    const snoozeDateStr = snoozeDate.toISOString().split("T")[0];
    selectedIds.forEach(id => updateTask(id, { dueDate: snoozeDateStr }));
    clearSelection();
    toast.info("Ertaga uzaytirildi");
  };

  // Faol filtr (smart-list) konteksti → composer pillalari uchun default urug'.
  const composerSeed: ComposerSeed = (() => {
    const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    let dueDate: string | null = null;
    let priority: TaskPriority = "none";
    let classIds: string[] = [];
    if (activeFilter === "today") dueDate = todayStr;
    else if (activeFilter === "upcoming") dueDate = tomorrowStr;
    if (activeFilter === "important") priority = "high";
    if (activeFilter.startsWith("class-")) {
      const cid = activeFilter.replace("class-", "");
      if (cid !== "none") classIds = [cid];
    }
    return { dueDate, priority, classIds };
  })();

  const getFilterTitle = () => {
    if (activeFilter === "inbox") return "Kirim (Inbox)";
    if (activeFilter === "today") return "Bugun";
    if (activeFilter === "upcoming") return "Yaqin kunlarda";
    if (activeFilter === "overdue") return "Muddati oʻtgan";
    if (activeFilter === "important") return "Muhim vazifalar";
    if (activeFilter === "completed") return "Bajarilganlar";
    if (activeFilter === "all") return "Mening vazifalarim";
    if (activeFilter.startsWith("class-")) {
      const cid = activeFilter.replace("class-", "");
      if (cid === "none") return "Umumiy";
      return liveClasses.find(c => c.id === cid)?.name || "Vazifalar";
    }
    return "Mening vazifalarim";
  };

  const getFilterIcon = () => {
    if (activeFilter === "inbox") return Inbox;
    if (activeFilter === "today") return Calendar;
    if (activeFilter === "upcoming") return CalendarDays;
    if (activeFilter === "overdue") return AlertCircle;
    if (activeFilter === "important") return Flag;
    if (activeFilter === "completed") return CheckCircle2;
    if (activeFilter === "all") return Layers;
    return ListTodo;
  };

  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const groupKeys = (() => {
    if (groupBy === "status") return STATUS_GROUPS.map(g => g.id);
    if (groupBy === "date") return DATE_GROUPS;
    if (groupBy === "priority") return ["high", "medium", "low", "none"];
    if (groupBy === "class") return [...liveClasses.map(c => c.id), "none"];
    return ["all"];
  })();

  const PRIORITY_GROUPS: Record<string, { label: string; color: string }> = {
    high: { label: "Yuqori", color: "bg-destructive" },
    medium: { label: "Oʻrta", color: "bg-warning" },
    low: { label: "Past", color: "bg-info" },
    none: { label: "Belgilanmagan", color: "bg-muted-foreground/40" },
  };

  const GROUP_BY_LABELS: Record<GroupByMode, string> = {
    status: "Holat",
    date: "Sana",
    priority: "Ustuvorlik",
    class: "Sinf",
    none: "Hech narsa",
  };

  const SORT_BY_LABELS: Record<SortByMode, string> = {
    default: "Standart",
    date: "Sana",
    title: "Sarlavha",
    priority: "Ustuvorlik",
    created: "Yaratilgan",
  };
  const hasSelection = selectedIds.size > 0;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-w-0 min-h-0 h-full bg-card rounded-xl card-elevation flex flex-col overflow-hidden relative">
        <div className="px-5 py-5 flex items-center justify-between shrink-0 gap-3 border-b border-border min-h-[4.5rem] bg-card z-10 relative">
          <div className="flex items-center gap-3 min-w-0">
            <SectionIcon>
              {(() => { const Icon = getFilterIcon(); return <Icon />; })()}
            </SectionIcon>
            <CardTitle className="truncate">
              {getFilterTitle()}
            </CardTitle>
            {tasksList.filter(t => t.status !== TASK_STATUS.DONE).length > 0 && (
              <Badge variant="secondary" className="font-mono text-xs">
                {tasksList.filter(t => t.status !== TASK_STATUS.DONE).length}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isSelectModeActive || hasSelection ? "secondary" : "ghost"}
                  size="icon" 
                  className={cn("size-9", (isSelectModeActive || hasSelection) && "bg-primary/10 text-primary")} 
                  onClick={() => {
                    if (hasSelection) {
                      clearSelection();
                    } else if (isSelectModeActive) {
                      setIsSelectModeActive(false);
                    } else {
                      setIsSelectModeActive(true);
                    }
                  }}
                >
                  <CheckCheck className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{hasSelection ? "Tanlovni bekor qilish" : "Tanlash rejimi"}</TooltipContent>
            </Tooltip>

            <Popover open={filterPopoverOpen} onOpenChange={(open) => { setFilterPopoverOpen(open); if (!open) setFilterSubMenu(null); }}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-9">
                      <SlidersHorizontal className="size-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Filtrlash va Saralash</TooltipContent>
              </Tooltip>
              <PopoverContent align="end" className="w-60 p-0" sideOffset={8}>
                {filterSubMenu === null && (
                  <div className="py-1.5">
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors text-left" onClick={() => setFilterSubMenu("group")}>
                      <LayoutGrid className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium flex-1">Guruhlash</span>
                      <span className="text-sm text-muted-foreground">{GROUP_BY_LABELS[groupBy]}</span>
                      <ChevronRight className="size-3.5 text-muted-foreground/60" />
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors text-left" onClick={() => setFilterSubMenu("sort")}>
                      <ArrowUpDown className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium flex-1">Saralash</span>
                      <span className="text-sm text-muted-foreground">{SORT_BY_LABELS[sortBy]}</span>
                      <ChevronRight className="size-3.5 text-muted-foreground/60" />
                    </button>
                    {activeFilter !== "completed" && (
                      <>
                        <Separator className="my-1" />
                        <button
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors text-left"
                          onClick={() => setShowCompleted((v) => !v)}
                        >
                          <CheckCircle2 className="size-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium flex-1">Bajarilganlarni koʻrsatish</span>
                          {showCompleted && <Check className="size-4 text-primary" />}
                        </button>
                      </>
                    )}
                  </div>
                )}
                {filterSubMenu === "group" && (
                  <div className="py-1.5">
                    <button className="w-full flex items-center gap-2 px-4 py-1.5 hover:bg-accent transition-colors text-left text-sm text-muted-foreground" onClick={() => setFilterSubMenu(null)}>
                      <ChevronRight className="size-3.5 rotate-180" />
                      <span className="font-medium">Guruhlash</span>
                    </button>
                    <Separator className="my-1" />
                    {(["status", "date", "priority", "class", "none"] as GroupByMode[]).map(mode => (
                      <button key={mode} className={cn("w-full flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors text-left text-sm", groupBy === mode && "text-primary font-medium")} onClick={() => { setGroupBy(mode); setCollapsedGroups({}); setFilterSubMenu(null); setFilterPopoverOpen(false); }}>
                        <span className="flex-1">{GROUP_BY_LABELS[mode]}</span>
                        {groupBy === mode && <Check className="size-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
                {filterSubMenu === "sort" && (
                  <div className="py-1.5">
                    <button className="w-full flex items-center gap-2 px-4 py-1.5 hover:bg-accent transition-colors text-left text-sm text-muted-foreground" onClick={() => setFilterSubMenu(null)}>
                      <ChevronRight className="size-3.5 rotate-180" />
                      <span className="font-medium">Saralash</span>
                    </button>
                    <Separator className="my-1" />
                    {(["default", "date", "title", "priority", "created"] as SortByMode[]).map(mode => (
                      <button key={mode} className={cn("w-full flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors text-left text-sm", sortBy === mode && "text-primary font-medium")} onClick={() => { setSortBy(mode); setFilterSubMenu(null); setFilterPopoverOpen(false); }}>
                        <span className="flex-1">{SORT_BY_LABELS[mode]}</span>
                        {sortBy === mode && <Check className="size-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Thin progress line at the very bottom of the header */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-transparent overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Floating Action Bar – appears when select mode is active or tasks are selected */}
        {(isSelectModeActive || hasSelection) && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-card/95 backdrop-blur-md border border-border/30 rounded-xl shadow-lg px-4 py-2 flex items-center gap-3 z-50">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" onClick={selectAll}>
                  <CheckCheck className="size-4 mr-1" /> Barchasi
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Barcha topshiriqlarni belgilash</TooltipContent>
            </Tooltip>
            
            {hasSelection && (
              <>
                <div className="w-px h-4 bg-border/50 mx-1" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost" onClick={bulkMarkDone}>
                      <Check className="size-4 mr-1" /> Bajarildi
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Tanlangan topshiriqlarni bajarilgan deb belgilaydi</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost" onClick={bulkSnooze}>
                      <CalendarClock className="size-4 mr-1" /> Ertaga
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Tanlangan topshiriqlarni ertaga uzaytiradi</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="destructive" onClick={() => setPendingDelete({ ids: [...selectedIds], bulk: true })}>
                      <Trash2 className="size-4 mr-1" /> Oʻchirish
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Tanlangan topshiriqlarni o‘chiradi</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        )}

        <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {pendingDelete?.bulk ? "Tanlangan vazifalarni oʻchirasizmi?" : "Vazifani oʻchirasizmi?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDelete?.bulk
                  ? `${pendingDelete.ids.length} ta vazifa butunlay oʻchiriladi. Bu amalni qaytarib boʻlmaydi.`
                  : "Vazifa va uning barcha maʼlumotlari butunlay oʻchiriladi. Bu amalni qaytarib boʻlmaydi."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={performDelete}>
                Oʻchirish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex-1 min-h-0 relative overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto space-y-4">
              
              {/* Vazifa qoʻshish — kengayuvchi capture qutisi */}
              <div data-tour="tasks-composer" className="px-2 pb-2">
                <TaskComposer ref={captureBarRef} seed={composerSeed} />
              </div>

              {groupKeys.map(groupId => {
                const groupTasks = groupedTasks[groupId] || [];
                let groupLabel: string;
                let groupColor: string;
                if (groupBy === "status") {
                  const meta = STATUS_GROUPS.find(g => g.id === groupId);
                  groupLabel = meta?.label ?? groupId;
                  groupColor = meta?.color ?? "bg-muted-foreground";
                } else if (groupBy === "priority") {
                  const meta = PRIORITY_GROUPS[groupId];
                  groupLabel = meta?.label ?? groupId;
                  groupColor = meta?.color ?? "bg-muted-foreground";
                } else if (groupBy === "class") {
                  if (groupId === "none") {
                    groupLabel = "Umumiy";
                    groupColor = "bg-muted-foreground";
                  } else {
                    const cls = liveClasses.find(c => c.id === groupId);
                    groupLabel = cls?.name ?? groupId;
                    groupColor = "bg-primary";
                  }
                } else if (groupBy === "none") {
                  groupLabel = "Barchasi";
                  groupColor = "bg-foreground";
                } else {
                  groupLabel = groupId.charAt(0).toUpperCase() + groupId.slice(1);
                  groupColor = "bg-muted-foreground";
                }

                // Note: the "completed" filter already restricts the list to done
                // tasks, so no extra per-group guard is needed (it would wrongly
                // hide everything when grouping by priority/class/date).
                if (groupTasks.length === 0) return null;

                const isCollapsed = collapsedGroups[groupId];
                const groupDoneCount = groupTasks.filter(t => t.status === TASK_STATUS.DONE).length;

                return (
                  <div key={groupId} className="flex flex-col mb-2">
                    <div className="flex items-center justify-between px-2 py-1.5 sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/40">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn("size-2 rounded-full shrink-0", groupColor)} />
                        <span className="text-sm font-semibold tracking-tight text-foreground/90 truncate">{groupLabel}</span>
                        <span className="text-muted-foreground text-[11px] font-medium shrink-0 ml-1">
                          {groupDoneCount}/{groupTasks.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-foreground" onClick={() => toggleGroup(groupId)}>
                          {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
                        </Button>
                      </div>
                    </div>
                    {!isCollapsed && (
                      <div className="flex flex-col">
                        {groupTasks.map(task => {
                          const isDone = task.status === TASK_STATUS.DONE;
                          const isCanceled = task.status === TASK_STATUS.CANCELED;
                          const isSelected = selectedTaskId === task.id;
                          const isBulkSelected = selectedIds.has(task.id);
                          const isOverdue = task.dueDate && task.dueDate < todayStr && !isDone && !isCanceled;

                          const isSelecting = isSelectModeActive || hasSelection;

                          const handleRowClick = (e: React.MouseEvent) => {
                            if (isSelecting || e.ctrlKey || e.metaKey) {
                              toggleSelect(task.id);
                              if (!isSelectModeActive) setIsSelectModeActive(true);
                            } else {
                              setSelectedTaskId(task.id);
                            }
                          };

                          const contextMenuItems: ContextMenuItem[] = [
                            {
                              icon: ListPlus,
                              label: "Ost vazifa qoʻshish",
                              shortcut: "⌘S",
                              iconBg: "bg-blue-500/10",
                              iconColor: "text-blue-500",
                              onClick: () => setSelectedTaskId(task.id),
                            },
                            {
                              icon: Pin,
                              label: "Muhim (Pin)",
                              shortcut: "⌘P",
                              iconBg: "bg-orange-500/10",
                              iconColor: "text-orange-500",
                              onClick: () => updateTask(task.id, { priority: task.priority === "high" ? "none" : "high" }),
                            },
                            {
                              icon: Ban,
                              label: "Bajarilmaydi",
                              shortcut: "⌘W",
                              iconBg: "bg-red-500/10",
                              iconColor: "text-red-500",
                              onClick: () => updateTask(task.id, { status: TASK_STATUS.CANCELED }),
                            },
                            {
                              icon: Timer,
                              label: "Fokus rejimi",
                              shortcut: "⌘F",
                              iconBg: "bg-primary/10",
                              iconColor: "text-primary",
                              onClick: () => { setSelectedTaskId(task.id); toast.info("Fokus rejimi: Tafsilot panelidagi Pomodoro ni oching"); },
                            },
                            {
                              icon: Files,
                              label: "Nusxalash",
                              shortcut: "⌘D",
                              iconBg: "bg-violet-500/10",
                              iconColor: "text-violet-500",
                              onClick: () => {
                                const t = tasks.find(t => t.id === task.id);
                                if (t) { addTask({ title: t.title + " (nusxa)", dueDate: t.dueDate, classIds: t.classIds, status: TASK_STATUS.TODO, priority: t.priority }); toast.success("Vazifa nusxalandi"); }
                              },
                            },
                            {
                              icon: Link2,
                              label: "Havolani nusxalash",
                              shortcut: "⌘L",
                              iconBg: "bg-teal-500/10",
                              iconColor: "text-teal-500",
                              onClick: () => { navigator.clipboard.writeText(`task://${task.id}`); toast.success("Havola nusxalandi"); },
                            },
                            {
                              icon: Trash2,
                              label: "Oʻchirish",
                              shortcut: "⌫",
                              iconBg: "bg-red-500/10",
                              iconColor: "text-red-500",
                              danger: true,
                              onClick: () => setPendingDelete({ ids: [task.id], bulk: false }),
                            },
                          ];

                          return (
                            <ContextMenu key={task.id} items={contextMenuItems}>
                              <div
                                role="button"
                                tabIndex={0}
                                aria-pressed={isBulkSelected || isSelected}
                                draggable={manualSort && !isSelecting}
                                onClick={handleRowClick}
                                onDragStart={() => setDraggedId(task.id)}
                                onDragOver={(e) => {
                                  if (!draggedId || draggedId === task.id) return;
                                  e.preventDefault();
                                  setDragOverId(task.id);
                                }}
                                onDragLeave={() => setDragOverId((cur) => (cur === task.id ? null : cur))}
                                onDrop={(e) => { e.preventDefault(); handleDropOnTask(task.id, groupId); }}
                                onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    if (isSelecting) toggleSelect(task.id);
                                    else setSelectedTaskId(task.id);
                                  }
                                }}
                                className={cn(
                                  "group/item flex items-center gap-2 px-2 py-1.5 transition-colors min-w-0 border-b border-transparent hover:border-border/40 hover:bg-muted/40 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md",
                                  isSelecting ? "cursor-default" : "cursor-pointer",
                                  isBulkSelected ? "bg-primary/5" : isSelected ? "bg-muted/60" : "",
                                  draggedId === task.id && "opacity-40",
                                  dragOverId === task.id && "border-t-2 border-t-primary"
                                )}
                              >
                                {/* Drag handle — faqat "Standart" saralashda, hover'da koʻrinadi */}
                                {manualSort && !isSelecting && (
                                  <span
                                    className="flex items-center justify-center -ml-1 text-muted-foreground/40 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <GripVertical className="size-4" />
                                  </span>
                                )}
                                {/* ── Chap qismdagi Checkbox yoki Doira ── */}
                                <div
                                  className="flex items-center justify-center p-2 -ml-2 shrink-0 relative mr-1 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSelecting) {
                                      toggleSelect(task.id);
                                    } else {
                                      const recurring = !isDone && task.isRecurring && task.recurrenceRule;
                                      const next = recurring ? nextRecurrenceDate(task.dueDate, task.recurrenceRule) : null;
                                      toggleTaskDone(task.id);
                                      if (next) {
                                        toast.success(`Bajarildi — keyingi muddat: ${format(parseISO(next), "d-MMM", { locale: uz })}`);
                                      }
                                    }
                                  }}
                                >
                                  {isSelecting ? (
                                    <Checkbox
                                      checked={isBulkSelected}
                                      className="size-[18px] pointer-events-none"
                                    />
                                  ) : (
                                    <div
                                      className={cn(
                                        "size-[18px] rounded-full flex items-center justify-center transition-colors border-2",
                                        isDone ? "bg-success border-success text-success-foreground" :
                                        isCanceled ? "bg-destructive/10 border-destructive/50 text-destructive" :
                                        "border-foreground/30 group-hover/item:border-primary/60 bg-transparent"
                                      )}
                                    >
                                      {isDone && <Check className="size-3" strokeWidth={3} />}
                                      {isCanceled && <X className="size-3" strokeWidth={3} />}
                                    </div>
                                  )}
                                </div>

                                {/* Title & Metadata Container */}
                                <div className="flex flex-1 items-center gap-3 min-w-0 overflow-hidden">
                                  <span className={cn(
                                    "text-[14px] font-medium truncate transition-colors",
                                    isDone ? "text-muted-foreground line-through" : "text-foreground/90"
                                  )}>
                                    {task.title}
                                  </span>

                                  {/* Indicators */}
                                  <div className="flex items-center gap-2 shrink-0 opacity-70 group-hover/item:opacity-100 transition-opacity">
                                    {task.isRecurring && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Repeat className="size-3 text-muted-foreground/50 shrink-0" />
                                        </TooltipTrigger>
                                        <TooltipContent>{recurrenceLabel(task.recurrenceRule, task.dueDate) ?? "Takrorlanuvchi"}</TooltipContent>
                                      </Tooltip>
                                    )}
                                    {(task.classIds?.length ?? 0) > 1 && (
                                      <Badge variant="secondary" className="h-[18px] px-1.5 text-[9px] uppercase tracking-wider font-semibold shrink-0">
                                        {(task.classIds?.length ?? 0)} sinf
                                      </Badge>
                                    )}
                                    {isOverdue && (
                                      <Badge variant="outline" className="h-[18px] px-1.5 text-[9px] uppercase tracking-wider font-semibold border-destructive/30 text-destructive bg-destructive/5 shrink-0">
                                        Oʻtgan
                                      </Badge>
                                    )}
                                    {task.dueDate && !isOverdue && (
                                      <span className="text-[11px] font-medium text-muted-foreground/80 tabular-nums shrink-0">
                                        {format(parseISO(task.dueDate), "d-MMM", { locale: uz })}
                                      </span>
                                    )}
                                    {task.priority !== "none" && (
                                      <Flag className={cn(
                                        "size-3.5 shrink-0",
                                        task.priority === "high" ? "fill-destructive text-destructive" :
                                        task.priority === "medium" ? "fill-warning text-warning" :
                                        "fill-info text-info"
                                      )} />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </ContextMenu>
                          );
                        })}

                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty state */}
              {tasksList.length === 0 && (
                <Empty className="py-16 animate-in fade-in zoom-in duration-500">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CheckCheck className="size-6" />
                    </EmptyMedia>
                    <EmptyTitle>Barcha ishlar qilingan!</EmptyTitle>
                    <EmptyDescription>
                      Ajoyib natija! Yangi vazifa qoʻshish uchun yuqoridagi maydondan foydalaning yoki biroz dam oling.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </TooltipProvider>
  );
}
