"use client";

import { useMemo } from "react";
import { ListTodo, Inbox, Calendar, CalendarDays, AlertCircle, CheckCircle2, Layers, Flag } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { TypographyLabel } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { CLASSES, classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { ClassSwatch } from "@/components/ClassSwatch";
import { useTaskStore } from "@/store/useTaskStore";
import { TASK_STATUS } from "@/lib/tasks-data";

export type TaskFilter = 
  | "inbox" 
  | "today" 
  | "upcoming" 
  | "overdue" 
  | "important"
  | "completed" 
  | "all" 
  | `class-${string}`;

type Props = {
  activeFilter: TaskFilter;
  onSelectFilter: (filter: TaskFilter) => void;
};

type TaskTemplate = {
  id: string;
  label: string;
  dotColor: string;
  data: Parameters<ReturnType<typeof useTaskStore.getState>["addTask"]>[0];
};

const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: "parents-meeting",
    label: "Ota-onalar majlisi",
    dotColor: "bg-blue-500",
    data: {
      title: "Ota-onalar majlisi",
      description: "Kun tartibi:\n1. Choraklik natijalar\n2. Davomat\n3. Joriy masalalar",
      priority: "medium",
      tags: ["majlis", "ota-onalar"],
      estimatedPomodoros: 1,
    },
  },
  {
    id: "quarterly-report",
    label: "Choraklik hisobot",
    dotColor: "bg-purple-500",
    data: {
      title: "Choraklik hisobot",
      description: "Baholar, davomat va oʻzlashtirish boʻyicha hisobotni tayyorlash.",
      priority: "high",
      tags: ["hisobot"],
      estimatedPomodoros: 4,
    },
  },
];

export default function TasksSidebar({ activeFilter, onSelectFilter }: Props) {
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const setSelectedTaskId = useTaskStore((s) => s.setSelectedTaskId);

  const handleUseTemplate = (tpl: TaskTemplate) => {
    const id = addTask(tpl.data);
    setSelectedTaskId(id);
    toast.success(`"${tpl.label}" shablonidan vazifa yaratildi`);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // NOTE: these predicates must mirror useFilteredTasks exactly, otherwise the
  // sidebar badge counts won't match the number of rows shown in the list.
  const counts = useMemo(() => {
    let inbox = 0, today = 0, upcoming = 0, overdue = 0, important = 0, completed = 0;
    const classCounts: Record<string, number> = {};

    tasks.forEach((t) => {
      const isDone = t.status === TASK_STATUS.DONE;

      if (isDone) completed++;
      if (t.priority === "high") important++;
      if ((t.classIds?.length ?? 0) === 0 && !t.dueDate) inbox++;
      if (t.dueDate === todayStr || t.status === "in-progress") today++;
      if (t.dueDate && t.dueDate > todayStr && t.dueDate <= nextWeekStr) upcoming++;
      if (t.dueDate && t.dueDate < todayStr && !isDone) overdue++;

      if (t.classIds && t.classIds.length > 0) {
        t.classIds.forEach(id => {
          classCounts[id] = (classCounts[id] || 0) + 1;
        });
      } else {
        classCounts["none"] = (classCounts["none"] || 0) + 1;
      }
    });

    return { inbox, today, upcoming, overdue, important, completed, all: tasks.length, classCounts };
  }, [tasks, todayStr, nextWeekStr]);

  /** Sinf rangidan shaffof tint (EMStudio rgba(...) effekti) */
  const tint = (h: string, pct: number) => `color-mix(in srgb, ${h} ${pct}%, transparent)`;

  const smartLists = [
    { id: "inbox", label: "Kiruvchi", icon: Inbox, count: counts.inbox },
    { id: "today", label: "Bugun", icon: Calendar, count: counts.today },
    { id: "upcoming", label: "Yaqin kunlarda", icon: CalendarDays, count: counts.upcoming },
    { id: "important", label: "Muhim", icon: Flag, count: counts.important },
    { id: "overdue", label: "Muddati oʻtgan", icon: AlertCircle, count: counts.overdue },
    { id: "completed", label: "Bajarilganlar", icon: CheckCircle2, count: counts.completed },
    { id: "all", label: "Barchasi", icon: Layers, count: counts.all },
  ] as const;

  const renderSmartListItem = (item: typeof smartLists[0]) => {
    const isSelected = activeFilter === item.id;
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        onClick={() => onSelectFilter(item.id as TaskFilter)}
        className={cn(
          "w-full flex items-center text-left gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
          isSelected
            ? "bg-primary/10 text-primary font-semibold"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className={cn("size-5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
        <span className={cn("text-sm flex-1 truncate", isSelected ? "font-semibold text-primary" : "font-medium")}>
          {item.label}
        </span>
        {item.count > 0 && (
          <span className={cn(
            "text-[10px] tabular-nums shrink-0 font-bold px-1.5 py-0.5 rounded-md", 
            item.id === "overdue" ? "bg-destructive/10 text-destructive" : (isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")
          )}>
            {item.count}
          </span>
        )}
      </button>
    );
  };

  const renderClassItem = (id: string, name: string, hexColor: string, count: number) => {
    const filterId = `class-${id}` as TaskFilter;
    const isSelected = activeFilter === filterId;

    if (isSelected) {
      return (
        <button
          key={id}
          onClick={() => onSelectFilter(filterId)}
          className="w-full flex items-center text-left gap-3 px-3 py-2 border rounded-lg cursor-pointer animate-spring-bounce mt-0.5"
          style={{ borderColor: hexColor, backgroundColor: tint(hexColor, 8) }}
        >
          <ClassSwatch hex={hexColor} />
          <span className="text-sm font-semibold text-foreground flex-1 truncate">{name}</span>
          {count > 0 && (
            <Badge variant="secondary" className="px-1.5 h-5 text-[10px] bg-background/50 border-transparent" style={{ color: hexColor }}>
              {count}
            </Badge>
          )}
        </button>
      );
    }

    return (
      <button
        key={id}
        onClick={() => onSelectFilter(filterId)}
        className="group w-full flex items-center text-left gap-3 px-3 py-1.5 border-2 border-transparent rounded-lg cursor-pointer transition-transform duration-200 ease-out hover:translate-x-1"
      >
        <ClassSwatch hex={hexColor} className="opacity-80" />
        <span className="text-sm text-foreground/70 truncate flex-1 transition-all duration-200 ease-out group-hover:text-foreground group-hover:font-medium">
          {name}
        </span>
        {count > 0 && (
          <span className="text-xs text-muted-foreground/60 tabular-nums shrink-0">{count}</span>
        )}
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-card rounded-xl card-elevation flex flex-col overflow-hidden min-w-0 min-h-0 h-full">
        {/* Header */}
        <div className="px-5 py-5 flex items-center shrink-0 gap-3 border-b border-border min-h-[4.5rem]">
          <SectionIcon><ListTodo /></SectionIcon>
          <CardTitle className="truncate">Vazifalar</CardTitle>
        </div>

        {/* List */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
          <ScrollArea className="h-full w-full">
            <div className="px-3 pt-4 pb-10 space-y-6">
            
            {/* Smart Lists */}
            <div>
              <TypographyLabel className="px-3 mb-2 block text-muted-foreground">Aqlli roʻyxatlar</TypographyLabel>
              <div className="space-y-0.5">
                {smartLists.map(renderSmartListItem)}
              </div>
            </div>

            {/* Classes */}
            <div className="mt-6">
              <TypographyLabel className="px-3 mb-2 block text-muted-foreground">Sinflar</TypographyLabel>
              <div className="space-y-0.5">
                {CLASSES.map((cls) => {
                  const colorHex = CLASS_COLOR_HEX[classColor(cls)];
                  const count = counts.classCounts[cls.id] || 0;
                  if (cls.id === "no-class") return null;
                  return renderClassItem(cls.id, cls.name, colorHex, count);
                })}
                {renderClassItem("none", "Umumiy", "var(--muted-foreground)", counts.classCounts["none"] || 0)}
              </div>
            </div>

            {/* Templates */}
            <div className="mt-6">
              <TypographyLabel className="px-3 mb-2 block text-muted-foreground">Shablonlar</TypographyLabel>
              <div className="space-y-0.5">
                {TASK_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleUseTemplate(tpl)}
                    title={`"${tpl.label}" shablonidan yangi vazifa yaratish`}
                    className="group w-full flex items-center text-left gap-3 px-3 py-1.5 border-2 border-transparent rounded-lg cursor-pointer transition-transform duration-200 ease-out hover:translate-x-1"
                  >
                    <div className={cn("size-2.5 rounded-full shrink-0 opacity-80", tpl.dotColor)} />
                    <span className="text-sm text-foreground/70 truncate flex-1 transition-all duration-200 ease-out group-hover:text-foreground group-hover:font-medium">{tpl.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </ScrollArea>
        </div>
      </div>
    </div>
  );
}
